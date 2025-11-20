"use client";
import React, { useState } from "react";
import userGlobalStore, { IUsersGlobalStore } from "@/global-store/users-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  User,
  Key,
  Calendar,
  Shield,
  Phone,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Copy,
  Crown,
  Activity,
  Settings,
  Sparkles,
  MapPin,
  Globe
} from "lucide-react";
import PageTitle from "@/components/ui/page-title";
import { updateUserContactNumber } from "@/actions/users";
import toast from "react-hot-toast";
import dayjs from "dayjs";

function UserProfilePage() {
  const { user, updateUserContactNumber: updateStoreContactNumber } = userGlobalStore() as IUsersGlobalStore;
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactNo, setContactNo] = useState(user?.contact_no || '');
  const [loading, setLoading] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
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
        setIsEditingContact(false);
      } else {
        toast.error(result.message || 'Failed to update contact number');
      }
    } catch (error) {
      toast.error('An error occurred while updating contact number');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const isProfileComplete = !!(user?.contact_no && user?.name && user?.email);
  const completionPercentage = Math.round(
    ((user?.name ? 1 : 0) + (user?.email ? 1 : 0) + (user?.contact_no ? 1 : 0)) / 3 * 100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30">
      <div className="container mx-auto py-8 px-4">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <PageTitle title="My Profile" />
              <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Manage your account information and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Enhanced Profile Summary Card */}
          <div className="xl:col-span-1">
            <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Profile Header with Gradient */}
              <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-fuchsia-900/20 p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-700 shadow-xl">
                    <AvatarImage src={user?.profile_image || ""} alt={user?.name} />
                    <AvatarFallback className="text-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-white dark:border-slate-700 flex items-center justify-center">
                    {isProfileComplete ? (
                      <CheckCircle className="h-3 w-3 text-white" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {user?.name || 'User Name'}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center justify-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {user?.email}
                </p>

                {/* Profile Completion */}
                <div className="mt-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Profile Completion</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full transition-all duration-700"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Stats */}
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {user?.is_admin ? (
                      <Crown className="h-4 w-4 text-amber-600" />
                    ) : (
                      <User className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="text-sm text-slate-600 dark:text-slate-400">Account Type</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {user?.is_admin ? "Administrator" : "Regular User"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                  </div>
                  <span className="font-medium">
                    {user?.is_active ? (
                      <span className="text-emerald-600 flex items-center">
                        <span className="h-2 w-2 rounded-full bg-emerald-600 mr-2"></span>
                        Active
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center">
                        <span className="h-2 w-2 rounded-full bg-red-600 mr-2"></span>
                        Inactive
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Joined</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {dayjs(user?.created_at).format("MMM YYYY")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">User ID</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      #{user?.id}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(user?.id?.toString() || "", "User ID")}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Main Content Area */}
          <div className="xl:col-span-3">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  <User className="h-4 w-4 mr-2" />
                  Profile Details
                </TabsTrigger>
                <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <div className="space-y-6">
                  {/* Personal Information Card */}
                  <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-t-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-slate-900 dark:text-slate-100">Personal Information</CardTitle>
                          <CardDescription className="text-slate-600 dark:text-slate-400">
                            Your personal details and contact information
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Full Name
                          </Label>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {user?.name || "Not provided"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Synced from your account
                            </p>
                          </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            Email Address
                          </Label>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {user?.email || "Not provided"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Primary email address
                            </p>
                          </div>
                        </div>

                        {/* Contact Number Field */}
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Contact Number
                          </Label>
                          
                          {!isEditingContact ? (
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-slate-100">
                                    {user?.contact_no || "Not provided"}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {user?.contact_no ? "Verified contact number" : "Add your contact number for notifications"}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => {
                                    setIsEditingContact(true);
                                    setContactNo(user?.contact_no || '');
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="ml-4"
                                >
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  {user?.contact_no ? 'Edit' : 'Add'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handleContactSubmit} className="space-y-3">
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                <div className="flex space-x-3">
                                  <Input
                                    type="tel"
                                    value={contactNo}
                                    onChange={(e) => setContactNo(e.target.value)}
                                    placeholder="Enter 10-digit contact number"
                                    className="flex-1"
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                  />
                                  <Button
                                    type="submit"
                                    disabled={loading || !contactNo || contactNo.length < 10}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    {loading ? (
                                      <div className="h-4 w-4 border border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingContact(false);
                                      setContactNo(user?.contact_no || '');
                                    }}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                                  Required for account notifications and support
                                </p>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Information Card */}
                  <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 rounded-t-2xl">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-slate-900 dark:text-slate-100">Account Information</CardTitle>
                          <CardDescription className="text-slate-600 dark:text-slate-400">
                            Account details and membership information
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Account ID</Label>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-slate-900 dark:text-slate-100">#{user?.id}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(user?.id?.toString() || "", "Account ID")}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Type</Label>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center space-x-2">
                              {user?.is_admin ? (
                                <Crown className="h-4 w-4 text-amber-600" />
                              ) : (
                                <User className="h-4 w-4 text-blue-600" />
                              )}
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {user?.is_admin ? "Administrator" : "Regular User"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Status</Label>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                            {user?.is_active ? (
                              <span className="text-emerald-600 flex items-center font-medium">
                                <span className="h-2 w-2 rounded-full bg-emerald-600 mr-2"></span>
                                Active
                              </span>
                            ) : (
                              <span className="text-red-600 flex items-center font-medium">
                                <span className="h-2 w-2 rounded-full bg-red-600 mr-2"></span>
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Member Since</Label>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {dayjs(user?.created_at).format("MMMM D, YYYY")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {dayjs().diff(dayjs(user?.created_at), 'days')} days ago
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-6">
                <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-amber-900/20 rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900 dark:text-slate-100">Security Settings</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          Manage your account security and authentication
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <Shield className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Security Settings
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Security settings are managed through your authentication provider. 
                        Contact support for security-related assistance.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                  <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-t-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400">
                          Your recent actions and platform interactions
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Activity className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                        No Recent Activity
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Your recent activities and interactions will appear here once you start using the platform more actively.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
