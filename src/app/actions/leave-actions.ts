'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addLeave(doctorId: string, startDate: string, endDate: string, description?: string) {
  const { data, error } = await supabase
    .from('doctor_leaves')
    .insert([{
      doctor_id: doctorId,
      start_date: startDate,
      end_date: endDate,
      description
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/doctors');
  revalidatePath('/admin/plans');
  revalidatePath('/admin/leaves');
  return data;
}

export async function getDoctorLeaves(doctorId: string) {
  const { data, error } = await supabase
    .from('doctor_leaves')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('start_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getLeaves() {
  const { data, error } = await supabase
    .from('doctor_leaves')
    .select('*, doctor:doctors(full_name)')
    .order('start_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLeave(leaveId: string) {
  const { error } = await supabase
    .from('doctor_leaves')
    .delete()
    .eq('id', leaveId);

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/doctors');
  revalidatePath('/admin/plans');
  revalidatePath('/admin/leaves');
}
