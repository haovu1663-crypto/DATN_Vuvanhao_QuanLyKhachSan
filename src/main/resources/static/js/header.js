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
