import { API_ENDPOINTS } from '@/config/endpoints';
import { httpClient } from '@/utils/httpClient';
import type { ApiResponse } from '@/types/auth.types';

export interface SlotSize {
  id: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface SlotType {
  id: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityDate {
  id: string;
  physicianId: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  id: string;
  availabilityId: string;
  startTime: string;
  endTime: string;
  slotSizeId: string;
  createdAt: string;
  updatedAt: string;
  slotSize?: SlotSize;
  prices?: Array<SlotPrice & { slotType: SlotType }>;
  types?: SlotType[];
  isBooked?: boolean;
}

export interface SlotPrice {
  id: string;
  slotId: string;
  slotTypeId: string;
  price: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlotsRequest {
  date: string;
  slotSizeId: string;
  startTime: string;
  endTime: string;
  slotTypeIds: string[];
  prices: Array<{ slotTypeId: string; price: string }>;
}

export interface BookSlotRequest {
  slotId: string;
}

export interface UpdateSlotPriceRequest {
  price: string;
}

class BookingService {
  async getSlotSizes(): Promise<SlotSize[]> {
    const response = await httpClient.get<ApiResponse<{ sizes: SlotSize[] }>>(
      API_ENDPOINTS.BOOKING.SLOT_SIZES
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch slot sizes');
    }
    return response.data.sizes;
  }

  async getSlotTypes(): Promise<SlotType[]> {
    const response = await httpClient.get<ApiResponse<{ types: SlotType[] }>>(
      API_ENDPOINTS.BOOKING.SLOT_TYPES
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch slot types');
    }
    return response.data.types;
  }

  async getAvailabilityDates(): Promise<AvailabilityDate[]> {
    const response = await httpClient.get<ApiResponse<{ dates: AvailabilityDate[] }>>(
      API_ENDPOINTS.BOOKING.AVAILABILITY_DATES
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch availability dates');
    }
    return response.data.dates;
  }

  async createAvailabilityDate(date: string): Promise<AvailabilityDate> {
    const response = await httpClient.post<ApiResponse<{ availability: AvailabilityDate }>>(
      API_ENDPOINTS.BOOKING.AVAILABILITY_DATES,
      { date }
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create availability date');
    }
    return response.data.availability;
  }

  async getDatesWithAvailability(physicianId: string): Promise<string[]> {
    const response = await httpClient.get<ApiResponse<{ dates: string[] }>>(
      API_ENDPOINTS.BOOKING.DATES_WITH_AVAILABILITY(physicianId)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dates with availability');
    }
    return response.data.dates;
  }

  async createSlots(data: CreateSlotsRequest): Promise<Slot[]> {
    const response = await httpClient.post<ApiResponse<{ slots: Slot[] }>>(
      API_ENDPOINTS.BOOKING.CREATE_SLOTS,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create slots');
    }
    return response.data.slots;
  }

  async getSlotsForDate(physicianId: string, date: string): Promise<Slot[]> {
    const response = await httpClient.get<ApiResponse<{ slots: Slot[] }>>(
      `${API_ENDPOINTS.BOOKING.PHYSICIAN_SLOTS(physicianId)}?date=${date}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch slots');
    }
    return response.data.slots;
  }

  async getAvailableSlotsForDate(physicianId: string, date: string): Promise<Slot[]> {
    const response = await httpClient.get<ApiResponse<{ slots: Slot[] }>>(
      `${API_ENDPOINTS.BOOKING.AVAILABLE_SLOTS(physicianId)}?date=${date}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch available slots');
    }
    return response.data.slots;
  }

  async deleteSlot(slotId: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.BOOKING.DELETE_SLOT(slotId));
  }

  async updateSlotPrice(priceId: string, data: UpdateSlotPriceRequest): Promise<SlotPrice> {
    const response = await httpClient.patch<ApiResponse<{ price: SlotPrice }>>(
      API_ENDPOINTS.BOOKING.UPDATE_SLOT_PRICE(priceId),
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update slot price');
    }
    return response.data.price;
  }

  async bookSlot(data: BookSlotRequest): Promise<{ id: string; slotId: string; status: string }> {
    const response = await httpClient.post<ApiResponse<{ booking: any }>>(
      API_ENDPOINTS.BOOKING.BOOK_SLOT,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to book slot');
    }
    return response.data.booking;
  }
}

export const bookingService = new BookingService();

