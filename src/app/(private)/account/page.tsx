"use client";
import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageTitle from "@/components/ui/page-title";
import usersGlobalStore, {
  IUsersGlobalStore,
} from "@/global-store/users-store";

import AdminDashboard from "./_components/admin-dashboard";
import QuickActions from "./_components/quick-actions";
import ProfileCompletionCard from "@/components/profile/profile-completion-card";
import CombinedProfileSubscriptionCard from "@/components/profile/combined-profile-subscription-card";
import ContactFormModal from "@/components/profile/contact-form-modal";
import { generatePDFInvoice } from "./_utils/pdf-generator";

import {
  Clock,
  TrendingUp,
  AlertTriangle,
  Calendar,
  IndianRupee,
  UserRound,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Download,
  CalendarSync,
  RefreshCw,
  Sparkles,
  Star,
  Crown,
  FolderKanban,
  Gem,
} from "lucide-react";
import toast from "react-hot-toast";

function AccountPage() {
  /* -------------------------------- state -------------------------------- */
  const { user, currentSubscription, getIsProfileComplete } =
    usersGlobalStore() as IUsersGlobalStore;

  const [refreshing, setRefreshing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  // Call the function to get the profile completion status
  const isProfileComplete = getIsProfileComplete();
  
  const [showProfileDone, setShowProfileDone] = useState(
    !!(isProfileComplete && !localStorage.getItem("profileDoneShown"))
  );

  /* -------------------- subscription progress calculation ----------------- */
  const subscriptionProgress = useMemo(() => {
    if (!currentSubscription) return null;

    const start = dayjs(currentSubscription.start_date);
    const end = dayjs(currentSubscription.end_date);
    const now = dayjs();

    const totalDays = end.diff(start, "day");
    const elapsed = now.diff(start, "day");
    const remaining = end.diff(now, "day");

    const pct = Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);

    let status: "expired" | "expiring" | "active";
    if (remaining <= 0) status = "expired";
    else if (remaining <= 7) status = "expiring";
    else status = "active";

    return {
      progressPercentage: pct,
      daysRemaining: Math.max(remaining, 0),
      totalDays,
      isExpiring: remaining > 0 && remaining <= 7,
      isExpired: remaining <= 0,
      status,
    };
  }, [currentSubscription]);

  /* ----------------------- cash payment approval check ------------------- */
  const isCashPaymentPending = useMemo(() => {
    if (!currentSubscription) return false;
    return (
      currentSubscription.payment_id?.startsWith("CASH_") &&
      !currentSubscription.is_cash_approval
    );
  }, [currentSubscription]);

  /* --------------------------- helper handlers --------------------------- */
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    toast.loading("Refreshing …");
    window.location.reload();
  };

  const downloadPDFInvoice = async () => {
    if (!currentSubscription) {
      toast.error("No subscription data");
      return;
    }

    // Check if cash payment is pending approval
    if (isCashPaymentPending) {
      toast.error("Invoice not available - Cash payment approval pending");
      return;
    }

    toast.loading("Generating invoice …");
    await generatePDFInvoice({
      subscriptionId: currentSubscription.id.toString(),
      planName: currentSubscription.plan?.name ?? "Unknown",
      amount: currentSubscription.amount,
      originalAmount: currentSubscription.original_amount,
      discountAmount: currentSubscription.discount_amount,
      startDate: dayjs(currentSubscription.start_date).format("MMM DD, YYYY"),
      endDate: dayjs(currentSubscription.end_date).format("MMM DD, YYYY"),
      purchaseDate: dayjs(currentSubscription.created_at).format(
        "MMM DD, YYYY"
      ),
      paymentId: currentSubscription.payment_id,
      duration: currentSubscription.total_duration,
      customerName: user?.name ?? "Unknown",
      customerEmail: user?.email ?? "Unknown",
      paymentGateway: currentSubscription.payment_gateway ?? "razorpay",
      isCashPayment: currentSubscription.payment_id?.startsWith("CASH_"),
      isCashApproved: currentSubscription.is_cash_approval,
    });
    toast.dismiss();
    toast.success("Invoice ready");
  };

  const handlePlanClick = () => {
    if (!user?.contact_no) setShowContactModal(true);
    else window.location.href = "/account/user/purchase-plan";
  };

  /* --------------------------- early admin exit -------------------------- */
  if (user?.is_admin) return <AdminDashboard />;

  /* =============================== RENDER ================================ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30">
      <div className="container mx-auto px-4 py-8">
        {/* --------------------------- welcome header ----------------------- */}
        <header className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 border-4 border-white shadow-xl flex items-center justify-center">
                <UserRound className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 border-2 border-white flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div>
              <PageTitle title={`Welcome back, ${user?.name}!`} />
              <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center">
                Manage your subscription and account
              </p>
            </div>
          </div>
        </header>

        {/* ------------------- profile-complete toast banner --------------- */}
        {showProfileDone && (
          <div className="mb-6 max-w-6xl mx-auto">
            <div className="relative p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                    🎉 Profile Complete!
                  </h4>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Your profile is now complete and you have access to all
                    features.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowProfileDone(false);
                    localStorage.setItem("profileDoneShown", "true");
                  }}
                  className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= CASH PAYMENT PENDING BANNER ================== */}
        {isCashPaymentPending && (
          <div className="mb-6 max-w-6xl mx-auto">
            <div className="relative p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800 shadow-lg bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                    ⏳ Cash Payment Approval Pending
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your cash payment is being reviewed. Your subscription will
                    be activated once approved by admin.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${refreshing && "animate-spin"}`}
                  />
                  {refreshing ? "Refreshing" : "Refresh"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================== NO ACTIVE SUBSCRIPTION ================= */}
        {(!currentSubscription || isCashPaymentPending) && (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ----- profile card ---------------------------------------- */}
              <ProfileCompletionCard
                onProfileComplete={() => toast.success("Profile updated!")}
              />

              {/* ----- no-subscription card -------------------------------- */}
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                {/* card header */}
                <div className="flex-shrink-0 p-4 sm:p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-fuchsia-900/20 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <CalendarSync className="h-6 w-6 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                        {isCashPaymentPending
                          ? "Payment Approval Pending"
                          : "No Active Subscription"}
                      </h2>
                      <p className="text-violet-600 dark:text-violet-400 text-xs sm:text-sm flex items-center truncate">
                        {isCashPaymentPending
                          ? "Your payment is being reviewed"
                          : "Start your journey with us today"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* card body */}
                <div className="flex-1 flex flex-col justify-center p-6 sm:p-8">
                  <div className="text-center space-y-4 sm:space-y-6">
                    <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 dark:from-violet-900/30 dark:via-purple-900/30 dark:to-fuchsia-900/30 flex items-center justify-center shadow-xl">
                      <CalendarSync className="h-12 w-12 sm:h-12 sm:w-12 text-violet-600 dark:text-violet-400" />
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                      {isCashPaymentPending
                        ? "Please wait for approval"
                        : "Ready to get started?"}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 max-w-xs mx-auto text-sm leading-relaxed px-4 sm:px-0">
                      {isCashPaymentPending
                        ? "Your cash payment is being reviewed by our admin team. You'll be notified once approved."
                        : "Choose a flexible subscription plan and unlock all features today."}
                    </p>

                    {/* Button Container */}
                    <div className="space-y-3 sm:space-y-4 w-full max-w-xs mx-auto">
                      {!isCashPaymentPending && (
                        <Button
                          onClick={handlePlanClick}
                          className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-105 text-sm sm:text-base"
                        >
                          <FolderKanban className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            View Subscription Plans
                          </span>
                        </Button>
                      )}

                      {/* Refresh Button - Now placed after subscription button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="w-full border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 px-4 py-2 text-sm"
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 flex-shrink-0 ${
                            refreshing && "animate-spin"
                          }`}
                        />
                        <span className="truncate">
                          {refreshing ? "Refreshing..." : "Refresh Status"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================= ACTIVE SUBSCRIPTION =================== */}
        {currentSubscription && !isCashPaymentPending && (
          <>
            <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* combined profile/subscription card (2 cols) */}
              <div className="lg:col-span-2">
                <CombinedProfileSubscriptionCard
                  subscriptionProgress={subscriptionProgress}
                  onProfileComplete={() => toast.success("Profile updated!")}
                  onSubscriptionPlanClick={handlePlanClick}
                />
              </div>

              {/* quick actions (1 col) */}
              <QuickActions
                subscriptionProgress={subscriptionProgress}
                onDownloadInvoice={downloadPDFInvoice}
                onSubscriptionPlanClick={handlePlanClick}
                isCashPaymentPending={isCashPaymentPending}
              />
            </div>

            {/* ---------- details card ---------- */}
            <SubscriptionDetails
              subscription={currentSubscription}
              progress={subscriptionProgress}
              onCopy={copyToClipboard}
              onInvoice={downloadPDFInvoice}
              onRenew={handlePlanClick}
              isCashPaymentPending={isCashPaymentPending}
            />
          </>
        )}

        {/* --------------------------- contact modal ----------------------- */}
        <ContactFormModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          onSuccess={() =>
            (window.location.href = "/account/user/purchase-plan")
          }
          title="Complete Your Profile"
          description="Please add a contact number before purchasing a plan."
        />
      </div>
    </div>
  );
}

/* -------------- extracted details component to shorten file ------------- */
interface DProps {
  subscription: NonNullable<IUsersGlobalStore["currentSubscription"]>;
  progress: ReturnType<(typeof AccountPage.prototype)["subscriptionProgress"]>;
  onCopy: (v: string, l: string) => void;
  onInvoice: () => void;
  onRenew: () => void;
  isCashPaymentPending: boolean;
}
function SubscriptionDetails({
  subscription,
  progress,
  onCopy,
  onInvoice,
  onRenew,
  isCashPaymentPending,
}: DProps) {
  return (
    <div className="max-w-6xl mx-auto mt-8 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* header */}
      <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <CalendarSync className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Subscription Details
          </h3>
        </div>
        <div
          className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-md ${
            progress?.isExpired
              ? "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
              : isCashPaymentPending
              ? "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
              : "bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
          }`}
        >
          {progress?.isExpired ? (
            <>
              <XCircle className="h-4 w-4 mr-2" /> Expired
            </>
          ) : isCashPaymentPending ? (
            <>
              <Clock className="h-4 w-4 mr-2" /> Pending Approval
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" /> Active
            </>
          )}
        </div>
      </div>

      {/* body */}
      <div className="p-6 space-y-6">
        {/* simple info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* id */}
          <InfoRow
            label="Subscription ID"
            value={`#${subscription.id}`}
            onCopy={() => onCopy(String(subscription.id), "ID")}
          />
          {/* plan */}
          <InfoRow label="Plan" value={subscription.plan?.name ?? "Unknown"} />
          {/* dates */}
          <InfoRow
            label="Start Date"
            value={dayjs(subscription.start_date).format("MMM DD, YYYY")}
          />
          <InfoRow
            label="End Date"
            value={dayjs(subscription.end_date).format("MMM DD, YYYY")}
          />
          {/* purchase */}
          <InfoRow
            label="Purchase Date"
            value={dayjs(subscription.created_at).format("MMM DD, YYYY")}
          />
          {/* duration */}
          <InfoRow
            label="Duration"
            value={`${subscription.total_duration} days`}
          />

          {/* Conditional pricing display based on discount */}
          {subscription.discount_amount && subscription.discount_amount > 0 ? (
            <>
              {/* Show original amount only if there's a discount and original amount exists */}
              {subscription.original_amount &&
                subscription.original_amount > 0 && (
                  <InfoRow
                    label="Original Price"
                    value={`₹${subscription.original_amount.toLocaleString()}`}
                  />
                )}
              {/* discount amount */}
              <InfoRow
                label="Savings Applied"
                value={`₹${subscription.discount_amount.toLocaleString()}`}
                highlighted
              />
              {/* final amount with discount */}
              <InfoRow
                label="Amount Paid"
                value={`₹${subscription.amount.toLocaleString()}`}
                highlighted
              />
            </>
          ) : (
            /* No discount - show as plan price */
            <InfoRow
              label="Plan Price"
              value={`₹${subscription.amount.toLocaleString()}`}
              highlighted
            />
          )}

          {/* payment id */}
          <InfoRow
            label="Payment ID"
            value={subscription.payment_id}
            onCopy={() => onCopy(subscription.payment_id, "Payment ID")}
          />
        </div>

        {/* action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-[1.02]">
            <Link
              href="/account/user/subscriptions"
              className="flex items-center justify-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" /> All Subscriptions
            </Link>
          </Button>
          <Button
            onClick={onInvoice}
            variant="outline"
            className="flex-1 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 py-3 rounded-xl"
            disabled={isCashPaymentPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {isCashPaymentPending ? "Invoice Unavailable" : "PDF Invoice"}
          </Button>
          {progress?.isExpiring && !isCashPaymentPending && (
            <Button
              onClick={onRenew}
              className="flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-transform duration-300 hover:scale-[1.02]"
            >
              <TrendingUp className="h-4 w-4 mr-2" /> Renew
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* small row helper */
function InfoRow({
  label,
  value,
  onCopy,
  highlighted = false,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center p-4 rounded-lg border shadow-sm ${
        highlighted
          ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
          : "bg-slate-50/80 dark:bg-slate-700/30 border-slate-200/50 dark:border-slate-600/50"
      }`}
    >
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <div className="flex items-center space-x-2">
        <span
          className={`text-sm ${
            highlighted ? "font-bold" : "font-medium"
          } text-slate-900 dark:text-slate-100 truncate max-w-[160px]`}
        >
          {value}
        </span>
        {onCopy && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopy}
            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
