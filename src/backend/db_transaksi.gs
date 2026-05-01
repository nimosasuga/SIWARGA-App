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
  const TRANSAKSI_ID = "10wCY4kQn2Zhm_9udQvCm_0JTv7nzUjzXJYI0SB3FlsM";
  const db = SpreadsheetApp.openById(TRANSAKSI_ID);
  const sheet = db.getSheetByName("LOG_IURAN");

  if (!sheet) throw new Error("CRITICAL: Sheet LOG_IURAN tidak ditemukan di DB_TRANSAKSI.");

  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];
  const rows = rawData.slice(1);

  // Mapping ke JSON Array dengan Proteksi Tipe Data Universal (Anti-Null Serialization)
  return rows.map((row) => {
    let obj = {};
    headers.forEach((header, index) => {
      let cellValue = row[index];
      let headerName = header.toString().trim();

      // DETEKSI OBJEK TANGGAL ABSOLUT:
      // Menangkap semua tanggal terlepas dari apa nama kolomnya
      if (Object.prototype.toString.call(cellValue) === "[object Date]") {
        if (headerName === "BULAN_DIBAYAR") {
          // Kembalikan format ke "Bulan Tahun" (misal: "Mei 2026")
          const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          obj[headerName] = `${bulanIndo[cellValue.getMonth()]} ${cellValue.getFullYear()}`;
        } else {
          // Format standar mesin waktu (TIMESTAMP)
          obj[headerName] = Utilities.formatDate(cellValue, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        }
      } else {
        obj[headerName] = cellValue; // Masukkan teks/angka biasa
      }
    });
    return obj;
  });
}
