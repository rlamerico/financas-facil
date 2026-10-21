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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_type: string | null
          balance: number | null
          bank_name: string | null
          created_at: string | null
          id: string
          name: string
          profile_id: string
        }
        Insert: {
          account_type?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          name: string
          profile_id: string
        }
        Update: {
          account_type?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          actual_amount: number | null
          category_id: string
          created_at: string | null
          id: string
          month: number
          planned_amount: number | null
          profile_id: string
          updated_at: string | null
          year: number
        }
        Insert: {
          actual_amount?: number | null
          category_id: string
          created_at?: string | null
          id?: string
          month: number
          planned_amount?: number | null
          profile_id: string
          updated_at?: string | null
          year: number
        }
        Update: {
          actual_amount?: number | null
          category_id?: string
          created_at?: string | null
          id?: string
          month?: number
          planned_amount?: number | null
          profile_id?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_clients: {
        Row: {
          company_id: string
          country: string | null
          created_at: string | null
          default_currency: string
          document: string | null
          id: string
          name: string
          origin: string
        }
        Insert: {
          company_id: string
          country?: string | null
          created_at?: string | null
          default_currency: string
          document?: string | null
          id?: string
          name: string
          origin: string
        }
        Update: {
          company_id?: string
          country?: string | null
          created_at?: string | null
          default_currency?: string
          document?: string | null
          id?: string
          name?: string
          origin?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_receipts: {
        Row: {
          amount_brl: number
          amount_original: number
          attachment_url: string | null
          client_id: string
          company_id: string
          created_at: string | null
          currency: string
          exchange_rate: number | null
          id: string
          invoice_ref: string | null
          notes: string | null
          ptax_rate: number | null
          received_on: string
          status: string
        }
        Insert: {
          amount_brl: number
          amount_original: number
          attachment_url?: string | null
          client_id: string
          company_id: string
          created_at?: string | null
          currency: string
          exchange_rate?: number | null
          id?: string
          invoice_ref?: string | null
          notes?: string | null
          ptax_rate?: number | null
          received_on: string
          status?: string
        }
        Update: {
          amount_brl?: number
          amount_original?: number
          attachment_url?: string | null
          client_id?: string
          company_id?: string
          created_at?: string | null
          currency?: string
          exchange_rate?: number | null
          id?: string
          invoice_ref?: string | null
          notes?: string | null
          ptax_rate?: number | null
          received_on?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_receipts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "business_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      card_aliases: {
        Row: {
          alias: string
          card_id: string
          created_at: string | null
          id: string
          profile_id: string
        }
        Insert: {
          alias: string
          card_id: string
          created_at?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          alias?: string
          card_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_aliases_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_aliases_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_entries: {
        Row: {
          amount: number
          amount_usd: number | null
          card_id: string
          category_id: string | null
          category_label: string | null
          created_at: string | null
          description: string
          excluded_by: string | null
          exclusion_reason: string | null
          exclusion_rule_id: string | null
          fingerprint: string
          fx_rate: number | null
          id: string
          installment_current: number | null
          installment_total: number | null
          is_excluded: boolean
          profile_id: string
          purchase_date: string
          raw_installment: string | null
          statement_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_usd?: number | null
          card_id: string
          category_id?: string | null
          category_label?: string | null
          created_at?: string | null
          description: string
          excluded_by?: string | null
          exclusion_reason?: string | null
          exclusion_rule_id?: string | null
          fingerprint: string
          fx_rate?: number | null
          id?: string
          installment_current?: number | null
          installment_total?: number | null
          is_excluded?: boolean
          profile_id: string
          purchase_date: string
          raw_installment?: string | null
          statement_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_usd?: number | null
          card_id?: string
          category_id?: string | null
          category_label?: string | null
          created_at?: string | null
          description?: string
          excluded_by?: string | null
          exclusion_reason?: string | null
          exclusion_rule_id?: string | null
          fingerprint?: string
          fx_rate?: number | null
          id?: string
          installment_current?: number | null
          installment_total?: number | null
          is_excluded?: boolean
          profile_id?: string
          purchase_date?: string
          raw_installment?: string | null
          statement_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_entries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_entries_exclusion_rule_id_fkey"
            columns: ["exclusion_rule_id"]
            isOneToOne: false
            referencedRelation: "card_exclusion_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_entries_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "card_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      card_exclusion_rules: {
        Row: {
          card_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          match_type: string
          match_value: string | null
          name: string
          profile_id: string
        }
        Insert: {
          card_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          match_type: string
          match_value?: string | null
          name: string
          profile_id: string
        }
        Update: {
          card_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          match_type?: string
          match_value?: string | null
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_exclusion_rules_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_exclusion_rules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_statements: {
        Row: {
          card_id: string
          id: string
          imported_at: string | null
          profile_id: string
          reference_month: number
          reference_year: number
          source_file_name: string | null
          source_sheet_name: string | null
        }
        Insert: {
          card_id: string
          id?: string
          imported_at?: string | null
          profile_id: string
          reference_month: number
          reference_year: number
          source_file_name?: string | null
          source_sheet_name?: string | null
        }
        Update: {
          card_id?: string
          id?: string
          imported_at?: string | null
          profile_id?: string
          reference_month?: number
          reference_year?: number
          source_file_name?: string | null
          source_sheet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_statements_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_statements_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          profile_id: string | null
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          profile_id?: string | null
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          profile_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string
          created_at: string | null
          id: string
          legal_name: string
          profile_id: string
          regime: string
          trade_name: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          id?: string
          legal_name: string
          profile_id: string
          regime: string
          trade_name?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          id?: string
          legal_name?: string
          profile_id?: string
          regime?: string
          trade_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          card_group: string
          color: string | null
          created_at: string | null
          holder_label: string | null
          id: string
          is_active: boolean
          issuer: string | null
          last_four: string
          name: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          card_group?: string
          color?: string | null
          created_at?: string | null
          holder_label?: string | null
          id?: string
          is_active?: boolean
          issuer?: string | null
          last_four: string
          name: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          card_group?: string
          color?: string | null
          created_at?: string | null
          holder_label?: string | null
          id?: string
          is_active?: boolean
          issuer?: string | null
          last_four?: string
          name?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations_log: {
        Row: {
          executed_at: string | null
          id: string
          payload: Json | null
          profile_id: string | null
          source: string
          status: string | null
        }
        Insert: {
          executed_at?: string | null
          id?: string
          payload?: Json | null
          profile_id?: string | null
          source: string
          status?: string | null
        }
        Update: {
          executed_at?: string | null
          id?: string
          payload?: Json | null
          profile_id?: string | null
          source?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrations_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          asset_name: string
          asset_type: string
          average_price: number
          created_at: string | null
          current_price: number | null
          id: string
          last_updated: string | null
          profile_id: string
          quantity: number
        }
        Insert: {
          asset_name: string
          asset_type: string
          average_price: number
          created_at?: string | null
          current_price?: number | null
          id?: string
          last_updated?: string | null
          profile_id: string
          quantity: number
        }
        Update: {
          asset_name?: string
          asset_type?: string
          average_price?: number
          created_at?: string | null
          current_price?: number | null
          id?: string
          last_updated?: string | null
          profile_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "investments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string | null
          date: string
          description: string
          external_ref: string | null
          id: string
          payment_method: string | null
          profile_id: string
          source: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string | null
          date: string
          description: string
          external_ref?: string | null
          id?: string
          payment_method?: string | null
          profile_id: string
          source?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          external_ref?: string | null
          id?: string
          payment_method?: string | null
          profile_id?: string
          source?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      card_monthly_summary: {
        Row: {
          card_id: string | null
          entries_count: number | null
          excluded_count: number | null
          profile_id: string | null
          reference_month: number | null
          reference_year: number | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_entries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
