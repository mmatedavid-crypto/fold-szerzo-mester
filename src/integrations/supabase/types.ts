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
      acceptance_documents: {
        Row: {
          claimant_snapshot: Json
          computed_rank: number
          created_at: string
          document_hash: string
          document_number: string
          draft_id: string | null
          id: string
          issued_at: string
          notice_snapshot: Json
          pdf_file_path: string
          rank_rules_version: string
          updated_at: string
          user_id: string
          verification_token: string
        }
        Insert: {
          claimant_snapshot: Json
          computed_rank: number
          created_at?: string
          document_hash: string
          document_number: string
          draft_id?: string | null
          id?: string
          issued_at?: string
          notice_snapshot: Json
          pdf_file_path: string
          rank_rules_version: string
          updated_at?: string
          user_id: string
          verification_token: string
        }
        Update: {
          claimant_snapshot?: Json
          computed_rank?: number
          created_at?: string
          document_hash?: string
          document_number?: string
          draft_id?: string | null
          id?: string
          issued_at?: string
          notice_snapshot?: Json
          pdf_file_path?: string
          rank_rules_version?: string
          updated_at?: string
          user_id?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "acceptance_documents_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "acceptance_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      acceptance_drafts: {
        Row: {
          claimant_data: Json
          computed_branch: string | null
          computed_rank: number | null
          computed_reason: string | null
          computed_warnings: Json
          created_at: string
          deadline_date: string | null
          id: string
          notice_id: string | null
          notice_snapshot: Json
          rank_rules_version: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimant_data: Json
          computed_branch?: string | null
          computed_rank?: number | null
          computed_reason?: string | null
          computed_warnings?: Json
          created_at?: string
          deadline_date?: string | null
          id?: string
          notice_id?: string | null
          notice_snapshot: Json
          rank_rules_version?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimant_data?: Json
          computed_branch?: string | null
          computed_rank?: number | null
          computed_reason?: string | null
          computed_warnings?: Json
          created_at?: string
          deadline_date?: string | null
          id?: string
          notice_id?: string | null
          notice_snapshot?: Json
          rank_rules_version?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acceptance_drafts_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
        ]
      }
      acceptance_verifications: {
        Row: {
          created_at: string
          document_hash: string
          document_id: string
          id: string
          issued_at: string
          parcel_numbers: string[] | null
          settlement: string | null
          token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          document_hash: string
          document_id: string
          id?: string
          issued_at: string
          parcel_numbers?: string[] | null
          settlement?: string | null
          token: string
          view_count?: number
        }
        Update: {
          created_at?: string
          document_hash?: string
          document_id?: string
          id?: string
          issued_at?: string
          parcel_numbers?: string[] | null
          settlement?: string | null
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "acceptance_verifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "acceptance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      clauses: {
        Row: {
          active: boolean
          category: string
          clause_key: string
          conditions: Json
          created_at: string
          id: string
          legal_template_version_id: string
          sort_order: number
          text: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          clause_key: string
          conditions?: Json
          created_at?: string
          id?: string
          legal_template_version_id: string
          sort_order?: number
          text: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          clause_key?: string
          conditions?: Json
          created_at?: string
          id?: string
          legal_template_version_id?: string
          sort_order?: number
          text?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clauses_legal_template_version_id_fkey"
            columns: ["legal_template_version_id"]
            isOneToOne: false
            referencedRelation: "legal_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_drafts: {
        Row: {
          clauses: Json
          core_hash: string | null
          created_at: string
          id: string
          lessee_data: Json
          lessor_data: Json
          parcels: Json
          prelease: Json
          rent: Json
          risk_report: Json | null
          status: string
          term: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clauses?: Json
          core_hash?: string | null
          created_at?: string
          id?: string
          lessee_data?: Json
          lessor_data?: Json
          parcels?: Json
          prelease?: Json
          rent?: Json
          risk_report?: Json | null
          status?: string
          term?: Json
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clauses?: Json
          core_hash?: string | null
          created_at?: string
          id?: string
          lessee_data?: Json
          lessor_data?: Json
          parcels?: Json
          prelease?: Json
          rent?: Json
          risk_report?: Json | null
          status?: string
          term?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_credits: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          payment_id: string | null
          source_type: string
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          payment_id?: string | null
          source_type: string
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          payment_id?: string | null
          source_type?: string
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_verifications: {
        Row: {
          checked_at: string
          document_hash: string | null
          document_id: string | null
          document_number: string | null
          id: string
          ip_address: string | null
          result: string
        }
        Insert: {
          checked_at?: string
          document_hash?: string | null
          document_id?: string | null
          document_number?: string | null
          id?: string
          ip_address?: string | null
          result: string
        }
        Update: {
          checked_at?: string
          document_hash?: string | null
          document_id?: string | null
          document_number?: string | null
          id?: string
          ip_address?: string | null
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_verifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "generated_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          clause_version: string
          core_hash: string
          document_hash: string
          document_number: string
          draft_id: string | null
          finalized_at: string
          id: string
          legal_template_version: string
          lessee_name: string | null
          lessor_name: string | null
          parcel_numbers: string[] | null
          pdf_file_path: string | null
          settlement: string | null
          user_id: string
          verification_status: string
        }
        Insert: {
          clause_version: string
          core_hash: string
          document_hash: string
          document_number: string
          draft_id?: string | null
          finalized_at?: string
          id?: string
          legal_template_version: string
          lessee_name?: string | null
          lessor_name?: string | null
          parcel_numbers?: string[] | null
          pdf_file_path?: string | null
          settlement?: string | null
          user_id: string
          verification_status?: string
        }
        Update: {
          clause_version?: string
          core_hash?: string
          document_hash?: string
          document_number?: string
          draft_id?: string | null
          finalized_at?: string
          id?: string
          legal_template_version?: string
          lessee_name?: string | null
          lessor_name?: string | null
          parcel_numbers?: string[] | null
          pdf_file_path?: string | null
          settlement?: string | null
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "contract_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_template_versions: {
        Row: {
          created_at: string
          effective_from: string | null
          id: string
          legal_sources: string | null
          notes: string | null
          status: string
          version: string
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          id?: string
          legal_sources?: string | null
          notes?: string | null
          status?: string
          version: string
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          id?: string
          legal_sources?: string | null
          notes?: string | null
          status?: string
          version?: string
        }
        Relationships: []
      }
      notice_subscriptions: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          last_sent_at: string | null
          settlement_clean: string
          status: string
          unsubscribe_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          last_sent_at?: string | null
          settlement_clean: string
          status?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          last_sent_at?: string | null
          settlement_clean?: string
          status?: string
          unsubscribe_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          area_ha: number | null
          area_raw: string | null
          county: string | null
          cultivation_branch: string | null
          deadline_date: string | null
          id: string
          last_fetched_at: string
          municipality: string | null
          notice_type: string | null
          original_attachment_url: string | null
          original_detail_url: string | null
          parcel_numbers: string[] | null
          price_raw: string | null
          publication_date: string | null
          raw_json: Json | null
          rent_normalized_huf_per_ha_year: number | null
          rent_raw: string | null
          rent_unit: string | null
          settlement: string | null
          source: string
          source_attachment_id: string | null
          source_notice_id: string | null
          subject: string | null
        }
        Insert: {
          area_ha?: number | null
          area_raw?: string | null
          county?: string | null
          cultivation_branch?: string | null
          deadline_date?: string | null
          id?: string
          last_fetched_at?: string
          municipality?: string | null
          notice_type?: string | null
          original_attachment_url?: string | null
          original_detail_url?: string | null
          parcel_numbers?: string[] | null
          price_raw?: string | null
          publication_date?: string | null
          raw_json?: Json | null
          rent_normalized_huf_per_ha_year?: number | null
          rent_raw?: string | null
          rent_unit?: string | null
          settlement?: string | null
          source?: string
          source_attachment_id?: string | null
          source_notice_id?: string | null
          subject?: string | null
        }
        Update: {
          area_ha?: number | null
          area_raw?: string | null
          county?: string | null
          cultivation_branch?: string | null
          deadline_date?: string | null
          id?: string
          last_fetched_at?: string
          municipality?: string | null
          notice_type?: string | null
          original_attachment_url?: string | null
          original_detail_url?: string | null
          parcel_numbers?: string[] | null
          price_raw?: string | null
          publication_date?: string | null
          raw_json?: Json | null
          rent_normalized_huf_per_ha_year?: number | null
          rent_raw?: string | null
          rent_unit?: string | null
          settlement?: string | null
          source?: string
          source_attachment_id?: string | null
          source_notice_id?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_huf: number
          created_at: string
          currency: string
          draft_id: string | null
          id: string
          paid_at: string | null
          plan_id: string | null
          product_type: string
          provider: string
          provider_payment_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_huf: number
          created_at?: string
          currency?: string
          draft_id?: string | null
          id?: string
          paid_at?: string | null
          plan_id?: string | null
          product_type: string
          provider: string
          provider_payment_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_huf?: number
          created_at?: string
          currency?: string
          draft_id?: string | null
          id?: string
          paid_at?: string | null
          plan_id?: string | null
          product_type?: string
          provider?: string
          provider_payment_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "contract_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          annual_quota: number
          created_at: string
          description: string | null
          id: string
          monthly_price_huf: number
          name: string
          price_label: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          annual_quota: number
          created_at?: string
          description?: string | null
          id?: string
          monthly_price_huf: number
          name: string
          price_label?: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          annual_quota?: number
          created_at?: string
          description?: string | null
          id?: string
          monthly_price_huf?: number
          name?: string
          price_label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      rank_rules: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          rules: Json
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          rules: Json
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          rules?: Json
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          annual_quota: number
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          payment_provider: string | null
          plan_id: string
          provider_subscription_id: string | null
          quota_period_end: string
          quota_period_start: string
          status: string
          updated_at: string
          used_quota: number
          user_id: string
        }
        Insert: {
          annual_quota: number
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          payment_provider?: string | null
          plan_id: string
          provider_subscription_id?: string | null
          quota_period_end: string
          quota_period_start?: string
          status?: string
          updated_at?: string
          used_quota?: number
          user_id: string
        }
        Update: {
          annual_quota?: number
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_provider?: string | null
          plan_id?: string
          provider_subscription_id?: string | null
          quota_period_end?: string
          quota_period_start?: string
          status?: string
          updated_at?: string
          used_quota?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
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
      users_profile: {
        Row: {
          billing_address: string | null
          billing_name: string | null
          billing_type: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          tax_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          billing_name?: string | null
          billing_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: string | null
          billing_name?: string | null
          billing_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_settlement: { Args: { _raw: string }; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      finalize_document: {
        Args: {
          _clause_version: string
          _core_hash: string
          _document_hash: string
          _document_number: string
          _draft_id: string
          _lessee_name: string
          _lessor_name: string
          _parcel_numbers: string[]
          _pdf_file_path: string
          _settlement: string
          _template_version: string
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
