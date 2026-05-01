/**
 * ==========================================
 * DATABASE TRANSAKSI CONFIGURATION & METHODS
 * Mengelola Log Iuran, Surat Keluar, dll
 * ==========================================
 */
const DB_TRANSAKSI_ID = "10wCY4kQn2Zhm_9udQvCm_0JTv7nzUjzXJYI0SB3FlsM";

/**
 * Helper untuk mengambil sheet LOG_IURAN
 */
function getSheetIuran() {
  return SpreadsheetApp.openById(DB_TRANSAKSI_ID).getSheetByName("LOG_IURAN");
}
