"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  Save,
  Shield,
  Mail,
  UserCheck,
  Edit3,
  Award,
  Sparkles,
  Calendar,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { updateUserContactNumber } from "@/actions/users";
import usersGlobalStore, {
  IUsersGlobalStore,
} from "@/global-store/users-store";

interface ProfileCompletionCardProps {
  onProfileComplete?: () => void;
}

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  onProfileComplete,
}) => {
  const { user, updateUserContactNumber: updateStoreContactNumber } =
    usersGlobalStore() as IUsersGlobalStore;
  const [contactNo, setContactNo] = useState(user?.contact_no || "");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!user?.contact_no);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactNo || contactNo.length < 10) {
      toast.error("Please enter a valid 10-digit contact number");
      return;
    }

    setLoading(true);

    try {
      const result = await updateUserContactNumber(contactNo);

      if (result.success) {
        updateStoreContactNumber(contactNo);
        toast.success("Contact number updated successfully!");
        setIsExpanded(false);
        onProfileComplete?.();
      } else {
        toast.error(result.message || "Failed to update contact number");
      }
    } catch (error) {
      toast.error("An error occurred while updating contact number");
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = !!(user?.contact_no && user?.name && user?.email);
  const completionPercentage = Math.round(
    (((user?.name ? 1 : 0) +
      (user?.email ? 1 : 0) +
      (user?.contact_no ? 1 : 0)) /
      3) *
      100
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-full max-w-full">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.name || "User"}
                className="h-12 w-12 sm:h-10 sm:w-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
              Profile
            </h3>
            <p className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm mt-1 flex items-center min-w-0">
              <Sparkles className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{completionPercentage}% Complete</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Responsive Grid Layout - 2x2 on mobile, 2x2 on larger screens */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          {/* Name Card */}
          <div className="group p-3 sm:p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 min-h-[90px] sm:min-h-[100px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide truncate">
                  Name
                </span>
              </div>
              {user?.name && (
                <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                </div>
              )}
            </div>
            <div className="mt-2 min-w-0 overflow-hidden">
              <div
                className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                title={user?.name || "Not provided"}
              >
                {user?.name || "Not provided"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.name
                  ? "Verified from account"
                  : "Please update your name"}
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="group p-3 sm:p-4 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 min-h-[90px] sm:min-h-[100px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div className="p-1 sm:p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide truncate">
                  Phone
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {user?.contact_no && (
                  <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                  </div>
                )}
                {user?.contact_no && !isExpanded && (
                  <Button
                    onClick={() => setIsExpanded(true)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-2 min-w-0 overflow-hidden">
              <div
                className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                title={user?.contact_no || "Not provided"}
              >
                {user?.contact_no || "Not provided"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.contact_no
                  ? "Verified number"
                  : "Add your contact number"}
              </div>
            </div>
          </div>

          {/* Email Card */}
          <div className="group p-3 sm:p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border border-purple-200/50 dark:border-purple-700/50 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 min-h-[90px] sm:min-h-[100px] flex flex-col justify-between overflow-hidden">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div className="p-1 sm:p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide truncate">
                  Email
                </span>
              </div>
              {user?.email && (
                <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-emerald-600" />
                </div>
              )}
            </div>
            <div className="mt-2 min-w-0 overflow-hidden">
              <div
                className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                title={user?.email || "Not provided"}
              >
                {user?.email || "Not provided"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user?.email ? "Primary email address" : "Email not available"}
              </div>
            </div>
          </div>

          {/* Profile Status Card */}
          <div
            className={`group p-3 sm:p-4 rounded-xl border shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 min-h-[90px] sm:min-h-[100px] flex flex-col justify-between overflow-hidden ${
              isProfileComplete
                ? "bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-900/10 dark:to-green-900/10 border-emerald-200/50 dark:border-emerald-700/50"
                : "bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200/50 dark:border-amber-700/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <div
                  className={`p-1 sm:p-1.5 rounded-lg flex-shrink-0 ${
                    isProfileComplete
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : "bg-amber-100 dark:bg-amber-900/30"
                  }`}
                >
                  {isProfileComplete ? (
                    <Award className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                  )}
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide truncate ${
                    isProfileComplete
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  Status
                </span>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                  isProfileComplete
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                }`}
              >
                {completionPercentage}%
              </div>
            </div>
            <div className="mt-2 min-w-0 overflow-hidden">
              <div
                className={`text-sm font-bold truncate ${
                  isProfileComplete
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-amber-800 dark:text-amber-200"
                }`}
              >
                {isProfileComplete ? "Complete" : "Incomplete"}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {isProfileComplete
                  ? "All fields verified"
                  : `${
                      3 - Math.round(completionPercentage / 33.33)
                    } fields missing`}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Number Required Alert */}
        {!user?.contact_no && !isExpanded && (
          <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <span className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                Contact number required
              </span>
              <Button
                onClick={() => setIsExpanded(true)}
                size="sm"
                className="h-8 px-3 text-sm bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto flex-shrink-0"
              >
                Add Now
              </Button>
            </div>
          </div>
        )}

        {/* Contact Form */}
        {isExpanded && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Label
                htmlFor="contact"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center"
              >
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Contact Number</span>
              </Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  id="contact"
                  type="tel"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="Enter 10-digit number"
                  className="text-sm h-10 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 flex-1 min-w-0"
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
                <Button
                  type="submit"
                  disabled={loading || !contactNo || contactNo.length < 10}
                  size="sm"
                  className="h-10 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto flex-shrink-0"
                >
                  {loading ? (
                    <div className="h-4 w-4 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                Required for account notifications and support
              </p>
            </div>

            {user?.contact_no && (
              <Button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setContactNo(user.contact_no || "");
                }}
                variant="outline"
                size="sm"
                className="w-full h-10 text-sm"
              >
                Cancel
              </Button>
            )}
          </form>
        )}

        {/* Profile Status Message */}
        {!isExpanded && (
          <div
            className={`p-3 rounded-lg border overflow-hidden ${
              isProfileComplete
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {isProfileComplete ? (
                <Award className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              )}
              <span
                className={`text-sm font-medium truncate ${
                  isProfileComplete
                    ? "text-emerald-800 dark:text-emerald-200"
                    : "text-amber-800 dark:text-amber-200"
                }`}
              >
                {isProfileComplete
                  ? "Profile is complete and ready to use"
                  : "Complete your profile to unlock all features"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletionCard;
