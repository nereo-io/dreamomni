import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";

export const dynamic = "force-dynamic";

// Showcase Jobs (Hardcoded UUIDs)
const SHOWCASE_JOB_IDS = [
  "9ab4134c-65c8-4573-a809-13e21caa49af",
  "43c1e8b0-9644-434c-ba25-6268b55d0508",
  "5a04428e-be54-43d3-93a4-17bdabf32015",
  "80b44e0e-efb2-41d6-95a9-afdabc8869fc",
  "8adc4a84-f5ef-4196-a193-1f0b9bf06575",
  "0d90dbb9-cd00-4898-9955-ace381c826aa",
];

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data: jobs, error } = await supabase
      .from("agent_jobs")
      .select(
        `
        id,
        status,
        final_video_url,
        prompt,
        image_model,
        video_model,
        duration_seconds,
        created_at,
        aspect_ratio,
        keyframes_enabled,
        error_message,
        updated_at,
        prompt_variant,
        reference_image_urls,
        user_id
      `
      )
      .in("id", SHOWCASE_JOB_IDS);

    if (error) {
      console.error("Failed to fetch showcase jobs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sort jobs based on the order in SHOWCASE_JOB_IDS
    const sortedJobs = SHOWCASE_JOB_IDS.map((id) =>
      jobs?.find((job) => job.id === id)
    ).filter(Boolean);

    return NextResponse.json({ jobs: sortedJobs });
  } catch (error: any) {
    console.error("Error in showcase API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
