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
      complaint_events: {
        Row: {
          actor_id: string | null
          complaint_id: string
          created_at: string
          event_type: string
          id: string
          message: string | null
          metadata: Json | null
        }
        Insert: {
          actor_id?: string | null
          complaint_id: string
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json | null
        }
        Update: {
          actor_id?: string | null
          complaint_id?: string
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_events_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          ai_confidence: number | null
          ai_detected_category: string | null
          ai_severity: string | null
          ai_verification: Json | null
          assigned_worker: string | null
          category: string
          citizen_id: string | null
          citizen_name: string | null
          created_at: string
          department: string | null
          description: string | null
          display_id: string | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          priority: string
          resolution_time_hours: number | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          updated_at: string
          ward: string | null
          worker_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_detected_category?: string | null
          ai_severity?: string | null
          ai_verification?: Json | null
          assigned_worker?: string | null
          category: string
          citizen_id?: string | null
          citizen_name?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          display_id?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          priority?: string
          resolution_time_hours?: number | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
          ward?: string | null
          worker_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_detected_category?: string | null
          ai_severity?: string | null
          ai_verification?: Json | null
          assigned_worker?: string | null
          category?: string
          citizen_id?: string | null
          citizen_name?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          display_id?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          priority?: string
          resolution_time_hours?: number | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
          ward?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          avg_resolution_time: number
          contact: string | null
          created_at: string
          head: string | null
          id: string
          name: string
          trust_score: number
        }
        Insert: {
          avg_resolution_time?: number
          contact?: string | null
          created_at?: string
          head?: string | null
          id?: string
          name: string
          trust_score?: number
        }
        Update: {
          avg_resolution_time?: number
          contact?: string | null
          created_at?: string
          head?: string | null
          id?: string
          name?: string
          trust_score?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          complaint_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          recipient_id: string | null
          title: string
        }
        Insert: {
          audience: string
          complaint_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          recipient_id?: string | null
          title: string
        }
        Update: {
          audience?: string
          complaint_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          recipient_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: string[]
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          points: number
          updated_at: string
          user_id: string
          ward: string | null
        }
        Insert: {
          avatar_url?: string | null
          badges?: string[]
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          points?: number
          updated_at?: string
          user_id: string
          ward?: string | null
        }
        Update: {
          avatar_url?: string | null
          badges?: string[]
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          points?: number
          updated_at?: string
          user_id?: string
          ward?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_notes: string | null
          ai_verification: Json | null
          approved: boolean | null
          complaint_id: string
          completed_at: string
          id: string
          repair_image_url: string | null
          reviewed: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          worker_id: string | null
          worker_notes: string | null
          worker_user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          ai_verification?: Json | null
          approved?: boolean | null
          complaint_id: string
          completed_at?: string
          id?: string
          repair_image_url?: string | null
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          worker_id?: string | null
          worker_notes?: string | null
          worker_user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          ai_verification?: Json | null
          approved?: boolean | null
          complaint_id?: string
          completed_at?: string
          id?: string
          repair_image_url?: string | null
          reviewed?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          worker_id?: string | null
          worker_notes?: string | null
          worker_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
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
      workers: {
        Row: {
          active_tasks: number
          completed_tasks: number
          created_at: string
          department: string
          id: string
          name: string
          phone: string | null
          rating: number
          status: string
          user_id: string | null
          ward: string | null
        }
        Insert: {
          active_tasks?: number
          completed_tasks?: number
          created_at?: string
          department: string
          id?: string
          name: string
          phone?: string | null
          rating?: number
          status?: string
          user_id?: string | null
          ward?: string | null
        }
        Update: {
          active_tasks?: number
          completed_tasks?: number
          created_at?: string
          department?: string
          id?: string
          name?: string
          phone?: string | null
          rating?: number
          status?: string
          user_id?: string | null
          ward?: string | null
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
      app_role: "citizen" | "worker" | "authority"
      complaint_status:
        | "submitted"
        | "assigned"
        | "in_progress"
        | "under_review"
        | "rework_required"
        | "completed"
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
      app_role: ["citizen", "worker", "authority"],
      complaint_status: [
        "submitted",
        "assigned",
        "in_progress",
        "under_review",
        "rework_required",
        "completed",
      ],
    },
  },
} as const
