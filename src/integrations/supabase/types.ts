export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accommodation_bookings: {
        Row: {
          accommodation_id: string
          cancelled_at: string | null
          channel: string
          checkin_date: string
          checkout_date: string
          created_at: string
          currency: string
          guest_email: string | null
          guest_name: string
          guest_phone: string | null
          guests_count: number
          id: string
          notes: string | null
          partner_id: string
          status: string
          total_amount: number
          total_nights: number
          updated_at: string
        }
        Insert: {
          accommodation_id: string
          cancelled_at?: string | null
          channel?: string
          checkin_date: string
          checkout_date: string
          created_at?: string
          currency?: string
          guest_email?: string | null
          guest_name: string
          guest_phone?: string | null
          guests_count?: number
          id?: string
          notes?: string | null
          partner_id: string
          status?: string
          total_amount?: number
          total_nights?: number
          updated_at?: string
        }
        Update: {
          accommodation_id?: string
          cancelled_at?: string | null
          channel?: string
          checkin_date?: string
          checkout_date?: string
          created_at?: string
          currency?: string
          guest_email?: string | null
          guest_name?: string
          guest_phone?: string | null
          guests_count?: number
          id?: string
          notes?: string | null
          partner_id?: string
          status?: string
          total_amount?: number
          total_nights?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_bookings_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_calendar: {
        Row: {
          accommodation_id: string
          booking_id: string | null
          created_at: string
          date: string
          id: string
          note: string | null
          partner_id: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          accommodation_id: string
          booking_id?: string | null
          created_at?: string
          date: string
          id?: string
          note?: string | null
          partner_id: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accommodation_id?: string
          booking_id?: string | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          partner_id?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_calendar_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_calendar_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_ical_imports: {
        Row: {
          accommodation_id: string
          created_at: string
          ical_url: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          partner_id: string
          platform_name: string
          updated_at: string
        }
        Insert: {
          accommodation_id: string
          created_at?: string
          ical_url: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          partner_id: string
          platform_name?: string
          updated_at?: string
        }
        Update: {
          accommodation_id?: string
          created_at?: string
          ical_url?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          partner_id?: string
          platform_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_ical_imports_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_ical_imports_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodation_images: {
        Row: {
          accommodation_id: string
          created_at: string
          display_order: number
          file_path: string | null
          id: string
          image_url: string
          partner_id: string
        }
        Insert: {
          accommodation_id: string
          created_at?: string
          display_order?: number
          file_path?: string | null
          id?: string
          image_url: string
          partner_id: string
        }
        Update: {
          accommodation_id?: string
          created_at?: string
          display_order?: number
          file_path?: string | null
          id?: string
          image_url?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodation_images_accommodation_id_fkey"
            columns: ["accommodation_id"]
            isOneToOne: false
            referencedRelation: "accommodations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accommodation_images_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      accommodations: {
        Row: {
          address: string | null
          amenities: Json | null
          bathrooms: number
          bedrooms: number
          capacity: number
          checkin_time: string | null
          checkout_time: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          description: string | null
          ical_token: string
          id: string
          latitude: number | null
          longitude: number | null
          minimum_nights: number
          name: string
          partner_id: string
          price_per_night: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          bathrooms?: number
          bedrooms?: number
          capacity?: number
          checkin_time?: string | null
          checkout_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          ical_token?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          minimum_nights?: number
          name: string
          partner_id: string
          price_per_night?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          bathrooms?: number
          bedrooms?: number
          capacity?: number
          checkin_time?: string | null
          checkout_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          ical_token?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          minimum_nights?: number
          name?: string
          partner_id?: string
          price_per_night?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accommodations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_availability_days: {
        Row: {
          capacity_override: number | null
          created_at: string
          date: string
          id: string
          note: string | null
          partner_id: string
          product_id: string
          status: Database["public"]["Enums"]["availability_status"]
          updated_at: string
        }
        Insert: {
          capacity_override?: number | null
          created_at?: string
          date: string
          id?: string
          note?: string | null
          partner_id: string
          product_id: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Update: {
          capacity_override?: number | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          partner_id?: string
          product_id?: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_availability_days_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_availability_days_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_availability_slots: {
        Row: {
          capacity_override: number | null
          created_at: string
          date: string
          id: string
          partner_id: string
          product_id: string
          slot_time: string
          status: Database["public"]["Enums"]["availability_status"]
          updated_at: string
        }
        Insert: {
          capacity_override?: number | null
          created_at?: string
          date: string
          id?: string
          partner_id: string
          product_id: string
          slot_time: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Update: {
          capacity_override?: number | null
          created_at?: string
          date?: string
          id?: string
          partner_id?: string
          product_id?: string
          slot_time?: string
          status?: Database["public"]["Enums"]["availability_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_availability_slots_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_availability_slots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_blackout_ranges: {
        Row: {
          created_at: string
          end_date: string
          id: string
          partner_id: string
          product_id: string
          reason: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          partner_id: string
          product_id: string
          reason?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          partner_id?: string
          product_id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_blackout_ranges_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_blackout_ranges_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_booking_participants: {
        Row: {
          age: number | null
          booking_id: string
          created_at: string
          custom_fields: Json | null
          id: string
          name: string | null
          phone: string | null
        }
        Insert: {
          age?: number | null
          booking_id: string
          created_at?: string
          custom_fields?: Json | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Update: {
          age?: number | null
          booking_id?: string
          created_at?: string
          custom_fields?: Json | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_booking_participants_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "activity_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_bookings: {
        Row: {
          booking_date: string
          cancelled_at: string | null
          created_at: string
          currency: string
          customer: Json | null
          expires_at: string
          guest_data: Json | null
          id: string
          line_items: Json
          partner_id: string
          product_id: string
          slot_time: string | null
          status: Database["public"]["Enums"]["activity_booking_status"]
          subtotal_amount: number
          total_qty: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_date: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer?: Json | null
          expires_at?: string
          guest_data?: Json | null
          id?: string
          line_items?: Json
          partner_id: string
          product_id: string
          slot_time?: string | null
          status?: Database["public"]["Enums"]["activity_booking_status"]
          subtotal_amount?: number
          total_qty?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer?: Json | null
          expires_at?: string
          guest_data?: Json | null
          id?: string
          line_items?: Json
          partner_id?: string
          product_id?: string
          slot_time?: string | null
          status?: Database["public"]["Enums"]["activity_booking_status"]
          subtotal_amount?: number
          total_qty?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_bookings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          partner_id: string
          status: Database["public"]["Enums"]["route_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          partner_id: string
          status?: Database["public"]["Enums"]["route_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          partner_id?: string
          status?: Database["public"]["Enums"]["route_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_categories_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_checkin_events: {
        Row: {
          id: string
          partner_id: string
          result: string
          scanned_at: string
          scanned_by_user_id: string
          ticket_id: string
        }
        Insert: {
          id?: string
          partner_id: string
          result: string
          scanned_at?: string
          scanned_by_user_id: string
          ticket_id: string
        }
        Update: {
          id?: string
          partner_id?: string
          result?: string
          scanned_at?: string
          scanned_by_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_checkin_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_checkin_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "activity_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_partner_invoices: {
        Row: {
          billing_details: Json | null
          commission_amount: number
          created_at: string
          currency: string
          due_date: string | null
          gross_revenue: number
          id: string
          invoice_number: string
          issue_date: string
          net_amount: number
          partner_id: string
          payout_id: string
          status: Database["public"]["Enums"]["activity_invoice_status"]
          updated_at: string
        }
        Insert: {
          billing_details?: Json | null
          commission_amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          gross_revenue?: number
          id?: string
          invoice_number: string
          issue_date?: string
          net_amount?: number
          partner_id: string
          payout_id: string
          status?: Database["public"]["Enums"]["activity_invoice_status"]
          updated_at?: string
        }
        Update: {
          billing_details?: Json | null
          commission_amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          gross_revenue?: number
          id?: string
          invoice_number?: string
          issue_date?: string
          net_amount?: number
          partner_id?: string
          payout_id?: string
          status?: Database["public"]["Enums"]["activity_invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_partner_invoices_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_partner_invoices_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: true
            referencedRelation: "activity_partner_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_partner_payouts: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          currency: string
          gross_revenue: number
          id: string
          net_amount: number
          paid_at: string | null
          partner_id: string
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["activity_payout_status"]
          updated_at: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          gross_revenue?: number
          id?: string
          net_amount?: number
          paid_at?: string | null
          partner_id: string
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["activity_payout_status"]
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          gross_revenue?: number
          id?: string
          net_amount?: number
          paid_at?: string | null
          partner_id?: string
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["activity_payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_partner_product_commissions: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          partner_id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          commission_rate: number
          created_at?: string
          id?: string
          partner_id: string
          product_id: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          partner_id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_partner_product_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_partner_product_commissions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_pricing: {
        Row: {
          created_at: string
          id: string
          max_age: number | null
          min_age: number | null
          partner_id: string
          price: number
          product_id: string
          status: Database["public"]["Enums"]["route_status"]
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_age?: number | null
          min_age?: number | null
          partner_id: string
          price?: number
          product_id: string
          status?: Database["public"]["Enums"]["route_status"]
          tier_name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_age?: number | null
          min_age?: number | null
          partner_id?: string
          price?: number
          product_id?: string
          status?: Database["public"]["Enums"]["route_status"]
          tier_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_pricing_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_product_images: {
        Row: {
          created_at: string
          display_order: number
          file_path: string | null
          id: string
          image_url: string
          partner_id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          file_path?: string | null
          id?: string
          image_url: string
          partner_id: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          file_path?: string | null
          id?: string
          image_url?: string
          partner_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_product_images_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_products: {
        Row: {
          category_id: string | null
          created_at: string
          default_capacity: number | null
          full_description: string | null
          generate_qr_tickets: boolean | null
          guest_form_apply_to:
            | Database["public"]["Enums"]["guest_form_apply_type"]
            | null
          guest_form_config: Json | null
          guest_form_enabled: boolean | null
          highlights: string[] | null
          id: string
          inventory_count: number | null
          language: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          name: string
          partner_id: string
          product_type: Database["public"]["Enums"]["activity_product_type"]
          short_description: string | null
          status: Database["public"]["Enums"]["activity_product_status"]
          updated_at: string
          voucher_type: Database["public"]["Enums"]["activity_voucher_type"]
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          default_capacity?: number | null
          full_description?: string | null
          generate_qr_tickets?: boolean | null
          guest_form_apply_to?:
            | Database["public"]["Enums"]["guest_form_apply_type"]
            | null
          guest_form_config?: Json | null
          guest_form_enabled?: boolean | null
          highlights?: string[] | null
          id?: string
          inventory_count?: number | null
          language?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          name: string
          partner_id: string
          product_type: Database["public"]["Enums"]["activity_product_type"]
          short_description?: string | null
          status?: Database["public"]["Enums"]["activity_product_status"]
          updated_at?: string
          voucher_type?: Database["public"]["Enums"]["activity_voucher_type"]
        }
        Update: {
          category_id?: string | null
          created_at?: string
          default_capacity?: number | null
          full_description?: string | null
          generate_qr_tickets?: boolean | null
          guest_form_apply_to?:
            | Database["public"]["Enums"]["guest_form_apply_type"]
            | null
          guest_form_config?: Json | null
          guest_form_enabled?: boolean | null
          highlights?: string[] | null
          id?: string
          inventory_count?: number | null
          language?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          name?: string
          partner_id?: string
          product_type?: Database["public"]["Enums"]["activity_product_type"]
          short_description?: string | null
          status?: Database["public"]["Enums"]["activity_product_status"]
          updated_at?: string
          voucher_type?: Database["public"]["Enums"]["activity_voucher_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activity_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_products_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_rental_options: {
        Row: {
          created_at: string
          duration_unit: Database["public"]["Enums"]["duration_unit"]
          duration_value: number
          id: string
          partner_id: string
          price: number
          product_id: string
          status: Database["public"]["Enums"]["route_status"]
        }
        Insert: {
          created_at?: string
          duration_unit?: Database["public"]["Enums"]["duration_unit"]
          duration_value?: number
          id?: string
          partner_id: string
          price?: number
          product_id: string
          status?: Database["public"]["Enums"]["route_status"]
        }
        Update: {
          created_at?: string
          duration_unit?: Database["public"]["Enums"]["duration_unit"]
          duration_value?: number
          id?: string
          partner_id?: string
          price?: number
          product_id?: string
          status?: Database["public"]["Enums"]["route_status"]
        }
        Relationships: [
          {
            foreignKeyName: "activity_rental_options_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_rental_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_settings: {
        Row: {
          default_commission_rate: number
          id: number
          updated_at: string
        }
        Insert: {
          default_commission_rate?: number
          id?: number
          updated_at?: string
        }
        Update: {
          default_commission_rate?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      activity_tickets: {
        Row: {
          booking_id: string
          created_at: string
          expires_at: string | null
          id: string
          participant_index: number
          partner_id: string
          product_id: string
          qr_token: string
          status: string
          used_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          participant_index?: number
          partner_id: string
          product_id: string
          qr_token?: string
          status?: string
          used_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          participant_index?: number
          partner_id?: string
          product_id?: string
          qr_token?: string
          status?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "activity_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_tickets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_time_slots: {
        Row: {
          capacity: number
          created_at: string
          id: string
          partner_id: string
          product_id: string
          slot_time: string
          status: Database["public"]["Enums"]["route_status"]
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          partner_id: string
          product_id: string
          slot_time: string
          status?: Database["public"]["Enums"]["route_status"]
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          partner_id?: string
          product_id?: string
          slot_time?: string
          status?: Database["public"]["Enums"]["route_status"]
        }
        Relationships: [
          {
            foreignKeyName: "activity_time_slots_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_time_slots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "activity_products"
            referencedColumns: ["id"]
          },
        ]
      }
      addons: {
        Row: {
          applicability: Database["public"]["Enums"]["addon_applicability"]
          applicable_route_ids: string[] | null
          applicable_schedule_ids: string[] | null
          applicable_trip_ids: string[] | null
          created_at: string
          description: string | null
          enable_pickup_zones: boolean | null
          id: string
          is_mandatory: boolean | null
          name: string
          partner_id: string
          pickup_required_info: Json | null
          price: number
          pricing_model: Database["public"]["Enums"]["addon_pricing_model"]
          status: Database["public"]["Enums"]["route_status"]
          type: Database["public"]["Enums"]["addon_type"]
          updated_at: string
        }
        Insert: {
          applicability?: Database["public"]["Enums"]["addon_applicability"]
          applicable_route_ids?: string[] | null
          applicable_schedule_ids?: string[] | null
          applicable_trip_ids?: string[] | null
          created_at?: string
          description?: string | null
          enable_pickup_zones?: boolean | null
          id?: string
          is_mandatory?: boolean | null
          name: string
          partner_id: string
          pickup_required_info?: Json | null
          price?: number
          pricing_model?: Database["public"]["Enums"]["addon_pricing_model"]
          status?: Database["public"]["Enums"]["route_status"]
          type?: Database["public"]["Enums"]["addon_type"]
          updated_at?: string
        }
        Update: {
          applicability?: Database["public"]["Enums"]["addon_applicability"]
          applicable_route_ids?: string[] | null
          applicable_schedule_ids?: string[] | null
          applicable_trip_ids?: string[] | null
          created_at?: string
          description?: string | null
          enable_pickup_zones?: boolean | null
          id?: string
          is_mandatory?: boolean | null
          name?: string
          partner_id?: string
          pickup_required_info?: Json | null
          price?: number
          pricing_model?: Database["public"]["Enums"]["addon_pricing_model"]
          status?: Database["public"]["Enums"]["route_status"]
          type?: Database["public"]["Enums"]["addon_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          partner_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          partner_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      boat_facilities: {
        Row: {
          boat_id: string
          created_at: string
          facility_id: string
          id: string
          is_free: boolean
        }
        Insert: {
          boat_id: string
          created_at?: string
          facility_id: string
          id?: string
          is_free?: boolean
        }
        Update: {
          boat_id?: string
          created_at?: string
          facility_id?: string
          id?: string
          is_free?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "boat_facilities_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boat_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      boats: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          name: string
          partner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name: string
          partner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name?: string
          partner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boats_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_addons: {
        Row: {
          addon_id: string | null
          booking_id: string
          created_at: string
          id: string
          name: string
          pickup_info: Json | null
          pickup_zone_id: string | null
          price: number
          qty: number
          total: number
        }
        Insert: {
          addon_id?: string | null
          booking_id: string
          created_at?: string
          id?: string
          name: string
          pickup_info?: Json | null
          pickup_zone_id?: string | null
          price: number
          qty?: number
          total: number
        }
        Update: {
          addon_id?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          name?: string
          pickup_info?: Json | null
          pickup_zone_id?: string | null
          price?: number
          qty?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_addons_pickup_zone_id_fkey"
            columns: ["pickup_zone_id"]
            isOneToOne: false
            referencedRelation: "pickup_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          channel: Database["public"]["Enums"]["booking_channel"]
          created_at: string
          created_by_user_id: string | null
          currency: string
          customer_id: string
          departure_id: string
          discount_amount: number
          id: string
          notes_internal: string | null
          partner_id: string
          pax_adult: number
          pax_child: number
          return_departure_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["booking_channel"]
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          customer_id: string
          departure_id: string
          discount_amount?: number
          id?: string
          notes_internal?: string | null
          partner_id: string
          pax_adult?: number
          pax_child?: number
          return_departure_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_amount: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["booking_channel"]
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          customer_id?: string
          departure_id?: string
          discount_amount?: number
          id?: string
          notes_internal?: string | null
          partner_id?: string
          pax_adult?: number
          pax_child?: number
          return_departure_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_return_departure_id_fkey"
            columns: ["return_departure_id"]
            isOneToOne: false
            referencedRelation: "departures"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_events: {
        Row: {
          id: string
          leg_type: string | null
          partner_id: string
          result: Database["public"]["Enums"]["checkin_result"]
          scanned_at: string
          scanned_by_user_id: string
          ticket_id: string
        }
        Insert: {
          id?: string
          leg_type?: string | null
          partner_id: string
          result: Database["public"]["Enums"]["checkin_result"]
          scanned_at?: string
          scanned_by_user_id: string
          ticket_id: string
        }
        Update: {
          id?: string
          leg_type?: string | null
          partner_id?: string
          result?: Database["public"]["Enums"]["checkin_result"]
          scanned_at?: string
          scanned_by_user_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkin_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_records: {
        Row: {
          booking_id: string
          created_at: string
          currency: string
          gross_amount: number
          id: string
          partner_id: string
          partner_net_amount: number
          payment_provider_fee_amount: number | null
          platform_fee_amount: number
          platform_fee_percent: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          currency?: string
          gross_amount: number
          id?: string
          partner_id: string
          partner_net_amount: number
          payment_provider_fee_amount?: number | null
          platform_fee_amount: number
          platform_fee_percent?: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          currency?: string
          gross_amount?: number
          id?: string
          partner_id?: string
          partner_net_amount?: number
          payment_provider_fee_amount?: number | null
          platform_fee_amount?: number
          platform_fee_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      departure_templates: {
        Row: {
          boat_id: string | null
          created_at: string
          days_of_week: number[]
          departure_time: string
          id: string
          partner_id: string
          seasonal_end_date: string | null
          seasonal_start_date: string | null
          status: Database["public"]["Enums"]["route_status"]
          trip_id: string
          updated_at: string
        }
        Insert: {
          boat_id?: string | null
          created_at?: string
          days_of_week?: number[]
          departure_time: string
          id?: string
          partner_id: string
          seasonal_end_date?: string | null
          seasonal_start_date?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          trip_id: string
          updated_at?: string
        }
        Update: {
          boat_id?: string | null
          created_at?: string
          days_of_week?: number[]
          departure_time?: string
          id?: string
          partner_id?: string
          seasonal_end_date?: string | null
          seasonal_start_date?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departure_templates_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departure_templates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departure_templates_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      departures: {
        Row: {
          boat_id: string | null
          capacity_reserved: number
          capacity_total: number
          created_at: string
          departure_date: string
          departure_time: string
          id: string
          partner_id: string
          route_id: string
          status: Database["public"]["Enums"]["departure_status"]
          trip_id: string
          updated_at: string
        }
        Insert: {
          boat_id?: string | null
          capacity_reserved?: number
          capacity_total: number
          created_at?: string
          departure_date: string
          departure_time: string
          id?: string
          partner_id: string
          route_id: string
          status?: Database["public"]["Enums"]["departure_status"]
          trip_id: string
          updated_at?: string
        }
        Update: {
          boat_id?: string | null
          capacity_reserved?: number
          capacity_total?: number
          created_at?: string
          departure_date?: string
          departure_time?: string
          id?: string
          partner_id?: string
          route_id?: string
          status?: Database["public"]["Enums"]["departure_status"]
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departures_boat_id_fkey"
            columns: ["boat_id"]
            isOneToOne: false
            referencedRelation: "boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departures_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departures_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departures_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_rules: {
        Row: {
          applicable_route_ids: string[] | null
          applicable_schedule_ids: string[] | null
          applicable_trip_ids: string[] | null
          book_end_date: string | null
          book_start_date: string | null
          category: Database["public"]["Enums"]["discount_category"] | null
          checkin_end_date: string | null
          checkin_start_date: string | null
          code: string | null
          created_at: string
          discount_value: number
          discount_value_type: Database["public"]["Enums"]["discount_value_type"]
          end_date: string
          free_ticket_min_pax: number | null
          free_ticket_pax_type: string | null
          id: string
          individual_use_only: boolean | null
          last_minute_hours: number | null
          limit_per_customer: number | null
          min_pax: number | null
          minimum_spend: number | null
          partner_id: string
          start_date: string
          status: Database["public"]["Enums"]["route_status"]
          total_discounted_amount: number | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string
          usage_count: number
          usage_limit: number | null
          value_added_addon_name: string | null
        }
        Insert: {
          applicable_route_ids?: string[] | null
          applicable_schedule_ids?: string[] | null
          applicable_trip_ids?: string[] | null
          book_end_date?: string | null
          book_start_date?: string | null
          category?: Database["public"]["Enums"]["discount_category"] | null
          checkin_end_date?: string | null
          checkin_start_date?: string | null
          code?: string | null
          created_at?: string
          discount_value: number
          discount_value_type: Database["public"]["Enums"]["discount_value_type"]
          end_date: string
          free_ticket_min_pax?: number | null
          free_ticket_pax_type?: string | null
          id?: string
          individual_use_only?: boolean | null
          last_minute_hours?: number | null
          limit_per_customer?: number | null
          min_pax?: number | null
          minimum_spend?: number | null
          partner_id: string
          start_date: string
          status?: Database["public"]["Enums"]["route_status"]
          total_discounted_amount?: number | null
          type: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value_added_addon_name?: string | null
        }
        Update: {
          applicable_route_ids?: string[] | null
          applicable_schedule_ids?: string[] | null
          applicable_trip_ids?: string[] | null
          book_end_date?: string | null
          book_start_date?: string | null
          category?: Database["public"]["Enums"]["discount_category"] | null
          checkin_end_date?: string | null
          checkin_start_date?: string | null
          code?: string | null
          created_at?: string
          discount_value?: number
          discount_value_type?: Database["public"]["Enums"]["discount_value_type"]
          end_date?: string
          free_ticket_min_pax?: number | null
          free_ticket_pax_type?: string | null
          id?: string
          individual_use_only?: boolean | null
          last_minute_hours?: number | null
          limit_per_customer?: number | null
          min_pax?: number | null
          minimum_spend?: number | null
          partner_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["route_status"]
          total_discounted_amount?: number | null
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value_added_addon_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_rules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_usage: {
        Row: {
          booking_id: string | null
          customer_email: string | null
          customer_phone: string | null
          discount_rule_id: string
          discounted_amount: number
          id: string
          partner_id: string
          used_at: string
        }
        Insert: {
          booking_id?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          discount_rule_id: string
          discounted_amount?: number
          id?: string
          partner_id: string
          used_at?: string
        }
        Update: {
          booking_id?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          discount_rule_id?: string
          discounted_amount?: number
          id?: string
          partner_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_usage_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_discount_rule_id_fkey"
            columns: ["discount_rule_id"]
            isOneToOne: false
            referencedRelation: "discount_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          partner_id: string
          subject: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          partner_id: string
          subject?: string | null
          template_type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          partner_id?: string
          subject?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_modules: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          module_type: Database["public"]["Enums"]["module_type"]
          partner_id: string
          status: Database["public"]["Enums"]["module_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          module_type: Database["public"]["Enums"]["module_type"]
          partner_id: string
          status?: Database["public"]["Enums"]["module_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          module_type?: Database["public"]["Enums"]["module_type"]
          partner_id?: string
          status?: Database["public"]["Enums"]["module_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_modules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_settings: {
        Row: {
          auto_expire_tickets: boolean | null
          cancellation_deadline_hours: number | null
          cancellation_fee_type: string | null
          cancellation_fee_value: number | null
          cancellation_policy_enabled: boolean | null
          cancellation_policy_tiers: Json | null
          checkin_requires_full_payment: boolean | null
          created_at: string
          currency: string | null
          default_payment_provider: string | null
          deposit_enabled: boolean | null
          email_booking_confirmation: boolean | null
          email_cancellation: boolean | null
          email_payment_received: boolean | null
          id: string
          max_booking_advance_days: number | null
          min_deposit_percent: number | null
          no_show_policy: string | null
          onboarding_business_completed: boolean
          onboarding_cancellation_completed: boolean
          onboarding_notifications_completed: boolean
          onboarding_payments_completed: boolean
          onboarding_terms_completed: boolean
          onboarding_tickets_completed: boolean
          partner_id: string
          payment_methods_enabled: string[] | null
          qr_override_allowed: boolean | null
          refund_enabled: boolean | null
          tax_service_percent: number | null
          terms_booking: string | null
          terms_voucher: string | null
          ticket_validity_hours: number | null
          updated_at: string
          whatsapp_attach_ticket: boolean | null
          whatsapp_booking_confirmation: boolean | null
          whatsapp_payment_link: boolean | null
        }
        Insert: {
          auto_expire_tickets?: boolean | null
          cancellation_deadline_hours?: number | null
          cancellation_fee_type?: string | null
          cancellation_fee_value?: number | null
          cancellation_policy_enabled?: boolean | null
          cancellation_policy_tiers?: Json | null
          checkin_requires_full_payment?: boolean | null
          created_at?: string
          currency?: string | null
          default_payment_provider?: string | null
          deposit_enabled?: boolean | null
          email_booking_confirmation?: boolean | null
          email_cancellation?: boolean | null
          email_payment_received?: boolean | null
          id?: string
          max_booking_advance_days?: number | null
          min_deposit_percent?: number | null
          no_show_policy?: string | null
          onboarding_business_completed?: boolean
          onboarding_cancellation_completed?: boolean
          onboarding_notifications_completed?: boolean
          onboarding_payments_completed?: boolean
          onboarding_terms_completed?: boolean
          onboarding_tickets_completed?: boolean
          partner_id: string
          payment_methods_enabled?: string[] | null
          qr_override_allowed?: boolean | null
          refund_enabled?: boolean | null
          tax_service_percent?: number | null
          terms_booking?: string | null
          terms_voucher?: string | null
          ticket_validity_hours?: number | null
          updated_at?: string
          whatsapp_attach_ticket?: boolean | null
          whatsapp_booking_confirmation?: boolean | null
          whatsapp_payment_link?: boolean | null
        }
        Update: {
          auto_expire_tickets?: boolean | null
          cancellation_deadline_hours?: number | null
          cancellation_fee_type?: string | null
          cancellation_fee_value?: number | null
          cancellation_policy_enabled?: boolean | null
          cancellation_policy_tiers?: Json | null
          checkin_requires_full_payment?: boolean | null
          created_at?: string
          currency?: string | null
          default_payment_provider?: string | null
          deposit_enabled?: boolean | null
          email_booking_confirmation?: boolean | null
          email_cancellation?: boolean | null
          email_payment_received?: boolean | null
          id?: string
          max_booking_advance_days?: number | null
          min_deposit_percent?: number | null
          no_show_policy?: string | null
          onboarding_business_completed?: boolean
          onboarding_cancellation_completed?: boolean
          onboarding_notifications_completed?: boolean
          onboarding_payments_completed?: boolean
          onboarding_terms_completed?: boolean
          onboarding_tickets_completed?: boolean
          partner_id?: string
          payment_methods_enabled?: string[] | null
          qr_override_allowed?: boolean | null
          refund_enabled?: boolean | null
          tax_service_percent?: number | null
          terms_booking?: string | null
          terms_voucher?: string | null
          ticket_validity_hours?: number | null
          updated_at?: string
          whatsapp_attach_ticket?: boolean | null
          whatsapp_booking_confirmation?: boolean | null
          whatsapp_payment_link?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_settings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_users: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          role: Database["public"]["Enums"]["partner_user_role"]
          status: Database["public"]["Enums"]["partner_user_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          role: Database["public"]["Enums"]["partner_user_role"]
          status?: Database["public"]["Enums"]["partner_user_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          role?: Database["public"]["Enums"]["partner_user_role"]
          status?: Database["public"]["Enums"]["partner_user_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          bank_swift_code: string | null
          billing_details: Json
          city: string | null
          commission_percent: number
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          pickup_reminder_12h_enabled: boolean | null
          pickup_reminder_24h_enabled: boolean | null
          postal_code: string | null
          status: Database["public"]["Enums"]["partner_status"]
          tax_id: string | null
          updated_at: string
          website: string | null
          whatsapp_country_code: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
          billing_details?: Json
          city?: string | null
          commission_percent?: number
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          pickup_reminder_12h_enabled?: boolean | null
          pickup_reminder_24h_enabled?: boolean | null
          postal_code?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          tax_id?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_country_code?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
          billing_details?: Json
          city?: string | null
          commission_percent?: number
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          pickup_reminder_12h_enabled?: boolean | null
          pickup_reminder_24h_enabled?: boolean | null
          postal_code?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          tax_id?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_country_code?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      passengers: {
        Row: {
          age_group: Database["public"]["Enums"]["age_group"]
          booking_id: string
          created_at: string
          full_name: string
          id: string
          id_number: string | null
        }
        Insert: {
          age_group?: Database["public"]["Enums"]["age_group"]
          booking_id: string
          created_at?: string
          full_name: string
          id?: string
          id_number?: string | null
        }
        Update: {
          age_group?: Database["public"]["Enums"]["age_group"]
          booking_id?: string
          created_at?: string
          full_name?: string
          id?: string
          id_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          partner_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status: Database["public"]["Enums"]["payment_link_status"]
          url: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          partner_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["payment_link_status"]
          url?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          partner_id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          status?: Database["public"]["Enums"]["payment_link_status"]
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          partner_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          partner_id: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          partner_id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_reminder_logs: {
        Row: {
          booking_id: string
          channel: string
          created_at: string
          error_message: string | null
          id: string
          recipient_type: string
          reminder_type: string
          sent_at: string
          status: string
        }
        Insert: {
          booking_id: string
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_type: string
          reminder_type: string
          sent_at?: string
          status?: string
        }
        Update: {
          booking_id?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_type?: string
          reminder_type?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_reminder_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_zones: {
        Row: {
          addon_id: string
          created_at: string
          id: string
          partner_id: string
          price_override: number | null
          status: Database["public"]["Enums"]["route_status"]
          zone_name: string
        }
        Insert: {
          addon_id: string
          created_at?: string
          id?: string
          partner_id: string
          price_override?: number | null
          status?: Database["public"]["Enums"]["route_status"]
          zone_name: string
        }
        Update: {
          addon_id?: string
          created_at?: string
          id?: string
          partner_id?: string
          price_override?: number | null
          status?: Database["public"]["Enums"]["route_status"]
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_zones_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_zones_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ports: {
        Row: {
          area: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
        }
        Update: {
          area?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
        }
        Relationships: []
      }
      price_rules: {
        Row: {
          adult_price: number
          child_price: number | null
          created_at: string
          currency: string
          end_date: string | null
          id: string
          partner_id: string
          rule_type: Database["public"]["Enums"]["price_rule_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["route_status"]
          trip_id: string
          updated_at: string
        }
        Insert: {
          adult_price: number
          child_price?: number | null
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          partner_id: string
          rule_type?: Database["public"]["Enums"]["price_rule_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          trip_id: string
          updated_at?: string
        }
        Update: {
          adult_price?: number
          child_price?: number | null
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          partner_id?: string
          rule_type?: Database["public"]["Enums"]["price_rule_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_rules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_rules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      private_boat_activity_addons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          partner_id: string
          price: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          partner_id: string
          price?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          partner_id?: string
          price?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_boat_activity_addons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      private_boat_route_addons: {
        Row: {
          activity_addon_id: string
          created_at: string
          id: string
          partner_id: string
          pricing_type: string
          route_id: string
        }
        Insert: {
          activity_addon_id: string
          created_at?: string
          id?: string
          partner_id: string
          pricing_type?: string
          route_id: string
        }
        Update: {
          activity_addon_id?: string
          created_at?: string
          id?: string
          partner_id?: string
          pricing_type?: string
          route_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_boat_route_addons_activity_addon_id_fkey"
            columns: ["activity_addon_id"]
            isOneToOne: false
            referencedRelation: "private_boat_activity_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_boat_route_addons_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_boat_route_addons_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "private_boat_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      private_boat_routes: {
        Row: {
          created_at: string
          duration_minutes: number | null
          from_port_id: string
          id: string
          price: number
          private_boat_id: string
          status: Database["public"]["Enums"]["route_status"]
          to_port_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          from_port_id: string
          id?: string
          price?: number
          private_boat_id: string
          status?: Database["public"]["Enums"]["route_status"]
          to_port_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          from_port_id?: string
          id?: string
          price?: number
          private_boat_id?: string
          status?: Database["public"]["Enums"]["route_status"]
          to_port_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_boat_routes_from_port_id_fkey"
            columns: ["from_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_boat_routes_private_boat_id_fkey"
            columns: ["private_boat_id"]
            isOneToOne: false
            referencedRelation: "private_boats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_boat_routes_to_port_id_fkey"
            columns: ["to_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
        ]
      }
      private_boats: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          max_capacity: number | null
          max_departure_time: string
          min_capacity: number | null
          min_departure_time: string
          name: string
          partner_id: string
          status: Database["public"]["Enums"]["private_boat_status"]
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          max_capacity?: number | null
          max_departure_time?: string
          min_capacity?: number | null
          min_departure_time?: string
          name: string
          partner_id: string
          status?: Database["public"]["Enums"]["private_boat_status"]
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          max_capacity?: number | null
          max_departure_time?: string
          min_capacity?: number | null
          min_departure_time?: string
          name?: string
          partner_id?: string
          status?: Database["public"]["Enums"]["private_boat_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_boats_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      private_pickup_dropoff_rules: {
        Row: {
          bus_price: number
          car_price: number
          city_name: string
          created_at: string
          dropoff_after_arrival_minutes: number | null
          from_port_id: string
          id: string
          partner_id: string | null
          pickup_before_departure_minutes: number | null
          price: number
          service_type: Database["public"]["Enums"]["pickup_dropoff_service_type"]
          sort_order: number
          status: Database["public"]["Enums"]["route_status"]
          updated_at: string
        }
        Insert: {
          bus_price?: number
          car_price?: number
          city_name: string
          created_at?: string
          dropoff_after_arrival_minutes?: number | null
          from_port_id: string
          id?: string
          partner_id?: string | null
          pickup_before_departure_minutes?: number | null
          price?: number
          service_type: Database["public"]["Enums"]["pickup_dropoff_service_type"]
          sort_order?: number
          status?: Database["public"]["Enums"]["route_status"]
          updated_at?: string
        }
        Update: {
          bus_price?: number
          car_price?: number
          city_name?: string
          created_at?: string
          dropoff_after_arrival_minutes?: number | null
          from_port_id?: string
          id?: string
          partner_id?: string | null
          pickup_before_departure_minutes?: number | null
          price?: number
          service_type?: Database["public"]["Enums"]["pickup_dropoff_service_type"]
          sort_order?: number
          status?: Database["public"]["Enums"]["route_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_pickup_dropoff_rules_from_port_id_fkey"
            columns: ["from_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_pickup_dropoff_rules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          destination_port_id: string
          duration_minutes: number | null
          id: string
          origin_port_id: string
          partner_id: string
          route_name: string
          status: Database["public"]["Enums"]["route_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_port_id: string
          duration_minutes?: number | null
          id?: string
          origin_port_id: string
          partner_id: string
          route_name: string
          status?: Database["public"]["Enums"]["route_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_port_id?: string
          duration_minutes?: number | null
          id?: string
          origin_port_id?: string
          partner_id?: string
          route_name?: string
          status?: Database["public"]["Enums"]["route_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_destination_port_id_fkey"
            columns: ["destination_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_origin_port_id_fkey"
            columns: ["origin_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          outbound_validated_at: string | null
          outbound_validated_by_partner_id: string | null
          outbound_validated_by_user_id: string | null
          qr_image_url: string | null
          qr_token: string
          return_validated_at: string | null
          return_validated_by_partner_id: string | null
          return_validated_by_user_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          validated_at: string | null
          validated_by_user_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          outbound_validated_at?: string | null
          outbound_validated_by_partner_id?: string | null
          outbound_validated_by_user_id?: string | null
          qr_image_url?: string | null
          qr_token?: string
          return_validated_at?: string | null
          return_validated_by_partner_id?: string | null
          return_validated_by_user_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          validated_at?: string | null
          validated_by_user_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          outbound_validated_at?: string | null
          outbound_validated_by_partner_id?: string | null
          outbound_validated_by_user_id?: string | null
          qr_image_url?: string | null
          qr_token?: string
          return_validated_at?: string | null
          return_validated_by_partner_id?: string | null
          return_validated_by_user_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          validated_at?: string | null
          validated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_outbound_validated_by_partner_id_fkey"
            columns: ["outbound_validated_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_return_validated_by_partner_id_fkey"
            columns: ["return_validated_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          capacity_default: number
          created_at: string
          description: string | null
          id: string
          partner_id: string
          route_id: string
          status: Database["public"]["Enums"]["trip_status"]
          trip_name: string
          updated_at: string
        }
        Insert: {
          capacity_default?: number
          created_at?: string
          description?: string | null
          id?: string
          partner_id: string
          route_id: string
          status?: Database["public"]["Enums"]["trip_status"]
          trip_name: string
          updated_at?: string
        }
        Update: {
          capacity_default?: number
          created_at?: string
          description?: string | null
          id?: string
          partner_id?: string
          route_id?: string
          status?: Database["public"]["Enums"]["trip_status"]
          trip_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      widgets: {
        Row: {
          allowed_domains: string[] | null
          created_at: string
          id: string
          partner_id: string
          public_widget_key: string
          status: Database["public"]["Enums"]["widget_status"]
          theme_config: Json | null
          updated_at: string
          widget_type: Database["public"]["Enums"]["widget_type"]
        }
        Insert: {
          allowed_domains?: string[] | null
          created_at?: string
          id?: string
          partner_id: string
          public_widget_key?: string
          status?: Database["public"]["Enums"]["widget_status"]
          theme_config?: Json | null
          updated_at?: string
          widget_type?: Database["public"]["Enums"]["widget_type"]
        }
        Update: {
          allowed_domains?: string[] | null
          created_at?: string
          id?: string
          partner_id?: string
          public_widget_key?: string
          status?: Database["public"]["Enums"]["widget_status"]
          theme_config?: Json | null
          updated_at?: string
          widget_type?: Database["public"]["Enums"]["widget_type"]
        }
        Relationships: [
          {
            foreignKeyName: "widgets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          currency: string
          id: string
          partner_id: string
          processed_at: string | null
          processed_by_admin_user_id: string | null
          requested_at: string
          requested_by_user_id: string
          status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Insert: {
          amount: number
          currency?: string
          id?: string
          partner_id: string
          processed_at?: string | null
          processed_by_admin_user_id?: string | null
          requested_at?: string
          requested_by_user_id: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          partner_id?: string
          processed_at?: string | null
          processed_by_admin_user_id?: string | null
          requested_at?: string
          requested_by_user_id?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_activity_partner_payout: {
        Args: { _payout_id: string }
        Returns: Json
      }
      cancel_activity_booking: { Args: { _booking_id: string }; Returns: Json }
      complete_activity_booking: {
        Args: { _booking_id: string }
        Returns: Json
      }
      confirm_activity_booking: { Args: { _booking_id: string }; Returns: Json }
      create_activity_booking_intent: {
        Args: {
          _booking_date: string
          _customer?: Json
          _guest_data?: Json
          _line_items?: Json
          _product_id: string
          _slot_time?: string
        }
        Returns: Json
      }
      create_activity_invoice_from_payout: {
        Args: { _payout_id: string }
        Returns: Json
      }
      create_partner_with_modules: {
        Args: {
          _contact_email: string
          _contact_name: string
          _module_types: string[]
          _partner_name: string
          _user_id: string
        }
        Returns: string
      }
      delete_blackout_range: { Args: { _id: string }; Returns: undefined }
      delete_partner_product_commission: {
        Args: { _id: string }
        Returns: Json
      }
      expire_draft_bookings: { Args: never; Returns: number }
      export_activity_bookings_lines_csv: {
        Args: { _date_from: string; _date_to: string; _partner_id?: string }
        Returns: {
          booking_date: string
          booking_id: string
          invoice_number: string
          partner_name: string
          payout_id: string
          product_name: string
          slot_time: string
          status: string
          subtotal_amount: number
          total_qty: number
        }[]
      }
      export_activity_invoices_csv: {
        Args: { _date_from: string; _date_to: string; _partner_id?: string }
        Returns: {
          commission_amount: number
          currency: string
          gross_revenue: number
          invoice_number: string
          issue_date: string
          net_amount: number
          paid_at: string
          partner_name: string
          period_end: string
          period_start: string
          status: string
        }[]
      }
      generate_activity_invoice_number: { Args: never; Returns: string }
      generate_activity_partner_payout: {
        Args: {
          _partner_id: string
          _period_end: string
          _period_start: string
        }
        Returns: Json
      }
      get_activity_booking: { Args: { _booking_id: string }; Returns: Json }
      get_activity_invoice_detail: {
        Args: { _invoice_id: string }
        Returns: Json
      }
      get_activity_payout_detail: {
        Args: { _payout_id: string }
        Returns: Json
      }
      get_activity_reports_summary: {
        Args: { _date_from: string; _date_to: string; _partner_id: string }
        Returns: Json
      }
      get_activity_reports_timeseries: {
        Args: {
          _date_from: string
          _date_to: string
          _granularity?: string
          _partner_id: string
        }
        Returns: Json
      }
      get_activity_reports_top_products: {
        Args: {
          _date_from: string
          _date_to: string
          _limit?: number
          _partner_id: string
        }
        Returns: Json
      }
      get_activity_settings: { Args: never; Returns: Json }
      get_effective_activity_commission_rate: {
        Args: { _partner_id: string; _product_id?: string }
        Returns: Json
      }
      get_partner_billing_details: {
        Args: { _partner_id?: string }
        Returns: Json
      }
      get_product_availability: {
        Args: { _end_date: string; _product_id: string; _start_date: string }
        Returns: Json
      }
      get_user_partner_id: { Args: { _user_id: string }; Returns: string }
      get_widget_product: { Args: { _product_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_partner_onboarding_complete: {
        Args: { _partner_id: string }
        Returns: boolean
      }
      is_partner_owner: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
      list_activity_bookings: {
        Args: {
          _date_from?: string
          _date_to?: string
          _limit?: number
          _offset?: number
          _partner_id?: string
          _product_id?: string
          _q?: string
          _status?: string
        }
        Returns: Json
      }
      list_activity_partner_invoices: {
        Args: {
          _date_from?: string
          _date_to?: string
          _limit?: number
          _offset?: number
          _partner_id?: string
          _status?: string
        }
        Returns: Json
      }
      list_activity_partner_payouts: {
        Args: {
          _date_from?: string
          _date_to?: string
          _limit?: number
          _offset?: number
          _partner_id?: string
          _status?: string
        }
        Returns: Json
      }
      list_partner_product_commissions: {
        Args: { _partner_id: string }
        Returns: Json
      }
      mark_activity_partner_payout_paid: {
        Args: { _payout_id: string }
        Returns: Json
      }
      partner_has_module: {
        Args: {
          _module_type: Database["public"]["Enums"]["module_type"]
          _partner_id: string
        }
        Returns: boolean
      }
      reorder_accommodation_images: {
        Args: { _accommodation_id: string; _orders: Json }
        Returns: undefined
      }
      reorder_product_images: {
        Args: { _orders: Json; _product_id: string }
        Returns: undefined
      }
      set_blackout_range: {
        Args: {
          _end_date: string
          _product_id: string
          _reason?: string
          _start_date: string
        }
        Returns: string
      }
      set_partner_commission_rate: {
        Args: { _partner_id: string; _rate: number }
        Returns: Json
      }
      update_activity_settings_default_commission: {
        Args: { _rate: number }
        Returns: Json
      }
      update_partner_billing_details:
        | { Args: { _billing_details: Json }; Returns: Json }
        | {
            Args: {
              _address?: string
              _bank_account?: string
              _bank_holder?: string
              _bank_name?: string
              _billing_email?: string
              _billing_phone?: string
              _city?: string
              _company_name?: string
              _country?: string
              _tax_id?: string
            }
            Returns: Json
          }
      upsert_availability_day: {
        Args: {
          _capacity_override?: number
          _date: string
          _note?: string
          _product_id: string
          _status: Database["public"]["Enums"]["availability_status"]
        }
        Returns: string
      }
      upsert_availability_slot: {
        Args: {
          _capacity_override?: number
          _date: string
          _product_id: string
          _slot_time: string
          _status: Database["public"]["Enums"]["availability_status"]
        }
        Returns: string
      }
      upsert_partner_product_commission: {
        Args: { _partner_id: string; _product_id: string; _rate: number }
        Returns: Json
      }
      user_belongs_to_partner: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
      void_activity_invoice: { Args: { _invoice_id: string }; Returns: Json }
    }
    Enums: {
      activity_booking_status:
        | "draft"
        | "confirmed"
        | "cancelled"
        | "expired"
        | "completed"
      activity_invoice_status: "draft" | "issued" | "void"
      activity_payout_status: "pending" | "approved" | "paid"
      activity_product_status: "draft" | "active" | "inactive"
      activity_product_type: "activity" | "time_slot" | "rental"
      activity_voucher_type: "e_voucher" | "paper_voucher" | "not_required"
      addon_applicability: "fastboat" | "activities" | "both"
      addon_pricing_model: "per_person" | "per_booking"
      addon_type: "pickup" | "generic"
      age_group: "adult" | "child" | "infant"
      app_role: "admin" | "partner_owner" | "partner_staff"
      availability_status: "open" | "closed"
      booking_channel:
        | "online_widget"
        | "offline_walkin"
        | "offline_whatsapp"
        | "offline_agency"
        | "offline_other"
      booking_status: "pending" | "confirmed" | "cancelled" | "refunded"
      checkin_result: "success" | "already_used" | "invalid" | "cancelled"
      departure_status: "open" | "closed" | "sold_out" | "cancelled"
      discount_category:
        | "cart_fixed"
        | "cart_percent"
        | "schedule_fixed"
        | "schedule_percent"
        | "free_ticket"
        | "per_product"
        | "value_added"
        | "last_minute"
      discount_type: "promo_code" | "automatic"
      discount_value_type: "percent" | "fixed"
      duration_unit: "hour" | "day"
      guest_form_apply_type: "per_participant" | "per_booking"
      module_status: "active" | "pending" | "disabled"
      module_type: "boat" | "activity" | "accommodation"
      partner_status: "pending" | "active" | "suspended"
      partner_user_role: "PARTNER_OWNER" | "PARTNER_STAFF"
      partner_user_status: "active" | "inactive"
      payment_link_status: "active" | "paid" | "expired" | "cancelled"
      payment_method: "card" | "qris" | "transfer" | "cash" | "payment_link"
      payment_provider: "stripe" | "xendit" | "midtrans" | "manual"
      payment_status: "unpaid" | "paid" | "failed" | "refunded" | "partial"
      pickup_dropoff_service_type: "pickup" | "dropoff"
      price_rule_type: "base" | "seasonal" | "custom"
      private_boat_status: "draft" | "active" | "inactive"
      route_status: "active" | "inactive"
      ticket_status:
        | "pending"
        | "validated"
        | "cancelled"
        | "refunded"
        | "expired"
      trip_status: "active" | "inactive"
      widget_status: "active" | "inactive"
      widget_type: "fastboat" | "activity"
      withdrawal_status: "requested" | "approved" | "paid" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_booking_status: [
        "draft",
        "confirmed",
        "cancelled",
        "expired",
        "completed",
      ],
      activity_invoice_status: ["draft", "issued", "void"],
      activity_payout_status: ["pending", "approved", "paid"],
      activity_product_status: ["draft", "active", "inactive"],
      activity_product_type: ["activity", "time_slot", "rental"],
      activity_voucher_type: ["e_voucher", "paper_voucher", "not_required"],
      addon_applicability: ["fastboat", "activities", "both"],
      addon_pricing_model: ["per_person", "per_booking"],
      addon_type: ["pickup", "generic"],
      age_group: ["adult", "child", "infant"],
      app_role: ["admin", "partner_owner", "partner_staff"],
      availability_status: ["open", "closed"],
      booking_channel: [
        "online_widget",
        "offline_walkin",
        "offline_whatsapp",
        "offline_agency",
        "offline_other",
      ],
      booking_status: ["pending", "confirmed", "cancelled", "refunded"],
      checkin_result: ["success", "already_used", "invalid", "cancelled"],
      departure_status: ["open", "closed", "sold_out", "cancelled"],
      discount_category: [
        "cart_fixed",
        "cart_percent",
        "schedule_fixed",
        "schedule_percent",
        "free_ticket",
        "per_product",
        "value_added",
        "last_minute",
      ],
      discount_type: ["promo_code", "automatic"],
      discount_value_type: ["percent", "fixed"],
      duration_unit: ["hour", "day"],
      guest_form_apply_type: ["per_participant", "per_booking"],
      module_status: ["active", "pending", "disabled"],
      module_type: ["boat", "activity", "accommodation"],
      partner_status: ["pending", "active", "suspended"],
      partner_user_role: ["PARTNER_OWNER", "PARTNER_STAFF"],
      partner_user_status: ["active", "inactive"],
      payment_link_status: ["active", "paid", "expired", "cancelled"],
      payment_method: ["card", "qris", "transfer", "cash", "payment_link"],
      payment_provider: ["stripe", "xendit", "midtrans", "manual"],
      payment_status: ["unpaid", "paid", "failed", "refunded", "partial"],
      pickup_dropoff_service_type: ["pickup", "dropoff"],
      price_rule_type: ["base", "seasonal", "custom"],
      private_boat_status: ["draft", "active", "inactive"],
      route_status: ["active", "inactive"],
      ticket_status: [
        "pending",
        "validated",
        "cancelled",
        "refunded",
        "expired",
      ],
      trip_status: ["active", "inactive"],
      widget_status: ["active", "inactive"],
      widget_type: ["fastboat", "activity"],
      withdrawal_status: ["requested", "approved", "paid", "rejected"],
    },
  },
} as const
