/**
 * ==========================================
 * S.I.W.A.R.G.A - DB MASTER OPERATIONS
 * Menangani logika CRUD untuk Data Penduduk
 * ==========================================
 */

function _getSheetWarga() {
  const MASTER_ID = "1Ko4hiHR39_vCHYXKub6FIvjcEDhHZc1UGpoOqD0AUns";
  return SpreadsheetApp.openById(MASTER_ID).getSheetByName("DATA_WARGA");
}

/** [READ] Mengambil data */
function getAllWarga() {
  const sheet = _getSheetWarga();
  if (!sheet) throw new Error("Sheet DATA_WARGA tidak ditemukan.");

  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];
  const rows = rawData.slice(1);

  return rows.map((row) => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

/** [CREATE] Menambah warga baru */
function createWarga(data) {
  const sheet = _getSheetWarga();
  const rawData = sheet.getDataRange().getValues();

  // Validasi Username Unik
  const isExist = rawData.some((row) => row[0].toString().trim() === data.USERNAME.trim());
  if (isExist) throw new Error("Username sudah digunakan, silakan gunakan username lain.");

  // Urutan Kolom: [USERNAME, NAMA, PASSWORD, BLOK_RUMAH, JABATAN, ROLE, STATUS]
  const newRow = [data.USERNAME, data.NAMA, data.PASSWORD, data.BLOK_RUMAH, data.JABATAN, data.ROLE, data.STATUS];
  sheet.appendRow(newRow);
  return "Data penduduk berhasil ditambahkan.";
}

/** [UPDATE] Memperbarui warga yang ada */
function updateWarga(username, data) {
  const sheet = _getSheetWarga();
  const rawData = sheet.getDataRange().getValues();
  const headers = rawData[0];

  for (let i = 1; i < rawData.length; i++) {
    if (rawData[i][0].toString() === username.toString()) {
      const rowNumber = i + 1; // Index array + 1 karena array mulai dari 0
      const updatedRow = [data.USERNAME, data.NAMA, data.PASSWORD, data.BLOK_RUMAH, data.JABATAN, data.ROLE, data.STATUS];
      // Timpa baris secara absolut
      sheet.getRange(rowNumber, 1, 1, headers.length).setValues([updatedRow]);
      return "Data penduduk berhasil diperbarui.";
    }
  }
  throw new Error("Pembaruan gagal: Data tidak ditemukan di database.");
}

/** [DELETE] Menghapus data warga */
function deleteWarga(username) {
  const sheet = _getSheetWarga();
  const rawData = sheet.getDataRange().getValues();

  for (let i = 1; i < rawData.length; i++) {
    if (rawData[i][0].toString() === username.toString()) {
      if (rawData[i][5] === "SUPER_ADMIN") throw new Error("Sistem menolak! Super Admin tidak bisa dihapus.");

      sheet.deleteRow(i + 1);
      return "Data penduduk berhasil dihapus permanen.";
    }
  }
  throw new Error("Penghapusan gagal: Data tidak ditemukan.");
}
