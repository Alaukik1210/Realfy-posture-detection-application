import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Check if tables exist and create them if they don't
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (tablesError) {
      console.error("Error checking tables:",tables, tablesError)
    }

    // Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase.rpc("create_profiles_table")
    if (profilesError && !profilesError.message.includes("already exists")) {
      console.error("Error creating profiles table:", profilesError)
    }

    // Create analysis_sessions table if it doesn't exist
    const { error: sessionsError } = await supabase.rpc("create_analysis_sessions_table")
    if (sessionsError && !sessionsError.message.includes("already exists")) {
      console.error("Error creating analysis_sessions table:", sessionsError)
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
    })
  } catch (error: unknown) {
  console.error("Database setup error:", error)

  let errorMessage = "An unknown error occurred"
  if (error instanceof Error) {
    errorMessage = error.message
  }

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
    },
    { status: 500 },
  )
}

}
