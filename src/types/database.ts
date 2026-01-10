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
      users: {
        Row: {
          id: string
          google_id: string
          email: string
          name: string
          profile_picture: string | null
          is_first_login: boolean
          created_at: string
        }
        Insert: {
          id?: string
          google_id: string
          email: string
          name: string
          profile_picture?: string | null
          is_first_login?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          google_id?: string
          email?: string
          name?: string
          profile_picture?: string | null
          is_first_login?: boolean
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          age: number
          gender: 'male' | 'female' | 'other'
          height: number
          weight: number
          workout_location: 'gym' | 'home' | 'outdoor' | 'mixed'
          weekly_workouts: number
          goal: 'strength' | 'weight_loss' | 'endurance' | 'muscle_gain' | 'body_correction'
          focus: 'upper_body' | 'lower_body' | 'full_body' | 'core'
          fitness_level: 'beginner' | 'novice' | 'intermediate' | 'advanced'
          uncomfortable_areas: Json
          experience_level: 'none' | 'under_6months' | '6months_1year' | '1year_3years' | 'over_3years'
          exercise_history: Json
          plan_duration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          age: number
          gender: 'male' | 'female' | 'other'
          height: number
          weight: number
          workout_location: 'gym' | 'home' | 'outdoor' | 'mixed'
          weekly_workouts: number
          goal: 'strength' | 'weight_loss' | 'endurance' | 'muscle_gain' | 'body_correction'
          focus: 'upper_body' | 'lower_body' | 'full_body' | 'core'
          fitness_level: 'beginner' | 'novice' | 'intermediate' | 'advanced'
          uncomfortable_areas?: Json
          experience_level: 'none' | 'under_6months' | '6months_1year' | '1year_3years' | 'over_3years'
          exercise_history?: Json
          plan_duration: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          age?: number
          gender?: 'male' | 'female' | 'other'
          height?: number
          weight?: number
          workout_location?: 'gym' | 'home' | 'outdoor' | 'mixed'
          weekly_workouts?: number
          goal?: 'strength' | 'weight_loss' | 'endurance' | 'muscle_gain' | 'body_correction'
          focus?: 'upper_body' | 'lower_body' | 'full_body' | 'core'
          fitness_level?: 'beginner' | 'novice' | 'intermediate' | 'advanced'
          uncomfortable_areas?: Json
          experience_level?: 'none' | 'under_6months' | '6months_1year' | '1year_3years' | 'over_3years'
          exercise_history?: Json
          plan_duration?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      routines: {
        Row: {
          id: string
          user_id: string
          name: string
          settings: Json
          workouts: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          settings: Json
          workouts: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          settings?: Json
          workouts?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workouts: {
        Row: {
          id: string
          routine_id: string
          day_number: number
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          day_number: number
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          routine_id?: string
          day_number?: number
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
      exercises: {
        Row: {
          id: string
          workout_id: string
          name: string
          sets: number
          reps: string
          muscle_group: 'chest' | 'back' | 'shoulders' | 'arms' | 'abs' | 'legs' | 'full_body'
          description: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          name: string
          sets: number
          reps: string
          muscle_group: 'chest' | 'back' | 'shoulders' | 'arms' | 'abs' | 'legs' | 'full_body'
          description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          name?: string
          sets?: number
          reps?: string
          muscle_group?: 'chest' | 'back' | 'shoulders' | 'arms' | 'abs' | 'legs' | 'full_body'
          description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          routine_id: string
          workout_id: string
          date: string
          completed_exercises: Json
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          routine_id: string
          workout_id: string
          date: string
          completed_exercises?: Json
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          routine_id?: string
          workout_id?: string
          date?: string
          completed_exercises?: Json
          is_completed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
      google_calendar_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string
          token_expiry: string
          google_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token: string
          token_expiry: string
          google_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          refresh_token?: string
          token_expiry?: string
          google_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      calendar_event_mappings: {
        Row: {
          id: string
          user_id: string
          routine_id: string
          workout_id: string
          google_event_id: string
          event_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          routine_id: string
          workout_id: string
          google_event_id: string
          event_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          routine_id?: string
          workout_id?: string
          google_event_id?: string
          event_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_mappings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_mappings_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_mappings_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      calendar_sync_status: {
        Row: {
          id: string
          user_id: string
          last_sync_at: string | null
          sync_status: 'idle' | 'syncing' | 'error'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          last_sync_at?: string | null
          sync_status?: 'idle' | 'syncing' | 'error'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          last_sync_at?: string | null
          sync_status?: 'idle' | 'syncing' | 'error'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}