const ACCURATE_BASE_URL =
  process.env.ACCURATE_HOST || "https://account.accurate.id";
const ACCURATE_ACCESS_TOKEN = process.env.ACCURATE_ACCESS_TOKEN || "";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface AccurateResponse<T = unknown> {
  s: boolean;
  d: T;
  sp?: string;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function accurateRequest<T>(
  method: string,
  params: Record<string, string> = {},
  retryCount = 0
): Promise<AccurateResponse<T>> {
  const searchParams = new URLSearchParams({
    method,
    ...params,
  });

  const url = `${ACCURATE_BASE_URL}/open-api/json.do?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCURATE_ACCESS_TOKEN}`,
        "X-Session-ID": ACCURATE_ACCESS_TOKEN,
      },
    });

    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.warn(
        `Accurate API rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      await sleep(delay);
      return accurateRequest<T>(method, params, retryCount + 1);
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
      return accurateRequest<T>(method, params, retryCount + 1);
    }
    console.error(`Accurate API call failed [${method}]:`, error);
    throw error;
  }
}

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

export async function getEmployeeByEmail(
  email: string
): Promise<AccurateEmployee | null> {
  try {
    const result = await accurateRequest<AccurateEmployee>(
      "GetEmployee",
      { email }
    );
    return result.d;
  } catch (error) {
    console.error("Failed to get employee by email:", error);
    return null;
  }
}

// COA codes for loan types
export const LOAN_COA_MAP: Record<string, string> = {
  regular: "110304",
  emergency: "110305",
  education: "110306",
  housing: "110307",
};

export const BANK_MANDIRI_KOPERASI_ACCOUNT = "123456789";
export const BANK_MANDIRI_COA = "110101";

export async function getVouchersByEmployeeName(
  employeeName: string,
  coaCodes: string[]
): Promise<AccurateVoucher[]> {
  try {
    const result = await accurateRequest<AccurateVoucher[]>(
      "GetVoucherList",
      {
        filter: employeeName,
        accountNo: coaCodes.join(","),
      }
    );
    return result.d || [];
  } catch (error) {
    console.error("Failed to get vouchers:", error);
    return [];
  }
}

export async function insertJournal(
  journal: AccurateJournalEntry
): Promise<{ id: number; number: string } | null> {
  try {
    const result = await accurateRequest<{ id: number; number: string }>(
      "InsertJournal",
      {
        data: JSON.stringify(journal),
      }
    );
    return result.d;
  } catch (error) {
    console.error("Failed to insert journal:", error);
    return null;
  }
}
