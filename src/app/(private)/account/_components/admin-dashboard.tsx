"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import RevenueChart from "./revenue-chart";
import ExpiringSubscriptionsWidget from "./expiring-subscriptions-widget";
import SubscriptionExpiryChart from "./subscription-expiry-chart";

import {
  getUsersReport,
  getSubscriptionsReport,
  getMonthlyRevenueReport,
  getSubscriptionExpiryStats,
} from "@/actions/dashboard";
import { getExpiringSubscriptionsSimple } from "@/actions/subscriptions";
import toast from "react-hot-toast";
import {
  Users,
  Shield,
  User,
  CreditCard,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Clock,
  IndianRupee,
} from "lucide-react";
import Spinner from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

// Interface for expiring subscriptions data - UPDATED WITH IMAGE FIELDS
interface ExpiringSubscription {
  id: string;
  user_name: string;
  user_email: string;
  user_contact_no?: string;
  user_profile_image?: string; // NEW
  user_clerk_url?: string;     // NEW
  plan_name: string;
  start_date: string;
  end_date: string;
  amount: number;
  days_remaining: number;
}

interface ExpiringData {
  expiringSubscriptions: ExpiringSubscription[];
  expiredSubscriptions: ExpiringSubscription[];
}

function AdminDashboard() {
  const [userData, setUserData] = useState({
    users_count: 0,
    customers_count: 0,
    admins_count: 0,
  });

  const [subscriptionData, setSubscriptionData] = useState({
    subscriptions_count: 0,
    total_revenue: 0,
  });

  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [expiringData, setExpiringData] = useState<ExpiringData>({
    expiringSubscriptions: [],
    expiredSubscriptions: [],
  });
  const [expiryStats, setExpiryStats] = useState({
    expiring_today: 0,
    expiring_this_week: 0,
    expired_this_week: 0,
    expiring_next_week: 0,
  });
  const [loading, setLoading] = useState(true);

  // Separate function to fetch expiring subscriptions data
  const fetchExpiringSubscriptionsData = useCallback(async () => {
    try {
      const result = await getExpiringSubscriptionsSimple();
      if (result.success && result.data) {
        setExpiringData(result.data);
      } else {
        console.error(
          "Failed to fetch expiring subscriptions:",
          result.message
        );
        // Set empty data on failure
        setExpiringData({
          expiringSubscriptions: [],
          expiredSubscriptions: [],
        });
      }
    } catch (error) {
      console.error("Error fetching expiring subscriptions:", error);
      setExpiringData({
        expiringSubscriptions: [],
        expiredSubscriptions: [],
      });
    }
  }, []);

  // Main fetchData function with useCallback and proper dependencies
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel to improve performance
      const [
        usersReportResponse,
        subscriptionsReportResponse,
        monthlyRevenueResponse,
        expiryStatsResponse,
        expiringSubscriptionsResponse,
      ] = await Promise.allSettled([
        getUsersReport(),
        getSubscriptionsReport(),
        getMonthlyRevenueReport(),
        getSubscriptionExpiryStats(),
        getExpiringSubscriptionsSimple(),
      ]);

      // Handle users data
      if (
        usersReportResponse.status === "fulfilled" &&
        usersReportResponse.value.success
      ) {
        setUserData(
          usersReportResponse.value.data || {
            users_count: 0,
            customers_count: 0,
            admins_count: 0,
          }
        );
      } else if (usersReportResponse.status === "rejected") {
        console.error("User report failed:", usersReportResponse.reason);
      }

      // Handle subscriptions data
      if (
        subscriptionsReportResponse.status === "fulfilled" &&
        subscriptionsReportResponse.value.success
      ) {
        setSubscriptionData(
          subscriptionsReportResponse.value.data || {
            subscriptions_count: 0,
            total_revenue: 0,
          }
        );
      } else if (subscriptionsReportResponse.status === "rejected") {
        console.error(
          "Subscription report failed:",
          subscriptionsReportResponse.reason
        );
      }

      // Handle monthly revenue data
      if (
        monthlyRevenueResponse.status === "fulfilled" &&
        monthlyRevenueResponse.value.success
      ) {
        setMonthlyRevenueData(monthlyRevenueResponse.value.data || []);
      } else if (monthlyRevenueResponse.status === "rejected") {
        console.error(
          "Monthly revenue report failed:",
          monthlyRevenueResponse.reason
        );
      }

      // Handle expiry statistics
      if (
        expiryStatsResponse.status === "fulfilled" &&
        expiryStatsResponse.value.success
      ) {
        setExpiryStats(
          expiryStatsResponse.value.data || {
            expiring_today: 0,
            expiring_this_week: 0,
            expired_this_week: 0,
            expiring_next_week: 0,
          }
        );
      }

      // Handle expiring subscriptions with contact numbers - FIXED
      if (
        expiringSubscriptionsResponse.status === "fulfilled" &&
        expiringSubscriptionsResponse.value.success &&
        expiringSubscriptionsResponse.value.data
      ) {
        setExpiringData(expiringSubscriptionsResponse.value.data);
      } else {
        // Set empty data if no data or failed
        setExpiringData({
          expiringSubscriptions: [],
          expiredSubscriptions: [],
        });
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      toast.error("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fixed useEffect with proper dependency
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized status badge to prevent re-renders
  const getStatusBadge = useMemo(
    () =>
      (label: string, isAlert: boolean = false) => {
        if (isAlert) {
          return (
            <span className="px-2 py-1 text-xs rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {label}
            </span>
          );
        }
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center">
            {label}
          </span>
        );
      },
    []
  );

  // Memoized MetricCard component
  const MetricCard = React.memo(
    ({
      title,
      value,
      description,
      icon: Icon,
      isCurrency = false,
      isAlert = false,
    }: {
      title: string;
      value: number;
      description: string;
      icon: any;
      isCurrency?: boolean;
      isAlert?: boolean;
    }) => (
      <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 space-x-4">
        <span className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-700">
          <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h3>
            {getStatusBadge(isAlert ? "Alert" : "Active", isAlert)}
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {isCurrency
              ? `₹${Number(value).toLocaleString()}`
              : Number(value).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
        <div className="text-xs text-slate-400">
          {new Date().toLocaleDateString()}
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 z-20 backdrop-blur-sm rounded-xl">
              <Spinner parentHeight="100%" />
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            {/* Title Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 dark:from-blue-900/30 dark:via-blue-800/30 dark:to-blue-700/30 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-lg">
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    Overview and management of your gym system
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="mt-8">
              <Button
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <MetricCard
              title="Total Users"
              value={userData.users_count || 0}
              description="Total number of users in the system"
              icon={Users}
            />

            <MetricCard
              title="Total Customers"
              value={userData.customers_count || 0}
              description="Users with regular accounts"
              icon={User}
            />

            <MetricCard
              title="Total Subscriptions"
              value={subscriptionData.subscriptions_count || 0}
              description="Number of active subscriptions"
              icon={CreditCard}
            />

            <MetricCard
              title="Total Revenue"
              value={subscriptionData.total_revenue || 0}
              description="Revenue generated from subscriptions"
              icon={IndianRupee}
              isCurrency={true}
            />

            <MetricCard
              title="Expiring Today"
              value={expiryStats.expiring_today || 0}
              description="Subscriptions expiring today"
              icon={AlertTriangle}
              isAlert={expiryStats.expiring_today > 0}
            />

            <MetricCard
              title="Expiring This Week"
              value={expiryStats.expiring_this_week || 0}
              description="Subscriptions expiring in 7 days"
              icon={Clock}
              isAlert={expiryStats.expiring_this_week > 0}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <RevenueChart data={monthlyRevenueData} />
            <SubscriptionExpiryChart
              expiringToday={expiryStats.expiring_today}
              expiringThisWeek={expiryStats.expiring_this_week}
              expiringNextWeek={expiryStats.expiring_next_week}
              expiredThisWeek={expiryStats.expired_this_week}
            />
          </div>

          {/* Expiring Subscriptions Widget */}
          <div className="mb-8">
            <ExpiringSubscriptionsWidget
              expiringSubscriptions={expiringData.expiringSubscriptions}
              expiredSubscriptions={expiringData.expiredSubscriptions}
              onRefresh={fetchExpiringSubscriptionsData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
