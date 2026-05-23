// status room

    function rsReload() { rsLoadRooms(); }

    async function rsLoadRooms() {
    const grid = document.getElementById('rs-grid');
    const countEl = document.getElementById('rs-count');
    grid.innerHTML = '<div class="rs-loading"><i class="fas fa-spinner fa-spin"></i>Đang tải...</div>';
    countEl.textContent = '';
    try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch('/api/v1/rooms/status/clear', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    const rooms = Array.isArray(json) ? json : (json.data || []);
    if (!rooms.length) { grid.innerHTML = '<div class="rs-empty">📭 Không có phòng nào.</div>'; return; }
    countEl.textContent = rooms.length + ' phòng';
    grid.innerHTML = rooms.map(r => rsRenderCard(r)).join('');
} catch (err) {
    grid.innerHTML = '<div class="rs-empty" style="color:#ef4444;">⚠️ Lỗi tải phòng: ' + err.message + '</div>';
}
}

    function rsRenderCard(r) {
    const imgHtml = (r.images && r.images.length > 0) ? `<img class="rs-card-img" src="${r.images[0]}" alt="${r.name || ''}" loading="lazy">` : `<div class="rs-card-img-ph">🏨</div>`;
    const price = r.price ? new Intl.NumberFormat('vi-VN').format(r.price) + ' ₫' : '—';
    return `<div class="rs-card">${imgHtml}<div class="rs-card-body">
            <div class="rs-card-name">${r.name || 'Phòng #' + r.id}</div>
            <div class="rs-card-price">${price} / đêm</div>
            <span class="rs-badge maintenance">🧹 Đang dọn dẹp</span>
            <button class="rs-btn-save" onclick="rsSave(${r.id},this)"><i class="fas fa-check-circle"></i> Chuyển về Available</button>
        </div></div>`;
}

    let _rsConfirmCallback = null;
    function rsConfirmOpen(callback) {
    _rsConfirmCallback = callback;
    document.getElementById('rs-confirm-overlay').classList.add('active');
    document.getElementById('rs-confirm-ok-btn').onclick = function () { const cb = _rsConfirmCallback; rsConfirmClose(); if (cb) cb(); };
}
    function rsConfirmClose() {
    document.getElementById('rs-confirm-overlay').classList.remove('active');
    _rsConfirmCallback = null;
}
    document.getElementById('rs-confirm-overlay').addEventListener('click', function(e) { if (e.target === this) rsConfirmClose(); });

    async function rsSave(roomId, btn) {
    rsConfirmOpen(async () => {
        const token = localStorage.getItem('accessToken');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        try {
            const res = await fetch(`/api/v1/rooms/status/cleartoavilble/${roomId}`, { method: 'POST', headers: token ? { Authorization: 'Bearer ' + token } : {} });
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Thất bại'); }
            btn.innerHTML = '<i class="fas fa-check"></i> Đã chuyển AVAILABLE!';
            btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
            showToast('success', 'Cập nhật thành công', 'Phòng đã chuyển về trạng thái Available.');
            setTimeout(() => {
                btn.closest('.rs-card').remove();
                const remaining = document.querySelectorAll('#rs-grid .rs-card').length;
                const countEl = document.getElementById('rs-count');
                if (countEl) countEl.textContent = remaining + ' phòng';
                if (remaining === 0) document.getElementById('rs-grid').innerHTML = '<div class="rs-empty">✅ Không còn phòng nào cần dọn dẹp.</div>';
            }, 1500);
        } catch (err) {
            showToast('error', 'Cập nhật thất bại', err.message);
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Chuyển về Available';
            btn.style.background = '';
            btn.disabled = false;
        }
    });
}
