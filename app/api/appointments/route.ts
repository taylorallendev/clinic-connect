import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Mark this route as not using static caching
export const dynamic = "force-dynamic";
export const revalidate = 0; // Ensure no caching at all

export async function POST(req: NextRequest) {
  try {
    console.log("API: Appointments endpoint called", new Date().toISOString());

    // Ensure we can parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      page = 0,
      pageSize = 10,
      searchQuery = "",
      dateFilter = "",
      statusFilter = "",
      timestamp = Date.now(),
    } = body;
    
    // Log all parameters for debugging
    console.log("API: Request parameters received:", {
      page,
      pageSize,
      searchQuery: searchQuery ? `"${searchQuery}"` : "empty",
      dateFilter: dateFilter ? `"${dateFilter}"` : "empty",
      statusFilter: statusFilter ? `"${statusFilter}"` : "empty",
      timestamp,
      hasFilters: !!(searchQuery || dateFilter || statusFilter),
    });

    // Add debug info at the beginning
    console.log(
      `API: Appointments endpoint processing request at timestamp ${timestamp}`
    );

    // Create Supabase client
    let supabase;
    try {
      supabase = await createClient();
      console.log("API: Supabase client created successfully");
    } catch (e) {
      console.error("Failed to create Supabase client:", e);
      return NextResponse.json(
        {
          error:
            "Database connection error: " +
            (e instanceof Error ? e.message : String(e)),
        },
        { status: 500 }
      );
    }

    // Check authentication - wrapped in try/catch to handle potential errors
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log("API: No session found, returning unauthorized");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      console.log("API: Authentication successful, user is logged in");
    } catch (e) {
      console.error("Failed to check authentication:", e);
      return NextResponse.json(
        {
          error:
            "Authentication error: " +
            (e instanceof Error ? e.message : String(e)),
        },
        { status: 500 }
      );
    }

    // First, build the query to fetch cases which serve as appointments
    let query = supabase
      .from("cases")
      .select("*")
      .order("dateTime", { ascending: true });

    console.log("API: Fetching cases with query parameters:", {
      page,
      pageSize,
      searchQuery,
      dateFilter,
      statusFilter
    });

    // Apply search filter if provided
    if (searchQuery && searchQuery.trim() !== "") {
      try {
        console.log("Applying search filter:", searchQuery);
        
        // First, check if the table has the expected columns
        const { data: schemaInfo, error: schemaError } = await supabase
          .from('cases')
          .select()
          .limit(1);
          
        if (schemaError) {
          console.error("Error checking schema:", schemaError);
          // We'll continue without filter if we can't verify columns
        } else {
          console.log("Available columns for search:", schemaInfo && schemaInfo.length > 0 ? Object.keys(schemaInfo[0]) : []);
        }
        
        // Build a search condition for name
        try {
          console.log("Applying name search with:", searchQuery);
          // Basic case-insensitive search on name
          query = query.ilike("name", `%${searchQuery}%`);
        } catch (nameSearchError) {
          console.error("Error in name search:", nameSearchError);
          // Continue without this specific filter
        }
      } catch (error) {
        console.error("Error applying search filter:", error);
        // Don't throw, just log and continue without the filter
      }
    } else {
      console.log("No search filter applied - empty or missing searchQuery");
    }

    // Apply date filter if provided
    if (dateFilter && dateFilter.trim() !== "") {
      try {
        console.log(`Processing date filter: "${dateFilter}"`);
        
        // Validate dateFilter format (should be YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
          console.error(`Invalid date format: ${dateFilter}. Expected YYYY-MM-DD.`);
          // Don't apply invalid date filter
          return NextResponse.json(
            { 
              error: `Invalid date format: ${dateFilter}. Expected YYYY-MM-DD.`,
              appointments: [], // Return empty array to prevent cascading errors
              totalCount: 0,
              page,
              pageSize
            },
            { status: 200 } // Return 200 to allow client to display "no results" rather than error
          );
        }

        // Convert dateFilter to start and end of day
        const startOfDay = `${dateFilter}T00:00:00.000Z`;
        const endOfDay = `${dateFilter}T23:59:59.999Z`;

        // Log for debugging
        console.log("Filtering by date range:", {
          startOfDay,
          endOfDay,
          dateFilter,
        });
        
        // First check if any records exist with this date at all
        const { data: dateCheck, error: dateCheckError } = await supabase
          .from('cases')
          .select('id')
          .gte("dateTime", startOfDay)
          .lte("dateTime", endOfDay)
          .limit(1);
          
        if (dateCheckError) {
          console.error("Error checking records for date:", dateCheckError);
        } else {
          console.log(`Found ${dateCheck?.length || 0} records for date ${dateFilter}`);
          
          if (!dateCheck || dateCheck.length === 0) {
            console.log(`No records found for date: ${dateFilter}`);
            // Continue with the filter anyway - it's valid even if no results
          }
        }
        
        // Verify the column exists and try to get a record
        const { data: columnCheck, error: columnError } = await supabase
          .from('cases')
          .select('dateTime')
          .limit(1);
          
        if (columnError) {
          console.error("Error checking dateTime column:", columnError);
          throw new Error(`DateTime column error: ${columnError.message}`);
        }
        
        console.log("Using date range for query:", startOfDay, "to", endOfDay);
        
        // Using only dateTime for consistency and handling all cases
        query = query.gte("dateTime", startOfDay).lte("dateTime", endOfDay);
      } catch (error) {
        console.error("Error setting date filter:", error);
        // Don't throw, just log and continue without the filter
      }
    }
    
    // Apply status filter if provided
    if (statusFilter && statusFilter.trim() !== "") {
      try {
        console.log("Filtering by status:", statusFilter);
        
        // IMPORTANT: Only valid values are: ongoing, completed, reviewed, exported
        if (["ongoing", "completed", "reviewed", "exported"].includes(statusFilter.toLowerCase())) {
          console.log(`Applying status filter for: ${statusFilter}`);
          query = query.eq("status", statusFilter.toLowerCase());
        } else {
          console.warn(`Invalid status filter value: ${statusFilter}. Will not apply filter.`);
          // Don't apply an invalid filter
        }
      } catch (error) {
        console.error("Error setting status filter:", error);
        // Don't throw, just log and continue without the filter
      }
    }

    // Calculate pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Execute the query with pagination
    let casesData;
    try {
      // Log the SQL query for debugging (if possible)
      console.log("Executing query with pagination:", { from, to });
      
      // First try without any filters to check if the table works at all
      if (searchQuery || dateFilter || statusFilter) {
        // Only run this check when filters are applied
        const { data: baseCheck, error: baseError } = await supabase
          .from('cases')
          .select('*')
          .limit(1);
          
        if (baseError) {
          console.error("ERROR: Cannot access cases table:", baseError);
          return NextResponse.json({ 
            error: "Database access error: " + baseError.message,
            details: "Cannot access the base cases table"
          }, { status: 500 });
        } else {
          console.log("Base table check: Success - cases table is accessible");
        }
      }
      
      // Now run the actual query with all filters
      const { data, error } = await query.range(from, to);

      if (error) {
        console.error("Error fetching cases:", error);
        
        // Don't return raw error - instead return empty appointments with debugging info
        // This ensures the UI can still show "No appointments" instead of crashing
        return NextResponse.json({ 
          appointments: [],
          totalCount: 0,
          page,
          pageSize,
          debug: {
            error: true,
            errorDetails: {
              message: error.message,
              code: error.code,
              hint: error.hint || "No hint available"
            },
            requestParams: { searchQuery, dateFilter, statusFilter }
          }
        }, { status: 200 });
      }

      casesData = data;
      console.log(`Successfully fetched ${casesData?.length || 0} cases`);

      // Log all cases for debugging (limited to first 2 for brevity)
      if (casesData && casesData.length > 0) {
        console.log(
          `First ${Math.min(2, casesData.length)} cases fetched from DB:`,
          JSON.stringify(casesData.slice(0, 2), null, 2)
        );
      } else {
        console.log("WARNING: No cases found in query results!");
      }
    } catch (error) {
      console.error("Exception during query execution:", error);
      return NextResponse.json(
        { 
          error: "Database query failed",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

    // Get total count for pagination and add debug info about all cases
    let totalCount = 0;
    try {
      // First get all cases to debug (use id for sorting since created_at might not exist)
      const { data: allCases, error: allCasesError } = await supabase
        .from("cases")
        .select("id, name, dateTime, type")
        .order("id", { ascending: false })
        .limit(10);

      if (allCasesError) {
        console.error("Error listing all cases in API:", allCasesError);
      } else {
        console.log(
          `API DEBUG: Found ${allCases.length} recent cases`,
          JSON.stringify(allCases, null, 2)
        );
      }

      // Then get count for pagination
      const { count, error } = await supabase
        .from("cases")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.error("Error counting cases:", error);
      } else {
        totalCount = count || 0;
        console.log(`Total case count: ${totalCount}`);
      }
    } catch (error) {
      console.error("Exception during count query:", error);
      // Continue with totalCount = 0
    }

    // If we have cases, fetch the related patient info
    let appointments = [];

    if (casesData && casesData.length > 0) {
      console.log(
        `Processing ${casesData.length} cases to create appointments`
      );

      // Log case fields for debugging
      if (casesData.length > 0) {
        console.log("Case data fields available:", Object.keys(casesData[0]));
        console.log("First case sample:", JSON.stringify(casesData[0]));
      }

      // Extract patient IDs from cases - handle column name variations
      const patientIds = casesData
        .map((c) => {
          // Check for all possible variations of the patientId field
          const id = c.patientId || c.patient_id;

          if (id) {
            console.log(`Found patient ID ${id} in case ${c.id}`);
          } else {
            console.log(
              `No patient ID found in case ${c.id}. Available fields:`,
              Object.keys(c)
            );
            console.log(`Case data:`, JSON.stringify(c, null, 2));
          }

          return id;
        })
        .filter(Boolean);

      console.log(
        `Extracted ${patientIds.length} patient IDs from ${casesData.length} cases`
      );

      // Create a patient map, which might be empty if no patient IDs exist
      let patientMap = new Map();

      if (patientIds.length > 0) {
        // Fetch patient data
        const { data: patientsData, error: patientsError } = await supabase
          .from("patients")
          .select("id, name, metadata")
          .in("id", patientIds);

        if (patientsError) {
          console.error("Error fetching patients:", patientsError);
          // Don't return an error, just continue with empty patient data
        } else if (patientsData) {
          // Create a map of patient data for quick lookup
          patientMap = new Map(
            patientsData.map((patient) => [patient.id, patient])
          );
        }
      }

      // Map cases to appointments format - even if there are no patients
      appointments = casesData
        .map((caseItem) => {
          try {
            // Handle possible field name differences
            const patientId = caseItem.patientId || caseItem.patient_id;
            // Get patient data from the map or create default with case name if patient not found
            let patient;
            if (patientId && patientMap.get(patientId)) {
              patient = patientMap.get(patientId);
              console.log(
                `Found patient in map: ${patient.name} for case ${caseItem.id}`
              );
            } else {
              // If patient not found but we have an ID, log this issue
              if (patientId) {
                console.warn(
                  `Patient ID ${patientId} exists but no patient record found for case ${caseItem.id}`
                );
              }

              // Use case name as patient name as fallback
              patient = {
                name: caseItem.name || "Unknown Patient",
                metadata: {},
              };
              console.log(
                `Using case name as patient name: ${patient.name} for case ${caseItem.id}`
              );
            }

            // Handle possible date field name variations
            const dateTime = new Date(
              caseItem.dateTime || caseItem.date_time || new Date()
            );

            // Extract doctor/owner info from patient metadata if available
            const doctorName =
              patient.metadata?.assigned_doctor || "Unassigned";

            // Create consistent appointment object
            // Map status from any format to a consistent display format
            const normalizeStatus = (status) => {
              if (!status) return "ongoing";

              // Convert to lowercase for consistency
              const normalized = String(status).toLowerCase();

              // Map to exact Supabase values
              if (normalized.includes("ongoing")) return "ongoing";
              if (normalized.includes("complet")) return "completed";
              if (normalized.includes("review")) return "reviewed";
              if (normalized.includes("export")) return "exported";

              // Default fallback
              return normalized;
            };

            // Process case_actions if available
            let caseActions = [];
            if (caseItem.case_actions && Array.isArray(caseItem.case_actions)) {
              console.log(
                `Found ${caseItem.case_actions.length} case actions for case ${caseItem.id}`
              );

              caseActions = caseItem.case_actions
                .map((action) => {
                  // Ensure we have a valid action object
                  if (!action || typeof action !== "object") {
                    console.warn(
                      `Invalid case action found in case ${caseItem.id}:`,
                      action
                    );
                    return null;
                  }

                  // Process SOAP notes that might be stored as JSON strings
                  if (action.type === "soap" && action.content?.soap?.plan) {
                    try {
                      // Check if the plan looks like it contains JSON
                      const planStr = action.content.soap.plan;
                      if (
                        typeof planStr === "string" &&
                        (planStr.includes('"subjective":') ||
                          planStr.includes('"objective":') ||
                          planStr.includes('"assessment":') ||
                          planStr.includes('"plan":'))
                      ) {
                        const parsedPlan = JSON.parse(planStr);

                        // If it successfully parsed and has SOAP structure, use it
                        if (
                          parsedPlan &&
                          typeof parsedPlan === "object" &&
                          (parsedPlan.subjective ||
                            parsedPlan.objective ||
                            parsedPlan.assessment ||
                            parsedPlan.plan)
                        ) {
                          // Replace the original soap object with the parsed one
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
                      console.error(
                        `Failed to parse SOAP JSON from plan field in case ${caseItem.id}:`,
                        e
                      );
                      // Keep the original action if parsing fails
                    }
                  }

                  return {
                    id: action.id || crypto.randomUUID(),
                    type: action.type || "unknown",
                    content: action.content || {},
                    timestamp: action.timestamp || Date.now(),
                  };
                })
                .filter(Boolean); // Remove any null items
            } else {
              console.log(`No case actions found for case ${caseItem.id}`);
            }

            // Create a consistent appointment object
            return {
              id: caseItem.id.toString(),
              name: caseItem.name || "Untitled Appointment",
              date: dateTime.toISOString().split("T")[0],
              time: dateTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              type: caseItem.type || "General",
              status: normalizeStatus(caseItem.status),
              patients: {
                id: patient.id,
                name: patient.name,
                first_name: patient.name?.split(" ")[0] || "",
                last_name: patient.name?.split(" ").slice(1).join(" ") || "",
              },
              users: {
                id: "doctor-id", // Placeholder as we don't have actual doctor IDs
                name: doctorName,
                first_name: doctorName.split(" ")[0] || "",
                last_name: doctorName.split(" ").slice(1).join(" ") || "",
              },
              case_actions: caseActions,
            };
          } catch (error) {
            console.error(
              "Error mapping case to appointment:",
              error,
              caseItem
            );
            return null;
          }
        })
        .filter(Boolean); // Remove any null items from failed mappings
    }
    
    // Final safety check for valid appointments array
    if (!Array.isArray(appointments)) {
      console.error("Appointments is not an array:", appointments);
      appointments = [];
    }
    
    // Log final appointment data for debugging
    console.log(`Returning ${appointments.length} appointments`);
    if (appointments.length > 0) {
      console.log("First appointment sample:", JSON.stringify(appointments[0], null, 2));
    }

    // Add debugging metadata to the response
    const response = {
      appointments,
      totalCount: totalCount || 0,
      page,
      pageSize,
      debug: {
        timestamp: Date.now(),
        filters: {
          searchQuery: searchQuery ? searchQuery : null,
          dateFilter: dateFilter ? dateFilter : null,
          statusFilter: statusFilter ? statusFilter : null,
        },
        appointmentsFound: appointments.length,
      }
    };
    
    console.log("API: Responding with", JSON.stringify(response.debug));
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
