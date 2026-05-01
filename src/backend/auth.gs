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
 * Memverifikasi kredensial login (Sementara menggunakan NIK dan No HP)
 * Mengembalikan objek sesi data pengguna jika valid.
 */
function authenticateUser(nik, noHp) {
  const sheet = getSheetWarga();
  const data = sheet.getDataRange().getValues();

  // Menggunakan Reverse Loop untuk memastikan kita mengambil data pembaruan
  // terakhir jika secara kebetulan ada duplikasi NIK di bawah.
  for (let i = data.length - 1; i > 0; i--) {
    let rowNik = data[i][0].toString();
    let rowNoHp = data[i][2].toString();

    // Validasi kredensial (pastikan tipe data string cocok)
    if (rowNik === nik.toString() && rowNoHp === noHp.toString()) {
      let status = data[i][6];
      if (status !== "AKTIF") {
        throw new Error("Akun tidak aktif atau ditangguhkan. Silakan hubungi Pengurus RT.");
      }

      let roleString = data[i][5];

      return {
        nik: rowNik,
        nama: data[i][1],
        blokRumah: data[i][3],
        jabatan: data[i][4],
        role: roleString,
        level: ROLE_LEVEL[roleString] || 0,
      };
    }
  }

  throw new Error("Kredensial tidak valid. NIK atau Nomor HP salah.");
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
