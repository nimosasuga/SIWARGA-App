// File: src/backend/db_transaksi.gs
// [LOCATOR: Ganti seluruh isi file db_transaksi.gs dengan blok ini]

/**
 * ==========================================
 * S.I.W.A.R.G.A - DB TRANSAKSI OPERATIONS (V3)
 * Menggunakan tenant_db_id dinamis dari sesi user
 * ==========================================
 */

/**
 * [READ] Mengambil riwayat transaksi (Dengan Data Hydration NAMA & BLOK)
 * Dilengkapi dengan filter terisolasi untuk KORLAP_GANG
 */
function getAllTransaksi(userProfile) {
  if (!userProfile || !userProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  const db = SpreadsheetApp.openById(userProfile.tenant_db_id);

  // 1. Ambil Data Transaksi
  const sheetLog = db.getSheetByName("LOG_IURAN");
  if (!sheetLog) throw new Error("CRITICAL: Sheet LOG_IURAN tidak ditemukan di DB Tenant Anda.");
  const rawLog = sheetLog.getDataRange().getValues();
  const headersLog = rawLog[0];
  const rowsLog = rawLog.slice(1);

  // 2. Ambil Data Penduduk untuk Hydration (Lookup/Pencocokan)
  const sheetPenduduk = db.getSheetByName("DATA_PENDUDUK");
  const rowsPenduduk = sheetPenduduk.getDataRange().getValues().slice(1);

  // Buat Kamus/Katalog Warga berdasarkan USERNAME
  let kamusWarga = {};
  rowsPenduduk.forEach((row) => {
    // Index 0: USERNAME, Index 1: NAMA, Index 3: BLOK
    kamusWarga[row[0].toString().trim()] = {
      nama: row[1],
      blok: row[3],
    };
  });

  const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // 3. Merakit Data Lengkap (Suntik Nama & Blok ke Transaksi)
  let allData = rowsLog.map((row) => {
    let obj = {};
    headersLog.forEach((header, index) => {
      let cellValue = row[index];
      let headerName = header.toString().trim();
      if (Object.prototype.toString.call(cellValue) === "[object Date]") {
        if (headerName === "BULAN_DIBAYAR") {
          obj[headerName] = `${bulanIndo[cellValue.getMonth()]} ${cellValue.getFullYear()}`;
        } else {
          obj[headerName] = Utilities.formatDate(cellValue, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        }
      } else {
        obj[headerName] = cellValue;
      }
    });

    // Inject Nama dan Blok dari Kamus
    let usernameTrx = obj["USERNAME"] ? obj["USERNAME"].toString().trim() : "";
    obj["NAMA_WARGA"] = kamusWarga[usernameTrx] ? kamusWarga[usernameTrx].nama : "Data Dihapus";
    obj["BLOK_RUMAH"] = kamusWarga[usernameTrx] ? kamusWarga[usernameTrx].blok : "-";

    return obj;
  });

  // 4. Zero-Trust Security: Jika Korlap Gang, potong data khusus prefix wilayahnya
  if (userProfile.role === "KORLAP_GANG") {
    const gangPrefix = userProfile.blokRumah.split("/")[0];
    allData = allData.filter((trx) => trx["BLOK_RUMAH"].startsWith(gangPrefix));
  }

  // Urutkan dari yang terbaru ke terlama
  allData.sort((a, b) => new Date(b.TIMESTAMP) - new Date(a.TIMESTAMP));
  return allData;
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

// File: src/backend/db_transaksi.gs
// [LOCATOR: Tambahkan blok fungsi ini di baris paling bawah file db_transaksi.gs]

/**
 * [CREATE] Menambah rekam transaksi baru ke Tenant DB (Mesin Kasir)
 * Hanya dapat dieksekusi oleh Role Keuangan & Admin.
 */
function createTransaksi(adminProfile, data) {
  if (!adminProfile || !adminProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  // 1. Validasi Lapis Baja (Zero-Trust)
  const allowedRoles = ["SUPER_ADMIN", "KETUA_RT", "BENDAHARA"];
  if (!allowedRoles.includes(adminProfile.role)) {
    throw new Error("Otoritas Ditolak: Hanya Bendahara atau Ketua RT yang dapat mencatat pemasukan kas.");
  }

  const db = SpreadsheetApp.openById(adminProfile.tenant_db_id);
  const sheetLog = db.getSheetByName("LOG_IURAN");
  if (!sheetLog) throw new Error("CRITICAL: Sheet LOG_IURAN tidak ditemukan di Brankas Data RT Anda.");

  // 2. Generator ID Transaksi Otomatis (Format: TRX-{RT}-{YYMMDDHHMMSS})
  const timestamp = new Date();
  const timeString = Utilities.formatDate(timestamp, "Asia/Jakarta", "yyMMddHHmmss");
  const idTrx = `TRX-${adminProfile.kode_rt}-${timeString}`;

  // 3. Tulis ke Brankas Tenant
  // Struktur Tabel: [ID_TRANSAKSI, TIMESTAMP, USERNAME, NOMINAL, BULAN_DIBAYAR, PETUGAS]
  sheetLog.appendRow([
    idTrx,
    timestamp,
    data.USERNAME,
    data.NOMINAL,
    data.BULAN_DIBAYAR,
    adminProfile.username, // Sistem otomatis merekam siapa kasir yang bertugas
  ]);

  return `Transaksi ${idTrx} berhasil dicatat dan masuk ke saldo Kas.`;
}
