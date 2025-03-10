import { Suspense } from "react"
import { getAppointments } from "./actions"
import { AppointmentsTable } from "./appointments-table"
import { AppointmentsSkeleton } from "./appointments-skeleton"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

async function AppointmentsContent() {
  try {
    console.log("Page: Starting to fetch appointments for initial load");
    
    // First try with empty filters to get all appointments
    let initialData = await getAppointments({ 
      page: 0, 
      pageSize: 10
    });
    
    console.log(`Page: Loaded ${initialData.appointments.length} appointments with no filter`);
    
    // If no results, try with today's date as fallback
    if (initialData.appointments.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      console.log(`Page: No appointments found, trying with today's date: ${today}`);
      
      initialData = await getAppointments({ 
        page: 0, 
        pageSize: 10,
        dateFilter: today 
      });
      
      console.log(`Page: Loaded ${initialData.appointments.length} appointments for today`);
    }
    
    return <AppointmentsTable initialData={initialData} />;
  } catch (error) {
    console.error("Error in AppointmentsContent:", error);
    // Return a fallback with empty data
    return (
      <AppointmentsTable 
        initialData={{ 
          appointments: [], 
          totalCount: 0, 
          page: 0, 
          pageSize: 10 
        }} 
      />
    );
  }
}

export default function AppointmentsPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<AppointmentsSkeleton />}>
        <AppointmentsContent />
      </Suspense>
    </div>
  )
}