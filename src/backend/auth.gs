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
 * Memverifikasi kredensial login (Menggunakan NAMA dan BLOK RUMAH)
 */
function authenticateUser(namaInput, blokInput) {
  const sheet = getSheetWarga();
  const data = sheet.getDataRange().getValues();

  // Normalisasi input dari pengguna (hapus spasi lebih & jadikan huruf kecil)
  let inputN = namaInput.toString().trim().toLowerCase();
  let inputB = blokInput.toString().trim().toLowerCase();

  // Reverse Loop Strategy
  for (let i = data.length - 1; i > 0; i--) {
    let rowNama = data[i][1].toString().trim().toLowerCase();
    let rowBlok = data[i][3].toString().trim().toLowerCase();

    // Validasi kredensial
    if (rowNama === inputN && rowBlok === inputB) {
      let status = data[i][6];
      if (status !== "AKTIF") {
        throw new Error("Akun ditangguhkan. Silakan hubungi Pengurus RT.");
      }

      let roleString = data[i][5];

      return {
        nik: data[i][0],
        nama: data[i][1], // Kembalikan nama dengan huruf besar/kecil aslinya
        blokRumah: data[i][3],
        jabatan: data[i][4],
        role: roleString,
        level: ROLE_LEVEL[roleString] || 0,
      };
    }
  }

  throw new Error("Akses Ditolak: Nama atau Nomor/Blok Rumah tidak cocok.");
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
