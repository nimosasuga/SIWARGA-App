/**
 * ==========================================
 * S.I.W.A.R.G.A - UTILITIES & DATABASE SEEDER
 * ARSITEKTUR: SPLIT-DATABASE (MICROSERVICES)
 * ==========================================
 */

/**
 * MENGAKSES DATABASE MASTER
 */
function getSheetWarga() {
  // ISOLASI LOKAL: Bebas dari tabrakan variabel antar file
  const MASTER_ID = "1Ko4hiHR39_vCHYXKub6FIvjcEDhHZc1UGpoOqD0AUns";
  const db = SpreadsheetApp.openById(MASTER_ID);
  let sheet = db.getSheetByName("DATA_WARGA");
  if (!sheet) sheet = db.insertSheet("DATA_WARGA");
  return sheet;
}

/**
 * MENGAKSES DATABASE TRANSAKSI
 */
function getSheetTransaksi() {
  // ISOLASI LOKAL: Bebas dari tabrakan variabel antar file
  const TRANSAKSI_ID = "10wCY4kQn2Zhm_9udQvCm_0JTv7nzUjzXJYI0SB3FlsM";
  const db = SpreadsheetApp.openById(TRANSAKSI_ID);
  let sheet = db.getSheetByName("LOG_IURAN");
  if (!sheet) sheet = db.insertSheet("LOG_IURAN");
  return sheet;
}

/**
 * SEEDER 1: Injeksi 100 Warga ke DB MASTER
 */
function seedDatabaseWarga() {
  const sheet = getSheetWarga();

  const headerData = [["USERNAME", "NAMA", "PASSWORD", "BLOK_RUMAH", "JABATAN", "ROLE", "STATUS"]];
  sheet.getRange(1, 1, 1, headerData[0].length).setValues(headerData).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff").setHorizontalAlignment("center");

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();

  let dataToInject = [];

  // Eksekutif & Pengurus
  dataToInject.push(["admin", "Bapak Super Admin", "admin123", "Pusat", "Developer", "SUPER_ADMIN", "AKTIF"]);
  dataToInject.push(["rt01", "Bapak Hermawan (Ketua RT)", "rt123", "Blok A/1", "Ketua RT", "KETUA_RT", "AKTIF"]);
  dataToInject.push(["bendahara", "Ibu Siti (Bendahara)", "uang123", "Blok B/2", "Bendahara", "PENGURUS", "AKTIF"]);

  // Koorlap Gang (Gang A sampai E)
  const korlapGang = ["A", "B", "C", "D", "E"];
  korlapGang.forEach((gang) => {
    dataToInject.push([`korlap_${gang.toLowerCase()}`, `Bapak Korlap Gang ${gang}`, "korlap123", `Blok ${gang}/1`, `Korlap Gang ${gang}`, "KORLAP_GANG", "AKTIF"]);
  });

  // Generate 100 Warga Realistis
  const namaDepan = ["Budi", "Agus", "Ahmad", "Sari", "Dewi", "Wahyu", "Eko", "Putri", "Rudi", "Nina", "Hendra", "Maya", "Dedi", "Rina", "Doni"];
  const namaBelakang = ["Saputra", "Setiawan", "Hidayat", "Lestari", "Kusuma", "Pratama", "Wijaya", "Nugroho", "Santoso", "Sari", "Gunawan", "Rahayu"];

  for (let i = 1; i <= 100; i++) {
    let randDepan = namaDepan[Math.floor(Math.random() * namaDepan.length)];
    let randBelakang = namaBelakang[Math.floor(Math.random() * namaBelakang.length)];
    let namaLengkap = `${randDepan} ${randBelakang}`;

    let gangTarget = korlapGang[Math.floor(Math.random() * korlapGang.length)];
    let nomorRumah = Math.floor(Math.random() * 50) + 2;

    let username = `warga${i.toString().padStart(3, "0")}`;

    dataToInject.push([username, namaLengkap, "warga123", `Blok ${gangTarget}/${nomorRumah}`, "Warga", "WARGA", "AKTIF"]);
  }

  sheet.getRange(2, 1, dataToInject.length, dataToInject[0].length).setValues(dataToInject);
  Logger.log(`[SEEDER MASTER] Berhasil menginjeksi ${dataToInject.length} baris data ke SIWARGA_DB_MASTER.`);
}

/**
 * SEEDER 2: Injeksi Riwayat Iuran ke DB TRANSAKSI
 */
function seedRiwayatIuran() {
  const sheetLog = getSheetTransaksi();
  const sheetWarga = getSheetWarga();

  // Format Header Baru (Sesuai Permintaan)
  const header = [["ID_TRANSAKSI", "TIMESTAMP", "USERNAME", "NOMINAL", "BULAN_DIBAYAR", "PETUGAS"]];
  sheetLog.getRange(1, 1, 1, header[0].length).setValues(header).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff").setHorizontalAlignment("center");

  const lastRow = sheetLog.getLastRow();
  if (lastRow > 1) sheetLog.getRange(2, 1, lastRow - 1, sheetLog.getLastColumn()).clearContent();

  // Ambil data Warga dari DB MASTER untuk merelasikan Username
  const dataWarga = sheetWarga.getDataRange().getValues();
  let listWarga = dataWarga.filter((row) => row[5] === "WARGA");

  let dataTransaksi = [];
  let currentDate = new Date();

  const daftarBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const petugasPenagih = ["bendahara", "korlap_a", "korlap_b", "korlap_c"];

  // Generate Transaksi untuk setiap Warga selama 6 bulan terakhir
  listWarga.forEach((warga) => {
    let username = warga[0];

    for (let i = 0; i < 6; i++) {
      if (Math.random() > 0.15) {
        let tglBayar = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, Math.floor(Math.random() * 28) + 1);

        let idTrx = `TRX-${tglBayar.getTime().toString().slice(-6)}-${username}`;
        let timestamp = Utilities.formatDate(tglBayar, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        let nominal = 50000;
        let bulanDibayar = `${daftarBulan[tglBayar.getMonth()]} ${tglBayar.getFullYear()}`;
        let petugas = petugasPenagih[Math.floor(Math.random() * petugasPenagih.length)];

        dataTransaksi.push([idTrx, timestamp, username, nominal, bulanDibayar, petugas]);
      }
    }
  });

  dataTransaksi.sort((a, b) => new Date(a[1]) - new Date(b[1]));

  sheetLog.getRange(2, 1, dataTransaksi.length, dataTransaksi[0].length).setValues(dataTransaksi);
  Logger.log(`[SEEDER TRANSAKSI] Berhasil menginjeksi ${dataTransaksi.length} riwayat log iuran ke SIWARGA_DB_TRANSAKSI.`);
}

function seedMassiveData() {
  const MASTER_DB_ID = "1Ko4hiHR39_vCHYXKub6FIvjcEDhHZc1UGpoOqD0AUns";
  const TRANSAKSI_RT001_ID = "10wCY4kQn2Zhm_9udQvCm_0JTv7nzUjzXJYI0SB3FlsM";
  const TRANSAKSI_RT002_ID = "1R5Yl1VRkxaAFKCvFo_hvkyLYscYxwpBApzWbMDq6aWg";

  const masterSS = SpreadsheetApp.openById(MASTER_DB_ID);
  const sheetWarga = masterSS.getSheetByName("DATA_WARGA");
  const sheetTenant = masterSS.getSheetByName("DATA_TENANT");

  // 1. Bersihkan Data Lama (Area pembersihan diperlebar untuk menampung kolom tambahan)
  if (sheetWarga.getLastRow() > 1) sheetWarga.getRange(2, 1, sheetWarga.getLastRow() - 1, 10).clearContent();
  if (sheetTenant.getLastRow() > 1) sheetTenant.getRange(2, 1, sheetTenant.getLastRow() - 1, 4).clearContent();

  let dataTenant = [];
  let dataWarga = [];

  // 2. Daftar Kawasan untuk Simulasi Collision (Konflik RT/RW yang sama)
  const daftarKawasan = [
    { kode: "CKR-BRT", nama: "Cikarang Barat", jumlahRT: 3 },
    { kode: "CKR-TMR", nama: "Cikarang Timur", jumlahRT: 2 },
  ];

  // 3. Proses Penciptaan Data Multi-Kawasan
  daftarKawasan.forEach((kawasan) => {
    for (let i = 1; i <= kawasan.jumlahRT; i++) {
      let kodeRT = String(i).padStart(3, "0");
      let kodeRW = "001";
      let currentDbId = "";

      // Menggunakan ID yang ada untuk CKR-BRT RT 001 dan 002, sisanya otomatis cloning
      if (kawasan.kode === "CKR-BRT" && kodeRT === "001") {
        currentDbId = TRANSAKSI_RT001_ID;
      } else if (kawasan.kode === "CKR-BRT" && kodeRT === "002") {
        currentDbId = TRANSAKSI_RT002_ID;
      } else {
        // Cloning otomatis untuk RT lainnya
        let templateFile = DriveApp.getFileById(TRANSAKSI_RT001_ID);
        let newFile = templateFile.makeCopy(`SIWARGA_DB_${kawasan.kode}_RT_${kodeRT}_RW_${kodeRW}`);
        currentDbId = newFile.getId();
      }

      // Simpan ke array Tenant dengan Struktur Baru: [KODE_KAWASAN, KODE_RT, KODE_RW, DB_TRANSAKSI_ID]
      dataTenant.push([kawasan.kode, kodeRT, kodeRW, currentDbId]);

      // Buat 50 Warga per RT
      for (let w = 1; w <= 50; w++) {
        let urutanWarga = String(w).padStart(3, "0");
        // Username unik gabungan kawasan, RT, dan urutan
        let username = `warga_${kawasan.kode.toLowerCase()}_${kodeRT}_${urutanWarga}`;

        let nama = w === 1 ? `Bapak Ketua RT ${kodeRT} (${kawasan.nama})` : `Warga ${kodeRT} No ${w} (${kawasan.nama})`;
        let jabatan = w === 1 ? "Ketua RT" : "Warga";
        let role = w === 1 ? "KETUA_RT" : "WARGA";
        let blok = `Blok ${kodeRT}/${w}`;

        // Struktur Baru: [KODE_KAWASAN, KODE_RT, KODE_RW, USERNAME, NAMA, PASSWORD, BLOK, JABATAN, ROLE, STATUS]
        dataWarga.push([kawasan.kode, kodeRT, kodeRW, username, nama, "123456", blok, jabatan, role, "AKTIF"]);
      }
    }
  });

  // 4. Injeksi Massal
  sheetTenant.getRange(2, 1, dataTenant.length, 4).setValues(dataTenant);
  sheetWarga.getRange(2, 1, dataWarga.length, 10).setValues(dataWarga);

  Logger.log("Injeksi Multi-Kawasan Berhasil! Harap sesuaikan Header di Spreadsheet secara manual.");
}

// File: src/backend/utils.gs
// [LOCATOR: Ganti seluruh fungsi buildEnterpriseEcosystem() dengan blok ini]

/**
 * ==========================================
 * ENTERPRISE DATABASE BUILDER (V3 - SPLIT AUTH & PROFILE)
 * ==========================================
 * Fungsi ini membangun ekosistem dengan pemisahan antara
 * Auth Hub (Master DB) dan Profil Lengkap (Tenant DB).
 */
function buildEnterpriseEcosystem() {
  Logger.log("Memulai proses pembuatan ekosistem V3 (Split Auth & Profile)...");

  // 1. MEMBUAT FOLDER BARU
  const timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "ddMMyy_HHmm");
  const folderName = `SIWARGA_DATABASE_V3_${timestamp}`;
  const folder = DriveApp.createFolder(folderName);
  Logger.log(`Folder berhasil dibuat: ${folderName}`);

  // 2. MEMBUAT MASTER DATABASE (AUTH HUB)
  const masterSS = SpreadsheetApp.create("SIWARGA_DB_MASTER_AUTH");
  const masterFile = DriveApp.getFileById(masterSS.getId());
  masterFile.moveTo(folder);

  // Setup Sheet DATA_WARGA (Hanya untuk Login & Routing)
  const sheetAuth = masterSS.getSheets()[0];
  sheetAuth.setName("DATA_WARGA");
  const headerAuth = [["USERNAME", "PASSWORD", "ROLE", "KODE_KAWASAN", "KODE_RT", "KODE_RW", "DB_TRANSAKSI_ID"]];
  sheetAuth.getRange(1, 1, 1, headerAuth[0].length).setValues(headerAuth).setFontWeight("bold").setBackground("#0f172a").setFontColor("#ffffff");
  sheetAuth.setFrozenRows(1);

  // 3. SKENARIO MULTI-KAWASAN
  const daftarKawasan = [
    { kode: "CKR-BRT", nama: "Cikarang Barat", jumlahRT: 2 },
    { kode: "CKR-TMR", nama: "Cikarang Timur", jumlahRT: 2 },
  ];

  let dataAuthToInject = []; // Penampung data untuk Master DB
  const now = new Date();
  const namaBulan = "Mei 2026";

  // 4. MEMBANGUN FILE TENANT (BRANKAS DATA) & MENGISI PROFIL
  daftarKawasan.forEach((kawasan) => {
    for (let i = 1; i <= kawasan.jumlahRT; i++) {
      let kodeRT = String(i).padStart(3, "0");
      let kodeRW = "001";

      // Buat File Tenant Terisolasi
      let fileName = `SIWARGA_DB_${kawasan.kode}_RT_${kodeRT}_RW_${kodeRW}`;
      let tenantSS = SpreadsheetApp.create(fileName);
      let tenantFile = DriveApp.getFileById(tenantSS.getId());
      tenantFile.moveTo(folder);

      let tenantId = tenantSS.getId();
      Logger.log(`File Tenant Dibuat: ${fileName}`);

      // Setup Sheet 1: DATA_PENDUDUK (Untuk fitur CRUD Warga oleh RT)
      let sheetPenduduk = tenantSS.getSheets()[0];
      sheetPenduduk.setName("DATA_PENDUDUK");
      let headerPenduduk = [["USERNAME", "NAMA_LENGKAP", "NIK", "BLOK_RUMAH", "NO_HP", "JABATAN", "STATUS"]];
      sheetPenduduk.getRange(1, 1, 1, headerPenduduk[0].length).setValues(headerPenduduk).setFontWeight("bold").setBackground("#1e3a8a").setFontColor("#ffffff");
      sheetPenduduk.setFrozenRows(1);

      // Setup Sheet 2: LOG_IURAN (Untuk fitur Transaksi)
      let sheetLog = tenantSS.insertSheet("LOG_IURAN");
      let headerLog = [["ID_TRANSAKSI", "TIMESTAMP", "USERNAME", "NOMINAL", "BULAN_DIBAYAR", "PETUGAS"]];
      sheetLog.getRange(1, 1, 1, headerLog[0].length).setValues(headerLog).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
      sheetLog.setFrozenRows(1);

      let dataPendudukToInject = [];
      let dataLogToInject = [];

      // Cetak 50 Warga untuk Tenant ini
      for (let w = 1; w <= 50; w++) {
        let urutanWarga = String(w).padStart(3, "0");
        let username = `warga_${kawasan.kode.toLowerCase()}_${kodeRT}_${urutanWarga}`;
        let password = "password123";
        let role = w === 1 ? "KETUA_RT" : "WARGA";

        let namaLengkap = w === 1 ? `Bapak Ketua RT ${kodeRT}` : `Warga ${kodeRT} No ${w}`;
        let nikDummy = `32160${kodeRT}${w}0000${w}`; // Simulasi NIK
        let noHpDummy = `081234567${urutanWarga}`;
        let jabatan = w === 1 ? "Ketua RT" : "Warga";
        let blok = `Blok ${kodeRT}/${w}`;

        // A. Injeksi Kredensial ke Auth Hub (Master)
        // [USERNAME, PASSWORD, ROLE, KODE_KAWASAN, KODE_RT, KODE_RW, DB_TRANSAKSI_ID]
        dataAuthToInject.push([username, password, role, kawasan.kode, kodeRT, kodeRW, tenantId]);

        // B. Injeksi Profil Lengkap ke Tenant DB (Terisolasi)
        // [USERNAME, NAMA_LENGKAP, NIK, BLOK_RUMAH, NO_HP, JABATAN, STATUS]
        dataPendudukToInject.push([username, namaLengkap, nikDummy, blok, noHpDummy, jabatan, "AKTIF"]);

        // Berikan transaksi dummy untuk 3 warga pertama
        if (w <= 3) {
          dataLogToInject.push([`TRX-${kawasan.kode}-${kodeRT}-${w}`, now, username, 50000, namaBulan, `bendahara_${kodeRT}`]);
        }
      }

      // Tulis data ke File Tenant secara masif
      sheetPenduduk.getRange(2, 1, dataPendudukToInject.length, headerPenduduk[0].length).setValues(dataPendudukToInject);
      if (dataLogToInject.length > 0) {
        sheetLog.getRange(2, 1, dataLogToInject.length, headerLog[0].length).setValues(dataLogToInject);
      }
    }
  });

  // 5. INJEKSI MASSAL KREDENSIAL KE MASTER DATABASE
  sheetAuth.getRange(2, 1, dataAuthToInject.length, headerAuth[0].length).setValues(dataAuthToInject);

  Logger.log("=========================================");
  Logger.log("EKOSISTEM V3 BERHASIL DIBANGUN!");
  Logger.log(`ID MASTER DB AUTH BARU ANDA: ${masterSS.getId()}`);
  Logger.log("Harap catat ID ini. Kita akan menggunakannya untuk merombak auth.gs selanjutnya.");
  Logger.log("=========================================");
}
