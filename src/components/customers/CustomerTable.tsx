import React from "react";
import { Customer } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { InitialsAvatar } from "../common/InitialsAvatar";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  sortBy: string;
  direction: "asc" | "desc";
  onPageChange: (newPage: number) => void;
  onSortChange: (newSortBy: string) => void;
  isLoading: boolean;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onEdit,
  onDelete,
  onView,
  page,
  totalPages,
  totalElements,
  size,
  sortBy,
  direction,
  onPageChange,
  onSortChange,
  isLoading,
}) => {
  const { role } = useAuth();
  const isOwner = role === "OWNER";

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden">
      {/* Table Shell */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
            <tr>
              <th className="px-6 py-3 w-20">
                <button
                  onClick={() => onSortChange("id")}
                  className="flex items-center gap-1 hover:text-[#18181B] transition-colors uppercase font-semibold"
                >
                  ID <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => onSortChange("name")}
                  className="flex items-center gap-1 hover:text-[#18181B] transition-colors uppercase font-semibold"
                >
                  Customer Name <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => onSortChange("email")}
                  className="flex items-center gap-1 hover:text-[#18181B] transition-colors uppercase font-semibold"
                >
                  Email <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5] text-sm">
            {customers.map((c, key) => (
              <tr key={c.id} className="hover:bg-[#F9FAFB] transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-[#71717A]">
                  {key + 1}
                </td>
                <td className="px-6 py-4 font-medium text-[#18181B]">
                  <div className="flex items-center gap-2.5">
                    <InitialsAvatar name={c.name} role="CUSTOMER" size="sm" />
                    <span>{c.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[#71717A] font-mono text-xs">
                  {c.email}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onView(c)}
                      className="text-[10px] border px-2.5 py-1 rounded border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#18181B] font-medium transition-colors cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEdit(c)}
                      className="text-[10px] border px-2.5 py-1 rounded border-[#E4E4E7] hover:bg-[#F4F4F5] text-[#18181B] font-medium transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => onDelete(c)}
                        className="text-[10px] border px-2.5 py-1 rounded border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Delete Customer (OWNER only)"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-[#E4E4E7] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white text-xs text-[#71717A]">
        <div className="text-center sm:text-left">
          Showing page{" "}
          <span className="font-semibold text-[#18181B]">{page + 1}</span> of{" "}
          <span className="font-semibold text-[#18181B]">
            {totalPages || 1}
          </span>{" "}
          ({totalElements} total records)
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0 || isLoading}
            className="text-xs font-medium border border-[#E4E4E7] rounded px-3 py-1.5 hover:bg-[#F4F4F5] text-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="flex gap-1">
            <span className="w-8 h-8 rounded text-xs font-medium bg-black text-white flex items-center justify-center">
              {page + 1}
            </span>
          </div>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1 || isLoading}
            className="text-xs font-medium border border-[#E4E4E7] rounded px-3 py-1.5 hover:bg-[#F4F4F5] text-[#18181B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
