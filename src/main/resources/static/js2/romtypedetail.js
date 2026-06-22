// ===== ROOM TYPE DETAIL (PANEL CHÌM) =====
// Gọi API /api/v1/roomtypedetail/{roomTypeId} và hiển thị panel chi tiết
// ngay trong room-section, thay thế danh sách phòng (form chìm, không phải popup)

let _rtdCurrentSlide = 0;
let _rtdImages = [];

// Lưu lại các phần tử của danh sách phòng đang hiển thị, để khôi phục khi quay lại
let _rtdPrevListState = null;

// ---- Mở panel chi tiết & load dữ liệu ----
async function openRoomDetail(roomTypeId, roomTypeName) {
    const panel   = document.getElementById('rtd-inline-panel');
    const loading = document.getElementById('rtd-loading');
    const content = document.getElementById('rtd-content');
    const errorEl = document.getElementById('rtd-error');

    // Ẩn các khối thuộc danh sách phòng, ghi nhớ trạng thái display cũ để khôi phục
    const listHeader = document.querySelector('#room-section > div:first-child'); // tiêu đề + filter/sort
    const grid     = document.getElementById('room-grid');
    const skeleton = document.getElementById('room-skeleton');
    const empty    = document.getElementById('room-empty');
    const errorBox = document.getElementById('room-error');

    _rtdPrevListState = {
        listHeader: listHeader ? listHeader.style.display : '',
        grid:     grid ? grid.style.display : '',
        skeleton: skeleton ? skeleton.style.display : '',
        empty:    empty ? empty.style.display : '',
        errorBox: errorBox ? errorBox.style.display : ''
    };

    if (listHeader) listHeader.style.display = 'none';
    if (grid)     grid.style.display = 'none';
    if (skeleton) skeleton.style.display = 'none';
    if (empty)    empty.style.display = 'none';
    if (errorBox) errorBox.style.display = 'none';

    // Hiện panel chìm
    panel.classList.add('open');
    loading.style.display = 'flex';
    content.style.display = 'none';
    errorEl.style.display = 'none';

    // Cuộn lên đầu khu vực phòng để người dùng thấy panel ngay
    document.getElementById('room-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const res = await fetch('/api/v1/roomtypedetail/' + roomTypeId);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const detail = await res.json();

        renderRoomDetail(detail, roomTypeName);

        loading.style.display = 'none';
        content.style.display = 'grid';

    } catch (err) {
        loading.style.display = 'none';
        errorEl.style.display = 'flex';
        errorEl.querySelector('.rtd-error-msg').textContent =
            'Không thể tải thông tin phòng. Vui lòng thử lại.';
    }
}

// ---- Đóng panel chi tiết, khôi phục lại danh sách phòng ----
function closeRoomDetail() {
    const panel = document.getElementById('rtd-inline-panel');
    panel.classList.remove('open');
    _rtdCurrentSlide = 0;
    _rtdImages = [];

    if (_rtdPrevListState) {
        const listHeader = document.querySelector('#room-section > div:first-child');
        const grid     = document.getElementById('room-grid');
        const skeleton = document.getElementById('room-skeleton');
        const empty    = document.getElementById('room-empty');
        const errorBox = document.getElementById('room-error');

        if (listHeader) listHeader.style.display = _rtdPrevListState.listHeader || '';
        if (grid)     grid.style.display     = _rtdPrevListState.grid     || 'flex';
        if (skeleton) skeleton.style.display = _rtdPrevListState.skeleton || 'none';
        if (empty)    empty.style.display    = _rtdPrevListState.empty    || 'none';
        if (errorBox) errorBox.style.display = _rtdPrevListState.errorBox || 'none';

        _rtdPrevListState = null;
    }

    document.getElementById('room-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- Render toàn bộ nội dung modal ----
function renderRoomDetail(d, roomTypeName) {
    // Gallery
    _rtdImages = (d.galleryImages && d.galleryImages.length > 0)
        ? d.galleryImages
        : (d.thumbnailImage ? [d.thumbnailImage] : []);
    _rtdCurrentSlide = 0;
    renderGallery();

    // Tên phòng & mô tả ngắn
    document.getElementById('rtd-room-name').textContent =
        (d.roomType && d.roomType.type) || roomTypeName || 'Chi tiết phòng';
    document.getElementById('rtd-short-desc').textContent = d.shortDescription || '';

    // Highlight tags (Bán chạy nhất, Hủy miễn phí...)
    const tagsEl = document.getElementById('rtd-tags');
    tagsEl.innerHTML = '';
    if (d.highlightTags && d.highlightTags.length) {
        d.highlightTags.forEach(tag => {
            const s = document.createElement('span');
            s.className = 'rtd-tag';
            s.textContent = tag;
            tagsEl.appendChild(s);
        });
    }

    // Giá
    const price = d.roomType && d.roomType.price ? d.roomType.price : 0;
    document.getElementById('rtd-price').textContent =
        price ? new Intl.NumberFormat('vi-VN').format(price) + ' ₫ / đêm' : 'Liên hệ';

    // Thông tin cơ bản (grid)
    document.getElementById('rtd-info-size').textContent   = d.roomSize    ? d.roomSize + ' m²'  : '—';
    document.getElementById('rtd-info-bed').textContent    = rtdBedLabel(d);
    document.getElementById('rtd-info-floor').textContent  = d.floorLevel  || '—';
    document.getElementById('rtd-info-view').textContent   = d.viewType    || '—';
    document.getElementById('rtd-info-checkin').textContent  = d.checkInTime  || '—';
    document.getElementById('rtd-info-checkout').textContent = d.checkOutTime || '—';
    document.getElementById('rtd-info-breakfast').textContent =
        d.breakfastPrice === null || d.breakfastPrice === undefined
            ? 'Bao gồm'
            : d.breakfastPrice === 0
                ? 'Không có'
                : new Intl.NumberFormat('vi-VN').format(d.breakfastPrice) + ' ₫/người';
    document.getElementById('rtd-info-extrabeds').textContent =
        d.maxExtraBeds != null ? (d.maxExtraBeds === 0 ? 'Không' : 'Tối đa ' + d.maxExtraBeds + ' giường') : '—';
    document.getElementById('rtd-info-smoking').textContent =
        d.smokingAllowed ? 'Cho phép' : 'Không hút thuốc';
    document.getElementById('rtd-info-capacity').textContent =
        d.roomType && d.roomType.capacity ? 'Tối đa ' + d.roomType.capacity + ' người' : '—';

    // Mô tả đầy đủ (HTML)
    document.getElementById('rtd-full-desc').innerHTML = d.fullDescription || '';

    // Tiện nghi
    renderList('rtd-amenities', d.includedAmenities, '✓');

    // Chính sách
    renderList('rtd-policies', d.policies, '📋');

    // Nút đặt phòng trong detail panel → kiểm tra ngày hợp lệ, rồi mở room picker
    const btnBook = document.getElementById('rtd-btn-book');
    if (btnBook && d.roomType) {
        btnBook.onclick = function() {
            // Đảm bảo _searchMode = true để openBooking không bị chặn
            window._searchMode = true;

            // Nếu chưa có ngày → gán mặc định hôm nay + ngày mai
            // user vẫn có thể đổi ngày trong modal booking (calendar hiện sẵn)
            if (!window._searchCheckIn || !window._searchCheckOut) {
                const today    = new Date();
                const tomorrow = new Date(today.getTime() + 86400000);
                const fmtDate  = d => d.toISOString().split('T')[0];
                window._searchCheckIn  = fmtDate(today);
                window._searchCheckOut = fmtDate(tomorrow);
            }

            // 🔧 FIX: Lấy workBranch từ window._currentWorkBranch (được set từ room-listing.js)
            if (!d.roomType.workBranch) {
                const workBranch = window._currentWorkBranch || '';
                if (workBranch) {
                    d.roomType.workBranch = workBranch;
                }
            }

            closeRoomDetail();
            openBooking(d.roomType);
        };
    }
}

// ---- Helper: label giường ----
function rtdBedLabel(d) {
    const count = d.bedCount || 1;
    const type  = d.bedType  || 'Double';
    return count + ' giường ' + type;
}

// ---- Helper: render danh sách dạng ul ----
function renderList(containerId, items, icon) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!items || items.length === 0) {
        el.innerHTML = '<li class="rtd-list-empty">Chưa có thông tin</li>';
        return;
    }
    el.innerHTML = items.map(item =>
        '<li><span class="rtd-list-icon">' + icon + '</span>' + item + '</li>'
    ).join('');
}

// ---- Gallery ----
function renderGallery() {
    const wrap    = document.getElementById('rtd-gallery-wrap');
    const counter = document.getElementById('rtd-gallery-counter');
    const prevBtn = document.getElementById('rtd-gallery-prev');
    const nextBtn = document.getElementById('rtd-gallery-next');

    if (!_rtdImages.length) {
        wrap.innerHTML = '<div class="rtd-no-img">📷 Chưa có ảnh</div>';
        if (counter) counter.style.display = 'none';
        return;
    }

    // Thumbnails strip
    const thumbsHtml = _rtdImages.map((src, i) =>
        '<img class="rtd-thumb' + (i === 0 ? ' active' : '') + '" src="' + src + '" alt="Ảnh ' + (i+1) + '" onclick="rtdGoSlide(' + i + ')" loading="lazy">'
    ).join('');

    wrap.innerHTML =
        '<div class="rtd-main-img-wrap">'
        + '<img id="rtd-main-img" src="' + _rtdImages[0] + '" alt="Ảnh phòng" loading="eager">'
        + '</div>'
        + '<div class="rtd-thumbs" id="rtd-thumbs">' + thumbsHtml + '</div>';

    if (counter) {
        counter.textContent = '1 / ' + _rtdImages.length;
        counter.style.display = _rtdImages.length > 1 ? 'block' : 'none';
    }
    if (prevBtn) prevBtn.style.display = _rtdImages.length > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = _rtdImages.length > 1 ? 'flex' : 'none';
}

function rtdGoSlide(idx) {
    if (!_rtdImages.length) return;
    _rtdCurrentSlide = (idx + _rtdImages.length) % _rtdImages.length;
    const mainImg = document.getElementById('rtd-main-img');
    if (mainImg) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
            mainImg.src = _rtdImages[_rtdCurrentSlide];
            mainImg.style.opacity = '1';
        }, 150);
    }
    document.querySelectorAll('.rtd-thumb').forEach((el, i) => {
        el.classList.toggle('active', i === _rtdCurrentSlide);
    });
    const counter = document.getElementById('rtd-gallery-counter');
    if (counter) counter.textContent = (_rtdCurrentSlide + 1) + ' / ' + _rtdImages.length;
}

function rtdPrevSlide() { rtdGoSlide(_rtdCurrentSlide - 1); }
function rtdNextSlide() { rtdGoSlide(_rtdCurrentSlide + 1); }

// Phím Escape để quay lại danh sách phòng khi đang xem chi tiết
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const panel = document.getElementById('rtd-inline-panel');
        if (panel && panel.classList.contains('open')) closeRoomDetail();
    }
});