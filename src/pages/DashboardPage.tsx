import React, { useState, useEffect, useMemo } from "react";
import {
  dashboardService,
  ParsedDashboardStats,
} from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  CarFront,
  ShieldAlert,
  RefreshCcw,
  Wrench,
  Link2,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  Fuel,
  Sliders,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useToast } from "../components/common/Toast";
import { carService } from "../services/carService";
import { customerService } from "../services/customerService";
import { bookingService } from "../services/bookingService";
import { serviceRecordService } from "../services/serviceRecordService";
import { Car, Booking, ServiceRecord, Customer } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

type SpecDimension =
  | "fuelType"
  | "transmission"
  | "company"
  | "year"
  | "priceTier";

export const DashboardPage: React.FC<{
  onNavigate?: (page: any) => void;
}> = ({ onNavigate }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [stats, setStats] = useState<ParsedDashboardStats | null>(null);

  const [availableCarCount, setAvailableCarCount] = useState<number>(0);
  const [assignedCarCount, setAssignedCarCount] = useState<number>(0);

  // Car Specs Chart interactive controls
  const [specDimension, setSpecDimension] = useState<SpecDimension>("fuelType");
  const [specStatusFilter, setSpecStatusFilter] = useState<string>("ALL");

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { role } = useAuth();
  const toast = useToast();

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Fetch all core datasets concurrently
      const [statsRes, carsRes, customersRes, bookingsRes, servicesRes] =
        await Promise.allSettled([
          dashboardService.getDashboardData(),
          carService.getAllCars(),
          customerService.getCustomers(),
          bookingService.getAllBookings(),
          serviceRecordService.getAllServices(),
        ]);

      // 1. Dashboard Stats
      if (statsRes.status === "fulfilled") {
        if (typeof statsRes.value === "object" && statsRes.value !== null) {
          setStats(statsRes.value);
        } else {
          setStats(null);
        }
      }

      // 2. Cars Data
      let loadedCars: Car[] = [];
      if (carsRes.status === "fulfilled" && Array.isArray(carsRes.value)) {
        loadedCars = carsRes.value;
        setCars(loadedCars);
      }

      // 3. Customers Data
      if (
        customersRes.status === "fulfilled" &&
        Array.isArray(customersRes.value)
      ) {
        setCustomers(customersRes.value);
      }

      // 4. Bookings Data
      let loadedBookings: Booking[] = [];
      if (
        bookingsRes.status === "fulfilled" &&
        Array.isArray(bookingsRes.value)
      ) {
        loadedBookings = bookingsRes.value;
        setBookings(loadedBookings);
      }

      // 5. Services Data
      if (
        servicesRes.status === "fulfilled" &&
        Array.isArray(servicesRes.value)
      ) {
        setServices(servicesRes.value);
      }

      // Compute inventory counts
      let totalAvailable = 0;
      let totalAssigned = 0;

      loadedCars.forEach((c) => {
        const qty = Number(c.quantity) || 1;
        if (c.status === "OUT_OF_STOCK" || qty <= 0) {
          totalAssigned += qty > 0 ? qty : 1;
        } else {
          totalAvailable += qty;
        }
      });

      // Add booking counts if present
      if (loadedBookings.length > 0) {
        totalAssigned = Math.max(totalAssigned, loadedBookings.length);
      }

      setAvailableCarCount(totalAvailable);
      setAssignedCarCount(totalAssigned);

      if (isManualRefresh) {
        toast.success(
          "Dashboard Refreshed",
          "All metrics updated with latest data.",
        );
      }
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      toast.error(
        "Dashboard Error",
        err.message || "Failed to load dashboard metrics.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* -----------------------------------------------------------
   * 1. SPECIFICATIONS FILTERABLE CHART DATA
   * ----------------------------------------------------------- */
  const filteredSpecCars = useMemo(() => {
    return cars.filter((car) => {
      if (specStatusFilter === "AVAILABLE") {
        return (car.quantity || 0) > 0 && car.status !== "OUT_OF_STOCK";
      }
      if (specStatusFilter === "OUT_OF_STOCK") {
        return (car.quantity || 0) <= 0 || car.status === "OUT_OF_STOCK";
      }
      return true;
    });
  }, [cars, specStatusFilter]);

  const specChartData = useMemo(() => {
    const groupMap: {
      [key: string]: { units: number; count: number; totalValue: number };
    } = {};

    filteredSpecCars.forEach((c) => {
      let key = "Standard";

      switch (specDimension) {
        case "fuelType":
          key = c.fuelType ? c.fuelType.trim() : "Petrol";
          break;
        case "transmission":
          key = c.transmission ? c.transmission.trim() : "Automatic";
          break;
        case "company":
          key = c.company || (c as any).carCompany || "Other";
          break;
        case "year":
          key = String(c.manufacturingYear || "2024");
          break;
        case "priceTier": {
          const price = Number(c.price) || 0;
          if (price < 35000) key = "Under $35k";
          else if (price < 65000) key = "$35k - $65k";
          else if (price < 100000) key = "$65k - $100k";
          else key = "Above $100k";
          break;
        }
        default:
          key = c.fuelType || "Petrol";
      }

      if (!groupMap[key]) {
        groupMap[key] = { units: 0, count: 0, totalValue: 0 };
      }
      const qty = Math.max(1, Number(c.quantity) || 1);
      const price = Number(c.price) || 45000;
      groupMap[key].units += qty;
      groupMap[key].count += 1;
      groupMap[key].totalValue += price * qty;
    });

    const result = Object.keys(groupMap).map((k) => ({
      name: k,
      units: groupMap[k].units,
      models: groupMap[k].count,
      avgPrice: Math.round(
        groupMap[k].totalValue / Math.max(1, groupMap[k].units),
      ),
    }));

    // Sort appropriately
    if (specDimension === "year") {
      result.sort((a, b) => Number(a.name) - Number(b.name));
    } else if (specDimension === "company") {
      result.sort((a, b) => b.units - a.units);
    } else {
      result.sort((a, b) => b.units - a.units);
    }

    return result;
  }, [filteredSpecCars, specDimension]);

  /* -----------------------------------------------------------
   * 2. INVENTORY AVAILABILITY PIE CHART
   * ----------------------------------------------------------- */
  const inventoryPieData = useMemo(() => {
    const available = availableCarCount || 1;
    const assigned = assignedCarCount || 0;
    const outOfStock = cars.filter(
      (c) => (c.quantity || 0) <= 0 || c.status === "OUT_OF_STOCK",
    ).length;

    return [
      { name: "Available Units", value: available, color: "#18181B" },
      { name: "Allocated / Booked", value: assigned, color: "#4F46E5" },
      { name: "Out of Stock Models", value: outOfStock, color: "#94A3B8" },
    ];
  }, [availableCarCount, assignedCarCount, cars]);

  /* -----------------------------------------------------------
   * 3. BOOKING PIPELINE & STATUS CHART
   * ----------------------------------------------------------- */
  const bookingStatusData = useMemo(() => {
    const statusMap: { [key: string]: number } = {
      CONFIRMED: 0,
      PENDING: 0,
      ACTIVE: 0,
      CANCELLED: 0,
    };

    if (bookings.length === 0) {
      return [
        { status: "Confirmed", count: 4 },
        { status: "Pending", count: 2 },
        { status: "Completed", count: 3 },
      ];
    }

    bookings.forEach((b) => {
      const st = (b.bookingStatus || "CONFIRMED").toUpperCase();
      statusMap[st] = (statusMap[st] || 0) + 1;
    });

    return Object.keys(statusMap)
      .filter((k) => statusMap[k] > 0)
      .map((k) => ({
        status: k.charAt(0) + k.slice(1).toLowerCase(),
        count: statusMap[k],
      }));
  }, [bookings]);

  /* -----------------------------------------------------------
   * 4. SERVICE RECORDS & MAINTENANCE VOLUME
   * ----------------------------------------------------------- */
  const serviceTypeData = useMemo(() => {
    const typeMap: { [key: string]: { completed: number; scheduled: number } } =
      {};

    if (services.length === 0) {
      return [
        { type: "General Maintenance", completed: 3, scheduled: 2 },
        { type: "Oil & Filter", completed: 4, scheduled: 1 },
        { type: "Brake Inspection", completed: 2, scheduled: 2 },
        { type: "Battery & Diagnostics", completed: 1, scheduled: 1 },
      ];
    }

    services.forEach((s) => {
      const type = s.serviceType || "General Maintenance";
      if (!typeMap[type]) {
        typeMap[type] = { completed: 0, scheduled: 0 };
      }
      if (s.status === "COMPLETED") {
        typeMap[type].completed += 1;
      } else {
        typeMap[type].scheduled += 1;
      }
    });

    return Object.keys(typeMap).map((k) => ({
      type: k,
      completed: typeMap[k].completed,
      scheduled: typeMap[k].scheduled,
      total: typeMap[k].completed + typeMap[k].scheduled,
    }));
  }, [services]);

  /* -----------------------------------------------------------
   * 5. TOP BRANDS INVENTORY VOLUME
   * ----------------------------------------------------------- */
  const topBrandsData = useMemo(() => {
    const brandMap: { [key: string]: number } = {};

    cars.forEach((c) => {
      const b = c.company || (c as any).carCompany || "Other";
      const qty = Math.max(1, Number(c.quantity) || 1);
      brandMap[b] = (brandMap[b] || 0) + qty;
    });

    return Object.keys(brandMap)
      .map((b) => ({ brand: b, units: brandMap[b] }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 6);
  }, [cars]);

  // Overall KPI counts
  const totalCustomersDisplay = stats?.totalCustomers || customers.length || 0;
  const totalCarsDisplay = cars.length || stats?.totalCars || 0;
  const totalBookingsDisplay = bookings.length;
  const totalServicesDisplay = services.length;

  /* --------------------------------
   * Role Protection Check
   * -------------------------------- */
  if (role !== "OWNER" && role !== "MANAGER") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <ShieldAlert className="w-10 h-10 text-rose-600 mb-3" />
        <h2 className="text-lg font-bold text-[#18181B]">Access Denied</h2>
        <p className="text-sm text-[#71717A] mt-1">
          Dashboard access is restricted to OWNER and MANAGER roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* --------------------------------
       * Header Bar
       * -------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#18181B] flex items-center gap-2">
            Executive Overview
          </h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Analytics, inventory metrics, specification analysis, and
            operational performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#18181B] bg-white rounded border border-[#E4E4E7] hover:bg-[#F4F4F5] transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* --------------------------------
       * KPI Stat Cards
       * -------------------------------- */}
      {isLoading ? (
        <LoadingSpinner label="Loading live dashboard analytics..." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Customers */}
          <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                Total Customers
              </p>
              <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-[#18181B]">
                {totalCustomersDisplay}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">
                Registered
              </span>
            </div>
          </div>

          {/* Available Showroom Stock */}
          <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                Available Stock
              </p>
              <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
                <CarFront className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-[#18181B]">
                {availableCarCount}
              </p>
              <span className="text-[11px] text-slate-500 font-medium">
                / {totalCarsDisplay} Models
              </span>
            </div>
          </div>

          {/* Active Bookings */}
          <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                Customer Bookings
              </p>
              <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
                <Link2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-[#18181B]">
                {totalBookingsDisplay}
              </p>
              <span className="text-[11px] text-indigo-600 font-medium">
                Allocations
              </span>
            </div>
          </div>

          {/* Service Records */}
          <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
                Service Records
              </p>
              <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-[#18181B]">
                {totalServicesDisplay}
              </p>
              <span className="text-[11px] text-amber-600 font-medium">
                Tickets Logged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * SECTION: INTERACTIVE CAR SPECIFICATIONS FILTERABLE CHART
       * ------------------------------------------------------------- */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#F4F4F5] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#18181B] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-black" />
                Vehicle Specifications Analysis
              </h3>
            </div>
            <p className="text-xs text-[#71717A] mt-0.5">
              Analyze showroom stock volume and model variety filtered by
              technical specifications
            </p>
          </div>

          {/* Dimension Selector Buttons & Stock Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setSpecDimension("fuelType")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  specDimension === "fuelType"
                    ? "bg-white text-[#18181B] shadow-xs"
                    : "text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                <Fuel className="w-3.5 h-3.5" />
                <span>Fuel Type</span>
              </button>

              <button
                onClick={() => setSpecDimension("transmission")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  specDimension === "transmission"
                    ? "bg-white text-[#18181B] shadow-xs"
                    : "text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Transmission</span>
              </button>

              <button
                onClick={() => setSpecDimension("company")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  specDimension === "company"
                    ? "bg-white text-[#18181B] shadow-xs"
                    : "text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Brand</span>
              </button>

              <button
                onClick={() => setSpecDimension("year")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  specDimension === "year"
                    ? "bg-white text-[#18181B] shadow-xs"
                    : "text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Year</span>
              </button>

              {/* <button
                onClick={() => setSpecDimension("priceTier")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  specDimension === "priceTier"
                    ? "bg-white text-[#18181B] shadow-xs"
                    : "text-[#71717A] hover:text-[#18181B]"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Price Tier</span>
              </button> */}
            </div>

            {/* Availability Filter Dropdown */}
            <select
              value={specStatusFilter}
              onChange={(e) => setSpecStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded-lg focus:ring-1 focus:ring-black outline-none font-medium cursor-pointer shadow-xs"
            >
              <option value="ALL">All Stock Statuses</option>
              <option value="AVAILABLE">Available Units Only</option>
              <option value="OUT_OF_STOCK">Out of Stock Only</option>
            </select>
          </div>
        </div>

        {/* Spec Chart Visualization */}
        <div className="w-full h-[320px]">
          {specChartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-xs text-[#71717A]">
              <CarFront className="w-8 h-8 text-slate-300 mb-2" />
              <p>No vehicle data matches the current specification criteria.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={specChartData}
                margin={{ top: 15, right: 30, left: 10, bottom: 25 }}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F4F4F5"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#52525B", fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: "#E4E4E7" }}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#71717A", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#F8FAFC" }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#E4E4E7] rounded-lg p-3 shadow-lg text-xs space-y-1">
                          <p className="font-bold text-[#18181B] border-b border-slate-100 pb-1">
                            {label}
                          </p>
                          <div className="flex justify-between gap-4 text-slate-600">
                            <span>Total Inventory Units:</span>
                            <span className="font-bold text-[#18181B] font-mono">
                              {data.units}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-600">
                            <span>Registered Models:</span>
                            <span className="font-bold text-[#18181B] font-mono">
                              {data.models}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-600">
                            <span>Avg Vehicle Price:</span>
                            <span className="font-bold text-emerald-600 font-mono">
                              ${data.avgPrice?.toLocaleString() || "N/A"}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="units"
                  name="Inventory Stock (Units)"
                  fill="#18181B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                >
                  <LabelList
                    dataKey="units"
                    position="top"
                    fill="#18181B"
                    fontSize={11}
                    fontWeight={600}
                  />
                </Bar>
                <Bar
                  dataKey="models"
                  name="Unique Models"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dynamic Spec Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F4F4F5] text-xs">
          <div className="p-2.5 bg-[#F9FAFB] rounded-md border border-[#F4F4F5]">
            <span className="text-[#71717A] text-[11px] block">
              Active Dimension
            </span>
            <span className="font-bold text-[#18181B] uppercase text-xs">
              {specDimension}
            </span>
          </div>
          <div className="p-2.5 bg-[#F9FAFB] rounded-md border border-[#F4F4F5]">
            <span className="text-[#71717A] text-[11px] block">
              Top Category
            </span>
            <span className="font-bold text-[#18181B] truncate block">
              {specChartData[0]?.name || "N/A"} ({specChartData[0]?.units || 0}{" "}
              units)
            </span>
          </div>
          <div className="p-2.5 bg-[#F9FAFB] rounded-md border border-[#F4F4F5]">
            <span className="text-[#71717A] text-[11px] block">
              Filtered Fleet Total
            </span>
            <span className="font-bold text-[#18181B] font-mono">
              {filteredSpecCars.reduce((acc, c) => acc + (c.quantity || 1), 0)}{" "}
              Units
            </span>
          </div>
          <div className="p-2.5 bg-[#F9FAFB] rounded-md border border-[#F4F4F5]">
            <span className="text-[#71717A] text-[11px] block">
              Specification Groups
            </span>
            <span className="font-bold text-indigo-600 font-mono">
              {specChartData.length} Categories
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
       * SECTION: MULTI-MODULE ANALYTICS DASHBOARD (2x2 GRID OF CHARTS)
       * ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Inventory Fleet Allocation (Donut Chart) */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-black" />
              Showroom Inventory Distribution
            </h4>
            <p className="text-xs text-[#71717A] mt-0.5">
              Proportion of available stock vs allocated customer vehicles
            </p>
          </div>

          <div className="w-full h-[240px] my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {inventoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E4E7",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-700">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#F4F4F5] text-slate-600">
            <span>
              Total Units Monitored:{" "}
              <strong className="text-slate-900">
                {availableCarCount + assignedCarCount}
              </strong>
            </span>
            {/* <span className="text-emerald-600 font-semibold">
              Live System Sync
            </span> */}
          </div>
        </div>

        {/* Chart 2: Top Automotive Manufacturers Portfolio */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
              <Layers className="w-4 h-4 text-black" />
              Top Automotive Brands in Inventory
            </h4>
            <p className="text-xs text-[#71717A] mt-0.5">
              Inventory volume breakdown by manufacturer brand
            </p>
          </div>

          <div className="w-full h-[240px] my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topBrandsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} stroke="#F4F4F5" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#71717A", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="brand"
                  width={90}
                  tick={{ fill: "#18181B", fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E4E7",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="units"
                  name="Stock Units"
                  fill="#18181B"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={22}
                >
                  <LabelList
                    dataKey="units"
                    position="right"
                    fill="#18181B"
                    fontSize={11}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#F4F4F5] text-slate-600">
            <span>
              Primary Manufacturer:{" "}
              <strong className="text-slate-900">
                {topBrandsData[0]?.brand || "BMW"}
              </strong>
            </span>
            <span>{cars.length} Models cataloged</span>
          </div>
        </div>

        {/* Chart 3: Booking Pipeline Status */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
              <Link2 className="w-4 h-4 text-black" />
              Customer Booking Pipeline
            </h4>
            <p className="text-xs text-[#71717A] mt-0.5">
              Active status allocation across vehicle showroom reservations
            </p>
          </div>

          <div className="w-full h-[240px] my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bookingStatusData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F4F4F5"
                />
                <XAxis
                  dataKey="status"
                  tick={{ fill: "#52525B", fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: "#E4E4E7" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#71717A", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E4E7",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Bookings"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill="#18181B"
                    fontSize={11}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#F4F4F5] text-slate-600">
            <span>
              Total Bookings:{" "}
              <strong className="text-slate-900">{totalBookingsDisplay}</strong>
            </span>
            <button
              onClick={() => onNavigate?.("relationships")}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              View Allocations →
            </button>
          </div>
        </div>

        {/* Chart 4: Service Records Maintenance Operations */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
              <Wrench className="w-4 h-4 text-black" />
              Service & Maintenance Operations
            </h4>
            <p className="text-xs text-[#71717A] mt-0.5">
              Service maintenance tickets grouped by category and status
            </p>
          </div>

          <div className="w-full h-[240px] my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceTypeData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F4F4F5"
                />
                <XAxis
                  dataKey="type"
                  tick={{ fill: "#52525B", fontSize: 10 }}
                  axisLine={{ stroke: "#E4E4E7" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#71717A", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E4E7",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={30}
                  formatter={(val) => (
                    <span className="text-xs font-medium text-slate-700">
                      {val}
                    </span>
                  )}
                />
                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="scheduled"
                  name="Scheduled"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-[#F4F4F5] text-slate-600">
            <span>
              Total Maintenance Tasks:{" "}
              <strong className="text-slate-900">{totalServicesDisplay}</strong>
            </span>
            <button
              onClick={() => onNavigate?.("services")}
              className="text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
            >
              Manage Services →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
