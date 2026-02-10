import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  numeric,
  integer,
  pgEnum,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "member",
  "staf_pengadaan",
  "staf_treasury",
  "staf_piutang",
  "staf_akunting",
  "manager",
  "bendahara",
  "sekertaris",
  "ketua",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "draft",
  "pending_treasury",
  "analysis",
  "pending_manager",
  "pending_bendahara",
  "pending_ketua",
  "approved",
  "spp_process",
  "bank_process",
  "disbursed",
  "rejected",
]);

export const poStatusEnum = pgEnum("po_status", [
  "draft",
  "submitted",
  "review_pengadaan",
  "pricing",
  "pending_manager",
  "approved_rab",
  "spp_process",
  "procurement",
  "delivery",
  "goods_received",
  "goods_delivered",
  "invoicing",
  "waiting_payment",
  "payment_received",
  "completed",
  "rejected",
]);

export const paymentRequestStatusEnum = pgEnum("payment_request_status", [
  "pending",
  "in_review",
  "adjusted",
  "approved",
  "rejected",
  "completed",
]);

export const approvalActionEnum = pgEnum("approval_action", [
  "approve",
  "reject",
  "adjust",
]);

export const loanTypeEnum = pgEnum("loan_type", [
  "reguler",
  "khusus",
  "barang",
  "travel",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: text("auth_id").unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("member").notNull(),
  phone: varchar("phone", { length: 20 }),
  employeeId: varchar("employee_id", { length: 50 }),
  department: varchar("department", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeeData = pgTable("employee_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  accurateEmployeeId: varchar("accurate_employee_id", { length: 100 }),
  employeeNumber: varchar("employee_number", { length: 50 }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  joinDate: timestamp("join_date"),
  salary: numeric("salary", { precision: 15, scale: 2 }),
  bankAccount: varchar("bank_account", { length: 50 }),
  bankName: varchar("bank_name", { length: 100 }),
  rawData: jsonb("raw_data"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const savings = pgTable("savings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  period: varchar("period", { length: 7 }).notNull(),
  simpananPokok: numeric("simpanan_pokok", { precision: 15, scale: 2 }).default("0"),
  simpananWajib: numeric("simpanan_wajib", { precision: 15, scale: 2 }).default("0"),
  simpananSukarela: numeric("simpanan_sukarela", { precision: 15, scale: 2 }).default("0"),
  simpananKhusus: numeric("simpanan_khusus", { precision: 15, scale: 2 }).default("0"),
  shu: numeric("shu", { precision: 15, scale: 2 }).default("0"),
  totalBalance: numeric("total_balance", { precision: 15, scale: 2 }).default("0"),
  uploadBatchId: varchar("upload_batch_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Loans (Pinjaman) ───────────────────────────────────────────────────────

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  trackingNumber: varchar("tracking_number", { length: 20 }).unique().notNull(),
  loanType: loanTypeEnum("loan_type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  tenorMonths: integer("tenor_months").notNull(),
  monthlyInstallment: numeric("monthly_installment", { precision: 15, scale: 2 }).notNull(),
  purpose: text("purpose"),
  status: loanStatusEnum("status").default("draft").notNull(),
  creditAnalysis: text("credit_analysis"),
  creditScore: varchar("credit_score", { length: 10 }),
  analysisNotes: text("analysis_notes"),
  analyzedBy: uuid("analyzed_by").references(() => users.id),
  analyzedAt: timestamp("analyzed_at"),
  documentUrls: jsonb("document_urls").$type<string[]>(),
  accurateVoucherId: varchar("accurate_voucher_id", { length: 100 }),
  accurateJournalId: varchar("accurate_journal_id", { length: 100 }),
  coaCode: varchar("coa_code", { length: 20 }),
  bankPortalRef: varchar("bank_portal_ref", { length: 100 }),
  disbursedAt: timestamp("disbursed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Purchase Orders (PO) ───────────────────────────────────────────────────

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id),
  requesterName: varchar("requester_name", { length: 255 }),
  requesterDivisi: varchar("requester_divisi", { length: 100 }),
  requesterNip: varchar("requester_nip", { length: 50 }),
  trackingNumber: varchar("tracking_number", { length: 20 }).unique().notNull(),
  poNumber: varchar("po_number", { length: 30 }).unique().notNull(),
  description: text("description").notNull(),
  status: poStatusEnum("status").default("draft").notNull(),
  estimatedAmount: numeric("estimated_amount", { precision: 15, scale: 2 }),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }),
  documentUrls: jsonb("document_urls").$type<string[]>(),
  adjustedBy: uuid("adjusted_by").references(() => users.id),
  adjustmentNotes: text("adjustment_notes"),
  sppRef: varchar("spp_ref", { length: 100 }),
  vendorName: varchar("vendor_name", { length: 255 }),
  deliveryDate: timestamp("delivery_date"),
  receivedBy: uuid("received_by").references(() => users.id),
  receivedAt: timestamp("received_at"),
  receiptDocumentUrl: text("receipt_document_url"),
  goodsDeliveredAt: timestamp("goods_delivered_at"),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  invoiceDate: timestamp("invoice_date"),
  taxInvoiceNumber: varchar("tax_invoice_number", { length: 50 }),
  accurateInvoiceId: varchar("accurate_invoice_id", { length: 100 }),
  paymentDate: timestamp("payment_date"),
  paymentRef: varchar("payment_ref", { length: 100 }),
  accuratePaymentId: varchar("accurate_payment_id", { length: 100 }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const poItems = pgTable("po_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id")
    .references(() => purchaseOrders.id)
    .notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull().default(1),
  unit: varchar("unit", { length: 20 }).default("pcs"),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Payment Requests ───────────────────────────────────────────────────────

export const paymentRequests = pgTable("payment_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  trackingNumber: varchar("tracking_number", { length: 20 }).unique().notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  adjustedAmount: numeric("adjusted_amount", { precision: 15, scale: 2 }),
  category: varchar("category", { length: 100 }),
  status: paymentRequestStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Approvals ──────────────────────────────────────────────────────────────

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceType: varchar("reference_type", { length: 50 }).notNull(),
  referenceId: uuid("reference_id").notNull(),
  approverRole: userRoleEnum("approver_role").notNull(),
  approverId: uuid("approver_id").references(() => users.id),
  action: approvalActionEnum("action"),
  comments: text("comments"),
  stepOrder: integer("step_order").notNull(),
  stepLabel: varchar("step_label", { length: 100 }),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Content ────────────────────────────────────────────────────────────────

// ─── Loan Balances (Imported from kertas kerja) ────────────────────────────

export const loanBalances = pgTable("loan_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  loanType: varchar("loan_type", { length: 50 }).notNull(), // reguler, khusus, barang, channeling_mandiri, channeling_bsi
  period: varchar("period", { length: 7 }).notNull(), // "2025-12"
  saldo: numeric("saldo", { precision: 15, scale: 2 }).default("0"),
  uploadBatchId: varchar("upload_batch_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Monthly Deductions (Potongan bulanan) ─────────────────────────────────

export const monthlyDeductions = pgTable("monthly_deductions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  period: varchar("period", { length: 7 }).notNull(), // "2026-01"
  sourceFile: varchar("source_file", { length: 100 }), // bki_tetap, ids, kontrak_mns, sbu_industri, sbu_energi
  simpananAmount: numeric("simpanan_amount", { precision: 15, scale: 2 }).default("0"),
  pinjamanAmount: numeric("pinjaman_amount", { precision: 15, scale: 2 }).default("0"),
  uploadBatchId: varchar("upload_batch_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Upload Logs ───────────────────────────────────────────────────────────

export const uploadLogs = pgTable("upload_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  uploadType: varchar("upload_type", { length: 50 }).notNull(), // simpanan_saldo, pinjaman_saldo, potongan_bulanan
  period: varchar("period", { length: 7 }).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  subType: varchar("sub_type", { length: 50 }), // loan type or source file type
  recordCount: integer("record_count").default(0),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Content ────────────────────────────────────────────────────────────────

export const promotions = pgTable("promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  eventType: varchar("event_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Type Exports ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type EmployeeData = typeof employeeData.$inferSelect;
export type Saving = typeof savings.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PoItem = typeof poItems.$inferSelect;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type LoanBalance = typeof loanBalances.$inferSelect;
export type MonthlyDeduction = typeof monthlyDeductions.$inferSelect;
export type UploadLog = typeof uploadLogs.$inferSelect;
