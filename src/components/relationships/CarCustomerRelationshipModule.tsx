import React, { useState, useEffect, useMemo } from "react";
import { carService } from "../../services/carService";
import { customerService } from "../../services/customerService";
import { bookingService } from "../../services/bookingService";
import { Car, Customer, Booking, CarCustomerAssignment } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  Link2,
  Plus,
  RefreshCcw,
  Loader2,
  User,
  CarFront,
  Calendar,
  Trash2,
  Eye,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Fuel,
  Sliders,
  Palette,
  Tag,
  Layers,
} from "lucide-react";
import { useToast } from "../common/Toast";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Modal } from "../common/Modal";

export const CarCustomerRelationshipModule: React.FC = () => {
  const { role } = useAuth();
  const isManagerOrOwner = role === "OWNER" || role === "MANAGER";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assignments, setAssignments] = useState<CarCustomerAssignment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // View Modal state
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  // Create Booking / Assignment Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [selectedCarId, setSelectedCarId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [insuranceTaken, setInsuranceTaken] = useState<boolean>(false);
  const [insuranceProvider, setInsuranceProvider] =
    useState<string>("Allianz Assurance");
  const [insurancePolicyNo, setInsurancePolicyNo] = useState<string>("");
  const [insuranceAmount, setInsuranceAmount] = useState<string>("1200");
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<string>(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const toast = useToast();

  const loadRelationshipData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, customersRes, carsRes, joinsRes] = await Promise.all([
        bookingService.getAllBookings().catch(() => []),
        customerService.getAllCustomers(0, 100).catch(() => ({ content: [] })),
        carService.getAllCars().catch(() => []),
        customerService.getCustomersWithCars().catch(() => []),
      ]);

      // 1. Process Bookings
      let validBookings: Booking[] = [];
      if (Array.isArray(bookingsRes)) {
        validBookings = bookingsRes;
      }
      setBookings(validBookings);

      // 2. Process Customers
      let custList: Customer[] = [];
      if (
        customersRes &&
        typeof customersRes === "object" &&
        Array.isArray((customersRes as any).content)
      ) {
        custList = (customersRes as any).content;
      } else if (Array.isArray(customersRes)) {
        custList = customersRes;
      }
      setCustomers(custList);

      // 3. Process Cars (Preserving all technical specifications)
      let flatCars: Car[] = [];
      if (Array.isArray(carsRes)) {
        carsRes.forEach((c: any, idx: number) => {
          if (Array.isArray(c.models)) {
            c.models.forEach((m: any) => {
              flatCars.push({
                id: m.id || idx + 1,
                company: c.company || "Brand",
                model: m.modelName || m.model || "Model",
                fuelType: m.fuelType || c.fuelType || "Petrol",
                transmission: m.transmission || c.transmission || "Automatic",
                color: m.color || c.color || "Standard",
                manufacturingYear:
                  m.manufacturingYear || c.manufacturingYear || 2024,
                quantity: m.quantity || 0,
                status: (m.quantity || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
                price: m.price || 35000,
              });
            });
          } else {
            flatCars.push({
              id: c.id || idx + 1,
              company: c.company || c.carCompany || "Brand",
              model: c.model || c.carModel || "Model",
              fuelType: c.fuelType || "Petrol",
              transmission: c.transmission || "Automatic",
              color: c.color || "Standard",
              manufacturingYear: c.manufacturingYear || 2024,
              quantity: c.quantity !== undefined ? c.quantity : 1,
              status:
                c.status ||
                ((c.quantity || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
              price: c.price || 35000,
            });
          }
        });
      }
      setCars(flatCars);

      // 4. Build Assignment Rows from Join queries if bookings are empty
      const relationshipRows: CarCustomerAssignment[] = [];
      if (Array.isArray(joinsRes) && joinsRes.length > 0) {
        joinsRes.forEach((j: any, idx: number) => {
          if (j.carCompany || j.carModel || j.customerName) {
            relationshipRows.push({
              id: j.modelId || j.carId || idx + 1,
              customerName: j.customerName || j.name || "Customer",
              customerEmail: j.email || "",
              carCompany: j.carCompany || "Brand",
              carModel: j.carModel || j.modelName || "Model",
              bookingDate:
                j.bookingDate || new Date().toISOString().split("T")[0],
            });
          }
        });
      }
      setAssignments(relationshipRows);
    } catch (err: any) {
      toast.error("Failed to load relationships", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRelationshipData();
  }, []);

  // Unique Brand + Model combinations
  const uniqueCarModels = useMemo(() => {
    const map = new Map<
      string,
      { company: string; model: string; count: number }
    >();
    cars.forEach((c) => {
      const key = `${c.company} - ${c.model}`;
      if (!map.has(key)) {
        map.set(key, { company: c.company, model: c.model, count: 1 });
      } else {
        const item = map.get(key)!;
        item.count += 1;
      }
    });
    return Array.from(map.entries()).map(([key, data]) => ({
      key,
      company: data.company,
      model: data.model,
      count: data.count,
    }));
  }, [cars]);

  // Cars matching the currently selected Brand + Model
  const matchingSpecVariants = useMemo(() => {
    if (!selectedModelKey) return [];
    return cars.filter((c) => `${c.company} - ${c.model}` === selectedModelKey);
  }, [cars, selectedModelKey]);

  const handleOpenModal = () => {
    if (customers.length > 0) {
      setSelectedCustomerId(String(customers[0].id || ""));
    } else {
      setSelectedCustomerId("");
    }

    // Default to the first available car model
    const availableCar = cars.find((c) => (c.quantity || 0) > 0) || cars[0];
    if (availableCar) {
      const modelKey = `${availableCar.company} - ${availableCar.model}`;
      setSelectedModelKey(modelKey);
      setSelectedCarId(String(availableCar.id || ""));
    } else {
      setSelectedModelKey("");
      setSelectedCarId("");
    }

    setBookingDate(new Date().toISOString().split("T")[0]);
    setInsuranceTaken(false);
    setInsuranceProvider("Allianz Assurance");
    setInsurancePolicyNo(`POL-${Math.floor(100000 + Math.random() * 900000)}`);
    setInsuranceAmount("1200");
    setIsModalOpen(true);
  };

  // When model selection changes, auto-select the best matching variant ID
  const handleModelChange = (modelKey: string) => {
    setSelectedModelKey(modelKey);
    const variants = cars.filter(
      (c) => `${c.company} - ${c.model}` === modelKey,
    );
    const inStockVariant =
      variants.find((v) => (v.quantity || 0) > 0) || variants[0];
    if (inStockVariant && inStockVariant.id) {
      setSelectedCarId(String(inStockVariant.id));
    } else {
      setSelectedCarId("");
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const custId = parseInt(selectedCustomerId, 10);
    const carId = parseInt(selectedCarId, 10);

    if (isNaN(custId) || isNaN(carId)) {
      toast.error(
        "Selection Required",
        "Please select both a Customer and a specific Car specification.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer: { id: custId },
        car: { id: carId },
        bookingDate,
        bookingStatus: "CONFIRMED",
        insuranceTaken,
        insuranceProvider: insuranceTaken ? insuranceProvider : undefined,
        insurancePolicyNo: insuranceTaken ? insurancePolicyNo : undefined,
        insuranceAmount: insuranceTaken ? Number(insuranceAmount) : undefined,
        insuranceExpiryDate: insuranceTaken ? insuranceExpiryDate : undefined,
      };

      const res = await bookingService.createBooking(payload);
      if (
        typeof res === "string" &&
        (res.includes("Not Available") ||
          res.includes("Not Found") ||
          res.includes("Access Denied"))
      ) {
        toast.error("Booking Error", res);
      } else {
        toast.success(
          "Relationship Established",
          `Vehicle successfully assigned and booked for customer ID ${custId}.`,
        );
        setIsModalOpen(false);
        loadRelationshipData();
      }
    } catch (err: any) {
      toast.error(
        "Operation Failed",
        err.message || "Failed to create booking.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel / Remove Relationship (PUT /booking/{bookingId}/status?status=CANCELLED)
  const handleCancelBooking = async (bookingId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel and remove this vehicle-customer allocation? This will restore 1 unit back to car stock.",
      )
    ) {
      return;
    }

    try {
      const res = await bookingService.updateBookingStatus(
        bookingId,
        "CANCELLED",
      );
      if (typeof res === "string" && res.includes("Not Found")) {
        toast.error("Cancellation Failed", res);
      } else {
        toast.success(
          "Relationship Unlinked",
          `Booking ${bookingId} cancelled and vehicle stock returned to inventory.`,
        );
        loadRelationshipData();
      }
    } catch (err: any) {
      toast.error("Failed to cancel relationship", err.message);
    }
  };

  const selectedCarDetails = cars.find((c) => String(c.id) === selectedCarId);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
            <Link2 className="w-4 h-4 text-black" />
            Car - Customer Relationship & Bookings
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Assign vehicles to customers, track confirmed bookings, inspect
            detailed vehicle specs, manage insurance, and handle allocations.
          </p>
        </div>

        {isManagerOrOwner && (
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-[#27272A] rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Vehicle to Customer</span>
          </button>
        )}
      </div>

      {/* Main Relationship & Bookings Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider">
            Active Allocations (
            {bookings.length > 0 ? bookings.length : assignments.length}{" "}
            records)
          </h4>
          <button
            onClick={loadRelationshipData}
            className="text-xs text-[#71717A] hover:text-[#18181B] flex items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading allocations & bookings..." />
        ) : bookings.length === 0 && assignments.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#71717A] space-y-2">
            <Link2 className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No active vehicle-customer relationships found.</p>
            {isManagerOrOwner && (
              <button
                onClick={handleOpenModal}
                className="text-xs font-semibold text-black underline hover:text-[#27272A] cursor-pointer"
              >
                Click here to assign a car to a customer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
                <tr>
                  <th className="px-5 py-3">Ref ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Allocated Vehicle & Specs</th>
                  <th className="px-5 py-3">Booking Date</th>
                  <th className="px-5 py-3">Insurance</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] text-sm">
                {bookings.length > 0
                  ? bookings.map((b, idx) => {
                      const isConfirmed = b.bookingStatus === "CONFIRMED";
                      const isCancelled = b.bookingStatus === "CANCELLED";
                      return (
                        <tr
                          key={b.id || idx}
                          className="hover:bg-[#F9FAFB] transition-colors"
                        >
                          <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <div className="font-bold text-slate-900">
                              {b.customer?.name || "Customer"}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {b.customer?.email}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold border bg-[#F4F4F5] text-[#18181B] border-[#E4E4E7]">
                                {b.car?.company} {b.car?.model}
                              </span>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                                <span>{b.car?.fuelType || "Petrol"}</span>
                                <span>•</span>
                                <span>
                                  {b.car?.transmission || "Automatic"}
                                </span>
                                <span>•</span>
                                <span>{b.car?.color || "Standard"}</span>
                                <span>•</span>
                                <span>{b.car?.manufacturingYear || 2024}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                            {b.bookingDate || "Recent"}
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            {b.insuranceTaken ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <Shield className="w-3 h-3" /> Insured
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                None
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                isConfirmed
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isCancelled
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {isConfirmed ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : isCancelled ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {b.bookingStatus || "CONFIRMED"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => setViewingBooking(b)}
                                className="p-1 text-slate-600 hover:text-black border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {isManagerOrOwner && !isCancelled && b.id && (
                                <button
                                  onClick={() => handleCancelBooking(b.id!)}
                                  className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer inline-flex items-center gap-1"
                                  title="Unlink & Cancel Relationship"
                                >
                                  <Trash2 className="w-3 h-3" /> Unlink
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  : assignments.map((a, idx) => (
                      <tr
                        key={a.id || idx}
                        className="hover:bg-[#F9FAFB] transition-colors"
                      >
                        <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <div className="font-bold text-slate-900">
                            {a.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {a.customerEmail}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold border bg-[#F4F4F5] text-[#18181B] border-[#E4E4E7]">
                            {a.carCompany} {a.carModel}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {a.bookingDate}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400">
                          Included
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> ALLOCATED
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-xs text-slate-400">
                            Synchronized
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Vehicle Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Vehicle to Customer"
        subtitle="Establish relationship and create booking in showroom database"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Select Customer *
            </label>
            <div className="relative">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-medium"
              >
                {customers.length === 0 ? (
                  <option value="">No customers registered</option>
                ) : (
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) - ID {c.id}
                    </option>
                  ))
                )}
              </select>
              <User className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Step 1: Select Showroom Vehicle (Brand & Model) */}
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Select Showroom Vehicle *
            </label>
            <div className="relative">
              <select
                value={selectedModelKey}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-medium"
              >
                {uniqueCarModels.length === 0 ? (
                  <option value="">No showroom vehicles available</option>
                ) : (
                  uniqueCarModels.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.company} {m.model} ({m.count} specification variant
                      {m.count > 1 ? "s" : ""})
                    </option>
                  ))
                )}
              </select>
              <CarFront className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Step 2: Specific Specification & Trim Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Select Specific Trim & Specifications *
            </label>
            <div className="relative">
              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                disabled={isSubmitting || matchingSpecVariants.length === 0}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-medium"
              >
                {matchingSpecVariants.length === 0 ? (
                  <option value="">Select a vehicle model first</option>
                ) : (
                  matchingSpecVariants.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      disabled={(c.quantity || 0) <= 0}
                    >
                      {c.fuelType || "Petrol"} • {c.transmission || "Auto"} •{" "}
                      {c.color || "Standard"} • Year{" "}
                      {c.manufacturingYear || 2024} • ₹
                      {c.price ? c.price.toLocaleString() : "35,000"} — Stock:{" "}
                      {c.quantity || 0} unit(s)
                      {(c.quantity || 0) <= 0 ? " [OUT OF STOCK]" : ""}
                    </option>
                  ))
                )}
              </select>
              <Layers className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>

            {/* Live Selected Vehicle Specification Preview Card */}
            {selectedCarDetails && (
              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CarFront className="w-3.5 h-3.5 text-black" />
                    {selectedCarDetails.company} {selectedCarDetails.model}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      (selectedCarDetails.quantity || 0) > 0
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {(selectedCarDetails.quantity || 0) > 0
                      ? `${selectedCarDetails.quantity} Unit(s) in Stock`
                      : "Out of Stock"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-700">
                    <Fuel className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      <strong>Fuel:</strong>{" "}
                      {selectedCarDetails.fuelType || "Petrol"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700">
                    <Sliders className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      <strong>Trans:</strong>{" "}
                      {selectedCarDetails.transmission || "Automatic"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700">
                    <Palette className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      <strong>Color:</strong>{" "}
                      {selectedCarDetails.color || "Standard"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700">
                    <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      <strong>Price:</strong> ₹
                      {selectedCarDetails.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Date */}
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Booking Date *
            </label>
            <div className="relative">
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-medium"
              />
              <Calendar className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Insurance Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={insuranceTaken}
                onChange={(e) => setInsuranceTaken(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-black"
              />
              <span className="font-semibold text-slate-900">
                Include Vehicle Insurance Package
              </span>
            </label>

            {insuranceTaken && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      value={insuranceProvider}
                      onChange={(e) => setInsuranceProvider(e.target.value)}
                      placeholder="e.g. Allianz, HDFC ERGO"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={insurancePolicyNo}
                      onChange={(e) => setInsurancePolicyNo(e.target.value)}
                      placeholder="e.g. POL-982104"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Premium Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={insuranceAmount}
                      onChange={(e) => setInsuranceAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Policy Expiry Date
                    </label>
                    <input
                      type="date"
                      value={insuranceExpiryDate}
                      onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Confirm Assignment</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Booking Details Modal */}
      <Modal
        isOpen={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
        title="Allocation & Booking Summary"
        subtitle={
          viewingBooking ? `Booking Reference ${viewingBooking.id}` : ""
        }
      >
        {viewingBooking && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Customer
                </span>
                <span className="font-bold text-slate-900">
                  {viewingBooking.customer?.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600">
                <span>Email:</span>
                <span className="font-mono">
                  {viewingBooking.customer?.email}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Allocated Car & Specs
                </span>
                <span className="font-bold text-slate-900">
                  {viewingBooking.car?.company} {viewingBooking.car?.model}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 py-1.5 border-t border-b border-slate-200 text-[11px] text-slate-600">
                <div>
                  <strong>Fuel:</strong>{" "}
                  {viewingBooking.car?.fuelType || "Petrol"}
                </div>
                <div>
                  <strong>Transmission:</strong>{" "}
                  {viewingBooking.car?.transmission || "Automatic"}
                </div>
                <div>
                  <strong>Color:</strong>{" "}
                  {viewingBooking.car?.color || "Standard"}
                </div>
                <div>
                  <strong>Year:</strong>{" "}
                  {viewingBooking.car?.manufacturingYear || 2024}
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600">
                <span>Booking Date:</span>
                <span className="font-medium">
                  {viewingBooking.bookingDate}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-600">
                <span>Status:</span>
                {viewingBooking.bookingStatus == "CONFIRMED" ? (
                  <span className="font-bold text-emerald-700">
                    {viewingBooking.bookingStatus}
                  </span>
                ) : (
                  <span className="font-bold text-red-500">
                    {viewingBooking.bookingStatus}
                  </span>
                )}
              </div>
            </div>

            {viewingBooking.insuranceTaken && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-md space-y-1 text-emerald-900">
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Insurance Details
                </span>
                <p>
                  Provider:{" "}
                  <span className="font-bold">
                    {viewingBooking.insuranceProvider}
                  </span>
                </p>
                <p>
                  Policy No:{" "}
                  <span className="font-mono font-bold">
                    {viewingBooking.insurancePolicyNo}
                  </span>
                </p>
                <p>
                  Amount:{" "}
                  <span className="font-mono font-bold">
                    ₹{viewingBooking.insuranceAmount}
                  </span>
                </p>
                <p>
                  Expiry:{" "}
                  <span className="font-medium">
                    {viewingBooking.insuranceExpiryDate}
                  </span>
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingBooking(null)}
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
// import React, { useState, useEffect } from "react";
// import { carService } from "../../services/carService";
// import { customerService } from "../../services/customerService";
// import { bookingService } from "../../services/bookingService";
// import { Car, Customer, Booking, CarCustomerAssignment } from "../../types";
// import { useAuth } from "../../context/AuthContext";
// import {
//   Link2,
//   Plus,
//   RefreshCcw,
//   Loader2,
//   User,
//   CarFront,
//   Calendar,
//   Trash2,
//   AlertCircle,
//   Eye,
//   ShieldCheck,
//   CheckCircle2,
//   XCircle,
//   Clock,
//   Shield,
// } from "lucide-react";
// import { useToast } from "../common/Toast";
// import { LoadingSpinner } from "../common/LoadingSpinner";
// import { Modal } from "../common/Modal";

// export const CarCustomerRelationshipModule: React.FC = () => {
//   const { role } = useAuth();
//   const isManagerOrOwner = role === "OWNER" || role === "MANAGER";

//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [assignments, setAssignments] = useState<CarCustomerAssignment[]>([]);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [cars, setCars] = useState<Car[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);

//   // View Modal state
//   const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

//   // Create Booking / Assignment Modal states
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
//   const [selectedCarId, setSelectedCarId] = useState<string>("");
//   const [bookingDate, setBookingDate] = useState<string>(
//     new Date().toISOString().split("T")[0],
//   );
//   const [insuranceTaken, setInsuranceTaken] = useState<boolean>(false);
//   const [insuranceProvider, setInsuranceProvider] = useState<string>("Allianz Assurance");
//   const [insurancePolicyNo, setInsurancePolicyNo] = useState<string>("");
//   const [insuranceAmount, setInsuranceAmount] = useState<string>("1200");
//   const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<string>(
//     new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
//   );

//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const toast = useToast();

//   const loadRelationshipData = async () => {
//     setIsLoading(true);
//     try {
//       const [bookingsRes, customersRes, carsRes, joinsRes] = await Promise.all([
//         bookingService.getAllBookings().catch(() => []),
//         customerService.getAllCustomers(0, 100).catch(() => ({ content: [] })),
//         carService.getAllCars().catch(() => []),
//         customerService.getCustomersWithCars().catch(() => []),
//       ]);

//       // 1. Process Bookings
//       let validBookings: Booking[] = [];
//       if (Array.isArray(bookingsRes)) {
//         validBookings = bookingsRes;
//       }
//       setBookings(validBookings);

//       // 2. Process Customers
//       let custList: Customer[] = [];
//       if (customersRes && typeof customersRes === "object" && Array.isArray((customersRes as any).content)) {
//         custList = (customersRes as any).content;
//       } else if (Array.isArray(customersRes)) {
//         custList = customersRes;
//       }
//       setCustomers(custList);

//       // 3. Process Cars
//       let flatCars: Car[] = [];
//       if (Array.isArray(carsRes)) {
//         carsRes.forEach((c: any, idx: number) => {
//           if (Array.isArray(c.models)) {
//             c.models.forEach((m: any) => {
//               flatCars.push({
//                 id: m.id || idx + 1,
//                 company: c.company || "Brand",
//                 model: m.modelName || m.model || "Model",
//                 quantity: m.quantity || 0,
//                 status: (m.quantity || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
//                 price: m.price || 35000,
//               });
//             });
//           } else {
//             flatCars.push({
//               id: c.id || idx + 1,
//               company: c.company || c.carCompany || "Brand",
//               model: c.model || c.carModel || "Model",
//               quantity: c.quantity !== undefined ? c.quantity : 1,
//               status: c.status || ((c.quantity || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
//               price: c.price || 35000,
//             });
//           }
//         });
//       }
//       setCars(flatCars);

//       // 4. Build Assignment Rows from Join queries if bookings are empty
//       const relationshipRows: CarCustomerAssignment[] = [];
//       if (Array.isArray(joinsRes) && joinsRes.length > 0) {
//         joinsRes.forEach((j: any, idx: number) => {
//           if (j.carCompany || j.carModel || j.customerName) {
//             relationshipRows.push({
//               id: j.modelId || j.carId || idx + 1,
//               customerName: j.customerName || j.name || "Customer",
//               customerEmail: j.email || "",
//               carCompany: j.carCompany || "Brand",
//               carModel: j.carModel || j.modelName || "Model",
//               bookingDate: j.bookingDate || new Date().toISOString().split("T")[0],
//             });
//           }
//         });
//       }
//       setAssignments(relationshipRows);
//     } catch (err: any) {
//       toast.error("Failed to load relationships", err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadRelationshipData();
//   }, []);

//   const handleOpenModal = () => {
//     if (customers.length > 0) {
//       setSelectedCustomerId(String(customers[0].id || ""));
//     } else {
//       setSelectedCustomerId("");
//     }

//     const availableCar = cars.find((c) => (c.quantity || 0) > 0);
//     if (availableCar && availableCar.id) {
//       setSelectedCarId(String(availableCar.id));
//     } else if (cars.length > 0) {
//       setSelectedCarId(String(cars[0].id || ""));
//     } else {
//       setSelectedCarId("");
//     }

//     setBookingDate(new Date().toISOString().split("T")[0]);
//     setInsuranceTaken(false);
//     setInsuranceProvider("Allianz Assurance");
//     setInsurancePolicyNo(`POL-${Math.floor(100000 + Math.random() * 900000)}`);
//     setInsuranceAmount("1200");
//     setIsModalOpen(true);
//   };

//   const handleCreateBooking = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const custId = parseInt(selectedCustomerId, 10);
//     const carId = parseInt(selectedCarId, 10);

//     if (isNaN(custId) || isNaN(carId)) {
//       toast.error("Selection Required", "Please select both a Customer and a Car.");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       const payload = {
//         customer: { id: custId },
//         car: { id: carId },
//         bookingDate,
//         bookingStatus: "CONFIRMED",
//         insuranceTaken,
//         insuranceProvider: insuranceTaken ? insuranceProvider : undefined,
//         insurancePolicyNo: insuranceTaken ? insurancePolicyNo : undefined,
//         insuranceAmount: insuranceTaken ? Number(insuranceAmount) : undefined,
//         insuranceExpiryDate: insuranceTaken ? insuranceExpiryDate : undefined,
//       };

//       const res = await bookingService.createBooking(payload);
//       if (typeof res === "string" && (res.includes("Not Available") || res.includes("Not Found") || res.includes("Access Denied"))) {
//         toast.error("Booking Error", res);
//       } else {
//         toast.success(
//           "Relationship Established",
//           `Vehicle successfully assigned and booked for customer #${custId}.`,
//         );
//         setIsModalOpen(false);
//         loadRelationshipData();
//       }
//     } catch (err: any) {
//       toast.error("Operation Failed", err.message || "Failed to create booking.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Cancel / Remove Relationship (PUT /booking/{bookingId}/status?status=CANCELLED)
//   const handleCancelBooking = async (bookingId: number) => {
//     if (!window.confirm("Are you sure you want to cancel and remove this vehicle-customer allocation? This will restore 1 unit back to car stock.")) {
//       return;
//     }

//     try {
//       const res = await bookingService.updateBookingStatus(bookingId, "CANCELLED");
//       if (typeof res === "string" && res.includes("Not Found")) {
//         toast.error("Cancellation Failed", res);
//       } else {
//         toast.success(
//           "Relationship Unlinked",
//           `Booking ${bookingId} cancelled and vehicle stock returned to inventory.`,
//         );
//         loadRelationshipData();
//       }
//     } catch (err: any) {
//       toast.error("Failed to cancel relationship", err.message);
//     }
//   };

//   return (
//     <div className="space-y-4 font-sans">
//       {/* Top Header Card */}
//       <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//         <div>
//           <h3 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
//             <Link2 className="w-4 h-4 text-black" />
//             Car - Customer Relationship & Bookings
//           </h3>
//           <p className="text-xs text-[#71717A] mt-0.5">
//             Assign vehicles to customers, track confirmed bookings, manage insurance, and handle relationship allocations.
//           </p>
//         </div>

//         {isManagerOrOwner && (
//           <button
//             onClick={handleOpenModal}
//             className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-[#27272A] rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
//           >
//             <Plus className="w-4 h-4" />
//             <span>Assign Vehicle to Customer</span>
//           </button>
//         )}
//       </div>

//       {/* Main Relationship & Bookings Table */}
//       <div className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden">
//         <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
//           <h4 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider">
//             Active Allocations ({bookings.length > 0 ? bookings.length : assignments.length} records)
//           </h4>
//           <button
//             onClick={loadRelationshipData}
//             className="text-xs text-[#71717A] hover:text-[#18181B] flex items-center gap-1 font-medium cursor-pointer"
//           >
//             <RefreshCcw className="w-3.5 h-3.5" /> Refresh
//           </button>
//         </div>

//         {isLoading ? (
//           <LoadingSpinner label="Loading allocations & bookings..." />
//         ) : bookings.length === 0 && assignments.length === 0 ? (
//           <div className="py-12 text-center text-xs text-[#71717A] space-y-2">
//             <Link2 className="w-8 h-8 text-slate-300 mx-auto" />
//             <p>No active vehicle-customer relationships found.</p>
//             {isManagerOrOwner && (
//               <button
//                 onClick={handleOpenModal}
//                 className="text-xs font-semibold text-black underline hover:text-[#27272A] cursor-pointer"
//               >
//                 Click here to assign a car to a customer
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
//                 <tr>
//                   <th className="px-5 py-3">Ref ID</th>
//                   <th className="px-5 py-3">Customer</th>
//                   <th className="px-5 py-3">Allocated Vehicle</th>
//                   <th className="px-5 py-3">Booking Date</th>
//                   <th className="px-5 py-3">Insurance</th>
//                   <th className="px-5 py-3">Status</th>
//                   <th className="px-5 py-3 text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-[#F4F4F5] text-sm">
//                 {bookings.length > 0
//                   ? bookings.map((b, idx) => {
//                       const isConfirmed = b.bookingStatus === "CONFIRMED";
//                       const isCancelled = b.bookingStatus === "CANCELLED";
//                       return (
//                         <tr key={b.id || idx} className="hover:bg-[#F9FAFB] transition-colors">
//                           <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
//                             {b.id}
//                           </td>
//                           <td className="px-5 py-3.5 text-xs">
//                             <div className="font-bold text-slate-900">{b.customer?.name || "Customer"}</div>
//                             <div className="text-[11px] text-slate-500 font-mono">{b.customer?.email}</div>
//                           </td>
//                           <td className="px-5 py-3.5 text-xs">
//                             <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold border bg-[#F4F4F5] text-[#18181B] border-[#E4E4E7]">
//                               {b.car?.company} {b.car?.model}
//                             </span>
//                           </td>
//                           <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
//                             {b.bookingDate || "Recent"}
//                           </td>
//                           <td className="px-5 py-3.5 text-xs">
//                             {b.insuranceTaken ? (
//                               <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
//                                 <Shield className="w-3 h-3" /> Insured
//                               </span>
//                             ) : (
//                               <span className="text-[10px] text-slate-400">None</span>
//                             )}
//                           </td>
//                           <td className="px-5 py-3.5 text-xs">
//                             <span
//                               className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
//                                 isConfirmed
//                                   ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
//                                   : isCancelled
//                                     ? "bg-rose-50 text-rose-700 border border-rose-200"
//                                     : "bg-amber-50 text-amber-700 border border-amber-200"
//                               }`}
//                             >
//                               {isConfirmed ? (
//                                 <CheckCircle2 className="w-3 h-3" />
//                               ) : isCancelled ? (
//                                 <XCircle className="w-3 h-3" />
//                               ) : (
//                                 <Clock className="w-3 h-3" />
//                               )}
//                               {b.bookingStatus || "CONFIRMED"}
//                             </span>
//                           </td>
//                           <td className="px-5 py-3.5 text-right">
//                             <div className="flex justify-end items-center gap-2">
//                               <button
//                                 onClick={() => setViewingBooking(b)}
//                                 className="p-1 text-slate-600 hover:text-black border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
//                                 title="View Details"
//                               >
//                                 <Eye className="w-3.5 h-3.5" />
//                               </button>
//                               {isManagerOrOwner && !isCancelled && b.id && (
//                                 <button
//                                   onClick={() => handleCancelBooking(b.id!)}
//                                   className="px-2 py-1 text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer inline-flex items-center gap-1"
//                                   title="Unlink & Cancel Relationship"
//                                 >
//                                   <Trash2 className="w-3 h-3" /> Unlink
//                                 </button>
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })
//                   : assignments.map((a, idx) => (
//                       <tr key={a.id || idx} className="hover:bg-[#F9FAFB] transition-colors">
//                         <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
//                           {a.id}
//                         </td>
//                         <td className="px-5 py-3.5 text-xs">
//                           <div className="font-bold text-slate-900">{a.customerName}</div>
//                           <div className="text-[11px] text-slate-500 font-mono">{a.customerEmail}</div>
//                         </td>
//                         <td className="px-5 py-3.5 text-xs">
//                           <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold border bg-[#F4F4F5] text-[#18181B] border-[#E4E4E7]">
//                             {a.carCompany} {a.carModel}
//                           </span>
//                         </td>
//                         <td className="px-5 py-3.5 text-xs text-slate-600">
//                           {a.bookingDate}
//                         </td>
//                         <td className="px-5 py-3.5 text-xs text-slate-400">
//                           Included
//                         </td>
//                         <td className="px-5 py-3.5 text-xs">
//                           <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
//                             <CheckCircle2 className="w-3 h-3" /> ALLOCATED
//                           </span>
//                         </td>
//                         <td className="px-5 py-3.5 text-right">
//                           <span className="text-xs text-slate-400">Synchronized</span>
//                         </td>
//                       </tr>
//                     ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Assign Vehicle Modal */}
//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title="Assign Vehicle to Customer"
//         subtitle="Establish relationship and create booking in showroom database"
//       >
//         <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
//           {/* Customer Selection */}
//           <div>
//             <label className="block text-xs font-semibold text-[#18181B] mb-1">
//               Select Customer *
//             </label>
//             <div className="relative">
//               <select
//                 value={selectedCustomerId}
//                 onChange={(e) => setSelectedCustomerId(e.target.value)}
//                 disabled={isSubmitting}
//                 required
//                 className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
//               >
//                 {customers.length === 0 ? (
//                   <option value="">No customers registered</option>
//                 ) : (
//                   customers.map((c) => (
//                     <option key={c.id} value={c.id}>
//                       {c.name} ({c.email}) - ID {c.id}
//                     </option>
//                   ))
//                 )}
//               </select>
//               <User className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
//             </div>
//           </div>

//           {/* Car Selection */}
//           <div>
//             <label className="block text-xs font-semibold text-[#18181B] mb-1">
//               Select Showroom Vehicle *
//             </label>
//             <div className="relative">
//               <select
//                 value={selectedCarId}
//                 onChange={(e) => setSelectedCarId(e.target.value)}
//                 disabled={isSubmitting}
//                 required
//                 className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
//               >
//                 {cars.length === 0 ? (
//                   <option value="">No showroom cars available</option>
//                 ) : (
//                   cars.map((c) => (
//                     <option key={c.id} value={c.id} disabled={(c.quantity || 0) <= 0}>
//                       {c.company} {c.model} - Stock: {c.quantity || 0} unit(s){(c.quantity || 0) <= 0 ? " (OUT OF STOCK)" : ""}
//                     </option>
//                   ))
//                 )}
//               </select>
//               <CarFront className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
//             </div>
//           </div>

//           {/* Booking Date */}
//           <div>
//             <label className="block text-xs font-semibold text-[#18181B] mb-1">
//               Booking Date *
//             </label>
//             <div className="relative">
//               <input
//                 type="date"
//                 value={bookingDate}
//                 onChange={(e) => setBookingDate(e.target.value)}
//                 disabled={isSubmitting}
//                 required
//                 className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
//               />
//               <Calendar className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
//             </div>
//           </div>

//           {/* Insurance Toggle */}
//           <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3">
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={insuranceTaken}
//                 onChange={(e) => setInsuranceTaken(e.target.checked)}
//                 className="w-4 h-4 rounded text-black focus:ring-black"
//               />
//               <span className="font-semibold text-slate-900">Include Vehicle Insurance Package</span>
//             </label>

//             {insuranceTaken && (
//               <div className="space-y-3 pt-2 border-t border-slate-200">
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                   <div>
//                     <label className="block text-[11px] font-medium text-slate-700 mb-1">Insurance Provider</label>
//                     <input
//                       type="text"
//                       value={insuranceProvider}
//                       onChange={(e) => setInsuranceProvider(e.target.value)}
//                       placeholder="e.g. Allianz, HDFC ERGO"
//                       className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded outline-none"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[11px] font-medium text-slate-700 mb-1">Policy Number</label>
//                     <input
//                       type="text"
//                       value={insurancePolicyNo}
//                       onChange={(e) => setInsurancePolicyNo(e.target.value)}
//                       placeholder="e.g. POL-982104"
//                       className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded outline-none font-mono"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                   <div>
//                     <label className="block text-[11px] font-medium text-slate-700 mb-1">Premium Amount ($)</label>
//                     <input
//                       type="number"
//                       value={insuranceAmount}
//                       onChange={(e) => setInsuranceAmount(e.target.value)}
//                       className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded outline-none font-mono"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-[11px] font-medium text-slate-700 mb-1">Policy Expiry Date</label>
//                     <input
//                       type="date"
//                       value={insuranceExpiryDate}
//                       onChange={(e) => setInsuranceExpiryDate(e.target.value)}
//                       className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded outline-none"
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
//             <button
//               type="button"
//               onClick={() => setIsModalOpen(false)}
//               disabled={isSubmitting}
//               className="px-3.5 py-2 text-xs font-medium text-[#71717A] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:text-[#18181B] cursor-pointer"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="px-4 py-2 text-xs font-bold text-white bg-black rounded hover:bg-[#27272A] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="w-3.5 h-3.5 animate-spin" />
//                   <span>Assigning...</span>
//                 </>
//               ) : (
//                 <span>Confirm Assignment</span>
//               )}
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* View Booking Details Modal */}
//       <Modal
//         isOpen={!!viewingBooking}
//         onClose={() => setViewingBooking(null)}
//         title="Allocation & Booking Summary"
//         subtitle={viewingBooking ? `Booking Reference ${viewingBooking.id}` : ""}
//       >
//         {viewingBooking && (
//           <div className="space-y-4 text-xs">
//             <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
//               <div className="flex justify-between items-center">
//                 <span className="text-[10px] uppercase font-bold text-slate-500">Customer</span>
//                 <span className="font-bold text-slate-900">{viewingBooking.customer?.name}</span>
//               </div>
//               <div className="flex justify-between items-center text-[11px] text-slate-600">
//                 <span>Email:</span>
//                 <span className="font-mono">{viewingBooking.customer?.email}</span>
//               </div>
//             </div>

//             <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
//               <div className="flex justify-between items-center">
//                 <span className="text-[10px] uppercase font-bold text-slate-500">Allocated Car</span>
//                 <span className="font-bold text-slate-900">{viewingBooking.car?.company} {viewingBooking.car?.model}</span>
//               </div>
//               <div className="flex justify-between items-center text-[11px] text-slate-600">
//                 <span>Booking Date:</span>
//                 <span className="font-medium">{viewingBooking.bookingDate}</span>
//               </div>
//               <div className="flex justify-between items-center text-[11px] text-slate-600">
//                 <span>Status:</span>
//                 <span className="font-bold text-emerald-700">{viewingBooking.bookingStatus}</span>
//               </div>
//             </div>

//             {viewingBooking.insuranceTaken && (
//               <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-md space-y-1 text-emerald-900">
//                 <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-emerald-800">
//                   <ShieldCheck className="w-3.5 h-3.5" /> Insurance Details
//                 </span>
//                 <p>Provider: <span className="font-bold">{viewingBooking.insuranceProvider}</span></p>
//                 <p>Policy No: <span className="font-mono font-bold">{viewingBooking.insurancePolicyNo}</span></p>
//                 <p>Amount: <span className="font-mono font-bold">${viewingBooking.insuranceAmount}</span></p>
//                 <p>Expiry: <span className="font-medium">{viewingBooking.insuranceExpiryDate}</span></p>
//               </div>
//             )}

//             <div className="pt-2">
//               <button
//                 type="button"
//                 onClick={() => setViewingBooking(null)}
//                 className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
//               >
//                 Close Summary
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };
