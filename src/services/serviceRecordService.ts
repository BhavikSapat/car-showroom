import { apiClient } from "./api";
import { ServiceRecord } from "../types";

export const serviceRecordService = {
  // POST /service - Add new vehicle service record (OWNER/MANAGER)
  async addService(service: {
    booking: { id: number };
    serviceNumber?: number;
    serviceType: string;
    scheduledDate?: string;
    status?: string;
    cost?: number;
    remarks?: string;
  }): Promise<ServiceRecord | string> {
    try {
      const response = await apiClient.post("/service", service);
      return response.data;
    } catch (err: any) {
      console.log("Add Service Error:", err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },

  // GET /service - Fetch all service records (OWNER/MANAGER)
  async getAllServices(): Promise<ServiceRecord[]> {
    try {
      const response = await apiClient.get("/service");
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      console.log("Get Services Error:", err.response?.data || err.message);
      return [];
    }
  },

  // GET /service/booking/{bookingId} - Fetch service records by Booking ID
  async getServicesByBooking(bookingId: number): Promise<ServiceRecord[]> {
    try {
      const response = await apiClient.get(`/service/booking/${bookingId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      return [];
    }
  },

  // PUT /service/{serviceId}/complete - Mark service as completed
  async markServiceComplete(
    serviceId: number,
  ): Promise<ServiceRecord | string> {
    try {
      const response = await apiClient.put(`/service/${serviceId}/complete`);
      return response.data;
    } catch (err: any) {
      console.log(
        "Mark Service Complete Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },
};
