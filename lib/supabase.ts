import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      analysis_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: "squat" | "sitting"
          analysis_mode: "webcam" | "upload"
          video_url: string | null
          total_frames: number
          good_posture_frames: number
          total_issues: number
          average_confidence: number
          session_data: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type: "squat" | "sitting"
          analysis_mode: "webcam" | "upload"
          video_url?: string | null
          total_frames: number
          good_posture_frames: number
          total_issues: number
          average_confidence: number
          session_data: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: "squat" | "sitting"
          analysis_mode?: "webcam" | "upload"
          video_url?: string | null
          total_frames?: number
          good_posture_frames?: number
          total_issues?: number
          average_confidence?: number
          session_data?: string
          created_at?: string
        }
      }
    }
  }
}
