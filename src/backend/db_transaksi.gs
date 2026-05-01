/**
 * ==========================================
 * S.I.W.A.R.G.A - DB TRANSAKSI OPERATIONS
 * Microservice khusus untuk Modul Kas & Keuangan
 * ==========================================
 */

/**
 * Mengambil SELURUH riwayat transaksi dari DB Transaksi
 * @returns {Array<Object>} Array of Transaction Objects
 */
function getAllTransaksi() {
  // ID Absolut DB Transaksi (Production Locked)
  const TRANSAKSI_ID = "10wCY4kQn2Zhm_9udQvCm_0JTv7nzUjzXJYI0SB3FlsM";
  const db = SpreadsheetApp.openById(TRANSAKSI_ID);
  const sheet = db.getSheetByName("LOG_IURAN");

  if (!sheet) throw new Error("CRITICAL: Sheet LOG_IURAN tidak ditemukan di DB_TRANSAKSI.");

  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];
  const rows = rawData.slice(1);

  // Mapping ke JSON Array
  return rows.map((row) => {
    let obj = {};
    headers.forEach((header, index) => {
      // Pastikan format tanggal aman untuk dikirim ke Frontend
      if (header === "TIMESTAMP" && row[index] instanceof Date) {
        obj[header] = Utilities.formatDate(row[index], "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
      } else {
        obj[header] = row[index];
      }
    });
    return obj;
  });
}
