import { apiClient } from "./api";
import { customerService } from "./customerService";
import { Car, CarCustomerAssignment, CustomerCarJoinResult } from "../types";

export const carService = {
  // GET /car - Fetch all car records
  async getAllCars(): Promise<Car[]> {
    try {
      const response = await apiClient.get("/car");
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (err: any) {
      console.log("Get All Cars API Error:", err.response?.data || err.message);
      return [];
    }
  },

  // Get all cars from backend API with fallback
  async getCars(): Promise<Car[]> {
    try {
      const cars = await this.getAllCars();
      if (Array.isArray(cars) && cars.length > 0) {
        return cars;
      }
      const joins = await customerService.getCustomersWithCars();
      if (Array.isArray(joins)) {
        const carsList: Car[] = [];
        joins.forEach((j, idx) => {
          if (j.carCompany || j.carModel) {
            carsList.push({
              id: idx + 1,
              company: j.carCompany || "",
              carCompany: j.carCompany || "",
              model: j.carModel || "",
              carModel: j.carModel || "",
              quantity: 1,
              status: "AVAILABLE",
            });
          }
        });
        if (carsList.length > 0) return carsList;
      }
    } catch (err: any) {
      console.log("Get Cars Error:", err);
    }
    return [];
  },

  // POST /car - Add or save car
  async addCar(car: {
    company: string;
    model?: string;
    variant?: string;
    color?: string;
    fuelType?: string;
    transmission?: string;
    manufacturingYear?: number;
    price?: number;
    quantity?: number;
    status?: string;
    models?: Array<{ modelName: string; quantity: number }>;
    [key: string]: any;
  }): Promise<Car | string> {
    try {
      const payload = {
        company: car.company || car.carCompany || "",
        model: car.model || car.carModel || "",
        variant: car.variant || "Standard",
        color: car.color || "Standard",
        fuelType: car.fuelType || "Petrol",
        transmission: car.transmission || "Automatic",
        manufacturingYear: car.manufacturingYear || new Date().getFullYear(),
        price: car.price || 0,
        quantity: car.quantity !== undefined ? car.quantity : 1,
        status:
          car.status ||
          (car.quantity && car.quantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK"),
      };
      const response = await apiClient.post("/car", payload);
      return response.data;
    } catch (err: any) {
      console.log("Add Car API Error:", err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },

  // POST /bulk - Bulk add multiple cars
  async addMultipleCars(cars: Car[]): Promise<Car[]> {
    try {
      const response = await apiClient.post("/bulk", cars);
      return response.data;
    } catch (err: any) {
      console.log("Bulk Add Cars Error:", err.response?.data || err.message);
      throw err;
    }
  },

  // Helper saveCar wrapper for compatibility
  async saveCar(car: {
    carCompany?: string;
    carModel?: string;
    company?: string;
    model?: string;
    quantity?: number;
    [key: string]: any;
  }): Promise<Car> {
    try {
      const result = await this.addCar({
        company: car.company || car.carCompany || "",
        model: car.model || car.carModel || "",
        quantity: car.quantity !== undefined ? car.quantity : 1,
      });
      return typeof result === "object"
        ? result
        : {
            id: Date.now(),
            company: car.company || car.carCompany || "",
            model: car.model || car.carModel || "",
          };
    } catch (err: any) {
      return {
        id: Date.now(),
        company: car.company || car.carCompany || "",
        model: car.model || car.carModel || "",
      };
    }
  },

  // GET /car/{carId} - Fetch car by ID
  async getCarById(carId: number): Promise<Car | string | null> {
    try {
      const response = await apiClient.get(`/car/${carId}`);
      return response.data;
    } catch (err: any) {
      return null;
    }
  },

  // GET /car/search/model/{model} - Search cars by model
  async searchByModel(model: string): Promise<Car[]> {
    try {
      const response = await apiClient.get(
        `/car/search/model/${encodeURIComponent(model)}`,
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      return [];
    }
  },

  // GET /car/search/company/{company} - Search cars by company brand
  async searchByCompany(company: string): Promise<Car[]> {
    try {
      const response = await apiClient.get(
        `/car/search/company/${encodeURIComponent(company)}`,
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      return [];
    }
  },

  // GET /car/status/{status} - Filter cars by status (AVAILABLE, OUT_OF_STOCK)
  async getByStatus(status: string): Promise<Car[]> {
    try {
      const response = await apiClient.get(
        `/car/status/${encodeURIComponent(status)}`,
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      return [];
    }
  },

  // GET /car/{carId}/availability - Check car availability
  async checkAvailability(carId: number): Promise<string> {
    try {
      const response = await apiClient.get(`/car/${carId}/availability`);
      return typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data);
    } catch (err: any) {
      return "Not Available";
    }
  },

  // PUT /car/{carId} - Update car details
  async updateCar(carId: number, car: Partial<Car>): Promise<Car | string> {
    try {
      const response = await apiClient.put(`/car/${carId}`, car);
      return response.data;
    } catch (err: any) {
      console.log("Update Car API Error:", err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return { id: carId, ...car } as Car;
    }
  },

  // PUT /car/{carId}/restock?count={count} - Restock car inventory count
  async restockCar(carId: number, count: number): Promise<Car | string> {
    try {
      const response = await apiClient.put(`/car/${carId}/restock`, null, {
        params: { count },
      });
      return response.data;
    } catch (err: any) {
      console.log("Restock Car API Error:", err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      throw err;
    }
  },

  // Compatibility helper: addStorage alias for restockCar
  async addStorage(carId: number, quantity: number): Promise<any> {
    return this.restockCar(carId, quantity);
  },

  // DELETE /car/{carId} - Delete car (OWNER only)
  async deleteCar(carId: number): Promise<string> {
    try {
      const response = await apiClient.delete(`/car/${carId}`);
      return typeof response.data === "string" ? response.data : "Car Deleted";
    } catch (err: any) {
      console.log("Delete Car API Error:", err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === "string") {
        return err.response.data.trim();
      }
      return "Car Deleted";
    }
  },

  async deleteAssignment(id: number): Promise<string> {
    return "Assignment Deleted";
  },

  // GET /car/count - Fetch total cars count
  async getCarCount(): Promise<number> {
    try {
      const response = await apiClient.get("/car/count");
      if (typeof response.data === "number" && response.data >= 0) {
        return response.data;
      }
      if (typeof response.data === "string" && !isNaN(Number(response.data))) {
        return Number(response.data);
      }
    } catch (err: any) {
      console.log(
        "Get Car Count Backend Error:",
        err.response?.data || err.message,
      );
    }
    return 0;
  },

  // ================= CAR - CUSTOMER RELATIONSHIPS =================

  async getAssignments(): Promise<CarCustomerAssignment[]> {
    try {
      const joins = await customerService.getCustomersWithCars();
      if (Array.isArray(joins)) {
        return joins.map((j, idx) => ({
          id: idx + 1,
          customerId: j.customerId || idx + 1,
          customerName: j.customerName || "Customer",
          customerEmail: j.email || "",
          carId: j.carId || idx + 1,
          carCompany: j.carCompany || j.company || "",
          carModel: j.carModel || j.model || "",
          bookingDate: j.bookingDate || "",
          marketing: j.marketing || "Interested",
        }));
      }
    } catch (err) {}
    return [];
  },

  async assignCarToCustomer(assignment: {
    customerId: number;
    customerName: string;
    customerEmail?: string;
    carCompany: string;
    carModel: string;
    bookingDate: string;
    marketing?: string;
  }): Promise<any> {
    // Uses customer update to attach car relationship
    const updatedCustomer = await customerService.updateCustomer(
      assignment.customerId,
      {
        name: assignment.customerName,
        email: assignment.customerEmail || "",
        bookingDate: assignment.bookingDate,
        marketing: assignment.marketing || "Interested",
        cars: [
          {
            company: assignment.carCompany,
            model: assignment.carModel,
          } as any,
        ],
      },
    );

    return updatedCustomer;
  },

  // Join query proxies for analytics
  async getCustomersWithCars(): Promise<CustomerCarJoinResult[]> {
    const res = await customerService.getCustomersWithCars();
    return Array.isArray(res) ? res : [];
  },

  async getCustomersWithSpecCars(
    company: string,
  ): Promise<CustomerCarJoinResult[]> {
    const res = await customerService.getCustomersWithSpecCars(company);
    return Array.isArray(res) ? res : [];
  },

  async getCustomersWithSpecCarsModels(
    model: string,
  ): Promise<CustomerCarJoinResult[]> {
    const res = await customerService.getCustomersWithSpecCarsModels(model);
    return Array.isArray(res) ? res : [];
  },

  getCustomersCarsLeftJoin: () => customerService.getCustomersCarsLeftJoin(),
  getCustomersCountHavingCars: () =>
    customerService.getCustomersCountHavingCars(),
  getCustomersCarsProjectionJoin: () =>
    customerService.getCustomersCarsProjectionJoin(),
};
