// ===== BOOKING MODAL STATE =====
const bkState = {
    roomId: null, roomName: '', roomType: '', pricePerNight: 0,
    checkIn: null, checkOut: null,
    adults: 1, children: 0,
    calOffset: 0, selecting: 'start'
};

// ===== ROOM PICKER — hiện danh sách phòng cụ thể trước khi vào booking =====
function openBooking(rt) {
    const checkIn  = window._searchCheckIn;
    const checkOut = window._searchCheckOut;
    // Ưu tiên lấy workBranch từ thẻ RoomType (rt.workBranch có khi dùng api /frindroomhn)
    // Fallback về thanh tìm kiếm nếu không có (khi dùng api /frindroom thông thường)
    const workBranch = (rt.workBranch && rt.workBranch.trim())
        ? rt.workBranch.trim()
        : document.getElementById('destVal').textContent.trim();

    if (!checkIn || !checkOut || !window._searchMode) {
        Swal.fire({ icon: 'warning', title: 'Chưa tìm kiếm', text: 'Vui lòng nhập điểm đến và ngày trên thanh tìm kiếm trước!', confirmButtonColor: '#1a2744' });
        return;
    }

    // Gán subtitle
    const fmt = d => d.split('-').reverse().join('/');
    document.getElementById('room-picker-subtitle').textContent =
        workBranch + ' · ' + fmt(checkIn) + ' → ' + fmt(checkOut) + ' · ' + rt.type;

    // Render loading
    const listEl = document.getElementById('room-picker-list');
    listEl.innerHTML = '<div style="text-align:center;color:#aaa;padding:20px;font-size:13px;">Đang tải danh sách phòng...</div>';

    // Hiện modal picker
    const overlay = document.getElementById('modal-room-picker-overlay');
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Gọi API lấy phòng cụ thể
    const capacity = (window._searchCapacity) || 1;
    const url = '/api/v1/rooms/findroom'
        + '?workBranch=' + encodeURIComponent(workBranch)
        + '&roomTypeId=' + rt.id
        + '&capacity='   + capacity
        + '&checkIn='    + checkIn
        + '&checkOut='   + checkOut;

    fetch(url)
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then(apiResp => {
            const rooms = Array.isArray(apiResp.data) ? apiResp.data : [];
            if (!rooms.length) {
                listEl.innerHTML = '<div style="text-align:center;color:#aaa;padding:20px;font-size:13px;">😔 Không còn phòng trống trong khoảng thời gian này.</div>';
                return;
            }
            // Lưu data vào biến tạm để tránh lỗi escape string trong onclick
            window._pickerRooms = rooms;
            window._pickerRt    = rt;
            listEl.innerHTML = rooms.map((r, idx) =>
                '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;transition:all .15s;" ' +
                'onmouseover="this.style.borderColor=\'#1a2744\';this.style.background=\'#f0f4ff\'" ' +
                'onmouseout="this.style.borderColor=\'#e2e8f0\';this.style.background=\'#fff\'">' +
                '<div style="font-weight:600;color:#1a2744;font-size:14px;">🛏️ ' + (r.name || 'Phòng ' + r.id) + '</div>' +
                '<button onclick="selectRoom(' + idx + ')" style="font-size:12px;font-weight:700;padding:6px 16px;border-radius:8px;border:none;background:#1a2744;color:#fff;cursor:pointer;">Chọn</button>' +
                '</div>'
            ).join('');
        })
        .catch(err => {
            listEl.innerHTML = '<div style="text-align:center;color:#dc2626;padding:20px;font-size:13px;">⚠️ ' + (err.message||'Lỗi tải phòng') + '</div>';
        });
}

function hideRoomPicker() {
    document.getElementById('modal-room-picker-overlay').style.display = 'none';
    document.body.style.overflow = '';
}

function selectRoom(idx) {
    const r  = window._pickerRooms[idx];
    const rt = window._pickerRt;
    hideRoomPicker();
    showBooking(r.id, r.name || ('Phòng ' + r.id), rt.type, rt.price);
}

const BK_MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const BK_DAYS   = ['CN','T2','T3','T4','T5','T6','T7'];

function showBooking(roomId, roomName, roomType, pricePerNight) {
    bkState.roomId = roomId;
    bkState.roomName = roomName;
    bkState.roomType = roomType;
    bkState.pricePerNight = pricePerNight;
    // Lấy ngày từ search bar (đã được gán bởi selectRoom)
    bkState.checkIn  = window._searchCheckIn  ? new Date(window._searchCheckIn)  : null;
    bkState.checkOut = window._searchCheckOut ? new Date(window._searchCheckOut) : null;
    bkState.adults = 1; bkState.children = 0;
    bkState.calOffset = 0; bkState.selecting = 'start';

    document.getElementById('bk-room-name').textContent = roomName;
    document.getElementById('bk-room-type').textContent = roomType + ' · ' + new Intl.NumberFormat('vi-VN').format(pricePerNight) + ' ₫/đêm';
    bkResetUI();
    bkRenderCal();
    document.body.style.overflow = 'hidden';
    document.getElementById('modal-booking-overlay').classList.add('show');
}

function hideBooking() {
    document.getElementById('modal-booking-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

function handleBookingOverlayClick(e) {
    if (e.target === document.getElementById('modal-booking-overlay')) hideBooking();
}

function bkResetUI() {
    // Hiển thị ngày từ thanh tìm kiếm
    const fmt = d => d ? new Date(d).toLocaleDateString('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric'}) : '—';
    document.getElementById('bk-val-checkin').textContent  = fmt(window._searchCheckIn);
    document.getElementById('bk-val-checkout').textContent = fmt(window._searchCheckOut);
    // Tính số đêm
    if (window._searchCheckIn && window._searchCheckOut) {
        const nights = Math.round((new Date(window._searchCheckOut) - new Date(window._searchCheckIn)) / 86400000);
        document.getElementById('bk-nights-badge').textContent = nights + ' đêm';
        // Tính summary luôn vì ngày đã có sẵn
        bkUpdateSummary(nights);
    } else {
        document.getElementById('bk-summary').style.display = 'none';
    }
    var roomInput = document.getElementById('bk-room-list');
    if (roomInput) roomInput.value = '';
    document.getElementById('bk-notes').value = '';
    // Tự động điền email từ localStorage nếu đã đăng nhập
    const _savedEmail = localStorage.getItem('email') || '';
    document.getElementById('bk-email').value = _savedEmail;
    document.getElementById('bk-email').classList.remove('error');
    bkUpdateBtn();
}

function bkToggleCal() {
    const el = document.getElementById('bk-cal-popup');
    if (el) el.classList.toggle('open');
}

function bkNavMonth(dir) {
    bkState.calOffset += dir;
    bkRenderCal();
}

function bkRenderCal() {
    const container = document.getElementById('bk-cal-months');
    if (!container) return; // calendar đã bị xóa khỏi HTML
    const now = new Date(); now.setHours(0,0,0,0);
    container.innerHTML = '';
    for (let m = 0; m < 2; m++) {
        const base = new Date(now.getFullYear(), now.getMonth() + bkState.calOffset + m, 1);
        const year = base.getFullYear(), month = base.getMonth();
        const firstDow = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let html = `<div>
        <div class="bk-cal-title" style="text-align:center;margin-bottom:10px;">${BK_MONTHS[month]} ${year}</div>
        <div class="bk-cal-grid">`;
        BK_DAYS.forEach(d => { html += `<div class="bk-dow">${d}</div>`; });
        for (let i = 0; i < firstDow; i++) html += `<div class="bk-day bk-empty"></div>`;
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const isPast = date < now;
            const ts = date.getTime();
            const isToday = date.getTime() === now.getTime();
            const isStart = bkState.checkIn  && ts === bkState.checkIn.getTime();
            const isEnd   = bkState.checkOut && ts === bkState.checkOut.getTime();
            const inRange = bkState.checkIn && bkState.checkOut && ts > bkState.checkIn.getTime() && ts < bkState.checkOut.getTime();
            const isRangeS = inRange && new Date(ts - 86400000).getTime() <= bkState.checkIn.getTime();
            const isRangeE = inRange && new Date(ts + 86400000).getTime() >= bkState.checkOut.getTime();
            let cls = 'bk-day';
            if (isPast)    cls += ' bk-disabled';
            if (isToday)   cls += ' bk-today';
            if (isStart)   cls += ' bk-start';
            if (isEnd)     cls += ' bk-end';
            if (inRange)   cls += ' bk-in-range';
            if (isRangeS)  cls += ' bk-range-s';
            if (isRangeE)  cls += ' bk-range-e';
            const clickable = !isPast ? `onclick="bkSelectDate(${year},${month},${d})"` : '';
            html += `<div class="${cls}" ${clickable}>${d}</div>`;
        }
        html += `</div></div>`;
        container.innerHTML += html;
    }
}

function bkSelectDate(y, m, d) {
    const date = new Date(y, m, d);
    if (bkState.selecting === 'start' || (bkState.checkIn && date <= bkState.checkIn)) {
        bkState.checkIn  = date;
        bkState.checkOut = null;
        bkState.selecting = 'end';
    } else {
        bkState.checkOut = date;
        bkState.selecting = 'start';
        document.getElementById('bk-cal-popup').classList.remove('open');
    }
    bkUpdateDates();
    bkRenderCal();
}

function bkShortcut(nights) {
    const today = new Date(); today.setHours(0,0,0,0);
    bkState.checkIn  = new Date(today);
    bkState.checkOut = new Date(today.getTime() + nights * 86400000);
    bkState.selecting = 'start';
    document.getElementById('bk-cal-popup').classList.remove('open');
    bkUpdateDates();
    bkRenderCal();
}

function bkClearDates() {
    bkState.checkIn = null; bkState.checkOut = null; bkState.selecting = 'start';
    bkUpdateDates(); bkRenderCal();
}

function bkUpdateDates() {
    const fmt = d => d ? d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : null;
    const ciEl = document.getElementById('bk-val-checkin');
    const coEl = document.getElementById('bk-val-checkout');
    if (bkState.checkIn)  { ciEl.textContent = fmt(bkState.checkIn);  ciEl.className = 'bk-date-val'; }
    else                  { ciEl.textContent = 'Chọn ngày';           ciEl.className = 'bk-date-val empty'; }
    if (bkState.checkOut) { coEl.textContent = fmt(bkState.checkOut); coEl.className = 'bk-date-val'; }
    else                  { coEl.textContent = 'Chọn ngày';           coEl.className = 'bk-date-val empty'; }

    const badge = document.getElementById('bk-nights-badge');
    if (bkState.checkIn && bkState.checkOut) {
        const nights = Math.round((bkState.checkOut - bkState.checkIn) / 86400000);
        badge.textContent = `🌙 ${nights} đêm`;
        badge.classList.add('show');
        bkUpdateSummary(nights);
    } else {
        badge.classList.remove('show');
        document.getElementById('bk-summary').style.display = 'none';
    }
    bkUpdateBtn();
}

function bkUpdateSummary(nights) {
    const roomTotal = nights * bkState.pricePerNight;
    const fee       = Math.round(roomTotal * 0.05);
    const total     = roomTotal + fee;
    const deposit   = Math.round(total * 0.30);
    const remain    = total - deposit;
    const fmt = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
    document.getElementById('bk-sum-desc').textContent    = `${bkState.roomName} × ${nights} đêm`;
    document.getElementById('bk-sum-room').textContent    = fmt(roomTotal);
    document.getElementById('bk-sum-fee').textContent     = fmt(fee);
    document.getElementById('bk-sum-total').textContent   = fmt(total);
    document.getElementById('bk-sum-deposit').textContent = fmt(deposit);
    document.getElementById('bk-sum-remain').textContent  = fmt(remain);
    document.getElementById('bk-summary').style.display   = 'block';
}

function bkChangeGuest(type, delta) {
    if (type === 'adults') {
        bkState.adults = Math.max(1, bkState.adults + delta);
        document.getElementById('bk-adults-val').textContent = bkState.adults;
        document.getElementById('bk-adults-minus').disabled = bkState.adults <= 1;
    } else {
        bkState.children = Math.max(0, bkState.children + delta);
        document.getElementById('bk-children-val').textContent = bkState.children;
        document.getElementById('bk-children-minus').disabled = bkState.children <= 0;
    }
}

function bkUpdateBtn() {
    const btn   = document.getElementById('btn-submit-booking');
    const ready = !!(bkState.checkIn && bkState.checkOut);
    btn.disabled = !ready;
    btn.textContent = '✅ Xác nhận đặt phòng';
}

// Hàm format Date sang chuỗi YYYY-MM-DD để gửi lên Backend
function formatDateToAPI(dateObj) {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    let month = '' + (d.getMonth() + 1);
    let day   = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2)   day   = '0' + day;
    return [year, month, day].join('-');
}

// ===== STATE lưu kết quả sau khi booking thành công =====
let _bookingResult = { bookingId: null, depositAmount: 0 };

// ===== GỌI API ĐẶT PHÒNG (bản đầy đủ có thanh toán) =====
function submitBooking() {
    // Ưu tiên lấy ngày từ search bar nếu bkState chưa có
    if (!bkState.checkIn && window._searchCheckIn)   bkState.checkIn  = new Date(window._searchCheckIn);
    if (!bkState.checkOut && window._searchCheckOut) bkState.checkOut = new Date(window._searchCheckOut);
    if (!bkState.checkIn || !bkState.checkOut) {
        Swal.fire({ icon: 'warning', title: 'Chưa chọn ngày', text: 'Vui lòng tìm kiếm và chọn ngày trước!', confirmButtonColor: '#1a2744' });
        return;
    }
    const email = document.getElementById('bk-email').value.trim();
    if (!email) {
        Swal.fire({ icon: 'warning', title: 'Thiếu Email', text: 'Vui lòng nhập email xác nhận đặt phòng!', confirmButtonColor: '#1a2744' });
        return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
        Swal.fire({ icon: 'warning', title: 'Chưa đăng nhập', text: 'Vui lòng đăng nhập để đặt phòng.', confirmButtonColor: '#1a2744' })
            .then(() => { hideBooking(); showLogin(); });
        return;
    }
    if (!isTokenValid()) {
        Swal.fire({ icon: 'warning', title: 'Phiên đăng nhập hết hạn', text: 'Vui lòng đăng nhập lại.', confirmButtonColor: '#1a2744' })
            .then(() => { hideBooking(); showLogin(); });
        return;
    }

    // Tính tiền cọc từ summary đang hiển thị
    const depositEl  = document.getElementById('bk-sum-deposit');
    const depositRaw = depositEl ? depositEl.textContent.replace(/[^0-9]/g, '') : '0';
    _bookingResult.depositAmount = parseInt(depositRaw) || 0;

    Swal.showLoading();

    // Lấy tên phòng từ input text (nếu người dùng đã nhập)
    const roomInput = document.getElementById('bk-room-list');
    if (roomInput && roomInput.value.trim()) bkState.roomName = roomInput.value.trim();

    const params = new URLSearchParams();
    params.append('roomId',             bkState.roomId);
    params.append('customerId',         localStorage.getItem('userId'));
    params.append('enventCheckinDate',  formatDateToAPI(bkState.checkIn));
    params.append('enventCheckoutDate', formatDateToAPI(bkState.checkOut));
    params.append('adults',             bkState.adults);
    params.append('children',           bkState.children);
    params.append('email',              email);
    params.append('notes',              document.getElementById('bk-notes').value.trim());

    fetch('/api/v1/booking/bookingonline', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + token
        },
        body: params
    })
        .then(async response => {
            if (response.status === 401) {
                Swal.fire({ icon: 'warning', title: 'Phiên đăng nhập hết hạn', text: 'Vui lòng đăng nhập lại.', confirmButtonColor: '#1a2744' })
                    .then(() => { hideBooking(); showLogin(); });
                return null;
            }
            if (!response.ok) throw new Error(await response.text());
            return response.json();
        })
        .then(data => {
            if (!data) return;
            // Lưu bookingId trả về từ backend
            _bookingResult.bookingId = data.data?.id || data.id || data.data || null;

            // Đổ dữ liệu vào modal thanh toán
            const fmtVnd = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
            document.getElementById('pay-amount').textContent = fmtVnd(_bookingResult.depositAmount);
            const randomCode = Math.floor(10000 + Math.random() * 90000);
            document.getElementById('pay-content').textContent = 'STAYVIET ' + randomCode;

            // Chuyển sang modal thanh toán
            Swal.close();
            hideBooking();
            showPaymentModal();
        })
        .catch(err => {
            Swal.fire({ icon: 'error', title: 'Đặt phòng thất bại', text: err.message, confirmButtonColor: '#dc2626' });
        });
}

// ===== MODAL THANH TOÁN =====
function showPaymentModal() {
    document.getElementById('modal-payment-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hidePaymentModal() {
    document.getElementById('modal-payment-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

function handlePaymentOverlayClick(e) {
    if (e.target === document.getElementById('modal-payment-overlay')) {
        hidePaymentModal();
    }
}

// Tiện ích: Copy đoạn text
function copyText(elementId) {
    const textToCopy = document.getElementById(elementId).innerText.replace(/₫/g, '').trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Đã sao chép: ' + textToCopy,
            showConfirmButton: false,
            timer: 1500
        });
    });
}

// Xử lý khi khách hàng ấn "Tôi đã chuyển khoản"
function confirmPaymentPaid() {
    if (!_bookingResult.bookingId) {
        Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.', confirmButtonColor: '#dc2626' });
        return;
    }

    Swal.fire({
        title: 'Đang xác nhận thanh toán...',
        text: 'Vui lòng không đóng cửa sổ này',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();

            const params = new URLSearchParams();
            params.append('booking_id', _bookingResult.bookingId);
            params.append('amount',     _bookingResult.depositAmount);

            const token = localStorage.getItem('accessToken');

            fetch('/api/v1/payment/deposit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': token ? 'Bearer ' + token : ''
                },
                body: params
            })
                .then(async response => {
                    if (!response.ok) throw new Error(await response.text());
                    return response.text();
                })
                .then(msg => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Thanh toán thành công! 🎉',
                        html: '<b>' + (msg || 'Thanh toán tiền cọc thành công') + '</b><br><span style="font-size:13px;color:#666;">Thông tin chi tiết đã được gửi qua Email của bạn.</span>',
                        confirmButtonColor: '#1a2744',
                        confirmButtonText: 'Hoàn tất'
                    }).then(() => {
                        hidePaymentModal();
                        _bookingResult = { bookingId: null, depositAmount: 0 };
                        loadRooms(); // Load lại danh sách phòng
                    });
                })
                .catch(err => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Thanh toán thất bại',
                        text: err.message || 'Có lỗi xảy ra, vui lòng liên hệ nhân viên hỗ trợ.',
                        confirmButtonColor: '#dc2626'
                    });
                });
        }
    });
}