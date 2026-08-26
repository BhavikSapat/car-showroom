import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import { customerService } from '../services/customerService';
import { Booking, CarCustomerAssignment } from '../types';
import { CarFront, Calendar, ShieldCheck, RefreshCcw, Info, Shield, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const MyCarsPage: React.FC = () => {
  const { user } = useAuth();
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [assignedCars, setAssignedCars] = useState<CarCustomerAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMyCarDetails = async () => {
    setIsLoading(true);
    try {
      const username = (user?.username || '').toLowerCase();
      const email = (user?.email || '').toLowerCase();

      // 1. Fetch real bookings
      const allBookings = await bookingService.getAllBookings().catch(() => []);
      if (Array.isArray(allBookings)) {
        const myBookings = allBookings.filter((b) => {
          const custName = (b.customer?.name || '').toLowerCase();
          const custEmail = (b.customer?.email || '').toLowerCase();
          return (
            (username && (custName.includes(username) || username.includes(custName))) ||
            (email && custEmail.includes(email)) ||
            custName === 'bhavik sapat'
          );
        });
        setUserBookings(myBookings);
      }

      // 2. Fetch join relationships as fallback
      const joins = await customerService.getCustomersWithCars().catch(() => []);
      if (Array.isArray(joins)) {
        const myJoins = joins
          .filter((j: any) => {
            const custName = (j.customerName || j.name || '').toLowerCase();
            const custEmail = (j.email || '').toLowerCase();
            return (
              (username && (custName.includes(username) || username.includes(custName))) ||
              (email && custEmail.includes(email)) ||
              custName === 'bhavik sapat'
            );
          })
          .map((j: any, idx: number) => ({
            id: idx + 1,
            customerName: j.customerName || j.name || 'Me',
            customerEmail: j.email || '',
            carCompany: j.carCompany || 'Brand',
            carModel: j.carModel || 'Model',
            bookingDate: j.bookingDate || new Date().toISOString().split('T')[0],
          }));
        setAssignedCars(myJoins);
      }
    } catch (err) {
      console.error('Failed to fetch assigned cars:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCarDetails();
  }, [user]);

  const hasVehicles = userBookings.length > 0 || assignedCars.length > 0;

  return (
    <div className="space-y-4 font-sans max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#18181B] flex items-center gap-2">
            <CarFront className="w-4 h-4 text-black" />
            My Assigned Vehicles & Bookings
          </h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            Vehicle details and bookings allocated to your customer account by showroom management.
          </p>
        </div>
        <button
          onClick={fetchMyCarDetails}
          className="px-3 py-1.5 text-xs text-[#71717A] hover:text-[#18181B] bg-[#F4F4F5] border border-[#E4E4E7] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner label="Checking assigned vehicle records..." />
      ) : !hasVehicles ? (
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto text-[#71717A]">
            <Info className="w-6 h-6 text-black" />
          </div>
          <h4 className="text-sm font-bold text-[#18181B] uppercase tracking-wider">No Vehicle Allocated</h4>
          <p className="text-xs font-semibold text-[#18181B] max-w-lg mx-auto leading-relaxed border p-3.5 rounded-lg bg-[#FAF9F5] border-[#E4E4E7]">
            CONTACT TO MANAGER OR OWNER TO ASSIGN A CAR /// VISIT OUR SHOWROOM AND GET YOUR DREAM CAR.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userBookings.map((b) => (
            <div key={b.id} className="bg-white border border-[#E4E4E7] rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-3">
                <span className="inline-block px-3 py-1 rounded text-xs font-extrabold tracking-wider uppercase border bg-[#18181B] text-white border-[#18181B]">
                  {b.car?.company}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> {b.bookingStatus || 'CONFIRMED'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block">Car Model</span>
                <h4 className="text-lg font-bold text-[#18181B] mt-0.5 font-mono">{b.car?.model}</h4>
                <p className="text-xs text-[#71717A] mt-1 font-medium">
                  Brand: <span className="font-bold text-[#18181B]">{b.car?.company}</span>
                </p>
              </div>

              <div className="space-y-2 text-xs border-t border-[#F4F4F5] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#71717A]" /> Booking Date:
                  </span>
                  <span className="font-semibold text-[#18181B]">{b.bookingDate || 'Recent'}</span>
                </div>

                {b.insuranceTaken && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#71717A] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" /> Insurance:
                    </span>
                    <span className="font-semibold text-emerald-700">{b.insuranceProvider || 'Covered'}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {userBookings.length === 0 &&
            assignedCars.map((item) => (
              <div key={item.id} className="bg-white border border-[#E4E4E7] rounded-lg p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-3">
                  <span className="inline-block px-3 py-1 rounded text-xs font-extrabold tracking-wider uppercase border bg-[#18181B] text-white border-[#18181B]">
                    {item.carCompany}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Allocated
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block">Car Model</span>
                  <h4 className="text-lg font-bold text-[#18181B] mt-0.5 font-mono">{item.carModel}</h4>
                  <p className="text-xs text-[#71717A] mt-1 font-medium">
                    Brand: <span className="font-bold text-[#18181B]">{item.carCompany}</span>
                  </p>
                </div>

                <div className="space-y-2 text-xs border-t border-[#F4F4F5] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#71717A] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#71717A]" /> Booking Date:
                    </span>
                    <span className="font-semibold text-[#18181B]">{item.bookingDate}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

