// ===== ROOM TYPES =====
document.addEventListener("DOMContentLoaded", function() {
    fetchRoomTypes();
});

// ===== CLEAR PREVIEW / RESET FORM =====
function clearPreview() {
    const deleteBtn = document.getElementById('btnDelete');
    if (deleteBtn) {
        deleteBtn.classList.add('hidden');
        deleteBtn.style.display = 'none';
    }
    const roomIdEl = document.getElementById('roomId');
    if (roomIdEl) {
        roomIdEl.value = '';
    }
}

async function fetchRoomTypes() {
    const selectElement = document.getElementById('roomTypeSelect');
    try {
        const response = await fetch('/api/v1/roomtypes');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        const roomTypes = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : null;
        if (!roomTypes || roomTypes.length === 0) {
            selectElement.innerHTML = '<option value="">Chưa có loại phòng</option>';
            return;
        }
        selectElement.innerHTML = '<option value="">-- Chọn loại phòng --</option>';
        roomTypes.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type.id;
            opt.textContent = type.type + (type.capacity ? ' (tối đa ' + type.capacity + ' người)' : '');
            selectElement.appendChild(opt);
        });
        return roomTypes;
    } catch (error) {
        console.error('[fetchRoomTypes] Lỗi:', error.message);
        selectElement.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        return [];
    }
}

// ===== TẢI DỮ LIỆU PHÒNG =====
async function fetchRoomDetail() {
    const idInput = document.getElementById('inputSearchId');
    const roomId = idInput ? idInput.value.trim() : '';
    if (!roomId) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập ID phòng!'); if (idInput) idInput.focus(); return; }
    const btn = document.querySelector('[onclick="fetchRoomDetail()"]');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...'; }
    try {
        const res = await fetch('/api/v1/rooms/id?id=' + roomId);
        if (res.status === 404) throw new Error('Không tìm thấy phòng có ID: ' + roomId);
        if (!res.ok) throw new Error('Lỗi server: ' + res.status);
        const json = await res.json();
        const room = json.data || json;
        const roomIdEl = document.getElementById('roomId');
        if (roomIdEl) roomIdEl.value = room.id || roomId;
        const nameInput = document.querySelector('input[name="name"]');
        if (nameInput) nameInput.value = room.name || '';
        const statusSelect = document.getElementById('roomStatusSelect') || document.querySelector('select[name="status"]');
        if (statusSelect) {
            // room.status có thể là string 'AVAILABLE' hoặc object {name:'AVAILABLE'}
            const statusVal = typeof room.status === 'object' && room.status !== null
                ? room.status.name || room.status
                : room.status;
            console.log('[fetchRoomDetail] status từ API:', statusVal);
            if (statusVal) {
                statusSelect.value = String(statusVal).trim();
                // Nếu không khớp option nào thì log ra để debug
                const matched = [...statusSelect.options].some(o => o.value === String(statusVal).trim());
                if (!matched) console.warn('[fetchRoomDetail] Không tìm thấy option status:', statusVal);
            }
        }
        const typeSelect = document.getElementById('roomTypeSelect');
        const typeId = room.type_room_id || room.roomType?.id || room.roomTypeId || null;
        if (typeSelect && typeId) {
            if (typeSelect.options.length <= 1) await fetchRoomTypes();
            typeSelect.value = String(typeId);
        }
        const workBranchSelect = document.getElementById('workBranchSelect');
        if (workBranchSelect && room.workBranch) { workBranchSelect.value = room.workBranch; }

        // Hiển thị nút Delete khi có roomId
        const deleteBtn = document.getElementById('btnDelete');
        if (deleteBtn) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.style.display = 'inline-flex';
        }

        showToast('success', 'Tải thành công', 'Đã tải dữ liệu phòng #' + roomId);
    } catch (err) {
        showToast('error', 'Thất bại', err.message || 'Không thể tải dữ liệu phòng');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = originalHtml; }
    }
}

// ===== FORM SUBMIT =====
document.getElementById('addRoomForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const roomId = document.getElementById('roomId')?.value?.trim();
    const isUpdate = !!roomId;

    const workBranchVal = document.getElementById('workBranchSelect')?.value;
    if (!workBranchVal) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng chọn chi nhánh làm việc!');
        document.getElementById('workBranchSelect')?.focus();
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = isUpdate
        ? '<i class="fas fa-spinner fa-spin"></i> <span>Updating...</span>'
        : '<i class="fas fa-spinner fa-spin"></i> <span>Saving...</span>';

    const payload = new FormData();
    payload.append('name',         form.querySelector('input[name="name"]')?.value?.trim());
    payload.append('status',       form.querySelector('select[name="status"]')?.value);
    payload.append('type_room_id', document.getElementById('roomTypeSelect')?.value);
    payload.append('workBranch',   workBranchVal);

    try {
        const url = isUpdate ? `/api/v1/rooms/update/${roomId}` : '/api/v1/rooms';
        const method = isUpdate ? 'PUT' : 'POST';

        const response = await fetch(url, { method, body: payload });

        // DataConfickException trả plain text, các lỗi khác trả JSON => đọc text trước rồi thử parse
        const rawText = await response.text();
        let errMsg = rawText;
        try {
            const result = JSON.parse(rawText);
            errMsg = result.message
                || result.error
                || (result.errors ? Object.values(result.errors).join(', ') : null)
                || rawText;
        } catch (_) { /* plain text, giữ nguyên */ }

        if (response.ok) {
            showToast('success', isUpdate ? 'Cập nhật thành công!' : 'Thêm phòng thành công!', '');
            form.reset();
        } else {
            showToast('error', `Lỗi ${response.status}`, errMsg);
        }
    } catch (error) {
        showToast('error', 'Lỗi kết nối', 'Không thể kết nối đến Server!');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

// ===== HANDLE DELETE ROOM =====
async function handleDelete() {
    const roomId = document.getElementById('roomId')?.value?.trim();

    if (!roomId) {
        showToast('warning', 'Thiếu thông tin', 'Vui lòng tải dữ liệu phòng trước!');
        return;
    }

    // Xác nhận trước khi xóa
    const confirmDelete = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc chắn muốn xóa phòng #${roomId}? Hành động này không thể hoàn tác.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });

    if (!confirmDelete.isConfirmed) return;

    const deleteBtn = document.getElementById('btnDelete');
    const originalBtnText = deleteBtn.innerHTML;
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Đang xóa...</span>';

    try {
        const response = await fetch(`/api/v1/rooms/delete/${roomId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const rawText = await response.text();
        let errMsg = rawText;
        try {
            const result = JSON.parse(rawText);
            errMsg = result.message
                || result.error
                || (result.errors ? Object.values(result.errors).join(', ') : null)
                || rawText;
        } catch (_) { /* plain text, giữ nguyên */ }

        if (response.ok) {
            showToast('success', 'Xóa thành công!', 'Phòng đã được xóa.');
            // Reset form sau khi xóa thành công
            document.getElementById('addRoomForm').reset();
            document.getElementById('roomId').value = '';
            deleteBtn.classList.add('hidden');
            deleteBtn.style.display = 'none';
            clearPreview();
        } else {
            showToast('error', `Lỗi ${response.status}`, errMsg);
        }
    } catch (error) {
        showToast('error', 'Lỗi kết nối', 'Không thể kết nối đến Server!');
        console.error('[handleDelete]', error);
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = originalBtnText;
    }
}