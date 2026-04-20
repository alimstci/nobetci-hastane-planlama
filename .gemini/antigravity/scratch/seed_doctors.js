const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const weekendGroup = [
  'DT.AMED DAĞ', 'DT.BAHAR BARAN YILDIZ', 'DT.ÇİĞDEM SEVİM', 'DT.HAMDULLAH ÇAKIR',
  'DT.İDRİS GENÇ', 'DT.MAHMUT ŞEKER', 'DT.MELEK ŞÜKRAN COŞAN', 'DT.REMZİ YETİŞ',
  'DT.UMUT KARTAL', 'DT.YUNUS ŞAHİN', 'DT.YASEMİN İNANÇ', 'DT.ŞEYMA ÖNCEL TUNCER',
  'DT.ADİL AKAT', 'DT.HALİL GÖRGİN', 'DT.CUMA GÖÇER', 'DT.YAKUP GÖNÜL'
];

const allDoctors = [
  "DT.ABDULKERİM ŞEKER", "DT.ADİL AKAT", "DT.ADİL TURGUT", "DT.ALİ SEZER", "DT.AMED DAĞ",
  "DT.AZİME OĞUR", "DT.BAHAR BARAN YILDIZ", "DT.BAHAR ÖZDEMİR", "DT.BEDİA TEKEŞ", "DT.BİLAL TUTUMLU",
  "DT.CUMA GÖÇER", "DT.CÜNEYT GÖÇÜN", "DT.ELİF İLERİ", "DT.ELİF KILICIKAN", "DT.EMRAH ŞENTÜRK",
  "DT.EMİNE AKMAN", "DT.FATMA TAŞ", "DT.FATİH KANDEMİR", "DT.FATİH UTANÇ", "DT.FELEK ORAT",
  "DT.FERHAT AZGINKILIÇ", "DT.FERHAT GÜNEY", "DT.HAKAN ACAR", "DT.HALİL GÖRGİN", "DT.HALİL SERAÇ",
  "DT.HAMDULLAH ÇAKIR", "DT.HAMİT ADLIĞ", "DT.HANİFE MEMİŞ", "DT.HASAN YILMAZ", "DT.HERGEŞ BEŞTAŞ",
  "DT.İDRİS GENÇ", "DT.İLYAS YILMAZ", "DT.İLYAS ÇİFTÇİ", "DT.LEYLA IŞIK", "DT.M.SAİT ASLAN",
  "DT.MAHMUT KARACAN", "DT.MAHMUT ŞEKER", "DT.MAZLUM TAYMUR", "DT.MAZLUM VARLI", "DT.MEDİNE ADIN",
  "DT.MEHMET DEMİRTAŞ", "DT.MEHMET ŞİRİN ŞEKER", "DT.MELEK ŞÜKRAN COŞAN", "DT.MIZGİN BİLMEZ",
  "DT.MUHAMMED ENES SEVİLMEZ", "DT.MUHAMMED ŞENER", "DT.MUHAMMET VURULMAZ", "DT.NERGİZ TAYMUR",
  "DT.NEVİN OĞUZ", "DT.NURHAN GÖCÜNCÜ", "DT.NUŞİN YAKUT", "DT.NİMETTULAH YAKUT", "DT.RABİA GİZEM AZGINKILIÇ",
  "DT.RAMAZAN BULDUK", "DT.REMZİ YETİŞ", "DT.REMZİYE ŞENGÜL", "DT.SAADET ULUSOY", "DT.SULTAN APRAĞ",
  "DT.SÜMEYE DOĞAN", "DT.SÜMEYE DURSUN", "DT.TURGAY ARIKAN", "DT.UMUT GÜNDÜZ", "DT.UMUT KARTAL",
  "DT.VEYSİ TUTAR", "DT.YAKUP GÖNÜL", "DT.YASEMİN İNANÇ", "DT.YUNUS ÖZTÜRK", "DT.YUNUS ŞAHİN",
  "DT.ÇİĞDEM SEVİM", "DT.ŞERZAN TOPRAK", "DT.ŞEYMA ÖNCEL TUNCER", "DT.ŞEYMA TANIK", "DT.ŞÜKRAN TUĞBA EKİNCİ"
];

const ekuriSuggested = [
  ["DT.MUHAMMED ENES SEVİLMEZ", "DT.İLYAS YILMAZ"],
  ["DT.BAHAR ÖZDEMİR", "DT.ALİ SEZER"],
  ["DT.MAZLUM TAYMUR", "DT.MUHAMMET VURULMAZ"],
  ["DT.HALİL SERAÇ", "DT.UMUT GÜNDÜZ"],
  ["DT.İLYAS ÇİFTÇİ", "DT.M.SAİT ASLAN"],
  ["DT.NEVİN OĞUZ", "DT.NUŞİN YAKUT"]
];

async function seed() {
  console.log('--- Doktor seeding başlatıldı ---');
  
  // 1. Doctors
  const doctorInserts = allDoctors.map(name => ({
    full_name: name,
    group_type: weekendGroup.includes(name) ? 'weekend' : 'normal',
    is_active: true
  }));

  const { data: doctors, error: dError } = await supabase.from('doctors').insert(doctorInserts).select();
  if (dError) {
    console.error('Doktor ekleme hatası:', dError);
    return;
  }
  console.log(`${doctors.length} doktor eklendi.`);

  // 2. Eküri Çiftleri
  const doctorMap = doctors.reduce((acc, d) => ({ ...acc, [d.full_name]: d.id }), {});
  
  const ekuriInserts = [];
  for (const [name1, name2] of ekuriSuggested) {
    const id1 = doctorMap[name1];
    const id2 = doctorMap[name2];
    if (id1 && id2) {
      ekuriInserts.push({ doctor1_id: id1, doctor2_id: id2 });
    }
  }

  const { data: ekuris, error: eError } = await supabase.from('ekuri_pairs').insert(ekuriInserts).select();
  if (eError) {
    console.error('Eküri ekleme hatası:', eError);
  } else {
    console.log(`${ekuris.length} eküri çifti bağlandı.`);
    
    // Update doctors with their pair ID
    for (const ekuri of ekuris) {
      await supabase.from('doctors').update({ ekuri_pair_id: ekuri.id }).in('id', [ekuri.doctor1_id, ekuri.doctor2_id]);
    }
    console.log('Doktorlar eküri partnerleriyle ilişkilendirildi.');
  }

  // 3. Night Debt Initialization
  const nightDebtInserts = doctors.map(d => ({ doctor_id: d.id }));
  await supabase.from('night_debt').insert(nightDebtInserts);
  console.log('Gece borç tabloları oluşturuldu.');

  console.log('--- Seeding başarıyla tamamlandı! ---');
}

seed();
