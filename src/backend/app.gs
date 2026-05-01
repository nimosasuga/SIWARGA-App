/**
 * ==========================================
 * MAIN APPLICATION ROUTER (doGet)
 * Menangani render halaman awal Web App
 * ==========================================
 */
function doGet(e) {
  // 1. Buat kerangka (template) dari file index.html
  let html = HtmlService.createTemplateFromFile("frontend/index");

  // (Ruang untuk injeksi data master saat booting akan kita letakkan di sini nanti)

  // 2. Evaluasi tag SSR dan render menjadi HTML utuh
  return html.evaluate().setTitle("S.I.W.A.R.G.A").addMetaTag("viewport", "width=device-width, initial-scale=1").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * ZERO-LATENCY ROUTING HELPER
 * Fungsi rahasia untuk memasukkan teks dari file CSS/JS langsung ke HTML utama
 * tanpa perlu request HTTP tambahan dari browser warga.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
