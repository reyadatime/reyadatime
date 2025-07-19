export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          user_id: string;
          facility_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          total_price: number;
          status: 'pending' | 'confirmed' | 'cancelled_by_user' | 'cancelled_by_facility';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          facility_id: string;
          booking_date: string;
          start_time: string;
          end_time: string;
          total_price: number;
          status?: 'pending' | 'confirmed' | 'cancelled_by_user' | 'cancelled_by_facility';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          facility_id?: string;
          booking_date?: string;
          start_time?: string;
          end_time?: string;
          total_price?: number;
          status?: 'pending' | 'confirmed' | 'cancelled_by_user' | 'cancelled_by_facility';
          created_at?: string;
          updated_at?: string;
        };
      };
      facilities: {
        Row: {
          id: string;
          facility_name_en: string;
          facility_name_ar: string;
          facility_description_en: string;
          facility_description_ar: string;
          owner_id: string;
          facility_type: string;
          address_en: string;
          address_ar: string;
          country_id: number;
          city_id: number;
          location: { latitude: number; longitude: number };
          sport_types: Json[];
          amenities_en: string[];
          amenities_ar: string[];
          rules_en: string[];
          rules_ar: string[];
          verification_status: 'pending' | 'approved' | 'rejected';
          is_active: boolean;
          is_featured: boolean;
          featured_until: string | null;
          featured_priority: number | null;
          rating: number;
          review_count: number;
          currency: string;
          created_at: string;
          updated_at: string;
          images: string[];
        };
        Insert: {
          id?: string;
          facility_name_en: string;
          facility_name_ar: string;
          facility_description_en: string;
          facility_description_ar: string;
          owner_id: string;
          facility_type: string;
          address_en: string;
          address_ar: string;
          country_id: number;
          city_id: number;
          location: { latitude: number; longitude: number };
          sport_types: Json[];
          amenities_en: string[];
          amenities_ar: string[];
          rules_en: string[];
          rules_ar: string[];
          verification_status?: 'pending' | 'approved' | 'rejected';
          is_active?: boolean;
          is_featured?: boolean;
          featured_until?: string | null;
          featured_priority?: number | null;
          rating?: number;
          review_count?: number;
          currency: string;
          created_at?: string;
          updated_at?: string;
          images: string[];
        };
        Update: {
          id?: string;
          facility_name_en?: string;
          facility_name_ar?: string;
          facility_description_en?: string;
          facility_description_ar?: string;
          owner_id?: string;
          facility_type?: string;
          address_en?: string;
          address_ar?: string;
          country_id?: number;
          city_id?: number;
          location?: { latitude: number; longitude: number };
          sport_types?: Json[];
          amenities_en?: string[];
          amenities_ar?: string[];
          rules_en?: string[];
          rules_ar?: string[];
          verification_status?: 'pending' | 'approved' | 'rejected';
          is_active?: boolean;
          is_featured?: boolean;
          featured_until?: string | null;
          featured_priority?: number | null;
          rating?: number;
          review_count?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
          images?: string[];
        };
      };
    };
  };
}