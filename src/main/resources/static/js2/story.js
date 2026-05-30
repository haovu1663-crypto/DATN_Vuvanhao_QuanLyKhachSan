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
    const cards = data.map((item, i) => _bhBuildCard(item, i, badgeClass, label)).join('');
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
function _bhBuildCard(item, i, badgeClass, statusLabel) {
    const price = _bhFormatPrice(item.price);
    const delay = (i * 0.06).toFixed(2);

    const extraDates =
        (item.enventCheckInTime
            ? '<div class="bh-date-item"><span class="bh-date-label">Dự kiến nhận</span><span class="bh-date-value">' + _bhFormatDate(item.enventCheckInTime) + '</span></div>'
            : '') +
        (item.enventCheckOutTime
            ? '<div class="bh-date-item"><span class="bh-date-label">Dự kiến trả</span><span class="bh-date-value">' + _bhFormatDate(item.enventCheckOutTime) + '</span></div>'
            : '');

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
        '  </div>' +
        '</div>'
    );
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