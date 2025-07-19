export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone_number: string;
  profile_image_url?: string;
  country_id: number | null;
  city_id: number | null;
  role: 'user' | 'facility_owner' | 'admin' | 'super_admin';
  created_at: string;
  last_login_at?: string;
  is_active: boolean;
  preferences?: any;
}

export interface Equipment {
  id: string;
  name_en: string;
  name_ar: string;
  quantity: number;
}

export interface SportFacility {
  equipment: Equipment[];
  dimensions: {
    width: number;
    length: number;
  };
  surface_type_en: string;
  surface_type_ar: string;
  custom_surface_type_en?: string;
  custom_surface_type_ar?: string;
  max_capacity: number;
  field_type: '' | 'indoor' | 'outdoor' | 'other';
  custom_field_type_en?: string;
  custom_field_type_ar?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  price: number;
}

export interface DayPricing {
  isWeekend: boolean;
  timeSlots: TimeSlot[];
}

export interface SportPricing {
  sunday: DayPricing;
  monday: DayPricing;
  tuesday: DayPricing;
  wednesday: DayPricing;
  thursday: DayPricing;
  friday: DayPricing;
  saturday: DayPricing;
}

export interface SportType {
  id: string;
  name_en: string;
  name_ar: string;
  pricing: SportPricing;
  facility: SportFacility;
}

export interface DaySchedule {
  open: string;
  close: string;
  isWeekend: boolean;
}

export interface OpeningHours {
  saturday: DaySchedule;
  sunday: DaySchedule;
  monday: DaySchedule;  
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
}

export interface BilingualItem {
  id: string;
  name_en: string;
  name_ar: string;
}

export interface CancellationPolicy {
  hours: number;
  refund_percentage: number;
}

import { Database } from './supabase';

export type Facility = Database['public']['Tables']['facilities']['Row'] & {
  name_en?: string; // Alias for facility_name_en
  name_ar?: string; // Alias for facility_name_ar
  price_per_hour?: number; // For backward compatibility
};

export interface Booking {
  id: string;
  user_id: string;
  facility_id: string;
  booking_date: string;
  time_slot: string;
  duration_minutes: number;
  number_of_players: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled_by_user' | 'cancelled_by_facility';
  payment_status: 'pending' | 'completed' | 'refunded';
  payment_method?: string;
  payment_id?: string;
  promo_code?: string;
  discount_amount?: number;
  booking_details?: any;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  facility_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: number;
  name_en: string;
  name_ar: string;
  code: string;
  flag_url?: string;
  is_active: boolean;
}

export interface City {
  id: number;
  country_id: number;
  name_en: string;
  name_ar: string;
  is_active: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  user_id?: string;
  country_id?: number;
  status: 'read' | 'unread';
  created_at: string;
  updated_at: string;
}
