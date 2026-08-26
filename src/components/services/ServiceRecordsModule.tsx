import React, { useState, useEffect } from "react";
import { serviceRecordService } from "../../services/serviceRecordService";
import { bookingService } from "../../services/bookingService";
import { ServiceRecord, Booking } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  Wrench,
  Plus,
  RefreshCcw,
  Loader2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Search,
  Check,
  AlertCircle,
  CarFront,
  User,
  Shield,
  Eye,
} from "lucide-react";
import { useToast } from "../common/Toast";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Modal } from "../common/Modal";

export const ServiceRecordsModule: React.FC = () => {
  const { role } = useAuth();
  const isManagerOrOwner = role === "OWNER" || role === "MANAGER";

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterBookingId, setFilterBookingId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Service Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [serviceNumber, setServiceNumber] = useState<string>("1");
  const [serviceType, setServiceType] = useState<string>(
    "General Maintenance & Oil Change",
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [cost, setCost] = useState<string>("250");
  const [remarks, setRemarks] = useState<string>(
    "Routine periodic service inspection.",
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // View Details Modal
  const [viewingRecord, setViewingRecord] = useState<ServiceRecord | null>(
    null,
  );

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [servicesRes, bookingsRes] = await Promise.all([
        serviceRecordService.getAllServices().catch(() => []),
        bookingService.getAllBookings().catch(() => []),
      ]);

      setServices(Array.isArray(servicesRes) ? servicesRes : []);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
    } catch (err: any) {
      toast.error("Failed to load service records", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchByBookingId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterBookingId.trim()) {
      return loadData();
    }

    const bId = parseInt(filterBookingId, 10);
    if (isNaN(bId)) {
      toast.error("Invalid Input", "Please enter a valid numeric Booking ID.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await serviceRecordService.getServicesByBooking(bId);
      setServices(Array.isArray(res) ? res : []);
      toast.success(
        "Query Complete",
        `Found ${Array.isArray(res) ? res.length : 0} record(s) for Booking ${bId}`,
      );
    } catch (err: any) {
      toast.error("Query Failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    if (bookings.length > 0) {
      setSelectedBookingId(String(bookings[0].id || ""));
    } else {
      setSelectedBookingId("");
    }
    setServiceNumber("1");
    setServiceType("General Maintenance & Oil Change");
    setScheduledDate(new Date().toISOString().split("T")[0]);
    setCost("250");
    setRemarks("Routine periodic service inspection.");
    setIsCreateModalOpen(true);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    const bId = parseInt(selectedBookingId, 10);
    if (isNaN(bId)) {
      toast.error(
        "Missing Booking",
        "Please select an existing vehicle booking reference.",
      );
      return;
    }

    if (!serviceType.trim()) {
      toast.error("Missing Field", "Service Type cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        booking: { id: bId },
        serviceNumber: parseInt(serviceNumber, 10) || 1,
        serviceType: serviceType.trim(),
        scheduledDate,
        cost: Number(cost) || 0,
        remarks: remarks.trim(),
        status: "SCHEDULED",
      };

      const res = await serviceRecordService.addService(payload);
      if (
        typeof res === "string" &&
        (res.includes("Not Found") ||
          res.includes("Access Denied") ||
          res.includes("Invalid"))
      ) {
        toast.error("Service Creation Error", res);
      } else {
        toast.success(
          "Service Scheduled",
          `Service ticket logged for Booking ${bId}.`,
        );
        setIsCreateModalOpen(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(
        "Operation Failed",
        err.message || "Could not schedule service.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async (serviceId: number) => {
    try {
      const res = await serviceRecordService.markServiceComplete(serviceId);
      if (
        typeof res === "string" &&
        (res.includes("Not Found") || res.includes("Access Denied"))
      ) {
        toast.error("Completion Failed", res);
      } else {
        toast.success(
          "Service Completed",
          `Service ticket ${serviceId} marked as completed.`,
        );
        loadData();
      }
    } catch (err: any) {
      toast.error("Update Failed", err.message);
    }
  };

  const filteredServices = services.filter((s) => {
    if (statusFilter === "ALL") return true;
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Header bar */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
            <Wrench className="w-4 h-4 text-black" />
            Vehicle Service & Maintenance Records
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Schedule vehicle maintenance, track service histories, and mark
            service orders as completed.
          </p>
        </div>

        {isManagerOrOwner && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-[#27272A] rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Service</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form
          onSubmit={handleSearchByBookingId}
          className="flex items-center gap-2 flex-1 max-w-md"
        >
          <div className="relative flex-1">
            <input
              type="number"
              placeholder="Search by Booking ID (e.g. 1, 2)..."
              value={filterBookingId}
              onChange={(e) => setFilterBookingId(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-[#E4E4E7] rounded bg-white text-[#18181B] focus:ring-1 focus:ring-black outline-none font-mono"
            />
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-3 py-2 text-xs font-semibold text-white bg-black rounded hover:bg-[#27272A] cursor-pointer"
          >
            Filter
          </button>
          {filterBookingId && (
            <button
              type="button"
              onClick={() => {
                setFilterBookingId("");
                loadData();
              }}
              className="px-2.5 py-2 text-xs text-slate-600 hover:text-black border border-slate-200 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs shrink-0 self-start md:self-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white text-black shadow-xs"
                : "text-slate-600 hover:text-black"
            }`}
          >
            All ({services.length})
          </button>
          <button
            onClick={() => setStatusFilter("SCHEDULED")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              statusFilter === "SCHEDULED"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-black"
            }`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              statusFilter === "COMPLETED"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-black"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider">
            Service Logs ({filteredServices.length} records)
          </h4>
          <button
            onClick={loadData}
            className="text-xs text-[#71717A] hover:text-[#18181B] flex items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Fetching service history..." />
        ) : filteredServices.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#71717A] space-y-2">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No service records found.</p>
            {isManagerOrOwner && (
              <button
                onClick={handleOpenCreateModal}
                className="text-xs font-semibold text-black underline hover:text-[#27272A] cursor-pointer"
              >
                Schedule the first vehicle service
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
                <tr>
                  <th className="px-5 py-3">Ticket ID</th>
                  <th className="px-5 py-3">Booking / Vehicle</th>
                  <th className="px-5 py-3">Service Type</th>
                  <th className="px-5 py-3">Scheduled Date</th>
                  <th className="px-5 py-3">Completed Date</th>
                  <th className="px-5 py-3">Cost ($)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] text-sm">
                {filteredServices.map((s, idx) => {
                  const isDone = s.status === "COMPLETED";
                  return (
                    <tr
                      key={s.id || idx}
                      className="hover:bg-[#F9FAFB] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                        {s.id}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <div className="font-bold text-slate-900">
                          Booking {s.booking?.id || "N/A"}
                        </div>
                        {s.booking?.car && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {s.booking.car.company} {s.booking.car.model}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-[#18181B]">
                        {s.serviceType}
                        {s.remarks && (
                          <span className="block text-[11px] text-slate-500 font-normal truncate max-w-xs">
                            {s.remarks}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                        {s.scheduledDate || "N/A"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                        {s.completedDate || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-900">
                        ${s.cost ? Number(s.cost).toLocaleString() : "0"}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isDone
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {s.status || "SCHEDULED"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => setViewingRecord(s)}
                            className="p-1 text-slate-600 hover:text-black border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                            title="View Service Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isManagerOrOwner && !isDone && s.id && (
                            <button
                              onClick={() => handleMarkComplete(s.id!)}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded cursor-pointer inline-flex items-center gap-1"
                              title="Mark Service as Completed (PUT /service/{id}/complete)"
                            >
                              <Check className="w-3 h-3" /> Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Service Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule Vehicle Service Record"
        subtitle="Log service order."
      >
        <form onSubmit={handleCreateService} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Select Booking Reference *
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            >
              {bookings.length === 0 ? (
                <option value="">No active bookings found</option>
              ) : (
                bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    Booking {b.id} - Customer: {b.customer?.name} | Car:{" "}
                    {b.car?.company} {b.car?.model}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Service Number / Round
              </label>
              <input
                type="number"
                min="1"
                value={serviceNumber}
                onChange={(e) => setServiceNumber(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Estimated Cost ($)
              </label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Service Type *
            </label>
            <input
              type="text"
              placeholder="e.g. 10,000 km Oil & Filter Change, Brake Inspection"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Remarks & Technical Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Engine oil replaced, tire pressure calibrated, cabin filter renewed."
              className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-[#71717A] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:text-[#18181B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-black rounded hover:bg-[#27272A] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <span>Schedule Service</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Record Modal */}
      <Modal
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        title="Service Record Summary"
        subtitle={viewingRecord ? `Service Ticket ${viewingRecord.id}` : ""}
      >
        {viewingRecord && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Service Task
              </span>
              <h4 className="text-base font-bold text-slate-900">
                {viewingRecord.serviceType}
              </h4>
              <p className="text-slate-600">
                {viewingRecord.remarks || "No remarks logged."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-3">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Booking Ref:</span>
                <span className="font-mono font-bold text-slate-900">
                  {viewingRecord.booking?.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-700">
                  {viewingRecord.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Scheduled:</span>
                <span className="font-mono text-slate-900">
                  {viewingRecord.scheduledDate || "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Completed:</span>
                <span className="font-mono text-slate-900">
                  {viewingRecord.completedDate || "Pending"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Cost:</span>
                <span className="font-mono font-bold text-slate-900">
                  $
                  {viewingRecord.cost
                    ? Number(viewingRecord.cost).toLocaleString()
                    : "0"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Round:</span>
                <span className="font-mono text-slate-900">
                  Service {viewingRecord.serviceNumber || 1}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
