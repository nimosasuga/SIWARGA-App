// File: src/backend/db_master.gs
// [LOCATOR: Ganti seluruh isi file db_master.gs dengan blok ini]

/**
 * ==========================================
 * S.I.W.A.R.G.A - DB MASTER & TENANT OPERATIONS (V3)
 * Menangani logika CRUD Dual-Write (Split Auth & Profile)
 * ==========================================
 */
const MASTER_ID_AUTH = "1BIXJOrqtfpe2RvX9xDNiXJbl4EImfHUehF71uZeCuU8";

/** [READ] Mengambil profil penduduk khusus di RT admin yang sedang login */
function getAllWarga(adminProfile) {
  if (!adminProfile || !adminProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid atau terputus.");

  const tenantSS = SpreadsheetApp.openById(adminProfile.tenant_db_id);
  const sheet = tenantSS.getSheetByName("DATA_PENDUDUK");
  if (!sheet) throw new Error("Sheet DATA_PENDUDUK tidak ditemukan di Brankas Data RT Anda.");

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

/** [CREATE] Dual-Write: Menambah warga ke Master Auth & Tenant Profile */
function createWarga(adminProfile, data) {
  if (!adminProfile || !adminProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  const masterSS = SpreadsheetApp.openById(MASTER_ID_AUTH);
  const sheetAuth = masterSS.getSheetByName("DATA_WARGA");
  const authData = sheetAuth.getDataRange().getValues();

  // 1. Validasi Zero-Collision (Username harus unik secara global)
  const isExist = authData.some((row) => row[0].toString().trim() === data.USERNAME.trim());
  if (isExist) throw new Error("Username sudah digunakan di sistem. Silakan gunakan username lain.");

  // 2. Tulis Kredensial ke Master DB (Auth Hub)
  // Struktur: [USERNAME, PASSWORD, ROLE, KODE_KAWASAN, KODE_RT, KODE_RW, DB_TRANSAKSI_ID]
  sheetAuth.appendRow([data.USERNAME, data.PASSWORD, data.ROLE, adminProfile.kode_kawasan, adminProfile.kode_rt, adminProfile.kode_rw, adminProfile.tenant_db_id]);

  // 3. Tulis Profil Lengkap ke Tenant DB (Brankas Data)
  // Struktur: [USERNAME, NAMA_LENGKAP, NIK, BLOK_RUMAH, NO_HP, JABATAN, STATUS]
  const tenantSS = SpreadsheetApp.openById(adminProfile.tenant_db_id);
  const sheetPenduduk = tenantSS.getSheetByName("DATA_PENDUDUK");
  sheetPenduduk.appendRow([data.USERNAME, data.NAMA_LENGKAP, data.NIK, data.BLOK_RUMAH, data.NO_HP, data.JABATAN, data.STATUS]);

  return "Data penduduk berhasil ditambahkan dan diamankan di brankas terisolasi.";
}

/** [UPDATE] Dual-Update: Memperbarui data warga di Master & Tenant */
function updateWarga(adminProfile, username, data) {
  if (!adminProfile || !adminProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  let successCount = 0;

  // 1. Update Kredensial di Master DB
  const sheetAuth = SpreadsheetApp.openById(MASTER_ID_AUTH).getSheetByName("DATA_WARGA");
  const authData = sheetAuth.getDataRange().getValues();
  for (let i = 1; i < authData.length; i++) {
    if (authData[i][0].toString() === username.toString()) {
      // Update Password dan Role (Kolom B dan C)
      sheetAuth.getRange(i + 1, 2, 1, 2).setValues([[data.PASSWORD, data.ROLE]]);
      successCount++;
      break;
    }
  }

  // 2. Update Profil di Tenant DB
  const sheetPenduduk = SpreadsheetApp.openById(adminProfile.tenant_db_id).getSheetByName("DATA_PENDUDUK");
  const pData = sheetPenduduk.getDataRange().getValues();
  for (let j = 1; j < pData.length; j++) {
    if (pData[j][0].toString() === username.toString()) {
      const updatedRow = [data.USERNAME, data.NAMA_LENGKAP, data.NIK, data.BLOK_RUMAH, data.NO_HP, data.JABATAN, data.STATUS];
      sheetPenduduk.getRange(j + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
      successCount++;
      break;
    }
  }

  if (successCount === 0) throw new Error("Pembaruan gagal: Data tidak ditemukan.");
  return "Data penduduk berhasil diperbarui di seluruh ekosistem.";
}

/** [DELETE] Dual-Delete: Menghapus data warga dari Master & Tenant */
function deleteWarga(adminProfile, username) {
  if (!adminProfile || !adminProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  // Proteksi Bunuh Diri (Mencegah admin menghapus dirinya sendiri)
  if (adminProfile.username === username) throw new Error("Sistem menolak! Anda tidak dapat menghapus akun Anda sendiri.");

  let successCount = 0;

  // 1. Hapus Kredensial dari Master DB
  const sheetAuth = SpreadsheetApp.openById(MASTER_ID_AUTH).getSheetByName("DATA_WARGA");
  const authData = sheetAuth.getDataRange().getValues();
  for (let i = 1; i < authData.length; i++) {
    if (authData[i][0].toString() === username.toString()) {
      if (authData[i][2] === "SUPER_ADMIN") throw new Error("Sistem menolak! Super Admin tidak bisa dihapus.");
      sheetAuth.deleteRow(i + 1);
      successCount++;
      break;
    }
  }

  // 2. Hapus Profil dari Tenant DB
  const sheetPenduduk = SpreadsheetApp.openById(adminProfile.tenant_db_id).getSheetByName("DATA_PENDUDUK");
  const pData = sheetPenduduk.getDataRange().getValues();
  for (let j = 1; j < pData.length; j++) {
    if (pData[j][0].toString() === username.toString()) {
      sheetPenduduk.deleteRow(j + 1);
      successCount++;
      break;
    }
  }

  if (successCount === 0) throw new Error("Penghapusan gagal: Data tidak ditemukan.");
  return "Data penduduk berhasil dihapus permanen dari sistem.";
}

/**
 * [UPDATE] Fitur Self-Service Khusus Pengguna
 * Hanya mengizinkan pergantian Username & Password
 */
function updateMyCredentials(userProfile, newUsername, newPassword) {
  if (!userProfile || !userProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  const oldUsername = userProfile.username;
  const targetUsername = newUsername.trim() || oldUsername;

  const masterSS = SpreadsheetApp.openById(MASTER_ID_AUTH);
  const sheetAuth = masterSS.getSheetByName("DATA_WARGA");
  const authData = sheetAuth.getDataRange().getValues();

  // 1. Validasi Zero-Collision (Cek bentrok jika ganti username)
  if (targetUsername !== oldUsername) {
    const isExist = authData.some((row) => row[0].toString().trim() === targetUsername);
    if (isExist) throw new Error("Username sudah digunakan di sistem. Silakan pilih username lain.");
  }

  let successCount = 0;
  let finalPassword = "";

  // 2. Update Auth DB (Kredensial Master)
  for (let i = 1; i < authData.length; i++) {
    if (authData[i][0].toString() === oldUsername) {
      // Jika password kosong, pertahankan password lama
      finalPassword = newPassword ? newPassword.trim() : authData[i][1].toString();
      // Update Kolom USERNAME dan PASSWORD (Kolom A & B / Index 1 & 2)
      sheetAuth.getRange(i + 1, 1, 1, 2).setValues([[targetUsername, finalPassword]]);
      successCount++;
      break;
    }
  }

  // 3. Update Profil DB (Brankas Tenant)
  const tenantSS = SpreadsheetApp.openById(userProfile.tenant_db_id);
  const sheetPenduduk = tenantSS.getSheetByName("DATA_PENDUDUK");
  const pData = sheetPenduduk.getDataRange().getValues();

  for (let j = 1; j < pData.length; j++) {
    if (pData[j][0].toString() === oldUsername) {
      // Hanya menimpa sel USERNAME di Kolom A
      sheetPenduduk.getRange(j + 1, 1).setValue(targetUsername);
      successCount++;
      break;
    }
  }

  if (successCount < 2) throw new Error("Pembaruan gagal: Sinkronisasi antar database terputus.");
  return "Kredensial berhasil diperbarui. Perubahan otomatis aktif!";
}
