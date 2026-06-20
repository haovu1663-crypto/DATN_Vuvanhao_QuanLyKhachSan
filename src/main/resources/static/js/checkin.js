// check in — v3: booking list + checkin action

let _ciAllBookings = [];

function ciReload() { ciLoadBookings(); }

async function ciLoadBookings() {
    const tbody = document.getElementById('ci-table-body');
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-slate-400">
        <i class="fas fa-spinner fa-spin text-2xl mb-3 block text-blue-400"></i>
        <span class="text-sm font-medium">Đang tải danh sách...</span>
    </td></tr>`;
    ciSetStats(null);

    try {
        const token = localStorage.getItem('accessToken');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const workBranch = localStorage.getItem('workBranch') || '';
        if (!workBranch) throw new Error('Không tìm thấy chi nhánh. Vui lòng đăng nhập lại!');
        const res = await fetch('/api/v1/booking/checkin?workBranch=' + encodeURIComponent(workBranch), {
            signal: controller.signal,
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        clearTimeout(timeout);
        if (!res.ok) { const t = await res.text(); throw new Error(`HTTP ${res.status} — ${t}`); }
        const json = await res.json();
        _ciAllBookings = Array.isArray(json) ? json : (json.data || []);
        ciRenderTable(_ciAllBookings);
    } catch (err) {
        const msg = err.name === 'AbortError' ? 'Request timeout — server không phản hồi sau 8 giây' : err.message;
        document.getElementById('ci-table-body').innerHTML =
            `<tr><td colspan="7" class="px-5 py-10 text-center text-red-400 text-sm font-medium">⚠️ Lỗi: ${msg}</td></tr>`;
        ciSetStats(null);
    }
}

function ciSetStats(bookings) {
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('ci-stat-total').textContent   = bookings ? bookings.length : '—';
    document.getElementById('ci-stat-today').textContent   = bookings
        ? bookings.filter(b => b.checkin && String(b.checkin).slice(0, 10) === today).length : '—';
    document.getElementById('ci-stat-overdue').textContent = bookings
        ? bookings.filter(b => b.checkin && String(b.checkin).slice(0, 10) < today).length : '—';
}

function ciRenderTable(bookings) {
    const tbody   = document.getElementById('ci-table-body');
    const countEl = document.getElementById('ci-count');

    ciSetStats(bookings);
    countEl.textContent = bookings.length + ' booking';

    if (!bookings.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-12 text-center text-slate-400">
            <div style="font-size:2rem;margin-bottom:8px;">✅</div>
            <span class="text-sm font-medium">Không có booking nào cần Check In.</span>
        </td></tr>`;
        return;
    }

    const today = new Date().toISOString().slice(0, 10);

    tbody.innerHTML = bookings.map((b, idx) => {
        const checkinDate  = ciFormatDate(b.checkin);
        const checkoutDate = ciFormatDate(b.checkout);

        let dateBadge = '';
        if (b.checkin) {
            const d = String(b.checkin).slice(0, 10);
            if (d < today) {
                dateBadge = `<span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700;background:#fee2e2;color:#dc2626;">Quá hạn</span>`;
            } else if (d === today) {
                dateBadge = `<span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:20px;font-size:10px;font-weight:700;background:#fef9c3;color:#b45309;">Hôm nay</span>`;
            }
        }

        const rowBg = idx % 2 !== 0 ? 'background:#f8fafc;' : '';

        return `<tr id="ci-row-${b.bookingId}" style="${rowBg}" class="border-t border-slate-100 hover:bg-blue-50/40 transition-colors">
            <td class="px-5 py-4 text-slate-400 font-semibold text-xs">${idx + 1}</td>
            <td class="px-5 py-4">
                <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;">
                    <i class="fas fa-hashtag" style="font-size:10px;"></i>${b.bookingId}
                </span>
            </td>
            <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-door-open" style="color:#fff;font-size:14px;"></i>
                    </div>
                    <span style="font-weight:700;color:#334155;">${b.roomName || 'Phòng #' + b.roomId}</span>
                </div>
            </td>
            <td class="px-5 py-4">
                <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:#ede9fe;color:#7c3aed;">
                    ${b.roomType || '—'}
                </span>
            </td>
            <td class="px-5 py-4 text-slate-600 font-medium text-sm">
                ${checkinDate}${dateBadge}
            </td>
            <td class="px-5 py-4 text-slate-500 text-sm">${checkoutDate}</td>
            <td class="px-5 py-4 text-center">
                <button
                    id="ci-btn-${b.bookingId}"
                    onclick="ciOpenConfirm(${b.bookingId}, '${b.roomName || 'Phòng #' + b.roomId}', this)"
                    style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:10px;font-size:12px;font-weight:700;color:#fff;background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;cursor:pointer;transition:opacity .2s;box-shadow:0 2px 8px rgba(99,102,241,0.25);"
                    onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                    <i class="fas fa-door-open"></i> Check In
                </button>
            </td>
        </tr>`;
    }).join('');
}

function ciFormatDate(val) {
    if (!val) return '<span style="color:#cbd5e1;">—</span>';
    try {
        let d;
        if (Array.isArray(val)) {
            d = new Date(val[0], val[1] - 1, val[2]);
        } else {
            // LocalDate từ Java thường là "2026-05-25" (string)
            const parts = String(val).slice(0, 10).split('-');
            d = new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_) { return val; }
}

// ===== FILTER =====
function ciFilterTable() {
    const q = document.getElementById('ci-filter-input').value.trim().toLowerCase();
    document.getElementById('ci-filter-clear').classList.toggle('hidden', !q);
    if (!q) { ciRenderTable(_ciAllBookings); return; }
    ciRenderTable(_ciAllBookings.filter(b =>
        (b.roomName || '').toLowerCase().includes(q) ||
        (b.roomType || '').toLowerCase().includes(q) ||
        String(b.bookingId).includes(q)
    ));
}

function ciFilterClear() {
    document.getElementById('ci-filter-input').value = '';
    document.getElementById('ci-filter-clear').classList.add('hidden');
    ciRenderTable(_ciAllBookings);
}

// ===== CONFIRM MODAL =====
let _ciPendingBookingId = null;
let _ciPendingBtn       = null;

function ciOpenConfirm(bookingId, roomName, btn) {
    _ciPendingBookingId = bookingId;
    _ciPendingBtn       = btn;
    document.getElementById('ci-modal-room').textContent    = roomName;
    document.getElementById('ci-modal-booking').textContent = '#' + bookingId;
    const empId = localStorage.getItem('userId') || localStorage.getItem('employeeId') || '—';
    document.getElementById('ci-modal-emp').textContent = 'ID: ' + empId;
    document.getElementById('ci-modal-cccd').value = '';
    document.getElementById('ci-modal-overlay').style.display = 'flex';
}

function ciCloseConfirm() {
    document.getElementById('ci-modal-overlay').style.display = 'none';
    _ciPendingBookingId = null;
    _ciPendingBtn       = null;
}

async function ciDoCheckIn() {
    const bookingId  = _ciPendingBookingId;
    const btn        = _ciPendingBtn;
    const employeeId = localStorage.getItem('userId') || localStorage.getItem('employeeId');
    const cccd       = document.getElementById('ci-modal-cccd').value.trim();

    if (!employeeId) {
        showToast('error', 'Chưa đăng nhập', 'Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại!');
        ciCloseConfirm();
        return;
    }
    if (!cccd) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập số CCCD của khách hàng.');
        return;
    }
    if (!/^\d{9}(\d{3})?$/.test(cccd)) {
        showToast('warning', 'CCCD không hợp lệ', 'Số CCCD phải gồm 9 hoặc 12 chữ số.');
        return;
    }

    ciCloseConfirm();

    // Disable nút, đổi trạng thái
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    btn.style.background = 'linear-gradient(135deg,#94a3b8,#64748b)';

    try {
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams({ employeeId, bookingId, cccd });
        const res = await fetch('/api/v1/booking/checkinbooking?' + params.toString(), {
            method: 'POST',
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });

        if (!res.ok) {
            const ct = res.headers.get('content-type') || '';
            let msg = `Lỗi ${res.status}`;
            if (ct.includes('application/json')) { const j = await res.json(); msg = j.message || JSON.stringify(j); }
            else { msg = await res.text() || msg; }
            throw new Error(msg);
        }

        // Thành công
        showToast('success', 'Check In thành công!', `Booking #${bookingId} đã được xác nhận`);
        btn.innerHTML = '<i class="fas fa-check"></i> Đã Check In';
        btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
        btn.style.boxShadow  = '0 2px 8px rgba(22,163,74,0.25)';

        // Xoá hàng khỏi danh sách local & re-render sau 1.5s
        setTimeout(() => {
            _ciAllBookings = _ciAllBookings.filter(b => b.bookingId !== bookingId);
            ciRenderTable(_ciAllBookings);
        }, 1500);

    } catch (err) {
        showToast('error', 'Check In thất bại', err.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-door-open"></i> Check In';
        btn.style.background = 'linear-gradient(135deg,#3b82f6,#6366f1)';
    }
}

// Đóng modal khi click nền
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('ci-modal-overlay');
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) ciCloseConfirm(); });
});