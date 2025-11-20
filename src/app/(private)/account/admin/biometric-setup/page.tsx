// src/app/(private)/account/admin/biometric-setup/page.tsx

"use client";

import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Fingerprint,
  Plus,
  Loader2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  MapPin,
  Users,
  Smartphone,
  ArrowLeft,
  Search,
  Filter,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Ban,
  Shield,
  UserPlus,
  AlertTriangle,
  ShieldX,
} from "lucide-react";
import Link from "next/link";
import {
  getAllBiometricUsers,
  getAllUsersWithActiveSubscriptions,
  getAllBiometricDevices,
  getActiveBiometricDevices,
  createBiometricDevice,
  toggleBiometricDeviceStatus,
  deleteBiometricDevice,
  disableBiometricForUser,
  enrollFingerprint,
  blockUserOnAllDevices,
  unblockUserOnAllDevices,
  reEnrollUser,
  type BiometricUser,
  type BiometricDevice,
} from "@/actions/biometric";
import toast from "react-hot-toast";

type UserFilterStatus = "all" | "active" | "inactive" | "blocked";
type ReEnrollFilterStatus = "all" | "not_enrolled" | "deleted";

// Memoized Status Badges Component
const StatusBadges = memo(
  ({
    user,
    compact = false,
  }: {
    user: BiometricUser;
    compact?: boolean;
  }) => {
    const badges = [];

    // Biometric Status badge
    if (user.is_bio_metric_active) {
      badges.push(
        <span
          key="status"
          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 ${
            compact ? "gap-1" : "gap-1.5"
          }`}
        >
          <CheckCircle className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
          Active
        </span>
      );
    } else {
      badges.push(
        <span
          key="status"
          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 ${
            compact ? "gap-1" : "gap-1.5"
          }`}
        >
          <XCircle className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
          Inactive
        </span>
      );
    }

    // Access badge - UPDATED: Show "Denied" when blocked
    if (user.is_bio_metric_active) {
      if (user.bio_metric_access) {
        badges.push(
          <span
            key="access"
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 ${
              compact ? "gap-1" : "gap-1.5"
            }`}
          >
            <ShieldCheck className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
            Granted
          </span>
        );
      } else {
        badges.push(
          <span
            key="access"
            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 ${
              compact ? "gap-1" : "gap-1.5"
            }`}
          >
            <ShieldX className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
            Denied
          </span>
        );
      }
    }

    return <div className="flex flex-wrap gap-1.5">{badges}</div>;
  }
);

StatusBadges.displayName = "StatusBadges";

export default function BiometricSetupPage() {
  const [enrolledUsers, setEnrolledUsers] = useState<BiometricUser[]>([]);
  const [allUsers, setAllUsers] = useState<BiometricUser[]>([]);
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [activeDevices, setActiveDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reEnrollSearchTerm, setReEnrollSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<UserFilterStatus>("all");
  const [reEnrollFilterStatus, setReEnrollFilterStatus] =
    useState<ReEnrollFilterStatus>("all");
  const [selectedFingerIndex, setSelectedFingerIndex] = useState<{
    [key: number]: string;
  }>({});
  const [selectedDeviceSerial, setSelectedDeviceSerial] = useState<{
    [key: number]: string;
  }>({});
  const [newDevice, setNewDevice] = useState({
    serial_no: "",
    device_name: "",
    location: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [enrolledResult, allUsersResult, devicesResult, activeDevicesResult] =
        await Promise.all([
          getAllBiometricUsers(),
          getAllUsersWithActiveSubscriptions(),
          getAllBiometricDevices(),
          getActiveBiometricDevices(),
        ]);

      if (enrolledResult.success && enrolledResult.data) {
        setEnrolledUsers(enrolledResult.data);
      }

      if (allUsersResult.success && allUsersResult.data) {
        setAllUsers(allUsersResult.data);
      }

      if (devicesResult.success && devicesResult.data) {
        setDevices(devicesResult.data);
      }

      if (activeDevicesResult.success && activeDevicesResult.data) {
        setActiveDevices(activeDevicesResult.data);
      }
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered enrolled users
  const filteredEnrolledUsers = useMemo(() => {
    return enrolledUsers.filter((user) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.biometric_device_id?.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filterStatus === "all") return true;
      if (filterStatus === "active")
        return user.is_bio_metric_active && user.bio_metric_access;
      if (filterStatus === "inactive") return !user.is_bio_metric_active;
      if (filterStatus === "blocked")
        return user.is_bio_metric_active && !user.bio_metric_access;

      return true;
    });
  }, [enrolledUsers, searchTerm, filterStatus]);

  // Users available for re-enrollment
  const usersForReEnrollment = useMemo(() => {
    return allUsers.filter((user) => {
      const term = reEnrollSearchTerm.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (reEnrollFilterStatus === "all") {
        return !user.is_bio_metric_active || !user.bio_metric_access;
      }
      if (reEnrollFilterStatus === "not_enrolled") {
        return !user.biometric_device_id;
      }
      if (reEnrollFilterStatus === "deleted") {
        return user.biometric_device_id && !user.is_bio_metric_active;
      }

      return true;
    });
  }, [allUsers, reEnrollSearchTerm, reEnrollFilterStatus]);

  // Device Management
  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.serial_no) {
      toast.error("Serial number is required");
      return;
    }

    setAdding(true);
    try {
      const result = await createBiometricDevice(
        newDevice.serial_no,
        newDevice.device_name || undefined,
        newDevice.location || undefined
      );

      if (!result.success) throw new Error(result.message);

      toast.success("Device added successfully");
      setNewDevice({ serial_no: "", device_name: "", location: "" });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add device");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleDevice = async (deviceId: number, currentStatus: boolean) => {
    try {
      const result = await toggleBiometricDeviceStatus(deviceId, currentStatus);
      if (!result.success) throw new Error(result.message);
      toast.success(result.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update device");
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!confirm("Are you sure you want to delete this device?")) return;

    try {
      const result = await deleteBiometricDevice(deviceId);
      if (!result.success) throw new Error(result.message);
      toast.success(result.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete device");
    }
  };

  // User Management - Enrolled Users
  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Delete biometric access for ${userName}?`)) return;

    setActionLoading(`delete-${userId}`);
    try {
      const result = await disableBiometricForUser(userId);
      if (result.success) {
        toast.success(`Biometric access removed for ${userName}`);
        fetchData();
      } else {
        toast.error(result.message || "Failed to remove access");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove access");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (userId: number, userName: string) => {
    setActionLoading(`block-${userId}`);
    try {
      const result = await blockUserOnAllDevices(userId, userName);
      if (result.success) {
        toast.success(`${userName} blocked on all devices`);
        // Refresh data to update UI
        await fetchData();
      } else {
        toast.error(result.message || "Failed to block user");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to block user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: number, userName: string) => {
    setActionLoading(`unblock-${userId}`);
    try {
      const result = await unblockUserOnAllDevices(userId, userName);
      if (result.success) {
        toast.success(`${userName} unblocked on all devices`);
        // Refresh data to update UI
        await fetchData();
      } else {
        toast.error(result.message || "Failed to unblock user");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to unblock user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnrollFingerprint = async (
    userId: number,
    employeeCode: string,
    userName: string,
    serialNumber: string,
    fingerIndex: string
  ) => {
    if (!fingerIndex) {
      toast.error("Please select a finger index");
      return;
    }

    if (!serialNumber) {
      toast.error("Please select a device");
      return;
    }

    setActionLoading(`enroll-${userId}`);
    try {
      const result = await enrollFingerprint(employeeCode, serialNumber, fingerIndex);
      if (result.success) {
        toast.success(
          `Fingerprint enrollment initiated for ${userName}. Please scan finger ${fingerIndex} on device ${serialNumber}.`,
          { duration: 5000 }
        );
      } else {
        toast.error(result.message || "Failed to initiate enrollment");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate enrollment");
    } finally {
      setActionLoading(null);
    }
  };

  // Re-enrollment
  const handleReEnroll = async (userId: number, userName: string) => {
    setActionLoading(`reenroll-${userId}`);
    try {
      const result = await reEnrollUser(userId, userName);
      if (result.success) {
        toast.success(`${userName} re-enrolled successfully`);
        fetchData();
      } else {
        toast.error(result.message || "Failed to re-enroll user");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to re-enroll user");
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const clearEnrolledFilters = useCallback(() => {
    setSearchTerm("");
    setFilterStatus("all");
  }, []);

  const clearReEnrollFilters = useCallback(() => {
    setReEnrollSearchTerm("");
    setReEnrollFilterStatus("all");
  }, []);

  // Initialize finger index and device serial for each user
  useEffect(() => {
    const initialFingerIndex: { [key: number]: string } = {};
    const initialDeviceSerial: { [key: number]: string } = {};
    
    enrolledUsers.forEach((user) => {
      initialFingerIndex[user.id] = "1";
      // Set first active device as default
      initialDeviceSerial[user.id] = activeDevices[0]?.serial_no || "";
    });
    
    setSelectedFingerIndex(initialFingerIndex);
    setSelectedDeviceSerial(initialDeviceSerial);
  }, [enrolledUsers, activeDevices]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center animate-pulse">
              <Fingerprint className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded mt-2 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="relative">
          {/* Enhanced Header Section */}
          <div className="mb-8">
            {/* Navigation */}
            <div className="mb-6">
              <Button
                variant="outline"
                size="sm"
                className="group border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-200"
              >
                <Link href="/account" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            </div>

            {/* Title Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 dark:from-blue-900/30 dark:via-blue-800/30 dark:to-blue-700/30 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-lg">
                    <Fingerprint className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-100 dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                    Biometric Management
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    Manage devices and user access control
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Total Devices
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {devices.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Active Devices
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {activeDevices.length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Enrolled Users
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {enrolledUsers.length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Available to Enroll
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {usersForReEnrollment.length}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <UserPlus className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs - FIXED: Better mobile responsiveness */}
          <Tabs defaultValue="enrolled" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto md:h-11">
              <TabsTrigger value="enrolled" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Enrolled Users</span>
                <span className="sm:hidden">Enrolled</span>
              </TabsTrigger>
              <TabsTrigger value="reenroll" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
                <UserPlus className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Re-enroll</span>
                <span className="sm:hidden">Re-enroll</span>
              </TabsTrigger>
              <TabsTrigger value="devices" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm py-2">
                <Smartphone className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Devices</span>
                <span className="sm:hidden">Devices</span>
              </TabsTrigger>
            </TabsList>

            {/* Enrolled Users Tab */}
            <TabsContent value="enrolled" className="space-y-6">
              {/* Filters and Actions */}
              <div className="mb-6 space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search enrolled users by name, email, or employee code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) =>
                        setFilterStatus(e.target.value as UserFilterStatus)
                      }
                      className="w-full lg:w-40 pl-10 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none"
                    >
                      <option value="all">All Users</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={fetchData}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {filteredEnrolledUsers.length} of {enrolledUsers.length}{" "}
                  enrolled users
                </div>
              </div>

              {/* No Users Found */}
              {enrolledUsers.length === 0 && !loading && (
                <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                  <Fingerprint className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No enrolled users found in the system.
                  </p>
                </div>
              )}

              {/* No Search Results */}
              {enrolledUsers.length > 0 &&
                !filteredEnrolledUsers.length &&
                !loading && (
                  <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      No users match your current search and filter criteria.
                    </p>
                    <Button
                      variant="outline"
                      onClick={clearEnrolledFilters}
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}

              {/* Enrolled Users List - Desktop */}
              {filteredEnrolledUsers.length > 0 && !loading && (
                <>
                  <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-12 gap-2 items-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <div className="col-span-2">User</div>
                        <div className="col-span-1">Code</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Device</div>
                        <div className="col-span-1">Finger</div>
                        <div className="col-span-5 text-right">Actions</div>
                      </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredEnrolledUsers.map((user) => (
                        <div
                          key={user.id}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="grid grid-cols-12 gap-2 items-center">
                            {/* User */}
                            <div className="col-span-2">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-12 w-12 border-2 border-slate-200 dark:border-slate-700">
                                  <AvatarImage
                                    src={user.clerk_url || user.profile_image || ""}
                                    alt={user.name}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Employee Code */}
                            <div className="col-span-1">
                              <span className="text-xs font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border block truncate">
                                {user.biometric_device_id || "N/A"}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                              <StatusBadges user={user} compact />
                            </div>

                            {/* Device Serial Dropdown */}
                            <div className="col-span-1">
                              <Select
                                value={selectedDeviceSerial[user.id] || activeDevices[0]?.serial_no || ""}
                                onValueChange={(value) =>
                                  setSelectedDeviceSerial((prev) => ({
                                    ...prev,
                                    [user.id]: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-full">
                                  <SelectValue placeholder="Device" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activeDevices.map((device) => (
                                    <SelectItem key={device.id} value={device.serial_no}>
                                      {device.serial_no || device.device_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Finger Index Dropdown */}
                            <div className="col-span-1">
                              <Select
                                value={selectedFingerIndex[user.id] || "1"}
                                onValueChange={(value) =>
                                  setSelectedFingerIndex((prev) => ({
                                    ...prev,
                                    [user.id]: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-full">
                                  <SelectValue placeholder="Finger" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 10 }, (_, i) => i + 1).map(
                                    (num) => (
                                      <SelectItem key={num} value={num.toString()}>
                                        Finger {num}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Actions */}
                            <div className="col-span-5 flex items-center justify-end gap-1.5">
                              {/* Enroll Fingerprint Button */}
                              {user.is_bio_metric_active && user.biometric_device_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleEnrollFingerprint(
                                      user.id,
                                      user.biometric_device_id!,
                                      user.name,
                                      selectedDeviceSerial[user.id] || activeDevices[0]?.serial_no || "",
                                      selectedFingerIndex[user.id] || "1"
                                    )
                                  }
                                  disabled={actionLoading === `enroll-${user.id}`}
                                  className="text-xs h-8 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                  {actionLoading === `enroll-${user.id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Fingerprint className="h-3 w-3 mr-1" />
                                      Enroll
                                    </>
                                  )}
                                </Button>
                              )}

                              {/* Block Button */}
                              {user.is_bio_metric_active && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBlockUser(user.id, user.name)}
                                  disabled={
                                    !user.bio_metric_access ||
                                    actionLoading === `block-${user.id}`
                                  }
                                  className="text-xs h-8 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === `block-${user.id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Ban className="h-3 w-3 mr-1" />
                                      Block
                                    </>
                                  )}
                                </Button>
                              )}

                              {/* Unblock Button */}
                              {user.is_bio_metric_active && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnblockUser(user.id, user.name)}
                                  disabled={
                                    user.bio_metric_access ||
                                    actionLoading === `unblock-${user.id}`
                                  }
                                  className="text-xs h-8 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === `unblock-${user.id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Shield className="h-3 w-3 mr-1" />
                                      Unblock
                                    </>
                                  )}
                                </Button>
                              )}

                              {/* Delete Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                disabled={actionLoading === `delete-${user.id}`}
                                className="text-xs h-8 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                {actionLoading === `delete-${user.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {filteredEnrolledUsers.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4"
                      >
                        {/* User Info */}
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-slate-200 dark:border-slate-700">
                            <AvatarImage
                              src={user.clerk_url || user.profile_image || ""}
                              alt={user.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {/* Employee Code */}
                        <div className="mb-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Employee Code
                          </p>
                          <span className="text-xs font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border">
                            {user.biometric_device_id || "N/A"}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                          <StatusBadges user={user} compact={true} />
                        </div>

                        {/* Device Select */}
                        <div className="mb-3">
                          <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block">
                            Select Device
                          </Label>
                          <Select
                            value={selectedDeviceSerial[user.id] || activeDevices[0]?.serial_no || ""}
                            onValueChange={(value) =>
                              setSelectedDeviceSerial((prev) => ({
                                ...prev,
                                [user.id]: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 text-xs w-full">
                              <SelectValue placeholder="Select device" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeDevices.map((device) => (
                                <SelectItem key={device.id} value={device.serial_no}>
                                  {device.device_name || device.serial_no}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Finger Select */}
                        <div className="mb-3">
                          <Label className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 block">
                            Select Finger
                          </Label>
                          <Select
                            value={selectedFingerIndex[user.id] || "1"}
                            onValueChange={(value) =>
                              setSelectedFingerIndex((prev) => ({
                                ...prev,
                                [user.id]: value,
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 text-xs w-full">
                              <SelectValue placeholder="Select finger" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => i + 1).map(
                                (num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    Finger {num}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {user.is_bio_metric_active && user.biometric_device_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleEnrollFingerprint(
                                  user.id,
                                  user.biometric_device_id!,
                                  user.name,
                                  selectedDeviceSerial[user.id] || activeDevices[0]?.serial_no || "",
                                  selectedFingerIndex[user.id] || "1"
                                )
                              }
                              disabled={actionLoading === `enroll-${user.id}`}
                              className="flex-1 text-xs border-blue-200 text-blue-600"
                            >
                              {actionLoading === `enroll-${user.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Fingerprint className="h-3 w-3 mr-1" />
                                  Enroll
                                </>
                              )}
                            </Button>
                          )}

                          {user.is_bio_metric_active && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBlockUser(user.id, user.name)}
                                disabled={
                                  !user.bio_metric_access ||
                                  actionLoading === `block-${user.id}`
                                }
                                className="flex-1 text-xs border-amber-200 text-amber-600 disabled:opacity-50"
                              >
                                {actionLoading === `block-${user.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Ban className="h-3 w-3 mr-1" />
                                    Block
                                  </>
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnblockUser(user.id, user.name)}
                                disabled={
                                  user.bio_metric_access ||
                                  actionLoading === `unblock-${user.id}`
                                }
                                className="flex-1 text-xs border-green-200 text-green-600 disabled:opacity-50"
                              >
                                {actionLoading === `unblock-${user.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Shield className="h-3 w-3 mr-1" />
                                    Unblock
                                  </>
                                )}
                              </Button>
                            </>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={actionLoading === `delete-${user.id}`}
                            className="flex-1 text-xs border-red-200 text-red-600"
                          >
                            {actionLoading === `delete-${user.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Re-enrollment Tab */}
            <TabsContent value="reenroll" className="space-y-6">
              {/* Filters and Actions */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search users for re-enrollment..."
                      value={reEnrollSearchTerm}
                      onChange={(e) => setReEnrollSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={reEnrollFilterStatus}
                      onChange={(e) =>
                        setReEnrollFilterStatus(
                          e.target.value as ReEnrollFilterStatus
                        )
                      }
                      className="w-full lg:w-48 pl-10 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none"
                    >
                      <option value="all">All Available</option>
                      <option value="not_enrolled">Never Enrolled</option>
                      <option value="deleted">Previously Deleted</option>
                    </select>
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={fetchData}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {usersForReEnrollment.length} users available for
                  enrollment
                </div>
              </div>

              {/* No Users Found */}
              {allUsers.length === 0 && !loading && (
                <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                  <UserPlus className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No users with active subscriptions found.
                  </p>
                </div>
              )}

              {/* No Search Results */}
              {allUsers.length > 0 &&
                !usersForReEnrollment.length &&
                !loading && (
                  <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                    <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {reEnrollSearchTerm || reEnrollFilterStatus !== "all"
                        ? "No users match your current search and filter criteria."
                        : "All users are enrolled."}
                    </p>
                    {(reEnrollSearchTerm || reEnrollFilterStatus !== "all") && (
                      <Button
                        variant="outline"
                        onClick={clearReEnrollFilters}
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}

              {/* Re-enrollment Users List - Desktop */}
              {usersForReEnrollment.length > 0 && !loading && (
                <>
                  <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-700/50 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <div className="col-span-3">User</div>
                        <div className="col-span-2">Previous Code</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Device Info</div>
                        <div className="col-span-3 text-right">Actions</div>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                      {usersForReEnrollment.map((user) => (
                        <div
                          key={user.id}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-3">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-12 w-12 border-2 border-slate-200 dark:border-slate-700">
                                  <AvatarImage
                                    src={user.clerk_url || user.profile_image || ""}
                                    alt={user.name}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-xs font-semibold">
                                    {getInitials(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="col-span-2">
                              <span className="text-xs font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border">
                                {user.biometric_device_id || "New User"}
                              </span>
                            </div>

                            <div className="col-span-2">
                              <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 gap-1.5">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Active
                              </span>
                            </div>

                            <div className="col-span-2">
                              <div className="text-xs">
                                <p className="text-slate-600 dark:text-slate-400 truncate">
                                  {activeDevices[0]?.serial_no || "N/A"}
                                </p>
                                <p className="text-slate-500 dark:text-slate-500 truncate">
                                  Finger 1
                                </p>
                              </div>
                            </div>

                            <div className="col-span-3 flex items-center justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleReEnroll(user.id, user.name)}
                                disabled={actionLoading === `reenroll-${user.id}`}
                                className="text-xs bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                              >
                                {actionLoading === `reenroll-${user.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Enroll
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {usersForReEnrollment.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <Avatar className="h-12 w-12 border-2 border-slate-200 dark:border-slate-700">
                            <AvatarImage
                              src={user.clerk_url || user.profile_image || ""}
                              alt={user.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm font-bold">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Previous Code
                            </p>
                            <span className="text-xs font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border">
                              {user.biometric_device_id || "New"}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Device
                            </p>
                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                              {activeDevices[0]?.serial_no || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Active
                          </span>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleReEnroll(user.id, user.name)}
                            disabled={actionLoading === `reenroll-${user.id}`}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                          >
                            {actionLoading === `reenroll-${user.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-3 w-3 mr-1" />
                                Enroll
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Devices Tab - FIXED: Removed extra space and fixed button overflow */}
            <TabsContent value="devices" className="space-y-4">
              <Card className="shadow-lg border-slate-200 dark:border-slate-700">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Plus className="h-5 w-5" />
                    Add New Device
                  </CardTitle>
                  <CardDescription>
                    Register a new biometric device to the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleAddDevice} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="serial_no" className="font-semibold">
                          Serial Number *
                        </Label>
                        <Input
                          id="serial_no"
                          value={newDevice.serial_no}
                          onChange={(e) =>
                            setNewDevice({
                              ...newDevice,
                              serial_no: e.target.value,
                            })
                          }
                          placeholder="e.g., EUF7252300060"
                          required
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="device_name" className="font-semibold">
                          Device Name
                        </Label>
                        <Input
                          id="device_name"
                          value={newDevice.device_name}
                          onChange={(e) =>
                            setNewDevice({
                              ...newDevice,
                              device_name: e.target.value,
                            })
                          }
                          placeholder="e.g., Main Entrance"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location" className="font-semibold">
                          Location
                        </Label>
                        <Input
                          id="location"
                          value={newDevice.location}
                          onChange={(e) =>
                            setNewDevice({
                              ...newDevice,
                              location: e.target.value,
                            })
                          }
                          placeholder="e.g., Ground Floor"
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setNewDevice({
                            serial_no: "",
                            device_name: "",
                            location: "",
                          })
                        }
                      >
                        Clear
                      </Button>
                      <Button
                        type="submit"
                        disabled={adding}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {adding ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Device
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-slate-200 dark:border-slate-700">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-5 w-5" />
                    Registered Devices ({devices.length})
                  </CardTitle>
                  <CardDescription>Manage all biometric devices</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {devices.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Fingerprint className="h-12 w-12 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        No devices registered
                      </h3>
                      <p className="text-slate-500 text-sm">
                        Add your first biometric device to get started
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {devices.map((device) => (
                        <div
                          key={device.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 hover:border-purple-200 dark:hover:border-purple-800 gap-4"
                        >
                          <div className="flex items-start sm:items-center space-x-4 flex-1 min-w-0">
                            <div
                              className={`h-14 w-14 flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg ${
                                device.is_active
                                  ? "bg-gradient-to-br from-green-400 to-emerald-500"
                                  : "bg-gradient-to-br from-slate-300 to-slate-400"
                              }`}
                            >
                              <Fingerprint
                                className={`h-7 w-7 ${
                                  device.is_active
                                    ? "text-white"
                                    : "text-slate-600"
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-bold text-base sm:text-lg truncate">
                                  {device.device_name || "Unnamed Device"}
                                </h3>
                                {device.is_active ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-mono break-all">
                                Serial: {device.serial_no}
                              </p>
                              {device.location && (
                                <p className="text-xs sm:text-sm text-slate-500 flex items-center mt-1">
                                  <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                  <span className="truncate">{device.location}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                              variant={device.is_active ? "outline" : "default"}
                              size="sm"
                              onClick={() =>
                                handleToggleDevice(device.id, device.is_active)
                              }
                              className={`flex-1 sm:flex-initial text-xs sm:text-sm ${
                                device.is_active
                                  ? "border-slate-300 dark:border-slate-600"
                                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              }`}
                            >
                              {device.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDevice(device.id)}
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
