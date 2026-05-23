
    // ===== CHECK OUT LOGIC (MỚI) =====
    let _coAllRooms = [];

    function coReload() { coClearSearch(); coLoadRooms(); }

    async function coLoadRooms() {
    const grid = document.getElementById('co-grid');
    const countEl = document.getElementById('co-count');
    grid.innerHTML = '<div class="rs-loading"><i class="fas fa-spinner fa-spin"></i>Đang tải...</div>';
    countEl.textContent = '';
    try {
    const token = localStorage.getItem('accessToken');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    // API lấy danh sách phòng đã check in chờ check out
    const res = await fetch('/api/v1/rooms/status/checkin', {
    signal: controller.signal,
    headers: token ? { Authorization: 'Bearer ' + token } : {}
});
    clearTimeout(timeout);
    if (!res.ok) { const errText = await res.text(); throw new Error(`HTTP ${res.status} - ${errText}`); }
    const json = await res.json();
    _coAllRooms = Array.isArray(json) ? json : (json.data || []);
    coRenderGrid(_coAllRooms);
} catch (err) {
    const msg = err.name === 'AbortError' ? 'Request timeout — server không phản hồi sau 8 giây' : err.message;
    document.getElementById('co-grid').innerHTML = `<div class="rs-empty" style="color:#ef4444;">⚠️ Lỗi: ${msg}</div>`;
}
}

    function coRenderGrid(rooms) {
    const grid = document.getElementById('co-grid');
    const countEl = document.getElementById('co-count');
    if (!rooms.length) {
    const keyword = document.getElementById('co-search-input').value.trim();
    grid.innerHTML = keyword ? `<div class="rs-empty">🔍 Không tìm thấy phòng nào với gmail <b>${keyword}</b>.</div>` : '<div class="rs-empty">📭 Không có phòng nào chờ Check Out.</div>';
    countEl.textContent = ''; return;
}
    countEl.textContent = rooms.length + ' phòng';
    grid.innerHTML = rooms.map(r => coRenderCard(r)).join('');
}

    function coOnSearchInput() {
    const val = document.getElementById('co-search-input').value.trim();
    document.getElementById('co-search-clear').classList.toggle('hidden', !val);
}

    async function coSearch() {
    const input = document.getElementById('co-search-input');
    const email = input.value.trim();
    const hint = document.getElementById('co-search-hint');
    const hintTxt = document.getElementById('co-search-hint-text');
    const grid = document.getElementById('co-grid');
    const countEl = document.getElementById('co-count');
    if (!email) { coClearSearch(); return; }
    grid.innerHTML = '<div class="rs-loading"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';
    countEl.textContent = '';
    try {
    const token = localStorage.getItem('accessToken');
    // API tìm phòng theo email khách đã check in chờ check out
    const res = await fetch('/api/v1/rooms/customer/checkedin/' + encodeURIComponent(email), {
    headers: token ? { 'Authorization': 'Bearer ' + token } : {}
});
    if (res.status === 404) { coRenderGrid([]); hint.classList.remove('hidden'); hintTxt.textContent = `Không tìm thấy phòng nào cho "${email}"`; return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const rooms = Array.isArray(json) ? json : (json.data || []);
    hint.classList.remove('hidden');
    hintTxt.textContent = `Kết quả cho "${email}" — ${rooms.length} phòng`;
    coRenderGrid(rooms);
} catch (err) {
    grid.innerHTML = `<div class="rs-empty" style="color:#ef4444;">⚠️ Lỗi: ${err.message}</div>`;
    countEl.textContent = '';
}
}

    function coClearSearch() {
    document.getElementById('co-search-input').value = '';
    document.getElementById('co-search-clear').classList.add('hidden');
    document.getElementById('co-search-hint').classList.add('hidden');
    coRenderGrid(_coAllRooms);
}

    function coRenderCard(r) {
    const imgHtml = (r.images && r.images.length > 0) ? `<img class="rs-card-img" src="${r.images[0]}" alt="${r.name || ''}" loading="lazy">` : `<div class="rs-card-img-ph">🏨</div>`;
    const price = r.price ? new Intl.NumberFormat('vi-VN').format(r.price) + ' ₫' : '—';
    const email = r.guestEmail || r.email || r.customerEmail || '';
    const emailHtml = email ? `<div style="font-size:11px;color:#64748b;margin-bottom:7px;display:flex;align-items:center;gap:5px;overflow:hidden;"><i class="fab fa-google" style="color:#ea4335;flex-shrink:0;"></i><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${email}">${email}</span></div>` : '';
    return `<div class="rs-card">${imgHtml}<div class="rs-card-body">
            <div class="rs-card-name">${r.name || 'Phòng #' + r.id}</div>
            <div class="rs-card-price">${price} / đêm</div>
            ${emailHtml}
            <span class="rs-badge checked-in">✅ Đang ở</span>
            <button class="rs-btn-save" style="background:linear-gradient(135deg,#d97706,#b45309);" onclick="coCheckOut(${r.id}, this)">
                <i class="fas fa-door-closed"></i> Check Out
            </button>
        </div></div>`;
}

    async function coCheckOut(roomId, btn) {
    const email = document.getElementById('co-search-input').value.trim();
    const employeeId = localStorage.getItem('userId');
    const token = localStorage.getItem('accessToken');
    if (!email) {
    showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập email khách hàng vào ô tìm kiếm trước khi Check Out!');
    document.getElementById('co-search-input').focus();
    return;
}
    if (!employeeId) {
    showToast('error', 'Chưa đăng nhập', 'Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại!');
    return;
}
    coConfirmOpen(roomId, email, employeeId, async () => {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    try {
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('roomId', roomId);
    const res = await fetch(`/api/v1/booking/checkout/${employeeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) },
    body: params
});

    // Doc body MOT LAN DUY NHAT — response stream chi doc duoc 1 lan
    const contentType = res.headers.get('content-type') || '';
    let checkoutData = { id: null, price: 0 };
    if (contentType.includes('application/json')) {
    const rawBody = await res.json();
    if (!res.ok) {
    throw new Error(rawBody.message || rawBody.data?.message || JSON.stringify(rawBody));
}
    // CheckOutRespone: { id: Long, Price: Double }
    // Lombok @Getter tren field "Price" co the serialize thanh "price" hoac "Price"
    // -> xu ly ca 2 truong hop
    const payload = rawBody.data ?? rawBody;
    checkoutData = {
    id:    payload.id    ?? null,
    price: payload.price ?? payload.Price ?? 0
};
} else {
    const rawText = await res.text();
    if (!res.ok) throw new Error(rawText || `Loi ${res.status}`);
}

    btn.innerHTML = '<i class="fas fa-check"></i> Da Check Out!';
    btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
    showToast('success', 'Check Out thanh cong!', `Phong #${roomId} — ${email}`);

    // Hien thi modal thanh toan voi du lieu tu CheckOutRespone
    coPayOpen(checkoutData, roomId);

    setTimeout(() => {
    btn.closest('.rs-card').remove();
    const remaining = document.querySelectorAll('#co-grid .rs-card').length;
    const countEl = document.getElementById('co-count');
    if (countEl) countEl.textContent = remaining + ' phong';
    if (remaining === 0) document.getElementById('co-grid').innerHTML = '<div class="rs-empty">Khong con phong nao can Check Out.</div>';
}, 1500);
} catch (err) {
    showToast('error', 'Check Out that bai', err.message);
    btn.innerHTML = '<i class="fas fa-door-closed"></i> Check Out';
    btn.style.background = 'linear-gradient(135deg,#d97706,#b45309)';
    btn.disabled = false;
}
});
}

    // ===== CHECKOUT PAYMENT MODAL LOGIC =====
    let _coPayState     = { bookingId: null, amount: 0, method: null };
    let _bkDepositState = { bookingId: null, roomName: '', amount: 0, method: null };
    window._bkDepositMode = false;

    function coPayOpen(checkoutData, roomId) {
    console.log('[coPayOpen] checkoutData raw =', JSON.stringify(checkoutData));
    window._bkDepositMode = false;

    _coPayState.bookingId = checkoutData.id ?? null;
    const rawAmount = checkoutData.price ?? checkoutData.Price ?? checkoutData['Price'] ?? 0;
    _coPayState.amount = rawAmount;
    _coPayState.method = null;

    console.log('[coPayOpen] bookingId =', _coPayState.bookingId, '| amount =', _coPayState.amount);

    const fmtVnd = n => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(n))) + ' ₫';
    const amountStr = fmtVnd(rawAmount);

    // Reset banner về checkout
    document.getElementById('co-pay-banner-icon').textContent = '💳';
    document.getElementById('co-pay-banner-title-txt').textContent = 'Thanh toán Check Out';
    document.getElementById('co-pay-amount-label-sub').textContent = 'Sau khi trừ tiền cọc';
    // Ẩn ô nhập cọc
    document.getElementById('bk-deposit-amount-row').style.display = 'none';

    // Điền số tiền vào bước 1 (chọn phương thức)
    document.getElementById('co-pay-amount').textContent = amountStr;

    // Reset về bước 1
    _coPayShowStep('method');

    // Hiện overlay
    document.getElementById('co-payment-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

    function _coPayShowStep(step) {
    document.getElementById('co-pay-step-method').style.display = step === 'method' ? 'block' : 'none';
    document.getElementById('co-pay-step-bank').style.display   = step === 'bank'   ? 'block' : 'none';
    document.getElementById('co-pay-step-cash').style.display   = step === 'cash'   ? 'block' : 'none';

    // Chỉ cập nhật banner-sub khi KHÔNG ở chế độ deposit (deposit tự set banner-sub riêng)
    if (!window._bkDepositMode) {
    const sub = document.getElementById('co-pay-banner-sub');
    if (step === 'method') sub.textContent = 'Chọn phương thức thanh toán phù hợp';
    else if (step === 'bank') sub.textContent = 'Thanh toán qua chuyển khoản ngân hàng';
    else sub.textContent = 'Xác nhận thu tiền tại quầy lễ tân';
}
}

    function coPaySelectMethod(method) {
    const isDeposit = window._bkDepositMode;
    const state     = isDeposit ? _bkDepositState : _coPayState;
    state.method    = method;

    const fmtVnd   = n => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(n))) + ' ₫';
    const amount   = state.amount;
    const amountStr = fmtVnd(amount);
    const prefix   = isDeposit ? 'DC' : 'CO';

    if (method === 'BANK_TRANSFER') {
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const content = `STAYVIET ${prefix}${randomCode}`;
    document.getElementById('co-pay-amount-copy').textContent = amountStr;
    document.getElementById('co-pay-content').textContent = content;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VIETQR+STK+1234567890+VCB+${Math.round(Math.max(0,amount))}+${content}&bgcolor=ffffff`;
    document.getElementById('co-pay-qr-img').src = qrUrl;
    const confirmBtn = document.getElementById('co-pay-confirm-btn');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = isDeposit
    ? '<i class="fas fa-check-circle"></i> Đã nhận cọc qua chuyển khoản'
    : '<i class="fas fa-check-circle"></i> Tôi đã chuyển khoản';
    _coPayShowStep('bank');
} else {
    const isCash = method === 'CASH';
    document.getElementById('co-cash-icon').textContent         = isCash ? '💵' : '💳';
    document.getElementById('co-cash-method-label').textContent = isDeposit
    ? (isCash ? 'Thu tiền cọc tiền mặt' : 'Thu tiền cọc qua thẻ (POS)')
    : (isCash ? 'Thanh toán tiền mặt'   : 'Thanh toán thẻ (POS)');
    document.getElementById('co-cash-method-val').textContent   = isCash ? '💵 Tiền mặt' : '💳 Thẻ tín dụng / ATM';
    document.getElementById('co-cash-amount-display').textContent = amountStr;
    const cashBtn = document.getElementById('co-pay-cash-confirm-btn');
    cashBtn.disabled = false;
    cashBtn.innerHTML = isDeposit
    ? '<i class="fas fa-check-circle"></i> Xác nhận đã thu tiền cọc'
    : '<i class="fas fa-check-circle"></i> Xác nhận đã thu tiền';
    _coPayShowStep('cash');
}
}

    function coPayGoBack() {
    _coPayShowStep('method');
    _coPayState.method = null;
}

    function coPayClose() {
    if (window._bkDepositMode) {
    bkDepositClose();
    return;
}
    document.getElementById('co-payment-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

    function coPayCopy(elementId) {
    const raw = document.getElementById(elementId).innerText.replace(/[₫\s]/g, '').trim();
    navigator.clipboard.writeText(raw).then(() => {
    showToast('info', 'Đã sao chép!', raw);
}).catch(() => {
    showToast('warning', 'Không thể sao chép', 'Vui lòng sao chép thủ công.');
});
}

    // Xác nhận chuyển khoản
    async function coPayConfirm() {
    const isDeposit = window._bkDepositMode;
    const state     = isDeposit ? _bkDepositState : _coPayState;
    const apiUrl    = isDeposit ? '/api/v1/payment/deposit/employee' : '/api/v1/payment/thanhtoan';

    if (!state.bookingId) {
    showToast('error', 'Lỗi', 'Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
    return;
}
    const confirmBtn = document.getElementById('co-pay-confirm-btn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác nhận...';

    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams();
    params.append('booking_id', String(state.bookingId));
    params.append('amount',     String(state.amount));
    params.append('method_booking', 'BANK_TRANSFER');

    try {
    const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: params
});
    if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(t || `Lỗi ${res.status}`); }
    const msg = await res.text();
    coPayClose();
    showToast('success', isDeposit ? '💰 Đặt cọc thành công!' : '🎉 Thanh toán thành công!', msg || 'Giao dịch đã được ghi nhận.');
    if (!isDeposit) _coPayState = { bookingId: null, amount: 0, method: null };
} catch (err) {
    showToast('error', isDeposit ? 'Đặt cọc thất bại' : 'Thanh toán thất bại', err.message || 'Có lỗi xảy ra.');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = isDeposit
    ? '<i class="fas fa-check-circle"></i> Đã nhận cọc qua chuyển khoản'
    : '<i class="fas fa-check-circle"></i> Tôi đã chuyển khoản';
}
}

    // Xác nhận tiền mặt / thẻ
    async function coPayCashConfirm() {
    const isDeposit = window._bkDepositMode;
    const state     = isDeposit ? _bkDepositState : _coPayState;
    const apiUrl    = isDeposit ? '/api/v1/payment/deposit/employee' : '/api/v1/payment/thanhtoan';

    if (!state.bookingId) {
    showToast('error', 'Lỗi', 'Không tìm thấy thông tin đặt phòng. Vui lòng thử lại.');
    return;
}
    const cashBtn = document.getElementById('co-pay-cash-confirm-btn');
    cashBtn.disabled = true;
    cashBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';

    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams();
    params.append('booking_id',     String(state.bookingId));
    params.append('amount',         String(state.amount));
    params.append('method_booking', state.method);

    try {
    const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: params
});
    if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(t || `Lỗi ${res.status}`); }
    const msg = await res.text();
    coPayClose();
    showToast('success', isDeposit ? '💰 Đặt cọc thành công!' : '🎉 Thanh toán thành công!', msg || 'Giao dịch đã được ghi nhận.');
    if (!isDeposit) _coPayState = { bookingId: null, amount: 0, method: null };
} catch (err) {
    showToast('error', isDeposit ? 'Đặt cọc thất bại' : 'Thanh toán thất bại', err.message || 'Có lỗi xảy ra.');
    cashBtn.disabled = false;
    cashBtn.innerHTML = isDeposit
    ? '<i class="fas fa-check-circle"></i> Xác nhận đã thu tiền cọc'
    : '<i class="fas fa-check-circle"></i> Xác nhận đã thu tiền';
}
}

    // Đóng modal khi click overlay
    document.getElementById('co-payment-overlay').addEventListener('click', function(e) {
    if (e.target === this) coPayClose();
});

    // CO Confirm modal
    let _coConfirmCallback = null;
    function coConfirmOpen(roomId, email, employeeId, callback) {
    _coConfirmCallback = callback;
    document.getElementById('co-confirm-room').textContent = 'Phòng #' + roomId;
    document.getElementById('co-confirm-email').textContent = email;
    document.getElementById('co-confirm-employee').textContent = 'ID: ' + employeeId;
    document.getElementById('co-confirm-overlay').classList.add('active');
    document.getElementById('co-confirm-ok-btn').onclick = function () { const cb = _coConfirmCallback; coConfirmClose(); if (cb) cb(); };
}
    function coConfirmClose() {
    document.getElementById('co-confirm-overlay').classList.remove('active');
    _coConfirmCallback = null;
}
    document.getElementById('co-confirm-overlay').addEventListener('click', function(e) { if (e.target === this) coConfirmClose(); });
