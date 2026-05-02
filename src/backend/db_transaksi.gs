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
 * Dilengkapi dengan paksaan baca kolom gaib (STATUS & BUKTI_URL)
 */
function getAllTransaksi(userProfile) {
  if (!userProfile || !userProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  const db = SpreadsheetApp.openById(userProfile.tenant_db_id);
  const sheetLog = db.getSheetByName("LOG_IURAN");
  if (!sheetLog) throw new Error("CRITICAL: Sheet LOG_IURAN tidak ditemukan di DB Tenant Anda.");

  const rawLog = sheetLog.getDataRange().getValues();
  if (rawLog.length <= 1) return []; // Jika kosong, kembalikan array kosong

  const headersLog = rawLog[0];
  const rowsLog = rawLog.slice(1);

  const sheetPenduduk = db.getSheetByName("DATA_PENDUDUK");
  const rowsPenduduk = sheetPenduduk.getDataRange().getValues().slice(1);

  let kamusWarga = {};
  rowsPenduduk.forEach((row) => {
    kamusWarga[row[0].toString().trim()] = { nama: row[1], blok: row[3] };
  });

  const bulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  let allData = rowsLog.map((row) => {
    let obj = {};
    headersLog.forEach((header, index) => {
      let cellValue = row[index];
      // Jika header kosong, beri nama sementara agar tidak error
      let headerName = header.toString().trim() || `KOLOM_GAIB_${index}`;

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

    // ==============================================================
    // [HARDCODE INJECTION] MEMAKSA BACA KOLOM 6 (STATUS) & 7 (BUKTI)
    // ==============================================================
    obj["STATUS"] = row[6] ? row[6].toString().trim() : "LUNAS";
    obj["BUKTI_URL"] = row[7] ? row[7].toString().trim() : "-";

    let usernameTrx = obj["USERNAME"] ? obj["USERNAME"].toString().trim() : "";
    obj["NAMA_WARGA"] = kamusWarga[usernameTrx] ? kamusWarga[usernameTrx].nama : "Data Dihapus";
    obj["BLOK_RUMAH"] = kamusWarga[usernameTrx] ? kamusWarga[usernameTrx].blok : "-";

    return obj;
  });

  if (userProfile.role === "KORLAP_GANG") {
    const gangPrefix = userProfile.blokRumah.split("/")[0];
    allData = allData.filter((trx) => trx["BLOK_RUMAH"].startsWith(gangPrefix));
  }

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

/**
 * [CREATE] Self-Service Warga: Mengunggah Bukti Transfer ke Google Drive
 */
function submitBuktiTransfer(userProfile, payload) {
  if (!userProfile || !userProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  let fileUrl = "-";

  // 1. Integrasi Google Drive (Menyimpan Base64 menjadi File Gambar)
  if (payload.base64File) {
    let folderIter = DriveApp.getFoldersByName("SIWARGA_BUKTI_TRANSFER");
    let folder;
    if (folderIter.hasNext()) {
      folder = folderIter.next();
    } else {
      folder = DriveApp.createFolder("SIWARGA_BUKTI_TRANSFER");
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // Agar bisa dilihat RT/Bendahara
    }

    const contentType = payload.base64File.split(",")[0].split(":")[1].split(";")[0];
    const base64Data = payload.base64File.split(",")[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, payload.fileName);
    const file = folder.createFile(blob);
    fileUrl = file.getUrl();
  }

  // 2. Tulis ke Brankas Tenant dengan 2 Kolom Tambahan (STATUS & BUKTI_URL)
  const db = SpreadsheetApp.openById(userProfile.tenant_db_id);
  const sheetLog = db.getSheetByName("LOG_IURAN");

  const timestamp = new Date();
  const timeString = Utilities.formatDate(timestamp, "Asia/Jakarta", "yyMMddHHmmss");
  const idTrx = `TRX-WEB-${timeString}`; // Kode khusus transaksi Self-Service

  // Struktur Tabel Diekspansi: [ID, WAKTU, USERNAME, NOMINAL, BULAN, PETUGAS, STATUS, BUKTI_URL]
  sheetLog.appendRow([
    idTrx,
    timestamp,
    userProfile.username,
    payload.NOMINAL,
    payload.BULAN_DIBAYAR,
    "Self-Service (Warga)",
    "MENUNGGU VALIDASI", // Kolom Index 6
    fileUrl, // Kolom Index 7
  ]);

  return "Bukti pembayaran berhasil dikirim. Menunggu validasi dari Bendahara/RT.";
}

/**
 * [UPDATE] Validasi Pembayaran: Mengubah status 'MENUNGGU' menjadi 'LUNAS'
 */
function approvePembayaran(adminProfile, idTransaksi) {
  if (!adminProfile || !adminProfile.tenant_db_id) throw new Error("Akses Ditolak: Sesi tidak valid.");

  // Hanya Bendahara, RT, dan Super Admin yang boleh melakukan ACC
  const allowed = ["SUPER_ADMIN", "KETUA_RT", "BENDAHARA"];
  if (!allowed.includes(adminProfile.role)) throw new Error("Anda tidak memiliki otoritas untuk memvalidasi pembayaran.");

  const db = SpreadsheetApp.openById(adminProfile.tenant_db_id);
  const sheetLog = db.getSheetByName("LOG_IURAN");
  const data = sheetLog.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    // Mencocokkan ID Transaksi di Kolom A (Index 0)
    if (data[i][0] === idTransaksi) {
      // Update Kolom PETUGAS (Index 5) dan STATUS (Index 6)
      // Kolom 6 = PETUGAS, Kolom 7 = STATUS
      sheetLog.getRange(i + 1, 6).setValue(adminProfile.username);
      sheetLog.getRange(i + 1, 7).setValue("LUNAS");
      return `Transaksi ${idTransaksi} telah divalidasi dan dinyatakan LUNAS.`;
    }
  }
  throw new Error("ID Transaksi tidak ditemukan.");
}
