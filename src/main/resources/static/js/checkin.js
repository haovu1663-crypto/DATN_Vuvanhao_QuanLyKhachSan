// check in

    let _ciAllRooms = [];

    function ciReload() { ciClearSearch(); ciLoadRooms(); }

    async function ciLoadRooms() {
    const grid = document.getElementById('ci-grid');
    const countEl = document.getElementById('ci-count');
    grid.innerHTML = '<div class="rs-loading"><i class="fas fa-spinner fa-spin"></i>Đang tải...</div>';
    countEl.textContent = '';
    try {
    const token = localStorage.getItem('accessToken');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('/api/v1/rooms/status/curently', { signal: controller.signal, headers: token ? { Authorization: 'Bearer ' + token } : {} });
    clearTimeout(timeout);
    if (!res.ok) { const errText = await res.text(); throw new Error(`HTTP ${res.status} - ${errText}`); }
    const json = await res.json();
    _ciAllRooms = Array.isArray(json) ? json : (json.data || []);
    ciRenderGrid(_ciAllRooms);
} catch (err) {
    const msg = err.name === 'AbortError' ? 'Request timeout — server không phản hồi sau 8 giây' : err.message;
    document.getElementById('ci-grid').innerHTML = `<div class="rs-empty" style="color:#ef4444;">⚠️ Lỗi: ${msg}</div>`;
}
}

    function ciRenderGrid(rooms) {
    const grid = document.getElementById('ci-grid');
    const countEl = document.getElementById('ci-count');
    if (!rooms.length) {
    const keyword = document.getElementById('ci-search-input').value.trim();
    grid.innerHTML = keyword ? `<div class="rs-empty">🔍 Không tìm thấy phòng nào với gmail <b>${keyword}</b>.</div>` : '<div class="rs-empty">📭 Không có phòng nào chờ Check In.</div>';
    countEl.textContent = ''; return;
}
    countEl.textContent = rooms.length + ' phòng';
    grid.innerHTML = rooms.map(r => ciRenderCard(r)).join('');
}

    function ciOnSearchInput() {
    const val = document.getElementById('ci-search-input').value.trim();
    document.getElementById('ci-search-clear').classList.toggle('hidden', !val);
}

    async function ciSearch() {
    const input = document.getElementById('ci-search-input');
    const email = input.value.trim();
    const hint = document.getElementById('ci-search-hint');
    const hintTxt = document.getElementById('ci-search-hint-text');
    const grid = document.getElementById('ci-grid');
    const countEl = document.getElementById('ci-count');
    if (!email) { ciClearSearch(); return; }
    grid.innerHTML = '<div class="rs-loading"><i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...</div>';
    countEl.textContent = '';
    try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch('/api/v1/rooms/customer/' + encodeURIComponent(email), { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
    if (res.status === 404) { ciRenderGrid([]); hint.classList.remove('hidden'); hintTxt.textContent = `Không tìm thấy phòng nào cho "${email}"`; return; }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const rooms = Array.isArray(json) ? json : (json.data || []);
    hint.classList.remove('hidden');
    hintTxt.textContent = `Kết quả cho "${email}" — ${rooms.length} phòng`;
    ciRenderGrid(rooms);
} catch (err) {
    grid.innerHTML = `<div class="rs-empty" style="color:#ef4444;">⚠️ Lỗi: ${err.message}</div>`;
    countEl.textContent = '';
}
}

    function ciClearSearch() {
    document.getElementById('ci-search-input').value = '';
    document.getElementById('ci-search-clear').classList.add('hidden');
    document.getElementById('ci-search-hint').classList.add('hidden');
    ciRenderGrid(_ciAllRooms);
}

    function ciRenderCard(r) {
    const imgHtml = (r.images && r.images.length > 0) ? `<img class="rs-card-img" src="${r.images[0]}" alt="${r.name || ''}" loading="lazy">` : `<div class="rs-card-img-ph">🏨</div>`;
    const price = r.price ? new Intl.NumberFormat('vi-VN').format(r.price) + ' ₫' : '—';
    const email = r.guestEmail || r.email || r.customerEmail || '';
    const emailHtml = email ? `<div style="font-size:11px;color:#64748b;margin-bottom:7px;display:flex;align-items:center;gap:5px;overflow:hidden;"><i class="fab fa-google" style="color:#ea4335;flex-shrink:0;"></i><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${email}">${email}</span></div>` : '';
    return `<div class="rs-card">${imgHtml}<div class="rs-card-body">
            <div class="rs-card-name">${r.name || 'Phòng #' + r.id}</div>
            <div class="rs-card-price">${price} / đêm</div>
            ${emailHtml}
            <span class="rs-badge currently">🕐 Chờ Check In</span>
            <button class="rs-btn-save" style="background:linear-gradient(135deg,#ef4444,#dc2626);" onclick="ciCheckIn(${r.id}, this)">
                <i class="fas fa-door-open"></i> Check In
            </button>
        </div></div>`;
}

    async function ciCheckIn(roomId, btn) {
    const email = document.getElementById('ci-search-input').value.trim();
    const employeeId = localStorage.getItem('userId');
    const token = localStorage.getItem('accessToken');
    if (!email) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập email khách hàng vào ô tìm kiếm trước khi Check In!'); document.getElementById('ci-search-input').focus(); return; }
    if (!employeeId) { showToast('error', 'Chưa đăng nhập', 'Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại!'); return; }
    ciConfirmOpen(roomId, email, employeeId, async () => {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    try {
    const params = new URLSearchParams();
    params.append('email', email);
    params.append('roomId', roomId);
    const res = await fetch(`/api/v1/booking/checkin/${employeeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(token ? { 'Authorization': 'Bearer ' + token } : {}) },
    body: params
});
    if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    let msg = `Lỗi ${res.status}`;
    if (contentType.includes('application/json')) { const errJson = await res.json(); msg = errJson.message || errJson.data?.message || JSON.stringify(errJson); }
    else { msg = await res.text() || msg; }
    throw new Error(msg);
}
    showToast('success', 'Check In thành công!', `Phòng #${roomId} — ${email}`);
    btn.innerHTML = '<i class="fas fa-check"></i> Đã Check In!';
    btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
    setTimeout(() => {
    btn.closest('.rs-card').remove();
    const remaining = document.querySelectorAll('#ci-grid .rs-card').length;
    const countEl = document.getElementById('ci-count');
    if (countEl) countEl.textContent = remaining + ' phòng';
    if (remaining === 0) document.getElementById('ci-grid').innerHTML = '<div class="rs-empty">✅ Không còn phòng nào cần Check In.</div>';
}, 1500);
} catch (err) {
    showToast('error', 'Check In thất bại', err.message);
    btn.innerHTML = '<i class="fas fa-door-open"></i> Check In';
    btn.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
    btn.disabled = false;
}
});
}

    // CI Confirm modal
    let _ciConfirmCallback = null;
    function ciConfirmOpen(roomId, email, employeeId, callback) {
    _ciConfirmCallback = callback;
    document.getElementById('ci-confirm-room').textContent = 'Phòng #' + roomId;
    document.getElementById('ci-confirm-email').textContent = email;
    document.getElementById('ci-confirm-employee').textContent = 'ID: ' + employeeId;
    document.getElementById('ci-confirm-overlay').classList.add('active');
    document.getElementById('ci-confirm-ok-btn').onclick = function () { const cb = _ciConfirmCallback; ciConfirmClose(); if (cb) cb(); };
}
    function ciConfirmClose() {
    document.getElementById('ci-confirm-overlay').classList.remove('active');
    _ciConfirmCallback = null;
}
    document.getElementById('ci-confirm-overlay').addEventListener('click', function(e) { if (e.target === this) ciConfirmClose(); });
