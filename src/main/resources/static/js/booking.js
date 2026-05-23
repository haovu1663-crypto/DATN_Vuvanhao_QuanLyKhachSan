
    // ===== BOOKING ROOM LOGIC =====
    let _bkAllRooms = [];
    let _bkSelectedRoom = null;

    function bkReload() { bkLoadRooms(); }

    async function bkLoadRooms() {
    const grid = document.getElementById('bk-grid');
    const countEl = document.getElementById('bk-count');
    document.getElementById('bk-search-input').value = '';
    document.getElementById('bk-search-clear').classList.add('hidden');
    document.getElementById('bk-price-hint').classList.add('hidden');
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

    function bkOnSearch() {
    const raw = document.getElementById('bk-search-input').value.replace(/\D/g, '').trim();
    const clearBtn  = document.getElementById('bk-search-clear');
    const hintEl    = document.getElementById('bk-price-hint');
    clearBtn.classList.toggle('hidden', !raw);

    if (!raw) {
    hintEl.classList.add('hidden');
    bkRenderGrid(_bkAllRooms);
    return;
}

    const target = Number(raw);
    const DELTA  = 50000;
    const lo = target - DELTA;
    const hi = target + DELTA;

    const filtered = _bkAllRooms.filter(r => {
    const p = Number(r.price || 0);
    return p >= lo && p <= hi;
});

    const fmt = n => new Intl.NumberFormat('vi-VN').format(n);
    hintEl.textContent = fmt(lo) + ' ₫ – ' + fmt(hi) + ' ₫';
    hintEl.classList.remove('hidden');

    bkRenderGrid(filtered);
}

    function bkClearSearch() {
    document.getElementById('bk-search-input').value = '';
    document.getElementById('bk-search-clear').classList.add('hidden');
    document.getElementById('bk-price-hint').classList.add('hidden');
    document.getElementById('bk-price-hint').classList.add('hidden');
    bkRenderGrid(_bkAllRooms);
}

    function bkOpenModal(room) {
    _bkSelectedRoom = room;
    const fmtPrice = n => new Intl.NumberFormat('vi-VN').format(n) + ' ₫/đêm';
    document.getElementById('bk-modal-room-name').textContent = room.name || 'Phòng #' + room.id;
    document.getElementById('bk-modal-room-price').textContent = fmtPrice(room.price || 0);
    document.getElementById('bk-customer-name').value = '';
    document.getElementById('bk-customer-phone').value = '';
    document.getElementById('bk-checkin-date').value = '';
    document.getElementById('bk-checkout-date').value = '';
    document.getElementById('bk-summary').style.display = 'none';
    const btn = document.getElementById('bk-modal-confirm-btn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-calendar-check"></i> Xác nhận đặt phòng';
    document.getElementById('bk-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    // Set min date = today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bk-checkin-date').min = today;
    document.getElementById('bk-checkout-date').min = today;
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
    const checkin    = document.getElementById('bk-checkin-date').value;
    const checkout   = document.getElementById('bk-checkout-date').value;
    const employeeId = localStorage.getItem('userId');

    if (!customerName)  { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập họ tên khách hàng.'); return; }
    if (!customerPhone) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập số điện thoại.'); return; }
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

    function bkDepositOpen(bookingId, roomName, depositAmount, days, roomTotal, fee, total) {
    _bkDepositState.bookingId = bookingId;
    _bkDepositState.roomName  = roomName;
    _bkDepositState.amount    = depositAmount;
    _bkDepositState.method    = null;

    const fmtVnd = n => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(n))) + ' ₫';

    document.getElementById('co-pay-banner-title-txt').textContent  = 'Đặt cọc phòng';
    document.getElementById('co-pay-banner-sub').textContent        = 'Chọn phương thức đặt cọc cho khách';
    document.getElementById('co-pay-amount').textContent            = fmtVnd(depositAmount);
    document.getElementById('co-pay-amount-label-sub').textContent  = `(${fmtVnd(roomTotal)} + phí 5% ${fmtVnd(fee)}) × 30%`;

    document.getElementById('bk-deposit-amount-row').style.display = 'none';
    document.getElementById('co-pay-banner-icon').textContent = '💰';
    window._bkDepositMode = true;

    _coPayShowStep('method');
    document.getElementById('co-payment-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

    function bkDepositClose() {
    window._bkDepositMode = false;
    document.getElementById('bk-deposit-amount-row').style.display = 'none';
    document.getElementById('co-payment-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

    // ===== END BOOKING DEPOSIT LOGIC =====

    document.getElementById('bk-modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) bkModalClose();
});
