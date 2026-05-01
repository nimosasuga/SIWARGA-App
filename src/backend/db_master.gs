/**
 * ==========================================
 * DATABASE MASTER CONFIGURATION & METHODS
 * Mengelola Data Warga, Jabatan, dan Akses
 * ==========================================
 */
const DB_MASTER_ID = "1Ko4hiHR39_vCHYXKub6FIvjcEDhHZc1UGpoOqD0AUns";

/**
 * Helper untuk mengambil sheet DATA_WARGA
 */
function getSheetWarga() {
  return SpreadsheetApp.openById(DB_MASTER_ID).getSheetByName("DATA_WARGA");
}