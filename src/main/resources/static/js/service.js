/**
 * service.js
 * Quản lý view "Service Room" — danh sách phòng đang check-in tại chi nhánh.
 * + Modal đăng ký dịch vụ (add-service-modal.html / add-service-modal.css)
 *
 * API đọc phòng : GET  /api/v1/booking/roomservice?workBrach={workBrach}
 * API thêm dịch vụ: POST /api/v1/services/add  (multipart/form-data)
 *
 * workBrach lấy từ localStorage (key: "workBranch")
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------------ */
    /*  Biến nội bộ                                                         */
    /* ------------------------------------------------------------------ */
    let _svAllRooms   = [];   // cache toàn bộ kết quả từ API
    let _svBookingId  = null; // booking đang thao tác trong modal
    let _svRoomName   = '';   // tên phòng đang thao tác
    let _svImageFiles = [];   // danh sách File object chọn để upload
    let _svMode       = 'add';  // 'add' | 'update'
    let _svEditId     = null;   // ID dịch vụ đang được cập nhật
    let _svKeepImageUrls = [];  // URL ảnh cũ từ server cần giữ lại

    /* ------------------------------------------------------------------ */
    /*  Hàm chính: load dữ liệu từ API                                      */
    /* ------------------------------------------------------------------ */
    window.svLoadRooms = async function () {
        const workBrach = (localStorage.getItem('workBranch') || '').trim();

        if (!workBrach) {
            svRenderError('Không tìm thấy thông tin chi nhánh (workBranch) trong localStorage.');
            return;
        }

        svSetLoading(true);

        try {
            const res = await fetch(`/api/v1/booking/roomservice?workBrach=${encodeURIComponent(workBrach)}`);

            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

            const data = await res.json();
            _svAllRooms = Array.isArray(data) ? data : [];
            svRender(_svAllRooms);

        } catch (err) {
            console.error('[service.js] Lỗi khi tải dữ liệu:', err);
            svRenderError('Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            svSetLoading(false);
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Lọc theo tên phòng (gọi từ oninput của input)                       */
    /* ------------------------------------------------------------------ */
    window.svFilterRooms = function (keyword) {
        const kw = (keyword || '').trim().toLowerCase();
        if (!kw) { svRender(_svAllRooms); return; }
        const filtered = _svAllRooms.filter(r =>
            (r.name || '').toLowerCase().includes(kw)
        );
        svRender(filtered);
    };

    /* ================================================================== */
    /*  MODAL – MỞ / ĐÓNG                                                   */
    /* ================================================================== */

    /**
     * Mở modal đăng ký dịch vụ.
     * @param {number|string} bookingId
     * @param {string}        roomName
     */
    window.svOpenAddService = function (bookingId, roomName) {
        _svMode      = 'add';
        _svEditId    = null;
        _svBookingId = bookingId;
        _svRoomName  = roomName;
        _svImageFiles = [];

        // Tiêu đề banner
        document.getElementById('sv-modal-title').textContent = 'Đăng ký dịch vụ';
        const sub = document.getElementById('sv-modal-banner-sub');
        if (sub) sub.textContent = `Booking #${bookingId}  ·  Phòng: ${roomName}`;

        // Nút submit
        document.getElementById('sv-submit-icon').className = 'fas fa-plus-circle sv-btn-icon';
        document.getElementById('sv-submit-label').textContent = 'Đăng ký dịch vụ';

        // Ẩn ô tìm kiếm ID
        document.getElementById('sv-search-id-block').style.display = 'none';
        svHideSearchMsg();

        svResetModal();
        document.getElementById('sv-modal-overlay').classList.add('active');
        document.querySelectorAll('#sv-type-bar .sv-type-pill').forEach((p, i) => p.classList.toggle('active', i === 0));
    };

    /** Mở modal ở mode CẬP NHẬT dịch vụ */
    window.svOpenUpdateService = function () {
        _svMode      = 'update';
        _svEditId    = null;
        _svImageFiles = [];

        // Tiêu đề banner
        document.getElementById('sv-modal-title').textContent = 'Cập nhật dịch vụ';
        const sub = document.getElementById('sv-modal-banner-sub');
        if (sub) sub.textContent = 'Tìm kiếm dịch vụ theo ID để tải dữ liệu';

        // Nút submit
        document.getElementById('sv-submit-icon').className = 'fas fa-save sv-btn-icon';
        document.getElementById('sv-submit-label').textContent = 'Lưu cập nhật';

        // Hiện ô tìm kiếm ID
        document.getElementById('sv-search-id-block').style.display = 'block';
        svHideSearchMsg();

        // Reset input ID
        const idInput = document.getElementById('sv-search-id-input');
        if (idInput) idInput.value = '';

        svResetModal();
        document.getElementById('sv-modal-overlay').classList.add('active');
        document.querySelectorAll('#sv-type-bar .sv-type-pill').forEach((p, i) => p.classList.toggle('active', i === 0));
    };

    /** Đóng modal */
    window.svCloseModal = function () {
        const overlay = document.getElementById('sv-modal-overlay');
        if (overlay) overlay.classList.remove('active');
    };

    /* ================================================================== */
    /*  MODAL – CHỌN LOẠI DỊCH VỤ (PILL BAR)                               */
    /* ================================================================== */
    window.svPickType = function (btn) {
        document.querySelectorAll('#sv-type-bar .sv-type-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
    };

    /* ================================================================== */
    /*  MODAL – TÌM KIẾM DỊCH VỤ THEO ID (mode UPDATE)                     */
    /* ================================================================== */
    window.svSearchServiceById = async function () {
        const idInput = document.getElementById('sv-search-id-input');
        const id = idInput ? idInput.value.trim() : '';
        if (!id || isNaN(id) || Number(id) < 1) {
            svShowSearchMsg('Vui lòng nhập ID hợp lệ.', 'err');
            return;
        }

        // Loading state
        const btn     = document.querySelector('.sv-search-id-btn');
        const spinner = document.getElementById('sv-search-id-spinner');
        const icon    = document.getElementById('sv-search-id-icon');
        if (btn) btn.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        if (icon)    icon.style.display    = 'none';
        svHideSearchMsg();

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`/api/v1/services/${id}`, {
                headers: token ? { Authorization: 'Bearer ' + token } : {}
            });

            if (res.status === 404) {
                svShowSearchMsg(`Không tìm thấy dịch vụ có ID = ${id}.`, 'err');
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            const data = json.data ?? json; // hỗ trợ cả ApiResponse wrapper lẫn object thẳng

            // Gán ID để dùng khi submit
            _svEditId = Number(id);

            // Fill dữ liệu vào form
            svFillForm(data);
            svShowSearchMsg(`Đã tải dịch vụ: "${data.name || id}"`, 'ok');

        } catch (err) {
            console.error('[service.js] Lỗi tìm kiếm dịch vụ:', err);
            svShowSearchMsg('Lỗi kết nối. Vui lòng thử lại.', 'err');
        } finally {
            if (btn) btn.disabled = false;
            if (spinner) spinner.style.display = 'none';
            if (icon)    icon.style.display    = 'inline-block';
        }
    };

    /** Fill dữ liệu từ API response vào các ô nhập liệu */
    function svFillForm(data) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        const isLaundry = (data.type === 'Dịch vụ giặt ủi');

        if (isLaundry) {
            // Fill vào panel giặt ủi
            set('sv-laundry-type',   data.name);
            set('sv-laundry-weight', data.price);
            set('sv-laundry-note',   data.description);
        } else {
            // Fill vào form chung
            set('sv-input-name',        data.name);
            set('sv-input-price',       data.price);
            set('sv-input-description', data.description);
        }

        // Status
        const statusEl = document.getElementById('sv-input-status');
        if (statusEl) statusEl.value = String(data.active ?? data.status ?? true);

        // Pill bar loại dịch vụ — active đúng tab + toggle panel giặt
        if (data.type) {
            let matched = false;
            document.querySelectorAll('#sv-type-bar .sv-type-pill').forEach(p => {
                const isMatch = p.dataset.type === data.type;
                p.classList.toggle('active', isMatch);
                if (isMatch) matched = true;
            });
            if (!matched) document.querySelectorAll('#sv-type-bar .sv-type-pill')[0]?.classList.add('active');

            // Hiện/ẩn panel giặt ủi + common info đúng với loại vừa load
            const panel      = document.getElementById('sv-panel-laundry');
            const commonInfo = document.getElementById('sv-common-info');
            if (panel)      panel.style.display      = isLaundry ? 'block' : 'none';
            if (commonInfo) commonInfo.style.display = isLaundry ? 'none'  : '';
        }

        // Ảnh cũ từ server
        _svImageFiles    = [];
        _svKeepImageUrls = Array.isArray(data.images) ? [...data.images] : [];
        svRenderAllPreviews();
    }

    function svShowSearchMsg(msg, type) {
        const el = document.getElementById('sv-search-id-msg');
        if (!el) return;
        el.textContent = msg;
        el.className   = `sv-search-id-msg ${type}`;
        el.style.display = 'block';
    }

    function svHideSearchMsg() {
        const el = document.getElementById('sv-search-id-msg');
        if (el) el.style.display = 'none';
    }

    /* ================================================================== */
    /*  MODAL – XỬ LÝ ẢNH                                                   */
    /* ================================================================== */
    window.svHandleImages = function (files) {
        const MAX = 5;
        const newFiles = Array.from(files);

        newFiles.forEach(f => {
            if (_svImageFiles.length >= MAX) return;
            if (f.size > 5 * 1024 * 1024) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'warning', title: 'Ảnh quá lớn',
                        text: `"${f.name}" vượt quá 5MB, bỏ qua.`, confirmButtonColor: '#2563eb' });
                }
                return;
            }
            _svImageFiles.push(f);
        });

        svRenderPreviews();

        // Reset input để có thể chọn lại cùng file
        const input = document.getElementById('sv-input-images');
        if (input) input.value = '';
    };

    function svRenderPreviews() { svRenderAllPreviews(); }

    /** Render cả ảnh URL cũ (keepImages) lẫn ảnh File mới (_svImageFiles) */
    function svRenderAllPreviews() {
        const container = document.getElementById('sv-img-previews');
        if (!container) return;
        container.innerHTML = '';

        // Ảnh cũ từ server (URL)
        _svKeepImageUrls.forEach((url, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'sv-img-thumb';
            thumb.innerHTML = `
                <img src="${escHtml(url)}" alt="Ảnh hiện tại" loading="lazy">
                <span class="sv-img-thumb-badge">Hiện tại</span>
                <button class="sv-img-thumb-del" title="Xóa ảnh này" onclick="svRemoveKeepImage(${idx})">
                    <i class="fas fa-times"></i>
                </button>`;
            container.appendChild(thumb);
        });

        // Ảnh mới người dùng vừa chọn (File)
        _svImageFiles.forEach((file, idx) => {
            const url   = URL.createObjectURL(file);
            const thumb = document.createElement('div');
            thumb.className = 'sv-img-thumb';
            thumb.innerHTML = `
                <img src="${url}" alt="${escHtml(file.name)}" loading="lazy">
                <span class="sv-img-thumb-badge sv-img-thumb-badge--new">Mới</span>
                <button class="sv-img-thumb-del" title="Xóa ảnh" onclick="svRemoveImage(${idx})">
                    <i class="fas fa-times"></i>
                </button>`;
            container.appendChild(thumb);
        });
    }

    window.svRemoveImage = function (idx) {
        _svImageFiles.splice(idx, 1);
        svRenderAllPreviews();
    };

    window.svRemoveKeepImage = function (idx) {
        _svKeepImageUrls.splice(idx, 1);
        svRenderAllPreviews();
    };

    /* ================================================================== */
    /*  MODAL – GỬI FORM                                                    */
    /* ================================================================== */
    window.svSubmitService = async function () {
        const activePill = document.querySelector('#sv-type-bar .sv-type-pill.active');
        const type       = activePill ? activePill.dataset.type : '';
        const isLaundry  = (type === 'Dịch vụ giặt ủi');

        let name, price, description;

        if (isLaundry) {
            // Lấy data từ panel giặt ủi
            name        = (document.getElementById('sv-laundry-type')?.value || '').trim();
            price       = document.getElementById('sv-laundry-weight')?.value;
            description = (document.getElementById('sv-laundry-note')?.value || '').trim();
        } else {
            // Lấy data từ form chung
            name        = (document.getElementById('sv-input-name')?.value || '').trim();
            price       = document.getElementById('sv-input-price')?.value;
            description = (document.getElementById('sv-input-description')?.value || '').trim();
        }

        const status = document.getElementById('sv-input-status')?.value || 'true';

        // Validate
        if (!name) {
            svShake(isLaundry ? 'sv-laundry-type' : 'sv-input-name');
            svShowToast('Vui lòng nhập tên dịch vụ.', 'warning');
            return;
        }
        if (!price || Number(price) < 0) {
            svShake(isLaundry ? 'sv-laundry-weight' : 'sv-input-price');
            svShowToast('Vui lòng nhập giá hợp lệ.', 'warning');
            return;
        }

        // Build FormData
        const fd = new FormData();
        fd.append('type',        type);
        fd.append('name',        name);
        fd.append('description', description);
        fd.append('price',       price);
        fd.append('active',      status === 'true');
        _svImageFiles.forEach(f => fd.append('images', f));
        // Gửi danh sách URL ảnh cũ cần giữ lại (chỉ khi update)
        if (_svMode === 'update') {
            _svKeepImageUrls.forEach(url => fd.append('keepImages', url));
        }

        // UI loading
        const submitBtn = document.getElementById('sv-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
        }

        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: 'Bearer ' + token } : {};

            let res;
            if (_svMode === 'update') {
                if (!_svEditId) {
                    svShowToast('Vui lòng tìm kiếm dịch vụ trước khi lưu.', 'warning');
                    return;
                }
                res = await fetch(`/api/v1/services/${_svEditId}`, {
                    method:  'PUT',
                    headers: headers,
                    body:    fd,
                });
            } else {
                res = await fetch('/api/v1/services/add', {
                    method:  'POST',
                    headers: headers,
                    body:    fd,
                });
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            svCloseModal();
            const msg = _svMode === 'update'
                ? `Đã cập nhật dịch vụ "${name}" thành công!`
                : `Đã đăng ký dịch vụ "${name}" thành công!`;
            svShowToast(msg, 'success');

        } catch (err) {
            console.error('[service.js] Lỗi khi thêm dịch vụ:', err);
            svShowToast('Đăng ký thất bại. Vui lòng thử lại.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            }
        }
    };

    /* ================================================================== */
    /*  MODAL – RESET                                                        */
    /* ================================================================== */
    function svResetModal() {
        ['sv-input-name', 'sv-input-price', 'sv-input-description']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

        document.querySelectorAll('#sv-type-bar .sv-type-pill').forEach((p, i) => p.classList.toggle('active', i === 0));

        const status = document.getElementById('sv-input-status');
        if (status) status.value = 'true';

        const previews = document.getElementById('sv-img-previews');
        if (previews) previews.innerHTML = '';

        _svImageFiles    = [];
        _svKeepImageUrls = [];
    }

    /* ================================================================== */
    /*  Hiệu ứng shake khi validate lỗi                                     */
    /* ================================================================== */
    function svShake(inputId) {
        const el = document.getElementById(inputId);
        if (!el) return;
        el.style.animation = 'none';
        el.style.borderColor = '#ef4444';
        el.style.boxShadow = '0 0 0 4px rgba(239,68,68,0.15)';
        setTimeout(() => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
        }, 1800);
    }

    /* ================================================================== */
    /*  Toast thông báo nhỏ (dùng SweetAlert nếu có, fallback đơn giản)     */
    /* ================================================================== */
    function svShowToast(message, type) {
        if (typeof Swal !== 'undefined') {
            const icons = { success: 'success', warning: 'warning', error: 'error' };
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: icons[type] || 'info',
                title: message,
                showConfirmButton: false,
                timer: 2800,
                timerProgressBar: true,
            });
        } else {
            alert(message);
        }
    }

    /* ================================================================== */
    /*  Render bảng phòng                                                   */
    /* ================================================================== */
    function svRender(rooms) {
        const tbody      = document.getElementById('svTableBody');
        const emptyState = document.getElementById('svEmptyState');

        if (!tbody) return;

        if (!rooms || rooms.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = rooms.map((room) => {
            const roomName     = escHtml(room.name        || '—');
            const customerName = escHtml(room.nameCutomer || '—');
            const bookingId    = room.id ?? '—';
            const initial      = customerName.charAt(0).toUpperCase() || '?';

            return `
            <tr data-room-id="${bookingId}">
                <td>${bookingId}</td>
                <td>
                    <span class="sv-room-badge">
                        <i class="fas fa-door-open"></i>
                        ${roomName}
                    </span>
                </td>
                <td>
                    <div class="sv-customer">
                        <span class="sv-avatar">${initial}</span>
                        ${customerName}
                    </div>
                </td>
                <td>
                    <button
                        class="sv-add-service-btn"
                        onclick="svOpenOrderModal(${bookingId}, '${roomName}')"
                        title="Đặt dịch vụ cho phòng ${roomName}"
                    >
                        <i class="fas fa-plus"></i>
                        Add dịch vụ
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    /* ------------------------------------------------------------------ */
    /*  Hiển thị lỗi trong bảng                                             */
    /* ------------------------------------------------------------------ */
    function svRenderError(message) {
        const tbody = document.getElementById('svTableBody');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="sv-empty" style="color:#ef4444;">
                    <i class="fas fa-exclamation-circle"></i> ${escHtml(message)}
                </td>
            </tr>`;
    }

    /* ------------------------------------------------------------------ */
    /*  Loading spinner                                                      */
    /* ------------------------------------------------------------------ */
    function svSetLoading(isLoading) {
        const tbody = document.getElementById('svTableBody');
        if (!tbody) return;
        if (isLoading) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="sv-empty">
                        <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                    </td>
                </tr>`;
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Tiện ích: escape HTML để tránh XSS                                  */
    /* ------------------------------------------------------------------ */
    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ------------------------------------------------------------------ */
    /*  Drag-and-drop cho upload zone                                        */
    /* ------------------------------------------------------------------ */
    document.addEventListener('DOMContentLoaded', function () {
        const zone = document.getElementById('sv-upload-zone');
        if (!zone) return;

        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (e.dataTransfer?.files?.length) svHandleImages(e.dataTransfer.files);
        });
    });

    /* ================================================================== */
    /*  PANEL GIẶT ỦI                                                       */
    /*  – Hiện/ẩn panel khi chọn tab "Dịch vụ giặt ủi"                     */
    /*  – Live preview tóm tắt thông tin giặt                               */
    /*  – Reset panel khi đóng modal                                        */
    /* ================================================================== */
    (function initLaundryPanel() {
        const LAUNDRY_TYPE = 'Dịch vụ giặt ủi';

        /* ── Hiện/ẩn panel ── */
        function svLaundryTogglePanel(type) {
            const panel      = document.getElementById('sv-panel-laundry');
            const commonInfo = document.getElementById('sv-common-info');
            if (!panel) return;
            const isLaundry = (type === LAUNDRY_TYPE);
            panel.style.display      = isLaundry ? 'block' : 'none';
            if (commonInfo) commonInfo.style.display = isLaundry ? 'none' : '';
            if (isLaundry) svLaundryUpdatePreview();
        }

        /* ── Wrap svPickType để hook show/hide panel ── */
        function hookSvPickType() {
            const _orig = window.svPickType;
            window.svPickType = function (btn) {
                if (typeof _orig === 'function') _orig(btn);
                const type = btn ? btn.getAttribute('data-type') : '';
                svLaundryTogglePanel(type);
            };
        }

        /* ── Live preview ── */
        window.svLaundryUpdatePreview = function () {
            const type     = document.getElementById('sv-laundry-type')?.value     || '';
            const price    = document.getElementById('sv-laundry-weight')?.value   || '';
            const duration = document.getElementById('sv-laundry-duration')?.value || '';
            const express  = document.getElementById('sv-laundry-express')?.checked;
            const delivery = document.getElementById('sv-laundry-delivery')?.checked;

            const preview = document.getElementById('sv-laundry-preview');
            const preText = document.getElementById('sv-laundry-preview-text');
            if (!preview || !preText) return;

            if (!type) { preview.style.display = 'none'; return; }

            const parts = [type];
            if (price)    parts.push(new Intl.NumberFormat('vi-VN').format(price) + ' ₫');
            if (duration) parts.push(`hoàn thành trong ${duration}h`);
            if (express)  parts.push('dịch vụ khẩn');
            if (delivery) parts.push('giao tận phòng');

            preText.textContent = parts.join(' · ');
            preview.style.display = 'block';
        };

        /* ── Reset toàn bộ panel ── */
        function svLaundryReset() {
            ['sv-laundry-type', 'sv-laundry-unit', 'sv-laundry-duration'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.value = (el.tagName === 'SELECT' && el.options.length) ? el.options[0].value : '';
            });
            ['sv-laundry-weight', 'sv-laundry-note'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            ['sv-laundry-express', 'sv-laundry-delivery', 'sv-laundry-fold', 'sv-laundry-eco'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.checked = false;
            });
            const preview = document.getElementById('sv-laundry-preview');
            if (preview) preview.style.display = 'none';
        }

        /* ── Wrap svCloseModal để reset panel khi đóng ── */
        function hookSvCloseModal() {
            const _origClose = window.svCloseModal;
            window.svCloseModal = function () {
                if (typeof _origClose === 'function') _origClose();
                svLaundryReset();
                const panel = document.getElementById('sv-panel-laundry');
                if (panel) panel.style.display = 'none';
                const commonInfo = document.getElementById('sv-common-info');
                if (commonInfo) commonInfo.style.display = '';
            };
        }

        /* ── Gắn event listeners live preview ── */
        function bindEvents() {
            ['sv-laundry-type', 'sv-laundry-unit', 'sv-laundry-duration',
                'sv-laundry-weight', 'sv-laundry-express', 'sv-laundry-delivery'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.addEventListener('change', window.svLaundryUpdatePreview);
                if (el.type === 'number' || el.type === 'text') el.addEventListener('input', window.svLaundryUpdatePreview);
            });
        }

        /* ── Init ── */
        function init() {
            bindEvents();
            hookSvPickType();
            hookSvCloseModal();

            /* Nếu tab Giặt ủi đang active ngay lúc mở → hiện panel */
            const activeBtn = document.querySelector('#sv-type-bar .sv-type-pill.active');
            if (activeBtn && activeBtn.getAttribute('data-type') === LAUNDRY_TYPE) {
                const panel = document.getElementById('sv-panel-laundry');
                if (panel) panel.style.display = 'block';
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            setTimeout(init, 0);
        }
    }());

})();










    /* ══════════ PANEL GIẶT ỦI ══════════
    Hook vào svPickType của service.js để show/hide panel
    và cập nhật live preview
    ═══════════════════════════════════════ */
    (function () {
    'use strict';

    const LAUNDRY_TYPE = 'Dịch vụ giặt ủi';

    /* ── Hiện/ẩn panel theo loại dịch vụ ── */
    function svLaundryTogglePanel(type) {
    const panel = document.getElementById('sv-panel-laundry');
    if (!panel) return;
    const show = (type === LAUNDRY_TYPE);
    panel.style.display = show ? 'block' : 'none';
    if (show) svLaundryUpdatePreview();
}

    /* ── Ghi đè / wrap svPickType sau khi service.js load ── */
    function hookSvPickType() {
    const _orig = window.svPickType;
    window.svPickType = function (btn) {
    if (typeof _orig === 'function') _orig(btn);
    const type = btn ? btn.getAttribute('data-type') : '';
    svLaundryTogglePanel(type);
};
}

    /* ── Live preview ── */
    function svLaundryUpdatePreview() {
    const type     = document.getElementById('sv-laundry-type')?.value      || '';
    const unit     = document.getElementById('sv-laundry-unit')?.value      || 'kg';
    const weight   = document.getElementById('sv-laundry-weight')?.value    || '';
    const duration = document.getElementById('sv-laundry-duration')?.value  || '';
    const express  = document.getElementById('sv-laundry-express')?.checked;
    const delivery = document.getElementById('sv-laundry-delivery')?.checked;

    const preview  = document.getElementById('sv-laundry-preview');
    const preText  = document.getElementById('sv-laundry-preview-text');
    if (!preview || !preText) return;

    if (!type) { preview.style.display = 'none'; return; }

    let parts = [type];
    if (weight) parts.push(`${weight} ${unit}`);
    if (duration) parts.push(`hoàn thành trong ${duration}h`);
    if (express) parts.push('dịch vụ khẩn');
    if (delivery) parts.push('giao tận phòng');

    preText.textContent = parts.join(' · ');
    preview.style.display = 'block';
}

    /* ── Đồng bộ suffix đơn vị vào ô định lượng ── */
    function syncUnitSuffix() {
    const unitEl  = document.getElementById('sv-laundry-unit');
    const suffix  = document.getElementById('sv-laundry-unit-suffix');
    if (unitEl && suffix) suffix.textContent = unitEl.value || 'kg';
}

    /* ── Reset panel khi đóng modal ── */
    function svLaundryReset() {
    ['sv-laundry-type','sv-laundry-unit','sv-laundry-duration'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = el.tagName === 'SELECT' && el.options.length ? el.options[0].value : '';
});
    ['sv-laundry-weight','sv-laundry-note'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
});
    ['sv-laundry-express','sv-laundry-delivery','sv-laundry-fold','sv-laundry-eco'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
});
    const preview = document.getElementById('sv-laundry-preview');
    if (preview) preview.style.display = 'none';
    syncUnitSuffix();
}

    /* ── Gắn sự kiện live preview ── */
    function bindEvents() {
    ['sv-laundry-type','sv-laundry-unit','sv-laundry-duration',
    'sv-laundry-weight','sv-laundry-express','sv-laundry-delivery'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', svLaundryUpdatePreview);
    if (el && el.type === 'number') el.addEventListener('input', svLaundryUpdatePreview);
});

    /* Sync suffix khi đổi đơn vị */
    const unitEl = document.getElementById('sv-laundry-unit');
    if (unitEl) unitEl.addEventListener('change', syncUnitSuffix);
}

    /* ── Hook svCloseModal để reset ── */
    function hookSvCloseModal() {
    const _origClose = window.svCloseModal;
    window.svCloseModal = function () {
    if (typeof _origClose === 'function') _origClose();
    svLaundryReset();
    const panel = document.getElementById('sv-panel-laundry');
    if (panel) panel.style.display = 'none';
};
}

    /* ── Init sau khi DOM + service.js sẵn sàng ── */
    function init() {
    bindEvents();
    hookSvPickType();
    hookSvCloseModal();
    syncUnitSuffix();

    /* Nếu tab Giặt ủi đang active ngay lúc mở → hiện panel */
    const activeBtn = document.querySelector('#sv-type-bar .sv-type-pill.active');
    if (activeBtn && activeBtn.getAttribute('data-type') === LAUNDRY_TYPE) {
    document.getElementById('sv-panel-laundry').style.display = 'block';
}
}

    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    /* service.js có thể chưa load xong → chờ 1 tick */
    setTimeout(init, 0);
}
})();





(function () {
    'use strict';

    let _svOrderBookingId = null;
    let _svOrderRoomName  = '';
    let _svOrderAll       = [];   // toàn bộ danh sách từ API
    let _svOrderFiltered  = [];   // sau khi lọc
    let _svOrderQty       = {};   // { serviceId: quantity }
    let _svOrderActiveType = 'ALL'; // tab đang chọn

    /* ---------- MỞ MODAL ---------- */
    window.svOpenOrderModal = async function (bookingId, roomName) {
        _svOrderBookingId = bookingId;
        _svOrderRoomName  = roomName;
        _svOrderQty       = {};

        const sub = document.getElementById('sv-order-banner-sub');
        if (sub) sub.textContent = `Booking #${bookingId}  ·  Phòng: ${roomName}`;

        _svOrderActiveType = 'ALL';

        svOrderSummaryUpdate();

        const overlay = document.getElementById('sv-order-overlay');
        overlay.style.display = 'flex';

        await svOrderLoad();
    };

    /* ---------- ĐÓNG ---------- */
    window.svOrderClose = function () {
        document.getElementById('sv-order-overlay').style.display = 'none';
    };

    /* ---------- LOAD DANH SÁCH TỪ API ---------- */
    async function svOrderLoad() {
        svOrderListHtml('<div style="text-align:center;padding:40px 0;color:#94a3b8;"><i class="fas fa-spinner fa-spin" style="font-size:22px;margin-bottom:10px;display:block;"></i>Đang tải...</div>');
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('/api/v1/services', {
                headers: token ? { Authorization: 'Bearer ' + token } : {}
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            _svOrderAll = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
            _svOrderFiltered = [..._svOrderAll];
            svOrderRenderTabs();
            svOrderRender();
        } catch (e) {
            svOrderListHtml('<div style="text-align:center;padding:40px 0;color:#ef4444;"><i class="fas fa-exclamation-circle" style="font-size:22px;margin-bottom:10px;display:block;"></i>Không thể tải dịch vụ. Thử lại sau.</div>');
        }
    }

    /* ---------- ICON THEO TYPE ---------- */
    function svTypeIcon(t) {
        if (!t || t === 'ALL')  return 'fas fa-th-large';
        const l = t.toLowerCase();
        if (l.includes('ăn') || l.includes('uống') || l.includes('food')) return 'fas fa-utensils';
        if (l.includes('giặt') || l.includes('ủi') || l.includes('laundry')) return 'fas fa-tshirt';
        if (l.includes('spa') || l.includes('massage'))  return 'fas fa-spa';
        if (l.includes('đưa đón') || l.includes('transfer')) return 'fas fa-car';
        if (l.includes('thuê xe') || l.includes('xe'))   return 'fas fa-motorcycle';
        return 'fas fa-concierge-bell';
    }

    /* ---------- RENDER TABS ---------- */
    function svOrderRenderTabs() {
        const types  = ['ALL', ...new Set(_svOrderAll.map(s => s.type || 'Khác').filter(Boolean))];
        const tabsEl = document.getElementById('sv-order-tabs');
        if (!tabsEl) return;
        tabsEl.innerHTML = types.map(t => {
            const active = t === _svOrderActiveType;
            const label  = t === 'ALL' ? 'Tất cả' : t;
            return `<button type="button"
                class="sv-type-pill${active ? ' active' : ''}"
                data-sv-tab="${t}"
                onclick="svOrderFilterByType('${t}')"
            ><i class="${svTypeIcon(t)}"></i> ${label}</button>`;
        }).join('');
    }

    /* ---------- LỌC THEO TYPE ---------- */
    window.svOrderFilterByType = function (type) {
        _svOrderActiveType = type;
        svOrderApplyFilter();
        svOrderRenderTabs();
        svOrderRender();
    };

    /* ---------- TÌM KIẾM ---------- */
    window.svOrderSearch = function (kw) {
        svOrderApplyFilter(kw);
        svOrderRender();
    };

    /* ---------- ÁP DỤNG CẢ 2 BỘ LỌC ---------- */
    function svOrderApplyFilter(kw) {
        const search = (kw !== undefined ? kw : (document.getElementById('sv-order-search') || {}).value || '').toLowerCase().trim();
        _svOrderFiltered = _svOrderAll.filter(s => {
            const matchType = _svOrderActiveType === 'ALL' || (s.type || 'Khác') === _svOrderActiveType;
            const matchKw   = !search || (s.name || '').toLowerCase().includes(search);
            return matchType && matchKw;
        });
    }

    /* ---------- RENDER DANH SÁCH ---------- */
    function svOrderRender() {
        if (!_svOrderFiltered.length) {
            svOrderListHtml('<div style="text-align:center;padding:32px 0;color:#94a3b8;font-size:13px;"><i class="fas fa-search" style="font-size:20px;display:block;margin-bottom:8px;"></i>Không tìm thấy dịch vụ nào.</div>');
            return;
        }

        const html = _svOrderFiltered.map(s => {
            const img    = (Array.isArray(s.images) && s.images[0]) ? s.images[0] : '';
            const price  = new Intl.NumberFormat('vi-VN').format(s.price || 0);
            const qty    = _svOrderQty[s.id] || 0;

            // Kiểm tra xem có phải dịch vụ giặt ủi không
            const isLaundry = (s.type || '').toLowerCase().includes('giặt') ||
                (s.type || '').toLowerCase().includes('ủi') ||
                (s.type || '').toLowerCase().includes('laundry');

            const isSelected = _svOrderQty[s.id] ? true : false;

            // ===== DỊCH VỤ GIẶT ỦI: CLICK TOGGLE (BỎ SỐ LƯỢNG) =====
            if (isLaundry) {
                return `
            <div onclick="svOrderToggleService(${s.id})"
                 style="display:flex;align-items:center;gap:14px;padding:12px 14px;
                        border:1.5px solid ${isSelected ? '#2563eb' : '#e2e8f0'};
                        border-radius:16px;
                        background:${isSelected ? '#eff6ff' : '#fafbff'};
                        transition:border-color .15s,box-shadow .15s,background .15s;
                        cursor:pointer;position:relative;"
                 onmouseover="this.style.borderColor='#bfdbfe';this.style.boxShadow='0 2px 12px rgba(37,99,235,0.08)'"
                 onmouseout="this.style.borderColor='${isSelected ? '#2563eb' : '#e2e8f0'}';this.style.boxShadow='none'">

                <!-- Ảnh -->
                <div style="width:60px;height:60px;border-radius:12px;overflow:hidden;flex-shrink:0;
                            background:#f1f5f9;display:flex;align-items:center;justify-content:center;position:relative;">
                    ${img
                    ? `<img src="${img}" alt="${s.name}" style="width:100%;height:100%;object-fit:cover;">`
                    : `<i class="fas fa-concierge-bell" style="color:#94a3b8;font-size:22px;"></i>`
                }
                    ${isSelected ? `<div style="position:absolute;inset:0;background:rgba(37,99,235,0.15);display:flex;align-items:center;justify-content:center;">
                                    <i class="fas fa-check" style="color:#2563eb;font-size:24px;font-weight:900;"></i>
                                </div>` : ''}
                </div>

                <!-- Thông tin -->
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:2px;
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name || '—'}</div>
                    <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${s.type || ''}</div>
                    <div style="font-size:13px;font-weight:800;color:#2563eb;">${price} ₫</div>
                </div>

                <!-- Dấu hiệu chọn -->
                ${isSelected ? `<div style="width:32px;height:32px;border-radius:50%;background:#2563eb;
                                            display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                    <i class="fas fa-check" style="color:#fff;font-size:16px;font-weight:900;"></i>
                                </div>` : ''}
            </div>`;
            }

            // ===== DỊCH VỤ KHÁC: GIỮ NÚT +/- NHƯ CŨ =====
            return `
            <div style="display:flex;align-items:center;gap:14px;padding:12px 14px;
                        border:1.5px solid #e2e8f0;border-radius:16px;background:#fafbff;
                        transition:border-color .15s,box-shadow .15s;"
                 onmouseover="this.style.borderColor='#bfdbfe';this.style.boxShadow='0 2px 12px rgba(37,99,235,0.08)'"
                 onmouseout="this.style.borderColor='#e2e8f0';this.style.boxShadow='none'">

                <!-- Ảnh -->
                <div style="width:60px;height:60px;border-radius:12px;overflow:hidden;flex-shrink:0;
                            background:#f1f5f9;display:flex;align-items:center;justify-content:center;">
                ${img
                ? `<img src="${img}" alt="${s.name}" style="width:100%;height:100%;object-fit:cover;">`
                : `<i class="fas fa-concierge-bell" style="color:#94a3b8;font-size:22px;"></i>`
            }
                </div>

                    <!-- Thông tin -->
                <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:2px;
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name || '—'}</div>
                <div style="font-size:11px;color:#64748b;margin-bottom:4px;">${s.type || ''}</div>
                <div style="font-size:13px;font-weight:800;color:#2563eb;">${price} ₫</div>
                </div>

                <!-- Bộ chọn số lượng (nút +/-) -->
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                <button onclick="svOrderChangeQty(${s.id}, -1)"
                style="width:30px;height:30px;border-radius:8px;border:1.5px solid #e2e8f0;
                                   background:#fff;font-size:16px;font-weight:700;color:#64748b;
                                   cursor:pointer;display:flex;align-items:center;justify-content:center;
                                   transition:background .1s;" ${qty === 0 ? 'disabled style="width:30px;height:30px;border-radius:8px;border:1.5px solid #e2e8f0;background:#f8fafc;font-size:16px;font-weight:700;color:#cbd5e1;cursor:not-allowed;display:flex;align-items:center;justify-content:center;"' : ''}>−</button>

                <span id="sv-order-qty-${s.id}"
                style="min-width:28px;text-align:center;font-size:14px;font-weight:800;
                                 color:${qty > 0 ? '#2563eb' : '#94a3b8'};">${qty}</span>

                <button onclick="svOrderChangeQty(${s.id}, 1)"
                style="width:30px;height:30px;border-radius:8px;border:1.5px solid #2563eb;
                                   background:linear-gradient(135deg,#2563eb,#1d4ed8);font-size:16px;font-weight:700;
                                   color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;
                                   transition:opacity .1s;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">+</button>
                </div>
                </div>`;
        }).join('');

        svOrderListHtml(html);
    }

    /* ---------- TOGGLE DỊCH VỤ GIẶT ỦI (CHỌN/BỎ CHỌN) ---------- */
    window.svOrderToggleService = function (serviceId) {
        const isSelected = _svOrderQty[serviceId] ? true : false;
        if (isSelected) {
            delete _svOrderQty[serviceId];
        } else {
            _svOrderQty[serviceId] = 1; // Mặc định là 1 cho giặt ủi
        }

        // Re-render danh sách để cập nhật visual
        svOrderRender();
        svOrderSummaryUpdate();
    };

    /* ---------- THAY ĐỔI SỐ LƯỢNG ---------- */
    window.svOrderChangeQty = function (serviceId, delta) {
        const current = _svOrderQty[serviceId] || 0;
        const next    = Math.max(0, current + delta);
        if (next === 0) delete _svOrderQty[serviceId];
        else _svOrderQty[serviceId] = next;

        // Cập nhật inline không cần re-render toàn bộ
        const qtyEl = document.getElementById('sv-order-qty-' + serviceId);
        if (qtyEl) {
            qtyEl.textContent = next;
            qtyEl.style.color = next > 0 ? '#2563eb' : '#94a3b8';
        }

        svOrderSummaryUpdate();
    };

    /* ---------- CẬP NHẬT TÓM TẮT ---------- */
    function svOrderSummaryUpdate() {
        const ids  = Object.keys(_svOrderQty);
        const box  = document.getElementById('sv-order-summary');
        const lines= document.getElementById('sv-order-summary-lines');
        const tot  = document.getElementById('sv-order-total');

        if (!ids.length) {
            if (box) box.style.display = 'none';
            return;
        }

        let total = 0;
        const lineHtml = ids.map(id => {
            const svc = _svOrderAll.find(s => String(s.id) === String(id));
            if (!svc) return '';
            const qty     = _svOrderQty[id];
            const subtotal= (svc.price || 0) * qty;
            total += subtotal;
            return `<div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;">
                <span>${svc.name} × ${qty}</span>
                <span style="font-weight:600;">${new Intl.NumberFormat('vi-VN').format(subtotal)} ₫</span>
                </div>`;
        }).join('');

        if (lines) lines.innerHTML = lineHtml;
        if (tot)   tot.textContent = new Intl.NumberFormat('vi-VN').format(total) + ' ₫';
        if (box)   box.style.display = 'block';
    }

    /* ---------- ĐẶT HÀNG ---------- */
    // API: POST /api/v1/orders  — @ModelAttribute OrderRequest { bookingId, serviceId, quantity }
    // Mỗi sản phẩm được chọn → gửi 1 request riêng (song song)
    window.svOrderSubmit = async function () {
        const ids = Object.keys(_svOrderQty);
        if (!ids.length) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'warning', title: 'Chưa chọn dịch vụ',
                    text: 'Vui lòng chọn ít nhất 1 dịch vụ.', confirmButtonColor: '#2563eb' });
            } else alert('Vui lòng chọn ít nhất 1 dịch vụ.');
            return;
        }

        const btn = document.getElementById('sv-order-submit-btn');
        if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }

        try {
            const token = localStorage.getItem('accessToken');
            const headers = token ? { Authorization: 'Bearer ' + token } : {};

            // Gửi song song — mỗi dịch vụ 1 request POST /api/v1/orders
            const requests = ids.map(id => {
                const fd = new FormData();
                fd.append('bookingId', _svOrderBookingId);
                fd.append('serviceId', id);
                fd.append('quantity',  _svOrderQty[id]);
                return fetch('/api/v1/orders', {
                    method:  'POST',
                    headers: headers,
                    body:    fd
                });
            });

            const results = await Promise.all(requests);
            const failed  = results.filter(r => !r.ok);

            if (failed.length > 0) {
                throw new Error(`${failed.length} đơn gửi thất bại`);
            }

            svOrderClose();
            if (typeof Swal !== 'undefined') {
                Swal.fire({ toast:true, position:'top-end', icon:'success',
                    title: `Đặt ${ids.length} dịch vụ thành công!`,
                    showConfirmButton:false, timer:2500, timerProgressBar:true });
            }
        } catch (e) {
            console.error('[svOrderSubmit]', e);
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon:'error', title:'Lỗi', text: e.message || 'Đặt dịch vụ thất bại. Vui lòng thử lại.',
                    confirmButtonColor:'#2563eb' });
            } else alert('Đặt dịch vụ thất bại: ' + e.message);
        } finally {
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        }
    };

    /* ---------- HELPER ---------- */
    function svOrderListHtml(html) {
        const el = document.getElementById('sv-order-list');
        if (el) el.innerHTML = html;
    }
})();
