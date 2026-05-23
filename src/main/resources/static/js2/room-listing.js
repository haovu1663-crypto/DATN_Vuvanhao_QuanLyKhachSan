
    // ===== ROOM LISTING - API /api/v1/roomtypes =====
    let allRooms    = [];   // dữ liệu gốc từ API (RoomTypeResponse[])
    let filterTypeId = null; // null = tất cả

    // ---- Gọi API lấy danh sách loại phòng ----
    async function loadRooms() {
    showState('skeleton');
    try {
    const res = await fetch('/api/v1/roomtypes');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();

    // Backend trả về ApiResponse { data: RoomTypeResponse[] }
    allRooms = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);

    if (allRooms.length === 0) { showState('empty'); return; }

    buildTypeFilter();
    sortAndRender();
    showState('grid');

} catch (err) {
    document.getElementById('room-error-msg').textContent = err.message || 'Lỗi kết nối máy chủ';
    showState('error');
}
}

    // ---- Build filter chips theo loại phòng ----
    function buildTypeFilter() {
    const wrap = document.getElementById('type-filter-wrap');

    let html = '<button class="type-chip active" onclick="filterByType(null,this)">Tất cả</button>';
    allRooms.forEach(rt => {
    html += '<button class="type-chip" onclick="filterByType(' + rt.id + ',this)">' + (rt.type || 'Loại ' + rt.id) + '</button>';
});
    wrap.innerHTML = html;
}

    function filterByType(typeId, btn) {
    filterTypeId = typeId;
    document.querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    sortAndRender();
}

    // ---- Sắp xếp + render ----
    function sortAndRender() {
    const sort = document.getElementById('room-sort').value;
    let rooms = filterTypeId
    ? allRooms.filter(rt => rt.id == filterTypeId)
    : [...allRooms];

    if (sort === 'price_asc')  rooms.sort((a,b) => (a.price||0) - (b.price||0));
    if (sort === 'price_desc') rooms.sort((a,b) => (b.price||0) - (a.price||0));
    if (sort === 'name_asc')   rooms.sort((a,b) => (a.type||'').localeCompare(b.type||''));

    const countEl = document.getElementById('room-count-text');
    countEl.textContent = 'Tìm thấy ' + rooms.length + ' loại phòng' + (filterTypeId ? ' đã chọn' : '');

    const grid = document.getElementById('room-grid');
    grid.innerHTML = rooms.length ? rooms.map(renderRoomCard).join('') : renderNoMatch();
    grid.style.display = 'flex';
}

    function renderNoMatch() {
    return '<div style="text-align:center;padding:40px 0;color:var(--gray);font-size:14px;">Không tìm thấy loại phòng phù hợp với bộ lọc</div>';
}

    // ---- Render 1 card loại phòng (dữ liệu từ RoomTypeResponse) ----
    function renderRoomCard(rt) {
    const typeName  = rt.type        || '—';
    const capacity  = rt.capacity    ? rt.capacity + ' người' : '—';
    const amenities = rt.amenities   || '';
    const desc      = rt.description || '';
    const price     = rt.price ? new Intl.NumberFormat('vi-VN').format(rt.price) + ' ₫' : '—';

    // Nội thất (tối đa 4 tag)
    const amenityTags = amenities.split(',').map(a=>a.trim()).filter(Boolean).slice(0,4)
    .map(a => '<span style="background:#f0f4ff;color:var(--navy);font-size:11px;font-weight:500;padding:2px 8px;border-radius:6px;">' + a + '</span>').join('');

    // Nút đặt phòng
    const bookBtn = '<button class="rc-btn-book" onclick="openBooking(' + JSON.stringify(rt).replace(/"/g,"&quot;") + ')">Đặt phòng</button>';

    // Render phần ảnh — carousel với mũi tên nếu có nhiều ảnh
    const hasImg = Array.isArray(rt.images) && rt.images.length > 0;
    const carouselId = 'carousel-' + (rt.id || Math.random().toString(36).slice(2));
    const imgHtml = hasImg
    ? '<img id="' + carouselId + '-img" src="' + rt.images[0] + '" alt="' + typeName + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">'
    + (rt.images.length > 1
    ? '<button onclick="slideImg(event,\'' + carouselId + '\',' + JSON.stringify(rt.images).replace(/"/g,'&quot;') + ',-1)" style="position:absolute;left:6px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.45);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;line-height:1;transition:background .2s;" onmouseover="this.style.background=\'rgba(0,0,0,0.75)\'" onmouseout="this.style.background=\'rgba(0,0,0,0.45)\'">&#8249;</button>'
    + '<button onclick="slideImg(event,\'' + carouselId + '\',' + JSON.stringify(rt.images).replace(/"/g,'&quot;') + ',1)" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.45);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;line-height:1;transition:background .2s;" onmouseover="this.style.background=\'rgba(0,0,0,0.75)\'" onmouseout="this.style.background=\'rgba(0,0,0,0.45)\'">&#8250;</button>'
    + '<span id="' + carouselId + '-badge" style="position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,0.55);color:#fff;font-size:11px;font-weight:500;padding:2px 8px;border-radius:10px;">1 / ' + rt.images.length + '</span>'
    : '')
    : '<div class="rc-img-ph">'
    + '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">'
    + '<rect x="2" y="7" width="20" height="14" rx="2"/>'
    + '<path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>'
    + '<circle cx="12" cy="14" r="2"/>'
    + '</svg>'
    + '<span>Chưa có ảnh</span>'
    + '</div>';

    return '<div class="rc">' +
    '<div class="rc-img">' + imgHtml + '</div>' +
    '<div class="rc-body">' +
    '<div class="rc-type">' + typeName + '</div>' +
    '<div class="rc-name">' + typeName + '</div>' +
    '<div class="rc-id">ID: ' + rt.id + ' &nbsp;·&nbsp; Tối đa ' + capacity + '</div>' +
    (amenityTags ? '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;">' + amenityTags + '</div>' : '') +
    (desc ? '<div style="font-size:13px;color:var(--gray);line-height:1.5;margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + desc + '</div>' : '') +
    '<div class="rc-footer">' +
    '<div>' +
    '<div class="rc-price-night">Giá mỗi đêm</div>' +
    '<div class="rc-price">' + price + '</div>' +
    '</div>' +
    '<div class="rc-btn-group">' +
    bookBtn +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
}


    // ---- Email OTP trong booking ----
    let _bkOtpCountdown = 0;

    function bkOnEmailInput() {
    const email = document.getElementById('bk-email').value.trim();
    const btn   = document.getElementById('btn-bk-send-otp');
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    document.getElementById('bk-email').classList.toggle('error', email.length > 0 && !valid);
    btn.disabled = !valid || _bkOtpCountdown > 0;
}

    // OTP booking state
    let _bkOtpCode      = null;   // mã OTP nhận từ server
    let _bkOtpVerified  = false;  // đã xác thực thành công chưa

    function bkSendOtp() {
    const emailEl  = document.getElementById('bk-email');
    const hintEl   = document.getElementById('bk-otp-hint');
    const btn      = document.getElementById('btn-bk-send-otp');
    const otpSec   = document.getElementById('bk-otp-section');
    const statusEl = document.getElementById('bk-otp-status');
    const email    = emailEl.value.trim();
    const userId   = localStorage.getItem('userId');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailEl.classList.add('error');
    hintEl.textContent = '⚠️ Vui lòng nhập email hợp lệ.';
    hintEl.className = 'bk-otp-hint';
    return;
}

    btn.disabled = true;
    hintEl.textContent = '⏳ Đang gửi...';
    hintEl.className = 'bk-otp-hint';

    // Reset OTP state
    _bkOtpCode     = null;
    _bkOtpVerified = false;
    bkUpdateBtn();

    // Xóa các ô OTP cũ
    [0,1,2,3].forEach(i => {
    const el = document.getElementById('bk-otp-' + i);
    el.value = '';
    el.className = 'reg-otp-digit';
});
    statusEl.textContent = '';
    statusEl.className   = 'reg-otp-status';

    // Gọi đúng endpoint /api/email/booking với email + id
    const url = '/api/email/booking?email=' + encodeURIComponent(email) + '&id=' + encodeURIComponent(userId || 0);
    fetch(url, { method: 'POST' })
    .then(async res => {
    const body = await res.text();
    if (!res.ok) {
    // Server trả về message lỗi (ví dụ: email không khớp 409)
    throw new Error(body);
}
    // Server trả về số OTP (int)
    _bkOtpCode = String(body).trim();
    hintEl.textContent = '✅ Mã xác nhận đã gửi đến ' + email + '. Vui lòng kiểm tra hộp thư.';
    hintEl.className = 'bk-otp-hint success';
    otpSec.classList.add('show');
    setTimeout(() => document.getElementById('bk-otp-0').focus(), 100);
    bkStartOtpCountdown(60);
})
    .catch(err => {
    Swal.fire({
    icon: 'error',
    title: 'Gửi mã thất bại',
    text: err.message || 'Gửi thất bại. Vui lòng thử lại.',
    confirmButtonColor: '#dc2626'
});
    hintEl.textContent = '';
    hintEl.className = 'bk-otp-hint';
    btn.disabled = false;
});
}

    function bkStartOtpCountdown(seconds) {
    const btn = document.getElementById('btn-bk-send-otp');
    _bkOtpCountdown = seconds;
    clearInterval(window._bkOtpTimer);
    window._bkOtpTimer = setInterval(() => {
    _bkOtpCountdown--;
    if (_bkOtpCountdown <= 0) {
    clearInterval(window._bkOtpTimer);
    btn.innerHTML = 'Gửi lại<br>mã';
    btn.disabled  = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    document.getElementById('bk-email').value.trim()
    );
} else {
    btn.innerHTML = 'Gửi lại<br>(' + _bkOtpCountdown + 's)';
    btn.disabled  = true;
}
}, 1000);
}

    // ---- Xử lý nhập OTP booking ----
    function bkOtpInput(idx) {
    const el  = document.getElementById('bk-otp-' + idx);
    const val = el.value.replace(/\D/g, '');
    el.value  = val ? val[0] : '';
    if (val && idx < 3) document.getElementById('bk-otp-' + (idx + 1)).focus();
    el.classList.toggle('filled', !!el.value);
    el.classList.remove('error', 'success');
    bkCheckOtp();
}

    function bkOtpKey(e, idx) {
    if (e.key === 'Backspace' && !document.getElementById('bk-otp-' + idx).value && idx > 0) {
    document.getElementById('bk-otp-' + (idx - 1)).focus();
}
}

    function bkCheckOtp() {
    const entered = [0,1,2,3].map(i => document.getElementById('bk-otp-' + i).value).join('');
    const statusEl = document.getElementById('bk-otp-status');

    if (entered.length < 4) {
    statusEl.textContent = '';
    statusEl.className   = 'reg-otp-status';
    _bkOtpVerified = false;
    bkUpdateBtn();
    return;
}

    if (_bkOtpCode && entered === _bkOtpCode) {
    // Đúng
    [0,1,2,3].forEach(i => {
    document.getElementById('bk-otp-' + i).className = 'reg-otp-digit success';
});
    statusEl.textContent = '✅ Xác thực email thành công!';
    statusEl.className   = 'reg-otp-status success';
    _bkOtpVerified = true;
} else {
    // Sai
    [0,1,2,3].forEach(i => {
    document.getElementById('bk-otp-' + i).className = 'reg-otp-digit error';
});
    statusEl.textContent = '❌ Mã xác nhận không đúng. Vui lòng thử lại.';
    statusEl.className   = 'reg-otp-status error';
    _bkOtpVerified = false;
}
    bkUpdateBtn();
}

    // ---- Mở modal booking từ card ----
    function openBooking(rt) {
    showBooking(rt.id, rt.type || ('Loại phòng #' + rt.id), rt.type || 'Phòng', rt.price || 0);
}

    // ---- Hiển thị đúng trạng thái ----
    function showState(state) {
    document.getElementById('room-skeleton').style.display = state === 'skeleton' ? 'flex'  : 'none';
    document.getElementById('room-grid').style.display     = state === 'grid'     ? 'flex'  : 'none';
    document.getElementById('room-empty').style.display    = state === 'empty'    ? 'block' : 'none';
    document.getElementById('room-error').style.display    = state === 'error'    ? 'block' : 'none';
}

    // ---- Carousel: chuyển ảnh bằng mũi tên ----
    const _carouselIndex = {};
    function slideImg(event, id, images, dir) {
    event.stopPropagation();
    const total = images.length;
    if (!total) return;
    _carouselIndex[id] = ((_carouselIndex[id] || 0) + dir + total) % total;
    const idx = _carouselIndex[id];
    const imgEl   = document.getElementById(id + '-img');
    const badgeEl = document.getElementById(id + '-badge');
    if (imgEl)   imgEl.src = images[idx];
    if (badgeEl) badgeEl.textContent = (idx + 1) + ' / ' + total;
}

    // Tự động load khi trang khởi động
    document.addEventListener('DOMContentLoaded', loadRooms);
