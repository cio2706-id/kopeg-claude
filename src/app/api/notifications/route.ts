import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, loans, purchaseOrders, spp, users } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateUser } from "@/lib/db/get-or-create-user";
import { eq, isNull, inArray, and } from "drizzle-orm";

interface NotificationItem {
  id: string;
  type: "approval" | "spp_create" | "spp_approval" | "po_task";
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

/**
 * GET: Return notification counts AND detailed notification items for the current user's role.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getOrCreateUser(authUser);
    const notifications: NotificationItem[] = [];

    // 1. Pending approvals for this role
    const allPending = await db
      .select()
      .from(approvals)
      .where(isNull(approvals.action));

    // Group by referenceId, keep only the CURRENT step (lowest stepOrder)
    const currentStepByRef = new Map<string, (typeof allPending)[0]>();
    for (const a of allPending) {
      const existing = currentStepByRef.get(a.referenceId);
      if (!existing || a.stepOrder < existing.stepOrder) {
        currentStepByRef.set(a.referenceId, a);
      }
    }

    const myApprovals = Array.from(currentStepByRef.values()).filter(
      (a) => a.approverRole === dbUser.role
    );

    // Fetch detail for each approval notification
    for (const appr of myApprovals) {
      if (appr.referenceType === "loan") {
        const [loan] = await db
          .select({ trackingNumber: loans.trackingNumber, loanType: loans.loanType, amount: loans.amount, userId: loans.userId, createdAt: loans.createdAt })
          .from(loans)
          .where(eq(loans.id, appr.referenceId));
        if (loan) {
          const loanTypeLabels: Record<string, string> = {
            reguler: "Reguler", khusus: "Khusus", barang: "Barang",
            travel: "Travel", kepemilikan_kendaraan: "Kendaraan", channeling: "Channeling",
          };
          let memberName = "";
          if (loan.userId) {
            const [u] = await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, loan.userId));
            memberName = u?.fullName || "";
          }
          notifications.push({
            id: appr.id,
            type: "approval",
            title: `Persetujuan Pinjaman ${loanTypeLabels[loan.loanType] || loan.loanType}`,
            description: `${memberName ? memberName + " - " : ""}${appr.stepLabel || "Menunggu persetujuan"} - Rp ${Number(loan.amount).toLocaleString("id-ID")}`,
            href: "/pengurus/approvals",
            createdAt: appr.createdAt.toISOString(),
          });
        }
      } else if (appr.referenceType === "purchase_order") {
        const [po] = await db
          .select({ trackingNumber: purchaseOrders.trackingNumber, poNumber: purchaseOrders.poNumber, description: purchaseOrders.description, createdAt: purchaseOrders.createdAt })
          .from(purchaseOrders)
          .where(eq(purchaseOrders.id, appr.referenceId));
        if (po) {
          notifications.push({
            id: appr.id,
            type: "approval",
            title: `Persetujuan PO ${po.poNumber}`,
            description: `${po.description?.substring(0, 60) || ""} - ${appr.stepLabel || "Menunggu persetujuan"}`,
            href: "/pengurus/approvals",
            createdAt: appr.createdAt.toISOString(),
          });
        }
      } else if (appr.referenceType === "payment_request") {
        notifications.push({
          id: appr.id,
          type: "approval",
          title: "Persetujuan Pembayaran",
          description: appr.stepLabel || "Menunggu persetujuan",
          href: "/pengurus/approvals",
          createdAt: appr.createdAt.toISOString(),
        });
      }
    }

    // 2. SPP pending items (for staf_treasury)
    let pendingSppLoans = 0;
    let pendingSppPOs = 0;

    if (dbUser.role === "staf_treasury") {
      const sppLoans = await db
        .select({ id: loans.id, sppId: loans.sppId, trackingNumber: loans.trackingNumber, amount: loans.amount, loanType: loans.loanType, createdAt: loans.createdAt })
        .from(loans)
        .where(inArray(loans.status, ["approved", "spp_process"]));
      const loansWithoutSpp = sppLoans.filter((l) => !l.sppId);
      pendingSppLoans = loansWithoutSpp.length;

      for (const loan of loansWithoutSpp) {
        notifications.push({
          id: `spp-loan-${loan.id}`,
          type: "spp_create",
          title: "Buat SPP Pinjaman",
          description: `${loan.trackingNumber} - Rp ${Number(loan.amount).toLocaleString("id-ID")}`,
          href: "/pengurus/spp/create",
          createdAt: loan.createdAt.toISOString(),
        });
      }

      const sppPOs = await db
        .select({ id: purchaseOrders.id, poNumber: purchaseOrders.poNumber, description: purchaseOrders.description, totalAmount: purchaseOrders.totalAmount, estimatedAmount: purchaseOrders.estimatedAmount, createdAt: purchaseOrders.createdAt })
        .from(purchaseOrders)
        .where(and(eq(purchaseOrders.status, "approved_rab"), isNull(purchaseOrders.sppId)));
      pendingSppPOs = sppPOs.length;

      for (const po of sppPOs) {
        const amt = po.totalAmount || po.estimatedAmount;
        notifications.push({
          id: `spp-po-${po.id}`,
          type: "spp_create",
          title: `Buat SPP PO ${po.poNumber}`,
          description: `${po.description?.substring(0, 50) || ""}${amt ? " - Rp " + Number(amt).toLocaleString("id-ID") : ""}`,
          href: "/pengurus/spp/create",
          createdAt: po.createdAt.toISOString(),
        });
      }
    }

    // 3. SPP pending approval for manager/bendahara
    let pendingSppApprovals = 0;
    if (dbUser.role === "manager" || dbUser.role === "bendahara") {
      const statusFilter = dbUser.role === "manager" ? "pending_manager" : "pending_bendahara";
      const pendingSppList = await db
        .select({ id: spp.id, sppNumber: spp.sppNumber, totalAmount: spp.totalAmount, referenceType: spp.referenceType, createdAt: spp.createdAt })
        .from(spp)
        .where(eq(spp.status, statusFilter));
      pendingSppApprovals = pendingSppList.length;

      for (const s of pendingSppList) {
        notifications.push({
          id: `spp-appr-${s.id}`,
          type: "spp_approval",
          title: `Approval SPP ${s.sppNumber}`,
          description: `${s.referenceType === "loan" ? "Pinjaman" : "Purchase Order"} - Rp ${Number(s.totalAmount).toLocaleString("id-ID")}`,
          href: "/pengurus/spp",
          createdAt: s.createdAt.toISOString(),
        });
      }
    }

    // 4. PO tasks for current role (post-SPP process tasks)
    type PoStatus = typeof purchaseOrders.status.enumValues[number];
    const rolePoStatusMap: Record<string, PoStatus[]> = {
      staf_treasury: ["waiting_payment"],
      staf_pengadaan: ["spp_process", "procurement", "delivery"],
      staf_piutang: ["goods_received", "goods_delivered", "invoicing"],
      staf_akunting: ["waiting_payment", "payment_received"],
    };

    // Action labels for PO statuses
    const poTaskLabels: Record<string, string> = {
      spp_process: "Proses Pembelian",
      procurement: "Update Status Pengiriman",
      delivery: "Konfirmasi Pengiriman Vendor",
      goods_received: "Konfirmasi Penerimaan Barang",
      goods_delivered: "Konfirmasi Pengiriman ke Client",
      invoicing: "Proses Invoice",
      waiting_payment: "Proses Pembayaran",
      payment_received: "Konfirmasi Pembayaran Diterima",
    };

    let pendingPoTasks = 0;
    const myPoStatuses = rolePoStatusMap[dbUser.role];
    if (myPoStatuses && myPoStatuses.length > 0) {
      const poTasks = await db
        .select({
          id: purchaseOrders.id,
          poNumber: purchaseOrders.poNumber,
          description: purchaseOrders.description,
          status: purchaseOrders.status,
          totalAmount: purchaseOrders.totalAmount,
          estimatedAmount: purchaseOrders.estimatedAmount,
          createdAt: purchaseOrders.createdAt,
        })
        .from(purchaseOrders)
        .where(inArray(purchaseOrders.status, myPoStatuses));
      pendingPoTasks = poTasks.length;

      for (const po of poTasks) {
        const amt = po.totalAmount || po.estimatedAmount;
        notifications.push({
          id: `po-task-${po.id}`,
          type: "po_task",
          title: `PO ${po.poNumber}: ${poTaskLabels[po.status] || po.status}`,
          description: `${po.description?.substring(0, 50) || ""}${amt ? " - Rp " + Number(amt).toLocaleString("id-ID") : ""}`,
          href: "/pengurus/po",
          createdAt: po.createdAt.toISOString(),
        });
      }
    }

    // Also count PO approval tasks (review_pengadaan, pricing for staf_pengadaan; pending_manager for manager)
    const rolePoApprovalStatuses: Record<string, PoStatus[]> = {
      staf_pengadaan: ["review_pengadaan", "pricing"],
    };
    const myPoApprovalStatuses = rolePoApprovalStatuses[dbUser.role];
    if (myPoApprovalStatuses && myPoApprovalStatuses.length > 0) {
      const poApprovalTasks = await db
        .select({
          id: purchaseOrders.id,
          poNumber: purchaseOrders.poNumber,
          description: purchaseOrders.description,
          status: purchaseOrders.status,
          createdAt: purchaseOrders.createdAt,
        })
        .from(purchaseOrders)
        .where(inArray(purchaseOrders.status, myPoApprovalStatuses));

      for (const po of poApprovalTasks) {
        pendingPoTasks += 1;
        notifications.push({
          id: `po-review-${po.id}`,
          type: "po_task",
          title: `PO ${po.poNumber}: Review & Pendetailan`,
          description: po.description?.substring(0, 60) || "",
          href: "/pengurus/po",
          createdAt: po.createdAt.toISOString(),
        });
      }
    }

    // Sort notifications by createdAt descending (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate total for bell badge
    const totalNotifications = notifications.length;

    return NextResponse.json({
      pendingApprovals: myApprovals.length,
      pendingSppLoans,
      pendingSppPOs,
      pendingSppApprovals,
      totalSpp: pendingSppLoans + pendingSppPOs + pendingSppApprovals,
      pendingPoTasks,
      totalNotifications,
      notifications,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
