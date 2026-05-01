/**
 * ==========================================
 * S.I.W.A.R.G.A - DB MASTER OPERATIONS
 * Menangani logika CRUD untuk Data Penduduk
 * ==========================================
 */

/**
 * Mengambil SELURUH data warga dari DB Master
 * @returns {Array<Object>} Array of Warga Objects
 */
function getAllWarga() {
  const MASTER_ID = "1Ko4hiHR39_vCHYXKub6FIvjcEDhHZc1UGpoOqD0AUns";
  const db = SpreadsheetApp.openById(MASTER_ID);
  const sheet = db.getSheetByName("DATA_WARGA");

  if (!sheet) throw new Error("Sheet DATA_WARGA tidak ditemukan. Periksa Database Master.");

  // Ambil semua data sekaligus (O(1) Request)
  const rawData = sheet.getDataRange().getValues();

  const headers = rawData[0]; // Baris 1 adalah Header
  const rows = rawData.slice(1); // Baris 2 ke bawah adalah Data

  // Mapping Array 2D menjadi Array of Objects
  const result = rows.map((row) => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return result;
}
