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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          health_index: number | null
          id: number
          material_type: Database["public"]["Enums"]["material_type"]
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          health_index?: number | null
          id?: number
          material_type: Database["public"]["Enums"]["material_type"]
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          health_index?: number | null
          id?: number
          material_type?: Database["public"]["Enums"]["material_type"]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ink_catalog: {
        Row: {
          code: string
          color_code: string | null
          created_at: string | null
          current_stock_kg: number | null
          density: number | null
          description: string | null
          enabled: boolean | null
          id: number
          ink_type: string | null
          last_purchase_date: string | null
          min_stock_kg: number
          name: string
          optical_density: number | null
          prepress_pct: number | null
          provider_id: number | null
          updated_at: string | null
          viscosity: number | null
        }
        Insert: {
          code: string
          color_code?: string | null
          created_at?: string | null
          current_stock_kg?: number | null
          density?: number | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          ink_type?: string | null
          last_purchase_date?: string | null
          min_stock_kg: number
          name: string
          optical_density?: number | null
          prepress_pct?: number | null
          provider_id?: number | null
          updated_at?: string | null
          viscosity?: number | null
        }
        Update: {
          code?: string
          color_code?: string | null
          created_at?: string | null
          current_stock_kg?: number | null
          density?: number | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          ink_type?: string | null
          last_purchase_date?: string | null
          min_stock_kg?: number
          name?: string
          optical_density?: number | null
          prepress_pct?: number | null
          provider_id?: number | null
          updated_at?: string | null
          viscosity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ink_catalog_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      ink_inventory: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: number
          initial_kg: number
          ink_catalog_id: number
          internal_batch: string
          location: string | null
          receipt_id: number
          remaining_kg: number | null
          updated_at: string | null
          used_kg: number | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: number
          initial_kg: number
          ink_catalog_id: number
          internal_batch: string
          location?: string | null
          receipt_id: number
          remaining_kg?: number | null
          updated_at?: string | null
          used_kg?: number | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: number
          initial_kg?: number
          ink_catalog_id?: number
          internal_batch?: string
          location?: string | null
          receipt_id?: number
          remaining_kg?: number | null
          updated_at?: string | null
          used_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ink_inventory_ink_catalog_id_fkey"
            columns: ["ink_catalog_id"]
            isOneToOne: false
            referencedRelation: "ink_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ink_inventory_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "ink_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      ink_outputs: {
        Row: {
          created_at: string | null
          delivered_by: string
          id: number
          inventory_id: number
          kg_delivered: number
          kg_requested: number
          kg_returned: number | null
          output_date: string
          received_by: string
          requisition_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_by: string
          id?: number
          inventory_id: number
          kg_delivered: number
          kg_requested: number
          kg_returned?: number | null
          output_date?: string
          received_by: string
          requisition_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_by?: string
          id?: number
          inventory_id?: number
          kg_delivered?: number
          kg_requested?: number
          kg_returned?: number | null
          output_date?: string
          received_by?: string
          requisition_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ink_outputs_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ink_outputs_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "ink_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ink_outputs_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ink_outputs_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "production_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      ink_receipts: {
        Row: {
          created_at: string | null
          id: number
          internal_batch: string
          invoice_remission: string
          kg_received: number
          provider_batch: string
          purchase_order_item_id: number
          quality_certificate: Database["public"]["Enums"]["quality_certificate"]
          quality_notes: string | null
          receipt_date: string
          received_by: string
          units_received: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          internal_batch: string
          invoice_remission: string
          kg_received: number
          provider_batch: string
          purchase_order_item_id: number
          quality_certificate?: Database["public"]["Enums"]["quality_certificate"]
          quality_notes?: string | null
          receipt_date?: string
          received_by: string
          units_received: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          internal_batch?: string
          invoice_remission?: string
          kg_received?: number
          provider_batch?: string
          purchase_order_item_id?: number
          quality_certificate?: Database["public"]["Enums"]["quality_certificate"]
          quality_notes?: string | null
          receipt_date?: string
          received_by?: string
          units_received?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ink_receipts_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_ink_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ink_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_catalog: {
        Row: {
          bulk_cm3g: number | null
          code: string
          core_mm: number | null
          created_at: string | null
          current_stock_m2: number | null
          density: number | null
          description: string | null
          enabled: boolean | null
          id: number
          ink_compatibility: string[] | null
          last_purchase_date: string | null
          material: string | null
          min_stock_m2: number | null
          name: string
          provider_id: number | null
          reel_diameter_mm: number | null
          standard_width_m: number | null
          stock_unit: string
          substrate_category: string | null
          thickness_mm: number | null
          updated_at: string | null
          weight_gsm: number | null
        }
        Insert: {
          bulk_cm3g?: number | null
          code: string
          core_mm?: number | null
          created_at?: string | null
          current_stock_m2?: number | null
          density?: number | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          ink_compatibility?: string[] | null
          last_purchase_date?: string | null
          material?: string | null
          min_stock_m2?: number | null
          name: string
          provider_id?: number | null
          reel_diameter_mm?: number | null
          standard_width_m?: number | null
          stock_unit?: string
          substrate_category?: string | null
          thickness_mm?: number | null
          updated_at?: string | null
          weight_gsm?: number | null
        }
        Update: {
          bulk_cm3g?: number | null
          code?: string
          core_mm?: number | null
          created_at?: string | null
          current_stock_m2?: number | null
          density?: number | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          ink_compatibility?: string[] | null
          last_purchase_date?: string | null
          material?: string | null
          min_stock_m2?: number | null
          name?: string
          provider_id?: number | null
          reel_diameter_mm?: number | null
          standard_width_m?: number | null
          stock_unit?: string
          substrate_category?: string | null
          thickness_mm?: number | null
          updated_at?: string | null
          weight_gsm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paper_catalog_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_inventory: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: number
          initial_length_m: number
          initial_m2: number | null
          initial_width_m: number
          internal_batch: string
          location: string | null
          paper_catalog_id: number
          receipt_id: number
          remaining_length_m: number | null
          remaining_m2: number | null
          remaining_width_m: number | null
          updated_at: string | null
          used_length_m: number | null
          used_m2: number | null
          used_width_m: number | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: number
          initial_length_m: number
          initial_m2?: number | null
          initial_width_m: number
          internal_batch: string
          location?: string | null
          paper_catalog_id: number
          receipt_id: number
          remaining_length_m?: number | null
          remaining_m2?: number | null
          remaining_width_m?: number | null
          updated_at?: string | null
          used_length_m?: number | null
          used_m2?: number | null
          used_width_m?: number | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: number
          initial_length_m?: number
          initial_m2?: number | null
          initial_width_m?: number
          internal_batch?: string
          location?: string | null
          paper_catalog_id?: number
          receipt_id?: number
          remaining_length_m?: number | null
          remaining_m2?: number | null
          remaining_width_m?: number | null
          updated_at?: string | null
          used_length_m?: number | null
          used_m2?: number | null
          used_width_m?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paper_inventory_paper_catalog_id_fkey"
            columns: ["paper_catalog_id"]
            isOneToOne: false
            referencedRelation: "paper_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_inventory_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "paper_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_outputs: {
        Row: {
          created_at: string | null
          delivered_by: string
          id: number
          inventory_id: number
          length_m_delivered: number
          length_m_requested: number
          length_m_returned: number | null
          m2_delivered: number | null
          m2_requested: number | null
          m2_returned: number | null
          output_date: string
          received_by: string
          requisition_id: number
          updated_at: string | null
          width_m_delivered: number
          width_m_requested: number
          width_m_returned: number | null
        }
        Insert: {
          created_at?: string | null
          delivered_by: string
          id?: number
          inventory_id: number
          length_m_delivered: number
          length_m_requested: number
          length_m_returned?: number | null
          m2_delivered?: number | null
          m2_requested?: number | null
          m2_returned?: number | null
          output_date?: string
          received_by: string
          requisition_id: number
          updated_at?: string | null
          width_m_delivered: number
          width_m_requested: number
          width_m_returned?: number | null
        }
        Update: {
          created_at?: string | null
          delivered_by?: string
          id?: number
          inventory_id?: number
          length_m_delivered?: number
          length_m_requested?: number
          length_m_returned?: number | null
          m2_delivered?: number | null
          m2_requested?: number | null
          m2_returned?: number | null
          output_date?: string
          received_by?: string
          requisition_id?: number
          updated_at?: string | null
          width_m_delivered?: number
          width_m_requested?: number
          width_m_returned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paper_outputs_delivered_by_fkey"
            columns: ["delivered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_outputs_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "paper_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_outputs_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_outputs_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "production_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_receipts: {
        Row: {
          created_at: string | null
          id: number
          internal_batch: string
          invoice_remission: string
          length_m: number
          provider_batch: string
          purchase_order_item_id: number
          quality_certificate: Database["public"]["Enums"]["quality_certificate"]
          quality_notes: string | null
          receipt_date: string
          received_by: string
          total_m2_received: number | null
          units_received: number
          updated_at: string | null
          width_m: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          internal_batch: string
          invoice_remission: string
          length_m: number
          provider_batch: string
          purchase_order_item_id: number
          quality_certificate?: Database["public"]["Enums"]["quality_certificate"]
          quality_notes?: string | null
          receipt_date?: string
          received_by: string
          total_m2_received?: number | null
          units_received: number
          updated_at?: string | null
          width_m: number
        }
        Update: {
          created_at?: string | null
          id?: number
          internal_batch?: string
          invoice_remission?: string
          length_m?: number
          provider_batch?: string
          purchase_order_item_id?: number
          quality_certificate?: Database["public"]["Enums"]["quality_certificate"]
          quality_notes?: string | null
          receipt_date?: string
          received_by?: string
          total_m2_received?: number | null
          units_received?: number
          updated_at?: string | null
          width_m?: number
        }
        Relationships: [
          {
            foreignKeyName: "paper_receipts_purchase_order_item_id_fkey"
            columns: ["purchase_order_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_paper_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      production_requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: number
          material_type: Database["public"]["Enums"]["material_type"]
          notes: string | null
          production_order: string
          request_date: string
          requested_by: string
          requisition_number: number
          status: Database["public"]["Enums"]["requisition_status"] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: number
          material_type: Database["public"]["Enums"]["material_type"]
          notes?: string | null
          production_order: string
          request_date?: string
          requested_by: string
          requisition_number: number
          status?: Database["public"]["Enums"]["requisition_status"] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: number
          material_type?: Database["public"]["Enums"]["material_type"]
          notes?: string | null
          production_order?: string
          request_date?: string
          requested_by?: string
          requisition_number?: number
          status?: Database["public"]["Enums"]["requisition_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_requisitions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_requisitions_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_requisitions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string
          contact_person: string | null
          created_at: string | null
          email: string
          enabled: boolean | null
          id: number
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          phone: string
          provider_type: Database["public"]["Enums"]["provider_type"]
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address: string
          contact_person?: string | null
          created_at?: string | null
          email: string
          enabled?: boolean | null
          id?: number
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          phone: string
          provider_type: Database["public"]["Enums"]["provider_type"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string
          contact_person?: string | null
          created_at?: string | null
          email?: string
          enabled?: boolean | null
          id?: number
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          phone?: string
          provider_type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      purchase_order_ink_items: {
        Row: {
          created_at: string | null
          id: number
          ink_catalog_id: number
          is_complete: boolean | null
          item_notes: string | null
          kg_per_unit: number
          purchase_order_id: number
          total_kg_ordered: number | null
          total_kg_received: number | null
          units_ordered: number
          units_received: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          ink_catalog_id: number
          is_complete?: boolean | null
          item_notes?: string | null
          kg_per_unit: number
          purchase_order_id: number
          total_kg_ordered?: number | null
          total_kg_received?: number | null
          units_ordered: number
          units_received?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          ink_catalog_id?: number
          is_complete?: boolean | null
          item_notes?: string | null
          kg_per_unit?: number
          purchase_order_id?: number
          total_kg_ordered?: number | null
          total_kg_received?: number | null
          units_ordered?: number
          units_received?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_ink_items_ink_catalog_id_fkey"
            columns: ["ink_catalog_id"]
            isOneToOne: false
            referencedRelation: "ink_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_ink_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_paper_items: {
        Row: {
          created_at: string | null
          id: number
          is_complete: boolean | null
          item_notes: string | null
          length_m_per_unit: number
          paper_catalog_id: number
          purchase_order_id: number
          total_m2_ordered: number | null
          total_m2_received: number | null
          units_ordered: number
          units_received: number | null
          updated_at: string | null
          width_m: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_complete?: boolean | null
          item_notes?: string | null
          length_m_per_unit: number
          paper_catalog_id: number
          purchase_order_id: number
          total_m2_ordered?: number | null
          total_m2_received?: number | null
          units_ordered: number
          units_received?: number | null
          updated_at?: string | null
          width_m: number
        }
        Update: {
          created_at?: string | null
          id?: number
          is_complete?: boolean | null
          item_notes?: string | null
          length_m_per_unit?: number
          paper_catalog_id?: number
          purchase_order_id?: number
          total_m2_ordered?: number | null
          total_m2_received?: number | null
          units_ordered?: number
          units_received?: number | null
          updated_at?: string | null
          width_m?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_paper_items_paper_catalog_id_fkey"
            columns: ["paper_catalog_id"]
            isOneToOne: false
            referencedRelation: "paper_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_paper_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string | null
          delivery_place: string
          expected_delivery_date: string | null
          id: number
          material_type: Database["public"]["Enums"]["material_type"]
          notes: string | null
          order_number: number
          payment_method: string
          provider_id: number
          request_date: string
          requested_by: string
          shipment_method: string
          status: Database["public"]["Enums"]["purchase_order_status"] | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string | null
          delivery_place: string
          expected_delivery_date?: string | null
          id?: number
          material_type: Database["public"]["Enums"]["material_type"]
          notes?: string | null
          order_number: number
          payment_method: string
          provider_id: number
          request_date?: string
          requested_by: string
          shipment_method: string
          status?: Database["public"]["Enums"]["purchase_order_status"] | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string | null
          delivery_place?: string
          expected_delivery_date?: string | null
          id?: number
          material_type?: Database["public"]["Enums"]["material_type"]
          notes?: string | null
          order_number?: number
          payment_method?: string
          provider_id?: number
          request_date?: string
          requested_by?: string
          shipment_method?: string
          status?: Database["public"]["Enums"]["purchase_order_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          code: string | null
          created_at: string | null
          email: string
          enabled: boolean | null
          first_name: string
          id: string
          invited_at: string | null
          invited_by: string | null
          last_name: string
          last_sign_in_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          email: string
          enabled?: boolean | null
          first_name: string
          id: string
          invited_at?: string | null
          invited_by?: string | null
          last_name: string
          last_sign_in_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          email?: string
          enabled?: boolean | null
          first_name?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          last_name?: string
          last_sign_in_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      material_type: "INK" | "PAPER"
      provider_type: "INK_SUPPLIER" | "PAPER_SUPPLIER" | "BOTH"
      purchase_order_status: "PENDING" | "PARTIAL" | "COMPLETED" | "CANCELLED"
      quality_certificate: "APPROVED" | "REJECTED" | "PENDING" | "CONDITIONAL"
      requisition_status: "PENDING" | "APPROVED" | "FULFILLED" | "REJECTED"
      user_role:
        | "ADMIN"
        | "PURCHASER"
        | "WAREHOUSE_MANAGER"
        | "PRODUCER"
        | "USER"
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
      material_type: ["INK", "PAPER"],
      provider_type: ["INK_SUPPLIER", "PAPER_SUPPLIER", "BOTH"],
      purchase_order_status: ["PENDING", "PARTIAL", "COMPLETED", "CANCELLED"],
      quality_certificate: ["APPROVED", "REJECTED", "PENDING", "CONDITIONAL"],
      requisition_status: ["PENDING", "APPROVED", "FULFILLED", "REJECTED"],
      user_role: [
        "ADMIN",
        "PURCHASER",
        "WAREHOUSE_MANAGER",
        "PRODUCER",
        "USER",
      ],
    },
  },
} as const
