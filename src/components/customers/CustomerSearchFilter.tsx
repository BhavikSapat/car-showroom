import React, { useState } from "react";
import { Search, RefreshCcw } from "lucide-react";

export type SearchMode =
  | "all"
  | "search_name"
  | "filter_name"
  | "search_email"
  | "filter_email"
  | "search_id"
  | "query_name"
  | "query_email";

interface CustomerSearchFilterProps {
  onExecuteSearch: (mode: SearchMode, term: string) => void;
  onReset: () => void;
  isLoading: boolean;
}

export const CustomerSearchFilter: React.FC<CustomerSearchFilterProps> = ({
  onExecuteSearch,
  onReset,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<SearchMode>("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() && mode !== "all" && mode !== "query_email") return;
    onExecuteSearch(mode, searchTerm.trim());
  };

  const handleReset = () => {
    setSearchTerm("");
    setMode("all");
    onReset();
  };

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-lg p-4 mb-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row gap-3 items-stretch md:items-end"
      >
        {/* Search Mode Selector */}
        <div className="shrink-0">
          <label className="block text-[10px] uppercase font-semibold text-[#71717A] tracking-wider mb-1">
            Search Filter Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SearchMode)}
            className="w-full md:w-56 px-3 py-2 text-xs font-medium text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
          >
            <option value="all">All Customers (Paged)</option>
            <option value="search_id">Search by ID (/customer/search/id)</option>
            <option value="search_name">Search by Name (/customer/search/name)</option>
            <option value="search_email">Search by Email (/customer/search/email)</option>
            <option value="filter_name">Filter by Name (/customer/filter/name)</option>
            <option value="filter_email">Filter by Email (/customer/filter/email)</option>
            <option value="query_name">Query by Name (/customer/query/name)</option>
            <option value="query_email">All Emails Query (/customer/query/email)</option>
          </select>
        </div>

        {/* Input Term */}
        {mode !== "all" && mode !== "query_email" && (
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-semibold text-[#71717A] tracking-wider mb-1">
              {mode.includes("id")
                ? "Customer ID"
                : "Search Value"}
            </label>
            <div className="relative">
              <input
                type={mode.includes("id") ? "number" : "text"}
                placeholder={
                  mode.includes("email")
                    ? "Enter customer email..."
                    : mode.includes("id")
                      ? "e.g. 1"
                      : "Enter customer name..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none placeholder-[#71717A]"
              />
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7] rounded hover:bg-[#E4E4E7] hover:text-[#18181B] transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </form>
    </div>
  );
};
