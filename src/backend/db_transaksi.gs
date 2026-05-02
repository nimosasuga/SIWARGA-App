// File: src/backend/db_transaksi.gs
// [LOCATOR: Ganti seluruh isi file db_transaksi.gs dengan blok ini]

/**
 * ==========================================
 * S.I.W.A.R.G.A - DB TRANSAKSI OPERATIONS (V3)
 * Menggunakan tenant_db_id dinamis dari sesi user
 * ==========================================
 */

/** [READ] Mengambil SELURUH riwayat transaksi dari DB Transaksi milik RT */
function getAllTransaksi(userProfile) {
  if (!userProfile || !userProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  const db = SpreadsheetApp.openById(userProfile.tenant_db_id);
  const sheet = db.getSheetByName("LOG_IURAN");
  if (!sheet) throw new Error("CRITICAL: Sheet LOG_IURAN tidak ditemukan di DB Tenant Anda.");

  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];
  const rows = rawData.slice(1);

  return rows.map((row) => {
    let obj = {};
    headers.forEach((header, index) => {
      let cellValue = row[index];
      let headerName = header.toString().trim();
      if (Object.prototype.toString.call(cellValue) === "[object Date]") {
        if (headerName === "BULAN_DIBAYAR") {
          const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          obj[headerName] = `${bulanIndo[cellValue.getMonth()]} ${cellValue.getFullYear()}`;
        } else {
          obj[headerName] = Utilities.formatDate(cellValue, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        }
      } else {
        obj[headerName] = cellValue;
      }
    });
    return obj;
  });
}

/** [READ] Mengambil riwayat transaksi KHUSUS untuk satu warga (Self-Service) */
function getTransaksiByUser(userProfile, targetUsername) {
  if (!userProfile || !userProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  // Zero-Trust Security: Jika role WARGA, hanya boleh akses datanya sendiri.
  let queryUsername = targetUsername || userProfile.username;
  if (userProfile.role === "WARGA" && queryUsername !== userProfile.username) {
    throw new Error("Sistem Menolak (Zero-Trust): Anda tidak diizinkan melihat transaksi warga lain.");
  }

  const db = SpreadsheetApp.openById(userProfile.tenant_db_id);
  const sheet = db.getSheetByName("LOG_IURAN");
  if (!sheet) throw new Error("CRITICAL: Sheet LOG_IURAN tidak ditemukan di DB Tenant Anda.");

  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];
  const rows = rawData.slice(1);
  const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  let result = [];
  rows.forEach((row) => {
    // Index 2 adalah USERNAME pada tabel LOG_IURAN
    if (row[2].toString().trim() === queryUsername.trim()) {
      let obj = {};
      headers.forEach((header, index) => {
        let cellValue = row[index];
        let headerName = header.toString().trim();
        if (Object.prototype.toString.call(cellValue) === "[object Date]") {
          if (headerName === "BULAN_DIBAYAR") obj[headerName] = `${bulanIndo[cellValue.getMonth()]} ${cellValue.getFullYear()}`;
          else obj[headerName] = Utilities.formatDate(cellValue, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        } else {
          obj[headerName] = cellValue;
        }
      });
      result.push(obj);
    }
  });

  // Urutkan dari yang terbaru ke terlama
  result.sort((a, b) => new Date(b.TIMESTAMP) - new Date(a.TIMESTAMP));
  return result;
}
