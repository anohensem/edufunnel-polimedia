window.eduFunnelData = {
  metadata: {
    project_name: "EduFunnel Polimedia - Analitik & Prediksi Peluang Masuk",
    period: "2022-2026",
    generated_by: "Sistem Analitik PMB Politeknik Negeri Media Kreatif"
  },

  // Data Lengkap Per Tahun Sesuai Dokumen Ringkasan Eksekutif Polimedia
  yearly_datasets: {
    "2022": {
      label: "Tahun 2022 (Baseline Awal - Data Resmi N/A)",
      is_na: true,
      catatan: "Berdasarkan dokumen resmi Polimedia, rincian angka pendaftar tahun 2022 berstatus N/A (belum dipublikasikan rinci). Angka di bawah adalah estimasi baseline sebelum lonjakan 2023.",
      sources: [
        { name: "SNBP", pengunjung: 1150, daftar: 1050, test: 780, daftar_ulang: 480, berkuliah: 450, status: "Data Estimasi (N/A)" },
        { name: "SNBT", pengunjung: 1400, daftar: 1280, test: 950, daftar_ulang: 580, berkuliah: 540, status: "Data Estimasi (N/A)" },
        { name: "Mandiri", pengunjung: 1250, daftar: 1100, test: 820, daftar_ulang: 340, berkuliah: 310, status: "Data Estimasi (N/A)" }
      ]
    },
    "2023": {
      label: "Tahun 2023 (Data Resmi PMB Polimedia)",
      is_na: false,
      catatan: "Tahun 2023 mencatat total 4.789 pendaftar dan 1.501 mahasiswa baru diterima (Peluang lolos rata-rata 31,34%).",
      sources: [
        { name: "SNBP", pengunjung: 1425, daftar: 1340, test: 980, daftar_ulang: 560, berkuliah: 521, status: "Peluang Tinggi" },
        { name: "SNBT", pengunjung: 1748, daftar: 1620, test: 1210, daftar_ulang: 690, berkuliah: 641, status: "Peluang Tinggi" },
        { name: "Mandiri", pengunjung: 1616, daftar: 1480, test: 1050, daftar_ulang: 380, berkuliah: 339, status: "Moderat" }
      ]
    },
    "2024": {
      label: "Tahun 2024 (Data Resmi PMB Polimedia)",
      is_na: false,
      catatan: "Tahun 2024 terjadi lonjakan pesat menjadi 8.569 pendaftar dengan 1.647 mahasiswa diterima (Peluang lolos rata-rata 19,22%).",
      sources: [
        { name: "SNBP", pengunjung: 2647, daftar: 2450, test: 1720, daftar_ulang: 790, berkuliah: 762, status: "Peluang Terbaik" },
        { name: "SNBT", pengunjung: 4709, daftar: 4320, test: 2980, daftar_ulang: 790, berkuliah: 737, status: "Persaingan Ketat" },
        { name: "Mandiri", pengunjung: 1213, daftar: 1100, test: 760, daftar_ulang: 175, berkuliah: 148, status: "Kuota Terbatas" }
      ]
    },
    "2025": {
      label: "Tahun 2025 (Data Resmi PMB Polimedia)",
      is_na: false,
      catatan: "Tahun 2025 mencatat 11.058 pendaftar dengan 1.667 mahasiswa diterima dari kapasitas 1.905 kursi (Peluang lolos rata-rata 15,08%).",
      sources: [
        { name: "SNBP", pengunjung: 2999, daftar: 2762, test: 1850, daftar_ulang: 762, berkuliah: 686, status: "Peluang Terbaik" },
        { name: "SNBT", pengunjung: 6846, daftar: 6050, test: 3900, daftar_ulang: 952, berkuliah: 833, status: "Sangat Ketat" },
        { name: "Mandiri", pengunjung: 1213, daftar: 1038, test: 670, daftar_ulang: 191, berkuliah: 148, status: "Kuota Terbatas" }
      ]
    },
    "all_years": {
      label: "Keseluruhan Tahun (Akumulasi 2022–2025)",
      is_na: false,
      catatan: "Akumulasi total data resmi PMB Polimedia (2023–2025): Total 24.416 pendaftar dan 4.815 mahasiswa diterima (Rata-rata peluang lolos 19,72%).",
      sources: [
        { name: "SNBP", pengunjung: 7071, daftar: 6552, test: 4550, daftar_ulang: 2112, berkuliah: 1969, status: "Jalur Terfavorit" },
        { name: "SNBT", pengunjung: 13303, daftar: 11990, test: 8090, daftar_ulang: 2432, berkuliah: 2211, status: "Volume Terbesar" },
        { name: "Mandiri", pengunjung: 4042, daftar: 3618, test: 2480, daftar_ulang: 746, berkuliah: 635, status: "Jalur Reguler" }
      ]
    },
    "prediksi_2026": {
      label: "Prediksi Tahun 2026 (Proyeksi Pertumbuhan Tren)",
      is_na: false,
      catatan: "Berdasarkan laju pertumbuhan tahunan (CAGR) peminat Polimedia 2023–2025, total pendaftar 2026 diprediksi mencapai ~13.450 orang dengan daya tampung optimal 1.905 kursi (Prediksi peluang lolos ~14,16%).",
      sources: [
        { name: "SNBP", pengunjung: 3420, daftar: 3150, test: 2100, daftar_ulang: 762, berkuliah: 762, status: "Prediksi Stabil" },
        { name: "SNBT", pengunjung: 8680, daftar: 7800, test: 5100, daftar_ulang: 952, berkuliah: 952, status: "Prediksi Melonjak" },
        { name: "Mandiri", pengunjung: 1350, daftar: 1180, test: 790, daftar_ulang: 191, berkuliah: 191, status: "Prediksi Kompetitif" }
      ]
    }
  },

  // Ringkasan Tren Multi-Tahun untuk Grafik Perbandingan (2022 s/d Prediksi 2026)
  multi_year_chart: [
    { tahun: "2022 (Est)", snbp_p: 1150, snbp_d: 450, snbt_p: 1400, snbt_d: 540, mandiri_p: 1250, mandiri_d: 310 },
    { tahun: "2023", snbp_p: 1425, snbp_d: 521, snbt_p: 1748, snbt_d: 641, mandiri_p: 1616, mandiri_d: 339 },
    { tahun: "2024", snbp_p: 2647, snbp_d: 762, snbt_p: 4709, snbt_d: 737, mandiri_p: 1213, mandiri_d: 148 },
    { tahun: "2025", snbp_p: 2999, snbp_d: 686, snbt_p: 6846, snbt_d: 833, mandiri_p: 1213, mandiri_d: 148 },
    { tahun: "Prediksi 2026", snbp_p: 3420, snbp_d: 762, snbt_p: 8680, snbt_d: 952, mandiri_p: 1350, mandiri_d: 191 }
  ],

  // Data 16 Program Studi Polimedia beserta Indeks Keketatan & Passing Grade
  prodi_list: [
    { kategori: "Desain", prodi: "D3 Desain Grafis", kuota: 140, peminat_2025: 1020, faktor_prodi: 0.91, min_rapor: 84, min_utbk: 560, keketatan: "Sangat Ketat" },
    { kategori: "Desain", prodi: "D4 Desain Mode", kuota: 80, peminat_2025: 440, faktor_prodi: 1.12, min_rapor: 81, min_utbk: 530, keketatan: "Moderat" },
    { kategori: "Desain", prodi: "D4 Teknologi Rekayasa Multimedia", kuota: 120, peminat_2025: 890, faktor_prodi: 0.89, min_rapor: 85, min_utbk: 575, keketatan: "Sangat Ketat" },
    { kategori: "Desain", prodi: "D4 Teknologi Permainan", kuota: 80, peminat_2025: 560, faktor_prodi: 0.95, min_rapor: 83, min_utbk: 555, keketatan: "Ketat" },
    { kategori: "Desain", prodi: "D4 Animasi", kuota: 110, peminat_2025: 920, faktor_prodi: 0.82, min_rapor: 86, min_utbk: 585, keketatan: "Sangat Ketat" },
    { kategori: "Komunikasi", prodi: "D3 Penerbitan", kuota: 80, peminat_2025: 380, faktor_prodi: 1.25, min_rapor: 79, min_utbk: 510, keketatan: "Peluang Tinggi" },
    { kategori: "Komunikasi", prodi: "D3 Fotografi", kuota: 90, peminat_2025: 590, faktor_prodi: 1.01, min_rapor: 82, min_utbk: 540, keketatan: "Ketat" },
    { kategori: "Komunikasi", prodi: "D3 Periklanan", kuota: 110, peminat_2025: 710, faktor_prodi: 1.03, min_rapor: 82, min_utbk: 540, keketatan: "Ketat" },
    { kategori: "Komunikasi", prodi: "D3 Penyiaran", kuota: 120, peminat_2025: 810, faktor_prodi: 0.98, min_rapor: 83, min_utbk: 550, keketatan: "Ketat" },
    { kategori: "Komunikasi", prodi: "D4 Produksi Film & TV", kuota: 120, peminat_2025: 1080, faktor_prodi: 0.78, min_rapor: 87, min_utbk: 595, keketatan: "Sangat Ketat" },
    { kategori: "Teknologi Industri", prodi: "D3 Teknik Grafika", kuota: 110, peminat_2025: 610, faktor_prodi: 1.15, min_rapor: 80, min_utbk: 525, keketatan: "Moderat" },
    { kategori: "Teknologi Industri", prodi: "D3 Pemeliharaan Mesin", kuota: 60, peminat_2025: 270, faktor_prodi: 1.35, min_rapor: 78, min_utbk: 500, keketatan: "Peluang Tinggi" },
    { kategori: "Teknologi Industri", prodi: "D4 Teknologi Rekayasa Pengemasan", kuota: 90, peminat_2025: 430, faktor_prodi: 1.28, min_rapor: 79, min_utbk: 515, keketatan: "Peluang Tinggi" },
    { kategori: "Pariwisata", prodi: "D3 Seni Kuliner", kuota: 120, peminat_2025: 890, faktor_prodi: 0.90, min_rapor: 84, min_utbk: 560, keketatan: "Sangat Ketat" },
    { kategori: "Pariwisata", prodi: "D4 Pengelolaan Perhotelan", kuota: 147, peminat_2025: 868, faktor_prodi: 1.08, min_rapor: 81, min_utbk: 535, keketatan: "Moderat" },
    { kategori: "Desain / PSDKU", prodi: "D3 Desain Grafis (PSDKU Medan/Makassar)", kuota: 90, peminat_2025: 590, faktor_prodi: 1.05, min_rapor: 80, min_utbk: 520, keketatan: "Moderat" }
  ]
};