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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      github_integrations: {
        Row: {
          access_token: string | null
          block_on_critical: boolean
          block_threshold: number
          created_at: string
          id: string
          installation_id: string
          is_active: boolean
          repository_full_name: string
          updated_at: string
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          access_token?: string | null
          block_on_critical?: boolean
          block_threshold?: number
          created_at?: string
          id?: string
          installation_id: string
          is_active?: boolean
          repository_full_name: string
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          access_token?: string | null
          block_on_critical?: boolean
          block_threshold?: number
          created_at?: string
          id?: string
          installation_id?: string
          is_active?: boolean
          repository_full_name?: string
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          explanation_level: Database["public"]["Enums"]["explanation_level"]
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          explanation_level?: Database["public"]["Enums"]["explanation_level"]
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          explanation_level?: Database["public"]["Enums"]["explanation_level"]
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_baselines: {
        Row: {
          baseline_scan_id: string | null
          created_at: string
          id: string
          is_active: boolean
          issue_hashes: string[] | null
          name: string
          user_id: string
        }
        Insert: {
          baseline_scan_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          issue_hashes?: string[] | null
          name?: string
          user_id: string
        }
        Update: {
          baseline_scan_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          issue_hashes?: string[] | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_baselines_baseline_scan_id_fkey"
            columns: ["baseline_scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_feedback: {
        Row: {
          created_at: string
          feedback_note: string | null
          id: string
          is_false_positive: boolean
          issue_title: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          scan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_note?: string | null
          id?: string
          is_false_positive?: boolean
          issue_title: string
          issue_type: Database["public"]["Enums"]["issue_type"]
          scan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_note?: string | null
          id?: string
          is_false_positive?: boolean
          issue_title?: string
          issue_type?: Database["public"]["Enums"]["issue_type"]
          scan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_feedback_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_history: {
        Row: {
          code_hash: string
          created_at: string
          critical_count: number
          fixed_code: string | null
          fixed_issues_count: number | null
          high_count: number
          id: string
          issues: Json
          issues_count: number
          language: string
          low_count: number
          medium_count: number
          new_issues_count: number | null
          policy_id: string | null
          policy_passed: boolean | null
          previous_scan_id: string | null
          score: number
          static_checks: Json | null
          summary: string | null
          user_id: string
          vulnerability_hashes: string[] | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          critical_count?: number
          fixed_code?: string | null
          fixed_issues_count?: number | null
          high_count?: number
          id?: string
          issues?: Json
          issues_count?: number
          language: string
          low_count?: number
          medium_count?: number
          new_issues_count?: number | null
          policy_id?: string | null
          policy_passed?: boolean | null
          previous_scan_id?: string | null
          score: number
          static_checks?: Json | null
          summary?: string | null
          user_id: string
          vulnerability_hashes?: string[] | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          critical_count?: number
          fixed_code?: string | null
          fixed_issues_count?: number | null
          high_count?: number
          id?: string
          issues?: Json
          issues_count?: number
          language?: string
          low_count?: number
          medium_count?: number
          new_issues_count?: number | null
          policy_id?: string | null
          policy_passed?: boolean | null
          previous_scan_id?: string | null
          score?: number
          static_checks?: Json | null
          summary?: string | null
          user_id?: string
          vulnerability_hashes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "security_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_history_previous_scan_id_fkey"
            columns: ["previous_scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      security_policies: {
        Row: {
          created_at: string
          id: string
          ignore_paths: string[] | null
          is_active: boolean
          max_critical: number
          max_high: number
          max_low: number | null
          max_medium: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ignore_paths?: string[] | null
          is_active?: boolean
          max_critical?: number
          max_high?: number
          max_low?: number | null
          max_medium?: number
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ignore_paths?: string[] | null
          is_active?: boolean
          max_critical?: number
          max_high?: number
          max_low?: number | null
          max_medium?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_reports: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          scan_id: string
          share_token: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          scan_id: string
          share_token: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          scan_id?: string
          share_token?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_reports_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_history"
            referencedColumns: ["id"]
          },
        ]
      }
      suppression_rules: {
        Row: {
          created_at: string
          expires_at: string | null
          file_path: string | null
          id: string
          is_active: boolean
          issue_title: string | null
          issue_type: string
          reason: string | null
          scope: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          issue_title?: string | null
          issue_type: string
          reason?: string | null
          scope?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          issue_title?: string | null
          issue_type?: string
          reason?: string | null
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          billing_period_start: string
          created_at: string
          id: string
          scans_limit: number
          scans_this_month: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period_start?: string
          created_at?: string
          id?: string
          scans_limit?: number
          scans_this_month?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period_start?: string
          created_at?: string
          id?: string
          scans_limit?: number
          scans_this_month?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      explanation_level: "junior" | "senior" | "lead"
      issue_type: "vulnerability" | "bug" | "code_smell" | "performance"
      scan_severity: "critical" | "high" | "medium" | "low"
      subscription_tier: "free" | "pro" | "team" | "enterprise"
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
      app_role: ["admin", "moderator", "user"],
      explanation_level: ["junior", "senior", "lead"],
      issue_type: ["vulnerability", "bug", "code_smell", "performance"],
      scan_severity: ["critical", "high", "medium", "low"],
      subscription_tier: ["free", "pro", "team", "enterprise"],
    },
  },
} as const
