const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const year = 2026;
  console.log(`--- ${year} YILI İSTATİSTİK SENKRONİZASYONU Başladı ---`);

  // 1. O yıla ait tüm planları al
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('id, year_month')
    .like('year_month', `${year}-%`)
    .order('year_month', { ascending: true });

  if (plansError) {
    console.error('Planlar alınamadı:', plansError.message);
    return;
  }

  console.log(`${plans.length} aylık plan bulundu. Senkronizasyon başlıyor...`);

  // 2. Her plan için istatistikleri yeniden hesapla
  for (const plan of plans) {
    process.stdout.write(`İşleniyor: ${plan.year_month}... `);
    const { error: rpcError } = await supabase.rpc('recalculate_plan_stats', {
      p_plan_id: plan.id
    });

    if (rpcError) {
      console.log(`HATA: ${rpcError.message}`);
    } else {
      console.log('OK.');
    }
  }

  console.log(`--- ${year} YILI SENKRONİZASYONU BAŞARIYLA TAMAMLANDI! ---`);
}

main();
