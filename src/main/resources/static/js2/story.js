// =====================================================
// story.js  –  Lịch Sử Đặt Phòng
// Đặt tại: /js2/story.js  (load TRƯỚC menu.js)
// =====================================================

const BH_BASE_URL = 'http://localhost:8080'; // ← đổi thành URL thật nếu cần

let _bhCurrentTab = 'checkout';
let _bhCache      = {};

// ----- Lấy customerId từ localStorage -----
function getCustomerId() {
    return localStorage.getItem('userId')
        || localStorage.getItem('customerId')
        || localStorage.getItem('id')
        || null;
}

// ----- Mở modal -----
function openBookingHistory() {
    const backdrop = document.getElementById('bh-backdrop');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Reset state
    _bhCache      = {};
    _bhCurrentTab = 'checkout';

    // Reset tab UI
    document.querySelectorAll('.bh-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.bh-tab-btn[data-tab="checkout"]').classList.add('active');

    // Hiển thị customerId
    const customerId = getCustomerId();
    document.getElementById('bh-customerLabel').textContent = customerId
        ? 'Mã khách hàng: ' + customerId
        : 'Khách hàng';

    _bhFetchTab('checkout');
}

// ----- Đóng modal -----
function closeBookingHistory() {
    document.getElementById('bh-backdrop').classList.remove('show');
    document.body.style.overflow = '';
}

// ----- Click ra ngoài drawer để đóng -----
function handleBHBackdropClick(e) {
    if (e.target === document.getElementById('bh-backdrop')) {
        closeBookingHistory();
    }
}

// ----- Chuyển tab -----
function switchTabBH(tab, btnEl) {
    if (_bhCurrentTab === tab) return;
    _bhCurrentTab = tab;
    document.querySelectorAll('.bh-tab-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    _bhFetchTab(tab);
}

// ----- Map tab → API endpoint -----
const _BH_API = {
    checkout: id => BH_BASE_URL + '/api/v1/booking/storychcekout/' + id,
    checkin:  id => BH_BASE_URL + '/api/v1/booking/storychcekin/'  + id,
    pending:  id => BH_BASE_URL + '/api/v1/booking/storypending/'  + id,
};

// ----- Gọi API & render -----
async function _bhFetchTab(tab) {
    const body = document.getElementById('bh-drawerBody');

    // Dùng cache nếu có
    if (_bhCache[tab]) {
        _bhRenderList(_bhCache[tab], tab, body);
        return;
    }

    const customerId = getCustomerId();
    if (!customerId) {
        _bhRenderError(body, 'Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.');
        return;
    }

    _bhRenderLoading(body);

    try {
        const res = await fetch(_BH_API[tab](customerId), {
            headers: {
                'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || ''),
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        _bhCache[tab] = data;
        _bhRenderList(data, tab, body);
    } catch (err) {
        _bhRenderError(body, 'Không thể tải dữ liệu. (' + err.message + ')');
    }
}

// ----- Render: loading -----
function _bhRenderLoading(body) {
    body.innerHTML =
        '<div class="bh-state-box">' +
        '  <div class="bh-spinner"></div>' +
        '  <div class="bh-state-text">Đang tải dữ liệu...</div>' +
        '</div>';
}

// ----- Render: lỗi -----
function _bhRenderError(body, msg) {
    body.innerHTML =
        '<div class="bh-state-box">' +
        '  <div class="bh-state-icon">⚠</div>' +
        '  <div class="bh-state-text">' + msg + '</div>' +
        '</div>';
}

// ----- Meta theo tab -----
const _BH_TAB_META = {
    checkout: { label: 'Đã Trả Phòng', badgeClass: 'bh-badge-checkout', emptyIcon: '🏨', emptyText: 'Chưa có lịch sử trả phòng' },
    checkin:  { label: 'Đang Ở',       badgeClass: 'bh-badge-checkin',  emptyIcon: '🛎',  emptyText: 'Không có phòng đang ở' },
    pending:  { label: 'Chờ Xác Nhận', badgeClass: 'bh-badge-pending',  emptyIcon: '📋', emptyText: 'Không có đặt phòng đang chờ' },
};

// ----- Render: danh sách -----
function _bhRenderList(data, tab, body) {
    if (!data || data.length === 0) {
        const m = _BH_TAB_META[tab];
        body.innerHTML =
            '<div class="bh-state-box">' +
            '  <div class="bh-state-icon">' + m.emptyIcon + '</div>' +
            '  <div class="bh-state-text">' + m.emptyText + '</div>' +
            '</div>';
        return;
    }

    const { badgeClass, label } = _BH_TAB_META[tab];
    const cards = data.map((item, i) => _bhBuildCard(item, i, badgeClass, label, tab)).join('');
    body.innerHTML = '<div class="bh-booking-list">' + cards + '</div>';
}

// ----- Format ngày -----
function _bhFormatDate(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    if (isNaN(d)) return dt;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ----- Format giá -----
function _bhFormatPrice(price) {
    if (price == null || price === 0) return null;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// ----- Build HTML card -----
function _bhBuildCard(item, i, badgeClass, statusLabel, tab) {
    const price = _bhFormatPrice(item.price);
    const delay = (i * 0.06).toFixed(2);

    const extraDates =
        (item.enventCheckInTime
            ? '<div class="bh-date-item"><span class="bh-date-label">Dự kiến nhận</span><span class="bh-date-value">' + _bhFormatDate(item.enventCheckInTime) + '</span></div>'
            : '') +
        (item.enventCheckOutTime
            ? '<div class="bh-date-item"><span class="bh-date-label">Dự kiến trả</span><span class="bh-date-value">' + _bhFormatDate(item.enventCheckOutTime) + '</span></div>'
            : '');

    const cancelBtn = tab === 'pending'
        ? '<button class="bh-btn-cancel" onclick="bhCancelBooking(' + item.bookingId + ', this)">🚫 Hủy booking</button>'
        : '';

    return (
        '<div class="bh-booking-card" style="animation-delay:' + delay + 's">' +
        '  <div class="bh-card-index">' + String(i + 1).padStart(2, '0') + '</div>' +
        '  <div class="bh-card-info">' +
        '    <div class="bh-card-room">'     + (item.roomName    || 'Phòng không xác định') + '</div>' +
        '    <div class="bh-card-customer">👤 ' + (item.cutomerName || '—') + '</div>' +
        '    <div class="bh-card-dates">' +
        '      <div class="bh-date-item"><span class="bh-date-label">Nhận phòng</span><span class="bh-date-value">' + _bhFormatDate(item.checkInDate)  + '</span></div>' +
        '      <div class="bh-date-item"><span class="bh-date-label">Trả phòng</span><span class="bh-date-value">'  + _bhFormatDate(item.checkOutDate) + '</span></div>' +
        extraDates +
        '    </div>' +
        '  </div>' +
        '  <div class="bh-card-right">' +
        '    <span class="bh-status-badge ' + badgeClass + '">' + statusLabel + '</span>' +
        '    <div class="bh-card-price' + (price ? '' : ' bh-no-price') + '">' + (price || 'Chưa thanh toán') + '</div>' +
        '    <div class="bh-booking-id">#' + item.bookingId + '</div>' +
        cancelBtn +
        '  </div>' +
        '</div>'
    );
}

// ----- Hủy booking — flow xác thực OTP -----
// State OTP hủy phòng
let _cancelOtp      = null;   // OTP server trả về
let _cancelBookingId = null;  // bookingId đang chờ hủy
let _cancelBtnEl    = null;   // nút bấm gốc để restore nếu cần

async function bhCancelBooking(bookingId, btnEl) {
    // Bước 0: xác nhận sơ bộ
    const confirm = await Swal.fire({
        title: 'Hủy đặt phòng #' + bookingId + '?',
        text: 'Hệ thống sẽ gửi mã OTP về email để xác thực. Tiếp tục?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Tiếp tục',
        cancelButtonText: 'Thôi',
    });
    if (!confirm.isConfirmed) return;

    _cancelBookingId = bookingId;
    _cancelBtnEl     = btnEl;

    // Lấy email từ localStorage (đã lưu lúc đăng nhập)
    const email = localStorage.getItem('email');
    if (!email) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không tìm thấy email. Vui lòng đăng nhập lại.', confirmButtonColor: '#1a2744' });
        return;
    }

    // Bước 1: Gửi OTP
    btnEl.disabled    = true;
    btnEl.textContent = '⏳ Đang gửi OTP...';

    try {
        const params = new URLSearchParams();
        params.append('email', email);

        const res = await fetch(BH_BASE_URL + '/api/email/mk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        if (!res.ok) throw new Error(await res.text() || 'Không gửi được OTP.');
        _cancelOtp = String(await res.json());
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Gửi OTP thất bại', text: e.message, confirmButtonColor: '#1a2744' });
        btnEl.disabled = false;
        btnEl.innerHTML = '🚫 Hủy booking';
        return;
    }

    btnEl.disabled = false;
    btnEl.innerHTML = '🚫 Hủy booking';

    // Bước 2: Hiển thị SweetAlert nhập OTP
    _bhShowOtpPrompt(email);
}

// ----- Hiển thị hộp nhập OTP -----
function _bhShowOtpPrompt(email) {
    Swal.fire({
        title: '🔐 Xác thực OTP',
        html:
            '<p style="color:#6b7280;font-size:14px;margin-bottom:16px">Mã 4 số đã gửi tới <b>' + email + '</b></p>' +
            '<div style="display:flex;gap:10px;justify-content:center;margin-bottom:12px">' +
            '  <input id="bh-otp-0" maxlength="1" inputmode="numeric" style="width:48px;height:52px;text-align:center;font-size:22px;font-weight:700;border:2px solid #d1d5db;border-radius:10px;outline:none" oninput="_bhOtpInput(0)" onkeydown="_bhOtpKey(event,0)">' +
            '  <input id="bh-otp-1" maxlength="1" inputmode="numeric" style="width:48px;height:52px;text-align:center;font-size:22px;font-weight:700;border:2px solid #d1d5db;border-radius:10px;outline:none" oninput="_bhOtpInput(1)" onkeydown="_bhOtpKey(event,1)">' +
            '  <input id="bh-otp-2" maxlength="1" inputmode="numeric" style="width:48px;height:52px;text-align:center;font-size:22px;font-weight:700;border:2px solid #d1d5db;border-radius:10px;outline:none" oninput="_bhOtpInput(2)" onkeydown="_bhOtpKey(event,2)">' +
            '  <input id="bh-otp-3" maxlength="1" inputmode="numeric" style="width:48px;height:52px;text-align:center;font-size:22px;font-weight:700;border:2px solid #d1d5db;border-radius:10px;outline:none" oninput="_bhOtpInput(3)" onkeydown="_bhOtpKey(event,3)">' +
            '</div>' +
            '<div id="bh-otp-msg" style="font-size:13px;min-height:18px;margin-bottom:8px"></div>' +
            '<button onclick="_bhResendOtp(\'' + email + '\')" style="background:none;border:none;color:#1a2744;font-size:13px;cursor:pointer;text-decoration:underline">📨 Gửi lại mã</button>',
        showConfirmButton: true,
        confirmButtonText: 'Xác nhận hủy',
        confirmButtonColor: '#dc2626',
        showCancelButton: true,
        cancelButtonText: 'Hủy bỏ',
        cancelButtonColor: '#6b7280',
        focusConfirm: false,
        didOpen: () => {
            setTimeout(() => {
                const first = document.getElementById('bh-otp-0');
                if (first) first.focus();
            }, 100);
        },
        preConfirm: () => {
            const digits = [0,1,2,3].map(i => {
                const el = document.getElementById('bh-otp-' + i);
                return el ? el.value : '';
            }).join('');

            const msgEl = document.getElementById('bh-otp-msg');

            if (digits.length < 4) {
                if (msgEl) { msgEl.style.color = '#dc2626'; msgEl.textContent = 'Vui lòng nhập đủ 4 chữ số.'; }
                return false;
            }
            if (digits !== _cancelOtp) {
                if (msgEl) { msgEl.style.color = '#dc2626'; msgEl.textContent = '❌ Mã OTP không đúng. Kiểm tra lại hoặc gửi mã mới.'; }
                // Rung các ô
                [0,1,2,3].forEach(i => {
                    const el = document.getElementById('bh-otp-' + i);
                    if (el) { el.style.borderColor = '#ef4444'; setTimeout(() => el.style.borderColor = '#d1d5db', 1500); }
                });
                return false;
            }
            return true;
        }
    }).then(result => {
        if (!result.isConfirmed) return;
        _bhDoCancel();
    });
}

// ----- OTP input helpers (dùng trong SweetAlert HTML) -----
function _bhOtpInput(idx) {
    const el = document.getElementById('bh-otp-' + idx);
    if (!el) return;
    el.value = el.value.replace(/\D/g, '').slice(0, 1);
    if (el.value && idx < 3) {
        const next = document.getElementById('bh-otp-' + (idx + 1));
        if (next) next.focus();
    }
}

function _bhOtpKey(e, idx) {
    if (e.key === 'Backspace') {
        const el = document.getElementById('bh-otp-' + idx);
        if (el && !el.value && idx > 0) {
            const prev = document.getElementById('bh-otp-' + (idx - 1));
            if (prev) { prev.value = ''; prev.focus(); }
        }
    }
}

async function _bhResendOtp(email) {
    const msgEl = document.getElementById('bh-otp-msg');
    if (msgEl) { msgEl.style.color = '#6b7280'; msgEl.textContent = '⏳ Đang gửi lại...'; }

    try {
        const params = new URLSearchParams();
        params.append('email', email);
        const res = await fetch(BH_BASE_URL + '/api/email/mk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
        if (!res.ok) throw new Error(await res.text());
        _cancelOtp = String(await res.json());
        if (msgEl) { msgEl.style.color = '#16a34a'; msgEl.textContent = '✅ Đã gửi lại mã OTP mới!'; }
    } catch (e) {
        if (msgEl) { msgEl.style.color = '#dc2626'; msgEl.textContent = 'Gửi lại thất bại: ' + e.message; }
    }
}

// ----- Thực sự gọi API hủy -----
async function _bhDoCancel() {
    if (_cancelBtnEl) { _cancelBtnEl.disabled = true; _cancelBtnEl.textContent = '⏳ Đang hủy...'; }

    try {
        const res = await fetch(BH_BASE_URL + '/api/v1/booking/cancelbooking?bookingId=' + _cancelBookingId, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('accessToken') || '') }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        await Swal.fire({
            icon: 'success',
            title: 'Đã hủy thành công',
            text: 'Booking #' + _cancelBookingId + ' đã được hủy.',
            confirmButtonColor: '#1a2744',
            timer: 2000,
            timerProgressBar: true,
        });

        delete _bhCache['pending'];
        document.querySelector('.bh-tab-btn[data-tab="pending"]').click();
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Thất bại', text: 'Không thể hủy booking. (' + e.message + ')', confirmButtonColor: '#1a2744' });
        if (_cancelBtnEl) { _cancelBtnEl.disabled = false; _cancelBtnEl.innerHTML = '🚫 Hủy booking'; }
    } finally {
        _cancelOtp       = null;
        _cancelBookingId = null;
        _cancelBtnEl     = null;
    }
}

// =====================================================
// Ghi đè menuAction để xử lý case 'lich-su'
// (story.js load trước menu.js nên dùng pattern này)
// =====================================================
document.addEventListener('DOMContentLoaded', function () {
    // Lưu lại hàm menuAction gốc từ menu.js (nếu có)
    const _originalMenuAction = (typeof menuAction === 'function') ? menuAction : null;

    window.menuAction = function (action) {
        if (action === 'lich-su') {
            closeAll(); // đóng dropdown

            // Kiểm tra đăng nhập
            const token = localStorage.getItem('accessToken');
            if (!token) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Cần đăng nhập',
                    text: 'Vui lòng đăng nhập để xem lịch sử đặt phòng.',
                    confirmButtonText: 'Đăng nhập',
                    confirmButtonColor: '#1a2744',
                    showCancelButton: true,
                    cancelButtonText: 'Hủy'
                }).then(r => { if (r.isConfirmed) showLogin(); });
                return;
            }

            openBookingHistory();
            return;
        }

        // Các action khác → gọi lại hàm gốc từ menu.js
        if (_originalMenuAction) {
            _originalMenuAction(action);
        }
    };
});