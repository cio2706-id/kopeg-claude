/**
 * generate-import-sql.js
 *
 * Reads Simpanan_Koperasi_2024.xlsx and produces:
 *   1. import-simpanan.sql   – SQL to insert users + savings rows
 *   2. create-auth-users.ts  – Supabase Admin script to create auth accounts
 *
 * Usage:  node scripts/generate-import-sql.js
 */

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// ── Paths ────────────────────────────────────────────────────────────────────
const EXCEL_PATH = path.resolve(__dirname, "../Simpanan_Koperasi_2024.xlsx");
const SQL_OUT = path.resolve(__dirname, "import-simpanan.sql");
const TS_OUT = path.resolve(__dirname, "create-auth-users.ts");

// ── Read workbook ────────────────────────────────────────────────────────────
const wb = XLSX.readFile(EXCEL_PATH);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

// ── Helpers ──────────────────────────────────────────────────────────────────
function toNumeric(val) {
  if (val === null || val === undefined || val === "") return "0";
  const n = Number(val);
  if (isNaN(n)) return "0";
  // Round to 2 decimal places to avoid floating-point noise
  return n.toFixed(2);
}

function escapeSql(str) {
  if (!str) return "";
  return String(str).replace(/'/g, "''").trim();
}

function padEmployeeNumber(val) {
  if (!val) return null;
  // Ensure it's a zero-padded 6-digit string
  return String(val).padStart(6, "0");
}

// ── Parse data rows ──────────────────────────────────────────────────────────
// Row 5 = header row 1, Row 6 = sub-header, Row 7+ = data
// We keep reading until we hit a non-numeric NO or the totals row
const members = [];

for (let i = 7; i < rows.length; i++) {
  const row = rows[i];
  if (!row || !Array.isArray(row)) continue;

  const no = row[0];
  // Stop if we hit the totals row or non-numeric sequence number
  if (typeof no !== "number" || !Number.isInteger(no)) continue;

  const employeeNumber = padEmployeeNumber(row[1]);
  if (!employeeNumber) continue;

  const fullName = row[2] ? String(row[2]).trim() : null;
  const department = row[3] ? String(row[3]).trim() : null;
  const pokok = toNumeric(row[4]);
  const wajib = toNumeric(row[5]);
  const khusus = toNumeric(row[6]);
  const sukarela = toNumeric(row[7]);
  const shu = toNumeric(row[8]);
  const jumlah = toNumeric(row[9]);
  const status = row[10] ? String(row[10]).trim().toUpperCase() : "";

  // Skip BUKAN ANGGOTA
  if (status === "BUKAN ANGGOTA") continue;
  // Only include AKTIF and PASIF
  if (status !== "AKTIF" && status !== "PASIF") continue;

  if (!fullName) continue;

  members.push({
    no,
    employeeNumber,
    fullName,
    department,
    email: `${employeeNumber}@kopeg-bki.id`,
    isActive: status === "AKTIF",
    status,
    pokok,
    wajib,
    khusus,
    sukarela,
    shu,
    jumlah,
  });
}

console.log(`Parsed ${members.length} member rows (AKTIF + PASIF, excluding BUKAN ANGGOTA)`);

// ── Generate SQL ─────────────────────────────────────────────────────────────
let sql = "";

sql += `-- ============================================================================\n`;
sql += `-- import-simpanan.sql\n`;
sql += `-- Auto-generated on ${new Date().toISOString()}\n`;
sql += `-- Source: Simpanan_Koperasi_2024.xlsx  (${members.length} members)\n`;
sql += `--\n`;
sql += `-- IMPORTANT: Run create-auth-users.ts FIRST to create Supabase Auth users,\n`;
sql += `-- then run this SQL to insert into users + savings tables.\n`;
sql += `--\n`;
sql += `-- This script uses a DO block so auth_id lookups happen at execution time.\n`;
sql += `-- Auth users must already exist in auth.users with the matching email.\n`;
sql += `-- ============================================================================\n\n`;

sql += `BEGIN;\n\n`;

// ── Step 1: Insert users using auth.users email lookup ───────────────────────
sql += `-- ════════════════════════════════════════════════════════════════════════════\n`;
sql += `-- STEP 1: Insert into "users" table\n`;
sql += `-- We look up auth_id from auth.users by email. If auth user doesn't exist\n`;
sql += `-- yet, this will fail – run create-auth-users.ts first.\n`;
sql += `-- ════════════════════════════════════════════════════════════════════════════\n\n`;

sql += `INSERT INTO users (auth_id, email, full_name, role, employee_id, department, is_active)\nVALUES\n`;

const userValues = members.map((m, idx) => {
  const comma = idx < members.length - 1 ? "," : "";
  return (
    `  (\n` +
    `    (SELECT id::text FROM auth.users WHERE email = '${escapeSql(m.email)}'),\n` +
    `    '${escapeSql(m.email)}',\n` +
    `    '${escapeSql(m.fullName)}',\n` +
    `    'member',\n` +
    `    '${escapeSql(m.employeeNumber)}',\n` +
    `    ${m.department ? `'${escapeSql(m.department)}'` : "NULL"},\n` +
    `    ${m.isActive}\n` +
    `  )${comma}`
  );
});

sql += userValues.join("\n") + "\n";
sql += `ON CONFLICT (email) DO UPDATE SET\n`;
sql += `  full_name   = EXCLUDED.full_name,\n`;
sql += `  employee_id = EXCLUDED.employee_id,\n`;
sql += `  department  = EXCLUDED.department,\n`;
sql += `  is_active   = EXCLUDED.is_active,\n`;
sql += `  updated_at  = NOW();\n\n`;

// ── Step 2: Insert savings records ───────────────────────────────────────────
sql += `-- ════════════════════════════════════════════════════════════════════════════\n`;
sql += `-- STEP 2: Insert savings records for period 2024-12\n`;
sql += `-- References users by employee_id lookup.\n`;
sql += `-- ════════════════════════════════════════════════════════════════════════════\n\n`;

sql += `INSERT INTO savings (user_id, period, simpanan_pokok, simpanan_wajib, simpanan_khusus, simpanan_sukarela, shu, total_balance)\nVALUES\n`;

const savingsValues = members.map((m, idx) => {
  const comma = idx < members.length - 1 ? "," : "";
  return (
    `  (\n` +
    `    (SELECT id FROM users WHERE employee_id = '${escapeSql(m.employeeNumber)}'),\n` +
    `    '2024-12',\n` +
    `    ${m.pokok},\n` +
    `    ${m.wajib},\n` +
    `    ${m.khusus},\n` +
    `    ${m.sukarela},\n` +
    `    ${m.shu},\n` +
    `    ${m.jumlah}\n` +
    `  )${comma}`
  );
});

sql += savingsValues.join("\n") + "\n";
sql += `ON CONFLICT DO NOTHING;\n\n`;

sql += `COMMIT;\n`;

fs.writeFileSync(SQL_OUT, sql, "utf8");
console.log(`SQL written to: ${SQL_OUT}`);

// ── Generate create-auth-users.ts ────────────────────────────────────────────
let ts = "";

ts += `/**\n`;
ts += ` * create-auth-users.ts\n`;
ts += ` *\n`;
ts += ` * Creates Supabase Auth users for all koperasi members.\n`;
ts += ` * Run this BEFORE executing import-simpanan.sql.\n`;
ts += ` *\n`;
ts += ` * Auto-generated on ${new Date().toISOString()}\n`;
ts += ` * Source: Simpanan_Koperasi_2024.xlsx  (${members.length} members)\n`;
ts += ` *\n`;
ts += ` * Usage:\n`;
ts += ` *   npx tsx scripts/create-auth-users.ts\n`;
ts += ` *\n`;
ts += ` * Requires env vars:\n`;
ts += ` *   NEXT_PUBLIC_SUPABASE_URL\n`;
ts += ` *   SUPABASE_SERVICE_ROLE_KEY\n`;
ts += ` */\n\n`;

ts += `import { createClient } from "@supabase/supabase-js";\n`;
ts += `import { config } from "dotenv";\n`;
ts += `import { resolve } from "path";\n\n`;

ts += `// Load .env.local\n`;
ts += `config({ path: resolve(process.cwd(), ".env.local") });\n\n`;

ts += `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;\n`;
ts += `const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;\n\n`;

ts += `if (!supabaseUrl || !serviceRoleKey) {\n`;
ts += `  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");\n`;
ts += `  process.exit(1);\n`;
ts += `}\n\n`;

ts += `const supabase = createClient(supabaseUrl, serviceRoleKey, {\n`;
ts += `  auth: {\n`;
ts += `    autoRefreshToken: false,\n`;
ts += `    persistSession: false,\n`;
ts += `  },\n`;
ts += `});\n\n`;

ts += `const DEFAULT_PASSWORD = "KopegBKI2024!";\n\n`;

ts += `interface MemberRecord {\n`;
ts += `  email: string;\n`;
ts += `  fullName: string;\n`;
ts += `  employeeNumber: string;\n`;
ts += `}\n\n`;

ts += `const members: MemberRecord[] = [\n`;

for (const m of members) {
  ts += `  { email: "${m.email}", fullName: "${m.fullName.replace(/"/g, '\\"')}", employeeNumber: "${m.employeeNumber}" },\n`;
}

ts += `];\n\n`;

ts += `async function main() {\n`;
ts += `  console.log(\`Creating \${members.length} auth users...\`);\n\n`;

ts += `  let created = 0;\n`;
ts += `  let skipped = 0;\n`;
ts += `  let errors = 0;\n\n`;

ts += `  for (const member of members) {\n`;
ts += `    const { data, error } = await supabase.auth.admin.createUser({\n`;
ts += `      email: member.email,\n`;
ts += `      password: DEFAULT_PASSWORD,\n`;
ts += `      email_confirm: true,\n`;
ts += `      user_metadata: {\n`;
ts += `        full_name: member.fullName,\n`;
ts += `        employee_number: member.employeeNumber,\n`;
ts += `      },\n`;
ts += `    });\n\n`;

ts += `    if (error) {\n`;
ts += `      if (error.message.includes("already been registered")) {\n`;
ts += `        skipped++;\n`;
ts += `      } else {\n`;
ts += `        console.error(\`  ERROR [\${member.email}]: \${error.message}\`);\n`;
ts += `        errors++;\n`;
ts += `      }\n`;
ts += `    } else {\n`;
ts += `      created++;\n`;
ts += `    }\n\n`;

ts += `    // Small delay to avoid rate limits\n`;
ts += `    if (created % 50 === 0 && created > 0) {\n`;
ts += `      console.log(\`  ... processed \${created + skipped + errors} / \${members.length}\`);\n`;
ts += `    }\n`;
ts += `    await new Promise((r) => setTimeout(r, 50));\n`;
ts += `  }\n\n`;

ts += `  console.log(\`\\nDone!\`);\n`;
ts += `  console.log(\`  Created: \${created}\`);\n`;
ts += `  console.log(\`  Skipped (already exist): \${skipped}\`);\n`;
ts += `  console.log(\`  Errors:  \${errors}\`);\n`;
ts += `}\n\n`;

ts += `main().catch(console.error);\n`;

fs.writeFileSync(TS_OUT, ts, "utf8");
console.log(`TypeScript auth script written to: ${TS_OUT}`);

// ── Summary ──────────────────────────────────────────────────────────────────
const aktifCount = members.filter((m) => m.isActive).length;
const pasifCount = members.filter((m) => !m.isActive).length;
console.log(`\nSummary:`);
console.log(`  Total members: ${members.length}`);
console.log(`  AKTIF:  ${aktifCount}`);
console.log(`  PASIF:  ${pasifCount}`);
console.log(`\nTo import:`);
console.log(`  1. npx tsx scripts/create-auth-users.ts   (create Supabase Auth accounts)`);
console.log(`  2. psql <connection_string> -f scripts/import-simpanan.sql   (insert users + savings)`);
