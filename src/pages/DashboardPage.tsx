import React, { useState, useEffect } from "react";
import {
  dashboardService,
  ParsedDashboardStats,
} from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  CarFront,
  UserCog,
  ShieldAlert,
  RefreshCcw,
} from "lucide-react";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { useToast } from "../components/common/Toast";
import { carService } from "../services/carService";
import { customerService } from "../services/customerService";

export const DashboardPage: React.FC = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [availableCarCount, setAvailableCarCount] = useState<number>(0);

  const [stats, setStats] = useState<ParsedDashboardStats | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { role } = useAuth();
  const toast = useToast();

  const fetchDashboard = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      /*
       * Fetch:
       * 1. Dashboard statistics
       * 2. Customer-car relationships
       * 3. Actual showroom inventory
       */
      const [data, joinsRes, carsRes] = await Promise.all([
        dashboardService.getDashboardData(),
        customerService.getCustomersWithCars(),
        carService.getAllCars(),
      ]);

      /* --------------------------------
       * Dashboard Statistics
       * -------------------------------- */
      if (typeof data === "string") {
        setErrorMsg(data);
        setStats(null);
      } else {
        setStats(data);
      }

      /* --------------------------------
       * Registered / Assigned Vehicles
       *
       * Used for the vehicle cards below.
       * -------------------------------- */
      if (Array.isArray(joinsRes)) {
        const mappedCars: any[] = [];

        joinsRes.forEach((item: any, idx: number) => {
          /*
           * If customer has multiple cars
           */
          if (Array.isArray(item.cars) && item.cars.length > 0) {
            item.cars.forEach((c: any) => {
              mappedCars.push({
                id: c.id || mappedCars.length + 1,

                carCompany:
                  c.company ||
                  c.carCompany ||
                  item.carCompany ||
                  "Grand Theft Autos",

                carModel: c.model || c.carModel || item.carModel || "Standard",
              });
            });
          } else if (

          /*
           * If API returns a direct car relationship
           */
            item.carCompany ||
            item.carModel ||
            item.company ||
            item.model
          ) {
            mappedCars.push({
              id: item.id || idx + 1,

              carCompany:
                item.carCompany || item.company || "Grand Theft Autos",

              carModel: item.carModel || item.model || "Standard",
            });
          }
        });

        setCars(mappedCars);
      } else {
        setCars([]);
      }

      /* --------------------------------
       * Calculate TOTAL AVAILABLE CARS
       *
       * Available = Total Quantity - Assigned Quantity
       *
       * Example:
       *
       * BMW
       * quantity = 5
       * assigned = 1
       * available = 4
       *
       * Toyota
       * quantity = 4
       * assigned = 0
       * available = 4
       *
       * Total Available = 8
       * -------------------------------- */
      let totalAvailableCars = 0;

      if (Array.isArray(carsRes)) {
        carsRes.forEach((carObj: any) => {
          if (Array.isArray(carObj.models)) {
            carObj.models.forEach((model: any) => {
              const quantity = Number(model.quantity) || 0;
              const assignedQuantity = Number(model.assignedQuantity) || 0;

              const available = Math.max(0, quantity - assignedQuantity);

              totalAvailableCars += available;
            });
          }
        });
      }

      setAvailableCarCount(totalAvailableCars);
    } catch (err: any) {
      console.error("Dashboard Error:", err);

      toast.error(
        "Dashboard Error",
        err.message || "Failed to load dashboard data.",
      );

      setErrorMsg("Failed to load dashboard endpoint data.");
      setCars([]);
      setAvailableCarCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  /* --------------------------------
   * Role Protection
   * -------------------------------- */
  if (role !== "OWNER" && role !== "MANAGER") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <ShieldAlert className="w-10 h-10 text-rose-600 mb-3" />

        <h2 className="text-lg font-bold text-[#18181B]">Access Denied</h2>

        <p className="text-sm text-[#71717A] mt-1">
          Dashboard access is restricted to OWNER or MANAGER roles.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* --------------------------------
       * Header Bar
       * -------------------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#18181B]">
            Executive Overview
          </h1>

          <p className="text-xs text-[#71717A] mt-1">
            Key metrics and operational dashboard overview
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#18181B] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:bg-[#E4E4E7] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh Stats
        </button>
      </div>

      {/* --------------------------------
       * Dashboard Loading / Error / Stats
       * -------------------------------- */}
      {isLoading ? (
        <LoadingSpinner label="Loading dashboard metrics..." />
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center">
          <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto mb-2" />

          <h4 className="text-sm font-bold text-rose-900">{errorMsg}</h4>

          <p className="text-xs text-rose-700 mt-1">
            Ensure your active token belongs to an authorized account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* --------------------------------
           * Total Customers
           * -------------------------------- */}
          <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Total Customers
              </p>

              <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <p className="text-2xl font-semibold mt-2 text-[#18181B]">
              {stats?.totalCustomers ?? 0}
            </p>
          </div>

          {/* --------------------------------
           * Available Cars
           * -------------------------------- */}
          <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                Available Cars
              </p>

              <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
                <CarFront className="w-4 h-4" />
              </div>
            </div>

            <p className="text-2xl font-semibold mt-2 text-[#18181B]">
              {availableCarCount}
            </p>
          </div>

          {/* --------------------------------
           * System Users
           * -------------------------------- */}
          <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
                System Users
              </p>

              <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
                <UserCog className="w-4 h-4" />
              </div>
            </div>

            <p className="text-2xl font-semibold mt-2 text-[#18181B]">
              {stats?.totalUsers ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* --------------------------------
       * Registered Showroom Vehicles
       * -------------------------------- */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-[#18181B]">
            Registered Showroom Vehicles
          </h4>

          <p className="text-xs text-[#71717A] mt-0.5">
            Active vehicle models retrieved directly from backend database
          </p>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#71717A]">
            No registered vehicles found in database inventory.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cars.map((car, idx) => (
              <div
                key={car.id || idx}
                className="border border-[#E4E4E7] rounded-lg p-4 bg-white shadow-xs flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
                    {car.carCompany || "Brand"}
                  </span>

                  <h5 className="text-sm font-bold text-[#18181B] mt-0.5">
                    {car.carModel || "Model"}
                  </h5>
                </div>

                <div className="mt-3 pt-2 border-t border-[#F4F4F5] flex items-center justify-between text-xs text-[#71717A]">
                  <span>Vehicle ID: #{car.id || idx + 1}</span>

                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; // import React, { useState, useEffect } from "react";
// import {
//   dashboardService,
//   ParsedDashboardStats,
// } from "../services/dashboardService";
// import { useAuth } from "../context/AuthContext";
// import {
//   Users,
//   CarFront,
//   UserCog,
//   ShieldAlert,
//   Terminal,
//   RefreshCcw,
// } from "lucide-react";
// import { LoadingSpinner } from "../components/common/LoadingSpinner";
// import { useToast } from "../components/common/Toast";
// import { carService } from "../services/carService";
// import { customerService } from "../services/customerService";
// export const DashboardPage: React.FC = () => {
//   const [cars, setCars] = useState<any[]>([]);
//   const [stats, setStats] = useState<ParsedDashboardStats | null>(null);
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   const { role } = useAuth();
//   const toast = useToast();

//   const fetchDashboard = async () => {
//     setIsLoading(true);
//     setErrorMsg(null);

//     try {
//       const [data, joinsRes] = await Promise.all([
//         dashboardService.getDashboardData(),
//         customerService.getCustomersWithCars(),
//       ]);

//       if (typeof data === "string") {
//         setErrorMsg(data);
//         setStats(null);
//       } else {
//         setStats(data);
//       }

//       // Get cars for cars.length
//       if (Array.isArray(joinsRes)) {
//         const mappedCars: any[] = [];

//         joinsRes.forEach((item: any, idx: number) => {
//           if (Array.isArray(item.cars) && item.cars.length > 0) {
//             item.cars.forEach((c: any) => {
//               mappedCars.push({
//                 id: c.id || mappedCars.length + 1,
//                 carCompany:
//                   c.company ||
//                   c.carCompany ||
//                   item.carCompany ||
//                   "Grand Theft Autos",
//                 carModel: c.model || c.carModel || item.carModel || "Standard",
//               });
//             });
//           } else if (
//             item.carCompany ||
//             item.carModel ||
//             item.company ||
//             item.model
//           ) {
//             mappedCars.push({
//               id: item.id || idx + 1,
//               carCompany:
//                 item.carCompany || item.company || "Grand Theft Autos",
//               carModel: item.carModel || item.model || "Standard",
//             });
//           }
//         });

//         setCars(mappedCars);
//       } else {
//         setCars([]);
//       }
//     } catch (err: any) {
//       toast.error("Dashboard Error", err.message);
//       setErrorMsg("Failed to load dashboard endpoint data.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboard();
//   }, []);

//   if (role !== "OWNER" && role !== "MANAGER") {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
//         <ShieldAlert className="w-10 h-10 text-rose-600 mb-3" />

//         <h2 className="text-lg font-bold text-[#18181B]">Access Denied</h2>

//         <p className="text-sm text-[#71717A] mt-1">
//           Dashboard access is restricted to OWNER or MANAGER roles.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header bar */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-[#18181B]">
//             Executive Overview
//           </h1>

//           <p className="text-xs text-[#71717A] mt-1">
//             Key metrics and operational dashboard overview
//           </p>
//         </div>

//         <button
//           onClick={fetchDashboard}
//           className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#18181B] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:bg-[#E4E4E7] transition-colors cursor-pointer"
//         >
//           <RefreshCcw className="w-3.5 h-3.5" />
//           Refresh Stats
//         </button>
//       </div>

//       {isLoading ? (
//         <LoadingSpinner label="Loading dashboard metrics..." />
//       ) : errorMsg ? (
//         <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center">
//           <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto mb-2" />

//           <h4 className="text-sm font-bold text-rose-900">{errorMsg}</h4>

//           <p className="text-xs text-rose-700 mt-1">
//             Ensure your active token belongs to an authorized account.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Total Customers */}
//           <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg">
//             <div className="flex items-center justify-between">
//               <p className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
//                 Total Customers
//               </p>

//               <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
//                 <Users className="w-4 h-4" />
//               </div>
//             </div>

//             <p className="text-2xl font-semibold mt-2 text-[#18181B]">
//               {stats?.totalCustomers}
//             </p>
//           </div>

//           {/* Total Cars */}
//           <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg">
//             <div className="flex items-center justify-between">
//               <p className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
//                 Total Inventory Cars
//               </p>

//               <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
//                 <CarFront className="w-4 h-4" />
//               </div>
//             </div>

//             <p className="text-2xl font-semibold mt-2 text-[#18181B]">
//               {cars.length}
//             </p>
//           </div>

//           {/* Total Users */}
//           <div className="bg-white p-5 border border-[#E4E4E7] rounded-lg">
//             <div className="flex items-center justify-between">
//               <p className="text-xs font-medium text-[#71717A] uppercase tracking-wider">
//                 System Users
//               </p>

//               <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center">
//                 <UserCog className="w-4 h-4" />
//               </div>
//             </div>

//             <p className="text-2xl font-semibold mt-2 text-[#18181B]">
//               {stats?.totalUsers}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Real Inventory Fleet Vehicles - Visible on Owner/Manager Dashboard */}
//       <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 space-y-4">
//         <div>
//           <h4 className="text-sm font-bold text-[#18181B]">
//             Registered Showroom Vehicles
//           </h4>

//           <p className="text-xs text-[#71717A] mt-0.5">
//             Active vehicle models retrieved directly from backend database
//           </p>
//         </div>

//         {cars.length === 0 ? (
//           <div className="text-center py-8 text-xs text-[#71717A]">
//             No registered vehicles found in database inventory.
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             {cars.map((car, idx) => (
//               <div
//                 key={car.id || idx}
//                 className="border border-[#E4E4E7] rounded-lg p-4 bg-white shadow-xs flex flex-col justify-between"
//               >
//                 <div>
//                   <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
//                     {car.carCompany || "Brand"}
//                   </span>

//                   <h5 className="text-sm font-bold text-[#18181B] mt-0.5">
//                     {car.carModel || "Model"}
//                   </h5>
//                 </div>

//                 <div className="mt-3 pt-2 border-t border-[#F4F4F5] flex items-center justify-between text-xs text-[#71717A]">
//                   <span>Vehicle ID: #{car.id || idx + 1}</span>
//                   <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
//                     Active
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
