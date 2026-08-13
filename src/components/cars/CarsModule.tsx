import React, { useState, useEffect } from "react";
import { carService } from "../../services/carService";
import { customerService } from "../../services/customerService";
import { Car } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  CarFront,
  Search,
  Plus,
  RefreshCcw,
  Loader2,
  Building,
  Tag,
  PackagePlus,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "../common/Toast";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Modal } from "../common/Modal";

interface ShowroomInventoryItem {
  id: number;
  company: string;
  modelName: string;
  quantity: number;
  assignedQuantity: number;
  modelId: number;
}

export const CarsModule: React.FC = () => {
  const { role } = useAuth();
  const [inventory, setInventory] = useState<ShowroomInventoryItem[]>([]);
  const [carCount, setCarCount] = useState<number>(0);
  const [searchBrand, setSearchBrand] = useState<string>("");
  const [searchModel, setSearchModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Car Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [companyInput, setCompanyInput] = useState<string>("");
  const [modelInput, setModelInput] = useState<string>("");
  const [quantityInput, setQuantityInput] = useState<string>("10");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Add Storage Modal states (OWNER role)
  const [isStorageModalOpen, setIsStorageModalOpen] = useState<boolean>(false);
  const [selectedStorageModel, setSelectedStorageModel] =
    useState<ShowroomInventoryItem | null>(null);
  const [storageQuantity, setStorageQuantity] = useState<string>("5");
  const [isAddingStorage, setIsAddingStorage] = useState<boolean>(false);

  const toast = useToast();

  const loadCarsData = async () => {
    setIsLoading(true);
    try {
      // Fetch GET /car (All companies & models) and total quantity count
      const [carsRes, totalStock, joinsRes] = await Promise.all([
        carService.getAllCars(),
        carService.getCarCount(),
        customerService.getCustomersWithCars(),
      ]);

      const mappedList: ShowroomInventoryItem[] = [];

      // 1. Map directly from GET /car endpoint
      if (Array.isArray(carsRes) && carsRes.length > 0) {
        let idxCounter = 1;
        carsRes.forEach((carObj: any) => {
          const companyName = carObj.company || carObj.carCompany || "Brand";
          if (Array.isArray(carObj.models) && carObj.models.length > 0) {
            carObj.models.forEach((m: any) => {
              mappedList.push({
                id: idxCounter++,
                company: companyName,
                modelName: m.modelName || m.model || "Model",
                quantity: m.quantity || 0,
                assignedQuantity: m.assignedQuantity || 0,
                modelId: m.id,
              });
            });
          }
        });
      }

      // 2. If GET /car had no models yet, map from join results
      if (mappedList.length === 0 && Array.isArray(joinsRes)) {
        joinsRes.forEach((item: any, idx: number) => {
          if (item.carCompany || item.carModel) {
            mappedList.push({
              id: idx + 1,
              company: item.carCompany || item.company || "Brand",
              modelName: item.carModel || item.model || "Model",
              quantity: 1,
              assignedQuantity: 0,
              modelId: idx + 1,
            });
          }
        });
      }

      const totalAvailableCars = mappedList.reduce(
        (total, item) =>
          total +
          Math.max(0, (item.quantity || 0) - (item.assignedQuantity || 0)),
        0,
      );

      setInventory(mappedList);
      setCarCount(totalAvailableCars);
    } catch (err: any) {
      toast.error("Failed to load cars inventory", err.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCarsData();
  }, []);

  const openAddModal = () => {
    setCompanyInput("");
    setModelInput("");
    setQuantityInput("10");
    setIsModalOpen(true);
  };

  const openStorageModal = (item: ShowroomInventoryItem) => {
    if (role !== "OWNER") {
      toast.error(
        "Access Denied",
        "Only OWNER role can add inventory storage stock.",
      );
      return;
    }
    setSelectedStorageModel(item);
    setStorageQuantity("5");
    setIsStorageModalOpen(true);
  };

  const handleCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyInput.trim() || !modelInput.trim()) {
      toast.error(
        "Missing Fields",
        "Please enter both Car Brand and Model name.",
      );
      return;
    }

    const qtyNum = parseInt(quantityInput, 10);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("Invalid Quantity", "Quantity stock must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await carService.addCar({
        company: companyInput.trim(),
        models: [
          {
            modelName: modelInput.trim(),
            quantity: qtyNum,
          },
        ],
      });

      if (
        typeof res === "string" &&
        (res.includes("Access Denied") || res.includes("Invalid"))
      ) {
        toast.error("Failed to Add Car", res);
      } else {
        toast.success(
          "Car Registered",
          `${companyInput.trim()} ${modelInput.trim()} added with ${qtyNum} units.`,
        );
        setIsModalOpen(false);
        loadCarsData();
      }
    } catch (err: any) {
      toast.error(
        "Operation Failed",
        err.message || "Error saving vehicle record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStorageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStorageModel || !selectedStorageModel.modelId) return;

    const qtyToAdd = parseInt(storageQuantity, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error("Invalid Quantity", "Quantity must be greater than 0.");
      return;
    }

    setIsAddingStorage(true);
    try {
      const res = await carService.addStorage(
        selectedStorageModel.modelId,
        qtyToAdd,
      );
      if (typeof res === "string" && res.includes("Access Denied")) {
        toast.error("Storage Add Failed", res);
      } else {
        toast.success(
          "Stock Updated",
          `Added ${qtyToAdd} units to ${selectedStorageModel.company} ${selectedStorageModel.modelName}.`,
        );
        setIsStorageModalOpen(false);
        loadCarsData();
      }
    } catch (err: any) {
      toast.error(
        "Failed to Update Storage",
        err.message || "Error calling storage API.",
      );
    } finally {
      setIsAddingStorage(false);
    }
  };

  // Filtered cars list based on Brand & Model search
  const filteredInventory = inventory.filter((item) => {
    const matchesBrand =
      !searchBrand.trim() ||
      item.company.toLowerCase().includes(searchBrand.toLowerCase());
    const matchesModel =
      !searchModel.trim() ||
      item.modelName.toLowerCase().includes(searchModel.toLowerCase());
    return matchesBrand && matchesModel;
  });

  return (
    <div className="space-y-4 font-sans">
      {/* Top Metric Header Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-[#E4E4E7] rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
              Total Showroom Stock
            </span>
            <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
              <CarFront className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-semibold mt-2 text-[#18181B]">
            {carCount}
          </p>
        </div>

        <div className="md:col-span-2 bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#18181B]">
              Showroom Fleet Directory
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Manage vehicle brands, models, and inventory storage stock.
            </p>
          </div>

          {(role === "OWNER" || role === "MANAGER") && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-black hover:bg-[#27272A] rounded-md transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Car</span>
            </button>
          )}
        </div>
      </div>

      {/* Car Search Filters */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 space-y-3">
        <h4 className="text-[10px] uppercase font-semibold text-[#71717A] tracking-wider">
          Filter Inventory
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Car Brand / Company..."
              value={searchBrand}
              onChange={(e) => setSearchBrand(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-[#E4E4E7] rounded bg-white text-[#18181B] focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
            />
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by Model..."
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-[#E4E4E7] rounded bg-white text-[#18181B] focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
            />
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Showroom Cars Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider">
            Showroom Vehicles List ({filteredInventory.length})
          </h3>
          <div className="flex items-center gap-2">
            {/* {(role === "OWNER" || role === "MANAGER") && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-black hover:bg-[#27272A] rounded transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Car
              </button>
            )} */}
            <button
              onClick={loadCarsData}
              className="text-xs text-[#71717A] hover:text-[#18181B] flex items-center gap-1 font-medium cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Fetching showroom vehicles..." />
        ) : filteredInventory.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#71717A] space-y-2">
            <CarFront className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No vehicles found in showroom inventory.</p>
            {(role === "OWNER" || role === "MANAGER") && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-black rounded hover:bg-[#27272A]"
              >
                <Plus className="w-3.5 h-3.5" /> Register First Vehicle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Model ID</th>
                  <th className="px-6 py-3">Car Brand / Company</th>
                  <th className="px-6 py-3">Model Name</th>
                  <th className="px-6 py-3">Total Stock</th>
                  <th className="px-6 py-3">Assigned</th>
                  <th className="px-6 py-3">Available</th>
                  {role === "OWNER" && (
                    <th className="px-6 py-3 text-right">Storage</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] text-sm">
                {filteredInventory.map((item, idx) => {
                  const available =
                    (item.quantity || 0) - (item.assignedQuantity || 0);
                  return (
                    <tr
                      key={item.modelId || idx}
                      className="hover:bg-[#F9FAFB] transition-colors"
                    >
                      <td className="px-6 py-4 text-xs text-[#18181B]/50 font-mono">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium text-[#18181B]">
                        {item.modelId || item.id}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#18181B]">
                        <span className="inline-block px-2.5 py-1 rounded text-xs font-bold border bg-[#F4F4F5] text-[#18181B] border-[#E4E4E7]">
                          {item.company}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#18181B] font-semibold">
                        {item.modelName}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#18181B]">
                        <span className="font-mono font-medium">
                          {item.quantity}
                        </span>{" "}
                        units
                      </td>
                      <td className="px-6 py-4 text-xs text-amber-700">
                        <span className="font-mono font-medium">
                          {item.assignedQuantity}
                        </span>{" "}
                        assigned
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                            available > 0
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {available > 0
                            ? `${available} Available`
                            : "Out of Stock"}
                        </span>
                      </td>
                      {role === "OWNER" && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => openStorageModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#18181B] bg-[#F4F4F5] hover:bg-[#E4E4E7] border border-[#E4E4E7] rounded transition-colors cursor-pointer"
                            title="Add Storage (PUT /model/{id}/storage)"
                          >
                            <PackagePlus className="w-3.5 h-3.5" /> + Stock
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Car Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Vehicle"
        subtitle="POST /car API endpoint - Add car brand and model"
      >
        <form onSubmit={handleCarSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Car Brand / Company Name *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. BMW, Tesla, Porsche, Mercedes-Benz"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
              />
              <Building className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Car Model Name *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. M4 Competition, Model 3, 911 GT3 RS"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
              />
              <Tag className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Initial Storage Quantity *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              />
              <Layers className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
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
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Vehicle</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Storage Stock Modal (OWNER role) */}
      <Modal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        title="Add Inventory Storage Stock"
        subtitle="PUT /model/{modelId}/storage?quantity=N API endpoint"
      >
        {selectedStorageModel && (
          <form onSubmit={handleStorageSubmit} className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {selectedStorageModel.company} -{" "}
                {selectedStorageModel.modelName}
              </p>
              <p className="text-slate-600">
                Current Stock:{" "}
                <span className="font-bold">
                  {selectedStorageModel.quantity}
                </span>{" "}
                | Assigned:{" "}
                <span className="font-bold">
                  {selectedStorageModel.assignedQuantity}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Additional Units to Add *
              </label>
              <input
                type="number"
                min="1"
                value={storageQuantity}
                onChange={(e) => setStorageQuantity(e.target.value)}
                disabled={isAddingStorage}
                required
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(false)}
                disabled={isAddingStorage}
                className="px-3.5 py-2 text-xs font-medium text-[#71717A] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:text-[#18181B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingStorage}
                className="px-4 py-2 text-xs font-bold text-white bg-black rounded hover:bg-[#27272A] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAddingStorage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Adding Stock...</span>
                  </>
                ) : (
                  <span>Add Inventory Units</span>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
