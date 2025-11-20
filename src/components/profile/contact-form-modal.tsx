"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUserContactNumber } from '@/actions/users';
import usersGlobalStore, { IUsersGlobalStore } from '@/global-store/users-store';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Complete Your Profile",
  description = "Please provide your contact number to continue with your subscription purchase."
}) => {
  const { user, updateUserContactNumber: updateStoreContactNumber } = usersGlobalStore() as IUsersGlobalStore;
  const [contactNo, setContactNo] = useState(user?.contact_no || '');
  const [loading, setLoading] = useState(false);

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
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.message || 'Failed to update contact number');
      }
    } catch (error) {
      toast.error('An error occurred while updating contact number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-blue-600" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-contact" className="text-sm font-medium">
              Contact Number
            </Label>
            <Input
              id="modal-contact"
              type="tel"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              className="w-full"
              maxLength={10}
              pattern="[0-9]{10}"
            />
            <p className="text-xs text-slate-500">
              We'll use this number for important notifications and support.
            </p>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              This information is required to proceed with subscription purchase.
            </span>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !contactNo || contactNo.length < 10}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save & Continue
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormModal;
