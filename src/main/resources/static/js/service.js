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
        set('sv-input-name',        data.name);
        set('sv-input-price',       data.price);
        set('sv-input-description', data.description);

        // Status
        const statusEl = document.getElementById('sv-input-status');
        if (statusEl) statusEl.value = String(data.active ?? data.status ?? true);

        // Pill bar loại dịch vụ
        if (data.type) {
            let matched = false;
            document.querySelectorAll('#sv-type-bar .sv-type-pill').forEach(p => {
                const isMatch = p.dataset.type === data.type;
                p.classList.toggle('active', isMatch);
                if (isMatch) matched = true;
            });
            // Nếu không khớp pill nào, giữ pill đầu tiên
            if (!matched) document.querySelectorAll('#sv-type-bar .sv-type-pill')[0]?.classList.add('active');
        }

        // Ảnh cũ từ server: hiển thị preview URL, lưu lại để gửi keepImages
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
        const name        = (document.getElementById('sv-input-name')?.value || '').trim();
        const price       = document.getElementById('sv-input-price')?.value;
        const description = (document.getElementById('sv-input-description')?.value || '').trim();
        const status      = document.getElementById('sv-input-status')?.value || 'true';
        const createdAt   = '';
        const activePill  = document.querySelector('#sv-type-bar .sv-type-pill.active');
        const type        = activePill ? activePill.dataset.type : '';

        // Validate
        if (!name) {
            svShake('sv-input-name');
            svShowToast('Vui lòng nhập tên dịch vụ.', 'warning');
            return;
        }
        if (!price || Number(price) < 0) {
            svShake('sv-input-price');
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

})();