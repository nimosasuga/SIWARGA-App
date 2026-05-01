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
 * Memverifikasi kredensial login (Menggunakan USERNAME dan PASSWORD)
 */
function authenticateUser(usernameInput, passwordInput) {
  const sheet = getSheetWarga();
  const data = sheet.getDataRange().getValues();
  
  let inputU = usernameInput.toString().trim();
  let inputP = passwordInput.toString().trim();
  
  for (let i = data.length - 1; i > 0; i--) {
    let rowUser = data[i][0].toString().trim(); // Kolom 1: Username
    let rowPass = data[i][2].toString().trim(); // Kolom 3: Password
    
    if (rowUser === inputU && rowPass === inputP) {
      let status = data[i][6];
      if (status !== "AKTIF") throw new Error("Akun ditangguhkan. Hubungi Pengurus.");
      
      let roleString = data[i][5];
      return {
        username: data[i][0],
        nama: data[i][1],
        blokRumah: data[i][3],
        jabatan: data[i][4],
        role: roleString,
        level: ROLE_LEVEL[roleString] || 0
      };
    }
  }
  throw new Error("Kredensial tidak valid. Username atau Password salah.");
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
