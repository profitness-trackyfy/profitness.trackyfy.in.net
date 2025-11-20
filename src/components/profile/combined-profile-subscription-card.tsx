"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Phone, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Save,
  Shield,
  Mail,
  UserCheck,
  Edit3,
  Award,
  Sparkles,
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUserContactNumber } from '@/actions/users';
import usersGlobalStore, { IUsersGlobalStore } from '@/global-store/users-store';
import SubscriptionStats from '@/app/(private)/account/_components/subscription-stats';
import SubscriptionProgressBar from '@/app/(private)/account/_components/subscription-progress-bar';
import dayjs from 'dayjs';

interface CombinedProfileSubscriptionCardProps {
  onProfileComplete?: () => void;
  subscriptionProgress?: {
    progressPercentage: number;
    daysRemaining: number;
    totalDays: number;
    isExpiring: boolean;
    isExpired: boolean;
    status: "expired" | "expiring" | "active";
  } | null;
  onSubscriptionPlanClick?: () => void;
}

const CombinedProfileSubscriptionCard: React.FC<CombinedProfileSubscriptionCardProps> = ({ 
  onProfileComplete, 
  subscriptionProgress,
  onSubscriptionPlanClick 
}) => {
  const { user, updateUserContactNumber: updateStoreContactNumber, currentSubscription } = usersGlobalStore() as IUsersGlobalStore;
  const [contactNo, setContactNo] = useState(user?.contact_no || '');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!user?.contact_no);
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactNo || contactNo.length < 10) {
      toast.error('Please enter a valid 10-digit contact number');
      return;
    }

    setLoading(true);
    
    try {
      const result = await updateUserContactNumber(contactNo);
      
      if (result.success) {
        updateStoreContactNumber(contactNo);
        toast.success('Contact number updated successfully!');
        setIsExpanded(false);
        onProfileComplete?.();
      } else {
        toast.error(result.message || 'Failed to update contact number');
      }
    } catch (error) {
      toast.error('An error occurred while updating contact number');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = !!(user?.contact_no && user?.name && user?.email);
  const completionPercentage = Math.round(
    ((user?.name ? 1 : 0) + (user?.email ? 1 : 0) + (user?.contact_no ? 1 : 0)) / 3 * 100
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden h-full">
      {/* Header with Gradient and Tabs */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              {user?.profile_image ? (
                <img 
                  src={user.profile_image} 
                  alt={user.name || 'User'} 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                Account Overview
              </h3>
              <p className="text-indigo-600 dark:text-indigo-400 text-sm mt-1 flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                Profile & Subscription
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-black/10 dark:bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Profile ({completionPercentage}%)
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'subscription'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Subscription
            {subscriptionProgress && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                subscriptionProgress.status === 'expired' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : subscriptionProgress.status === 'expiring'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {subscriptionProgress.status === 'expired' ? 'Expired' : 
                 subscriptionProgress.status === 'expiring' ? 'Expiring' : 'Active'}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* 2x2 Grid Layout for Profile */}
            <div className="grid grid-cols-2 gap-4">
              {/* Name - Top Left */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200 h-24 flex flex-col justify-center">
                <div className="flex items-center space-x-2 mb-2">
                  <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Name</span>
                  {user?.name && <CheckCircle className="h-3 w-3 text-emerald-500 ml-auto" />}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'Not provided'}
                </span>
              </div>

              {/* Phone - Top Right */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200 h-24 flex flex-col justify-center">
                <div className="flex items-center space-x-2 mb-2">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Phone</span>
                  {user?.contact_no && <CheckCircle className="h-3 w-3 text-emerald-500 ml-auto" />}
                  {user?.contact_no && !isExpanded && (
                    <Button
                      onClick={() => setIsExpanded(true)}
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ml-auto"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.contact_no || 'Not provided'}
                </span>
              </div>

              {/* Email - Bottom Left */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-200 h-24 flex flex-col justify-center">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</span>
                  {user?.email && <CheckCircle className="h-3 w-3 text-emerald-500 ml-auto" />}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate" title={user?.email}>
                  {user?.email || 'Not provided'}
                </span>
              </div>

              {/* Profile Status - Bottom Right */}
              <div className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 h-24 flex flex-col justify-center ${
                isProfileComplete 
                  ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/50' 
                  : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-700/50'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isProfileComplete ? (
                    <Award className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</span>
                </div>
                <span className={`text-sm font-semibold ${
                  isProfileComplete 
                    ? 'text-emerald-800 dark:text-emerald-200' 
                    : 'text-amber-800 dark:text-amber-200'
                }`}>
                  {isProfileComplete ? 'Complete' : 'Incomplete'}
                </span>
              </div>
            </div>

            {/* Contact Number Actions */}
            {!user?.contact_no && !isExpanded && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    Contact number required
                  </span>
                  <Button
                    onClick={() => setIsExpanded(true)}
                    size="sm"
                    className="h-8 px-3 text-sm bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Add Now
                  </Button>
                </div>
              </div>
            )}

            {/* Contact Form */}
            {isExpanded && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Label htmlFor="contact" className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Number
                  </Label>
                  <div className="flex space-x-3">
                    <Input
                      id="contact"
                      type="tel"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      placeholder="Enter 10-digit number"
                      className="text-sm h-10 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />
                    <Button
                      type="submit"
                      disabled={loading || !contactNo || contactNo.length < 10}
                      size="sm"
                      className="h-10 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white"
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
                      setContactNo(user.contact_no || '');
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
          </div>
        )}

        {/* Subscription Tab Content */}
        {activeTab === 'subscription' && (
          <div className="space-y-4">
            {currentSubscription && subscriptionProgress ? (
              <>
                {/* Subscription Status Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Subscription Progress
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center shadow-md ${
                      subscriptionProgress.status === "expired"
                        ? "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                        : subscriptionProgress.status === "expiring"
                        ? "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        : "bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    {subscriptionProgress.status === "expired" ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Expired
                      </>
                    ) : subscriptionProgress.status === "expiring" ? (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Expiring Soon
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Active
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <SubscriptionProgressBar
                  progress={subscriptionProgress.progressPercentage}
                  daysRemaining={subscriptionProgress.daysRemaining}
                  status={subscriptionProgress.status}
                />

                {/* Subscription Stats */}
                <SubscriptionStats subscriptionProgress={subscriptionProgress} />

                {/* Quick Subscription Info Grid */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-3 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Plan</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {currentSubscription?.plan?.name || 'Unknown Plan'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50/80 dark:bg-slate-700/30 rounded-lg border border-slate-200/50 dark:border-slate-600/50">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">End Date</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {dayjs(currentSubscription?.end_date).format("MMM DD, YYYY")}
                    </span>
                  </div>
                </div>

                {/* Expiring Alert */}
                {subscriptionProgress.isExpiring && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl shadow-lg">
                    <div className="flex items-start space-x-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-amber-800 dark:text-amber-200 font-bold text-base">
                          🚨 Subscription Expiring Soon!
                        </h4>
                        <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                          Your subscription expires in {subscriptionProgress.daysRemaining} day(s).
                        </p>
                        <Button
                          onClick={onSubscriptionPlanClick}
                          size="sm"
                          className="mt-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <TrendingUp size={14} className="mr-2" />
                          Renew Now
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No Subscription State */
              <div className="text-center space-y-4 py-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100 dark:from-violet-900/30 dark:via-purple-900/30 dark:to-fuchsia-900/30 rounded-full flex items-center justify-center shadow-lg">
                  <Calendar className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                    No Active Subscription
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Get started with one of our subscription plans
                  </p>
                </div>
                <Button 
                  onClick={onSubscriptionPlanClick}
                  className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  View Plans
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedProfileSubscriptionCard;
