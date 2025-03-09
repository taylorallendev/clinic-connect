import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";

// Disable caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DeepgramKeyResponse {
  key: string;
  url?: string;
}

export async function GET(request: NextRequest) {
  // Check if we're in development mode - use direct API key
  if (
    process.env.NODE_ENV === "development" ||
    process.env.DEEPGRAM_ENV === "development"
  ) {
    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "DEEPGRAM_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      key: process.env.DEEPGRAM_API_KEY,
    } satisfies DeepgramKeyResponse);
  }

  // Production mode - generate a temporary key
  try {
    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "DEEPGRAM_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    // Get projects
    const { result: projectsResult, error: projectsError } =
      await deepgram.manage.getProjects();

    if (projectsError) {
      console.error("Deepgram projects error:", projectsError);
      return NextResponse.json(
        { error: "Failed to get Deepgram projects" },
        { status: 500 }
      );
    }

    const project = projectsResult?.projects[0];

    if (!project) {
      return NextResponse.json(
        {
          error:
            "Cannot find a Deepgram project. Please create a project first.",
        },
        { status: 404 }
      );
    }

    // Create a temporary key
    const { result: newKeyResult, error: newKeyError } =
      await deepgram.manage.createProjectKey(project.project_id, {
        comment: "Temporary API key for web client",
        scopes: ["usage:write"],
        time_to_live_in_seconds: 60, // 1 minute
      });

    if (newKeyError) {
      console.error("Deepgram key creation error:", newKeyError);
      return NextResponse.json(
        { error: "Failed to create Deepgram API key" },
        { status: 500 }
      );
    }

    // Return the key with cache control headers
    const response = NextResponse.json({
      key: newKeyResult.key,
      url: request.url,
    } satisfies DeepgramKeyResponse);

    // Set cache control headers
    response.headers.set("Cache-Control", "no-store, max-age=0");

    return response;
  } catch (error) {
    console.error("Authenticate route error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Deepgram" },
      { status: 500 }
    );
  }
}
