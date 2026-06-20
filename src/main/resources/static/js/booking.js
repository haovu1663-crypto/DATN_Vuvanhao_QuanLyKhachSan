// ===== BOOKING ROOM LOGIC =====
let _bkAllRooms = [];
let _bkSelectedRoom = null;
let _bkGuests = { adults: 1, children: 0 };
let _bkDepositState = { bookingId: null, roomName: '', amount: 0, method: null };
window._bkDepositState = _bkDepositState; // expose để checkout.js reset method khi goBack

function bkReload() { bkLoadRooms(); }

async function bkLoadRooms() {
    const grid = document.getElementById('bk-grid');
    const countEl = document.getElementById('bk-count');
    grid.innerHTML = '<div class="rs-loading"><i class="fas fa-spinner fa-spin"></i>Đang tải danh sách phòng...</div>';
    countEl.textContent = '';
    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch('/api/v1/rooms/status', {
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        _bkAllRooms = Array.isArray(json) ? json : (json.data || []);
        bkRenderGrid(_bkAllRooms);
    } catch (err) {
        grid.innerHTML = '<div class="rs-empty" style="color:#ef4444;">⚠️ Lỗi tải phòng: ' + err.message + '</div>';
    }
}

function bkRenderGrid(rooms) {
    const grid = document.getElementById('bk-grid');
    const countEl = document.getElementById('bk-count');
    if (!rooms.length) {
        grid.innerHTML = '<div class="rs-empty">📭 Không có phòng nào khả dụng.</div>';
        countEl.textContent = '0 phòng';
        return;
    }
    countEl.textContent = rooms.length + ' phòng';
    grid.innerHTML = rooms.map(r => bkRenderCard(r)).join('');
}

function bkRenderCard(r) {
    const fmtPrice = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫/đêm';
    const imgHtml = (r.images && r.images.length > 0)
        ? `<img class="bk-card-img" src="${r.images[0]}" alt="${r.name||''}" loading="lazy">`
        : `<div class="bk-card-img-ph">🏨</div>`;
    const roomType = r.roomType?.type || r.type || '';
    return `
        <div class="bk-card">
            ${imgHtml}
            <div class="bk-card-body">
                <div class="bk-card-name" title="${r.name||''}">${r.name || 'Phòng #' + r.id}</div>
                ${roomType ? `<div class="bk-card-type"><i class="fas fa-tag" style="font-size:10px;"></i> ${roomType}</div>` : ''}
                <div class="bk-card-price">${fmtPrice(r.price || 0)}</div>
                <span class="bk-badge-available"><i class="fas fa-circle" style="font-size:7px;"></i> Available</span>
                <button class="bk-btn-booking" onclick="bkOpenModal(${JSON.stringify(r).replace(/"/g, '&quot;')})">
                    <i class="fas fa-calendar-plus"></i> Booking
                </button>
            </div>
        </div>`;
}

// ===== SEARCH BAR LOGIC =====
function bkToggleDrop(name) {
    ['checkin', 'checkout', 'guests'].forEach(n => {
        const drop = document.getElementById('bk-drop-' + n);
        const sf   = document.getElementById('bk-sf-'   + n);
        if (!drop || !sf) return;
        if (n === name) {
            const isOpen = drop.classList.contains('bk-drop-open');
            drop.classList.toggle('bk-drop-open', !isOpen);
            sf.classList.toggle('bk-sf-active', !isOpen);
        } else {
            drop.classList.remove('bk-drop-open');
            sf.classList.remove('bk-sf-active');
        }
    });
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('#bkSearchBar')) {
        document.querySelectorAll('.bk-drop').forEach(d => d.classList.remove('bk-drop-open'));
        document.querySelectorAll('.bk-sf').forEach(s => s.classList.remove('bk-sf-active'));
    }
});

function bkDateChange() {
    const ci = document.getElementById('bk-input-checkin')?.value;
    const co = document.getElementById('bk-input-checkout')?.value;
    const fmt = d => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Chọn ngày';

    const ciVal = document.getElementById('bk-val-checkin');
    const coVal = document.getElementById('bk-val-checkout');
    if (ciVal) ciVal.textContent = fmt(ci);
    if (coVal) coVal.textContent = fmt(co);

    // Set min: checkout phải sau checkin
    const today = new Date().toISOString().split('T')[0];
    const ciInput = document.getElementById('bk-input-checkin');
    const coInput = document.getElementById('bk-input-checkout');
    if (ciInput) ciInput.min = today;
    if (coInput) coInput.min = ci || today;

    const hint = document.getElementById('bk-date-hint');
    if (hint) {
        if (ci && co && ci < co) {
            const nights = Math.max(1, Math.round((new Date(co) - new Date(ci)) / 86400000));
            hint.innerHTML = `<i class="fas fa-calendar-alt" style="color:#3b82f6"></i> ${fmt(ci)} &nbsp;→&nbsp; ${fmt(co)} &nbsp;&nbsp;|&nbsp;&nbsp; <i class="fas fa-moon" style="color:#6366f1"></i> ${nights} đêm`;
            hint.style.display = 'flex';
            // Tự đóng dropdown sau khi chọn đủ 2
            document.getElementById('bk-drop-checkin')?.classList.remove('bk-drop-open');
            document.getElementById('bk-sf-checkin')?.classList.remove('bk-sf-active');
            document.getElementById('bk-drop-checkout')?.classList.remove('bk-drop-open');
            document.getElementById('bk-sf-checkout')?.classList.remove('bk-sf-active');
        } else {
            hint.style.display = 'none';
        }
    }
}

function bkChangeGuest(type, delta) {
    if (type === 'adults')   _bkGuests.adults   = Math.max(1, _bkGuests.adults   + delta);
    if (type === 'children') _bkGuests.children = Math.max(0, _bkGuests.children + delta);
    const adultEl = document.getElementById('bk-adult-val');
    const childEl = document.getElementById('bk-child-val');
    if (adultEl) adultEl.textContent = _bkGuests.adults;
    if (childEl) childEl.textContent = _bkGuests.children;
    const adultMinus = document.getElementById('bk-adult-minus');
    const childMinus = document.getElementById('bk-child-minus');
    if (adultMinus) adultMinus.disabled = (_bkGuests.adults   <= 1);
    if (childMinus) childMinus.disabled = (_bkGuests.children <= 0);
    _bkUpdateGuestLabel();
}

function _bkUpdateGuestLabel() {
    const total = _bkGuests.adults + _bkGuests.children;
    const el = document.getElementById('bk-val-guests');
    if (el) el.textContent = total + ' khách';
}

function bkResetGuests() {
    _bkGuests = { adults: 1, children: 0 };
    const adultEl = document.getElementById('bk-adult-val');
    const childEl = document.getElementById('bk-child-val');
    if (adultEl) adultEl.textContent = 1;
    if (childEl) childEl.textContent = 0;
    const adultMinus = document.getElementById('bk-adult-minus');
    const childMinus = document.getElementById('bk-child-minus');
    if (adultMinus) adultMinus.disabled = true;
    if (childMinus) childMinus.disabled = true;
    _bkUpdateGuestLabel();
}

function bkApplyGuests() {
    _bkUpdateGuestLabel();
    document.getElementById('bk-drop-guests')?.classList.remove('bk-drop-open');
    document.getElementById('bk-sf-guests')?.classList.remove('bk-sf-active');
}

function bkDoSearch() {
    const ci       = document.getElementById('bk-input-checkin')?.value;
    const co       = document.getElementById('bk-input-checkout')?.value;
    const capacity = (_bkGuests.adults + _bkGuests.children) || 1;

    if (!ci || !co) {
        showToast('warning', 'Thiếu ngày', 'Vui lòng chọn ngày nhận và trả phòng.');
        return;
    }
    if (ci >= co) {
        showToast('warning', 'Ngày không hợp lệ', 'Ngày trả phòng phải sau ngày nhận phòng.');
        return;
    }

    // Lấy workBranch từ localStorage
    let workBranch = '';
    try {
        const raw = localStorage.getItem('workBranch');
        if (raw) {
            const parsed = JSON.parse(raw);
            workBranch = typeof parsed === 'string'
                ? parsed
                : (parsed.name || parsed.branchName || parsed.branch || '');
        }
    } catch (e) {
        workBranch = localStorage.getItem('workBranch') || '';
    }

    if (!workBranch) {
        showToast('warning', 'Chưa chọn chi nhánh', 'Không tìm thấy chi nhánh làm việc. Vui lòng đăng nhập lại.');
        return;
    }

    bkSearchRoomTypes(workBranch, capacity, ci, co);
}

async function bkSearchRoomTypes(workBranch, capacity, checkin, checkout) {
    const grid    = document.getElementById('bkrt-grid');
    const countEl = document.getElementById('bkrt-count');
    if (!grid) return;

    grid.innerHTML = '<div class="bkrt-loading"><i class="fas fa-spinner fa-spin"></i><span>Đang tìm kiếm...</span></div>';
    if (countEl) countEl.textContent = '';

    const url = '/api/v1/roomtypes/frindroomoff'
        + '?workBranch=' + encodeURIComponent(workBranch)
        + '&capacity='   + capacity
        + '&checkin='    + checkin
        + '&checkout='   + checkout;

    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(url, {
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        _bkrtAll = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        _bkrtFilter = null;
        bkrtBuildChips();
        bkrtRender();

        // Cập nhật tiêu đề kết quả
        const fmt = d => d.split('-').reverse().join('/');
        if (countEl) countEl.textContent = _bkrtAll.length + ' loại phòng';

        // Scroll xuống khu vực kết quả
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (!_bkrtAll.length) {
            showToast('info', 'Không có phòng', `Không tìm thấy loại phòng phù hợp tại "${workBranch}".`);
        } else {
            showToast('success', 'Tìm kiếm thành công', `Tìm thấy ${_bkrtAll.length} loại phòng tại "${workBranch}".`);
        }
    } catch (err) {
        grid.innerHTML = '<div class="bkrt-error"><i class="fas fa-exclamation-triangle"></i><span>Lỗi tìm kiếm: ' + err.message + '</span></div>';
        showToast('error', 'Lỗi tìm kiếm', err.message);
    }
}

// Init search bar: min dates + mặc định checkin = hôm nay
(function() {
    const today = new Date().toISOString().split('T')[0];
    const ci = document.getElementById('bk-input-checkin');
    const co = document.getElementById('bk-input-checkout');
    if (ci) {
        ci.min   = today;
        ci.value = today;          // mặc định ngày nhận phòng = hôm nay
    }
    if (co) co.min = today;
    bkDateChange();                // cập nhật nhãn hiển thị ngay
})();

function bkOpenModal(room) {
    _bkSelectedRoom = room;
    const fmtPrice = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫/đêm';
    document.getElementById('bk-modal-room-name').textContent = room.name || 'Phòng #' + room.id;
    document.getElementById('bk-modal-room-price').textContent = fmtPrice(room.price || 0);
    document.getElementById('bk-customer-name').value = '';
    document.getElementById('bk-customer-phone').value = '';
    document.getElementById('bk-customer-cccd').value = '';

    // Tự động điền ngày từ thanh tìm kiếm
    const today = new Date().toISOString().split('T')[0];
    const ciFromBar = document.getElementById('bk-input-checkin')?.value || today;
    const coFromBar = document.getElementById('bk-input-checkout')?.value || '';

    const ciInput = document.getElementById('bk-checkin-date');
    const coInput = document.getElementById('bk-checkout-date');
    if (ciInput) { ciInput.min = today; ciInput.value = ciFromBar; }
    if (coInput) { coInput.min = ciFromBar || today; coInput.value = coFromBar; }

    // Hiển thị ngày lên modal (các ô NHẬN PHÒNG / TRẢ PHÒNG / SỐ ĐÊM)
    const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
    const dispCI = document.getElementById('bk-modal-display-checkin');
    const dispCO = document.getElementById('bk-modal-display-checkout');
    const dispNights = document.getElementById('bk-modal-display-nights');
    if (dispCI) dispCI.textContent = fmtDate(ciFromBar);
    if (dispCO) dispCO.textContent = fmtDate(coFromBar);
    if (dispNights) {
        if (ciFromBar && coFromBar && ciFromBar < coFromBar) {
            const nights = Math.max(1, Math.round((new Date(coFromBar) - new Date(ciFromBar)) / 86400000));
            dispNights.textContent = nights + ' đêm';
        } else {
            dispNights.textContent = '—';
        }
    }

    // Cập nhật summary ngay nếu đã có đủ ngày
    bkUpdateSummary();

    const btn = document.getElementById('bk-modal-confirm-btn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-calendar-check"></i> Xác nhận đặt phòng';
    document.getElementById('bk-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function bkUpdateSummary() {
    const checkin  = document.getElementById('bk-checkin-date').value;
    const checkout = document.getElementById('bk-checkout-date').value;
    const summary  = document.getElementById('bk-summary');
    if (!checkin || !checkout || checkin >= checkout || !_bkSelectedRoom) {
        summary.style.display = 'none';
        return;
    }
    const nights    = Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / 86400000));
    const roomTotal = nights * (_bkSelectedRoom.price || 0);
    const fee       = Math.round(roomTotal * 0.05);
    const total     = roomTotal + fee;
    const deposit   = Math.round(total * 0.30);
    const remain    = total - deposit;
    const fmt = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
    document.getElementById('bk-sum-desc').textContent    = `${_bkSelectedRoom.name || 'Phòng'} × ${nights} đêm`;
    document.getElementById('bk-sum-room').textContent    = fmt(roomTotal);
    document.getElementById('bk-sum-fee').textContent     = fmt(fee);
    document.getElementById('bk-sum-total').textContent   = fmt(total);
    document.getElementById('bk-sum-deposit').textContent = fmt(deposit);
    document.getElementById('bk-sum-remain').textContent  = fmt(remain);
    summary.style.display = 'block';
}

function bkModalClose() {
    document.getElementById('bk-modal-overlay').classList.remove('active');
    document.body.style.overflow = '';
    _bkSelectedRoom = null;
}

async function bkSubmitBooking() {
    if (!_bkSelectedRoom) return;
    const customerName  = document.getElementById('bk-customer-name').value.trim();
    const customerPhone = document.getElementById('bk-customer-phone').value.trim();
    const customerCccd  = document.getElementById('bk-customer-cccd').value.trim();
    const checkin    = document.getElementById('bk-checkin-date').value;
    const checkout   = document.getElementById('bk-checkout-date').value;
    const employeeId = localStorage.getItem('userId');

    if (!customerName)  { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập họ tên khách hàng.'); return; }
    if (!customerPhone) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập số điện thoại.'); return; }
    if (!customerCccd)  { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập số CCCD.'); return; }
    if (!/^\d{9}(\d{3})?$/.test(customerCccd)) { showToast('warning', 'CCCD không hợp lệ', 'Số CCCD phải gồm 9 hoặc 12 chữ số.'); return; }
    if (!checkin)    { showToast('warning', 'Thiếu thông tin', 'Vui lòng chọn ngày nhận phòng.'); return; }
    if (!checkout)   { showToast('warning', 'Thiếu thông tin', 'Vui lòng chọn ngày trả phòng.'); return; }
    if (checkin >= checkout) { showToast('warning', 'Ngày không hợp lệ', 'Ngày trả phòng phải sau ngày nhận phòng.'); return; }
    if (!employeeId) { showToast('error', 'Chưa đăng nhập', 'Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại!'); return; }

    const btn = document.getElementById('bk-modal-confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams();
    params.append('name', customerName);
    params.append('phonenumber', customerPhone);
    params.append('cccd', customerCccd);
    params.append('roomId', String(_bkSelectedRoom.id));
    params.append('enventCheckinDate', checkin);
    params.append('enventCheckoutDate', checkout);
    params.append('employeeId', String(employeeId));

    try {
        const res = await fetch('/api/v1/booking/bookingoffline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...(token ? { Authorization: 'Bearer ' + token } : {})
            },
            body: params
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(errText || 'Lỗi ' + res.status);
        }
        const resData = await res.json().catch(() => null);
        // ✅ Parse bookingId đúng cách - thử nhiều dạng response wrapper
        const bookingId = resData?.id
            ?? resData?.data?.id
            ?? resData?.bookingId
            ?? null;

        // ✅ Tính tiền cọc TRƯỚC khi gọi bkModalClose() (sẽ set _bkSelectedRoom = null)
        const msPerDay  = 86400000;
        const days      = Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / msPerDay));
        const roomTotal = (_bkSelectedRoom?.price || 0) * days;
        const fee       = Math.round(roomTotal * 0.05);
        const total     = roomTotal + fee;
        const deposit   = Math.round(total * 0.30);

        // ✅ Lưu tên phòng trước khi close modal (bkModalClose set _bkSelectedRoom = null)
        const selectedRoomName = _bkSelectedRoom?.name || 'Phòng #' + _bkSelectedRoom?.id;
        const selectedRoomRef  = { ..._bkSelectedRoom }; // shallow copy để dùng an toàn

        // ✅ Đóng modal SAU khi đã lưu hết thông tin cần thiết
        bkModalClose();
        showToast('success', '🎉 Đặt phòng thành công!', `Phòng ${selectedRoomName} đã được đặt.`);
        bkLoadRooms();

        // ✅ Dùng biến đã lưu, không dùng _bkSelectedRoom nữa
        bkDepositOpen(bookingId, selectedRoomName, deposit, days, roomTotal, fee, total);
    } catch (err) {
        showToast('error', 'Đặt phòng thất bại', err.message || 'Có lỗi xảy ra.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-calendar-check"></i> Xác nhận đặt phòng';
    }
}

// ===== BOOKING DEPOSIT MODAL LOGIC =====

// Hiển thị đúng step trong modal payment dùng chung với checkout
function _coPayShowStep(step) {
    const stepMethod = document.getElementById('co-pay-step-method');
    const stepBank   = document.getElementById('co-pay-step-bank');
    const stepCash   = document.getElementById('co-pay-step-cash');
    if (stepMethod) stepMethod.style.display = step === 'method' ? '' : 'none';
    if (stepBank)   stepBank.style.display   = step === 'bank'   ? '' : 'none';
    if (stepCash)   stepCash.style.display   = step === 'cash'   ? '' : 'none';
}

function bkDepositOpen(bookingId, roomName, depositAmount, days, roomTotal, fee, total) {
    _bkDepositState.bookingId = bookingId;
    _bkDepositState.roomName  = roomName;
    _bkDepositState.amount    = depositAmount;
    _bkDepositState.method    = null;

    const fmtVnd = n => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(n))) + ' ₫';
    const fmtAmt = fmtVnd(depositAmount);

    // Cập nhật banner
    const bannerIcon  = document.getElementById('co-pay-banner-icon');
    const bannerTitle = document.getElementById('co-pay-banner-title-txt');
    const bannerSub   = document.getElementById('co-pay-banner-sub');
    if (bannerIcon)  bannerIcon.textContent  = '💰';
    if (bannerTitle) bannerTitle.textContent = 'Đặt cọc phòng';
    if (bannerSub)   bannerSub.textContent   = 'Chọn phương thức đặt cọc cho khách';

    // Số tiền & sub-label
    const amountEl    = document.getElementById('co-pay-amount');
    const amountSubEl = document.getElementById('co-pay-amount-label-sub');
    const amountCopyEl = document.getElementById('co-pay-amount-copy');
    const cashAmountEl = document.getElementById('co-cash-amount-display');
    if (amountEl)     amountEl.textContent     = fmtAmt;
    if (amountSubEl)  amountSubEl.textContent  = `(${fmtVnd(roomTotal)} + phí 5% ${fmtVnd(fee)}) × 30%`;
    if (amountCopyEl) amountCopyEl.textContent = fmtAmt;
    if (cashAmountEl) cashAmountEl.textContent = fmtAmt;

    // Nội dung chuyển khoản & QR
    const contentEl = document.getElementById('co-pay-content');
    if (contentEl) contentEl.textContent = 'DEPOSIT ' + (bookingId || '');
    const qrImg = document.getElementById('co-pay-qr-img');
    if (qrImg && depositAmount) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEPOSIT${bookingId}-${Math.round(depositAmount)}&bgcolor=ffffff`;
    }

    // Ẩn ô nhập tay (không cần nhập khi đã tính tự động)
    const depositRow = document.getElementById('bk-deposit-amount-row');
    if (depositRow) depositRow.style.display = 'none';

    // Đánh dấu đang ở chế độ deposit (để override coPayConfirm / coPayCashConfirm)
    window._bkDepositMode = true;

    // Reset về bước chọn phương thức & mở overlay
    _coPayShowStep('method');
    const overlay = document.getElementById('co-payment-overlay');
    if (overlay) {
        overlay.classList.add('active');
        overlay.style.display = 'flex';
    }
    document.body.style.overflow = 'hidden';
}

function bkDepositClose() {
    window._bkDepositMode = false;
    // Xóa method đã chọn trong checkout để tránh state thừa khi mở lại
    if (typeof _coSelectedMethod !== 'undefined') window._coSelectedMethodReset && window._coSelectedMethodReset();
    const overlay = document.getElementById('co-payment-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
    }
    document.body.style.overflow = '';
}

// Gọi API /deposit/employee với method đã chọn
async function _bkCallDeposit(confirmBtnId) {
    if (!_bkDepositState.bookingId) {
        showToast('error', 'Lỗi', 'Không tìm thấy booking. Vui lòng thử lại!');
        return;
    }
    if (!_bkDepositState.method) {
        showToast('error', 'Chưa chọn phương thức', 'Vui lòng chọn phương thức thanh toán!');
        return;
    }

    const confirmBtn = document.getElementById(confirmBtnId);
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    }

    try {
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams({
            booking_id:     Number(_bkDepositState.bookingId),
            amount:         Math.round(_bkDepositState.amount),
            method_booking: _bkDepositState.method
        });

        const res = await fetch('/api/v1/payment/deposit/employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                ...(token ? { Authorization: 'Bearer ' + token } : {})
            },
            body: params.toString()
        });

        if (!res.ok) {
            const ct = res.headers.get('content-type') || '';
            let msg = `Lỗi ${res.status}`;
            if (ct.includes('application/json')) { const j = await res.json(); msg = j.message || JSON.stringify(j); }
            else { msg = await res.text() || msg; }
            throw new Error(msg);
        }

        // Reset nút về trạng thái ban đầu trước khi đóng modal
        const successBtn = document.getElementById(confirmBtnId);
        if (successBtn) {
            successBtn.disabled = false;
            successBtn.innerHTML = confirmBtnId === 'co-pay-confirm-btn'
                ? '<i class="fas fa-check-circle"></i> Tôi đã chuyển khoản'
                : '<i class="fas fa-check-circle"></i> Xác nhận đã thu tiền';
        }

        // Thành công
        bkDepositClose();
        showToast('success', '💰 Đặt cọc thành công!',
            `Booking #${_bkDepositState.bookingId} — ${_bkDepositState.roomName} đã đặt cọc.`);

        // Reset state in-place để window._bkDepositState luôn trỏ đúng object
        _bkDepositState.bookingId = null;
        _bkDepositState.roomName  = '';
        _bkDepositState.amount    = 0;
        _bkDepositState.method    = null;

    } catch (err) {
        showToast('error', 'Đặt cọc thất bại', err.message);
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = confirmBtnId === 'co-pay-confirm-btn'
                ? '<i class="fas fa-check-circle"></i> Tôi đã chuyển khoản'
                : '<i class="fas fa-check-circle"></i> Xác nhận đã thu tiền';
        }
    }
}

// ===== PATCH: Route coPaySelectMethod / coPayConfirm / coPayCashConfirm =====
// booking.js load SAU checkout.js nên KHÔNG capture tĩnh window.xxx lúc parse
// (lúc đó các hàm checkout chưa gán vào window).
// Thay vào đó: gọi theo tên hàm gốc tại runtime bên trong if/else.

window.coPaySelectMethod = function(method) {
    if (window._bkDepositMode) {
        // ---- Deposit mode: lưu method & cập nhật UI ----
        _bkDepositState.method = method;
        const stepMethod = document.getElementById('co-pay-step-method');
        const stepBank   = document.getElementById('co-pay-step-bank');
        const stepCash   = document.getElementById('co-pay-step-cash');
        if (stepMethod) stepMethod.style.display = 'none';
        if (method === 'BANK_TRANSFER') {
            if (stepBank) stepBank.style.display = '';
        } else {
            const cashIcon    = document.getElementById('co-cash-icon');
            const cashLabel   = document.getElementById('co-cash-method-label');
            const cashMethodV = document.getElementById('co-cash-method-val');
            if (method === 'CASH') {
                if (cashIcon)    cashIcon.textContent    = '💵';
                if (cashLabel)   cashLabel.textContent   = 'Thanh toán tiền mặt';
                if (cashMethodV) cashMethodV.textContent = '💵 Tiền mặt';
            } else {
                if (cashIcon)    cashIcon.textContent    = '💳';
                if (cashLabel)   cashLabel.textContent   = 'Thanh toán thẻ tín dụng / ATM';
                if (cashMethodV) cashMethodV.textContent = '💳 Thẻ tín dụng / ATM';
            }
            if (stepCash) stepCash.style.display = '';
        }
    } else {
        // ---- Checkout mode: gọi hàm gốc của checkout.js theo tên ----
        coPaySelectMethod_co(method);
    }
};

window.coPayConfirm = function() {
    if (window._bkDepositMode) {
        _bkDepositState.method = _bkDepositState.method || 'BANK_TRANSFER';
        _bkCallDeposit('co-pay-confirm-btn');
    } else {
        coPayConfirm_co();
    }
};

window.coPayCashConfirm = function() {
    if (window._bkDepositMode) {
        _bkCallDeposit('co-pay-cash-confirm-btn');
    } else {
        coPayCashConfirm_co();
    }
};

// ===== END BOOKING DEPOSIT LOGIC =====

document.getElementById('bk-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) bkModalClose();
});
// ===== ROOM PICKER MODAL =====
let _bkPickerRoomType = null;
let _bkPickerCheckin  = '';
let _bkPickerCheckout = '';

async function bkrtSelectType(rt) {
    const ci = document.getElementById('bk-input-checkin')?.value;
    const co = document.getElementById('bk-input-checkout')?.value;

    if (!ci || !co) {
        showToast('warning', 'Chưa chọn ngày', 'Vui lòng chọn ngày nhận và trả phòng trước.');
        document.getElementById('bkSearchBar')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    if (ci >= co) {
        showToast('warning', 'Ngày không hợp lệ', 'Ngày trả phòng phải sau ngày nhận phòng.');
        return;
    }

    let workBranch = '';
    try {
        const raw = localStorage.getItem('workBranch');
        if (raw) {
            const parsed = JSON.parse(raw);
            workBranch = typeof parsed === 'string'
                ? parsed
                : (parsed.name || parsed.branchName || parsed.branch || '');
        }
    } catch (e) {
        workBranch = localStorage.getItem('workBranch') || '';
    }
    if (!workBranch) {
        showToast('warning', 'Chưa có chi nhánh', 'Không tìm thấy chi nhánh làm việc.');
        return;
    }

    _bkPickerRoomType = rt;
    _bkPickerCheckin  = ci;
    _bkPickerCheckout = co;

    const capacity = (_bkGuests.adults + _bkGuests.children) || 1;
    const fmt = d => d.split('-').reverse().join('/');

    const overlay  = document.getElementById('bk-room-picker-overlay');
    const list     = document.getElementById('bk-room-picker-list');
    const subtitle = document.getElementById('bk-room-picker-subtitle');
    const title    = document.getElementById('bk-room-picker-title');

    title.textContent    = rt.type || ('Loại phòng #' + rt.id);
    subtitle.textContent = `${fmt(ci)} → ${fmt(co)}  ·  ${capacity} khách  ·  ${workBranch}`;
    list.innerHTML = '<div style="text-align:center;padding:28px 0;color:#94a3b8;font-size:13px;"><i class="fas fa-spinner fa-spin" style="font-size:20px;display:block;margin-bottom:8px;color:#2563eb;"></i>Đang tải danh sách phòng...</div>';

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const url = '/api/v1/rooms/findroombookingoff'
        + '?workBranch=' + encodeURIComponent(workBranch)
        + '&roomTypeId=' + rt.id
        + '&capacity='   + capacity
        + '&checkIn='    + ci
        + '&checkOut='   + co;

    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(url, {
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        const rooms = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        bkRenderPickerList(rooms, rt);
    } catch (err) {
        list.innerHTML = `<div style="text-align:center;padding:28px 0;color:#ef4444;font-size:13px;"><i class="fas fa-exclamation-triangle" style="display:block;font-size:24px;margin-bottom:8px;"></i>Lỗi tải phòng: ${err.message}</div>`;
    }
}

function bkRenderPickerList(rooms, rt) {
    const list = document.getElementById('bk-room-picker-list');
    const fmtPrice = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫/đêm';
    if (!rooms.length) {
        list.innerHTML = '<div style="text-align:center;padding:36px 0;color:#94a3b8;font-size:13px;"><i class="fas fa-door-open" style="display:block;font-size:28px;margin-bottom:10px;color:#cbd5e1;"></i>Không có phòng trống trong khoảng thời gian đã chọn.</div>';
        return;
    }
    list.innerHTML = rooms.map(room => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;
                    padding:14px 16px;border-radius:14px;border:1.5px solid #e8edf5;background:#fff;
                    transition:border-color .15s,box-shadow .15s;"
             onmouseover="this.style.borderColor='#2563eb';this.style.boxShadow='0 4px 16px rgba(37,99,235,0.1)'"
             onmouseout="this.style.borderColor='#e8edf5';this.style.boxShadow='none'">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
                <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#eff6ff,#dbeafe);
                            display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-bed" style="color:#2563eb;font-size:17px;"></i>
                </div>
                <div style="min-width:0;">
                    <div style="font-size:14px;font-weight:700;color:#1e293b;">${room.name || 'Phòng #' + room.id}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                        <i class="fas fa-tag" style="font-size:9px;"></i> ${rt.type || '—'}
                        &nbsp;·&nbsp;
                        <i class="fas fa-users" style="font-size:9px;"></i> Tối đa ${rt.capacity || '?'} người
                    </div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                <div style="text-align:right;">
                    <div style="font-size:10px;color:#94a3b8;">Giá/đêm</div>
                    <div style="font-size:13px;font-weight:700;color:#1e293b;">${fmtPrice(rt.price || 0)}</div>
                </div>
                <button onclick="bkPickRoom(${room.id}, '${(room.name||'Phòng #'+room.id).replace(/'/g,"\\'")}', ${rt.price || 0})"
                        style="padding:8px 16px;border-radius:10px;border:none;
                               background:linear-gradient(135deg,#2563eb,#1d4ed8);
                               color:#fff;font-size:12px;font-weight:700;cursor:pointer;
                               white-space:nowrap;"
                        onmouseover="this.style.opacity='.85'"
                        onmouseout="this.style.opacity='1'">
                    <i class="fas fa-calendar-plus"></i> Chọn
                </button>
            </div>
        </div>`).join('');
}

function bkPickRoom(roomId, roomName, roomPrice) {
    bkHidePicker();
    bkOpenModal({ id: roomId, name: roomName, price: roomPrice });
}

function bkHidePicker() {
    const overlay = document.getElementById('bk-room-picker-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}