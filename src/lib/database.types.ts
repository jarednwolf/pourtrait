// Generated types for Supabase database schema
// This file should be regenerated when the database schema changes
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      consumption_history: {
        Row: {
          companions: string[] | null
          consumed_at: string
          created_at: string
          food_pairing: string | null
          id: string
          notes: string | null
          occasion: string | null
          rating: number | null
          user_id: string
          wine_id: string
        }
        Insert: {
          companions?: string[] | null
          consumed_at: string
          created_at?: string
          food_pairing?: string | null
          id?: string
          notes?: string | null
          occasion?: string | null
          rating?: number | null
          user_id: string
          wine_id: string
        }
        Update: {
          companions?: string[] | null
          consumed_at?: string
          created_at?: string
          food_pairing?: string | null
          id?: string
          notes?: string | null
          occasion?: string | null
          rating?: number | null
          user_id?: string
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumption_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumption_history_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          }
        ]
      }
      drinking_partners: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          taste_profile: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          taste_profile?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          taste_profile?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drinking_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      recommendations: {
        Row: {
          confidence: number
          context: Json | null
          created_at: string
          id: string
          reasoning: string
          suggested_wine: Json | null
          type: string
          user_feedback: string | null
          user_id: string
          wine_id: string | null
        }
        Insert: {
          confidence: number
          context?: Json | null
          created_at?: string
          id?: string
          reasoning: string
          suggested_wine?: Json | null
          type: string
          user_feedback?: string | null
          user_id: string
          wine_id?: string | null
        }
        Update: {
          confidence?: number
          context?: Json | null
          created_at?: string
          id?: string
          reasoning?: string
          suggested_wine?: Json | null
          type?: string
          user_feedback?: string | null
          user_id?: string
          wine_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          }
        ]
      }
      taste_profiles: {
        Row: {
          confidence_score: number | null
          general_preferences: Json | null
          last_updated: string | null
          learning_history: Json | null
          red_wine_preferences: Json | null
          sparkling_preferences: Json | null
          user_id: string
          white_wine_preferences: Json | null
        }
        Insert: {
          confidence_score?: number | null
          general_preferences?: Json | null
          last_updated?: string | null
          learning_history?: Json | null
          red_wine_preferences?: Json | null
          sparkling_preferences?: Json | null
          user_id: string
          white_wine_preferences?: Json | null
        }
        Update: {
          confidence_score?: number | null
          general_preferences?: Json | null
          last_updated?: string | null
          learning_history?: Json | null
          red_wine_preferences?: Json | null
          sparkling_preferences?: Json | null
          user_id?: string
          white_wine_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "taste_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          experience_level: string
          id: string
          name: string
          onboarding_completed: boolean | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          experience_level: string
          id: string
          name: string
          onboarding_completed?: boolean | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          experience_level?: string
          id?: string
          name?: string
          onboarding_completed?: boolean | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      wines: {
        Row: {
          country: string
          created_at: string | null
          drinking_window: Json
          external_data: Json | null
          id: string
          image_url: string | null
          name: string
          personal_notes: string | null
          personal_rating: number | null
          producer: string
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          region: string
          type: string
          updated_at: string | null
          user_id: string
          varietal: string[]
          vintage: number
        }
        Insert: {
          country: string
          created_at?: string | null
          drinking_window?: Json
          external_data?: Json | null
          id?: string
          image_url?: string | null
          name: string
          personal_notes?: string | null
          personal_rating?: number | null
          producer: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          region: string
          type: string
          updated_at?: string | null
          user_id: string
          varietal: string[]
          vintage: number
        }
        Update: {
          country?: string
          created_at?: string | null
          drinking_window?: Json
          external_data?: Json | null
          id?: string
          image_url?: string | null
          name?: string
          personal_notes?: string | null
          personal_rating?: number | null
          producer?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number | null
          region?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          varietal?: string[]
          vintage?: number
        }
        Relationships: [
          {
            foreignKeyName: "wines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      user_wine_stats: {
        Row: {
          average_rating: number | null
          rated_wines: number | null
          red_wines: number | null
          sparkling_wines: number | null
          total_bottles: number | null
          total_wines: number | null
          user_id: string | null
          white_wines: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      wines_with_status: {
        Row: {
          calculated_status: string | null
          country: string | null
          created_at: string | null
          drinking_window: Json | null
          external_data: Json | null
          id: string | null
          image_url: string | null
          name: string | null
          personal_notes: string | null
          personal_rating: number | null
          producer: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number | null
          region: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          varietal: string[] | null
          vintage: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      calculate_drinking_window_status: {
        Args: {
          earliest_date: string
          peak_start_date: string
          peak_end_date: string
          latest_date: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}