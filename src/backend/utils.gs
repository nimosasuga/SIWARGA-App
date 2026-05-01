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
