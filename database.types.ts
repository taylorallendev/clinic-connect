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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audio_files: {
        Row: {
          bit_rate: number | null
          channels: number | null
          created_at: string | null
          duration: number
          file_path: string
          file_size: number
          filename: string
          format: string
          id: string
          sample_rate: number | null
          transcription_id: string | null
          updated_at: string | null
        }
        Insert: {
          bit_rate?: number | null
          channels?: number | null
          created_at?: string | null
          duration: number
          file_path: string
          file_size: number
          filename: string
          format: string
          id?: string
          sample_rate?: number | null
          transcription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bit_rate?: number | null
          channels?: number | null
          created_at?: string | null
          duration?: number
          file_path?: string
          file_size?: number
          filename?: string
          format?: string
          id?: string
          sample_rate?: number | null
          transcription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_files_transcription_id_fkey"
            columns: ["transcription_id"]
            isOneToOne: false
            referencedRelation: "transcriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["CaseStatus"] | null
          type: Database["public"]["Enums"]["CaseType"] | null
          updated_at: string | null
          user_id: string | null
          visibility: Database["public"]["Enums"]["CaseVisibility"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["CaseStatus"] | null
          type?: Database["public"]["Enums"]["CaseType"] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: Database["public"]["Enums"]["CaseVisibility"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["CaseStatus"] | null
          type?: Database["public"]["Enums"]["CaseType"] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: Database["public"]["Enums"]["CaseVisibility"] | null
        }
        Relationships: []
      }
      generations: {
        Row: {
          case_id: string | null
          content: string | null
          created_at: string
          id: string
          prompt: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          case_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          prompt?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          case_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          prompt?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          case_id: string | null
          created_at: string
          id: string
          name: string
          owner_name: string
          updated_at: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          name: string
          owner_name: string
          updated_at?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      soap_notes: {
        Row: {
          assessment: string | null
          case_id: string | null
          created_at: string
          id: string
          objective: string | null
          plan: string | null
          subjective: string | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          assessment?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          objective?: string | null
          plan?: string | null
          subjective?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          objective?: string | null
          plan?: string | null
          subjective?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soap_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          model: string | null
          name: string | null
          prompt: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          name?: string | null
          prompt?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          name?: string | null
          prompt?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transcriptions: {
        Row: {
          audio_file_id: string | null
          case_id: string | null
          created_at: string
          id: string
          processing_status: string | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          audio_file_id?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          processing_status?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_file_id?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          processing_status?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_audio_file_id_fkey"
            columns: ["audio_file_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcriptions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_usage_limit: {
        Args: { resource: string; user_uuid: string }
        Returns: boolean
      }
      get_current_usage: {
        Args: { user_uuid: string }
        Returns: {
          period_end: string
          period_start: string
          quantity: number
          resource_type: string
        }[]
      }
      track_usage: {
        Args: { amount?: number; resource: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      CaseStatus: "reviewed" | "ongoing" | "completed"
      CaseType: "checkup" | "emergency" | "surgery" | "follow_up"
      CaseVisibility: "public" | "private"
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
      CaseStatus: ["reviewed", "ongoing", "completed"],
      CaseType: ["checkup", "emergency", "surgery", "follow_up"],
      CaseVisibility: ["public", "private"],
    },
  },
} as const
