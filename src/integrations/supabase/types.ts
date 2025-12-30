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
        ]
      }
      checkin_events: {
        Row: {
          id: string
          partner_id: string
          result: Database["public"]["Enums"]["checkin_result"]
          scanned_at: string
          scanned_by_user_id: string
          ticket_id: string
        }
        Insert: {
          id?: string
          partner_id: string
          result: Database["public"]["Enums"]["checkin_result"]
          scanned_at?: string
          scanned_by_user_id: string
          ticket_id: string
        }
        Update: {
          id?: string
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
          partner_id: string
          payment_methods_enabled: string[] | null
          qr_override_allowed: boolean | null
          refund_enabled: boolean | null
          tax_service_percent: number | null
          terms_booking: string | null
          terms_voucher: string | null
          ticket_validity_hours: number | null
          updated_at: string
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
          partner_id: string
          payment_methods_enabled?: string[] | null
          qr_override_allowed?: boolean | null
          refund_enabled?: boolean | null
          tax_service_percent?: number | null
          terms_booking?: string | null
          terms_voucher?: string | null
          ticket_validity_hours?: number | null
          updated_at?: string
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
          partner_id?: string
          payment_methods_enabled?: string[] | null
          qr_override_allowed?: boolean | null
          refund_enabled?: boolean | null
          tax_service_percent?: number | null
          terms_booking?: string | null
          terms_voucher?: string | null
          ticket_validity_hours?: number | null
          updated_at?: string
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
          postal_code: string | null
          status: Database["public"]["Enums"]["partner_status"]
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
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
          postal_code?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
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
          postal_code?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          tax_id?: string | null
          updated_at?: string
          website?: string | null
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
          qr_image_url: string | null
          qr_token: string
          status: Database["public"]["Enums"]["ticket_status"]
          validated_at: string | null
          validated_by_user_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          qr_image_url?: string | null
          qr_token?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          validated_at?: string | null
          validated_by_user_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          qr_image_url?: string | null
          qr_token?: string
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
      expire_draft_bookings: { Args: never; Returns: number }
      get_activity_booking: { Args: { _booking_id: string }; Returns: Json }
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
      is_partner_owner: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
      partner_has_module: {
        Args: {
          _module_type: Database["public"]["Enums"]["module_type"]
          _partner_id: string
        }
        Returns: boolean
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
      user_belongs_to_partner: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_booking_status: "draft" | "confirmed" | "cancelled" | "expired"
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
      module_type: "boat" | "activity"
      partner_status: "pending" | "active" | "suspended"
      partner_user_role: "PARTNER_OWNER" | "PARTNER_STAFF"
      partner_user_status: "active" | "inactive"
      payment_link_status: "active" | "paid" | "expired" | "cancelled"
      payment_method: "card" | "qris" | "transfer" | "cash" | "payment_link"
      payment_provider: "stripe" | "xendit" | "midtrans" | "manual"
      payment_status: "unpaid" | "paid" | "failed" | "refunded" | "partial"
      price_rule_type: "base" | "seasonal" | "custom"
      route_status: "active" | "inactive"
      ticket_status:
        | "pending"
        | "validated"
        | "cancelled"
        | "refunded"
        | "expired"
      trip_status: "active" | "inactive"
      widget_status: "active" | "inactive"
      widget_type: "fastboat"
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
      activity_booking_status: ["draft", "confirmed", "cancelled", "expired"],
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
      module_type: ["boat", "activity"],
      partner_status: ["pending", "active", "suspended"],
      partner_user_role: ["PARTNER_OWNER", "PARTNER_STAFF"],
      partner_user_status: ["active", "inactive"],
      payment_link_status: ["active", "paid", "expired", "cancelled"],
      payment_method: ["card", "qris", "transfer", "cash", "payment_link"],
      payment_provider: ["stripe", "xendit", "midtrans", "manual"],
      payment_status: ["unpaid", "paid", "failed", "refunded", "partial"],
      price_rule_type: ["base", "seasonal", "custom"],
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
      widget_type: ["fastboat"],
      withdrawal_status: ["requested", "approved", "paid", "rejected"],
    },
  },
} as const
