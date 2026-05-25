// checkout.js — table pattern, giống checkin.js
// API: GET /api/v1/booking/checkout → List<CheckOutBookingRespone>
// Fields: bookingId, customerName, roomName, roomType, checkIntDate

let _coAllBookings = [];

function coReload() { coLoadBookings(); }

async function coLoadBookings() {
    const tbody = document.getElementById('co-table-body');
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-slate-400">
        <i class="fas fa-spinner fa-spin text-2xl mb-3 block text-amber-400"></i>
        <span class="text-sm font-medium">Đang tải danh sách...</span>
    </td></tr>`;
    coSetStats(null);

    try {
        const token = localStorage.getItem('accessToken');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch('/api/v1/booking/checkout', {
            signal: controller.signal,
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        clearTimeout(timeout);
        if (!res.ok) { const t = await res.text(); throw new Error(`HTTP ${res.status} — ${t}`); }
        const json = await res.json();
        _coAllBookings = Array.isArray(json) ? json : (json.data || []);
        coRenderTable(_coAllBookings);
    } catch (err) {
        const msg = err.name === 'AbortError'
            ? 'Request timeout — server không phản hồi sau 8 giây'
            : err.message;
        document.getElementById('co-table-body').innerHTML =
            `<tr><td colspan="7" class="px-5 py-10 text-center text-red-400 text-sm font-medium">⚠️ Lỗi: ${msg}</td></tr>`;
        coSetStats(null);
    }
}

// ===== STATS =====
function coSetStats(bookings) {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('co-stat-total').textContent   = bookings ? bookings.length : '—';
    document.getElementById('co-stat-today').textContent   = bookings
        ? bookings.filter(b => b.checkIntDate && String(b.checkIntDate).slice(0, 10) === today).length : '—';
    document.getElementById('co-stat-overdue').textContent = bookings
        ? bookings.filter(b => b.checkIntDate && String(b.checkIntDate).slice(0, 10) < today).length : '—';
}

// ===== RENDER TABLE =====
function coRenderTable(bookings) {
    const tbody   = document.getElementById('co-table-body');
    const countEl = document.getElementById('co-count');

    coSetStats(bookings);
    countEl.textContent = bookings.length + ' booking';

    if (!bookings.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-slate-400">
            <div style="font-size:2rem;margin-bottom:8px;">🏨</div>
            <span class="text-sm font-medium">Không có booking nào cần Check Out.</span>
        </td></tr>`;
        return;
    }

    const today = new Date().toISOString().slice(0, 10);

    tbody.innerHTML = bookings.map((b, idx) => {
        const checkinDate = coFormatDateTime(b.checkIntDate);

        let dateBadge = '';
        if (b.checkIntDate) {
            const d = String(b.checkIntDate).slice(0, 10);
            if (d < today) {
                dateBadge = `<span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700;background:#fee2e2;color:#dc2626;">Lâu ngày</span>`;
            } else if (d === today) {
                dateBadge = `<span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700;background:#d1fae5;color:#065f46;">Hôm nay</span>`;
            }
        }

        const rowBg = idx % 2 !== 0 ? 'background:#f8fafc;' : '';
        const roomName    = (b.roomName    || '').replace(/'/g, "\\'");
        const custName    = (b.customerName|| '').replace(/'/g, "\\'");

        return `<tr id="co-row-${b.bookingId}" style="${rowBg}" class="border-t border-slate-100 hover:bg-amber-50/40 transition-colors">
            <td class="px-5 py-4 text-slate-400 font-semibold text-xs">${idx + 1}</td>
            <td class="px-5 py-4">
                <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;background:#fffbeb;color:#b45309;border:1px solid #fde68a;">
                    <i class="fas fa-hashtag" style="font-size:10px;"></i>${b.bookingId}
                </span>
            </td>
            <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-door-closed" style="color:#fff;font-size:14px;"></i>
                    </div>
                    <span style="font-weight:700;color:#334155;">${b.roomName || '—'}</span>
                </div>
            </td>
            <td class="px-5 py-4">
                <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#ede9fe;color:#7c3aed;">
                    ${b.roomType || '—'}
                </span>
            </td>
            <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                    <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-user" style="color:#64748b;font-size:12px;"></i>
                    </div>
                    <span style="font-weight:600;color:#475569;font-size:13px;">${b.customerName || '—'}</span>
                </div>
            </td>
            <td class="px-5 py-4 text-slate-600 font-medium text-sm">
                ${checkinDate}${dateBadge}
            </td>
            <td class="px-5 py-4 text-center">
                <button
                    id="co-btn-${b.bookingId}"
                    onclick="coOpenConfirm(${b.bookingId}, '${roomName}', '${custName}', this)"
                    style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;color:#fff;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;cursor:pointer;transition:opacity .2s;box-shadow:0 2px 8px rgba(245,158,11,0.3);"
                    onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                    <i class="fas fa-door-closed"></i> Check Out
                </button>
            </td>
        </tr>`;
    }).join('');
}

// ===== FORMAT DATE TIME =====
function coFormatDateTime(val) {
    if (!val) return '<span style="color:#cbd5e1;">—</span>';
    try {
        let d;
        if (Array.isArray(val)) {
            d = new Date(val[0], val[1] - 1, val[2], val[3] || 0, val[4] || 0);
        } else {
            d = new Date(String(val));
        }
        return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (_) { return val; }
}

// ===== FILTER =====
function coFilterTable() {
    const q = document.getElementById('co-filter-input').value.trim().toLowerCase();
    document.getElementById('co-filter-clear').classList.toggle('hidden', !q);
    if (!q) { coRenderTable(_coAllBookings); return; }
    coRenderTable(_coAllBookings.filter(b =>
        (b.roomName     || '').toLowerCase().includes(q) ||
        (b.roomType     || '').toLowerCase().includes(q) ||
        (b.customerName || '').toLowerCase().includes(q) ||
        String(b.bookingId).includes(q)
    ));
}

function coFilterClear() {
    document.getElementById('co-filter-input').value = '';
    document.getElementById('co-filter-clear').classList.add('hidden');
    coRenderTable(_coAllBookings);
}

// ===== CONFIRM MODAL =====
let _coPendingBookingId = null;
let _coPendingBtn       = null;

function coOpenConfirm(bookingId, roomName, customerName, btn) {
    _coPendingBookingId = bookingId;
    _coPendingBtn       = btn;
    document.getElementById('co-modal-room').textContent     = roomName     || '—';
    document.getElementById('co-modal-booking').textContent  = '#' + bookingId;
    document.getElementById('co-modal-customer').textContent = customerName || '—';
    const empId = localStorage.getItem('userId') || localStorage.getItem('employeeId') || '—';
    document.getElementById('co-modal-emp').textContent = 'ID: ' + empId;
    document.getElementById('co-modal-overlay').style.display = 'flex';
}

function coCloseConfirm() {
    document.getElementById('co-modal-overlay').style.display = 'none';
    _coPendingBookingId = null;
    _coPendingBtn       = null;
}

async function coDoCheckOut() {
    const bookingId  = _coPendingBookingId;
    const btn        = _coPendingBtn;
    const employeeId = localStorage.getItem('userId') || localStorage.getItem('employeeId');

    if (!employeeId) {
        showToast('error', 'Chưa đăng nhập', 'Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại!');
        coCloseConfirm();
        return;
    }

    coCloseConfirm();

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    btn.style.background = 'linear-gradient(135deg,#94a3b8,#64748b)';

    try {
        const token  = localStorage.getItem('accessToken');
        const params = new URLSearchParams({ employeeId, bookingId });
        const res = await fetch('/api/v1/booking/checkoutbooking?' + params.toString(), {
            method: 'POST',
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });

        if (!res.ok) {
            const ct  = res.headers.get('content-type') || '';
            let msg = `Lỗi ${res.status}`;
            if (ct.includes('application/json')) { const j = await res.json(); msg = j.message || JSON.stringify(j); }
            else { msg = await res.text() || msg; }
            throw new Error(msg);
        }

        showToast('success', 'Check Out thành công!', `Booking #${bookingId} đã trả phòng`);
        btn.innerHTML = '<i class="fas fa-check"></i> Đã Check Out';
        btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
        btn.style.boxShadow  = '0 2px 8px rgba(22,163,74,0.25)';

        setTimeout(() => {
            _coAllBookings = _coAllBookings.filter(b => b.bookingId !== bookingId);
            coRenderTable(_coAllBookings);
        }, 1500);

    } catch (err) {
        showToast('error', 'Check Out thất bại', err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-door-closed"></i> Check Out';
        btn.style.background = 'linear-gradient(135deg,#f59e0b,#d97706)';
    }
}

// Đóng modal khi click nền
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('co-modal-overlay');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) coCloseConfirm(); });
});