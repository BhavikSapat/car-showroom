import { apiClient } from "./api";
import { Booking } from "../types";

export const bookingService = {
  // POST /booking - Create new vehicle booking (OWNER/MANAGER)
  async createBooking(booking: {
    customer: { id: number };
    car: { id: number };
    bookingDate?: string;
    insuranceTaken?: boolean;
    insuranceProvider?: string;
    insurancePolicyNo?: string;
    insuranceAmount?: number;
    insuranceExpiryDate?: string;
    bookingStatus?: string;
  }): Promise<Booking | string> {
    try {
      const response = await apiClient.post("/booking", booking);
      return response.data;
    } catch (err: any) {
      console.log("Create Booking Error:", err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },

  // GET /booking - Fetch all bookings (OWNER/MANAGER)
  async getAllBookings(): Promise<Booking[]> {
    try {
      const response = await apiClient.get("/booking");
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      console.log("Get Bookings Error:", err.response?.data || err.message);
      return [];
    }
  },

  // GET /booking/{bookingId} - Fetch booking by ID
  async getBookingById(bookingId: number): Promise<Booking | string | null> {
    try {
      const response = await apiClient.get(`/booking/${bookingId}`);
      return response.data;
    } catch (err: any) {
      return null;
    }
  },

  // GET /booking/customer/{customerId} - Fetch bookings by Customer ID
  async getBookingsByCustomer(customerId: number): Promise<Booking[]> {
    try {
      const response = await apiClient.get(`/booking/customer/${customerId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      return [];
    }
  },

  // PUT /booking/{bookingId}/status?status={status} - Update booking status
  async updateBookingStatus(
    bookingId: number,
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | string,
  ): Promise<Booking | string> {
    try {
      const response = await apiClient.put(
        `/booking/${bookingId}/status`,
        null,
        {
          params: { status },
        },
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Update Booking Status Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },
};
