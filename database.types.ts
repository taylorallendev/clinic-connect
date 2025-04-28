export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cases: {
        Row: {
          created_at: string | null
          id: string
          status: Database["public"]["Enums"]["CaseStatus"] | null
          type: Database["public"]["Enums"]["CaseType"] | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["CaseVisibility"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["CaseStatus"] | null
          type?: Database["public"]["Enums"]["CaseType"] | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["CaseVisibility"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["CaseStatus"] | null
          type?: Database["public"]["Enums"]["CaseType"] | null
          updated_at?: string | null
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
          name: string | null
          owner_name: string | null
          updated_at: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          name?: string | null
          owner_name?: string | null
          updated_at?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          name?: string | null
          owner_name?: string | null
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
          case_id: string | null
          created_at: string
          id: string
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          id?: string
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string
          id?: string
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
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
      [_ in never]: never
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
