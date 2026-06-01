// ===== REVENUE STATISTICS =====
// File: /js/revenue.js
// API endpoints cần implement ở backend:
//   GET /api/v1/revenue/by-day?from=YYYY-MM-DD&to=YYYY-MM-DD
//   GET /api/v1/revenue/by-month?year=YYYY
//   GET /api/v1/revenue/by-quarter?year=YYYY
//   GET /api/v1/revenue/by-year
// Response mỗi endpoint: [{ label, totalRevenue, totalBooking }, ...]

let _rvTab     = 'month';   // day | month | quarter | year
let _rvChart   = null;       // Chart.js instance

// ── Helpers ──────────────────────────────────────────────────────────────────
function rvFmt(num) {
    if (num == null || isNaN(num)) return '—';
    return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' ₫';
}

function rvSetTab(tab) {
    _rvTab = tab;
    ['day','month','quarter','year'].forEach(t => {
        document.getElementById('rv-tab-' + t)?.classList.toggle('active', t === tab);
    });
    // Hiện/ẩn bộ lọc phù hợp
    const yearWrap     = document.getElementById('rv-year-wrap');
    const dateRangeWrap = document.getElementById('rv-date-range-wrap');
    if (tab === 'year') {
        yearWrap?.classList.add('hidden');
        dateRangeWrap?.classList.add('hidden');
    } else if (tab === 'day') {
        yearWrap?.classList.add('hidden');
        dateRangeWrap?.classList.remove('hidden');
        // Mặc định: 30 ngày gần nhất
        const today = new Date();
        const from  = new Date(today); from.setDate(today.getDate() - 29);
        const toISO   = today.toISOString().slice(0,10);
        const fromISO = from.toISOString().slice(0,10);
        const fromEl = document.getElementById('rv-date-from');
        const toEl   = document.getElementById('rv-date-to');
        if (fromEl && !fromEl.value) fromEl.value = fromISO;
        if (toEl   && !toEl.value)   toEl.value   = toISO;
    } else {
        yearWrap?.classList.remove('hidden');
        dateRangeWrap?.classList.add('hidden');
    }
}

function rvReload() { rvLoad(); }

// ── Main load ────────────────────────────────────────────────────────────────
async function rvLoad() {
    rvShowLoading(true);
    try {
        const token = localStorage.getItem('accessToken');
        const headers = token ? { Authorization: 'Bearer ' + token } : {};
        const year    = document.getElementById('rv-input-year')?.value || new Date().getFullYear();

        let url, urlChart;
        if (_rvTab === 'day') {
            url      = `/api/v1/revenue/by-day`;        // bảng - DESC
            urlChart = `/api/v1/revenue/by-day-chart`;  // chart - ASC
        } else if (_rvTab === 'month') {
            url      = `/api/v1/revenue/by-month?year=${year}`;
            urlChart = url;
        } else if (_rvTab === 'quarter') {
            url      = `/api/v1/revenue/by-quarter?year=${year}`;
            urlChart = url;
        } else {
            url      = `/api/v1/revenue/by-year`;
            urlChart = url;
        }

        const [res, resChart] = await Promise.all([
            fetch(url, { headers }),
            urlChart !== url ? fetch(urlChart, { headers }) : Promise.resolve(null)
        ]);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data      = await res.json();
        const dataChart = resChart ? await resChart.json() : data;

        const rows      = Array.isArray(data)      ? data      : (Array.isArray(data.data)      ? data.data      : []);
        const rowsChart = Array.isArray(dataChart) ? dataChart : (Array.isArray(dataChart.data) ? dataChart.data : []);
        rvRender(rows, rowsChart);
    } catch (err) {
        console.error('Revenue load error:', err);
        rvShowToast('Lỗi tải dữ liệu: ' + err.message, 'error');
        rvRender([]);
    } finally {
        rvShowLoading(false);
    }
}

// ── Render chart + table ──────────────────────────────────────────────────────
function rvRender(rows, rowsChart) {
    rowsChart = rowsChart || rows;
    // Summary
    const totalRevenue = rows.reduce((s, r) => s + (r.totalRevenue || 0), 0);
    const totalBooking = rows.reduce((s, r) => s + (r.totalBooking || 0), 0);
    const avgRevenue   = rows.length ? totalRevenue / rows.length : 0;

    document.getElementById('rv-sum-revenue').textContent = rvFmt(totalRevenue);
    document.getElementById('rv-sum-booking').textContent = totalBooking.toLocaleString('vi-VN') + ' booking';
    document.getElementById('rv-sum-avg').textContent     = rvFmt(avgRevenue);

    // Chart title
    const titles = { day: 'Doanh thu theo Ngày', month: 'Doanh thu theo Tháng', quarter: 'Doanh thu theo Quý', year: 'Doanh thu theo Năm' };
    document.getElementById('rv-chart-title').textContent = titles[_rvTab] || 'Biểu đồ doanh thu';

    // Empty state
    const emptyEl = document.getElementById('rv-chart-empty');
    if (!rows.length) {
        emptyEl?.classList.remove('hidden');
        rvDestroyChart();
        rvRenderTable([]);
        return;
    }
    emptyEl?.classList.add('hidden');

    // Chart dùng rowsChart (ASC - ngày cũ trước)
    rvRenderChart(rowsChart);

    // Table dùng rows (DESC - ngày mới trước)
    rvRenderTable(rows);

    // Table count
    document.getElementById('rv-table-count').textContent = rows.length + ' kỳ';
}

function rvRenderChart(rows) {
    const labels   = rows.map(r => r.label);
    const revenues = rows.map(r => r.totalRevenue || 0);
    const bookings = rows.map(r => r.totalBooking || 0);

    rvDestroyChart();

    const ctx = document.getElementById('rv-chart').getContext('2d');
    _rvChart = new Chart(ctx, {
        data: {
            labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Doanh thu (₫)',
                    data: revenues,
                    backgroundColor: 'rgba(16,185,129,0.18)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'yRevenue',
                    order: 2,
                },
                {
                    type: 'line',
                    label: 'Số booking',
                    data: bookings,
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96,165,250,0.12)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#3b82f6',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.35,
                    fill: true,
                    yAxisID: 'yBooking',
                    order: 1,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleFont: { weight: '700', size: 13 },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label(ctx) {
                            if (ctx.dataset.yAxisID === 'yRevenue')
                                return '  Doanh thu: ' + new Intl.NumberFormat('vi-VN').format(ctx.raw) + ' ₫';
                            return '  Booking: ' + ctx.raw;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11, weight: '600' }, color: '#94a3b8' }
                },
                yRevenue: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        font: { size: 10 }, color: '#10b981',
                        callback: v => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v) + ' ₫'
                    }
                },
                yBooking: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { font: { size: 10 }, color: '#60a5fa', stepSize: 1 }
                }
            }
        }
    });
}

function rvDestroyChart() {
    if (_rvChart) { _rvChart.destroy(); _rvChart = null; }
}

function rvRenderTable(rows) {
    const tbody = document.getElementById('rv-table-body');
    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-5 py-12 text-center text-slate-400">
            <i class="fas fa-inbox text-3xl mb-3 block opacity-30"></i>
            <span class="text-sm">Không có dữ liệu cho kỳ đã chọn</span>
        </td></tr>`;
        return;
    }

    const totalRevenue = rows.reduce((s, r) => s + (r.totalRevenue || 0), 0);

    tbody.innerHTML = rows.map((r, i) => {
        const avg     = r.totalBooking ? (r.totalRevenue / r.totalBooking) : 0;
        const pct     = totalRevenue ? ((r.totalRevenue / totalRevenue) * 100).toFixed(1) : 0;
        const barW    = totalRevenue ? Math.round((r.totalRevenue / totalRevenue) * 100) : 0;
        const isTop   = r.totalRevenue === Math.max(...rows.map(x => x.totalRevenue || 0));
        return `<tr class="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
            <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                    ${isTop ? '<span class="text-amber-400 text-xs">🏆</span>' : `<span class="text-xs text-slate-400 font-bold w-4">${i+1}</span>`}
                    <span class="font-bold text-slate-700 text-sm">${r.label}</span>
                </div>
                <div class="mt-1.5 h-1.5 rounded-full bg-slate-100 w-32">
                    <div class="h-1.5 rounded-full bg-emerald-400" style="width:${barW}%"></div>
                </div>
            </td>
            <td class="px-5 py-4">
                <span class="font-bold text-emerald-600 text-sm">${rvFmt(r.totalRevenue)}</span>
                <span class="ml-2 text-[10px] text-slate-400 font-semibold">${pct}%</span>
            </td>
            <td class="px-5 py-4">
                <span class="inline-flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">
                    <i class="fas fa-calendar-check text-[9px]"></i>${r.totalBooking}
                </span>
            </td>
            <td class="px-5 py-4 text-slate-600 font-semibold text-sm">${rvFmt(avg)}</td>
        </tr>`;
    }).join('');
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function rvShowLoading(show) {
    document.getElementById('rv-chart-loading')?.classList.toggle('hidden', !show);
}

function rvShowToast(msg, type) {
    if (typeof showToast === 'function') { showToast(msg, type); return; }
    alert(msg);
}

// ── Init: set default tab khi view load ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    rvSetTab('month');
    // Set năm hiện tại
    const yearEl = document.getElementById('rv-input-year');
    if (yearEl) yearEl.value = new Date().getFullYear();
});

// Auto-load khi sidebar chuyển sang tab Revenue
(function () {
    const _origSwitch = window.switchToView;
    if (typeof _origSwitch === 'function') {
        window.switchToView = function (view) {
            _origSwitch(view);
            if (view === 'revenue') rvLoad();
        };
    }
    // Fallback: hook vào menu click
    document.addEventListener('DOMContentLoaded', function () {
        const menuRevenue = document.getElementById('menuRevenue');
        if (menuRevenue) {
            menuRevenue.addEventListener('click', function () { rvLoad(); });
        }
    });
})();