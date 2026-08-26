import React, { useState, useEffect, useCallback } from "react";
import { Customer, Booking } from "../types";
import { customerService } from "../services/customerService";
import { bookingService } from "../services/bookingService";
import { useAuth } from "../context/AuthContext";
import { CustomerTable } from "../components/customers/CustomerTable";
import {
  CustomerSearchFilter,
  SearchMode,
} from "../components/customers/CustomerSearchFilter";
import { CustomerFormModal } from "../components/customers/CustomerFormModal";
import { Modal } from "../components/common/Modal";
import { useToast } from "../components/common/Toast";
import {
  UserPlus,
  RefreshCw,
  Mail,
  CarFront,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { InitialsAvatar } from "../components/common/InitialsAvatar";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

export const CustomersPage: React.FC = () => {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { role } = useAuth();
  const isManagerOrOwner = role === "OWNER" || role === "MANAGER";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("id");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [isLoadingCustomerBookings, setIsLoadingCustomerBookings] =
    useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toast = useToast();

  const loadPaginatedCustomers = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await customerService.getAllCustomers(
        page,
        size,
        sortBy,
        direction,
      );

      if (typeof res === "string") {
        setCustomers([]);
      } else {
        setCustomers(res.content || []);
        setTotalPages(res.totalPages || 1);
        setTotalElements(res.totalElements || 0);
      }
    } catch (err: any) {
      toast.error("Failed to load customers", err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, sortBy, direction]);

  useEffect(() => {
    if (!isSearchMode) {
      loadPaginatedCustomers();
    }
  }, [loadPaginatedCustomers, isSearchMode]);

  const handleExecuteSearch = async (mode: SearchMode, term: string) => {
    if (mode === "all") {
      setIsSearchMode(false);
      setPage(0);
      return;
    }

    setIsSearchMode(true);
    setIsLoading(true);
    try {
      let data: any = null;
      switch (mode) {
        case "search_name":
          data = await customerService.searchByName(term);
          break;
        case "filter_name":
          data = await customerService.filterByName(term);
          break;
        case "search_email":
          data = await customerService.searchByEmail(term);
          break;
        case "filter_email":
          data = await customerService.filterByEmail(term);
          break;
        case "search_id":
          data = await customerService.getCustomerById(Number(term));
          break;
        case "query_name":
          data = await customerService.getCustomerByNameQuery(term);
          break;
        case "query_email":
          data = await customerService.getCustomerByEmailQuery();
          break;
        default:
          return loadPaginatedCustomers();
      }

      if (typeof data === "string") {
        toast.error("Search Error", data);
        setCustomers([]);
      } else {
        const list = Array.isArray(data) ? data : [data];
        setCustomers(list.filter(Boolean));
        setTotalElements(list.length);
        setTotalPages(1);
        toast.success(
          "Search Executed",
          `Found ${list.length} customer record(s)`,
        );
      }
    } catch (err: any) {
      toast.error("Search failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: Omit<Customer, "id">) => {
    setIsSubmitting(true);
    try {
      if (editingCustomer && editingCustomer.id) {
        // PUT /customer/{customerId}
        const res = await customerService.updateCustomer(
          editingCustomer.id,
          data,
        );
        if (typeof res === "string") {
          toast.error("Update Failed", res);
        } else {
          toast.success(
            "Customer Updated",
            `Updated customer ${editingCustomer.id}`,
          );
          setIsFormOpen(false);
          setEditingCustomer(null);
          loadPaginatedCustomers();
        }
      } else {
        // POST /customer
        const res = await customerService.saveCustomer(data);
        if (typeof res === "string") {
          toast.error("Save Failed", res);
        } else {
          toast.success(
            "Customer Saved",
            `Created customer "${(res as Customer).name}"`,
          );
          setIsFormOpen(false);
          loadPaginatedCustomers();
        }
      }
    } catch (err: any) {
      toast.error("Error saving customer", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!customer.id) return;
    if (
      !window.confirm(
        `Are you sure you want to delete customer ${customer.id} (${customer.name})? This will permanently delete customer records.`,
      )
    ) {
      return;
    }

    try {
      const msg = await customerService.deleteCustomer(customer.id);
      if (typeof msg === "string" && msg.includes("Access Denied")) {
        toast.error("Access Denied", msg);
      } else {
        toast.success(
          "Customer Deleted",
          typeof msg === "string"
            ? msg
            : `Customer ${customer.id} removed successfully.`,
        );
        loadPaginatedCustomers();
      }
    } catch (err: any) {
      toast.error("Delete failed", err.message);
    }
  };

  const handleOpenViewCustomer = async (c: Customer) => {
    setViewingCustomer(c);
    setCustomerBookings([]);
    if (c.id) {
      setIsLoadingCustomerBookings(true);
      try {
        const bookings = await bookingService.getBookingsByCustomer(c.id);
        if (Array.isArray(bookings)) {
          setCustomerBookings(bookings);
        }
      } catch (err) {
        console.error("Error fetching bookings for customer:", err);
      } finally {
        setIsLoadingCustomerBookings(false);
      }
    }
  };

  const handleSortToggle = (column: string) => {
    if (sortBy === column) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setDirection("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E4E4E7] rounded-lg p-5">
        <div>
          <h3 className="text-sm font-semibold text-[#18181B]">
            Customer Directory
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Manage customer records and registered accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isManagerOrOwner && (
            <button
              onClick={() => {
                setEditingCustomer(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-black rounded hover:bg-[#27272A] transition-colors cursor-pointer shadow-xs"
              title="Add New Customer"
            >
              <UserPlus className="w-4 h-4 text-white" />
              <span>Add Customer</span>
            </button>
          )}
          <button
            onClick={() => loadPaginatedCustomers()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#18181B] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:bg-[#E4E4E7] transition-colors cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Refresh Directory</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <CustomerSearchFilter
        onExecuteSearch={handleExecuteSearch}
        onReset={() => {
          setIsSearchMode(false);
          setPage(0);
        }}
        isLoading={isLoading}
      />

      {/* Main Table View */}
      {isLoading ? (
        <LoadingSpinner label="Fetching customer directory..." />
      ) : (
        <CustomerTable
          customers={customers}
          onEdit={(c) => {
            setEditingCustomer(c);
            setIsFormOpen(true);
          }}
          onDelete={handleDelete}
          onView={handleOpenViewCustomer}
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          size={size}
          sortBy={sortBy}
          direction={direction}
          onPageChange={(p) => setPage(p)}
          onSortChange={handleSortToggle}
          isLoading={isLoading}
        />
      )}

      {/* Add / Edit Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCustomer}
        isLoading={isSubmitting}
      />

      {/* View Customer Details Modal */}
      <Modal
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        title="Customer Profile"
        subtitle={viewingCustomer ? `Customer ${viewingCustomer.id}` : ""}
      >
        {viewingCustomer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <InitialsAvatar
                name={viewingCustomer.name}
                role="CUSTOMER"
                size="lg"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {viewingCustomer.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  ID {viewingCustomer.id}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {viewingCustomer.email}
                </span>
              </div>

              {/* Bookings / Assigned Vehicles Section */}
              <div className="pt-2">
                <span className="text-slate-700 flex items-center gap-1.5 mb-2 font-semibold">
                  <CarFront className="w-3.5 h-3.5 text-slate-500" /> Bookings &
                  Assigned Vehicles:
                </span>

                {isLoadingCustomerBookings ? (
                  <p className="text-slate-400 italic text-[11px]">
                    Loading vehicle records...
                  </p>
                ) : customerBookings.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customerBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {b.car?.company} {b.car?.model}
                          </span>
                          {b.bookingStatus == "CONFIRMED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> {"CONFIRMED"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <ShieldCheck className="w-3 h-3" />{" "}
                              {b.bookingStatus}
                            </span>
                          )}
                          {/* <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />{" "}
                            {b.bookingStatus || "CONFIRMED"}
                          </span> */}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>Booking {b.id}</span>
                          <span>{b.bookingDate || "Recent"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : viewingCustomer.cars && viewingCustomer.cars.length > 0 ? (
                  <div className="space-y-1.5">
                    {viewingCustomer.cars.map((car: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between"
                      >
                        <span className="font-semibold text-slate-800">
                          {car.company || car.carCompany}
                        </span>
                        <span className="text-slate-600">
                          {car.model || car.carModel}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs italic bg-slate-50 p-2.5 rounded border border-slate-100">
                    No active vehicle bookings associated with this customer.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingCustomer(null)}
                className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
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

// import React, { useState, useEffect, useCallback } from "react";
// import { Customer } from "../types";
// import { customerService } from "../services/customerService";
// import { useAuth } from "../context/AuthContext";
// import { CustomerTable } from "../components/customers/CustomerTable";
// import {
//   CustomerSearchFilter,
//   SearchMode,
// } from "../components/customers/CustomerSearchFilter";
// import { CustomerFormModal } from "../components/customers/CustomerFormModal";
// import { Modal } from "../components/common/Modal";
// import { useToast } from "../components/common/Toast";
// import {
//   UserPlus,
//   RefreshCw,
//   Mail,
//   Calendar,
//   Megaphone,
//   CarFront,
// } from "lucide-react";
// import { InitialsAvatar } from "../components/common/InitialsAvatar";
// import { LoadingSpinner } from "../components/common/LoadingSpinner";

// export const CustomersPage: React.FC = () => {
//   const { role } = useAuth();
//   const isManagerOrOwner = role === "OWNER" || role === "MANAGER";

//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [page, setPage] = useState<number>(0);
//   const [size, setSize] = useState<number>(10);
//   const [totalPages, setTotalPages] = useState<number>(1);
//   const [totalElements, setTotalElements] = useState<number>(0);
//   const [sortBy, setSortBy] = useState<string>("id");
//   const [direction, setDirection] = useState<"asc" | "desc">("asc");
//   const [isLoading, setIsLoading] = useState<boolean>(true);

//   // Modals state
//   const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
//   const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
//   const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

//   const toast = useToast();

//   // const loadPaginatedCustomers = useCallback(async () => {
//   //   setIsLoading(true);
//   //   try {
//   //     const res = await customerService.getAllCustomers(page, size, sortBy, direction);
//   //     if (typeof res === 'string') {
//   //       toast.error('Access / Session Error', res);
//   //       setCustomers([]);
//   //     } else {
//   //       setCustomers(res.content || []);
//   //       setTotalPages(res.totalPages || 1);
//   //       setTotalElements(res.totalElements || 0);
//   //     }
//   //   } catch (err: any) {
//   //     toast.error('Failed to load customers', err.message);
//   //   } finally {
//   //     setIsLoading(false);
//   //   }
//   // }, [page, size, sortBy, direction, toast]);
//   const loadPaginatedCustomers = useCallback(async () => {
//     setIsLoading(true);

//     try {
//       const res = await customerService.getAllCustomers(
//         page,
//         size,
//         sortBy,
//         direction,
//       );

//       if (typeof res === "string") {
//         setCustomers([]);
//       } else {
//         setCustomers(res.content || []);
//         setTotalPages(res.totalPages || 1);
//         setTotalElements(res.totalElements || 0);
//       }
//     } catch (err: any) {
//       toast.error("Failed to load customers", err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [page, size, sortBy, direction]);
//   useEffect(() => {
//     loadPaginatedCustomers();
//   }, [loadPaginatedCustomers]);

//   const handleExecuteSearch = async (mode: SearchMode, term: string) => {
//     setIsLoading(true);
//     try {
//       let data: any = null;
//       switch (mode) {
//         case "search_name":
//           data = await customerService.searchByName(term);
//           break;
//         case "filter_name":
//           data = await customerService.filterByName(term);
//           break;
//         case "search_email":
//           data = await customerService.searchByEmail(term);
//           break;
//         case "filter_email":
//           data = await customerService.filterByEmail(term);
//           break;
//         case "filter_date":
//           data = await customerService.filterByDate(term);
//           break;
//         case "search_id":
//           data = await customerService.getCustomerById(Number(term));
//           break;
//         case "query_name":
//           data = await customerService.getCustomerByNameQuery(term);
//           break;
//         case "query_email":
//           data = await customerService.getCustomerByEmailQuery();
//           break;
//         case "query_date":
//           data = await customerService.getCustomerByDateQuery(term);
//           break;
//         case "all":
//         default:
//           return loadPaginatedCustomers();
//       }

//       if (typeof data === "string") {
//         toast.error("Search Error", data);
//         setCustomers([]);
//       } else {
//         const list = Array.isArray(data) ? data : [data];
//         setCustomers(list);
//         setTotalElements(list.length);
//         setTotalPages(1);
//         toast.success(
//           "Search Executed",
//           `Found ${list.length} customer record(s)`,
//         );
//       }
//     } catch (err: any) {
//       toast.error("Search failed", err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFormSubmit = async (data: Omit<Customer, "id">) => {
//     setIsSubmitting(true);
//     try {
//       if (editingCustomer && editingCustomer.id) {
//         // PUT /customer/{customerId}
//         const res = await customerService.updateCustomer(
//           editingCustomer.id,
//           data,
//         );
//         if (typeof res === "string") {
//           toast.error("Update Failed", res);
//         } else {
//           toast.success(
//             "Customer Updated",
//             `Updated customer #${editingCustomer.id}`,
//           );
//           setIsFormOpen(false);
//           setEditingCustomer(null);
//           loadPaginatedCustomers();
//         }
//       } else {
//         // POST /customer
//         const res = await customerService.saveCustomer(data);
//         if (typeof res === "string") {
//           toast.error("Save Failed", res);
//         } else {
//           toast.success(
//             "Customer Saved",
//             `Created customer "${(res as Customer).name}"`,
//           );
//           setIsFormOpen(false);
//           loadPaginatedCustomers();
//         }
//       }
//     } catch (err: any) {
//       toast.error("Error saving customer", err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleDelete = async (customer: Customer) => {
//     if (!customer.id) return;
//     if (
//       !window.confirm(
//         `Are you sure you want to delete customer #${customer.id} (${customer.name})?`,
//       )
//     ) {
//       return;
//     }

//     try {
//       const msg = await customerService.deleteCustomer(customer.id);
//       if (msg.includes("Access Denied")) {
//         toast.error("Access Denied", msg);
//       } else {
//         toast.success("Customer Deleted", msg);
//         loadPaginatedCustomers();
//       }
//     } catch (err: any) {
//       toast.error("Delete failed", err.message);
//     }
//   };

//   const handleSortToggle = (column: string) => {
//     if (sortBy === column) {
//       setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
//     } else {
//       setSortBy(column);
//       setDirection("asc");
//     }
//   };

//   return (
//     <div className="space-y-4">
//       {/* Header Bar */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E4E4E7] rounded-lg p-5">
//         <div>
//           <h3 className="text-sm font-semibold text-[#18181B]">
//             Customer Directory
//           </h3>
//           <p className="text-xs text-[#71717A] mt-0.5">
//             Manage customer records, bookings, and preferences
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           {isManagerOrOwner && (
//             <button
//               onClick={() => {
//                 setEditingCustomer(null);
//                 setIsFormOpen(true);
//               }}
//               className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-black rounded hover:bg-[#27272A] transition-colors cursor-pointer shadow-xs"
//               title="Add New Customer"
//             >
//               <UserPlus className="w-4 h-4 text-white" />
//               <span>Add Customer</span>
//             </button>
//           )}
//           <button
//             onClick={() => loadPaginatedCustomers()}
//             className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#18181B] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:bg-[#E4E4E7] transition-colors cursor-pointer"
//             title="Refresh Table"
//           >
//             <RefreshCw className="w-3.5 h-3.5 text-[#71717A]" />
//             <span>Refresh Directory</span>
//           </button>
//         </div>
//       </div>

//       {/* Search & Filter Bar */}
//       <CustomerSearchFilter
//         onExecuteSearch={handleExecuteSearch}
//         onReset={() => loadPaginatedCustomers()}
//         isLoading={isLoading}
//       />

//       {/* Main Table View */}
//       {isLoading ? (
//         <LoadingSpinner label="Fetching customer directory..." />
//       ) : (
//         <CustomerTable
//           customers={customers}
//           onEdit={(c) => {
//             setEditingCustomer(c);
//             setIsFormOpen(true);
//           }}
//           onDelete={handleDelete}
//           onView={(c) => setViewingCustomer(c)}
//           page={page}
//           totalPages={totalPages}
//           totalElements={totalElements}
//           size={size}
//           sortBy={sortBy}
//           direction={direction}
//           onPageChange={(p) => setPage(p)}
//           onSortChange={handleSortToggle}
//           isLoading={isLoading}
//         />
//       )}

//       {/* Add / Edit Form Modal */}
//       <CustomerFormModal
//         isOpen={isFormOpen}
//         onClose={() => {
//           setIsFormOpen(false);
//           setEditingCustomer(null);
//         }}
//         onSubmit={handleFormSubmit}
//         initialData={editingCustomer}
//         isLoading={isSubmitting}
//       />

//       {/* View Customer Details Modal */}
//       <Modal
//         isOpen={!!viewingCustomer}
//         onClose={() => setViewingCustomer(null)}
//         title="Customer Profile Details"
//         subtitle={viewingCustomer ? `Customer ID #${viewingCustomer.id}` : ""}
//       >
//         {viewingCustomer && (
//           <div className="space-y-4">
//             <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
//               <InitialsAvatar
//                 name={viewingCustomer.name}
//                 role="CUSTOMER"
//                 size="lg"
//               />
//               <div>
//                 <h4 className="text-sm font-bold text-slate-900">
//                   {viewingCustomer.name}
//                 </h4>
//                 <p className="text-xs text-slate-500 font-mono">
//                   ID #{viewingCustomer.id}
//                 </p>
//               </div>
//             </div>

//             <div className="space-y-2 text-xs">
//               <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
//                 <span className="text-slate-500 flex items-center gap-1.5">
//                   <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
//                 </span>
//                 <span className="font-mono font-bold text-slate-900">
//                   {viewingCustomer.email}
//                 </span>
//               </div>

//               <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
//                 <span className="text-slate-500 flex items-center gap-1.5">
//                   <Calendar className="w-3.5 h-3.5 text-slate-400" /> Booking
//                   Date:
//                 </span>
//                 <span className="font-semibold text-slate-900">
//                   {viewingCustomer.bookingDate}
//                 </span>
//               </div>

//               <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
//                 <span className="text-slate-500 flex items-center gap-1.5">
//                   <Megaphone className="w-3.5 h-3.5 text-slate-400" /> Marketing
//                   Preference:
//                 </span>
//                 <span className="font-bold text-emerald-700">
//                   {viewingCustomer.marketing || "N/A"}
//                 </span>
//               </div>

//               {viewingCustomer.cars && viewingCustomer.cars.length > 0 && (
//                 <div className="pt-2 border-t border-slate-100">
//                   <span className="text-slate-500 flex items-center gap-1.5 mb-1.5 font-semibold">
//                     <CarFront className="w-3.5 h-3.5 text-slate-400" /> Attached
//                     Vehicles ({viewingCustomer.cars.length}):
//                   </span>
//                   <div className="space-y-1 pl-2">
//                     {viewingCustomer.cars.map((car: any, idx: number) => (
//                       <div
//                         key={idx}
//                         className="p-2 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between"
//                       >
//                         <span className="font-semibold text-slate-800">
//                           {car.company || car.carCompany}
//                         </span>
//                         <span className="text-slate-600">
//                           {car.model || car.carModel}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="pt-2">
//               <button
//                 onClick={() => setViewingCustomer(null)}
//                 className="w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
//               >
//                 Close Details
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// };
