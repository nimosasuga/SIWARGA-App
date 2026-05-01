/**
 * ==========================================
 * S.I.W.A.R.G.A - DASHBOARD AGGREGATOR
 * Microservice untuk kalkulasi statistik Real-Time
 * ==========================================
 */

function getDashboardSummary() {
  const MASTER_ID = "1Ko4hiHR39_vCHYXKub6FIvjcEDhHZc1UGpoOqD0AUns";
  const TRANSAKSI_ID = "10wCY4kQn2Zhm_9udQvCm_0JTv7nzUjzXJYI0SB3FlsM";

  // 1. Kalkulasi Statistik Warga
  const dbMaster = SpreadsheetApp.openById(MASTER_ID).getSheetByName("DATA_WARGA");
  const dataWarga = dbMaster.getDataRange().getValues().slice(1);

  let totalWarga = 0;
  let wargaAktif = 0;

  dataWarga.forEach((row) => {
    if (row[5] === "WARGA") {
      // Hanya hitung Role "WARGA" (Pengurus/Admin tidak dihitung sebagai target iuran)
      totalWarga++;
      if (row[6] === "AKTIF") wargaAktif++;
    }
  });

  // 2. Kalkulasi Statistik Kas & Keuangan
  const dbTrans = SpreadsheetApp.openById(TRANSAKSI_ID).getSheetByName("LOG_IURAN");
  const dataTrans = dbTrans.getDataRange().getValues().slice(1);

  let totalKas = 0;
  let kasBulanIni = 0;

  // Rumus untuk mendeteksi bulan saat ini (Sesuai format Seeder: "Mei 2026")
  const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dateNow = new Date();
  const strBulanIni = `${bulanIndo[dateNow.getMonth()]} ${dateNow.getFullYear()}`;

  dataTrans.forEach((row) => {
    let nominal = parseFloat(row[3]) || 0; // Kolom ke-4 (Index 3) adalah NOMINAL
    totalKas += nominal;

    let bulanDibayar = row[4]; // Kolom ke-5 (Index 4) adalah BULAN_DIBAYAR
    // Proteksi Date Object Google Sheets
    if (Object.prototype.toString.call(bulanDibayar) === "[object Date]") {
      bulanDibayar = `${bulanIndo[bulanDibayar.getMonth()]} ${bulanDibayar.getFullYear()}`;
    }

    if (bulanDibayar === strBulanIni) {
      kasBulanIni += nominal;
    }
  });

  // 3. Kembalikan Paket JSON ke Frontend
  return {
    totalWarga: totalWarga,
    wargaAktif: wargaAktif,
    totalKas: totalKas,
    kasBulanIni: kasBulanIni,
    bulanIniStr: strBulanIni,
  };
}
