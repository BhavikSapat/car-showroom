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
  Edit2,
  Trash2,
  DollarSign,
  Palette,
  Calendar,
  Fuel,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  Upload,
} from "lucide-react";
import { useToast } from "../common/Toast";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Modal } from "../common/Modal";

export const CarsModule: React.FC = () => {
  const { role } = useAuth();
  const isOwner = role === "OWNER";
  const isManagerOrOwner = role === "OWNER" || role === "MANAGER";

  const [cars, setCars] = useState<Car[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchBrand, setSearchBrand] = useState<string>("");
  const [searchModel, setSearchModel] = useState<string>("");
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>("ALL");
  const [transmissionFilter, setTransmissionFilter] = useState<string>("ALL");
  const [colorFilter, setColorFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isCarModalOpen, setIsCarModalOpen] = useState<boolean>(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    company: "",
    model: "",
    variant: "",
    color: "",
    fuelType: "Petrol",
    transmission: "Automatic",
    manufacturingYear: new Date().getFullYear(),
    price: 35000,
    quantity: 5,
    status: "AVAILABLE",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [selectedCarForRestock, setSelectedCarForRestock] =
    useState<Car | null>(null);
  const [restockUnits, setRestockUnits] = useState<string>("5");
  const [isRestocking, setIsRestocking] = useState<boolean>(false);

  const [viewingCar, setViewingCar] = useState<Car | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(
    null,
  );
  const [isCheckingAvailability, setIsCheckingAvailability] =
    useState<boolean>(false);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkInput, setBulkInput] = useState<string>(`[
  {
    "company": "Porsche",
    "model": "911 GT3",
    "variant": "Touring",
    "color": "Chalk Gray",
    "fuelType": "Petrol",
    "transmission": "Manual",
    "manufacturingYear": 2024,
    "price": 185000,
    "quantity": 3,
    "status": "AVAILABLE"
  },
  {
    "company": "Audi",
    "model": "RS e-tron GT",
    "variant": "Performance",
    "color": "Daytona Gray",
    "fuelType": "Electric",
    "transmission": "Automatic",
    "manufacturingYear": 2024,
    "price": 145000,
    "quantity": 4,
    "status": "AVAILABLE"
  }
]`);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState<boolean>(false);

  const toast = useToast();

  const loadCarsData = async () => {
    setIsLoading(true);

    try {
      const allRes = await carService.getAllCars();

      let allCars: Car[] = [];

      if (Array.isArray(allRes)) {
        allRes.forEach((item: any, idx: number) => {
          if (Array.isArray(item.models) && item.models.length > 0) {
            item.models.forEach((m: any) => {
              allCars.push({
                id: m.id || idx + 1,
                company: item.company || "Brand",
                model: m.modelName || m.model || "Model",
                quantity: m.quantity !== undefined ? m.quantity : 1,
                status: (m.quantity || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
                price: m.price || 35000,
                color: m.color || "Standard",
                fuelType: m.fuelType || "Petrol",
                transmission: m.transmission || "Automatic",
                manufacturingYear:
                  m.manufacturingYear || new Date().getFullYear(),
              });
            });
          } else {
            allCars.push({
              id: item.id || idx + 1,
              company: item.company || item.carCompany || "Brand",
              model: item.model || item.carModel || "Model",
              variant: item.variant || "Standard",
              color: item.color || "Metallic Black",
              fuelType: item.fuelType || "Petrol",
              transmission: item.transmission || "Automatic",
              manufacturingYear:
                item.manufacturingYear || new Date().getFullYear(),
              price: item.price || 30000,
              quantity: item.quantity !== undefined ? item.quantity : 1,
              status:
                item.status ||
                ((item.quantity || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
            });
          }
        });
      }

      const totalUnits = allCars.reduce(
        (sum, car) => sum + (car.quantity || 0),
        0,
      );

      setTotalCount(totalUnits);

      let displayCars: Car[];

      if (statusFilter === "ALL") {
        displayCars = allCars;
      } else {
        const res = await carService.getByStatus(statusFilter);
        displayCars = Array.isArray(res) ? res : [];
      }

      setCars(displayCars);
    } catch (err: any) {
      toast.error("Failed to load vehicle directory", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCarsData();
  }, [statusFilter]);

  const handleOpenAddModal = () => {
    setEditingCar(null);
    setFormData({
      company: "",
      model: "",
      variant: "Standard",
      color: "Black Sapphire",
      fuelType: "Petrol",
      transmission: "Automatic",
      manufacturingYear: new Date().getFullYear(),
      price: 35000,
      quantity: 5,
      status: "AVAILABLE",
    });
    setIsCarModalOpen(true);
  };

  const handleOpenEditModal = (car: Car) => {
    setEditingCar(car);
    setFormData({
      company: car.company || "",
      model: car.model || "",
      variant: car.variant || "Standard",
      color: car.color || "Black",
      fuelType: car.fuelType || "Petrol",
      transmission: car.transmission || "Automatic",
      manufacturingYear: car.manufacturingYear || new Date().getFullYear(),
      price: car.price || 35000,
      quantity: car.quantity !== undefined ? car.quantity : 1,
      status:
        car.status || ((car.quantity || 0) > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
    });
    setIsCarModalOpen(true);
  };

  const handleOpenRestockModal = (car: Car) => {
    if (!isOwner) {
      toast.error(
        "Access Denied",
        "Only OWNER role can restock inventory storage.",
      );
      return;
    }
    setSelectedCarForRestock(car);
    setRestockUnits("5");
    setIsRestockModalOpen(true);
  };

  const handleOpenViewModal = async (car: Car) => {
    setViewingCar(car);
    setAvailabilityMessage(null);
    if (car.id) {
      setIsCheckingAvailability(true);
      try {
        const msg = await carService.checkAvailability(car.id);
        setAvailabilityMessage(
          typeof msg === "string" ? msg : JSON.stringify(msg),
        );
      } catch (err: any) {
        setAvailabilityMessage("Status: " + (car.status || "AVAILABLE"));
      } finally {
        setIsCheckingAvailability(false);
      }
    }
  };

  const handleCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.model.trim()) {
      toast.error("Missing Information", "Brand and Model name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCar && editingCar.id) {
        // PUT /car/{carId}
        const updatedPayload = {
          ...editingCar,
          company: formData.company.trim(),
          model: formData.model.trim(),
          variant: formData.variant.trim(),
          color: formData.color.trim(),
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          manufacturingYear: Number(formData.manufacturingYear),
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          status:
            formData.status ||
            (Number(formData.quantity) > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
        };
        const res = await carService.updateCar(editingCar.id, updatedPayload);
        if (typeof res === "string" && res.includes("Access Denied")) {
          toast.error("Update Failed", res);
        } else {
          toast.success(
            "Car Updated",
            `Vehicle ${editingCar.id} details saved.`,
          );
          setIsCarModalOpen(false);
          loadCarsData();
        }
      } else {
        // POST /car
        const newCarPayload = {
          company: formData.company.trim(),
          model: formData.model.trim(),
          variant: formData.variant.trim(),
          color: formData.color.trim(),
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          manufacturingYear: Number(formData.manufacturingYear),
          price: Number(formData.price),
          quantity: Number(formData.quantity),
          status:
            formData.status ||
            (Number(formData.quantity) > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
        };
        const res = await carService.addCar(newCarPayload);
        if (typeof res === "string" && res.includes("Access Denied")) {
          toast.error("Add Failed", res);
        } else {
          toast.success(
            "Vehicle Registered",
            `${formData.company} ${formData.model} added to stock.`,
          );
          setIsCarModalOpen(false);
          loadCarsData();
        }
      }
    } catch (err: any) {
      toast.error(
        "Operation Failed",
        err.message || "Could not save vehicle record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCar = async (car: Car) => {
    if (!isOwner) {
      toast.error("Access Denied", "Only OWNER accounts can delete vehicles.");
      return;
    }
    if (!car.id) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${car.company} ${car.model} (ID ${car.id}) from the showroom database?`,
      )
    ) {
      return;
    }

    try {
      const msg = await carService.deleteCar(car.id);
      if (typeof msg === "string" && msg.includes("Access Denied")) {
        toast.error("Access Denied", msg);
      } else {
        toast.success(
          "Car Deleted",
          typeof msg === "string"
            ? msg
            : `Vehicle ${car.id} removed from showroom.`,
        );
        loadCarsData();
      }
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarForRestock || !selectedCarForRestock.id) return;

    const count = parseInt(restockUnits, 10);
    if (isNaN(count) || count <= 0) {
      toast.error("Invalid Count", "Restock unit count must be at least 1.");
      return;
    }

    setIsRestocking(true);
    try {
      const res = await carService.restockCar(selectedCarForRestock.id, count);
      if (typeof res === "string" && res.includes("Access Denied")) {
        toast.error("Restock Failed", res);
      } else {
        toast.success(
          "Inventory Restocked",
          `Added ${count} units to ${selectedCarForRestock.company} ${selectedCarForRestock.model}.`,
        );
        setIsRestockModalOpen(false);
        loadCarsData();
      }
    } catch (err: any) {
      toast.error("Restock Failed", err.message);
    } finally {
      setIsRestocking(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedCars = JSON.parse(bulkInput);
      if (!Array.isArray(parsedCars) || parsedCars.length === 0) {
        toast.error(
          "Invalid Format",
          "Input must be a non-empty JSON array of cars.",
        );
        return;
      }

      setIsBulkSubmitting(true);
      const res = await carService.addMultipleCars(parsedCars);
      toast.success(
        "Bulk Upload Complete",
        `Successfully added ${Array.isArray(res) ? res.length : parsedCars.length} vehicles.`,
      );
      setIsBulkModalOpen(false);
      loadCarsData();
    } catch (err: any) {
      toast.error(
        "Bulk Upload Error",
        err.message || "Failed to parse or submit JSON.",
      );
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const uniqueFuelTypes = Array.from(
    new Set([
      "Petrol",
      "Diesel",
      "Electric",
      "CNG",
      ...cars.map((c) => c.fuelType).filter(Boolean),
    ]),
  );
  const uniqueTransmissions = Array.from(
    new Set([
      "Automatic",
      "Manual",
      ...cars.map((c) => c.transmission).filter(Boolean),
    ]),
  );
  const uniqueColors = Array.from(
    new Set(cars.map((c) => c.color).filter(Boolean)),
  );
  const uniqueYears = Array.from(
    new Set([
      2026,
      2025,
      2024,
      2023,
      2022,
      2021,
      2020,
      ...cars.map((c) => c.manufacturingYear).filter(Boolean),
    ]),
  ).sort((a, b) => Number(b) - Number(a));

  const hasActiveFilters =
    searchBrand !== "" ||
    searchModel !== "" ||
    fuelTypeFilter !== "ALL" ||
    transmissionFilter !== "ALL" ||
    colorFilter !== "ALL" ||
    yearFilter !== "ALL" ||
    statusFilter !== "ALL";

  const clearAllFilters = () => {
    setSearchBrand("");
    setSearchModel("");
    setFuelTypeFilter("ALL");
    setTransmissionFilter("ALL");
    setColorFilter("ALL");
    setYearFilter("ALL");
    setStatusFilter("ALL");
  };

  const filteredCars = cars.filter((c) => {
    const matchesBrand =
      !searchBrand.trim() ||
      (c.company || "")
        .toLowerCase()
        .includes(searchBrand.toLowerCase().trim());
    const matchesModel =
      !searchModel.trim() ||
      (c.model || "").toLowerCase().includes(searchModel.toLowerCase().trim());
    const matchesFuel =
      fuelTypeFilter === "ALL" ||
      (c.fuelType || "").toLowerCase() === fuelTypeFilter.toLowerCase();
    const matchesTransmission =
      transmissionFilter === "ALL" ||
      (c.transmission || "").toLowerCase() === transmissionFilter.toLowerCase();
    const matchesColor =
      colorFilter === "ALL" ||
      (c.color || "").toLowerCase().includes(colorFilter.toLowerCase().trim());
    const matchesYear =
      yearFilter === "ALL" ||
      String(c.manufacturingYear || "") === String(yearFilter);
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "AVAILABLE" &&
        (c.quantity || 0) > 0 &&
        c.status !== "OUT_OF_STOCK") ||
      (statusFilter === "OUT_OF_STOCK" &&
        ((c.quantity || 0) <= 0 || c.status === "OUT_OF_STOCK"));

    return (
      matchesBrand &&
      matchesModel &&
      matchesFuel &&
      matchesTransmission &&
      matchesColor &&
      matchesYear &&
      matchesStatus
    );
  });

  return (
    <div className="space-y-4 font-sans">
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
          <p className="text-2xl font-semibold mt-2 text-[#18181B] font-mono">
            {totalCount}{" "}
            <span className="text-xs font-normal text-slate-500">units</span>
          </p>
        </div>

        <div className="md:col-span-2 bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#18181B]">
              Showroom Fleet Directory
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Manage vehicles, pricing, technical specifications, restock
              inventory, and availability.
            </p>
          </div>

          {isManagerOrOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors cursor-pointer"
                title="Bulk Add Multiple Cars (POST /bulk)"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk Import</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-black hover:bg-[#27272A] rounded-md transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Car</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-[10px] uppercase font-semibold text-[#71717A] tracking-wider">
              Filter & Search Inventory
            </h4>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer border border-red-200 rounded-md px-2 py-1 "
              >
                Clear All Filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-black shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter("AVAILABLE")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === "AVAILABLE"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter("OUT_OF_STOCK")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === "OUT_OF_STOCK"
                  ? "bg-white text-rose-700 shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Brand / Company (e.g. BMW, Tesla, Porsche)..."
              value={searchBrand}
              onChange={(e) => setSearchBrand(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-[#E4E4E7] rounded bg-white text-[#18181B] focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
            />
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by Model (e.g. M4, Model 3, 911)..."
              value={searchModel}
              onChange={(e) => setSearchModel(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-[#E4E4E7] rounded bg-white text-[#18181B] focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
            />
            <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
              Fuel Type
            </label>
            <select
              value={fuelTypeFilter}
              onChange={(e) => setFuelTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            >
              <option value="ALL">All Fuel Types</option>
              {uniqueFuelTypes.map((fuel) => (
                <option key={fuel} value={fuel}>
                  {fuel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
              Transmission
            </label>
            <select
              value={transmissionFilter}
              onChange={(e) => setTransmissionFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            >
              <option value="ALL">All Transmissions</option>
              {uniqueTransmissions.map((trans) => (
                <option key={trans} value={trans}>
                  {trans}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
              Color
            </label>
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            >
              <option value="ALL">All Colors</option>
              {uniqueColors.map((clr) => (
                <option key={clr} value={clr}>
                  {clr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
              Year
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-mono"
            >
              <option value="ALL">All Years</option>
              {uniqueYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider">
            Vehicle Fleet ({filteredCars.length} models)
          </h3>
          <button
            onClick={loadCarsData}
            className="text-xs text-[#71717A] hover:text-[#18181B] flex items-center gap-1 font-medium cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Fetching fleet inventory..." />
        ) : filteredCars.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#71717A] space-y-2">
            <CarFront className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No vehicles found matching current filter.</p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            {isManagerOrOwner && !hasActiveFilters && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-black rounded hover:bg-[#27272A] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Vehicle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Brand</th>
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3">Fuel & Transmission</th>
                  <th className="px-5 py-3">Color & Year</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock Units</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] text-sm">
                {filteredCars.map((car, idx) => {
                  const isAvailable =
                    (car.quantity || 0) > 0 && car.status !== "OUT_OF_STOCK";

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-[#F9FAFB] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs text-slate-700 font-mono font-medium">
                        {idx + 1}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-[#18181B]">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold border bg-[#F4F4F5] text-[#18181B] border-[#E4E4E7]">
                          {car.company}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#18181B]">
                        {car.model}
                        {car.variant && car.variant !== "Standard" && (
                          <span className="block text-[10px] font-normal text-slate-500">
                            {car.variant}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#18181B]">
                            {car.fuelType || "Petrol"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">
                            {car.transmission || "Automatic"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#18181B]">
                            {car.color || "Standard"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-mono">
                            {car.manufacturingYear || 2024}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-semibold text-slate-900">
                        ₹
                        {car.price ? Number(car.price).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className="font-mono font-bold text-slate-900">
                          {car.quantity || 0}
                        </span>{" "}
                        units
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            isAvailable
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isAvailable ? `AVAILABLE` : "OUT OF STOCK"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => handleOpenViewModal(car)}
                            className="p-1 text-slate-600 hover:text-black border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                            title="View Car Details & Availability"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isManagerOrOwner && (
                            <button
                              onClick={() => handleOpenEditModal(car)}
                              className="p-1 text-slate-600 hover:text-black border border-slate-200 rounded hover:bg-slate-50 cursor-pointer"
                              title="Edit Vehicle Specs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isOwner && (
                            <>
                              <button
                                onClick={() => handleOpenRestockModal(car)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded cursor-pointer inline-flex items-center gap-1"
                                title="Restock Vehicle Units"
                              >
                                <PackagePlus className="w-3 h-3" /> Restock
                              </button>
                              <button
                                onClick={() => handleDeleteCar(car)}
                                className="p-1 text-rose-600 hover:text-rose-800 border border-rose-200 rounded hover:bg-rose-50 cursor-pointer"
                                title="Delete Vehicle (OWNER only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      <Modal
        isOpen={isCarModalOpen}
        onClose={() => setIsCarModalOpen(false)}
        title={editingCar ? "Edit Vehicle" : "Register New Vehicle"}
        subtitle={
          editingCar
            ? `Modifying vehicle ${editingCar.id}`
            : "Add new vehicle specs and stock to inventory"
        }
      >
        <form onSubmit={handleCarSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Car Brand / Company *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. BMW, Tesla, Porsche"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  disabled={isSubmitting}
                  required
                  className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
                />
                <Building className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Car Model *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. M4 Competition, Model 3"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  disabled={isSubmitting}
                  required
                  className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
                />
                <Tag className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Variant / Trim
              </label>
              <input
                type="text"
                placeholder="e.g. Standard, Competition, Performance"
                value={formData.variant}
                onChange={(e) =>
                  setFormData({ ...formData, variant: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Exterior Color
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Black Sapphire, Alpine White"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  disabled={isSubmitting}
                  className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
                />
                <Palette className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Fuel Type
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) =>
                  setFormData({ ...formData, fuelType: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Transmission
              </label>
              <select
                value={formData.transmission}
                onChange={(e) =>
                  setFormData({ ...formData, transmission: e.target.value })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              !editingCar ? "md:grid-cols-3" : "md:grid-cols-2"
            } gap-3`}
          >
            {/* Manufacturing Year */}
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Manufacturing Year
              </label>
              <input
                type="number"
                min="1990"
                max={new Date().getFullYear() + 2}
                value={formData.manufacturingYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    manufacturingYear: Number(e.target.value),
                  })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: Number(e.target.value),
                  })
                }
                disabled={isSubmitting}
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-mono"
              />
            </div>

            {/* Quantity - ADD ONLY */}
            {!editingCar && (
              <div>
                <label className="block text-xs font-semibold text-[#18181B] mb-1">
                  Quantity Stock *
                </label>

                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => {
                    const qty = Number(e.target.value);

                    setFormData({
                      ...formData,
                      quantity: qty,
                    });
                  }}
                  disabled={isSubmitting}
                  required
                  className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => setIsCarModalOpen(false)}
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
                  <span>Saving...</span>
                </>
              ) : (
                <span>
                  {editingCar ? "Save Vehicle Changes" : "Register Vehicle"}
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal (OWNER role) */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        title="Restock Vehicle Inventory"
        subtitle="Add additional stock units.
        "
      >
        {selectedCarForRestock && (
          <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                {selectedCarForRestock.company} - {selectedCarForRestock.model}
              </p>
              <p className="text-slate-600">
                Current Stock:{" "}
                <span className="font-bold">
                  {selectedCarForRestock.quantity} units
                </span>{" "}
                | Status:{" "}
                <span className="font-bold">
                  {selectedCarForRestock.status}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#18181B] mb-1">
                Additional Stock Units to Add *
              </label>
              <input
                type="number"
                min="1"
                value={restockUnits}
                onChange={(e) => setRestockUnits(e.target.value)}
                disabled={isRestocking}
                required
                className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                disabled={isRestocking}
                className="px-3.5 py-2 text-xs font-medium text-[#71717A] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:text-[#18181B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRestocking}
                className="px-4 py-2 text-xs font-bold text-white bg-black rounded hover:bg-[#27272A] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRestocking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Restocking...</span>
                  </>
                ) : (
                  <span>Add Units to Stock</span>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewingCar}
        onClose={() => setViewingCar(null)}
        title="Vehicle Specifications"
        subtitle={
          viewingCar
            ? `${viewingCar.company} ${viewingCar.model} (ID ${viewingCar.id})`
            : ""
        }
      >
        {viewingCar && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  Vehicle Model
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  {viewingCar.company} {viewingCar.model}
                </h4>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                  viewingCar.quantity && viewingCar.quantity > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {viewingCar.quantity && viewingCar.quantity > 0
                  ? `AVAILABLE`
                  : "OUT OF STOCK"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-3">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Variant:</span>
                <span className="font-semibold text-slate-900">
                  {viewingCar.variant || "Standard"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Color:</span>
                <span className="font-semibold text-slate-900">
                  {viewingCar.color || "Standard"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Fuel Type:</span>
                <span className="font-semibold text-slate-900">
                  {viewingCar.fuelType || "Petrol"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Transmission:</span>
                <span className="font-semibold text-slate-900">
                  {viewingCar.transmission || "Automatic"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Mfg Year:</span>
                <span className="font-semibold text-slate-900">
                  {viewingCar.manufacturingYear || 2024}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">MSRP Price:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹
                  {viewingCar.price
                    ? Number(viewingCar.price).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Real-time availability result */}
            {/* <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Real-Time
                Availability Check
              </span>
              {isCheckingAvailability ? (
                <p className="text-slate-400 italic">
                  Verifying availability...
                </p>
              ) : (
                <p className="font-mono text-slate-800 font-semibold">
                  {availabilityMessage || "Status: " + viewingCar.status}
                </p>
              )}
            </div> */}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewingCar(null)}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Upload Modal (POST /bulk) */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Import Vehicles"
        subtitle="Batch upload vehicle JSON array."
      >
        <form onSubmit={handleBulkSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-semibold text-[#18181B] mb-1">
              Vehicle Records (JSON Array) *
            </label>
            <textarea
              rows={12}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              disabled={isBulkSubmitting}
              required
              placeholder='[{"company": "BMW", "model": "M4", "variant": "Competition", ...}]'
              className="w-full p-3 text-xs text-[#18181B] bg-slate-50 border border-[#E4E4E7] rounded font-mono focus:ring-1 focus:ring-black outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Paste an array of car objects matching: company, model, variant,
              color, fuelType, transmission, manufacturingYear, price, quantity,
              status.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              disabled={isBulkSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-[#71717A] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:text-[#18181B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBulkSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-black rounded hover:bg-[#27272A] transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isBulkSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading Fleet...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Submit Bulk Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
