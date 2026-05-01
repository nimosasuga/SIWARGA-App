/**
 * ONE-TIME SETUP SCRIPT
 * Jalankan fungsi ini HANYA SEKALI untuk membuat infrastruktur database.
 */
function setupDatabaseOtomatis() {
  // 1. Membuat Folder Utama di Root Drive
  var folderName = "SIWARGA_DATABASE_PROD";
  var folder = DriveApp.createFolder(folderName);

  // 2. Membuat DB_MASTER (Terisolasi)
  var dbMaster = SpreadsheetApp.create("SIWARGA_DB_MASTER");
  DriveApp.getFileById(dbMaster.getId()).moveTo(folder);

  var sheetWarga = dbMaster.getSheets()[0];
  sheetWarga.setName("DATA_WARGA");
  // Kolom dasar RBAC & Data Warga
  sheetWarga.appendRow(["NIK", "NAMA", "NO_HP", "BLOK_RUMAH", "JABATAN", "ROLE", "STATUS"]);

  // 3. Membuat DB_TRANSAKSI (Terisolasi)
  var dbTransaksi = SpreadsheetApp.create("SIWARGA_DB_TRANSAKSI");
  DriveApp.getFileById(dbTransaksi.getId()).moveTo(folder);

  var sheetIuran = dbTransaksi.getSheets()[0];
  sheetIuran.setName("LOG_IURAN");
  // Kolom transaksi untuk Reverse Loop
  sheetIuran.appendRow(["ID_TRANSAKSI", "TIMESTAMP", "NIK", "NOMINAL", "BULAN_DIBAYAR", "PETUGAS"]);

  // 4. Output ID untuk di-binding ke sistem
  Logger.log("=== SETUP SELESAI ===");
  Logger.log("Folder ID: " + folder.getId());
  Logger.log("DB_MASTER ID: " + dbMaster.getId());
  Logger.log("DB_TRANSAKSI ID: " + dbTransaksi.getId());
}

/**
 * ONE-TIME EXECUTION: Injeksi Data Warga Awal (Username & Password)
 */
function injectDataAwal() {
  const sheet = getSheetWarga();

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  // Perubahan Kolom: [USERNAME, NAMA, PASSWORD, BLOK_RUMAH, JABATAN, ROLE, STATUS]
  const dataDummy = [
    ["admin", "Bapak Super Admin", "admin123", "Blok A/1", "Developer", "SUPER_ADMIN", "AKTIF"],
    ["rt01", "Bapak Ketua RT", "rt123", "Blok A/2", "Ketua RT", "KETUA_RT", "AKTIF"],
    ["bendahara", "Ibu Bendahara", "uang123", "Blok B/1", "Bendahara", "PENGURUS", "AKTIF"],
    ["warga01", "Bapak Warga Biasa", "warga123", "Blok C/5", "Warga", "WARGA", "AKTIF"],
  ];

  sheet.getRange(2, 1, dataDummy.length, dataDummy[0].length).setValues(dataDummy);
  Logger.log("Suntik Data Berhasil! Format USERNAME dan PASSWORD diterapkan.");
}
