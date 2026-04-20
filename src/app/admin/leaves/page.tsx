import { getDoctors } from '@/app/actions/doctor-actions';
import { getLeaves } from '@/app/actions/leave-actions';
import LeavesPageClient from './leaves-page-client';

export default async function LeavesPage() {
  // Fetch data on the server
  const doctors = await getDoctors();
  const leaves = await getLeaves();

  // Pass data to the Client Component for interactive search
  return (
    <LeavesPageClient 
      initialDoctors={doctors || []} 
      initialLeaves={initialLeavesFix(leaves)} 
    />
  );
}

// Small helper to ensure we don't pass nulls to the client
function initialLeavesFix(leaves: any[] | null) {
  if (!leaves) return [];
  return leaves;
}
