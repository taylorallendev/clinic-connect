import { Suspense } from "react"
import { getAppointments } from "./actions"
import { AppointmentsTable } from "./appointments-table"
import { AppointmentsSkeleton } from "./appointments-skeleton"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

async function AppointmentsContent() {
  try {
    // Get current date in YYYY-MM-DD format for default filtering
    const today = new Date();
    const dateFilter = today.toISOString().split('T')[0];
    
    // Load appointments with today's date as default filter
    let initialData = await getAppointments({ 
      page: 0, 
      pageSize: 20, // Show more cases by default
      dateFilter,
      timestamp: Date.now(), // Add this to bust cache
      forceRefresh: true // Force direct database query
    });
    
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
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <Suspense fallback={<AppointmentsSkeleton />}>
        <AppointmentsContent />
      </Suspense>
    </div>
  )
}