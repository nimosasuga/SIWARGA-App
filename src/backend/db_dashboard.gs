// File: src/backend/db_dashboard.gs
// [LOCATOR: Ganti seluruh isi file db_dashboard.gs dengan blok ini]

/**
 * ==========================================
 * S.I.W.A.R.G.A - DASHBOARD AGGREGATOR (V3)
 * Microservice Kalkulasi Statistik Terisolasi (Per RT)
 * ==========================================
 */
function getDashboardSummary(userProfile) {
  if (!userProfile || !userProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  const tenantSS = SpreadsheetApp.openById(userProfile.tenant_db_id);

  // 1. Kalkulasi Statistik Warga (Terisolasi per RT)
  const dbPenduduk = tenantSS.getSheetByName("DATA_PENDUDUK");
  const dataPenduduk = dbPenduduk.getDataRange().getValues().slice(1);

  let totalWarga = 0;
  let wargaAktif = 0;

  dataPenduduk.forEach((row) => {
    // Struktur DATA_PENDUDUK: [USERNAME, NAMA, NIK, BLOK, NO_HP, JABATAN, STATUS]
    totalWarga++;
    if (row[6] === "AKTIF") wargaAktif++;
  });

  // 2. Kalkulasi Statistik Kas & Keuangan (Terisolasi per RT)
  const dbTrans = tenantSS.getSheetByName("LOG_IURAN");
  const dataTrans = dbTrans.getDataRange().getValues().slice(1);

  let totalKas = 0;
  let kasBulanIni = 0;

  const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const dateNow = new Date();
  const strBulanIni = `${bulanIndo[dateNow.getMonth()]} ${dateNow.getFullYear()}`;

  dataTrans.forEach((row) => {
    // Struktur LOG_IURAN: [ID_TRANSAKSI, TIMESTAMP, USERNAME, NOMINAL, BULAN_DIBAYAR, PETUGAS]
    let nominal = parseFloat(row[3]) || 0;
    totalKas += nominal;

    let bulanDibayar = row[4];
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
    infoKawasan: `RT ${userProfile.kode_rt} / RW ${userProfile.kode_rw} (${userProfile.kode_kawasan})`, // Tambahan label untuk UI
  };
}
