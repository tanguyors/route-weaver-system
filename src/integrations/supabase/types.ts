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
          booking_id: string
          created_at: string
          id: string
          name: string
          price: number
          qty: number
          total: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          name: string
          price: number
          qty?: number
          total: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          qty?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
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
          applicable_trip_ids: string[] | null
          code: string | null
          created_at: string
          discount_value: number
          discount_value_type: Database["public"]["Enums"]["discount_value_type"]
          end_date: string
          id: string
          min_pax: number | null
          partner_id: string
          start_date: string
          status: Database["public"]["Enums"]["route_status"]
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string
          usage_count: number
          usage_limit: number | null
        }
        Insert: {
          applicable_trip_ids?: string[] | null
          code?: string | null
          created_at?: string
          discount_value: number
          discount_value_type: Database["public"]["Enums"]["discount_value_type"]
          end_date: string
          id?: string
          min_pax?: number | null
          partner_id: string
          start_date: string
          status?: Database["public"]["Enums"]["route_status"]
          type: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
        }
        Update: {
          applicable_trip_ids?: string[] | null
          code?: string | null
          created_at?: string
          discount_value?: number
          discount_value_type?: Database["public"]["Enums"]["discount_value_type"]
          end_date?: string
          id?: string
          min_pax?: number | null
          partner_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["route_status"]
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
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
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
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
      get_user_partner_id: { Args: { _user_id: string }; Returns: string }
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
      user_belongs_to_partner: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      age_group: "adult" | "child" | "infant"
      app_role: "admin" | "partner_owner" | "partner_staff"
      booking_channel:
        | "online_widget"
        | "offline_walkin"
        | "offline_whatsapp"
        | "offline_agency"
        | "offline_other"
      booking_status: "pending" | "confirmed" | "cancelled" | "refunded"
      checkin_result: "success" | "already_used" | "invalid" | "cancelled"
      departure_status: "open" | "closed" | "sold_out" | "cancelled"
      discount_type: "promo_code" | "automatic"
      discount_value_type: "percent" | "fixed"
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
      age_group: ["adult", "child", "infant"],
      app_role: ["admin", "partner_owner", "partner_staff"],
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
      discount_type: ["promo_code", "automatic"],
      discount_value_type: ["percent", "fixed"],
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
