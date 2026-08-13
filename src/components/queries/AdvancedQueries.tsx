import React, { useState } from "react";
import { Database, ArrowRight } from "lucide-react";
import { customerService } from "../../services/customerService";
import { useToast } from "../common/Toast";
import { LoadingSpinner } from "../common/LoadingSpinner";
const isPrimitiveResult = (value: any) => {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
};
export const AdvancedQueries: React.FC = () => {
  const [activeQueryTitle, setActiveQueryTitle] = useState<string>(
    "Customers With Cars",
  );
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [companyParam, setCompanyParam] = useState<string>("BMW");
  const [modelParam, setModelParam] = useState<string>("M4");

  const toast = useToast();

  const runQuery = async (title: string, fetchFn: () => Promise<any>) => {
    setIsLoading(true);
    setActiveQueryTitle(title);

    try {
      const data = await fetchFn();

      if (typeof data === "string" && data.toLowerCase().includes("error")) {
        toast.error("Query Error", data);
        setResults([]);
        return;
      }

      // Aggregate / scalar result
      if (isPrimitiveResult(data)) {
        setResults([{ result: data }]);

        toast.success("Query Executed", `Result: ${data}`);

        return;
      }

      // Normal array/object result
      const normalizedResults = Array.isArray(data) ? data : [data];

      setResults(normalizedResults);

      toast.success(
        "Query Executed",
        `Fetched ${normalizedResults.length} records`,
      );
    } catch (err: any) {
      toast.error("Failed to execute query", err.message || "Server error");

      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Header */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#F4F4F5] text-[#18181B] flex items-center justify-center shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#18181B]">
              Advanced Analytics & Reports
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">
              Execute join queries and analytics reports for customer and
              vehicle allocations.
            </p>
          </div>
        </div>
      </div>

      {/* Query Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Customers With Cars */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col justify-between hover:border-[#18181B] transition-colors">
          <div>
            <h4 className="text-xs font-semibold text-[#18181B]">
              Customers With Cars
            </h4>
            <p className="text-xs text-[#71717A] mt-1">
              Fetch customers who currently have associated car registrations.
            </p>
          </div>
          <button
            onClick={() =>
              runQuery("Customers With Cars", () =>
                customerService.getCustomersWithCars(),
              )
            }
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors"
          >
            <span>Run Query</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Customers With Specific Company Cars */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col justify-between hover:border-[#18181B] transition-colors">
          <div>
            <h4 className="text-xs font-semibold text-[#18181B]">
              Filter by Vehicle Brand
            </h4>
            <p className="text-xs text-[#71717A] mt-1 mb-2">
              Filter customer vehicle records by brand company (e.g. BMW, Tesla,
              Porsche).
            </p>
            <input
              type="text"
              value={companyParam}
              onChange={(e) => setCompanyParam(e.target.value)}
              placeholder="e.g. BMW"
              className="w-full px-3 py-1.5 text-xs border border-[#E4E4E7] rounded bg-white font-mono text-[#18181B] focus:ring-1 focus:ring-black outline-none"
            />
          </div>
          <button
            onClick={() =>
              runQuery(`Customers With ${companyParam} Cars`, () =>
                customerService.getCustomersWithSpecCars(companyParam),
              )
            }
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors"
          >
            <span>Filter Brand</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Customers With Specific Model Cars */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col justify-between hover:border-[#18181B] transition-colors">
          <div>
            <h4 className="text-xs font-semibold text-[#18181B]">
              Filter by Vehicle Model
            </h4>
            <p className="text-xs text-[#71717A] mt-1 mb-2">
              Filter customer vehicle records by model variant (e.g. M4, Model
              S, GT3).
            </p>
            <input
              type="text"
              value={modelParam}
              onChange={(e) => setModelParam(e.target.value)}
              placeholder="e.g. M4"
              className="w-full px-3 py-1.5 text-xs border border-[#E4E4E7] rounded bg-white font-mono text-[#18181B] focus:ring-1 focus:ring-black outline-none"
            />
          </div>
          <button
            onClick={() =>
              runQuery(`Customers With Model ${modelParam}`, () =>
                customerService.getCustomersWithSpecCarsModels(modelParam),
              )
            }
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors"
          >
            <span>Filter Model</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. Customers Left Join Cars */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col justify-between hover:border-[#18181B] transition-colors">
          <div>
            <h4 className="text-xs font-semibold text-[#18181B]">
              All Customers & Allocations
            </h4>
            <p className="text-xs text-[#71717A] mt-1">
              Include all customers regardless of whether they own a vehicle.
            </p>
          </div>
          <button
            onClick={() =>
              runQuery("All Customers & Allocations", () =>
                customerService.getCustomersCarsLeftJoin(),
              )
            }
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-[#18181B] bg-[#F4F4F5] border border-[#E4E4E7] rounded hover:bg-[#E4E4E7] transition-colors"
          >
            <span>Run Left Join</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5. Customer Car Count */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col justify-between hover:border-[#18181B] transition-colors">
          <div>
            <h4 className="text-xs font-semibold text-[#18181B]">
              Vehicle Registration Breakdown
            </h4>
            <p className="text-xs text-[#71717A] mt-1">
              Display aggregate count of total cars registered.
            </p>
          </div>
          <button
            onClick={() =>
              runQuery("Vehicle Registration Breakdown", () =>
                customerService.getCustomersCountHavingCars(),
              )
            }
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-[#18181B] bg-[#F4F4F5] border border-[#E4E4E7] rounded hover:bg-[#E4E4E7] transition-colors"
          >
            <span>Run Aggregate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6. Customer Projection */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 flex flex-col justify-between hover:border-[#18181B] transition-colors">
          <div>
            <h4 className="text-xs font-semibold text-[#18181B]">
              Customer Summary Report
            </h4>
            <p className="text-xs text-[#71717A] mt-1">
              Custom projection report selecting core customer and vehicle
              details.
            </p>
          </div>
          <button
            onClick={() =>
              runQuery("Customer Summary Report", () =>
                customerService.getCustomersCarsProjectionJoin(),
              )
            }
            className="mt-4 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-[#18181B] bg-[#F4F4F5] border border-[#E4E4E7] rounded hover:bg-[#E4E4E7] transition-colors"
          >
            <span>Run Projection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Query Results Display Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] mb-3">
          <div>
            <h3 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider">
              {activeQueryTitle}
            </h3>
          </div>
          <span className="text-xs font-mono text-[#18181B] bg-[#F4F4F5] px-2.5 py-1 rounded border border-[#E4E4E7]">
            {results.length} record(s)
          </span>
        </div>

        {isLoading ? (
          <LoadingSpinner label="Running backend JPQL query..." />
        ) : results.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#71717A]">
            Click any query card above to execute and view real backend results.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
                <tr>
                  {Object.keys(results[0]).map((key) => (
                    <th key={key} className="px-6 py-3">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5] text-sm">
                {results.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#F9FAFB] transition-colors"
                  >
                    {Object.keys(results[0]).map((key) => (
                      <td
                        key={key}
                        className="px-6 py-4 text-[#18181B] font-mono text-xs"
                      >
                        {row[key] !== null && row[key] !== undefined
                          ? Array.isArray(row[key])
                            ? row[key].map((car: any, i: number) => (
                                <div key={i}>
                                  {/* {car.company} {car.model} */}
                                  {car.modelName}
                                </div>
                              ))
                            : typeof row[key] === "object"
                              ? JSON.stringify(row[key])
                              : String(row[key])
                          : "null"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
