import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

// Mark this route as not using static caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    console.log('API: Appointments endpoint called');
    
    // Ensure we can parse the request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    const { page = 0, pageSize = 10, searchQuery = '', dateFilter = '' } = body;
    console.log('API: Request parameters received:', { page, pageSize, searchQuery, dateFilter });
    
    // Create Supabase client
    let supabase;
    try {
      supabase = await createClient();
      console.log('API: Supabase client created successfully');
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return NextResponse.json({ error: "Database connection error: " + (e.message || String(e)) }, { status: 500 });
    }
    
    // Check authentication - wrapped in try/catch to handle potential errors
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('API: No session found, returning unauthorized');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      console.log('API: Authentication successful, user is logged in');
    } catch (e) {
      console.error('Failed to check authentication:', e);
      return NextResponse.json({ error: "Authentication error: " + (e.message || String(e)) }, { status: 500 });
    }
    
    // First, build the query to fetch cases which serve as appointments
    let query = supabase
      .from('cases')
      .select('*')
      .order('dateTime', { ascending: true })
    
    console.log('API: Fetching cases with query parameters:', { page, pageSize, searchQuery, dateFilter })
    
    // Apply search filter if provided
    if (searchQuery && searchQuery.trim() !== '') {
      try {
        console.log('Applying search filter:', searchQuery);
        // Simplify the search filter to just one field to reduce chance of errors
        query = query.ilike('name', `%${searchQuery}%`);
      } catch (error) {
        console.error('Error applying search filter:', error);
        // Don't throw, just log and continue without the filter
      }
    }
    
    // Apply date filter if provided
    if (dateFilter && dateFilter.trim() !== '') {
      try {
        // Convert dateFilter to start and end of day
        const startOfDay = `${dateFilter}T00:00:00.000Z`;
        const endOfDay = `${dateFilter}T23:59:59.999Z`;
        
        // Log for debugging
        console.log('Filtering by date range:', { startOfDay, endOfDay, dateFilter });
        
        // Using only dateTime for consistency
        query = query.gte('dateTime', startOfDay).lte('dateTime', endOfDay);
      } catch (error) {
        console.error('Error setting date filter:', error);
        // Don't throw, just log and continue without the filter
      }
    }
    
    // Calculate pagination
    const from = page * pageSize
    const to = from + pageSize - 1
    
    // Execute the query with pagination
    let casesData;
    try {
      const { data, error } = await query.range(from, to);
      
      if (error) {
        console.error('Error fetching cases:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      casesData = data;
      console.log(`Successfully fetched ${casesData?.length || 0} cases`);
      
      // Log the first case for debugging
      if (casesData && casesData.length > 0) {
        console.log('First case sample:', JSON.stringify(casesData[0]));
      }
    } catch (error) {
      console.error('Exception during query execution:', error);
      return NextResponse.json({ error: "Database query failed" }, { status: 500 });
    }
    
    // Get total count for pagination
    let totalCount = 0;
    try {
      const { count, error } = await supabase
        .from('cases')
        .select('id', { count: 'exact', head: true });
        
      if (error) {
        console.error('Error counting cases:', error);
      } else {
        totalCount = count || 0;
        console.log(`Total case count: ${totalCount}`);
      }
    } catch (error) {
      console.error('Exception during count query:', error);
      // Continue with totalCount = 0
    }
    
    // If we have cases, fetch the related patient info
    let appointments = []
    
    if (casesData && casesData.length > 0) {
      // Extract patient IDs from cases
      const patientIds = casesData
        .map(c => c.patientId)
        .filter(Boolean)
      
      if (patientIds.length > 0) {
        // Fetch patient data
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('id, name, metadata')
          .in('id', patientIds)
        
        if (patientsError) {
          console.error('Error fetching patients:', patientsError)
          return NextResponse.json({ error: patientsError.message }, { status: 500 })
        }
        
        // Create a map of patient data for quick lookup
        const patientMap = new Map(
          patientsData.map(patient => [patient.id, patient])
        )
        
        // Map cases to appointments format
        appointments = casesData.map(caseItem => {
          try {
            // Handle possible field name differences
            const patientId = caseItem.patientId || caseItem.patient_id;
            const patient = patientMap.get(patientId) || { name: 'Unknown Patient', metadata: {} }
            
            // Handle possible date field name variations
            const dateTime = new Date(caseItem.dateTime || caseItem.date_time || new Date());
            
            // Extract doctor/owner info from patient metadata if available
            const doctorName = patient.metadata?.assigned_doctor || 'Unassigned'
            
            // Create consistent appointment object
            return {
              id: caseItem.id.toString(),
              name: caseItem.name || 'Untitled Appointment',
              date: dateTime.toISOString().split('T')[0],
              time: dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: caseItem.type || 'General',
              status: caseItem.status || 'scheduled',
              patients: {
                id: patient.id,
                name: patient.name,
                first_name: patient.name?.split(' ')[0] || '',
                last_name: patient.name?.split(' ').slice(1).join(' ') || ''
              },
              users: {
                id: 'doctor-id', // Placeholder as we don't have actual doctor IDs
                name: doctorName,
                first_name: doctorName.split(' ')[0] || '',
                last_name: doctorName.split(' ').slice(1).join(' ') || ''
              }
            }
          } catch (error) {
            console.error('Error mapping case to appointment:', error, caseItem);
            return null;
          }
        }).filter(Boolean) // Remove any null items from failed mappings
      }
    }
    
    return NextResponse.json({
      appointments,
      totalCount: totalCount || 0,
      page,
      pageSize
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}