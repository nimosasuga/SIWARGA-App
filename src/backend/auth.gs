/**
 * ==========================================
 * AUTHENTICATION & RBAC MODULE
 * Zero Trust Validation System
 * ==========================================
 */

// Hierarki Hak Akses Absolut (Semakin tinggi angka, semakin kuat aksesnya)
const ROLE_LEVEL = {
  SUPER_ADMIN: 4,
  KETUA_RT: 3,
  PENGURUS: 2,
  WARGA: 1,
  GUEST: 0,
};

/**
 * ==========================================
 * AUTHENTICATION & RBAC MODULE (V3 ARCHITECTURE)
 * 2-Step Jump: Master (Auth) -> Tenant (Profile)
 * ==========================================
 */
function authenticateUser(usernameInput, passwordInput) {
  // --- TAHAP 1: VERIFIKASI KE MASTER DB (AUTH HUB) ---
  // Ganti MASTER_ID ini dengan ID V3 Anda yang baru
  const MASTER_ID = "1BIXJOrqtfpe2RvX9xDNiXJbl4EImfHUehF71uZeCuU8";
  const masterSS = SpreadsheetApp.openById(MASTER_ID);

  const sheetAuth = masterSS.getSheetByName("DATA_WARGA");
  if (!sheetAuth) throw new Error("CRITICAL: Sheet DATA_WARGA tidak ditemukan di Master DB.");

  const dataAuth = sheetAuth.getDataRange().getValues();

  let inputU = usernameInput.toString().trim();
  let inputP = passwordInput.toString().trim();
  let authData = null;

  // Looping Auth (Indeks: [0:USERNAME, 1:PASSWORD, 2:ROLE, 3:KAWASAN, 4:RT, 5:RW, 6:TENANT_DB_ID])
  for (let i = 1; i < dataAuth.length; i++) {
    let rowUser = dataAuth[i][0].toString().trim();
    let rowPass = dataAuth[i][1].toString().trim();

    if (rowUser === inputU && rowPass === inputP) {
      authData = {
        username: rowUser,
        role: dataAuth[i][2],
        kode_kawasan: dataAuth[i][3],
        kode_rt: String(dataAuth[i][4]).padStart(3, "0"),
        kode_rw: String(dataAuth[i][5]).padStart(3, "0"),
        tenant_db_id: dataAuth[i][6],
      };
      break;
    }
  }

  // Jika tidak ditemukan di Master DB, langsung tolak
  if (!authData) {
    throw new Error("Kredensial tidak valid. Username atau Password salah.");
  }
  if (!authData.tenant_db_id) {
    throw new Error(`Sistem terkunci: Database Tenant untuk Kawasan ${authData.kode_kawasan} RT ${authData.kode_rt} belum dikonfigurasi.`);
  }

  // --- TAHAP 2: EKSTRAKSI PROFIL KE TENANT DB (BRANKAS DATA) ---
  const tenantSS = SpreadsheetApp.openById(authData.tenant_db_id);
  const sheetPenduduk = tenantSS.getSheetByName("DATA_PENDUDUK");
  if (!sheetPenduduk) throw new Error("CRITICAL: Sheet DATA_PENDUDUK tidak ditemukan di Tenant DB.");

  const dataPenduduk = sheetPenduduk.getDataRange().getValues();
  let userProfile = null;

  // Looping Profil (Indeks: [0:USERNAME, 1:NAMA, 2:NIK, 3:BLOK, 4:NO_HP, 5:JABATAN, 6:STATUS])
  for (let j = 1; j < dataPenduduk.length; j++) {
    let pUser = dataPenduduk[j][0].toString().trim();

    if (pUser === inputU) {
      let status = dataPenduduk[j][6];
      if (status !== "AKTIF") throw new Error("Akun ditangguhkan. Hubungi Pengurus.");

      // Gabungkan Data Auth dan Data Profil
      userProfile = {
        ...authData, // Memasukkan semua data dari Tahap 1 (termasuk tenant_db_id)
        nama: dataPenduduk[j][1],
        nik: dataPenduduk[j][2],
        blokRumah: dataPenduduk[j][3],
        no_hp: dataPenduduk[j][4],
        jabatan: dataPenduduk[j][5],
        level: ROLE_LEVEL[authData.role] || 0,
      };
      break;
    }
  }

  // Proteksi anomali: Ada di Master, tapi hilang di Tenant
  if (!userProfile) {
    throw new Error("Data korup: Kredensial valid, tetapi Profil Penduduk tidak ditemukan di database RT Anda.");
  }

  return userProfile;
}

/**
 * ZERO TRUST VALIDATOR (Fungsi Wajib Panggil)
 * Gunakan fungsi ini di SETIAP fungsi mutasi (insert/update/delete) di backend.
 */
function validateAccess(userLevel, requiredLevel) {
  if (userLevel < requiredLevel) {
    throw new Error("Akses Ditolak (Zero Trust): Otoritas Anda tidak mencukupi untuk mengeksekusi perintah ini.");
  }
  return true;
}
