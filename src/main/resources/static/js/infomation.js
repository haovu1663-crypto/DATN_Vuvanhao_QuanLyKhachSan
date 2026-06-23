// ===== INFORMATION VIEW =====

const INFO_TAB_LABELS = {
    booking:  'Booking',
    room:     'Room',
    roomtype: 'RoomType',
    customer: 'Customer'
};

let infoCurrentTab = 'booking';

function infoSwitchTab(tab, btnEl) {
    infoCurrentTab = tab;

    document.querySelectorAll('.info-submenu-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');

    // Ẩn kết quả cũ khi đổi tab
    document.getElementById('infoResultWrap').style.display = 'none';
    document.getElementById('infoGridWrap').style.display   = 'none';
    infoSetMsg('', '');

    // Tiêu đề khu vực tra cứu thay đổi theo tab
    const INFO_TITLES = {
        booking:  { label: 'Tra cứu thông tin đặt phòng',           sub: 'Nhập tên phòng và chọn chi nhánh để xem lịch đặt phòng' },
        room:     { label: 'Tra cứu thông tin phòng',                sub: 'Chọn chi nhánh để xem danh sách phòng' },
        roomtype: { label: 'Tra cứu thông tin loại phòng',           sub: 'Danh sách các loại phòng hiện có' },
        customer: { label: 'Tra cứu thông tin khách hàng đang thuê phòng', sub: 'Chọn chi nhánh để xem khách hàng đang ở' }
    };
    const titleEl = document.getElementById('infoSearchLabel');
    const subEl   = document.getElementById('infoSearchSub');
    if (titleEl) titleEl.textContent = INFO_TITLES[tab]?.label || '';
    if (subEl)   subEl.textContent   = INFO_TITLES[tab]?.sub || '';

    // Ô "Tên phòng" chỉ dùng cho tab Booking — các tab khác ẩn đi
    const roomNameField = document.getElementById('infoRoomNameField');
    if (roomNameField) {
        roomNameField.style.display = (tab === 'booking') ? '' : 'none';
    }

    // Combobox chi nhánh và nút Tìm kiếm: ẩn ở tab RoomType (không cần lọc, load toàn bộ)
    const branchField    = document.getElementById('infoBranchField');
    const searchBtnField = document.getElementById('infoSearchBtnField');
    const showBranchAndSearch = (tab !== 'roomtype');
    if (branchField)    branchField.style.display    = showBranchAndSearch ? '' : 'none';
    if (searchBtnField) searchBtnField.style.display = showBranchAndSearch ? '' : 'none';

    if (tab === 'booking') {
        return;
    }

    if (tab === 'room') {
        // Tự động load toàn bộ phòng ngay khi vào tab Room
        infoLoadAllRooms();
        return;
    }

    if (tab === 'roomtype') {
        // Tự động load toàn bộ loại phòng ngay khi vào tab RoomType
        infoLoadAllRoomTypes();
        return;
    }

    // Customer: chờ người dùng chọn chi nhánh và bấm "Tìm kiếm"
}

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

function infoFormatPrice(price) {
    if (price === null || price === undefined) return '—';
    try {
        return Number(price).toLocaleString('vi-VN') + ' đ';
    } catch (e) { return price + ' đ'; }
}

// ── Nút "Tìm kiếm" — phân nhánh theo tab đang chọn ──
async function infoSearch() {
    if (infoCurrentTab === 'room') {
        return infoSearchRoomByBranch();
    }
    if (infoCurrentTab === 'customer') {
        return infoSearchCustomerByBranch();
    }

    // ===== Tab Booking (mặc định) =====
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
        infoRenderResultHeader(data, 'Phòng: ' + roomName);
        infoRenderGrid(data);

    } catch (e) {
        infoSetMsg(e.message || 'Không thể kết nối đến máy chủ.', 'err');
    }
}

// ── Tab Room: tự động load toàn bộ phòng (gọi khi vừa chuyển sang tab) ──
async function infoLoadAllRooms() {
    infoSetMsg('Đang tải dữ liệu...', 'info');
    document.getElementById('infoResultWrap').style.display = 'none';
    document.getElementById('infoGridWrap').style.display   = 'none';

    try {
        const res = await fetch('/api/v1/rooms/info');

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Lỗi máy chủ (${res.status})`);
        }

        const data = await res.json();
        infoSetMsg('', '');
        infoRenderResultHeader(data, 'Tất cả chi nhánh');
        infoRenderRoomGrid(data);

    } catch (e) {
        infoSetMsg(e.message || 'Không thể kết nối đến máy chủ.', 'err');
    }
}

// ── Tab Room: bấm "Tìm kiếm" -> lọc theo chi nhánh đang chọn ──
async function infoSearchRoomByBranch() {
    const workBranch = document.getElementById('infoBranchSelect')?.value || '';

    infoSetMsg('Đang tải dữ liệu...', 'info');
    document.getElementById('infoResultWrap').style.display = 'none';
    document.getElementById('infoGridWrap').style.display   = 'none';

    const params = new URLSearchParams({ workBranch });

    try {
        const res = await fetch(`/api/v1/rooms/info/workbranch?${params.toString()}`);

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Lỗi máy chủ (${res.status})`);
        }

        const data = await res.json();
        infoSetMsg('', '');
        infoRenderResultHeader(data, 'Chi nhánh: ' + workBranch);
        infoRenderRoomGrid(data);

    } catch (e) {
        infoSetMsg(e.message || 'Không thể kết nối đến máy chủ.', 'err');
    }
}

// ── Tab Customer: bấm "Tìm kiếm" -> lấy khách đang ở theo chi nhánh ──
async function infoSearchCustomerByBranch() {
    const workBranch = document.getElementById('infoBranchSelect')?.value || '';

    infoSetMsg('Đang tải dữ liệu...', 'info');
    document.getElementById('infoResultWrap').style.display = 'none';
    document.getElementById('infoGridWrap').style.display   = 'none';

    const params = new URLSearchParams({ workBranch });

    try {
        const res = await fetch(`/api/v1/booking/info/cutomer?${params.toString()}`);

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Lỗi máy chủ (${res.status})`);
        }

        const data = await res.json();
        infoSetMsg('', '');
        infoRenderResultHeader(data, 'Chi nhánh: ' + workBranch);
        infoRenderCustomerGrid(data);

    } catch (e) {
        infoSetMsg(e.message || 'Không thể kết nối đến máy chủ.', 'err');
    }
}

// ── Tab RoomType: tự động load toàn bộ loại phòng (gọi khi vừa chuyển sang tab) ──
async function infoLoadAllRoomTypes() {
    infoSetMsg('Đang tải dữ liệu...', 'info');
    document.getElementById('infoResultWrap').style.display = 'none';
    document.getElementById('infoGridWrap').style.display   = 'none';

    try {
        const res = await fetch('/api/v1/roomtypes/info');

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Lỗi máy chủ (${res.status})`);
        }

        const data = await res.json();
        infoSetMsg('', '');
        infoRenderResultHeader(data, 'Tất cả loại phòng');
        infoRenderRoomTypeGrid(data);

    } catch (e) {
        infoSetMsg(e.message || 'Không thể kết nối đến máy chủ.', 'err');
    }
}


function infoRenderResultHeader(data, labelText) {
    const wrap    = document.getElementById('infoResultWrap');
    const countEl = document.getElementById('infoResultCount');
    const roomEl  = document.getElementById('infoResultRoom');
    const emptyEl = document.getElementById('infoEmptyState');

    wrap.style.display = 'block';
    countEl.textContent = data.length + ' bản ghi';
    roomEl.textContent  = labelText;

    emptyEl.style.display = (!data || data.length === 0) ? 'block' : 'none';
}

// ── DataGridView cho tab Booking (thẻ card khách + check-in/out) ──
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

// ── DataGridView cho tab Room (loại phòng, giá, chi nhánh) ──
function infoRenderRoomGrid(data) {
    const gridWrap = document.getElementById('infoGridWrap');
    const grid     = document.getElementById('infoGrid');

    gridWrap.style.display = 'block';

    if (!data || data.length === 0) {
        grid.innerHTML = `
            <div class="info-grid-empty">
                <i class="fas fa-door-closed"></i>
                <p>Không tìm thấy phòng phù hợp</p>
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
                <div class="info-grid-id">#${item.id || ''}</div>
            </div>
            <div class="info-grid-card-body">
                <div class="info-grid-row">
                    <i class="fas fa-layer-group info-grid-icon"></i>
                    <div>
                        <div class="info-grid-row-label">Loại phòng</div>
                        <div class="info-grid-row-val">${item.roomType || '—'}</div>
                    </div>
                </div>
                <div class="info-grid-row">
                    <i class="fas fa-tag info-grid-icon" style="color:#f59e0b;"></i>
                    <div>
                        <div class="info-grid-row-label">Giá phòng</div>
                        <div class="info-grid-row-val">${infoFormatPrice(item.roomPrice)}</div>
                    </div>
                </div>
                <div class="info-grid-divider"></div>
                <div class="info-grid-row">
                    <i class="fas fa-map-marker-alt info-grid-icon" style="color:#10b981;"></i>
                    <div>
                        <div class="info-grid-row-label">Chi nhánh</div>
                        <div class="info-grid-row-val">${item.workBrach || '—'}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ── DataGridView cho tab RoomType (id, tên loại phòng, giá) ──
function infoRenderRoomTypeGrid(data) {
    const gridWrap = document.getElementById('infoGridWrap');
    const grid     = document.getElementById('infoGrid');

    gridWrap.style.display = 'block';

    if (!data || data.length === 0) {
        grid.innerHTML = `
            <div class="info-grid-empty">
                <i class="fas fa-layer-group"></i>
                <p>Không có loại phòng nào để hiển thị</p>
            </div>`;
        return;
    }

    grid.innerHTML = data.map(item => `
        <div class="info-grid-card">
            <div class="info-grid-card-header">
                <div class="info-grid-room-badge">
                    <i class="fas fa-layer-group"></i>
                    <span>${item.name || '—'}</span>
                </div>
                <div class="info-grid-id">#${item.id || ''}</div>
            </div>
            <div class="info-grid-card-body">
                <div class="info-grid-row">
                    <i class="fas fa-tag info-grid-icon" style="color:#f59e0b;"></i>
                    <div>
                        <div class="info-grid-row-label">Giá</div>
                        <div class="info-grid-row-val">${infoFormatPrice(item.price)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}


// ── DataGridView cho tab Customer (khách hàng đang ở) ──
function infoRenderCustomerGrid(data) {
    const gridWrap = document.getElementById('infoGridWrap');
    const grid     = document.getElementById('infoGrid');

    gridWrap.style.display = 'block';

    if (!data || data.length === 0) {
        grid.innerHTML = `
            <div class="info-grid-empty">
                <i class="fas fa-user-slash"></i>
                <p>Không có khách hàng nào đang ở</p>
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
            </div>
            <div class="info-grid-card-body">
                <div class="info-grid-row">
                    <i class="fas fa-user info-grid-icon"></i>
                    <div>
                        <div class="info-grid-row-label">Khách hàng</div>
                        <div class="info-grid-row-val">${item.name || '—'}</div>
                    </div>
                </div>
                <div class="info-grid-row">
                    <i class="fas fa-phone info-grid-icon" style="color:#10b981;"></i>
                    <div>
                        <div class="info-grid-row-label">Số điện thoại</div>
                        <div class="info-grid-row-val">${item.sdt || '—'}</div>
                    </div>
                </div>
                <div class="info-grid-divider"></div>
                <div class="info-grid-row">
                    <i class="fas fa-id-card info-grid-icon" style="color:#f59e0b;"></i>
                    <div>
                        <div class="info-grid-row-label">CCCD</div>
                        <div class="info-grid-row-val">${item.cccd || '—'}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}