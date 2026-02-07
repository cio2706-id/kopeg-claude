const ACCURATE_AUTH_URL = "https://account.accurate.id";
const ACCURATE_ACCESS_TOKEN = process.env.ACCURATE_ACCESS_TOKEN || "";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ─── Session cache ───────────────────────────────────────────────────────────

let cachedSession: { host: string; session: string; expiresAt: number } | null =
  null;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get an Accurate session by calling /api/db-list.do
 * Returns { host, session } for subsequent API calls.
 * Cached for 10 minutes to avoid repeated calls.
 */
async function getAccurateSession(): Promise<{
  host: string;
  session: string;
}> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return { host: cachedSession.host, session: cachedSession.session };
  }

  const res = await fetch(`${ACCURATE_AUTH_URL}/api/db-list.do`, {
    headers: { Authorization: `Bearer ${ACCURATE_ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(
      `Accurate db-list failed: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();

  if (!data.s || !data.d || data.d.length === 0) {
    throw new Error(`Accurate db-list returned no databases: ${JSON.stringify(data)}`);
  }

  // Use the first database (or the one matching our app)
  const db = data.d[0];
  cachedSession = {
    host: db.host,
    session: db.session,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min cache
  };

  return { host: db.host, session: db.session };
}

// ─── Generic API call ────────────────────────────────────────────────────────

interface AccurateResponse<T = unknown> {
  s: boolean;
  d: T;
  sp?: string;
}

async function accurateRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
  retryCount = 0
): Promise<AccurateResponse<T>> {
  const { host, session } = await getAccurateSession();
  const searchParams = new URLSearchParams(params);
  const url = `${host}/accurate/api/${endpoint}?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ACCURATE_ACCESS_TOKEN}`,
        "X-Session-ID": session,
      },
    });

    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.warn(
        `Accurate API rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      await sleep(delay);
      return accurateRequest<T>(endpoint, params, retryCount + 1);
    }

    if (!response.ok) {
      throw new Error(
        `Accurate API error: ${response.status} ${response.statusText}`
      );
    }

    const data: AccurateResponse<T> = await response.json();

    if (!data.s) {
      throw new Error(`Accurate API returned error: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    if (retryCount < MAX_RETRIES && error instanceof TypeError) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.warn(
        `Accurate API network error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      await sleep(delay);
      return accurateRequest<T>(endpoint, params, retryCount + 1);
    }
    console.error(`Accurate API call failed [${endpoint}]:`, error);
    throw error;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AccurateEmployee {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  employeeNo: string;
  joinDate: string;
  salary: number;
  bankAccount: string;
  bankName: string;
}

export interface AccurateVoucher {
  id: number;
  number: string;
  transDate: string;
  description: string;
  detailList: {
    accountNo: string;
    accountName: string;
    debit: number;
    credit: number;
    description: string;
  }[];
}

export interface AccurateGLAccount {
  id: number;
  no: string;
  name: string;
  balance: number;
  category: string;
}

export interface AccurateJournalEntry {
  transDate: string;
  number?: string;
  description: string;
  detailList: {
    accountNo: string;
    debit: number;
    credit: number;
    description: string;
  }[];
}

// ─── Employee ────────────────────────────────────────────────────────────────

export async function getEmployeeByEmail(
  email: string
): Promise<AccurateEmployee | null> {
  try {
    const result = await accurateRequest<AccurateEmployee[]>(
      "employee/list.do",
      { "filter.keywords.val": email, fields: "id,name,email,department,position,employeeNo,joinDate,salary,bankAccount,bankName" }
    );
    const employees = result.d || [];
    return employees.find((e) => e.email?.toLowerCase() === email.toLowerCase()) || employees[0] || null;
  } catch (error) {
    console.error("Failed to get employee by email:", error);
    return null;
  }
}

// ─── COA Map ─────────────────────────────────────────────────────────────────

export const LOAN_COA_MAP: Record<string, string> = {
  reguler: "110304",
  khusus: "110305",
  barang: "110306",
  travel: "110307",
};

// ─── GL Account Balances ─────────────────────────────────────────────────────

/**
 * Get loan balances from Accurate for Piutang-Pinjaman accounts (COA 110304-307).
 * Uses gl-account/list.do to search by account number.
 * Returns the balance of each account from the GL.
 */
export async function getLoanBalancesByCoa(
  _employeeName?: string
): Promise<Record<string, number>> {
  const balances: Record<string, number> = {
    reguler: 0,
    khusus: 0,
    barang: 0,
    travel: 0,
  };

  try {
    // Search for all Piutang-Pinjaman accounts (110304-110307)
    // Using gl-account/list.do with keyword filter
    for (const [loanType, coa] of Object.entries(LOAN_COA_MAP)) {
      try {
        // Try list.do first - search by account number
        const result = await accurateRequest<AccurateGLAccount[]>(
          "gl-account/list.do",
          {
            "filter.keywords.val": coa,
            fields: "id,no,name,balance,endingBalance",
            sp: "20",
          }
        );

        const accounts = Array.isArray(result.d) ? result.d : [];
        // Find exact match by account number
        const account = accounts.find(
          (a) => a.no === coa || String(a.no) === coa
        );

        if (account) {
          // Try endingBalance first (current balance), fallback to balance
          const bal =
            (account as unknown as Record<string, unknown>).endingBalance ??
            account.balance ??
            0;
          balances[loanType] = typeof bal === "number" ? bal : Number(bal) || 0;
          console.log(
            `[Accurate] COA ${coa} (${loanType}): balance = ${balances[loanType]}, name = ${account.name}`
          );
        } else if (accounts.length > 0) {
          // Didn't find exact match, log what we got
          console.log(
            `[Accurate] COA ${coa}: no exact match, found ${accounts.length} accounts:`,
            accounts.map((a) => `${a.no} - ${a.name}`)
          );
        } else {
          console.log(`[Accurate] COA ${coa}: no accounts found`);
        }
      } catch (error) {
        console.error(`[Accurate] Failed to get balance for COA ${coa}:`, error);
      }
    }
  } catch (error) {
    console.error("[Accurate] Failed to get loan balances:", error);
  }

  return balances;
}

/**
 * Debug function: test Accurate API connectivity and return raw results.
 */
export async function debugAccurateConnection(): Promise<Record<string, unknown>> {
  const debug: Record<string, unknown> = {
    hasToken: !!ACCURATE_ACCESS_TOKEN,
    tokenPrefix: ACCURATE_ACCESS_TOKEN.substring(0, 10) + "...",
  };

  try {
    // Step 1: Test db-list
    const session = await getAccurateSession();
    debug.session = { host: session.host, hasSession: !!session.session };

    // Step 2: Test gl-account/list.do with COA 110304
    try {
      const result = await accurateRequest<unknown>(
        "gl-account/list.do",
        { "filter.keywords.val": "110304", fields: "id,no,name,balance,endingBalance", sp: "5" }
      );
      debug.glAccountTest = { success: result.s, data: result.d };
    } catch (error) {
      debug.glAccountTest = { error: error instanceof Error ? error.message : String(error) };
    }

    // Step 3: Test employee/list.do
    try {
      const result = await accurateRequest<unknown>(
        "employee/list.do",
        { fields: "id,name,email", sp: "3" }
      );
      debug.employeeTest = { success: result.s, sampleCount: Array.isArray(result.d) ? result.d.length : 0 };
    } catch (error) {
      debug.employeeTest = { error: error instanceof Error ? error.message : String(error) };
    }
  } catch (error) {
    debug.connectionError = error instanceof Error ? error.message : String(error);
  }

  return debug;
}

/**
 * Get vouchers (journal entries) for specific COA accounts.
 * Can optionally filter by employee name.
 */
export async function getVouchersByAccount(
  coaCodes: string[],
  employeeName?: string
): Promise<AccurateVoucher[]> {
  try {
    const params: Record<string, string> = {
      fields: "id,number,transDate,description,detailList",
    };

    // Filter by account numbers
    coaCodes.forEach((code, i) => {
      params[`filter.account.no.val[${i}]`] = code;
    });
    params["filter.account.no.op"] = "OR";

    // Filter by keyword (employee name) if provided
    if (employeeName) {
      params["filter.keywords.val"] = employeeName;
    }

    const result = await accurateRequest<AccurateVoucher[]>(
      "journal-voucher/list.do",
      params
    );
    return result.d || [];
  } catch (error) {
    console.error("Failed to get vouchers:", error);
    return [];
  }
}

// ─── Journal Insert ──────────────────────────────────────────────────────────

export const BANK_MANDIRI_KOPERASI_ACCOUNT = "123456789";
export const BANK_MANDIRI_COA = "110101";

export async function insertJournal(
  journal: AccurateJournalEntry
): Promise<{ id: number; number: string } | null> {
  try {
    const { host, session } = await getAccurateSession();
    const url = `${host}/accurate/api/journal-voucher/save.do`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCURATE_ACCESS_TOKEN}`,
        "X-Session-ID": session,
      },
      body: JSON.stringify(journal),
    });

    if (!response.ok) {
      throw new Error(`Insert journal failed: ${response.status}`);
    }

    const data: AccurateResponse<{ id: number; number: string }> =
      await response.json();

    if (!data.s) {
      throw new Error(`Insert journal error: ${JSON.stringify(data)}`);
    }

    return data.d;
  } catch (error) {
    console.error("Failed to insert journal:", error);
    return null;
  }
}
