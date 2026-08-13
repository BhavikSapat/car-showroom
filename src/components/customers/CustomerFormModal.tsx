import React, { useEffect, useState } from "react";
import { Modal } from "../common/Modal";
import { Customer } from "../../types";
import {
  Loader2,
  Mail,
  User,
  Calendar,
  Megaphone,
  CarFront,
  Plus,
  Trash2,
} from "lucide-react";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Customer, "id">) => Promise<void>;
  initialData?: Customer | null;
  isLoading: boolean;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [marketing, setMarketing] = useState("Interested");

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    bookingDate?: string;
  }>({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setBookingDate(initialData.bookingDate || "");
      setMarketing(initialData.marketing || "Interested");
    } else {
      setName("");
      setEmail("");
      setBookingDate(new Date().toISOString().split("T")[0]);
      setMarketing("Interested");
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs: {
      name?: string;
      email?: string;
      bookingDate?: string;
    } = {};
    if (!name.trim()) errs.name = "Customer name is required";
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Enter a valid email address";
    }
    if (!bookingDate) errs.bookingDate = "Booking date is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      email: email.trim(),
      bookingDate,
      marketing,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Customer" : "Add New Customer"}
      subtitle={
        initialData
          ? `Updating customer ID #${initialData.id}`
          : "POST /customer API endpoint"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Customer Name *
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Bhavik Sapat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border ${
                errors.name ? "border-rose-500" : "border-slate-300"
              } rounded-md focus:outline-hidden focus:ring-2 focus:ring-black`}
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          {errors.name && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="e.g. customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border ${
                errors.email ? "border-rose-500" : "border-slate-300"
              } rounded-md focus:outline-hidden focus:ring-2 focus:ring-black`}
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>
          )}
        </div>

        {/* Booking Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Booking Date *
          </label>
          <div className="relative">
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              disabled={isLoading}
              className={`w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border ${
                errors.bookingDate ? "border-rose-500" : "border-slate-300"
              } rounded-md focus:outline-hidden focus:ring-2 focus:ring-black`}
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          {errors.bookingDate && (
            <p className="text-[11px] text-rose-600 mt-1">
              {errors.bookingDate}
            </p>
          )}
        </div>

        {/* Marketing Preference */}
        {!initialData && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Marketing Preference *
            </label>
            <div className="relative">
              <select
                value={marketing}
                onChange={(e) => setMarketing(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-black"
              >
                <option value="Interested">Interested (Opted-In)</option>
                <option value="Not Interested">
                  Not Interested (Opted-Out)
                </option>
              </select>

              <Megaphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-black rounded-md hover:bg-[#27272A] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{initialData ? "Save Changes" : "Register Customer"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
