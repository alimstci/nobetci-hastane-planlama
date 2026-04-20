import { getDoctors } from '@/app/actions/doctor-actions';
import { DoctorsClient } from './doctors-client';

export default async function DoctorsPage() {
  const doctors = await getDoctors();

  return (
    <div className="h-full">
      <DoctorsClient initialDoctors={doctors || []} />
    </div>
  );
}
