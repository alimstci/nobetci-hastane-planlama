const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = [
  'mart gece.xlsx',
  'mart gunduz.xlsx',
  'nisan gece.xlsx',
  'nisan gunduz.xlsx'
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`--- Analiz Ediliyor: ${file} ---`);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Başlıklar (Headers):', data[0]);
    console.log('İlk 3 Satır (First 3 Rows):', data.slice(1, 4));
    console.log('\n');
  } else {
    console.log(`Dosya bulunamadı: ${file}`);
  }
});
