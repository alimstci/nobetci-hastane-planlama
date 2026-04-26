import { supabase } from './supabase';

const DOCTOR_NAMES = [
  "Ahmet Yılmaz", "Ayşe Kaya", "Mehmet Demir", "Fatma Şahin", "Mustafa Çelik",
  "Emine Yıldız", "Ali Öztürk", "Zeynep Aydın", "Hüseyin Özdemir", "Elif Arslan",
  "İbrahim Doğan", "Sultan Kılıç", "Yusuf Aslan", "Hatice Çetin", "Murat Kara",
  "Ömer Aksoy", "Hava Köse", "Ramazan Kaplan", "Fidan Erdoğan", "Salih Taş",
  "Gültekin Koç", "Meryem Kurt", "Adem Özkan", "Asiye Şimşek", "Sefa Polat",
  "Dilek Özcan", "Metin Korkmaz", "Sibel Çakır", "Ercan Can", "Aynur Yavuz",
  "Ferhat Uzun", "Nazan Şen", "Gökhan Orhan", "Leyla Güler", "Serkan Aktaş",
  "Bülent Bulut", "Nurcan Erdem", "Engin Işık", "Filiz Akın", "Turgut Yüksel",
  "Seda Güneş", "Mesut Tekin", "Bahar Avcı", "Cihan Sarı", "Arzu Yıldırım",
  "Sertan Bakır", "Tülay Bayram", "Kenan Deniz", "Semra Coşkun", "Hayati Bulut",
  "Deniz Ateş", "Gözde Akman", "Uğur Karaca", "Selda Er", "Yavuz Selim",
  "Esra Sönmez", "Levent Ünal", "Funda Yiğit", "Caner Ay", "Pınar Yaman",
  "Özcan Durmaz", "Arif Erol", "Semih Şener", "Selin Gök", "Fatih Terim",
  "Şenol Güneş", "Okan Buruk", "İsmail Kartal", "Nuri Şahin", "Arda Turan",
  "Hakan Çalhanoğlu", "Kenan Yıldız", "Semih Kılıçsoy"
];

export async function seedDoctors() {
  console.log('Seed işlemi başlıyor...');

  // 1. Clear existing data (Be careful in production!)
  // In our case, we just insert.
  
  const doctorInserts = DOCTOR_NAMES.map((name, index) => ({
    full_name: name,
    group_type: index < 56 ? 'normal' : 'weekend',
    is_active: true
  }));

  const { data: doctors, error: dError } = await supabase
    .from('doctors')
    .insert(doctorInserts)
    .select();

  if (dError) {
    console.error('Doktor ekleme hatası:', dError);
    return;
  }

  console.log(`${doctors.length} doktor eklendi.`);

  // 2. Randomly Pair some doctors (Eküri)
  const pairInserts = [];
  const weekendDoctors = doctors.filter(d => d.group_type === 'weekend');
  for (let i = 0; i < weekendDoctors.length - 1; i += 2) {
    pairInserts.push({
      doctor1_id: weekendDoctors[i].id,
      doctor2_id: weekendDoctors[i + 1].id
    });
  }

  const { data: pairs, error: pError } = await supabase
    .from('ekuri_pairs')
    .insert(pairInserts)
    .select();

  if (pError) console.error('Eküri hatası:', pError);

  // Update doctors with pair IDs
  for (const pair of (pairs || [])) {
    await supabase.from('doctors')
      .update({ ekuri_pair_id: pair.id })
      .in('id', [pair.doctor1_id, pair.doctor2_id]);
  }

  // 3. Initialize debt and fairness for all
  const year = new Date().getFullYear();
  const debtInserts = doctors.map(d => ({ doctor_id: d.id }));
  const fairnessInserts = doctors.map(d => ({ doctor_id: d.id, year }));

  await supabase.from('night_debt').insert(debtInserts);
  await supabase.from('yearly_fairness').insert(fairnessInserts);

  console.log('Seed işlemi başarıyla tamamlandı.');
}
