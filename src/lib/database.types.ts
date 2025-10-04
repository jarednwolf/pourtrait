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
      ,
      // Monitoring & analytics tables (added to align with migrations)
      analytics_events: {
        Row: {
          id: string
          event_name: string
          properties: Json | null
          user_id: string | null
          timestamp: string | null
          environment: string | null
          session_id: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string | null
        }
        Insert: Partial<{
          id: string
          event_name: string
          properties: Json | null
          user_id: string | null
          timestamp: string | null
          environment: string | null
          session_id: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string | null
        }> & { event_name: string }
        Update: Partial<{
          id: string
          event_name: string
          properties: Json | null
          user_id: string | null
          timestamp: string | null
          environment: string | null
          session_id: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string | null
        }>
        Relationships: []
      }
      ,
      performance_metrics: {
        Row: {
          id: string
          name: string
          value: number
          unit: string
          timestamp: string | null
          metadata: Json | null
          environment: string | null
          created_at: string | null
        }
        Insert: Partial<{
          id: string
          name: string
          value: number
          unit: string
          timestamp: string | null
          metadata: Json | null
          environment: string | null
          created_at: string | null
        }> & { name: string; value: number; unit: string }
        Update: Partial<{
          id: string
          name: string
          value: number
          unit: string
          timestamp: string | null
          metadata: Json | null
          environment: string | null
          created_at: string | null
        }>
        Relationships: []
      }
      ,
      error_logs: {
        Row: {
          id: string
          message: string
          stack: string | null
          context: Json | null
          user_id: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          timestamp: string | null
          environment: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string | null
        }
        Insert: Partial<{
          id: string
          message: string
          stack: string | null
          context: Json | null
          user_id: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          timestamp: string | null
          environment: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string | null
        }> & { message: string; severity: 'low' | 'medium' | 'high' | 'critical' }
        Update: Partial<{
          id: string
          message: string
          stack: string | null
          context: Json | null
          user_id: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          timestamp: string | null
          environment: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string | null
        }>
        Relationships: []
      }
      ,
      business_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          timestamp: string | null
          environment: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: Partial<{
          id: string
          metric_name: string
          metric_value: number
          timestamp: string | null
          environment: string | null
          metadata: Json | null
          created_at: string | null
        }> & { metric_name: string; metric_value: number }
        Update: Partial<{
          id: string
          metric_name: string
          metric_value: number
          timestamp: string | null
          environment: string | null
          metadata: Json | null
          created_at: string | null
        }>
        Relationships: []
      }
      ,
      alerts: {
        Row: {
          id: string
          type: string
          severity: 'info' | 'warning' | 'error' | 'critical'
          message: string
          data: Json | null
          timestamp: string | null
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          type: string
          severity: 'info' | 'warning' | 'error' | 'critical'
          message: string
          data?: Json | null
          timestamp?: string | null
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string | null
        }
        Update: Partial<{
          id: string
          type: string
          severity: 'info' | 'warning' | 'error' | 'critical'
          message: string
          data: Json | null
          timestamp: string | null
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string | null
        }>
        Relationships: []
      }
      ,
      system_health: {
        Row: {
          id: string
          service_name: string
          status: 'healthy' | 'degraded' | 'unhealthy'
          response_time: number | null
          error_rate: number | null
          uptime_percentage: number | null
          metadata: Json | null
          timestamp: string | null
          environment: string | null
        }
        Insert: {
          id?: string
          service_name: string
          status: 'healthy' | 'degraded' | 'unhealthy'
          response_time?: number | null
          error_rate?: number | null
          uptime_percentage?: number | null
          metadata?: Json | null
          timestamp?: string | null
          environment?: string | null
        }
        Update: Partial<{
          id: string
          service_name: string
          status: 'healthy' | 'degraded' | 'unhealthy'
          response_time: number | null
          error_rate: number | null
          uptime_percentage: number | null
          metadata: Json | null
          timestamp: string | null
          environment: string | null
        }>
        Relationships: []
      }
      ,
      user_sessions: {
        Row: {
          id: string
          user_id: string | null
          session_start: string | null
          session_end: string | null
          duration_seconds: number | null
          page_views: number | null
          events_count: number | null
          user_agent: string | null
          ip_address: string | null
          country: string | null
          city: string | null
          device_type: string | null
          browser: string | null
          os: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string | null
          session_start?: string | null
          session_end?: string | null
          duration_seconds?: number | null
          page_views?: number | null
          events_count?: number | null
          user_agent?: string | null
          ip_address?: string | null
          country?: string | null
          city?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          created_at?: string | null
        }
        Update: Partial<{
          id: string
          user_id: string | null
          session_start: string | null
          session_end: string | null
          duration_seconds: number | null
          page_views: number | null
          events_count: number | null
          user_agent: string | null
          ip_address: string | null
          country: string | null
          city: string | null
          device_type: string | null
          browser: string | null
          os: string | null
          created_at: string | null
        }>
        Relationships: []
      }
      ,
      feature_usage: {
        Row: {
          id: string
          feature_name: string
          user_id: string | null
          usage_count: number | null
          first_used: string | null
          last_used: string | null
          success_rate: number | null
          average_duration: number | null
          metadata: Json | null
          date: string | null
        }
        Insert: Partial<Row> & { feature_name: string }
        Update: Partial<Row>
        Relationships: []
      }
      ,
      api_usage_metrics: {
        Row: {
          id: string
          endpoint: string
          method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
          status_code: number
          response_time: number
          user_id: string | null
          timestamp: string | null
          user_agent: string | null
          ip_address: string | null
          request_size: number | null
          response_size: number | null
          error_message: string | null
          created_at: string | null
        }
        Insert: Partial<Row> & { endpoint: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; status_code: number; response_time: number }
        Update: Partial<Row>
        Relationships: []
      }
      ,
      // App feature tables
      saved_searches: {
        Row: {
          id: string
          user_id: string
          name: string
          filters: Json
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Row> & { user_id: string; name: string; filters: Json }
        Update: Partial<Row>
        Relationships: []
      }
      ,
      search_history: {
        Row: {
          id: string
          user_id: string
          query: string
          filters: Json | null
          created_at: string | null
        }
        Insert: Partial<Row> & { user_id: string; query: string }
        Update: Partial<Row>
        Relationships: []
      }
      ,
      shared_collections: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          wines: Json
          is_public: boolean | null
          view_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Row> & { user_id: string; title: string; wines: Json }
        Update: Partial<Row>
        Relationships: []
      }
      ,
      scheduled_notifications: {
        Row: {
          id: string
          user_id: string
          payload: Json | null
          scheduled_for: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Row> & { user_id: string }
        Update: Partial<Row>
        Relationships: []
      }
      ,
      notification_delivery_logs: {
        Row: {
          id: string
          scheduled_notification_id: string
          status: string | null
          details: Json | null
          created_at: string | null
        }
        Insert: Partial<Row> & { scheduled_notification_id: string }
        Update: Partial<Row>
        Relationships: []
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