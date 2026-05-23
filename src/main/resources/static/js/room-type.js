// ===== ADD ROOM TYPE LOGIC =====
let _rtCapacity = 2;
let _rtFiles = [];

function rtCharCount(inputId, countId, max) {
    const val = document.getElementById(inputId).value;
    document.getElementById(countId).textContent = val.length;
}

function rtFormatPrice(input) {
    let raw = input.value.replace(/\D/g, '');
    input.value = raw ? new Intl.NumberFormat('vi-VN').format(parseInt(raw)) : '';
    input.dataset.raw = raw;
}

function rtCapChange(delta) {
    _rtCapacity = Math.max(1, Math.min(15, _rtCapacity + delta));
    document.getElementById('rt-cap-num').textContent = _rtCapacity;
    document.getElementById('rt-capacity').value = _rtCapacity;
}

function rtHandleFiles(files) {
    const MAX = 5;
    const grid = document.getElementById('rt-preview-grid');
    Array.from(files).forEach(file => {
        if (_rtFiles.length >= MAX) return;
        _rtFiles.push(file);
        const reader = new FileReader();
        reader.onload = e => {
            const idx = _rtFiles.length - 1;
            const item = document.createElement('div');
            item.className = 'rt-preview-item';
            item.innerHTML = `<img src="${e.target.result}"><button class="rt-preview-remove" onclick="rtRemoveFile(${idx})" type="button"><i class="fas fa-times"></i></button>`;
            grid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function rtRemoveFile(idx) {
    _rtFiles.splice(idx, 1);
    const grid = document.getElementById('rt-preview-grid');
    grid.innerHTML = '';
    const copy = [..._rtFiles];
    _rtFiles = [];
    copy.forEach(f => {
        const reader = new FileReader();
        reader.onload = e => {
            const i = _rtFiles.length;
            _rtFiles.push(f);
            const item = document.createElement('div');
            item.className = 'rt-preview-item';
            item.innerHTML = `<img src="${e.target.result}"><button class="rt-preview-remove" onclick="rtRemoveFile(${i})" type="button"><i class="fas fa-times"></i></button>`;
            grid.appendChild(item);
        };
        reader.readAsDataURL(f);
    });
}

function rtCancel() {
    switchToView('form');
}

async function rtSubmit() {
    const name       = document.getElementById('rt-name').value.trim();
    const amenities  = document.getElementById('rt-amenities').value.trim();
    const priceRaw   = document.getElementById('rt-price').dataset.raw || document.getElementById('rt-price').value.replace(/\D/g,'');
    const desc       = document.getElementById('rt-description').value.trim();
    const capacity   = _rtCapacity;

    if (!name)      { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập tên loại phòng.'); return; }
    if (!priceRaw)  { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập giá mỗi đêm.'); return; }
    if (!amenities) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập nội thất / tiện nghi.'); return; }

    const btn = document.getElementById('rt-btn-save');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    const formData = new FormData();
    formData.append('type', name);
    formData.append('price', priceRaw);
    formData.append('amenities', amenities);
    formData.append('description', desc);
    formData.append('capacity', capacity);
    _rtFiles.forEach((f, i) => formData.append('images', f));

    try {
        const res = await fetch('/api/v1/roomtypes/add', {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(errText || 'Lỗi ' + res.status);
        }
        showToast('success', '✅ Thành công!', `Loại phòng "${name}" đã được tạo.`);
        rtResetForm();
        // Reload room type dropdown nếu có
        if (typeof loadRoomTypes === 'function') loadRoomTypes();
    } catch (err) {
        showToast('error', 'Tạo thất bại', err.message || 'Có lỗi xảy ra.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Lưu loại phòng';
    }
}

function rtResetForm() {
    document.getElementById('rt-name').value = '';
    document.getElementById('rt-price').value = '';
    document.getElementById('rt-price').dataset.raw = '';
    document.getElementById('rt-amenities').value = '';
    document.getElementById('rt-description').value = '';
    document.getElementById('rt-name-count').textContent = '0';
    document.getElementById('rt-amenities-count').textContent = '0';
    document.getElementById('rt-desc-count').textContent = '0';
    document.getElementById('rt-preview-grid').innerHTML = '';
    _rtFiles = [];
    _rtCapacity = 2;
    document.getElementById('rt-cap-num').textContent = '2';
    document.getElementById('rt-capacity').value = '2';
}

// Drag & drop support
const rtZone = document.getElementById('rt-upload-zone');
rtZone.addEventListener('dragover', e => { e.preventDefault(); rtZone.style.borderColor='#3b82f6'; rtZone.style.background='#eff6ff'; });
rtZone.addEventListener('dragleave', () => { rtZone.style.borderColor=''; rtZone.style.background=''; });
rtZone.addEventListener('drop', e => {
    e.preventDefault(); rtZone.style.borderColor=''; rtZone.style.background='';
    rtHandleFiles(e.dataTransfer.files);
});

// ===== UPDATE ROOM TYPE LOGIC =====
let _rtuCapacity = 2;
let _rtuFiles = [];
let _rtuExistingImages = [];

function rtuFormatPrice(input) {
    let raw = input.value.replace(/\D/g, '');
    input.value = raw ? new Intl.NumberFormat('vi-VN').format(parseInt(raw)) : '';
    input.dataset.raw = raw;
}

function rtuCapChange(delta) {
    _rtuCapacity = Math.max(1, Math.min(15, _rtuCapacity + delta));
    document.getElementById('rtu-cap-num').textContent = _rtuCapacity;
    document.getElementById('rtu-capacity').value = _rtuCapacity;
}

function rtuHandleFiles(files) {
    const MAX = 5;
    const grid = document.getElementById('rtu-preview-grid');
    Array.from(files).forEach(file => {
        if (_rtuFiles.length >= MAX) return;
        _rtuFiles.push(file);
        const reader = new FileReader();
        reader.onload = e => {
            const idx = _rtuFiles.length - 1;
            const item = document.createElement('div');
            item.className = 'rt-preview-item';
            item.innerHTML = `<img src="${e.target.result}"><button class="rt-preview-remove" onclick="rtuRemoveNewFile(${idx})" type="button"><i class="fas fa-times"></i></button>`;
            grid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function rtuRemoveNewFile(idx) {
    _rtuFiles.splice(idx, 1);
    const grid = document.getElementById('rtu-preview-grid');
    // Giữ lại ảnh cũ, chỉ re-render ảnh mới
    const existingItems = grid.querySelectorAll('[data-existing]');
    grid.innerHTML = '';
    existingItems.forEach(el => grid.appendChild(el));
    const copy = [..._rtuFiles];
    _rtuFiles = [];
    copy.forEach(f => {
        const reader = new FileReader();
        reader.onload = e => {
            const i = _rtuFiles.length;
            _rtuFiles.push(f);
            const item = document.createElement('div');
            item.className = 'rt-preview-item';
            item.innerHTML = `<img src="${e.target.result}"><button class="rt-preview-remove" onclick="rtuRemoveNewFile(${i})" type="button"><i class="fas fa-times"></i></button>`;
            grid.appendChild(item);
        };
        reader.readAsDataURL(f);
    });
}

function rtuRemoveExistingImage(url) {
    _rtuExistingImages = _rtuExistingImages.filter(u => u !== url);
}

async function rtuFetchById() {
    const id = document.getElementById('rtu-search-id').value.trim();
    if (!id) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập ID loại phòng!'); return; }

    const btn = document.querySelector('[onclick="rtuFetchById()"]');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải...';

    try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`/api/v1/roomtypes/id/${id}`, {
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        });
        if (res.status === 404) throw new Error('Không tìm thấy loại phòng có ID: ' + id);
        if (!res.ok) throw new Error('Lỗi server: ' + res.status);
        const json = await res.json();
        const rt = json.data || json;

        // Điền dữ liệu vào form
        document.getElementById('rtu-id').value = rt.id || id;
        document.getElementById('rtu-name').value = rt.type || '';
        document.getElementById('rtu-name-count').textContent = (rt.type || '').length;
        document.getElementById('rtu-amenities').value = rt.amenities || '';
        document.getElementById('rtu-amenities-count').textContent = (rt.amenities || '').length;
        document.getElementById('rtu-description').value = rt.description || '';
        document.getElementById('rtu-desc-count').textContent = (rt.description || '').length;

        // Giá
        if (rt.price != null) {
            const priceInput = document.getElementById('rtu-price');
            priceInput.value = new Intl.NumberFormat('vi-VN').format(rt.price);
            priceInput.dataset.raw = rt.price;
        }

        // Sức chứa
        _rtuCapacity = rt.capacity || 2;
        document.getElementById('rtu-cap-num').textContent = _rtuCapacity;
        document.getElementById('rtu-capacity').value = _rtuCapacity;

        // Ảnh hiện có
        const grid = document.getElementById('rtu-preview-grid');
        grid.innerHTML = '';
        _rtuFiles = [];
        _rtuExistingImages = Array.isArray(rt.images) ? [...rt.images] : [];
        _rtuExistingImages.forEach(url => {
            const item = document.createElement('div');
            item.className = 'rt-preview-item';
            item.setAttribute('data-existing', url);
            item.innerHTML = `<img src="${url}"><button class="rt-preview-remove" onclick="rtuRemoveExistingImage('${url}');this.closest('.rt-preview-item').remove();" type="button"><i class="fas fa-times"></i></button>`;
            grid.appendChild(item);
        });

        showToast('success', 'Tải thành công', 'Đã tải dữ liệu loại phòng #' + id);
    } catch (err) {
        showToast('error', 'Thất bại', err.message || 'Không thể tải dữ liệu');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

async function rtuSubmit() {
    const id = document.getElementById('rtu-id').value.trim();
    const name = document.getElementById('rtu-name').value.trim();
    const amenities = document.getElementById('rtu-amenities').value.trim();
    const priceRaw = document.getElementById('rtu-price').dataset.raw || document.getElementById('rtu-price').value.replace(/\D/g, '');
    const desc = document.getElementById('rtu-description').value.trim();
    const capacity = _rtuCapacity;

    if (!id)       { showToast('warning', 'Chưa tải dữ liệu', 'Vui lòng tìm kiếm và tải loại phòng trước!'); return; }
    if (!name)     { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập tên loại phòng.'); return; }
    if (!priceRaw) { showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập giá mỗi đêm.'); return; }
    if (!amenities){ showToast('warning', 'Thiếu thông tin', 'Vui lòng nhập nội thất / tiện nghi.'); return; }

    const btn = document.getElementById('rtu-btn-save');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang cập nhật...';

    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('type', name);
    formData.append('price', priceRaw);
    formData.append('amenities', amenities);
    formData.append('description', desc);
    formData.append('capacity', capacity);
    _rtuFiles.forEach(f => formData.append('images', f));

    try {
        const res = await fetch(`/api/v1/roomtypes/${id}`, {
            method: 'PUT',
            headers: token ? { Authorization: 'Bearer ' + token } : {},
            body: formData
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(errText || 'Lỗi ' + res.status);
        }
        showToast('success', '✅ Cập nhật thành công!', `Loại phòng "${name}" đã được cập nhật.`);
    } catch (err) {
        showToast('error', 'Cập nhật thất bại', err.message || 'Có lỗi xảy ra.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Cập nhật loại phòng';
    }
}

// Drag & drop cho update zone
document.addEventListener('DOMContentLoaded', function() {
    const rtuZone = document.getElementById('rtu-upload-zone');
    if (rtuZone) {
        rtuZone.addEventListener('dragover', e => { e.preventDefault(); rtuZone.style.borderColor='#3b82f6'; rtuZone.style.background='#eff6ff'; });
        rtuZone.addEventListener('dragleave', () => { rtuZone.style.borderColor=''; rtuZone.style.background=''; });
        rtuZone.addEventListener('drop', e => {
            e.preventDefault(); rtuZone.style.borderColor=''; rtuZone.style.background='';
            rtuHandleFiles(e.dataTransfer.files);
        });
    }
});