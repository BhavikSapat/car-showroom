import React, { useState, useEffect } from "react";
import { carService } from "../../services/carService";
import { customerService } from "../../services/customerService";
import { Car, Customer, CarCustomerAssignment } from "../../types";
import {
  Link2,
  Plus,
  RefreshCcw,
  Loader2,
  User,
  CarFront,
  Calendar,
  Trash2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useToast } from "../common/Toast";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Modal } from "../common/Modal";

export const CarCustomerRelationshipModule: React.FC = () => {
  const [assignments, setAssignments] = useState<CarCustomerAssignment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allShowroomCars, setAllShowroomCars] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAssignment, setViewingAssignment] =
    useState<CarCustomerAssignment | null>(null);
  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [carBrandInput, setCarBrandInput] = useState("");
  const [carModelInput, setCarModelInput] = useState("");
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toast = useToast();

  const loadRelationshipData = async () => {
    setIsLoading(true);

    try {
      const [customersRes, showroomCarsRes, joinResultsRes] = await Promise.all(
        [
          customerService.getAllCustomers(0, 100),
          carService.getAllCars(),
          customerService.getCustomersWithCars(),
        ],
      );

      let fetchedCustomers: Customer[] = [];
      if (
        customersRes &&
        typeof customersRes === "object" &&
        Array.isArray((customersRes as any).content)
      ) {
        fetchedCustomers = (customersRes as any).content;
      }
      setCustomers(fetchedCustomers);

      if (Array.isArray(showroomCarsRes)) {
        setAllShowroomCars(showroomCarsRes);
      }

      // ============================================================
      // BUILD MODEL ID -> COMPANY LOOKUP FROM SHOWROOM API
      // ============================================================

      const modelCompanyMap = new Map<number, string>();
      const modelNameMap = new Map<number, string>();

      if (Array.isArray(showroomCarsRes)) {
        showroomCarsRes.forEach((car: any) => {
          if (Array.isArray(car.models)) {
            car.models.forEach((model: any) => {
              if (model.id) {
                modelCompanyMap.set(
                  Number(model.id),
                  car.company || "Unknown Brand",
                );
                modelNameMap.set(Number(model.id), model.modelName || "Model");
              }
            });
          }
        });
      }

      // ============================================================
      // BUILD RELATIONSHIP TABLE
      // ============================================================

      const relationshipRows: CarCustomerAssignment[] = [];
      const addedKeys = new Set<string>();

      // ------------------------------------------------------------
      // 1. CUSTOMER -> ASSIGNED MODELS
      // ------------------------------------------------------------

      fetchedCustomers.forEach((cust) => {
        const models = (cust as any).assignedModels || (cust as any).cars || [];

        models.forEach((m: any, idx: number) => {
          const modelId = Number(m.id);

          // First try direct company information
          // Then fall back to showroom API lookup
          const comp =
            m.car?.company ||
            m.company ||
            m.carCompany ||
            modelCompanyMap.get(modelId) ||
            "Unknown Brand";

          const mod =
            m.modelName ||
            m.model ||
            m.carModel ||
            modelNameMap.get(modelId) ||
            "Model";

          const key = `${cust.id}-${modelId || mod}`;

          if (!addedKeys.has(key)) {
            addedKeys.add(key);

            relationshipRows.push({
              id: modelId || idx + 1,
              customerName: cust.name,
              customerEmail: cust.email,
              carCompany: comp,
              carModel: mod,
              bookingDate:
                cust.bookingDate || new Date().toISOString().split("T")[0],
            });
          }
        });
      });

      // ------------------------------------------------------------
      // 2. JOIN RESULTS
      // ------------------------------------------------------------

      if (Array.isArray(joinResultsRes)) {
        joinResultsRes.forEach((j: any, idx: number) => {
          if (j.carCompany || j.carModel || j.modelId) {
            const modelId = Number(j.modelId || j.carId || j.id);

            const mappedCompany =
              j.carCompany || modelCompanyMap.get(modelId) || "Unknown Brand";

            const mappedModel =
              j.carModel || j.modelName || modelNameMap.get(modelId) || "Model";

            const key = `${j.customerName || j.name}-${modelId || mappedModel}`;

            if (!addedKeys.has(key)) {
              addedKeys.add(key);

              relationshipRows.push({
                id: modelId || idx + 1000,
                customerName: j.customerName || j.name || "Customer",
                customerEmail: j.email || "",
                carCompany: mappedCompany,
                carModel: mappedModel,
                bookingDate:
                  j.bookingDate || new Date().toISOString().split("T")[0],
              });
            }
          }
        });
      }

      setAssignments(relationshipRows);
    } catch (err: any) {
      toast.error(
        "Failed to load relationship data",
        err.message || "Server error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRelationshipData();
  }, []);

  const handleOpenAssignModal = () => {
    if (customers.length > 0) {
      setSelectedCustomerId(String(customers[0].id || ""));
      setBookingDate(
        customers[0].bookingDate || new Date().toISOString().split("T")[0],
      );
    } else {
      setSelectedCustomerId("");
      setBookingDate(new Date().toISOString().split("T")[0]);
    }

    setSelectedModelId("");
    setCarBrandInput("");
    setCarModelInput("");
    setIsModalOpen(true);
  };

  const handleCustomerSelectChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => String(c.id) === custId);
    if (found && found.bookingDate) {
      setBookingDate(found.bookingDate);
    }
  };

  const handleShowroomModelSelect = (modelIdStr: string) => {
    setSelectedModelId(modelIdStr);
    if (!modelIdStr) return;

    // Find company and model name for auto-filling inputs
    for (const c of allShowroomCars) {
      if (Array.isArray(c.models)) {
        const foundM = c.models.find((m: any) => String(m.id) === modelIdStr);
        if (foundM) {
          setCarBrandInput(c.company || "");
          setCarModelInput(foundM.modelName || "");
          break;
        }
      }
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (customers.length === 0) {
      toast.error(
        "No Registered Customers",
        "There are no customers registered in the system. Please register a customer first.",
      );
      return;
    }

    const matchedCustomer =
      customers.find((c) => String(c.id) === selectedCustomerId) ||
      customers[0];

    if (!matchedCustomer || !matchedCustomer.id) {
      toast.error(
        "Customer Selection Error",
        "Please select a valid registered customer.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let targetModelId = selectedModelId ? Number(selectedModelId) : null;

      // If user typed brand and model instead of picking from dropdown, find or create model ID
      if (!targetModelId) {
        if (!carBrandInput.trim() || !carModelInput.trim()) {
          toast.error(
            "Missing Fields",
            "Please select a vehicle or enter both Car Brand and Model.",
          );
          setIsSubmitting(false);
          return;
        }

        // Search in existing showroom cars
        for (const c of allShowroomCars) {
          if (
            c.company?.toLowerCase() === carBrandInput.trim().toLowerCase() &&
            Array.isArray(c.models)
          ) {
            const foundM = c.models.find(
              (m: any) =>
                m.modelName?.toLowerCase() ===
                carModelInput.trim().toLowerCase(),
            );
            if (foundM && foundM.id) {
              targetModelId = foundM.id;
              break;
            }
          }
        }

        // If still not found, create new car brand & model in database first
        if (!targetModelId) {
          const newCarRes = await carService.addCar({
            company: carBrandInput.trim(),
            models: [
              {
                modelName: carModelInput.trim(),
                quantity: 10,
              },
            ],
          });

          if (
            typeof newCarRes === "object" &&
            Array.isArray(newCarRes.models)
          ) {
            const createdM =
              newCarRes.models.find(
                (m: any) =>
                  m.modelName?.toLowerCase() ===
                  carModelInput.trim().toLowerCase(),
              ) || newCarRes.models[0];
            if (createdM && createdM.id) {
              targetModelId = createdM.id;
            }
          }
        }
      }

      if (!targetModelId) {
        // Fallback reload and retry search
        const refreshedCars = await carService.getAllCars();
        for (const c of refreshedCars) {
          if (Array.isArray(c.models)) {
            const m = c.models.find(
              (m: any) =>
                m.modelName?.toLowerCase() ===
                carModelInput.trim().toLowerCase(),
            );
            if (m && m.id) {
              targetModelId = m.id;
              break;
            }
          }
        }
      }

      if (!targetModelId) {
        toast.error(
          "Model Error",
          "Could not locate or create a valid car model ID in database.",
        );
        setIsSubmitting(false);
        return;
      }

      // Execute POST /customer/{customerId}/assign via backend API
      const assignRes = await customerService.assignModels(matchedCustomer.id, [
        targetModelId,
      ]);

      if (typeof assignRes === "string") {
        if (
          assignRes.includes("Access Denied") ||
          assignRes.includes("Invalid")
        ) {
          toast.error("Assignment Failed", assignRes);
        } else {
          toast.info("Backend Response", assignRes);
        }
      } else {
        toast.success(
          "Vehicle Assigned",
          `Assigned ${carBrandInput || "Model #" + targetModelId} to ${matchedCustomer.name} successfully.`,
        );
      }

      setIsModalOpen(false);
      await loadRelationshipData();
    } catch (err: any) {
      toast.error(
        "Assignment Failed",
        err.message || "Error assigning car model to customer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // UNLINK CAR FROM CUSTOMER
  // ============================================================
  const handleDeleteAssignment = async (carId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to unlink this car from the customer?",
      )
    ) {
      return;
    }

    try {
      // Find the customer who owns this car
      const assignment = assignments.find((item) => item.id === carId);

      if (!assignment) {
        toast.error(
          "Unlink Failed",
          "Could not find the selected car assignment.",
        );
        return;
      }

      // Find the customer using the assignment information
      const customer = customers.find(
        (c) =>
          c.name === assignment.customerName &&
          c.email === assignment.customerEmail,
      );

      if (!customer || !customer.id) {
        toast.error(
          "Unlink Failed",
          "Could not find the customer associated with this vehicle.",
        );
        return;
      }

      // Get customer's existing cars
      const existingCars = customer.cars || [];

      // Remove ONLY the selected car
      const updatedCars = (customer.cars || []).filter(
        (car) => car.id !== carId,
      );
      // Update customer with the remaining cars
      await customerService.updateCustomer(customer.id, {
        ...customer,
        cars: updatedCars,
      });
      toast.success(
        "Relationship Unlinked",
        `${assignment.carCompany} ${assignment.carModel} has been removed from ${customer.name}.`,
      );

      // Reload relationship data so UI reflects backend data
      await loadRelationshipData();
    } catch (err: any) {
      console.error("Unlink Car Error:", err);

      toast.error(
        "Unlink Failed",
        err.response?.data ||
          err.message ||
          "Failed to remove the vehicle from the customer.",
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-[#E4E4E7] rounded-lg p-5">
        <div>
          <h3 className="text-sm font-semibold text-[#18181B]">
            Car - Customer Relationship Directory
          </h3>

          <p className="text-xs text-[#71717A] mt-1">
            Assign existing showroom vehicles to registered customers from the
            database.
          </p>
        </div>

        <button
          onClick={handleOpenAssignModal}
          className="px-4 py-2 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Vehicle to Customer</span>
        </button>
      </div>

      {/* Main Relationship Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
          <h4 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider">
            Active Vehicle & Customer Relationship Mapping
          </h4>

          <button
            onClick={loadRelationshipData}
            className="text-xs text-[#71717A] hover:text-[#18181B] flex items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh Directory
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Loading vehicle customer mappings..." />
        ) : assignments.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#71717A] space-y-2">
            <p>No active car-customer assignments established yet.</p>

            <button
              onClick={handleOpenAssignModal}
              className="text-xs font-semibold text-black underline hover:text-[#27272A] cursor-pointer"
            >
              Click here to assign an existing vehicle to a customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
                <tr>
                  <th className="px-6 py-3">Customer Name</th>

                  <th className="px-6 py-3">Customer Email</th>

                  <th className="px-6 py-3">Assigned Brand</th>

                  <th className="px-6 py-3">Car Model</th>

                  <th className="px-6 py-3">Booking Date</th>

                  {/* Marketing Preference */}
                  {/*
                  <th className="px-6 py-3 text-center">
                    Marketing Preference
                  </th>
                  */}

                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F4F4F5] text-sm">
                {assignments.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F9FAFB] transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-[#18181B]">
                      {item.customerName}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-[#71717A]">
                      {item.customerEmail || "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border bg-[#F4F4F5] text-[#18181B] border-[#E4E4E7]">
                        {item.carCompany}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono text-xs font-semibold text-[#18181B]">
                      {item.carModel}
                    </td>

                    <td className="px-6 py-4 text-xs text-[#71717A]">
                      {item.bookingDate}
                    </td>

                    {/* Marketing Preference */}
                    {/* 
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.marketing?.toLowerCase() === "interested"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {item.marketing || "Interested"}
                      </span>
                    </td> */}

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingAssignment(item)}
                          className="p-1 text-[#18181B] hover:text-black bg-[#F4F4F5] border border-[#E4E4E7] rounded transition-colors cursor-pointer inline-flex items-center gap-1 text-xs px-2 py-1"
                          title="View Relationship"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        {/* 
                        <button
                          onClick={() => handleDeleteAssignment(item.id)}
                          className="p-1 text-red-600 hover:text-red-800 bg-red-50 border border-red-200 rounded transition-colors cursor-pointer inline-flex items-center gap-1 text-xs px-2 py-1"
                          title="Remove Assignment"
                        >
                          <Trash2 className="w-3 h-3" />
                          Unlink
                        </button> */}
                      </div>
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
        title="Assign Vehicle & Update Customer"
        subtitle="Select a registered customer and specify vehicle, booking date, and marketing preference"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          {/* Registered Customer Select */}
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Select Registered Customer *
            </label>

            {customers.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />

                <span>
                  No registered customers found in API data. Please register a
                  customer first.
                </span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelectChange(e.target.value)}
                  disabled={isSubmitting}
                  required
                  className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
                >
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} ({cust.email || "No Email"})
                    </option>
                  ))}
                </select>

                <User className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
              </div>
            )}
          </div>

          {/* Select Existing Showroom Car Model (Optional Quick Select) */}
          {allShowroomCars.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Select Available Showroom Vehicle (Quick Pick)
              </label>

              <div className="relative">
                <select
                  value={selectedModelId}
                  onChange={(e) => handleShowroomModelSelect(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
                >
                  <option value="">
                    -- Or enter custom brand & model below --
                  </option>
                  {allShowroomCars.flatMap((c) =>
                    (c.models || []).map((m: any) => {
                      const avail =
                        (m.quantity || 0) - (m.assignedQuantity || 0);
                      return (
                        <option key={m.id} value={m.id}>
                          {c.company} - {m.modelName} (Available Stock:{" "}
                          {avail > 0 ? avail : 0})
                        </option>
                      );
                    }),
                  )}
                </select>

                <CarFront className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          {/* Car Brand Input */}
          {/* <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Car Brand / Company *
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="e.g. BMW, Tesla, Porsche, Mercedes"
                value={carBrandInput}
                onChange={(e) => setCarBrandInput(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
              />

              <CarFront className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div> */}

          {/* Car Model Input */}
          {/* <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Car Model *
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="e.g. M4 Competition, Model 3, 911 GT3 RS"
                value={carModelInput}
                onChange={(e) => setCarModelInput(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
              />

              <CarFront className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div> */}

          {/* Booking Date Input */}
          {/* <div>
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
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              />

              <Calendar className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div> */}

          {/* Marketing Preference Dropdown */}
          {/*
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Marketing Email Preference *
            </label>

            <select
              value={marketing}
              onChange={(e) => setMarketing(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            >
              <option value="Interested">
                Interested (Opted-In)
              </option>

              <option value="Not Interested">
                Not Interested (Opted-Out)
              </option>
            </select>
          </div>
          */}

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
              disabled={isSubmitting || customers.length === 0}
              className="px-4 py-2 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating API...</span>
                </>
              ) : (
                <span>Assign Vehicle & Update Account</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={!!viewingAssignment}
        onClose={() => setViewingAssignment(null)}
        title="Vehicle & Customer Details"
        subtitle={viewingAssignment ? `Customer Vehicle Relationship` : ""}
      >
        {viewingAssignment && (
          <div className="space-y-4">
            {/* Customer Header */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {viewingAssignment.customerName}
                </h4>

                <p className="text-xs text-slate-500 font-mono">
                  {viewingAssignment.customerEmail || "No Email"}
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2 text-xs">
              {/* Customer Name */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Customer:
                </span>

                <span className="font-semibold text-slate-900">
                  {viewingAssignment.customerName}
                </span>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Customer Email:</span>

                <span className="font-mono font-bold text-slate-900">
                  {viewingAssignment.customerEmail || "N/A"}
                </span>
              </div>

              {/* Booking Date */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Booking Date:
                </span>

                <span className="font-semibold text-slate-900">
                  {viewingAssignment.bookingDate || "N/A"}
                </span>
              </div>

              {/* Vehicle */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5 mb-2 font-semibold">
                  <CarFront className="w-3.5 h-3.5 text-slate-400" />
                  Assigned Vehicle
                </span>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Brand / Company
                      </p>

                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {viewingAssignment.carCompany || "N/A"}
                      </p>
                    </div>

                    <CarFront className="w-5 h-5 text-slate-400" />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Model
                    </p>

                    <p className="text-xs font-semibold text-slate-800 mt-0.5">
                      {viewingAssignment.carModel || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setViewingAssignment(null)}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
