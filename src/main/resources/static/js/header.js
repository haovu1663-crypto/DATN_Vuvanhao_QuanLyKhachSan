//Hiển thị user info, avatar, logout/


    // ===== HEADER USER INFO =====
    (function initRoomFormHeader() {
    const fullName = localStorage.getItem('fullName') || '';
    const role = localStorage.getItem('userRole') || '';
    const token = localStorage.getItem('accessToken');
    if (!token || !fullName) { window.location.href = '/demo'; return; }
    const parts = fullName.trim().split(' ');
    const shortName = parts[parts.length - 1];
    const initials = parts.length >= 2 ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase() : fullName.trim().substring(0, 2).toUpperCase();
    const avatarEl = document.getElementById('rf-avatar');
    const greetingEl = document.getElementById('rf-greeting');
    const fullNameEl = document.getElementById('rf-fullname-menu');
    const roleEl = document.getElementById('rf-role-menu');
    if (avatarEl) avatarEl.textContent = initials;
    if (greetingEl) greetingEl.textContent = 'Hi, ' + shortName + '!';
    if (fullNameEl) fullNameEl.textContent = fullName;
    const roleLabel = { 'ROLE_ADMIN': 'Quản trị viên', 'ROLE_MANAGER': 'Quản lý', 'ROLE_USER': 'Khách hàng' };
    if (roleEl) roleEl.textContent = roleLabel[role] || role || 'Nhân viên';
})();

    function rfToggleUserMenu() {
    document.getElementById('rf-user-menu').classList.toggle('hidden');
}
    document.addEventListener('click', function(e) {
    const chip = document.getElementById('rf-user-chip');
    const menu = document.getElementById('rf-user-menu');
    if (menu && chip && !chip.contains(e.target) && !menu.contains(e.target)) menu.classList.add('hidden');
});
    function rfLogout() {
    ['accessToken','userId','fullName','userRole','expirationDate'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/demo';
}

    // ===== SHARED USER CHIP FOR ALL TABS =====
    (function sharedInitAllUserChips() {
    const fullName = localStorage.getItem('fullName') || '';
    const role = localStorage.getItem('userRole') || '';
    const parts = fullName.trim().split(' ');
    const shortName = parts[parts.length - 1] || '...';
    const initials = parts.length >= 2
    ? (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    : (fullName.trim().substring(0, 2).toUpperCase() || '??');
    const roleLabel = { 'ROLE_ADMIN': 'Quản trị viên', 'ROLE_MANAGER': 'Quản lý', 'ROLE_USER': 'Khách hàng' };
    const roleText = roleLabel[role] || role || 'Nhân viên';

    ['rs', 'ci', 'co', 'bk'].forEach(function(prefix) {
    const avatarEl    = document.getElementById(prefix + '-avatar');
    const greetingEl  = document.getElementById(prefix + '-greeting');
    const fullNameEl  = document.getElementById(prefix + '-fullname-menu');
    const roleEl      = document.getElementById(prefix + '-role-menu');
    if (avatarEl)   avatarEl.textContent   = initials;
    if (greetingEl) greetingEl.textContent = 'Hi, ' + shortName + '!';
    if (fullNameEl) fullNameEl.textContent  = fullName || '—';
    if (roleEl)     roleEl.textContent      = roleText;
});
})();

    function sharedToggleUserMenu(prefix) {
    const menu = document.getElementById(prefix + '-user-menu');
    if (!menu) return;
    const wasHidden = menu.classList.contains('hidden');
    // Close all open menus first
    ['rs', 'ci', 'co', 'bk', 'rf'].forEach(function(p) {
    const m = document.getElementById(p + '-user-menu');
    if (m) m.classList.add('hidden');
});
    if (wasHidden) menu.classList.remove('hidden');
}

    document.addEventListener('click', function(e) {
    ['rs', 'ci', 'co', 'bk'].forEach(function(prefix) {
        const chip = document.getElementById(prefix + '-user-chip');
        const menu = document.getElementById(prefix + '-user-menu');
        if (menu && chip && !chip.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
});









    // ===== WORK BRANCH FROM LOCALSTORAGE =====
    (function rfLoadBranch() {
    let name = '';
    try {
    const raw = localStorage.getItem('workBranch');
    if (!raw) return;
    const branchData = JSON.parse(raw);
    name = typeof branchData === 'string'
    ? branchData
    : (branchData.name || branchData.branchName || branchData.branch || JSON.stringify(branchData));
} catch (e) {
    name = localStorage.getItem('workBranch') || '';
}
    if (!name) return;
    ['work-branch-text', 'rs-branch-text', 'ci-branch-text', 'co-branch-text', 'sv-branch-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = name;
});
})();




    // ===== POPULATE HEADER CHO CÁC TAB MỚI (sv, art, urt) =====
    // Đảm bảo greeting/avatar/fullname được fill đúng ngay cả khi header.js
    // chưa liệt kê các prefix này
    (function populateNewHeaders() {
    const prefixes = ['sv', 'art', 'urt'];
    function fill() {
    const fullName = localStorage.getItem('fullName') || '';
    const role     = localStorage.getItem('userRole') || '';
    const initials = fullName.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase() || '??';
    const hiText   = fullName ? 'Hi, ' + fullName.split(' ').pop() + '!' : 'Hi, ...';
    prefixes.forEach(function(p) {
    const avatar   = document.getElementById(p + '-avatar');
    const greeting = document.getElementById(p + '-greeting');
    const fullEl   = document.getElementById(p + '-fullname-menu');
    const roleEl   = document.getElementById(p + '-role-menu');
    if (avatar)   { avatar.textContent = initials; }
    if (greeting) { greeting.textContent = hiText; }
    if (fullEl)   { fullEl.textContent = fullName || '—'; }
    if (roleEl)   { roleEl.textContent = role || '—'; }
});
}
    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
} else {
    fill();
}
})();

