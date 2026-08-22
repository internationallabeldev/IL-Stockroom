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
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          changed_fields: string[] | null
          created_at: string | null
          id: number
          new_data: Json | null
          old_data: Json | null
          operation: string
          performed_by: string | null
          performed_by_name: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          changed_fields?: string[] | null
          created_at?: string | null
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          performed_by?: string | null
          performed_by_name?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          changed_fields?: string[] | null
          created_at?: string | null
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          performed_by?: string | null
          performed_by_name?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
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
      chat_channel_members: {
        Row: {
          added_at: string | null
          added_by: string | null
          channel_id: number
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          channel_id: number
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          channel_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          archived_at: string | null
          bot_owner_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: number
          is_archived: boolean | null
          is_bot_dm: boolean | null
          is_default: boolean | null
          is_private: boolean | null
          name: string
          retention_days: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          bot_owner_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_archived?: boolean | null
          is_bot_dm?: boolean | null
          is_default?: boolean | null
          is_private?: boolean | null
          name: string
          retention_days?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          bot_owner_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: number
          is_archived?: boolean | null
          is_bot_dm?: boolean | null
          is_default?: boolean | null
          is_private?: boolean | null
          name?: string
          retention_days?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_mentions: {
        Row: {
          created_at: string | null
          id: number
          is_read: boolean | null
          mentioned_user_id: string
          message_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          mentioned_user_id: string
          message_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          is_read?: boolean | null
          mentioned_user_id?: string
          message_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: number
          content: string
          content_text: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: number
          is_deleted: boolean | null
          is_pinned: boolean | null
          priority: string | null
          reply_to_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: number
          content: string
          content_text?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: number
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          priority?: string | null
          reply_to_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: number
          content?: string
          content_text?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: number
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          priority?: string | null
          reply_to_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: number
          message_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: number
          message_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: number
          message_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_status: {
        Row: {
          channel_id: number
          last_read_at: string | null
          last_read_message_id: number | null
          user_id: string
        }
        Insert: {
          channel_id: number
          last_read_at?: string | null
          last_read_message_id?: number | null
          user_id: string
        }
        Update: {
          channel_id?: number
          last_read_at?: string | null
          last_read_message_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_status_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_read_status_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          dashboard_key: string
          layouts: Json
          updated_at: string | null
          user_id: string
          widgets: Json
        }
        Insert: {
          dashboard_key: string
          layouts: Json
          updated_at?: string | null
          user_id: string
          widgets?: Json
        }
        Update: {
          dashboard_key?: string
          layouts?: Json
          updated_at?: string | null
          user_id?: string
          widgets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          ink_inventory_id: number
          kg_delivered: number
          kg_requested: number
          kg_returned: number | null
          notes: string | null
          output_date: string
          received_by: string
          requisition_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_by: string
          id?: number
          ink_inventory_id: number
          kg_delivered: number
          kg_requested: number
          kg_returned?: number | null
          notes?: string | null
          output_date?: string
          received_by: string
          requisition_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_by?: string
          id?: number
          ink_inventory_id?: number
          kg_delivered?: number
          kg_requested?: number
          kg_returned?: number | null
          notes?: string | null
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
            columns: ["ink_inventory_id"]
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
          certificate_url: string | null
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
          certificate_url?: string | null
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
          certificate_url?: string | null
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
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: number
          link: string | null
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: number
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: number
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
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
          parent_inventory_id: number | null
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
          parent_inventory_id?: number | null
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
          parent_inventory_id?: number | null
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
            foreignKeyName: "paper_inventory_parent_inventory_id_fkey"
            columns: ["parent_inventory_id"]
            isOneToOne: false
            referencedRelation: "paper_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_inventory_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
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
          length_m_delivered: number
          length_m_requested: number
          length_m_returned: number | null
          m2_delivered: number | null
          m2_requested: number | null
          m2_returned: number | null
          notes: string | null
          output_date: string
          paper_inventory_id: number
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
          length_m_delivered: number
          length_m_requested: number
          length_m_returned?: number | null
          m2_delivered?: number | null
          m2_requested?: number | null
          m2_returned?: number | null
          notes?: string | null
          output_date?: string
          paper_inventory_id: number
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
          length_m_delivered?: number
          length_m_requested?: number
          length_m_returned?: number | null
          m2_delivered?: number | null
          m2_requested?: number | null
          m2_returned?: number | null
          notes?: string | null
          output_date?: string
          paper_inventory_id?: number
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
            columns: ["paper_inventory_id"]
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
          certificate_url: string | null
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
          certificate_url?: string | null
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
          certificate_url?: string | null
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
          attended_by: string | null
          created_at: string | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: number
          material_type: Database["public"]["Enums"]["material_type"]
          notes: string | null
          production_order: string
          rejection_reason: string | null
          request_date: string
          requested_at: string | null
          requested_by: string
          requisition_number: number
          status: Database["public"]["Enums"]["requisition_status"] | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attended_by?: string | null
          created_at?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: number
          material_type: Database["public"]["Enums"]["material_type"]
          notes?: string | null
          production_order: string
          rejection_reason?: string | null
          request_date?: string
          requested_at?: string | null
          requested_by: string
          requisition_number: number
          status?: Database["public"]["Enums"]["requisition_status"] | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attended_by?: string | null
          created_at?: string | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: number
          material_type?: Database["public"]["Enums"]["material_type"]
          notes?: string | null
          production_order?: string
          rejection_reason?: string | null
          request_date?: string
          requested_at?: string | null
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
            foreignKeyName: "production_requisitions_attended_by_fkey"
            columns: ["attended_by"]
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
          account_number: string | null
          bank: string | null
          billing_email: string | null
          city: string | null
          clabe: string | null
          compliance_opinion_date: string | null
          country: string | null
          credit_limit: number | null
          csf_url: string | null
          currency: string | null
          customer_number: string | null
          deleted_at: string | null
          legal_name: string | null
          notes: string | null
          payment_terms_days: number | null
          postal_code: string | null
          rfc: string | null
          state: string | null
          tax_regime: string | null
          website: string | null
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
          supply_types: string[] | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          account_number?: string | null
          bank?: string | null
          billing_email?: string | null
          city?: string | null
          clabe?: string | null
          compliance_opinion_date?: string | null
          country?: string | null
          credit_limit?: number | null
          csf_url?: string | null
          currency?: string | null
          customer_number?: string | null
          deleted_at?: string | null
          legal_name?: string | null
          notes?: string | null
          payment_terms_days?: number | null
          postal_code?: string | null
          rfc?: string | null
          state?: string | null
          tax_regime?: string | null
          website?: string | null
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
          provider_type?: Database["public"]["Enums"]["provider_type"]
          supply_types?: string[] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          account_number?: string | null
          bank?: string | null
          billing_email?: string | null
          city?: string | null
          clabe?: string | null
          compliance_opinion_date?: string | null
          country?: string | null
          credit_limit?: number | null
          csf_url?: string | null
          currency?: string | null
          customer_number?: string | null
          deleted_at?: string | null
          legal_name?: string | null
          notes?: string | null
          payment_terms_days?: number | null
          postal_code?: string | null
          rfc?: string | null
          state?: string | null
          tax_regime?: string | null
          website?: string | null
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
          supply_types?: string[] | null
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
          overdue_notified_at: string | null
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
          order_number?: number
          overdue_notified_at?: string | null
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
          overdue_notified_at?: string | null
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: number
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: number
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: number
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_ink_items: {
        Row: {
          created_at: string | null
          id: number
          ink_catalog_id: number
          is_fulfilled: boolean | null
          kg_delivered: number | null
          kg_requested: number
          requisition_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          ink_catalog_id: number
          is_fulfilled?: boolean | null
          kg_delivered?: number | null
          kg_requested: number
          requisition_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          ink_catalog_id?: number
          is_fulfilled?: boolean | null
          kg_delivered?: number | null
          kg_requested?: number
          requisition_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "requisition_ink_items_ink_catalog_id_fkey"
            columns: ["ink_catalog_id"]
            isOneToOne: false
            referencedRelation: "ink_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_ink_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "production_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_paper_items: {
        Row: {
          created_at: string | null
          id: number
          is_fulfilled: boolean | null
          length_m_requested: number
          m2_delivered: number | null
          m2_requested: number | null
          paper_catalog_id: number
          requisition_id: number
          width_m_requested: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_fulfilled?: boolean | null
          length_m_requested: number
          m2_delivered?: number | null
          m2_requested?: number | null
          paper_catalog_id: number
          requisition_id: number
          width_m_requested: number
        }
        Update: {
          created_at?: string | null
          id?: number
          is_fulfilled?: boolean | null
          length_m_requested?: number
          m2_delivered?: number | null
          m2_requested?: number | null
          paper_catalog_id?: number
          requisition_id?: number
          width_m_requested?: number
        }
        Relationships: [
          {
            foreignKeyName: "requisition_paper_items_paper_catalog_id_fkey"
            columns: ["paper_catalog_id"]
            isOneToOne: false
            referencedRelation: "paper_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_paper_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "production_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_items: {
        Row: {
          alert_email: string | null
          category_id: number
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: number
          image_url: string | null
          last_alert_sent_at: string | null
          name: string
          provider_id: number | null
          quantity_current: number
          quantity_minimum: number
          quantity_warning: number | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          alert_email?: string | null
          category_id: number
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          image_url?: string | null
          last_alert_sent_at?: string | null
          name: string
          provider_id?: number | null
          quantity_current?: number
          quantity_minimum: number
          quantity_warning?: number | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          alert_email?: string | null
          category_id?: number
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: number
          image_url?: string | null
          last_alert_sent_at?: string | null
          name?: string
          provider_id?: number | null
          quantity_current?: number
          quantity_minimum?: number
          quantity_warning?: number | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_movements: {
        Row: {
          created_at: string | null
          id: number
          item_id: number
          movement_type: string
          notes: string | null
          performed_by: string
          quantity: number
          quantity_after: number
          quantity_before: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          item_id: number
          movement_type: string
          notes?: string | null
          performed_by: string
          quantity: number
          quantity_after: number
          quantity_before: number
        }
        Update: {
          created_at?: string | null
          id?: number
          item_id?: number
          movement_type?: string
          notes?: string | null
          performed_by?: string
          quantity?: number
          quantity_after?: number
          quantity_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "supply_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "supply_items"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bot_queries_reset_at: string | null
          bot_queries_today: number | null
          code: string | null
          created_at: string | null
          email: string
          enabled: boolean | null
          first_name: string
          id: string
          invited_at: string | null
          invited_by: string | null
          job_title: string | null
          last_name: string
          last_sign_in_at: string | null
          nickname: string | null
          notifications: Json | null
          onboarded_at: string | null
          onboarding_completed: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bot_queries_reset_at?: string | null
          bot_queries_today?: number | null
          code?: string | null
          created_at?: string | null
          email: string
          enabled?: boolean | null
          first_name: string
          id: string
          invited_at?: string | null
          invited_by?: string | null
          job_title?: string | null
          last_name: string
          last_sign_in_at?: string | null
          nickname?: string | null
          notifications?: Json | null
          onboarded_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bot_queries_reset_at?: string | null
          bot_queries_today?: number | null
          code?: string | null
          created_at?: string | null
          email?: string
          enabled?: boolean | null
          first_name?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          job_title?: string | null
          last_name?: string
          last_sign_in_at?: string | null
          nickname?: string | null
          notifications?: Json | null
          onboarded_at?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          theme?: string | null
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
      chat_can_access_channel: { Args: { cid: number }; Returns: boolean }
      chat_is_admin: { Args: never; Returns: boolean }
      chat_is_member: { Args: { cid: number }; Returns: boolean }
      set_current_user_id: { Args: { user_id: string }; Returns: undefined }
    }
    Enums: {
      material_type: "INK" | "PAPER"
      provider_type:
        | "INK_SUPPLIER"
        | "PAPER_SUPPLIER"
        | "SUPPLY_SUPPLIER"
        | "BOTH"
      purchase_order_status: "PENDING" | "PARTIAL" | "COMPLETED" | "CANCELLED"
      quality_certificate: "PENDING" | "APPROVED" | "REJECTED"
      requisition_status:
        | "PENDING"
        | "APPROVED"
        | "PARTIAL"
        | "FULFILLED"
        | "REJECTED"
        | "CANCELLED"
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
      provider_type: [
        "INK_SUPPLIER",
        "PAPER_SUPPLIER",
        "SUPPLY_SUPPLIER",
        "BOTH",
      ],
      purchase_order_status: ["PENDING", "PARTIAL", "COMPLETED", "CANCELLED"],
      quality_certificate: ["PENDING", "APPROVED", "REJECTED"],
      requisition_status: [
        "PENDING",
        "APPROVED",
        "PARTIAL",
        "FULFILLED",
        "REJECTED",
        "CANCELLED",
      ],
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
