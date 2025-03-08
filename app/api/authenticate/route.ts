import { NextRequest, NextResponse } from "next/server";
import { createClient, DeepgramError } from "@deepgram/sdk";

export const revalidate = 0;

interface DeepgramKeyResponse {
  key: string;
  url?: string;
}

export async function GET(request: NextRequest) {
  // Check if we're in development mode
  if (process.env.DEEPGRAM_ENV === "development") {
    return NextResponse.json({
      key: process.env.DEEPGRAM_API_KEY!,
    } satisfies DeepgramKeyResponse);
  }

  try {
    // Use the request object to invalidate cache
    const url = request.url;
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

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
      console.error("No Deepgram project found");
      return NextResponse.json(
        {
          error:
            "Cannot find a Deepgram project. Please create a project first.",
        },
        { status: 404 }
      );
    }

    const { result: newKeyResult, error: newKeyError } =
      await deepgram.manage.createProjectKey(project.project_id, {
        comment: "Temporary API key",
        scopes: ["usage:write"],
        tags: ["next.js"],
        time_to_live_in_seconds: 60,
      });

    if (newKeyError) {
      console.error("Deepgram key creation error:", newKeyError);
      return NextResponse.json(
        { error: "Failed to create Deepgram API key" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      key: newKeyResult.key,
      url,
    } satisfies DeepgramKeyResponse);

    // Set cache control headers
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set(
      "Cache-Control",
      "s-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Authenticate route error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Deepgram" },
      { status: 500 }
    );
  }
}
