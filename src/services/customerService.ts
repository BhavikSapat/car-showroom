import { apiClient } from "./api";
import { Customer, PageableResponse, CustomerCarJoinResult } from "../types";

export const customerService = {
  // POST /customer - Save a new customer record
  async saveCustomer(
    customer: Omit<Customer, "id"> | Customer,
  ): Promise<Customer | string> {
    try {
      const response = await apiClient.post("/customer", customer);
      return response.data;
    } catch (err: any) {
      console.log(
        "Save Customer Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },

  // GET /customer - Fetch paginated customers list
  async getAllCustomers(
    page = 0,
    size = 10,
    sortBy = "id",
    direction = "asc",
  ): Promise<PageableResponse<Customer> | string> {
    try {
      const response = await apiClient.get("/customer", {
        params: { page, size, sortBy, direction },
      });
      return response.data;
    } catch (err: any) {
      console.log(
        "Get All Customers Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return {
        content: [],
        totalElements: 0,
        totalPages: 1,
        number: page,
        size,
      };
    }
  },

  // GET /customer/search/name/{name} - Search containing name
  async searchByName(name: string): Promise<Customer[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/search/name/${encodeURIComponent(name)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Search By Name Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/filter/name/{name} - Filter exact name
  async filterByName(name: string): Promise<Customer[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/filter/name/${encodeURIComponent(name)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Filter By Name Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/search/email/{email} - Search containing email
  async searchByEmail(email: string): Promise<Customer[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/search/email/${encodeURIComponent(email)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Search By Email Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/filter/email/{email} - Filter exact email
  async filterByEmail(email: string): Promise<Customer[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/filter/email/${encodeURIComponent(email)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Filter By Email Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/filter/date/{bookingDate} - Filter exact booking date
  async filterByDate(bookingDate: string): Promise<Customer[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/filter/date/${encodeURIComponent(bookingDate)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Filter By Date Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/search/id/{customerId} - Fetch single customer by ID
  async getCustomerById(customerId: number): Promise<Customer | string> {
    try {
      const response = await apiClient.get(`/customer/search/id/${customerId}`);
      return response.data;
    } catch (err: any) {
      console.log(
        "Get Customer By ID Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return `Customer with ID ${customerId} not found`;
    }
  },

  // GET /customer/query/name/{name} - Name query report
  async getCustomerByNameQuery(name: string): Promise<Customer[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/query/name/${encodeURIComponent(name)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Customer Name Query Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/query/email - Email query report
  async getCustomerByEmailQuery(): Promise<Customer[] | string> {
    try {
      const response = await apiClient.get(`/customer/query/email`);
      return response.data;
    } catch (err: any) {
      console.log(
        "Customer Email Query Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/query/date/{date} - Date query report
  async getCustomerByDateQuery(date: string): Promise<Customer[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/query/date/${encodeURIComponent(date)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Customer Date Query Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/query/join/customercar - Fetch customers with car join
  async getCustomersWithCars(): Promise<CustomerCarJoinResult[] | string> {
    try {
      const response = await apiClient.get(`/customer/query/join/customercar`);
      return response.data;
    } catch (err: any) {
      console.log(
        "Get Customers With Cars Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/query/join/customerspeccar/{company} - Filter cars by company brand
  async getCustomersWithSpecCars(
    company: string,
  ): Promise<CustomerCarJoinResult[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/query/join/customerspeccar/${encodeURIComponent(company)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Get Customers Spec Cars Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/query/join/customerspeccarmodel/{model} - Filter cars by model
  async getCustomersWithSpecCarsModels(
    model: string,
  ): Promise<CustomerCarJoinResult[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/query/join/customerspeccarmodel/${encodeURIComponent(model)}`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Get Customers Spec Cars Models Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/query/join/customerleftjoincar - Left join customer cars
  async getCustomersCarsLeftJoin(): Promise<CustomerCarJoinResult[] | string> {
    try {
      const response = await apiClient.get(
        `/customer/query/join/customerleftjoincar`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Left Join Cars Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/query/join/customerwithcarcount - Count cars per customer
  async getCustomersCountHavingCars(): Promise<
    CustomerCarJoinResult[] | string
  > {
    try {
      const response = await apiClient.get(
        `/customer/query/join/customerwithcarcount`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Customers Car Count Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // GET /customer/query/join/customerprojectionjoincar - DTO projection query
  async getCustomersCarsProjectionJoin(): Promise<
    CustomerCarJoinResult[] | string
  > {
    try {
      const response = await apiClient.get(
        `/customer/query/join/customerprojectionjoincar`,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Projection Join Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return [];
    }
  },

  // PUT /customer/{customerId} - Update customer details
  async updateCustomer(
    customerId: number,
    customer: Partial<Customer>,
  ): Promise<Customer | string> {
    try {
      const response = await apiClient.put(`/customer/${customerId}`, customer);
      return response.data;
    } catch (err: any) {
      console.log(
        "Update Customer Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },

  // GET /customer/count - Get total customer count
  async getCustomerCount(): Promise<number | string> {
    try {
      const response = await apiClient.get("/customer/count");
      return typeof response.data === "number"
        ? response.data
        : parseInt(response.data, 10) || 0;
    } catch (err: any) {
      console.log(
        "Customer Count Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return 0;
    }
  },

  // DELETE /customer/{customerId} - Delete customer record (OWNER role)
  async deleteCustomer(customerId: number): Promise<string> {
    try {
      const response = await apiClient.delete(`/customer/${customerId}`);
      return typeof response.data === "string"
        ? response.data
        : "Customer Deleted";
    } catch (err: any) {
      console.log(
        "Delete Customer Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return "Failed to delete customer";
    }
  },

  // POST /customer/{customerId}/assign - Assign car model IDs to customer
  async assignModels(
    customerId: number,
    modelIds: number[],
  ): Promise<any> {
    try {
      const response = await apiClient.post(
        `/customer/${customerId}/assign`,
        modelIds,
      );
      return response.data;
    } catch (err: any) {
      console.log(
        "Assign Models Backend Error:",
        err.response?.data || err.message,
      );
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },
};
