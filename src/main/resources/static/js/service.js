/**
 * service.js
 * Quản lý view "Service Room" — danh sách phòng đang check-in tại chi nhánh.
 *
 * API sử dụng: GET /api/v1/booking/roomservice?workBrach={workBrach}
 * workBrach lấy từ localStorage (key: "workBranch")
 */

(function () {
    'use strict';

    /* ------------------------------------------------------------------ */
    /*  Biến nội bộ                                                         */
    /* ------------------------------------------------------------------ */
    let _svAllRooms = [];   // cache toàn bộ kết quả từ API

    /* ------------------------------------------------------------------ */
    /*  Hàm chính: load dữ liệu từ API                                      */
    /* ------------------------------------------------------------------ */
    window.svLoadRooms = async function () {
        const workBrach = localStorage.getItem('workBranch') || '';

        if (!workBrach) {
            svRenderError('Không tìm thấy thông tin chi nhánh (workBranch) trong localStorage.');
            return;
        }

        svSetLoading(true);

        try {
            const res = await fetch(`/api/v1/booking/roomservice?workBrach=${encodeURIComponent(workBrach)}`);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

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
        if (!kw) {
            svRender(_svAllRooms);
            return;
        }
        const filtered = _svAllRooms.filter(r =>
            (r.name || '').toLowerCase().includes(kw)
        );
        svRender(filtered);
    };

    /* ------------------------------------------------------------------ */
    /*  Render bảng                                                          */
    /* ------------------------------------------------------------------ */
    function svRender(rooms) {
        const tbody        = document.getElementById('svTableBody');
        const emptyState   = document.getElementById('svEmptyState');

        if (!tbody) return;

        if (!rooms || rooms.length === 0) {
            tbody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tbody.innerHTML = rooms.map((room, idx) => {
            const roomName     = escHtml(room.name       || '—');
            const customerName = escHtml(room.nameCutomer || '—');
            const roomId       = room.id ?? '—';
            const initial      = customerName.charAt(0).toUpperCase() || '?';

            return `
            <tr data-room-id="${roomId}">
                <td>${idx + 1}</td>
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
                <td>${roomId}</td>
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

})();