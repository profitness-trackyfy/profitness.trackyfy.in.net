"use client";
import React, { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  User,
  Phone,
  PhoneCall,
  UserPlus,
  RefreshCw,
  Clock,
  Hash,
  CalendarDays,
  MessageCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dayjs from "dayjs";
import toast from "react-hot-toast";

/* ------------------------------------------------------------------ */
/*  Interfaces                                                        */
/* ------------------------------------------------------------------ */
interface ExpiringSubscription {
  id: string;
  user_name: string;
  user_contact_no?: string;
  user_profile_image?: string;  // NEW
  user_clerk_url?: string;      // NEW
  plan_name: string;
  start_date: string;
  end_date: string;
  amount: number;
  days_remaining?: number;
}

interface WidgetProps {
  expiringSubscriptions: ExpiringSubscription[];
  expiredSubscriptions: ExpiringSubscription[];
  onRefresh: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helper Components                                                 */
/* ------------------------------------------------------------------ */
const DetailRow = ({
  label,
  value,
  icon,
  mono = false,
  bold = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
      {icon}
      {label}:
    </span>
    <span
      className={`ml-2 truncate ${
        mono ? "font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded" : bold ? "font-semibold" : "font-medium"
      } text-gray-900 dark:text-white`}
    >
      {value}
    </span>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="text-center py-8">
    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
      No Subscriptions Found
    </h3>
    <p className="text-gray-600 dark:text-gray-400">{text}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
function ExpiringSubscriptionsWidget({
  expiringSubscriptions,
  expiredSubscriptions,
  onRefresh,
}: WidgetProps) {
  const [loading, setLoading] = useState(false);
  const now = dayjs();

  // Use data directly from props - database function handles filtering!
  const expiringSoon = expiringSubscriptions;
  const recentlyExpired = expiredSubscriptions;

  /* ------------------------- helper actions ------------------------- */
  const handleRefresh = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
    toast.success("Data refreshed successfully");
  };

  const handlePhoneCall = (no?: string, name?: string) => {
    if (!no) {
      toast.error("No contact number available");
      return;
    }
    window.open(`tel:${no}`, "_self");
    toast.success(`Calling ${name ?? "customer"}...`);
  };

  const handleWhatsApp = (no?: string, name?: string, planName?: string, endDate?: string) => {
    if (!no) {
      toast.error("No contact number available");
      return;
    }
    
    const cleanNumber = no.replace(/\D/g, '');
    const whatsappNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
    
    const message = `Hi ${name || 'there'}! 👋\n\nThis is a friendly reminder about your ${planName || 'subscription'} plan.\n\n📅 End Date: ${dayjs(endDate).format('MMM DD, YYYY')}\n\nPlease contact us if you have any questions or would like to renew your subscription.\n\nThank you! 🙏`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success(`Opening WhatsApp chat with ${name ?? "customer"}...`);
  };

  const handleSMS = (no?: string, name?: string, planName?: string, endDate?: string) => {
    if (!no) {
      toast.error("No contact number available");
      return;
    }
    
    const message = `Hi ${name || 'there'}! Your ${planName || 'subscription'} plan expires on ${dayjs(endDate).format('MMM DD, YYYY')}. Please contact us to renew. Thank you!`;
    
    const smsUrl = `sms:${no}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_self');
    toast.success(`Opening SMS to ${name ?? "customer"}...`);
  };

  const handleMissingContact = (name?: string) =>
    toast.error(`${name ?? "Customer"} needs to add a contact number`);

  // Helper to get user initials for avatar fallback
  const getInitials = (name?: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /* --------------------------- Enhanced Card UI ----------------------------- */
  const SubscriptionCard = ({
    sub,
    isExpired = false,
  }: {
    sub: ExpiringSubscription;
    isExpired?: boolean;
  }) => {
    // Use days_remaining from database if available, otherwise calculate
    const daysRemaining = sub.days_remaining !== undefined 
      ? sub.days_remaining 
      : dayjs(sub.end_date).diff(now, "day");
      
    const durationDays = dayjs(sub.end_date).diff(
      dayjs(sub.start_date),
      "day"
    );

    // Get profile image URL - prefer profile_image, fallback to clerk_url
    const profileImageUrl = sub.user_profile_image || sub.user_clerk_url;

    return (
      <div
        className={`p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
          isExpired
            ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 border-red-300 dark:border-red-700"
            : daysRemaining <= 3
            ? "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 border-red-300 dark:border-red-700"
            : "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10 border-amber-300 dark:border-amber-700"
        }`}
      >
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/* Profile Avatar with Image */}
              <Avatar className="h-15 w-15 border-2 border-white dark:border-slate-700 shadow-md">
                <AvatarImage 
                  src={profileImageUrl} 
                  alt={sub.user_name || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                  {getInitials(sub.user_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                  {sub.user_name || "Unknown User"}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Subscription #{sub.id}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            {sub.user_contact_no ? (
              <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-slate-800/60 rounded-lg">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {sub.user_contact_no}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-amber-100/60 dark:bg-amber-900/20 rounded-lg">
                <UserPlus className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  No contact number
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Badge */}
          <div className="flex flex-col gap-2 items-end">
            <Badge
              variant={
                isExpired || daysRemaining <= 3 ? "destructive" : "secondary"
              }
              className="text-sm font-semibold px-3 py-1"
            >
              {isExpired ? "Expired" : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
            </Badge>
            {daysRemaining <= 3 && !isExpired && (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                Urgent!
              </span>
            )}
          </div>
        </div>

        {/* Enhanced Details Section */}
        <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-4 mb-4">
          <div className="space-y-3 text-sm">
            <DetailRow 
              icon={<Hash className="h-3 w-3" />} 
              label="Plan" 
              value={sub.plan_name}
              bold
            />
            <DetailRow
              icon={<CalendarDays className="h-3 w-3" />}
              label="Start"
              value={dayjs(sub.start_date).format("MMM DD, YYYY")}
            />
            <DetailRow
              icon={<Calendar className="h-3 w-3" />}
              label="End"
              value={dayjs(sub.end_date).format("MMM DD, YYYY")}
            />
            <DetailRow 
              label="Duration" 
              value={`${durationDays} days`} 
            />
            <DetailRow
              label="Amount"
              value={`₹${sub.amount.toLocaleString()}`}
              bold
            />
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="space-y-3">
          {sub.user_contact_no ? (
            <>
              {/* Primary Actions Row */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePhoneCall(sub.user_contact_no, sub.user_name)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md"
                  title={`Call ${sub.user_contact_no}`}
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Call
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => handleWhatsApp(sub.user_contact_no, sub.user_name, sub.plan_name, sub.end_date)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-md"
                  title="Send WhatsApp message"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              {/* Secondary Actions Row */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSMS(sub.user_contact_no, sub.user_name, sub.plan_name, sub.end_date)}
                  className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Send SMS message"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS
                </Button>
              </div>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleMissingContact(sub.user_name)}
              className="w-full border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              title="No contact number available"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact Number
            </Button>
          )}
        </div>
      </div>
    );
  };

  /* --------------------------- Grid Component ----------------------------- */
  const SubscriptionGrid = ({
    subs,
    expired = false,
  }: {
    subs: ExpiringSubscription[];
    expired?: boolean;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {subs.map((s) => (
        <SubscriptionCard key={s.id} sub={s} isExpired={expired} />
      ))}
    </div>
  );

  /* --------------------------- Main Render ----------------------------- */
  return (
    <Card className="w-full">
      {/* Header with responsive layout */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500 flex-shrink-0" />
            <span className="">Subscription Management</span>
          </CardTitle>
          <CardDescription className="mt-1">
            Monitor expiring and recently-expired subscriptions with enhanced communication tools
          </CardDescription>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue="expiring" className="w-full">
          {/* Optimized TabsList for mobile */}
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger 
              value="expiring" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm min-h-[3rem] sm:min-h-0"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <div className="text-center sm:text-left">
                <div className="block sm:inline">Expiring Soon</div>
                <div className="block sm:inline sm:ml-1 text-xs opacity-75">
                  ({expiringSoon.length})
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="expired" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm min-h-[3rem] sm:min-h-0"
            >
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <div className="text-center sm:text-left">
                <div className="block sm:inline">Recently Expired</div>
                <div className="block sm:inline sm:ml-1 text-xs opacity-75">
                  ({recentlyExpired.length})
                </div>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Expiring Soon Tab */}
          <TabsContent value="expiring" className="mt-6">
            {expiringSoon.length === 0 ? (
              <EmptyState text="No subscriptions expiring in the next 7 days." />
            ) : (
              <SubscriptionGrid subs={expiringSoon} />
            )}
          </TabsContent>

          {/* Recently Expired Tab */}
          <TabsContent value="expired" className="mt-6">
            {recentlyExpired.length === 0 ? (
              <EmptyState text="No subscriptions expired in the past 7 days." />
            ) : (
              <SubscriptionGrid subs={recentlyExpired} expired />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ExpiringSubscriptionsWidget;
