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
  
  const { data: fairness, error } = await supabase
    .from('yearly_fairness')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('year', currentYear)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const { data: nightDebt, error: debtError } = await supabase
    .from('night_debt')
    .select('*')
    .eq('doctor_id', doctorId)
    .maybeSingle();

  if (debtError) throw new Error(debtError.message);

  return {
    ...(fairness || {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
      holiday_count: 0,
      total_day_shifts: 0,
    }),
    debt_points: nightDebt?.debt_points || 0,
    last_night_month: nightDebt?.last_night_month || null,
    total_night_shifts: nightDebt?.total_night_shifts_year || 0,
  };
}

async function initializeDoctorStats(doctorId: string) {
  const currentYear = new Date().getFullYear();
  await supabase.from('night_debt').insert([{ doctor_id: doctorId }]);
  await supabase.from('yearly_fairness').insert([{ doctor_id: doctorId, year: currentYear }]);
}

export async function addDoctor(fullName: string, groupType: GroupType, ekuriPartnerName?: string) {
  if (groupType === 'weekend' && !ekuriPartnerName?.trim()) {
    throw new Error('Hafta sonu grubu doktorları eküri partneri ile birlikte eklenmelidir.');
  }

  const { data, error } = await supabase
    .from('doctors')
    .insert([{ full_name: fullName, group_type: groupType }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  await initializeDoctorStats(data.id);

  if (groupType === 'weekend' && ekuriPartnerName?.trim()) {
    const { data: partner, error: partnerError } = await supabase
      .from('doctors')
      .insert([{ full_name: ekuriPartnerName.trim(), group_type: 'weekend' }])
      .select()
      .single();

    if (partnerError) throw new Error(partnerError.message);

    await initializeDoctorStats(partner.id);
    await createEkuriPair(data.id, partner.id);
  }

  revalidatePath('/admin/doctors');
  return data;
}

export async function updateDoctor(doctorId: string, fullName: string, groupType: GroupType, isActive: boolean) {
  const { data: existingDoctor, error: existingDoctorError } = await supabase
    .from('doctors')
    .select('ekuri_pair_id')
    .eq('id', doctorId)
    .maybeSingle();

  if (existingDoctorError) throw new Error(existingDoctorError.message);

  const ekuriPairId = existingDoctor?.ekuri_pair_id || null;

  if (groupType === 'weekend' && !ekuriPairId) {
    throw new Error('Hafta sonu grubuna alınan doktorun önce eküri eşleşmesi olmalıdır.');
  }

  const { data, error } = await supabase
    .from('doctors')
    .update({ full_name: fullName, group_type: groupType, is_active: isActive })
    .eq('id', doctorId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (ekuriPairId) {
    const { error: partnerUpdateError } = await supabase
      .from('doctors')
      .update({ group_type: groupType })
      .eq('ekuri_pair_id', ekuriPairId);

    if (partnerUpdateError) throw new Error(partnerUpdateError.message);
  }

  revalidatePath('/admin/doctors');
  revalidatePath('/admin/plans');
  return data;
}

export async function setDoctorActive(doctorId: string, isActive: boolean) {
  const { error } = await supabase
    .from('doctors')
    .update({ is_active: isActive })
    .eq('id', doctorId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/doctors');
  revalidatePath('/admin/plans');
}

export async function deleteDoctor(doctorId: string) {
  const { error } = await supabase
    .from('doctors')
    .delete()
    .eq('id', doctorId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/doctors');
  revalidatePath('/admin/plans');
}

export async function createEkuriPair(doctor1Id: string, doctor2Id: string) {
  const { data: doctors, error: doctorsError } = await supabase
    .from('doctors')
    .select('id, group_type, ekuri_pair_id')
    .in('id', [doctor1Id, doctor2Id]);

  if (doctorsError) throw new Error(doctorsError.message);
  if (!doctors || doctors.length !== 2) throw new Error('Doktorlar bulunamadı.');
  if (doctors.some(d => d.ekuri_pair_id)) throw new Error('Seçilen doktorlardan biri zaten eküri.');
  if (doctors.some(d => d.group_type === 'weekend') && doctors.some(d => d.group_type !== 'weekend')) {
    throw new Error('Hafta sonu grubu ekürileri yalnızca hafta sonu grubundan eşleşebilir.');
  }

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
