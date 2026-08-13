import { apiClient } from "./api";
import { User } from "../types";
import { authService } from "./authService";

export const userService = {
  // Register user: POST /register
  async registerUser(user: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<User | string> {
    return await authService.register(user);
  },

  // DELETE /user/{userId} - Remove user (OWNER role)
  async deleteUser(userId: number): Promise<string> {
    try {
      const response = await apiClient.delete<string>(`/user/${userId}`);
      return typeof response.data === "string"
        ? response.data
        : "Deleted successfully";
    } catch (err: any) {
      console.log(
        "Delete User Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return "Failed to delete user";
    }
  },

  // Fetch users list from API
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get("/users");
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.content)) {
        return response.data.content;
      }
    } catch (err: any) {
      console.log("Get Users API Error:", err.response?.data || err.message);
    }
    return [];
  },
};
