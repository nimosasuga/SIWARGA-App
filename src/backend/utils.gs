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
 * ONE-TIME EXECUTION: Injeksi Data Warga Awal (RBAC)
 */
function injectDataAwal() {
  const sheet = getSheetWarga();

  // Bersihkan data lama jika ada (Kecuali Header di baris 1)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  // Hierarki RBAC Mutlak
  const dataDummy = [
    // ["NIK", "NAMA", "NO_HP", "BLOK_RUMAH", "JABATAN", "ROLE", "STATUS"]
    ["'111111", "Bapak Super Admin", "'081111", "Blok A/1", "Developer", "SUPER_ADMIN", "AKTIF"],
    ["'222222", "Bapak Ketua RT", "'082222", "Blok A/2", "Ketua RT", "KETUA_RT", "AKTIF"],
    ["'333333", "Ibu Bendahara", "'083333", "Blok B/1", "Bendahara", "PENGURUS", "AKTIF"],
    ["'444444", "Bapak Warga Biasa", "'084444", "Blok C/5", "Warga", "WARGA", "AKTIF"],
  ];

  // Suntikkan langsung secara massal untuk optimasi kecepatan O(1) request
  sheet.getRange(2, 1, dataDummy.length, dataDummy[0].length).setValues(dataDummy);

  Logger.log("Suntik Data Berhasil! 4 Akun Hierarki telah dibuat di DB_MASTER.");
}
