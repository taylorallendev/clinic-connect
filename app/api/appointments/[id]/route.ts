import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("API: Updating appointment case actions for ID:", params.id);

    // Create Supabase client
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await req.json();

    // Validate request body
    if (!body.case_actions || !Array.isArray(body.case_actions)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected case_actions array" },
        { status: 400 }
      );
    }

    // Update the case with the provided case actions
    const { data, error } = await supabase
      .from("cases")
      .update({
        case_actions: body.case_actions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("id, case_actions");

    if (error) {
      console.error("Error updating case:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
        case_actions: data?.[0]?.case_actions || body.case_actions,
      },
    });
  } catch (error) {
    console.error("Error processing update request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("API: Single appointment endpoint called for ID:", params.id);

    // Create Supabase client
    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the case (appointment)
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", params.id)
      .single();

    if (caseError) {
      console.error("Error fetching case:", caseError);
      return NextResponse.json({ error: caseError.message }, { status: 500 });
    }

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Fetch patient data if we have a patient ID
    const patientId = caseData.patientId || caseData.patient_id;
    let patient = null;

    if (patientId) {
      const { data: patientData } = await supabase
        .from("patients")
        .select("id, name, metadata")
        .eq("id", patientId)
        .single();

      if (patientData) {
        patient = patientData;
      }
    }

    // Process case actions if they exist
    let caseActions = [];
    if (caseData.case_actions && Array.isArray(caseData.case_actions)) {
      caseActions = caseData.case_actions
        .map((action: Record<string, any>) => {
          if (!action || typeof action !== "object") return null;

          // Process SOAP notes that might be stored as JSON strings
          if (action.type === "soap" && action.content?.soap?.plan) {
            try {
              const planStr = action.content.soap.plan;
              if (
                typeof planStr === "string" &&
                (planStr.includes('"subjective":') ||
                  planStr.includes('"objective":') ||
                  planStr.includes('"assessment":') ||
                  planStr.includes('"plan":'))
              ) {
                const parsedPlan = JSON.parse(planStr);
                if (
                  parsedPlan &&
                  typeof parsedPlan === "object" &&
                  (parsedPlan.subjective ||
                    parsedPlan.objective ||
                    parsedPlan.assessment ||
                    parsedPlan.plan)
                ) {
                  action.content.soap = {
                    subjective:
                      parsedPlan.subjective ||
                      action.content.soap.subjective ||
                      "",
                    objective:
                      parsedPlan.objective ||
                      action.content.soap.objective ||
                      "",
                    assessment:
                      parsedPlan.assessment ||
                      action.content.soap.assessment ||
                      "",
                    plan: parsedPlan.plan || "",
                  };
                }
              }
            } catch (e) {
              console.error("Failed to parse SOAP JSON from plan field:", e);
            }
          }

          return {
            id: action.id || crypto.randomUUID(),
            type: action.type || "unknown",
            content: action.content || {},
            timestamp: action.timestamp || Date.now(),
          };
        })
        .filter(Boolean);
    }

    // Create the appointment object with the same structure as the sidebar
    const dateTime = new Date(
      caseData.dateTime || caseData.date_time || new Date()
    );
    const doctorName = patient?.metadata?.assigned_doctor || "Unassigned";

    const appointment = {
      id: caseData.id.toString(),
      name: caseData.name || "Untitled Appointment",
      date: dateTime.toISOString().split("T")[0],
      time: dateTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: caseData.type || "General",
      status: normalizeStatus(caseData.status),
      patients: patient
        ? {
            id: patient.id,
            name: patient.name,
            first_name: patient.name?.split(" ")[0] || "",
            last_name: patient.name?.split(" ").slice(1).join(" ") || "",
          }
        : {
            name: caseData.name || "Unknown Patient",
          },
      users: {
        id: "doctor-id",
        name: doctorName,
        first_name: doctorName.split(" ")[0] || "",
        last_name: doctorName.split(" ").slice(1).join(" ") || "",
      },
      case_actions: caseActions,
    };

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to normalize status
function normalizeStatus(status: string | undefined): string {
  if (!status) return "ongoing";

  const normalized = String(status).toLowerCase();

  if (normalized.includes("ongoing")) return "ongoing";
  if (normalized.includes("complet")) return "completed";
  if (normalized.includes("review")) return "reviewed";
  if (normalized.includes("export")) return "exported";

  return normalized;
}
