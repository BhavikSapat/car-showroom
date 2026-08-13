import { apiClient } from "./api";
import { customerService } from "./customerService";

export interface ParsedDashboardStats {
  totalCustomers: number;
  totalCars: number;
  totalUsers: number;
  rawText: string;
}

export const dashboardService = {
  // GET /dashboard - Fetch executive stats (OWNER/MANAGER role)
  async getDashboardData(): Promise<ParsedDashboardStats | string> {
    try {
      const response = await apiClient.get<string>("/dashboard");
      const rawText = response.data;
      if (typeof rawText === "string") {
        if (rawText.includes("Access Denied")) {
          return rawText;
        }

        // Parse Spring text response format
        const custMatch = rawText.match(
          /Total Number Of Customers\s*:\s*(\d+)/i,
        );
        const carMatch = rawText.match(/Total Number Of Cars\s*:\s*(\d+)/i);
        const userMatch = rawText.match(/Total Number Of Users\s*:\s*(\d+)/i);

        return {
          totalCustomers: custMatch ? parseInt(custMatch[1], 10) : 0,
          totalCars: carMatch ? parseInt(carMatch[1], 10) : 0,
          totalUsers: userMatch ? parseInt(userMatch[1], 10) : 0,
          rawText,
        };
      }
      return "Access Denied! You are not allowed to Access the DashBoard.";
    } catch (err: any) {
      console.log(
        "Get Dashboard Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return "Access Denied! You are not allowed to Access the DashBoard.";
    }
  },
};
