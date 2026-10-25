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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      fixes: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          photo_path: string | null
          priority: string
          property_id: string
          status: string
          title: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          photo_path?: string | null
          priority?: string
          property_id: string
          status?: string
          title: string
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          photo_path?: string | null
          priority?: string
          property_id?: string
          status?: string
          title?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          created_at: string
          id: string
          monthly_rent: number
          name: string
          photo_path: string | null
          property_type: string
          tenants: number
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          monthly_rent?: number
          name: string
          photo_path?: string | null
          property_type?: string
          tenants?: number
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          monthly_rent?: number
          name?: string
          photo_path?: string | null
          property_type?: string
          tenants?: number
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      recurring_rents: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          day_of_month: number
          id: string
          note: string | null
          property_id: string
          start_date: string
          tenant_name: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          active?: boolean
          amount: number
          created_at?: string
          day_of_month?: number
          id?: string
          note?: string | null
          property_id: string
          start_date: string
          tenant_name?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          day_of_month?: number
          id?: string
          note?: string | null
          property_id?: string
          start_date?: string
          tenant_name?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_rents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      taxes: {
        Row: {
          amount: number
          created_at: string
          document_date: string | null
          due_date: string
          id: string
          label: string | null
          paid_at: string | null
          property_id: string
          receipt_path: string | null
          status: string
          tax_type: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          document_date?: string | null
          due_date: string
          id?: string
          label?: string | null
          paid_at?: string | null
          property_id: string
          receipt_path?: string | null
          status?: string
          tax_type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          document_date?: string | null
          due_date?: string
          id?: string
          label?: string | null
          paid_at?: string | null
          property_id?: string
          receipt_path?: string | null
          status?: string
          tax_type?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "taxes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          fix_id: string | null
          id: string
          is_fixed_expense: boolean
          kind: string
          note: string | null
          paid_by: string | null
          property_id: string
          receipt_path: string | null
          recurring_id: string | null
          tax_id: string | null
          user_id: string
          vendor: string | null
          workspace_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          fix_id?: string | null
          id?: string
          is_fixed_expense?: boolean
          kind: string
          note?: string | null
          paid_by?: string | null
          property_id: string
          receipt_path?: string | null
          recurring_id?: string | null
          tax_id?: string | null
          user_id?: string
          vendor?: string | null
          workspace_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          fix_id?: string | null
          id?: string
          is_fixed_expense?: boolean
          kind?: string
          note?: string | null
          paid_by?: string | null
          property_id?: string
          receipt_path?: string | null
          recurring_id?: string | null
          tax_id?: string | null
          user_id?: string
          vendor?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_fix_id_fkey"
            columns: ["fix_id"]
            isOneToOne: false
            referencedRelation: "fixes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_rents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tax_id_fkey"
            columns: ["tax_id"]
            isOneToOne: false
            referencedRelation: "taxes"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          created_at: string
          end_date: string
          id: string
          property_id: string
          start_date: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          property_id: string
          start_date: string
          user_id?: string
          workspace_id?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          property_id?: string
          start_date?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          display_name: string
          joined_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          display_name?: string
          joined_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          display_name?: string
          joined_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_workspace: { Args: never; Returns: string }
      generate_recurring_rent: { Args: never; Returns: number }
      join_workspace: { Args: { _code: string }; Returns: string }
      my_workspace_id: { Args: never; Returns: string }
      shares_workspace: { Args: { _folder: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
