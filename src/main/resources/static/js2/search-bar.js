const destinations = [
    { name: 'Hà Nội',           sub: 'Thủ đô',                    icon: '🏛️', region: 'Miền Bắc' },
    { name: 'Ninh Bình',        sub: 'Tràng An, Tam Cốc',         icon: '⛰️', region: 'Miền Bắc' },
    { name: 'Hạ Long',          sub: 'Vịnh Hạ Long',              icon: '🌊', region: 'Miền Bắc' },
    { name: 'Đà Nẵng',          sub: 'Biển Mỹ Khê, Bà Nà Hills', icon: '🏖️', region: 'Miền Trung' },
    { name: 'Hội An',           sub: 'Phố cổ UNESCO',             icon: '🏮', region: 'Miền Trung' },
    { name: 'Huế',              sub: 'Cố đô',                     icon: '👑', region: 'Miền Trung' },
    { name: 'Nha Trang',        sub: 'Thành phố biển',            icon: '🐚', region: 'Miền Nam' },
    { name: 'Đà Lạt',           sub: 'Thành phố ngàn hoa',        icon: '🌸', region: 'Miền Nam' },
    { name: 'TP. Hồ Chí Minh', sub: 'Trung tâm kinh tế',         icon: '🌆', region: 'Miền Nam' },
    { name: 'Phú Quốc',         sub: 'Đảo ngọc',                  icon: '🏝️', region: 'Miền Nam' },
    { name: 'Vũng Tàu',         sub: 'Bà Rịa-Vũng Tàu',          icon: '⚓', region: 'Miền Nam' },
];

let guests = { adults: 2, children: 0, rooms: 1 };
let pet = false;
let dateStart = null, dateEnd = null;
let calOffset = 0;
let openDrop = null;

function toggleDropdown(name) {
    if (openDrop === name) { closeAll(); return; }
    closeAll();
    openDrop = name;
    document.getElementById('drop' + capitalize(name)).classList.add('open');
    document.getElementById('overlay').classList.add('active');
    if (name === 'dest') { renderDestList(''); setTimeout(() => document.getElementById('destSearch').focus(), 50); }
    if (name === 'date') renderCalendar();
}
function closeAll() {
    ['Dest','Date','Guests'].forEach(n => {
        const el = document.getElementById('drop' + n);
        if (el) el.classList.remove('open');
    });
    const menuDrop = document.getElementById('menuDropdown');
    const menuBtn  = document.getElementById('btnMenu');
    if (menuDrop) menuDrop.classList.remove('open');
    if (menuBtn)  menuBtn.classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
    openDrop = null;
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function renderDestList(filter) {
    const list = document.getElementById('destList');
    const groups = {};
    destinations
        .filter(d => !filter || d.name.toLowerCase().includes(filter.toLowerCase()) || d.sub.toLowerCase().includes(filter.toLowerCase()))
        .forEach(d => { if (!groups[d.region]) groups[d.region] = []; groups[d.region].push(d); });
    let html = '';
    for (const [region, items] of Object.entries(groups)) {
        html += `<div class="dest-section-title">${region}</div>`;
        items.forEach(d => {
            html += `<div class="dest-item" onclick="selectDest('${d.name}')">
                    <span class="dest-icon">${d.icon}</span>
                    <div><div>${d.name}</div><div class="dest-sub">${d.sub}</div></div>
                </div>`;
        });
    }
    list.innerHTML = html || '<div style="padding:16px;text-align:center;color:#aaa;font-size:13px">Không tìm thấy điểm đến</div>';
}
function filterDest(val) { renderDestList(val); }
function selectDest(name) {
    document.getElementById('destVal').textContent = name;
    document.getElementById('destVal').classList.remove('placeholder');
    closeAll();
    toggleDropdown('date');
}

const DAYS = ['T2','T3','T4','T5','T6','T7','CN'];
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
const today = new Date(); today.setHours(0,0,0,0);

function renderCalendar() {
    const base = new Date(today.getFullYear(), today.getMonth() + calOffset, 1);
    const m1 = new Date(base.getFullYear(), base.getMonth(), 1);
    const m2 = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    document.getElementById('calMonthLabels').innerHTML =
        `<span>${MONTHS_VI[m1.getMonth()]} ${m1.getFullYear()}</span><span>${MONTHS_VI[m2.getMonth()]} ${m2.getFullYear()}</span>`;
    document.getElementById('calMonths').innerHTML = renderMonth(m1) + renderMonth(m2);
}

function renderMonth(firstDay) {
    let html = `<div class="cal-month"><div class="cal-month-title">${MONTHS_VI[firstDay.getMonth()]} ${firstDay.getFullYear()}</div><div class="cal-grid">`;
    DAYS.forEach(d => html += `<div class="cal-dow">${d}</div>`);
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;
    for (let i = 0; i < startDow; i++) html += `<div class="cal-day empty"></div>`;
    const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), d);
        const ts = date.getTime();
        let cls = 'cal-day';
        if (date < today) cls += ' disabled';
        if (date.toDateString() === today.toDateString()) cls += ' today';
        if (dateStart && ts === dateStart.getTime()) cls += ' selected-start';
        else if (dateEnd && ts === dateEnd.getTime()) cls += ' selected-end';
        else if (dateStart && dateEnd && date > dateStart && date < dateEnd) {
            cls += ' in-range';
            if (date.getTime() === new Date(dateStart.getTime() + 86400000).getTime()) cls += ' range-start';
            if (date.getTime() === new Date(dateEnd.getTime() - 86400000).getTime()) cls += ' range-end';
        }
        html += `<div class="${cls}" onclick="pickDate(${ts})">${d}</div>`;
    }
    html += `</div></div>`;
    return html;
}

function pickDate(ts) {
    const d = new Date(ts);
    if (d < today) return;
    if (!dateStart || (dateStart && dateEnd) || d < dateStart) {
        dateStart = d; dateEnd = null;
    } else {
        dateEnd = d;
        updateDateVal();
        setTimeout(closeAll, 200);
    }
    renderCalendar();
}

function updateDateVal() {
    if (dateStart && dateEnd) {
        const fmt = d => `${d.getDate()} thg ${d.getMonth()+1}`;
        document.getElementById('dateVal').textContent = `${fmt(dateStart)} – ${fmt(dateEnd)}`;
        document.getElementById('dateVal').classList.remove('placeholder');
    }
}

function changeMonth(delta) { calOffset = Math.max(0, calOffset + delta); renderCalendar(); }
function setShortcut(daysFromNow) {
    const d = new Date(today); d.setDate(d.getDate() + daysFromNow);
    const d2 = new Date(d); d2.setDate(d2.getDate() + 1);
    dateStart = d; dateEnd = d2; updateDateVal(); renderCalendar(); setTimeout(closeAll, 300);
}
function setShortcutWeekend(next) {
    const d = new Date(today);
    let daysToFri = (5 - d.getDay() + 7) % 7;
    if (next) daysToFri += 7;
    if (daysToFri === 0) daysToFri = 7;
    d.setDate(d.getDate() + daysToFri);
    const d2 = new Date(d); d2.setDate(d2.getDate() + 2);
    dateStart = d; dateEnd = d2; updateDateVal(); renderCalendar(); setTimeout(closeAll, 300);
}

function changeCount(type, delta) {
    if (type === 'adults')   guests.adults   = Math.max(1, guests.adults + delta);
    if (type === 'children') guests.children = Math.max(0, guests.children + delta);
    if (type === 'rooms')    guests.rooms    = Math.max(1, guests.rooms + delta);
    document.getElementById('adultVal').textContent = guests.adults;
    document.getElementById('childVal').textContent = guests.children;
    document.getElementById('roomVal').textContent  = guests.rooms;
    document.getElementById('adultMinus').disabled = guests.adults <= 1;
    document.getElementById('childMinus').disabled = guests.children <= 0;
    document.getElementById('roomMinus').disabled  = guests.rooms <= 1;
}
function togglePet() { pet = !pet; document.getElementById('petToggle').classList.toggle('on', pet); }
function resetGuests() {
    guests = { adults: 2, children: 0, rooms: 1 }; pet = false;
    changeCount('adults', 0);
    document.getElementById('petToggle').classList.remove('on');
}
function applyGuests() {
    const total = guests.adults + guests.children;
    document.getElementById('guestsVal').textContent = `${total} khách, ${guests.rooms} phòng${pet ? ' 🐾' : ''}`;
    closeAll();
}

function doSearch() {
    closeAll();

    // --- Validate điểm đến ---
    const destEl = document.getElementById('destVal');
    const workBranch = destEl.textContent.trim();
    if (!workBranch || destEl.classList.contains('placeholder') || workBranch === 'Chọn điểm đến') {
        Swal.fire({ icon: 'warning', title: 'Chưa chọn điểm đến', text: 'Vui lòng chọn điểm đến trước khi tìm kiếm!', confirmButtonColor: '#1a2744' });
        return;
    }

    // --- Validate ngày ---
    if (!dateStart || !dateEnd) {
        Swal.fire({ icon: 'warning', title: 'Chưa chọn ngày', text: 'Vui lòng chọn ngày nhận và trả phòng!', confirmButtonColor: '#1a2744' });
        return;
    }

    // --- Tính capacity = người lớn + trẻ em ---
    const capacity = guests.adults + guests.children;

    // --- Format ngày sang YYYY-MM-DD ---
    const fmtDate = d => {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day   = String(d.getDate()).padStart(2, '0');
        return d.getFullYear() + '-' + month + '-' + day;
    };

    // --- Lưu vào biến global để booking.js dùng ---
    window._searchCheckIn   = fmtDate(dateStart);
    window._searchCheckOut  = fmtDate(dateEnd);
    window._searchCapacity  = capacity;

    loadRoomsBySearch(workBranch, capacity, fmtDate(dateStart), fmtDate(dateEnd));
}

function loadRoomsBySearch(workBranch, capacity, checkIn, checkOut) {
    // Hiện skeleton, ẩn các trạng thái khác
    document.getElementById('room-skeleton').style.display = 'flex';
    document.getElementById('room-grid').style.display     = 'none';
    document.getElementById('room-empty').style.display    = 'none';
    document.getElementById('room-error').style.display    = 'none';
    document.getElementById('room-count-text').textContent = 'Đang tìm kiếm...';

    // Scroll xuống danh sách phòng
    document.getElementById('room-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    const url = `/api/v1/roomtypes/frindroom?workBranch=${encodeURIComponent(workBranch)}&capacity=${capacity}&checkin=${checkIn}&checkout=${checkOut}`;

    fetch(url)
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        })
        .then(apiResp => {
            const list = apiResp.data || [];
            document.getElementById('room-skeleton').style.display = 'none';

            if (!list.length) {
                document.getElementById('room-empty').style.display = 'block';
                document.getElementById('room-count-text').textContent = `Không tìm thấy phòng phù hợp tại "${workBranch}".`;
                return;
            }

            // Cập nhật biến toàn cục để sortAndRender() dùng được
            window.allRooms = list;

            // Cập nhật text đếm phòng
            const fmt = d => d.split('-').reverse().join('/');
            document.getElementById('room-count-text').textContent =
                `Tìm thấy ${list.length} loại phòng tại "${workBranch}" · ${fmt(checkIn)} → ${fmt(checkOut)}`;

            // Render danh sách (dùng hàm có sẵn trong room-listing.js)
            if (typeof sortAndRender === 'function') {
                sortAndRender();
            }
            document.getElementById('room-grid').style.display = 'flex';
        })
        .catch(err => {
            document.getElementById('room-skeleton').style.display = 'none';
            document.getElementById('room-error').style.display    = 'block';
            document.getElementById('room-error-msg').textContent  = err.message || 'Lỗi kết nối server.';
            document.getElementById('room-count-text').textContent = 'Tìm kiếm thất bại.';
        });
}

function setActive(btn) {
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function toggleMenu() {
    const drop = document.getElementById('menuDropdown');
    const btn  = document.getElementById('btnMenu');
    const isOpen = drop.classList.contains('open');
    closeAll();
    if (!isOpen) {
        drop.classList.add('open');
        btn.classList.add('open');
        document.getElementById('overlay').classList.add('active');
    }
}



function showRegister() {
    closeAll();
    document.getElementById('modal-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function hideRegister() {
    document.getElementById('modal-overlay').classList.remove('show');
    document.body.style.overflow = '';
}
function handleOverlayClick(e) {
    if (e.target === document.getElementById('modal-overlay')) hideRegister();
}

changeCount('adults', 0);