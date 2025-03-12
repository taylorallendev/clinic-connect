'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Debug function to list all cases in the database
 * This helps troubleshoot issues with case creation and syncing
 */
export async function debugListAllCases() {
  try {
    console.log("*** DEBUG: Listing all cases in database ***");
    const supabase = await createClient();
    
    // Get all cases sorted by id (safer if created_at doesn't exist)
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .order('id', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error("Error fetching all cases in debugListAllCases:", JSON.stringify(error));
      return [];
    }
    
    console.log(`Found ${cases.length} cases:`, JSON.stringify(cases, null, 2));
    return cases;
  } catch (error) {
    console.error("Exception in debugListAllCases:", error);
    return [];
  }
}

export async function getAppointments({ 
  page = 0, 
  pageSize = 10, 
  searchQuery = '', 
  dateFilter = '',
  timestamp = Date.now(), // Add timestamp parameter to bust cache
  forceRefresh = false // Add parameter to bypass cache entirely
}: { 
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  dateFilter?: string;
  timestamp?: number; // Cache-busting parameter
  forceRefresh?: boolean; // Force direct database query
} = {}) {
  try {
    console.log('Server action: getAppointments called with params:', { page, pageSize, searchQuery, dateFilter, timestamp });
    const supabase = await createClient();
  
    // First, build the query to fetch cases which serve as appointments
    let query = supabase
      .from('cases')
      .select('*')
      .order('dateTime', { ascending: true });
    
    // Add console log to debug the query
    console.log('Fetching cases with query parameters:', { page, pageSize, searchQuery, dateFilter });
    
    // Apply search filter if provided
    if (searchQuery) {
      query = query.or(`
        name.ilike.%${searchQuery}%,
        type.ilike.%${searchQuery}%
      `);
    }
    
    // Apply date filter if provided
    if (dateFilter) {
      try {
        // Convert dateFilter to start and end of day
        const startOfDay = `${dateFilter}T00:00:00.000Z`;
        const endOfDay = `${dateFilter}T23:59:59.999Z`;
        
        // Log for debugging
        console.log('Filtering by date range:', { startOfDay, endOfDay, dateFilter });
        
        // Try both dateTime and date_time - some Supabase instances map camelCase to snake_case
        try {
          query = query.gte('dateTime', startOfDay).lte('dateTime', endOfDay);
        } catch (e) {
          console.log('Falling back to date_time field name');
          query = query.gte('date_time', startOfDay).lte('date_time', endOfDay);
        }
      } catch (error) {
        console.error('Error setting date filter:', error);
      }
    }
    
    // Calculate pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    // Execute the query with pagination
    const { data: casesData, error: casesError } = await query
      .range(from, to);
    
    if (casesError) {
      console.error('Error fetching cases:', casesError);
      throw new Error(casesError.message);
    }
    
    // Debug the results
    console.log(`Found ${casesData ? casesData.length : 0} cases in the database`);
    if (casesData && casesData.length > 0) {
      console.log('Sample case data:', casesData[0]);
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true });
    
    // If we have cases, fetch the related patient info
    
   let appointments = [];
    console.log('Raw cases data:', casesData);
    
    if (casesData && casesData.length > 0) {
      // Log case fields for debugging
      if (casesData.length > 0) {
        console.log('Case data fields available:', Object.keys(casesData[0]));
        console.log('First case sample:', JSON.stringify(casesData[0]));
      }
      
      // Extract patient IDs from cases - handle all possible column name variations
      const patientIds = casesData
        .map(c => {
          // Check for all possible variations of the patientId field
          const id = c.patientId || c.patient_id;
          
          if (id) {
            console.log(`Found patient ID ${id} in case ${c.id}`);
          } else {
            console.log(`No patient ID found in case ${c.id}. Available fields:`, Object.keys(c));
            console.log(`Case data:`, JSON.stringify(c, null, 2));
          }
          
          return id;
        })
        .filter(Boolean);
      
      console.log(`Extracted ${patientIds.length} patient IDs from ${casesData.length} cases`);
      
      console.log('Patient IDs:', patientIds);
      
      // Create a patient map, which might be empty if no patient IDs exist
      let patientMap = new Map();
      
      if (patientIds.length > 0) {
        // Fetch patient data
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('id, name, metadata')
          .in('id', patientIds);
        
        if (patientsError) {
          console.error('Error fetching patients:', patientsError);
          // Don't throw, just continue with empty patient data
        } else if (patientsData) {
          console.log('Patients data:', patientsData);
          
          // Create a map of patient data for quick lookup
          patientMap = new Map(
            patientsData.map(patient => [patient.id, patient])
          );
        }
      }
      
      // Map cases to appointments format - even if there are no patients
      appointments = casesData.map(caseItem => {
        try {
          // Handle possible field name differences
          const patientId = caseItem.patientId || caseItem.patient_id;
          const patient = patientMap.get(patientId) || { name: 'Unknown Patient', metadata: {} };
          
          // Handle possible date field name variations
          const dateTime = new Date(caseItem.dateTime || caseItem.date_time || new Date());
          
          // Extract doctor/owner info from patient metadata if available
          const doctorName = patient.metadata?.assigned_doctor || 'Unassigned';
          
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
          };
        } catch (error) {
          console.error('Error mapping case to appointment:', error, caseItem);
          return null;
        }
      }).filter(Boolean); // Remove any null items from failed mappings
    }
    
    return {
      appointments,
      totalCount: totalCount || 0,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Server action error in getAppointments:', error);
    // Return empty data rather than throwing
    return {
      appointments: [],
      totalCount: 0,
      page: 0,
      pageSize
    };
  }
}