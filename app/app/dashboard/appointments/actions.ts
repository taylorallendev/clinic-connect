'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAppointments({ 
  page = 0, 
  pageSize = 10, 
  searchQuery = '', 
  dateFilter = '' 
}: { 
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  dateFilter?: string;
} = {}) {
  try {
    console.log('Server action: getAppointments called with params:', { page, pageSize, searchQuery, dateFilter });
    const supabase = await createClient()
  
  // First, build the query to fetch cases which serve as appointments
  let query = supabase
    .from('cases')
    .select('*')
    .order('dateTime', { ascending: true })
    
  // Add console log to debug the query
  console.log('Fetching cases with query parameters:', { page, pageSize, searchQuery, dateFilter })
  
  // Apply search filter if provided
  if (searchQuery) {
    query = query.or(`
      name.ilike.%${searchQuery}%,
      type.ilike.%${searchQuery}%
    `)
  }
  
  // Apply date filter if provided
  if (dateFilter) {
    try {
      // Convert dateFilter to start and end of day
      const startOfDay = `${dateFilter}T00:00:00.000Z`
      const endOfDay = `${dateFilter}T23:59:59.999Z`
      
      // Log for debugging
      console.log('Filtering by date range:', { startOfDay, endOfDay, dateFilter })
      
      // Try both dateTime and date_time - some Supabase instances map camelCase to snake_case
      try {
        query = query.gte('dateTime', startOfDay).lte('dateTime', endOfDay)
      } catch (e) {
        console.log('Falling back to date_time field name')
        query = query.gte('date_time', startOfDay).lte('date_time', endOfDay)
      }
    } catch (error) {
      console.error('Error setting date filter:', error)
    }
  }
  
  // Calculate pagination
  const from = page * pageSize
  const to = from + pageSize - 1
  
  // Execute the query with pagination
  const { data: casesData, error: casesError, count } = await query
    .range(from, to)
  
  if (casesError) {
    console.error('Error fetching cases:', casesError)
    throw new Error(casesError.message)
  }
  
  // Debug the results
  console.log(`Found ${casesData ? casesData.length : 0} cases in the database`);
  if (casesData && casesData.length > 0) {
    console.log('Sample case data:', casesData[0]);
  }
  
  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('cases')
    .select('id', { count: 'exact', head: true })
  
  // If we have cases, fetch the related patient info
  let appointments = []
  
  console.log('Raw cases data:', casesData);
  
  if (casesData && casesData.length > 0) {
    // Extract patient IDs from cases
    const patientIds = casesData
      .map(c => c.patientId)
      .filter(Boolean)
    
    console.log('Patient IDs:', patientIds);
    
    if (patientIds.length > 0) {
      // Fetch patient data
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, name, metadata')
        .in('id', patientIds)
      
      if (patientsError) {
        console.error('Error fetching patients:', patientsError)
        throw new Error(patientsError.message)
      }
      
      console.log('Patients data:', patientsData);
      
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
      }).filter(Boolean); // Remove any null items from failed mappings
    }
  }
  
  return {
    appointments,
    totalCount: totalCount || 0,
    page,
    pageSize
  }
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