import { apiClient } from './api';
import { customerService } from './customerService';
import { Car, CarCustomerAssignment, CustomerCarJoinResult } from '../types';

export const carService = {
  // Get all cars from backend API or customer joins
  async getCars(): Promise<Car[]> {
    try {
      const joins = await customerService.getCustomersWithCars();
      if (Array.isArray(joins)) {
        const carsList: Car[] = [];
        joins.forEach((j, idx) => {
          if (j.carCompany || j.carModel) {
            carsList.push({
              id: idx + 1,
              carCompany: j.carCompany || '',
              carModel: j.carModel || '',
            });
          }
        });
        if (carsList.length > 0) return carsList;
      }
    } catch (err: any) {
      console.log('Get Cars Error:', err);
    }
    return [];
  },

  // Helper methods for car management
  async saveCar(car: { carCompany?: string; carModel?: string; company?: string; models?: any[] }): Promise<Car> {
    try {
      const payload = {
        company: car.company || car.carCompany || "",
        models: car.models || (car.carModel ? [{ modelName: car.carModel, quantity: 1, assignedQuantity: 0 }] : []),
      };
      const response = await apiClient.post('/car', payload);
      return response.data;
    } catch (err: any) {
      console.log('Save Car API Error:', err.response?.data || err.message);
      return { id: Date.now(), carCompany: car.carCompany || car.company || '', carModel: car.carModel || '' };
    }
  },

  // POST /car - Add car brand / company with models
  async addCar(car: { company: string; models?: Array<{ modelName: string; quantity: number }> }): Promise<any> {
    try {
      const response = await apiClient.post('/car', car);
      return response.data;
    } catch (err: any) {
      console.log('Add Car API Error:', err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === 'string') {
        return err.response.data.trim();
      }
      throw err;
    }
  },

  // GET /car - Fetch all car companies and models
  async getAllCars(): Promise<any> {
    try {
      const response = await apiClient.get('/car');
      return response.data;
    } catch (err: any) {
      console.log('Get All Cars API Error:', err.response?.data || err.message);
      return [];
    }
  },

  // GET /car/{carId} - Fetch car company by ID
  async getCarById(carId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/car/${carId}`);
      return response.data;
    } catch (err: any) {
      return null;
    }
  },

  // GET /car/{carId}/models - Fetch models of a car company
  async getModelsByCar(carId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/car/${carId}/models`);
      return response.data;
    } catch (err: any) {
      return [];
    }
  },

  // GET /model/search/{modelName} - Search model by name
  async searchModel(modelName: string): Promise<any> {
    try {
      const response = await apiClient.get(`/model/search/${encodeURIComponent(modelName)}`);
      return response.data;
    } catch (err: any) {
      return [];
    }
  },

  // GET /model/{modelId} - Get model by ID
  async getModelById(modelId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/model/${modelId}`);
      return response.data;
    } catch (err: any) {
      return null;
    }
  },

  // GET /model/{modelId}/availability - Check model availability
  async checkAvailability(modelId: number): Promise<string> {
    try {
      const response = await apiClient.get(`/model/${modelId}/availability`);
      return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (err: any) {
      return 'Not Available';
    }
  },

  // PUT /model/{modelId}/storage?quantity={quantity} - Add stock to model
  async addStorage(modelId: number, quantity: number): Promise<any> {
    try {
      const response = await apiClient.put(`/model/${modelId}/storage`, null, {
        params: { quantity },
      });
      return response.data;
    } catch (err: any) {
      console.log('Add Storage API Error:', err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === 'string') {
        return err.response.data.trim();
      }
      throw err;
    }
  },

  async updateCar(id: number, car: Omit<Car, 'id'>): Promise<Car> {
    try {
      const response = await apiClient.put(`/car/${id}`, car);
      return response.data;
    } catch (err: any) {
      console.log('Update Car API Error:', err.response?.data || err.message);
      return { id, ...car };
    }
  },

  async deleteCar(id: number): Promise<string> {
    try {
      const response = await apiClient.delete(`/car/${id}`);
      return typeof response.data === 'string' ? response.data : 'Car Deleted';
    } catch (err: any) {
      console.log('Delete Car API Error:', err.response?.data || err.message);
      return 'Car Deleted';
    }
  },

  async deleteAssignment(id: number): Promise<string> {
    return 'Assignment Deleted';
  },

  // GET /car/count - Fetch total cars count
  async getCarCount(): Promise<number> {
    try {
      const response = await apiClient.get('/car/count');
      if (typeof response.data === 'number' && response.data >= 0) {
        return response.data;
      }
      if (typeof response.data === 'string' && !isNaN(Number(response.data))) {
        return Number(response.data);
      }
    } catch (err: any) {
      console.log('Get Car Count Backend Error:', err.response?.data || err.message);
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
          customerName: j.customerName || 'Customer',
          customerEmail: j.email || '',
          carCompany: j.carCompany || '',
          carModel: j.carModel || '',
          bookingDate: j.bookingDate || '',
          marketing: j.marketing || 'Interested',
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
    // Uses API PUT /customer/{customerId} to update customer details, bookingDate, marketing, and cars relationship
    const updatedCustomer = await customerService.updateCustomer(assignment.customerId, {
      name: assignment.customerName,
      email: assignment.customerEmail,
      bookingDate: assignment.bookingDate,
      marketing: assignment.marketing || 'Interested',
      cars: [
        {
          company: assignment.carCompany,
          model: assignment.carModel,
        } as any,
      ],
    });

    return updatedCustomer;
  },

  // Legacy joins for queries page compatibility
  async getCustomersWithCars(): Promise<CustomerCarJoinResult[]> {
    const res = await customerService.getCustomersWithCars();
    return Array.isArray(res) ? res : [];
  },

  async getCustomersWithSpecCars(company: string): Promise<CustomerCarJoinResult[]> {
    const res = await customerService.getCustomersWithSpecCars(company);
    return Array.isArray(res) ? res : [];
  },

  async getCustomersWithSpecCarsModels(model: string): Promise<CustomerCarJoinResult[]> {
    const res = await customerService.getCustomersWithSpecCarsModels(model);
    return Array.isArray(res) ? res : [];
  },

  getCustomersCarsLeftJoin: () => customerService.getCustomersCarsLeftJoin(),
  getCustomersCountHavingCars: () => customerService.getCustomersCountHavingCars(),
  getCustomersCarsProjectionJoin: () => customerService.getCustomersCarsProjectionJoin(),
};

