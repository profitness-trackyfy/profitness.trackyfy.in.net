"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Phone, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { updateCustomerContactNumber } from "@/actions/users";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
  onSuccess: (updatedCustomer: any) => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const [contactNo, setContactNo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer) return;

    if (!contactNo || contactNo.length < 10) {
      toast.error("Please enter a valid 10-digit contact number");
      return;
    }

    setLoading(true);
    
    try {
      const result = await updateCustomerContactNumber(customer.id, contactNo);
      
      if (result.success) {
        toast.success("Contact number added successfully!");
        onSuccess(result.data);
        onClose();
        setContactNo("");
      } else {
        toast.error(result.message || "Failed to add contact number");
      }
    } catch (error) {
      toast.error("An error occurred while adding contact number");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContactNo("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Add Contact Number
          </DialogTitle>
          <DialogDescription>
            Add a contact number for {customer?.name || "this customer"}
          </DialogDescription>
        </DialogHeader>

        {customer && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {customer.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {customer.email}
              </p>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="contact" className="text-sm font-medium">
                  Contact Number
                </Label>
                <Input
                  id="contact"
                  type="tel"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number"
                  className="mt-1"
                  maxLength={15}
                  pattern="[0-9]{10,15}"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter a valid phone number (10-15 digits)
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !contactNo || contactNo.length < 10}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="h-4 w-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Adding..." : "Add Contact"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddContactModal;
