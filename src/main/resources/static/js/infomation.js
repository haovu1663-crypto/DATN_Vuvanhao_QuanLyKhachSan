// ===== INFORMATION VIEW =====

function infoSetMsg(text, type) {
    const el = document.getElementById('infoSearchMsg');
    if (!el) return;
    if (!text) { el.style.display = 'none'; el.className = 'info-msg'; return; }
    el.style.display = 'block';
    el.className = 'info-msg ' + (type === 'err' ? 'err' : 'info');
    el.innerHTML = (type === 'err'
        ? '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>'
        : '<i class="fas fa-info-circle" style="margin-right:6px;"></i>') + text;
}

function infoFormatDate(dt) {
    if (!dt) return '—';
    try {
        const d = new Date(dt);
        if (isNaN(d)) return dt;
        return d.toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return dt; }
}

async function infoSearch() {
    const roomName   = (document.getElementById('infoRoomName')?.value || '').trim();
    const workBranch = document.getElementById('infoBranchSelect')?.value || '';

    // Reset UI
    infoSetMsg('', '');
    document.getElementById('infoResultWrap').style.display  = 'none';
    document.getElementById('infoGridWrap').style.display    = 'none';

    if (!roomName) {
        infoSetMsg('Vui lòng nhập tên phòng cần tra cứu.', 'err');
        document.getElementById('infoRoomName').focus();
        return;
    }

    infoSetMsg('Đang tải dữ liệu...', 'info');

    const params = new URLSearchParams({ workBranch, roomName });

    try {
        const res = await fetch(`/api/v1/booking/info?${params.toString()}`);


        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Lỗi máy chủ (${res.status})`);
        }

        const data = await res.json();
        infoSetMsg('', '');
        infoRenderResultHeader(data, roomName);
        infoRenderGrid(data);

    } catch (e) {
        infoSetMsg(e.message || 'Không thể kết nối đến máy chủ.', 'err');
    }
}

// ── Header kết quả (số bản ghi + trạng thái trống) ──
function infoRenderResultHeader(data, roomName) {
    const wrap    = document.getElementById('infoResultWrap');
    const countEl = document.getElementById('infoResultCount');
    const roomEl  = document.getElementById('infoResultRoom');
    const emptyEl = document.getElementById('infoEmptyState');

    wrap.style.display = 'block';
    countEl.textContent = data.length + ' bản ghi';
    roomEl.textContent  = 'Phòng: ' + roomName;

    emptyEl.style.display = (!data || data.length === 0) ? 'block' : 'none';
}

// ── DataGridView (thẻ card theo phòng) ──
function infoRenderGrid(data) {
    const gridWrap = document.getElementById('infoGridWrap');
    const grid     = document.getElementById('infoGrid');

    gridWrap.style.display = 'block';

    if (!data || data.length === 0) {
        grid.innerHTML = `
            <div class="info-grid-empty">
                <i class="fas fa-calendar-times"></i>
                <p>Không có dữ liệu để hiển thị</p>
            </div>`;
        return;
    }

    grid.innerHTML = data.map(item => `
        <div class="info-grid-card">
            <div class="info-grid-card-header">
                <div class="info-grid-room-badge">
                    <i class="fas fa-door-open"></i>
                    <span>${item.roomName || '—'}</span>
                </div>
                <div class="info-grid-id">#${item.roomId || ''}</div>
            </div>
            <div class="info-grid-card-body">
                <div class="info-grid-row">
                    <i class="fas fa-user info-grid-icon"></i>
                    <div>
                        <div class="info-grid-row-label">Khách hàng</div>
                        <div class="info-grid-row-val">${item.customerName || '—'}</div>
                    </div>
                </div>
                <div class="info-grid-row">
                    <i class="fas fa-phone info-grid-icon" style="color:#10b981;"></i>
                    <div>
                        <div class="info-grid-row-label">Số điện thoại</div>
                        <div class="info-grid-row-val">${item.phoneNumber || '—'}</div>
                    </div>
                </div>
                <div class="info-grid-divider"></div>
                <div class="info-grid-dates">
                    <div class="info-grid-date-block info-grid-date-in">
                        <div class="info-grid-date-label"><i class="fas fa-sign-in-alt"></i> Check-in</div>
                        <div class="info-grid-date-val">${infoFormatDate(item.checkInDate)}</div>
                    </div>
                    <div class="info-grid-date-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="info-grid-date-block info-grid-date-out">
                        <div class="info-grid-date-label"><i class="fas fa-sign-out-alt"></i> Check-out</div>
                        <div class="info-grid-date-val">${infoFormatDate(item.checkOutDate)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}