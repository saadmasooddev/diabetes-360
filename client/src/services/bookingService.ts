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

export interface PhysicianLocation {
  id: string;
  physicianId: string;
  locationName: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude: string;
  longitude: string;
  status: 'active' | 'inactive';
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
  locations?: PhysicianLocation[];
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
  locationIds?: string[];
}

export interface BookingPriceCalculation {
  originalFee: string;
  discountedFee: string | null;
  finalPrice: string;
  isFree: boolean;
  isDiscounted: boolean;
  discountPercentage?: number;
}

export interface BookSlotRequest {
  slotId: string;
  slotTypeId: string;
}

export interface UpdateSlotLocationsRequest {
  locationIds: string[];
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

  async getPhysicianDatesWithSlots(params: {
    physicianId: string;
    month: number;
    year: number;
    isCount: boolean;
    selectedDate: string;
  }): Promise<{
    dates: Array<{ date: string; count: number }>;
    slots: Slot[];
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('month', params.month.toString());
    queryParams.append('year', params.year.toString());
    queryParams.append('isCount', params.isCount.toString());
    queryParams.append('selectedDate', params.selectedDate);

    const response = await httpClient.get<ApiResponse<{
      dates: Array<{ date: string; count: number }>;
      slots: Slot[];
    }>>(`${API_ENDPOINTS.BOOKING.PHYSICIAN_DATES(params.physicianId)}?${queryParams.toString()}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch physician dates and slots');
    }
    return response.data;
  }

  async deleteSlot(slotId: string): Promise<void> {
    await httpClient.delete(API_ENDPOINTS.BOOKING.DELETE_SLOT(slotId));
  }

  async calculateBookingPrice(physicianId: string): Promise<BookingPriceCalculation> {
    const response = await httpClient.get<ApiResponse<{ price: BookingPriceCalculation }>>(
      API_ENDPOINTS.BOOKING.CALCULATE_BOOKING_PRICE(physicianId)
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to calculate booking price');
    }
    return response.data.price;
  }

  async updateSlotLocations(slotId: string, data: UpdateSlotLocationsRequest): Promise<PhysicianLocation[]> {
    const response = await httpClient.patch<ApiResponse<{ locations: PhysicianLocation[] }>>(
      API_ENDPOINTS.BOOKING.UPDATE_SLOT_LOCATIONS(slotId),
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update slot locations');
    }
    return response.data.locations;
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

  async getMyConsultations(params: {
    type?: 'upcoming' | 'past';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    consultations: Array<{
      id: string;
      customerId: string;
      slotId: string;
      slotTypeId: string;
      status: string;
      summary?: string | null;
      isAttended: boolean;
      createdAt: string;
      updatedAt: string;
      slot: {
        id: string;
        startTime: string;
        endTime: string;
        slotSize: number;
        slotType: {
          id: string;
          type: string;
        };
        availability: {
          id: string;
          physicianId: string;
          date: string;
        };
        physician: {
          id: string;
          firstName: string;
          lastName: string;
          specialty?: string;
          imageUrl?: string | null;
          rating: number;
        };
        location?: {
          locationName: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          postalCode?: string | null;
        } | null;
      };
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await httpClient.get<ApiResponse<{
      consultations: any[];
      total: number;
      page: number;
      limit: number;
    }>>(`${API_ENDPOINTS.BOOKING.MY_CONSULTATIONS}?${queryParams.toString()}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch consultations');
    }
    return response.data;
  }

  async markConsultationAttended(bookingId: string): Promise<void> {
    const response = await httpClient.patch<ApiResponse<{}>>(
      API_ENDPOINTS.BOOKING.MARK_ATTENDED(bookingId)
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark consultation as attended');
    }
  }

  async getAppointments(params: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    appointments: Array<{
      id: string;
      time: string;
      date: string;
      patientName: string;
      type: string;
      doctorName: string;
      status: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.startDate) queryParams.append('startDate', params.startDate );
    if (params.endDate) queryParams.append('endDate', params.endDate );

    const response = await httpClient.get<ApiResponse<{
      appointments: Array<{
        id: string;
        time: string;
        date: string;
        patientName: string;
        type: string;
        doctorName: string;
        status: string;
      }>;
      total: number;
      page: number;
      limit: number;
    }>>(`${API_ENDPOINTS.BOOKING.APPOINTMENTS}?${queryParams.toString()}`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch appointments');
    }
    return response.data;
  }

  async getDatesWithBookings(month: number, year: number): Promise<string[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('month', month.toString());
    queryParams.append('year', year.toString());

    const response = await httpClient.get<ApiResponse<{ dates: string[] }>>(
      `${API_ENDPOINTS.BOOKING.DATES_WITH_BOOKINGS}?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dates with bookings');
    }
    return response.data.dates;
  }

  async generateSlotsForDay(data: {
    physicianId?: string;
    date: string;
    slotSizeId: string;
  }): Promise<{
    availableSlots: Array<{ start: string; end: string }>;
    existingSlots: Slot[];
    conflicts: Array<{ start: string; end: string }>;
  }> {
    const response = await httpClient.post<ApiResponse<{
      availableSlots: Array<{ start: string; end: string }>;
      existingSlots: Slot[];
      conflicts: Array<{ start: string; end: string }>;
    }>>(API_ENDPOINTS.BOOKING.GENERATE_SLOTS_FOR_DAY, data);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to generate slots');
    }
    return response.data;
  }

  async createSlotsForDay(data: {
    physicianId?: string;
    date: string;
    slotSizeId: string;
    slotTypeIds: string[];
    locationIds?: string[];
  }): Promise<Slot[]> {
    const response = await httpClient.post<ApiResponse<{ slots: Slot[] }>>(
      API_ENDPOINTS.BOOKING.CREATE_SLOTS_FOR_DAY,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create slots');
    }
    return response.data.slots;
  }

  async bulkDeleteSlots(data: {
    physicianId?: string;
    slotIds: string[];
  }): Promise<{
    deleted: string[];
    failed: Array<{ slotId: string; reason: string }>;
  }> {
    const response = await httpClient.post<ApiResponse<{
      deleted: string[];
      failed: Array<{ slotId: string; reason: string }>;
    }>>(API_ENDPOINTS.BOOKING.BULK_DELETE_SLOTS, data);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to delete slots');
    }
    return response.data;
  }
}

export const bookingService = new BookingService();

