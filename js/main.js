let appData = null;
let monthlyChart = null;
let currentPage = "overview";
let currentChannel = "all";
let currentDateRange = "2025"; // Default langsung menampilkan Tahun 2025
let supabaseClient = null;
let supabaseDataClient = null;

const SUPABASE_URL = "https://htjqavjtldidioumraxm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rzGMjGk5gBVdy3NNxsxOcA_42_GjQwo";

/* ================= ELEMENTS ================= */
const registerPage = document.getElementById("registerPage");
const loginPage = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");
const app = document.getElementById("app");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const goToLogin = document.getElementById("goToLogin");
const goToRegister = document.getElementById("goToRegister");
const logoutButton = document.getElementById("logoutButton");
const channelFilter = document.getElementById("channelFilter");
const dateFilter = document.getElementById("dateFilter");

/* ================= PAGE SWITCHING & HELPERS ================= */
function showRegisterPage() {
  if (registerPage) registerPage.classList.remove("hidden");
  if (loginPage) loginPage.classList.add("hidden");
  if (dashboardPage) dashboardPage.classList.add("hidden");
}

function showLoginPage() {
  if (registerPage) registerPage.classList.add("hidden");
  if (loginPage) loginPage.classList.remove("hidden");
  if (dashboardPage) dashboardPage.classList.add("hidden");
}

function showDashboardPage() {
  if (registerPage) registerPage.classList.add("hidden");
  if (loginPage) loginPage.classList.add("hidden");
  if (dashboardPage) dashboardPage.classList.remove("hidden");
  if (dateFilter) dateFilter.value = currentDateRange;
  fetchEduFunnelData();
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button) return;
  if (isLoading) {
    button.dataset.defaultText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    return;
  }
  button.textContent = button.dataset.defaultText || button.textContent;
  button.disabled = false;
}

function createSupabaseClient() {
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error("Supabase client belum dimuat.");
  }
  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/* ================= AUTH (REGISTER, LOGIN ADMIN/USER & LOGOUT) ================= */
if (goToLogin) goToLogin.addEventListener("click", showLoginPage);
if (goToRegister) goToRegister.addEventListener("click", showRegisterPage);

// 1. Form Pendaftaran Pengguna Biasa
if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const nameEl = document.getElementById("registerName");
    const name = nameEl ? nameEl.value.trim() : "";
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPasswordEl = document.getElementById("confirmPassword");
    const submitBtn = registerForm.querySelector("button[type='submit']");

    if (confirmPasswordEl && password !== confirmPasswordEl.value) {
      alert("Password dan Konfirmasi Password tidak sama!");
      return;
    }

    try {
      setButtonLoading(submitBtn, true, "Mendaftarkan...");
      const client = createSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { full_name: name }
        }
      });
      if (error) throw error;
      registerForm.reset();
      alert("Pendaftaran berhasil! Silakan masuk dengan akun Anda.");
      showLoginPage();
    } catch (err) {
      alert("Gagal mendaftar: " + err.message);
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// 2. Form Login (Mendeteksi Admin edufunnelpolimedia@gmail.com vs Pengguna Biasa)
if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const submitBtn = loginForm.querySelector("button[type='submit']");

    try {
      setButtonLoading(submitBtn, true, "Memeriksa...");
      const client = createSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (error) throw error;

      // Cek apakah akun ini adalah Admin dari tabel profiles atau email admin langsung
      let isAdmin = email.toLowerCase() === "edufunnelpolimedia@gmail.com";
      try {
        const { data: profile } = await client
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile && profile.role === "admin") {
          isAdmin = true;
        }
      } catch (profileErr) {
        console.warn("Cek tabel profiles dilewati:", profileErr);
      }

      if (isAdmin) {
        alert("Selamat datang, Admin Polimedia (" + email + ")!");
      } else {
        alert("Selamat datang di EduFunnel Polimedia!");
      }

      loginForm.reset();
      showDashboardPage();
    } catch (err) {
      alert("Login gagal: " + err.message);
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// 3. Tombol Logout (Sudah Diperbaiki & Menghapus Sesi Aktif)
if (logoutButton) {
  logoutButton.addEventListener("click", async function (e) {
    e.preventDefault();
    try {
      const client = createSupabaseClient();
      await client.auth.signOut();
    } catch (err) {
      console.warn("Gagal sign out dari Supabase:", err);
    }
    localStorage.clear();
    sessionStorage.clear();
    showLoginPage();
  });
}

/* ================= RUMUS PERHITUNGAN PERSENTASE AKURAT ================= */
function hitungPersenLolos(pendaftar, diterima) {
  const p = Number(pendaftar || 0);
  const d = Number(diterima || 0);
  if (p <= 0) return 0;
  return Number(((d / p) * 100).toFixed(2));
}

function hitungPersenTidakLolos(pendaftar, diterima) {
  const p = Number(pendaftar || 0);
  if (p <= 0) return 0;
  const lolos = hitungPersenLolos(pendaftar, diterima);
  return Number((100 - lolos).toFixed(2));
}

function formatPersen(angka) {
  return `${Number(angka || 0).toFixed(2)}%`;
}

/* ================= AMBIL DATA BERDASARKAN FILTER TAHUN & JALUR ================= */
function getMetricsByRangeAndChannel(yearKey = currentDateRange, channel = currentChannel) {
  const datasets = (appData && appData.yearly_datasets) ? appData.yearly_datasets : {};
  const selectedYearObj = datasets[yearKey] || datasets["2025"];
  const rawSources = Array.isArray(selectedYearObj.sources) ? selectedYearObj.sources : [];

  const filteredSources = rawSources
    .filter(function (item) {
      return channel === "all" || item.name.toLowerCase() === channel.toLowerCase();
    })
    .map(function (item) {
      const pendaftar = Number(item.pengunjung || 0);
      const diterima = Number(item.berkuliah || 0);
      const tidakLolosCount = Math.max(0, pendaftar - diterima);
      const persenLolos = hitungPersenLolos(pendaftar, diterima);
      const persenTidakLolos = hitungPersenTidakLolos(pendaftar, diterima);

      return {
        ...item,
        pengunjung: pendaftar,
        daftar: Number(item.daftar || 0),
        test: Number(item.test || 0),
        daftar_ulang: Number(item.daftar_ulang || 0),
        berkuliah: diterima,
        ditolak: tidakLolosCount,
        conversion_rate: persenLolos,
        drop_off: persenTidakLolos
      };
    });

  const summary = filteredSources.reduce(
    function (acc, row) {
      acc.total_pengunjung += row.pengunjung;
      acc.total_daftar += row.daftar;
      acc.total_test += row.test;
      acc.total_daftar_ulang += row.daftar_ulang;
      acc.total_berkuliah += row.berkuliah;
      acc.total_ditolak += row.ditolak;
      return acc;
    },
    {
      total_pengunjung: 0,
      total_daftar: 0,
      total_test: 0,
      total_daftar_ulang: 0,
      total_berkuliah: 0,
      total_ditolak: 0
    }
  );

  const totalPersenLolos = hitungPersenLolos(summary.total_pengunjung, summary.total_berkuliah);
  const totalPersenTidakLolos = hitungPersenTidakLolos(summary.total_pengunjung, summary.total_berkuliah);

  return {
    yearKey,
    yearLabel: selectedYearObj.label,
    catatan: selectedYearObj.catatan,
    is_na: selectedYearObj.is_na,
    channel,
    sources: filteredSources,
    summary,
    conversion_rate: totalPersenLolos,
    fail_rate: totalPersenTidakLolos
  };
}

function getSummaryStages(summary) {
  const totalPendaftar = Number(summary.total_pengunjung || 0);
  return [
    { label: "1. Total Pendaftar Masuk", count: totalPendaftar },
    { label: "2. Lolos Seleksi Berkas", count: Number(summary.total_daftar || 0) },
    { label: "3. Mengikuti Tes / Penilaian", count: Number(summary.total_test || 0) },
    { label: "4. Masuk Kuota Daya Tampung", count: Number(summary.total_daftar_ulang || 0) },
    { label: "5. Resmi Diterima (Lulus)", count: Number(summary.total_berkuliah || 0) }
  ];
}

/* ================= FETCH & SETUP AWAL ================= */
async function fetchEduFunnelData() {
  appData = JSON.parse(JSON.stringify(window.eduFunnelData));
  setupNavigation();
  setupFilters();
  setupCalculatorForm();
  renderPage(currentPage);
}

function setupNavigation() {
  document.querySelectorAll(".menu-item").forEach(function (item) {
    item.onclick = function () {
      document.querySelectorAll(".menu-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      renderPage(item.dataset.page);
    };
  });
}

function setupFilters() {
  if (channelFilter) {
    channelFilter.onchange = function () {
      currentChannel = channelFilter.value;
      renderPage(currentPage);
    };
  }
  if (dateFilter) {
    dateFilter.onchange = function () {
      currentDateRange = dateFilter.value;
      renderPage(currentPage);
    };
  }
}

/* ================= RENDER HALAMAN UTAMA ================= */
function renderPage(page) {
  currentPage = page;
  if (monthlyChart) {
    monthlyChart.destroy();
    monthlyChart = null;
  }
  if (page === "overview") renderOverview();
  if (page === "channel") renderChannelAnalysis();
  if (page === "funnel") renderFunnelDepth();
  if (page === "table") renderDataTable();
  setupReportExport();
}

/* 1. HALAMAN RINGKASAN PELUANG (OVERVIEW) */
function renderOverview() {
  const metrics = getMetricsByRangeAndChannel(currentDateRange, currentChannel);
  const s = metrics.summary;
  const stages = getSummaryStages(s);
  const bestSource = [...metrics.sources].sort((a, b) => b.conversion_rate - a.conversion_rate)[0];

  app.innerHTML = `
    <section class="page-title">
      <p>LAPORAN ANALITIK PELUANG MASUK POLIMEDIA</p>
      <h1>${metrics.yearLabel}</h1>
      <span>${metrics.catatan}</span>
    </section>

    ${metrics.is_na ? `
      <div class="info-banner">
        ⚠️ <strong>Catatan Data 2022:</strong> Pada dokumen resmi Polimedia, rincian angka pendaftar tahun 2022 tertulis <b>N/A</b> (belum terpublikasi). Data di bawah menggunakan angka estimasi baseline. Pilih tahun <b>2023, 2024, atau 2025</b> untuk melihat angka resmi PMB.
      </div>
    ` : ""}

    <section class="summary summary-4">
      <div class="summary-card">
        <h3>Total Pendaftar</h3>
        <p>${s.total_pengunjung.toLocaleString("id-ID")} <small style="font-size:0.9rem;color:#94a3b8;">Orang</small></p>
      </div>
      <div class="summary-card" style="border-bottom: 3px solid #22c55e;">
        <h3>Diterima (Lolos)</h3>
        <p style="color:#4ade80;">${s.total_berkuliah.toLocaleString("id-ID")} <small style="font-size:0.9rem;">(${formatPersen(metrics.conversion_rate)})</small></p>
      </div>
      <div class="summary-card" style="border-bottom: 3px solid #ef4444;">
        <h3>Tidak Lolos (Gugur)</h3>
        <p style="color:#f87171;">${s.total_ditolak.toLocaleString("id-ID")} <small style="font-size:0.9rem;">(${formatPersen(metrics.fail_rate)})</small></p>
      </div>
      <div class="summary-card">
        <h3>Rasio Keketatan</h3>
        <p>1 : ${s.total_berkuliah > 0 ? Math.round(s.total_pengunjung / s.total_berkuliah) : 0} <small style="font-size:0.85rem;color:#94a3b8;">Pesaing</small></p>
      </div>
    </section>

    <section class="card" style="margin-bottom: 24px;">
      <h2>Perbandingan Visual Peluang Lolos vs Tidak Lolos (${metrics.yearLabel})</h2>
      <p style="color:#94a3b8; font-size:0.9rem;">Dari total <b>${s.total_pengunjung.toLocaleString("id-ID")} pendaftar</b>, berikut adalah proporsi peserta yang berhasil diterima dibandingkan yang gugur:</p>
      <div class="prob-bar-wrap">
        <div class="prob-bar-pass" style="width: ${Math.max(metrics.conversion_rate, 8)}%;">
          LOLOS: ${formatPersen(metrics.conversion_rate)} (${s.total_berkuliah.toLocaleString("id-ID")})
        </div>
        <div class="prob-bar-fail">
          TIDAK LOLOS: ${formatPersen(metrics.fail_rate)} (${s.total_ditolak.toLocaleString("id-ID")})
        </div>
      </div>
    </section>

    <section class="dashboard-grid">
      <div class="card">
        <div class="section-header">
          <div>
            <h2>Alur Penyaringan Peserta (Funnel Seleksi)</h2>
            <span>Persentase peserta yang bertahan di setiap tahapan seleksi terhadap total pendaftar awal</span>
          </div>
        </div>
        <div id="overviewFunnel"></div>
      </div>

      <aside class="card insight-card">
        <h2>Kesimpulan Cepat</h2>
        <div style="margin: 12px 0;">
          <div style="margin-bottom: 10px;">
            <span class="pill-pass">✓ Peluang Lolos: ${formatPersen(metrics.conversion_rate)}</span>
          </div>
          <div>
            <span class="pill-fail">✕ Risiko Gagal: ${formatPersen(metrics.fail_rate)}</span>
          </div>
        </div>
        <p>
          Artinya, dari setiap <strong>100 pendaftar</strong> di Polimedia pada periode ini, rata-rata sekitar
          <strong>${Math.round(metrics.conversion_rate)} orang diterima</strong> dan
          <strong>${100 - Math.round(metrics.conversion_rate)} orang tidak lolos</strong>.
        </p>
        <hr />
        <p>
          Jalur yang paling direkomendasikan:
          <strong>Jalur ${bestSource ? bestSource.name : "-"}</strong>
          karena memiliki peluang lolos tertinggi yaitu <strong>${bestSource ? formatPersen(bestSource.conversion_rate) : "0%"}</strong>.
        </p>
        ${getReportExportMarkup()}
      </aside>
    </section>
  `;
  renderFunnelBars("overviewFunnel", stages);
}

/* 2. HALAMAN PERBANDINGAN JALUR MASUK (CHANNEL ANALYSIS) */
function renderChannelAnalysis() {
  const metrics = getMetricsByRangeAndChannel(currentDateRange, currentChannel);

  const channelCards = metrics.sources.map(function (source) {
    return `
      <div class="channel-card">
        <div class="channel-top">
          <h2>Jalur ${source.name}</h2>
          <span class="badge stable">${source.status}</span>
        </div>
        <p class="label">Total Pendaftar</p>
        <h3>${source.pengunjung.toLocaleString("id-ID")} Orang</h3>

        <div class="prob-bar-wrap" style="height:20px; font-size:0.7rem;">
          <div class="prob-bar-pass" style="width:${Math.max(source.conversion_rate, 12)}%">${formatPersen(source.conversion_rate)}</div>
          <div class="prob-bar-fail">${formatPersen(source.drop_off)}</div>
        </div>

        <div class="channel-stats" style="grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
          <div style="background:rgba(34,197,94,0.1); padding:8px; border-radius:8px;">
            <span style="color:#4ade80;">✓ Diterima (Lolos)</span>
            <strong style="color:#4ade80; display:block; font-size:1.05rem;">
              ${source.berkuliah.toLocaleString("id-ID")} (${formatPersen(source.conversion_rate)})
            </strong>
          </div>
          <div style="background:rgba(239,68,68,0.1); padding:8px; border-radius:8px;">
            <span style="color:#f87171;">✕ Tidak Lolos</span>
            <strong style="color:#f87171; display:block; font-size:1.05rem;">
              ${source.ditolak.toLocaleString("id-ID")} (${formatPersen(source.drop_off)})
            </strong>
          </div>
        </div>
      </div>
    `;
  }).join("");

  app.innerHTML = `
    <section class="page-title">
      <p>PERBANDINGAN JALUR MASUK POLIMEDIA</p>
      <h1>Peluang Lolos vs Tidak Lolos per Jalur (${metrics.yearLabel})</h1>
      <span>Bandingkan langsung persentase kelulusan antara jalur SNBP, SNBT, dan Mandiri.</span>
    </section>

    <section class="channel-grid">
      ${channelCards}
    </section>

    <section class="card">
      <h2>Grafik Tren Pendaftar & Mahasiswa Diterima (2022 – Prediksi 2026)</h2>
      <p class="label">Perbandingan lonjakan pendaftar tiap jalur dari tahun 2022, 2023, 2024, 2025, hingga Prediksi 2026.</p>
      <canvas id="monthlyChart" style="max-height: 380px;"></canvas>
    </section>
  `;
  renderMultiYearChart();
}

/* 3. HALAMAN TAHAPAN SELEKSI (FUNNEL DEPTH) */
function renderFunnelDepth() {
  const metrics = getMetricsByRangeAndChannel(currentDateRange, currentChannel);
  const stages = getSummaryStages(metrics.summary);

  app.innerHTML = `
    <section class="page-title">
      <p>DETAIL PENYARINGAN PESERTA</p>
      <h1>Tahapan Seleksi & Gugur (${metrics.yearLabel})</h1>
      <span>Melihat berapa banyak peserta yang bertahan (Lolos) dan tereliminasi (Tidak Lolos) di tiap tahapan.</span>
    </section>

    <section class="dashboard-grid">
      <div class="card">
        <h2>Detail Konversi Tahap demi Tahap</h2>
        <div id="depthFunnel"></div>
      </div>
      <aside>
        <div class="card friction-card">
          <h2>Ringkasan Akhir Seleksi</h2>
          <p style="margin-bottom: 12px;">
            Dari <strong>${metrics.summary.total_pengunjung.toLocaleString("id-ID")} pendaftar</strong>:
          </p>
          <p class="pill-pass" style="margin-bottom: 8px; display:block;">
            ✓ Lolos Diterima: ${metrics.summary.total_berkuliah.toLocaleString("id-ID")} orang (${formatPersen(metrics.conversion_rate)})
          </p>
          <p class="pill-fail" style="display:block;">
            ✕ Gugur / Tidak Lolos: ${metrics.summary.total_ditolak.toLocaleString("id-ID")} orang (${formatPersen(metrics.fail_rate)})
          </p>
        </div>
        <div class="card">
          <h3>Unduh Data Analitik</h3>
          <p>Simpan hasil perhitungan peluang periode ini ke PDF, Excel/CSV, atau JSON.</p>
          ${getReportExportMarkup()}
        </div>
      </aside>
    </section>
  `;
  renderFunnelBars("depthFunnel", stages);
}

/* 4. HALAMAN TABEL DATA LENGKAP (MULTI-TAHUN, JALUR & 16 PRODI) */
function renderDataTable() {
  const metrics = getMetricsByRangeAndChannel(currentDateRange, currentChannel);
  const s = metrics.summary;

  const rowsJalur = metrics.sources.map(function (src) {
    return `
      <tr>
        <td><strong>Jalur ${src.name}</strong></td>
        <td>${src.pengunjung.toLocaleString("id-ID")}</td>
        <td style="color:#4ade80; font-weight:600;">${src.berkuliah.toLocaleString("id-ID")}</td>
        <td style="color:#f87171; font-weight:600;">${src.ditolak.toLocaleString("id-ID")}</td>
        <td><span class="pill-pass">${formatPersen(src.conversion_rate)}</span></td>
        <td><span class="pill-fail">${formatPersen(src.drop_off)}</span></td>
        <td>1 : ${src.berkuliah > 0 ? Math.round(src.pengunjung / src.berkuliah) : 0}</td>
      </tr>
    `;
  }).join("");

  const yearOrder = ["2022", "2023", "2024", "2025", "all_years", "prediksi_2026"];
  const rowsTahun = yearOrder.map(function (yKey) {
    const m = getMetricsByRangeAndChannel(yKey, currentChannel);
    const activeStyle = yKey === currentDateRange ? "background: rgba(56, 189, 248, 0.12);" : "";
    return `
      <tr style="${activeStyle}">
        <td><strong>${m.yearLabel}</strong></td>
        <td>${m.summary.total_pengunjung.toLocaleString("id-ID")}</td>
        <td style="color:#4ade80; font-weight:600;">${m.summary.total_berkuliah.toLocaleString("id-ID")}</td>
        <td style="color:#f87171;">${m.summary.total_ditolak.toLocaleString("id-ID")}</td>
        <td><span class="pill-pass">${formatPersen(m.conversion_rate)}</span></td>
        <td><span class="pill-fail">${formatPersen(m.fail_rate)}</span></td>
      </tr>
    `;
  }).join("");

  const scaleFactor = s.total_pengunjung / 11058;
  const rowsProdi = (appData.prodi_list || []).map(function (p) {
    const peminat = Math.max(10, Math.round(p.peminat_2025 * scaleFactor));
    const kuota = currentDateRange === "all_years" ? p.kuota * 3 : p.kuota;
    const diterima = Math.min(peminat, kuota);
    const ditolak = Math.max(0, peminat - diterima);
    const persenLolos = hitungPersenLolos(peminat, diterima);
    const persenGagal = hitungPersenTidakLolos(peminat, diterima);

    return `
      <tr>
        <td>${p.kategori}</td>
        <td><strong>${p.prodi}</strong></td>
        <td>${peminat.toLocaleString("id-ID")}</td>
        <td style="color:#4ade80;">${diterima.toLocaleString("id-ID")}</td>
        <td style="color:#f87171;">${ditolak.toLocaleString("id-ID")}</td>
        <td><span class="pill-pass">${formatPersen(persenLolos)}</span></td>
        <td><span class="pill-fail">${formatPersen(persenGagal)}</span></td>
        <td>Min. Rapor ${p.min_rapor} / UTBK ${p.min_utbk}</td>
      </tr>
    `;
  }).join("");

  app.innerHTML = `
    <section class="page-title">
      <p>TABEL REKAPITULASI LENGKAP & AKURAT</p>
      <h1>Data Pendaftar, Persentase Lolos & Tidak Lolos (${metrics.yearLabel})</h1>
      <span>Tabel perbandingan terperinci per jalur, lintas tahun (2022–2026), dan 16 Program Studi Polimedia.</span>
    </section>

    <section class="card" style="margin-bottom: 24px;">
      <h2 style="margin-bottom: 12px;">Tabel 1. Rincian Peluang Lolos vs Tidak Lolos per Jalur (${metrics.yearLabel})</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Jalur Seleksi</th>
            <th>Total Pendaftar</th>
            <th>Diterima (Lolos)</th>
            <th>Ditolak (Tidak Lolos)</th>
            <th>% Peluang Lolos</th>
            <th>% Risiko Tidak Lolos</th>
            <th>Rasio Persaingan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsJalur}
          <tr class="total-row">
            <td>TOTAL KESELURUHAN</td>
            <td>${s.total_pengunjung.toLocaleString("id-ID")}</td>
            <td>${s.total_berkuliah.toLocaleString("id-ID")}</td>
            <td>${s.total_ditolak.toLocaleString("id-ID")}</td>
            <td>${formatPersen(metrics.conversion_rate)}</td>
            <td>${formatPersen(metrics.fail_rate)}</td>
            <td>1 : ${s.total_berkuliah > 0 ? Math.round(s.total_pengunjung / s.total_berkuliah) : 0}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card" style="margin-bottom: 24px;">
      <h2 style="margin-bottom: 12px;">Tabel 2. Perbandingan Lintas Tahun (2022, 2023, 2024, 2025, Keseluruhan & Prediksi 2026)</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Periode Tahun</th>
            <th>Total Pendaftar</th>
            <th>Total Diterima</th>
            <th>Total Tidak Lolos</th>
            <th>% Peluang Lolos</th>
            <th>% Tidak Lolos</th>
          </tr>
        </thead>
        <tbody>
          ${rowsTahun}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2 style="margin-bottom: 12px;">Tabel 3. Estimasi Peluang Lolos & Tidak Lolos 16 Program Studi Polimedia</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Jurusan</th>
            <th>Program Studi</th>
            <th>Est. Peminat</th>
            <th>Kuota Diterima</th>
            <th>Tidak Lolos</th>
            <th>% Lolos</th>
            <th>% Tidak Lolos</th>
            <th>Rekomendasi Nilai Aman</th>
          </tr>
        </thead>
        <tbody>
          ${rowsProdi}
        </tbody>
      </table>
    </section>
  `;
}

/* ================= FUNNEL BAR & GRAFIK MULTI-TAHUN ================= */
function renderFunnelBars(containerId, stages) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const totalAwal = stages[0].count;

  container.innerHTML = stages.map(function (stage, index) {
    const persenTerhadapAwal = totalAwal === 0 ? 0 : Number(((stage.count / totalAwal) * 100).toFixed(2));
    const gugurDariAwal = Math.max(0, totalAwal - stage.count);
    const persenGugur = totalAwal === 0 ? 0 : Number((100 - persenTerhadapAwal).toFixed(2));

    let keteranganTahap = `<div class="drop" style="color:#4ade80;">Basis Pendaftar Awal: 100% (${stage.count.toLocaleString("id-ID")} peserta)</div>`;
    if (index > 0) {
      keteranganTahap = `
        <div class="drop" style="display:flex; justify-content:space-between; font-size:0.82rem; margin-top:4px;">
          <span style="color:#4ade80;">✓ Bertahan: <b>${persenTerhadapAwal}%</b> (${stage.count.toLocaleString("id-ID")} org)</span>
          <span style="color:#f87171;">✕ Tereliminasi Kumulatif: <b>${persenGugur}%</b> (${gugurDariAwal.toLocaleString("id-ID")} org)</span>
        </div>
      `;
    }

    return `
      <div class="funnel-stage" style="margin-bottom: 16px;">
        <div class="stage-label">
          <strong>${stage.label}</strong>
          <span><b>${stage.count.toLocaleString("id-ID")}</b> Peserta (${persenTerhadapAwal}%)</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill" style="width: ${persenTerhadapAwal}%"></div>
        </div>
        ${keteranganTahap}
      </div>
    `;
  }).join("");
}

function renderMultiYearChart() {
  const canvas = document.getElementById("monthlyChart");
  if (!canvas || typeof Chart === "undefined") return;

  const chartRows = appData.multi_year_chart || [];
  const labels = chartRows.map(r => r.tahun);

  const ctx = canvas.getContext("2d");
  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Pendaftar SNBP",
          data: chartRows.map(r => r.snbp_p),
          backgroundColor: "rgba(56, 189, 248, 0.85)",
          borderRadius: 6
        },
        {
          label: "Pendaftar SNBT",
          data: chartRows.map(r => r.snbt_p),
          backgroundColor: "rgba(99, 102, 241, 0.85)",
          borderRadius: 6
        },
        {
          label: "Pendaftar Mandiri",
          data: chartRows.map(r => r.mandiri_p),
          backgroundColor: "rgba(245, 158, 11, 0.85)",
          borderRadius: 6
        },
        {
          label: "Total Diterima (Lulus)",
          data: chartRows.map(r => r.snbp_d + r.snbt_d + r.mandiri_d),
          backgroundColor: "rgba(34, 197, 94, 0.9)",
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#cbd5e1" } }
      },
      scales: {
        x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,0.06)" } },
        y: { beginAtZero: true, ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,0.06)" } }
      }
    }
  });
}

/* ================= LOGIKA KALKULATOR PELUANG LOLOS & TIDAK LOLOS AKURAT ================= */
function setupCalculatorForm() {
  const form = document.getElementById("simulasiForm");
  if (!form) return;

  form.onsubmit = async function (e) {
    e.preventDefault();
    const nama = document.getElementById("inputNama").value.trim();
    const email = document.getElementById("inputEmail").value.trim();
    const prodiName = document.getElementById("inputProdi").value;
    const jalur = document.getElementById("inputJalur").value;
    const nilaiInput = parseFloat(document.getElementById("inputNilai").value);
    const boxHasil = document.getElementById("hasilSimulasi");

    const metricsTahun = getMetricsByRangeAndChannel(currentDateRange, "all");
    const dataJalur = metricsTahun.sources.find(s => s.name === jalur) || metricsTahun.sources[0];
    const baseRateJalur = dataJalur.conversion_rate;

    const prodiObj = (appData.prodi_list || []).find(p => p.prodi === prodiName) || {
      faktor_prodi: 1.0,
      min_rapor: 82,
      min_utbk: 540,
      kuota: 100,
      peminat_2025: 650,
      keketatan: "Ketat"
    };

    let rasioNilai = 1.0;
    let kategoriNilai = "";
    if (nilaiInput <= 100) {
      rasioNilai = nilaiInput / prodiObj.min_rapor;
      kategoriNilai = `Rata-rata Rapor ${nilaiInput} (Standar Aman Prodi: ${prodiObj.min_rapor})`;
    } else {
      rasioNilai = nilaiInput / prodiObj.min_utbk;
      kategoriNilai = `Skor UTBK ${nilaiInput} (Standar Aman Prodi: ${prodiObj.min_utbk})`;
    }

    let modifierNilai = Math.pow(rasioNilai, 2.2);
    let peluangLolos = baseRateJalur * prodiObj.faktor_prodi * modifierNilai;

    if (rasioNilai >= 1.0) {
      peluangLolos = Math.min(92.5, peluangLolos + 28);
    } else if (rasioNilai >= 0.92) {
      peluangLolos = Math.min(75.0, peluangLolos + 12);
    }

    peluangLolos = Number(Math.max(3.5, Math.min(94.0, peluangLolos)).toFixed(2));
    const peluangTidakLolos = Number((100 - peluangLolos).toFixed(2));

    let statusWebhook = "Dihitung dengan Mesin Analitik Polimedia (Aktifkan Docker di port 4000 untuk memicu Webhook n8n)";
    try {
      // Otomatis deteksi apakah sedang berjalan di Laptop (Lokal) atau sudah di Vercel
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const apiUrl = isLocal ? "http://localhost:4000/api/hitung-peluang" : "/api/hitung-peluang";

      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama, email, prodi: prodiName, jalur, nilai: nilaiInput,
          tahun_acuan: metricsTahun.yearLabel,
          persentase_lolos: `${peluangLolos}%`,
          persentase_tidak_lolos: `${peluangTidakLolos}%`
        })
      });
      if (resp.ok) {
        statusWebhook = "✓ Data berhasil diproses Server & dikirim ke Webhook n8n!";
      }
    } catch (_) {
      // Tetap lanjut menggunakan hasil akurat
    }

    boxHasil.style.display = "block";
    boxHasil.innerHTML = `
      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <strong>Hasil Analisis Peluang: ${nama} (${prodiName} - Jalur ${jalur})</strong>
        <span style="color:#38bdf8; font-size:0.82rem;">Acuan Data: ${metricsTahun.yearLabel}</span>
      </div>

      <div style="font-size:0.86rem; color:#cbd5e1; margin-bottom:10px;">
        • <b>Rasio Dasar Jalur ${jalur}:</b> ${dataJalur.berkuliah.toLocaleString("id-ID")} diterima dari ${dataJalur.pengunjung.toLocaleString("id-ID")} pendaftar (Peluang dasar jalur: <b>${formatPersen(baseRateJalur)}</b>)<br/>
        • <b>Evaluasi Skor Anda:</b> ${kategoriNilai} — Tingkat Persaingan Prodi: <b>${prodiObj.keketatan}</b>
      </div>

      <div class="prob-bar-wrap">
        <div class="prob-bar-pass" style="width: ${Math.max(peluangLolos, 12)}%;">
          PELUANG LOLOS: ${formatPersen(peluangLolos)}
        </div>
        <div class="prob-bar-fail">
          RISIKO TIDAK LOLOS: ${formatPersen(peluangTidakLolos)}
        </div>
      </div>

      <div style="display:flex; gap:14px; flex-wrap:wrap; margin-top:10px;">
        <span class="pill-pass">✓ Potensi Diterima (Lolos): ${formatPersen(peluangLolos)}</span>
        <span class="pill-fail">✕ Potensi Gugur (Tidak Lolos): ${formatPersen(peluangTidakLolos)}</span>
      </div>
      <small style="display:block; margin-top:10px; color:#94a3b8;">${statusWebhook}</small>
    `;
  };
}

/* ================= EXPORT LAPORAN ================= */
function getReportExportMarkup() {
  return `
    <div class="report-export" style="margin-top:14px;">
      <button class="auth-button report-btn" type="button" data-report-toggle>
        Unduh Laporan Lengkap
      </button>
      <div class="export-menu" hidden>
        <button type="button" data-export-type="pdf">Download PDF</button>
        <button type="button" data-export-type="csv">Download Excel/CSV</button>
        <button type="button" data-export-type="json">Download JSON</button>
      </div>
    </div>
  `;
}

function setupReportExport() {
  document.querySelectorAll("[data-report-toggle]").forEach(function (toggle) {
    toggle.onclick = function () {
      const menu = toggle.closest(".report-export").querySelector(".export-menu");
      menu.hidden = !menu.hidden;
    };
  });
  document.querySelectorAll("[data-export-type]").forEach(function (btn) {
    btn.onclick = function () {
      const type = btn.dataset.exportType;
      btn.closest(".export-menu").hidden = true;
      const m = getMetricsByRangeAndChannel(currentDateRange, currentChannel);
      if (type === "json") {
        const blob = new Blob([JSON.stringify(m, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `polimedia-${currentDateRange}.json`;
        link.click();
      } else if (type === "csv") {
        const rows = [
          ["Periode", m.yearLabel],
          ["Jalur", "Pendaftar", "Diterima (Lolos)", "Tidak Lolos", "% Lolos", "% Tidak Lolos"]
        ];
        m.sources.forEach(s => {
          rows.push([s.name, s.pengunjung, s.berkuliah, s.ditolak, `${s.conversion_rate}%`, `${s.drop_off}%`]);
        });
        const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `polimedia-${currentDateRange}.csv`;
        link.click();
      } else if (type === "pdf" && window.jspdf) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`Laporan PMB Polimedia - ${m.yearLabel}`, 14, 18);
        doc.setFontSize(10);
        doc.text(`Total Pendaftar: ${m.summary.total_pengunjung.toLocaleString("id-ID")}`, 14, 28);
        doc.text(`Total Diterima (Lolos): ${m.summary.total_berkuliah.toLocaleString("id-ID")} (${formatPersen(m.conversion_rate)})`, 14, 35);
        doc.text(`Total Tidak Lolos: ${m.summary.total_ditolak.toLocaleString("id-ID")} (${formatPersen(m.fail_rate)})`, 14, 42);
        let y = 54;
        m.sources.forEach(s => {
          doc.text(`- Jalur ${s.name}: Pendaftar ${s.pengunjung} | Lolos ${s.berkuliah} (${s.conversion_rate}%) | Gagal ${s.ditolak} (${s.drop_off}%)`, 14, y);
          y += 8;
        });
        doc.save(`polimedia-${currentDateRange}.pdf`);
      }
    };
  });
}

/* ================= INIT ================= */
window.addEventListener("load", async function () {
  try {
    const client = createSupabaseClient();
    const { data } = await client.auth.getUser();
    if (data && data.user) {
      showDashboardPage();
      return;
    }
  } catch (err) {
    console.warn("Belum ada sesi login aktif:", err);
  }
  showLoginPage();
});