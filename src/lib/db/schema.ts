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

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "member",
  "staff",
  "manager",
  "bendahara",
  "sekertaris",
  "ketua",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "draft",
  "pending_staff",
  "pending_manager",
  "pending_bendahara",
  "pending_ketua",
  "approved",
  "rejected",
  "disbursed",
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
  "regular",
  "emergency",
  "education",
  "housing",
]);

// Tables
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
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  simpananPokok: numeric("simpanan_pokok", { precision: 15, scale: 2 }).default("0"),
  simpananWajib: numeric("simpanan_wajib", { precision: 15, scale: 2 }).default("0"),
  simpananSukarela: numeric("simpanan_sukarela", { precision: 15, scale: 2 }).default("0"),
  totalBalance: numeric("total_balance", { precision: 15, scale: 2 }).default("0"),
  uploadBatchId: varchar("upload_batch_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  loanType: loanTypeEnum("loan_type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).notNull(),
  tenorMonths: integer("tenor_months").notNull(),
  monthlyInstallment: numeric("monthly_installment", { precision: 15, scale: 2 }).notNull(),
  purpose: text("purpose"),
  status: loanStatusEnum("status").default("draft").notNull(),
  documentUrls: jsonb("document_urls").$type<string[]>(),
  accurateVoucherId: varchar("accurate_voucher_id", { length: 100 }),
  accurateJournalId: varchar("accurate_journal_id", { length: 100 }),
  coaCode: varchar("coa_code", { length: 20 }),
  disbursedAt: timestamp("disbursed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceType: varchar("reference_type", { length: 50 }).notNull(), // 'loan' | 'payment_request'
  referenceId: uuid("reference_id").notNull(),
  approverRole: userRoleEnum("approver_role").notNull(),
  approverId: uuid("approver_id").references(() => users.id),
  action: approvalActionEnum("action"),
  comments: text("comments"),
  stepOrder: integer("step_order").notNull(),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type EmployeeData = typeof employeeData.$inferSelect;
export type Saving = typeof savings.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
