'use server';

import { supabase, Doctor, GroupType } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function getDoctors() {
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      *, 
      ekuri_pairs!ekuri_pair_id(
        id,
        doctor1:doctors!doctor1_id(id, full_name),
        doctor2:doctors!doctor2_id(id, full_name)
      )
    `)
    .order('full_name');
  
  if (error) throw new Error(error.message);
  return data;
}

export async function getDetailedDoctorStats(doctorId: string) {
  const currentYear = 2026; // Fixed for this platform context
  
  const { data, error } = await supabase
    .from('yearly_fairness')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('year', currentYear)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function addDoctor(fullName: string, groupType: GroupType) {
  const { data, error } = await supabase
    .from('doctors')
    .insert([{ full_name: fullName, group_type: groupType }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Initialize debt and fairness tables for the new doctor
  const currentYear = new Date().getFullYear();
  await supabase.from('night_debt').insert([{ doctor_id: data.id }]);
  await supabase.from('yearly_fairness').insert([{ doctor_id: data.id, year: currentYear }]);

  revalidatePath('/admin/doctors');
  return data;
}

export async function createEkuriPair(doctor1Id: string, doctor2Id: string) {
  // 1. Create the pair
  const { data: pair, error: pairError } = await supabase
    .from('ekuri_pairs')
    .insert([{ doctor1_id: doctor1Id, doctor2_id: doctor2Id }])
    .select()
    .single();

  if (pairError) throw new Error(pairError.message);

  // 2. Update both doctors with the new pair ID
  const { error: updateError } = await supabase
    .from('doctors')
    .update({ ekuri_pair_id: pair.id })
    .in('id', [doctor1Id, doctor2Id]);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/admin/doctors');
  return pair;
}

export async function deleteEkuriPair(pairId: string) {
  // This will set the ekuri_pair_id to null in doctors table due to "on delete set null"
  const { error } = await supabase
    .from('ekuri_pairs')
    .delete()
    .eq('id', pairId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/doctors');
}
