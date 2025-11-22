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
      academic_work_types: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      banner_images: {
        Row: {
          aspect_ratio: string | null
          banner_id: string | null
          created_at: string | null
          crop_data: Json | null
          id: string
          image_url: string
          position_data: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          banner_id?: string | null
          created_at?: string | null
          crop_data?: Json | null
          id?: string
          image_url: string
          position_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          banner_id?: string | null
          created_at?: string | null
          crop_data?: Json | null
          id?: string
          image_url?: string
          position_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_images_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "banner_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_template_presets: {
        Row: {
          colors: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          layout_config: Json
          name: string
          structure: Json
          thumbnail_url: string | null
          typography: Json
          updated_at: string | null
        }
        Insert: {
          colors: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          layout_config: Json
          name: string
          structure: Json
          thumbnail_url?: string | null
          typography: Json
          updated_at?: string | null
        }
        Update: {
          colors?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          layout_config?: Json
          name?: string
          structure?: Json
          thumbnail_url?: string | null
          typography?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      banner_templates: {
        Row: {
          content: Json
          created_at: string | null
          default_institution_name: string | null
          default_logo_url: string | null
          id: string
          is_public: boolean | null
          latex_template: string
          share_token: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          views_count: number | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          default_institution_name?: string | null
          default_logo_url?: string | null
          id?: string
          is_public?: boolean | null
          latex_template: string
          share_token?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          default_institution_name?: string | null
          default_logo_url?: string | null
          id?: string
          is_public?: boolean | null
          latex_template?: string
          share_token?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      banner_work_images: {
        Row: {
          adjustments: Json | null
          caption: string | null
          column_position: number | null
          created_at: string | null
          crop_data: Json | null
          display_order: number
          dpi: number | null
          height_cm: number | null
          id: string
          image_type: string | null
          original_height: number | null
          original_width: number | null
          rotation: number | null
          section: string | null
          source: string | null
          storage_path: string
          updated_at: string | null
          user_id: string
          width_cm: number | null
          work_id: string
        }
        Insert: {
          adjustments?: Json | null
          caption?: string | null
          column_position?: number | null
          created_at?: string | null
          crop_data?: Json | null
          display_order?: number
          dpi?: number | null
          height_cm?: number | null
          id?: string
          image_type?: string | null
          original_height?: number | null
          original_width?: number | null
          rotation?: number | null
          section?: string | null
          source?: string | null
          storage_path: string
          updated_at?: string | null
          user_id: string
          width_cm?: number | null
          work_id: string
        }
        Update: {
          adjustments?: Json | null
          caption?: string | null
          column_position?: number | null
          created_at?: string | null
          crop_data?: Json | null
          display_order?: number
          dpi?: number | null
          height_cm?: number | null
          id?: string
          image_type?: string | null
          original_height?: number | null
          original_width?: number | null
          rotation?: number | null
          section?: string | null
          source?: string | null
          storage_path?: string
          updated_at?: string | null
          user_id?: string
          width_cm?: number | null
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banner_work_images_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "work_in_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          performed_by?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          cookie_consent: boolean | null
          cookie_consent_date: string | null
          created_at: string | null
          has_seen_tutorial: boolean | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cookie_consent?: boolean | null
          cookie_consent_date?: string | null
          created_at?: string | null
          has_seen_tutorial?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cookie_consent?: boolean | null
          cookie_consent_date?: string | null
          created_at?: string | null
          has_seen_tutorial?: boolean | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          section_name: string
          updated_at: string | null
          user_email: string
          user_id: string
          work_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          section_name: string
          updated_at?: string | null
          user_email: string
          user_id: string
          work_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          section_name?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_comments_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "work_in_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      work_in_progress: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          last_modified: string | null
          share_token: string | null
          title: string
          user_id: string
          work_type: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          last_modified?: string | null
          share_token?: string | null
          title?: string
          user_id: string
          work_type: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          last_modified?: string | null
          share_token?: string | null
          title?: string
          user_id?: string
          work_type?: string
        }
        Relationships: []
      }
      work_shares: {
        Row: {
          created_at: string | null
          id: string
          permission: Database["public"]["Enums"]["share_permission"]
          shared_by: string
          shared_with_email: string
          updated_at: string | null
          work_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["share_permission"]
          shared_by: string
          shared_with_email: string
          updated_at?: string | null
          work_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["share_permission"]
          shared_by?: string
          shared_with_email?: string
          updated_at?: string | null
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_shares_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "work_in_progress"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_user_role: {
        Args: {
          _manager_id: string
          _target_role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: boolean
      }
      can_view_shared_work: {
        Args: { _user_id: string; _work_id: string }
        Returns: boolean
      }
      generate_share_token: { Args: never; Returns: string }
      generate_work_share_token: { Args: never; Returns: string }
      get_shared_work: {
        Args: { p_token: string }
        Returns: {
          content: Json | null
          created_at: string | null
          id: string
          last_modified: string | null
          share_token: string | null
          title: string
          user_id: string
          work_type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "work_in_progress"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_works_by_title: {
        Args: { p_search_term: string; p_user_id: string }
        Returns: {
          id: string
          last_modified: string
          title: string
          work_type: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
      share_permission: "viewer" | "editor" | "commenter"
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
      app_role: ["admin", "user", "moderator"],
      share_permission: ["viewer", "editor", "commenter"],
    },
  },
} as const
