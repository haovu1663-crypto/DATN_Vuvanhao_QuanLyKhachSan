<!-- ===== SCRIPT: KIỂM TRA TOKEN & XỬ LÝ ĐĂNG NHẬP LẠI ===== -->

    // ----- Kiểm tra token còn hạn không (copy logic từ auth.js) -----
    function rfIsTokenValid() {
    const token = localStorage.getItem('accessToken');
    const exp   = localStorage.getItem('expirationDate');
    if (!token) return false;
    if (!exp || exp === 'undefined' || exp === 'null') return !!token;
    const expMs = new Date(exp).getTime();
    if (isNaN(expMs)) return true;
    return Date.now() < expMs;
}

    // ----- Hiện / ẩn overlay -----
    function rfShowRelogin() {
    const overlay = document.getElementById('rf-relogin-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => {
    const u = document.getElementById('rf-username');
    if (u) u.focus();
}, 100);
}
    function rfHideRelogin() {
    document.getElementById('rf-relogin-overlay').style.display = 'none';
    document.getElementById('rf-username').value  = '';
    document.getElementById('rf-password').value  = '';
    rfSetMsg('', '');
}

    // ----- Helper hiện thông báo lỗi/ok -----
    function rfSetMsg(text, type) {
    const el = document.getElementById('rf-login-msg');
    if (!text) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.background = type === 'err' ? '#fee2e2' : '#dcfce7';
    el.style.color      = type === 'err' ? '#991b1b' : '#166534';
    el.textContent = text;
}

    // ----- Gọi API đăng nhập lại -----
    async function rfSubmitLogin() {
    const username = document.getElementById('rf-username').value.trim();
    const password = document.getElementById('rf-password').value;
    if (!username || !password) {
    rfSetMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.', 'err');
    return;
}

    const btn = document.getElementById('rf-login-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Đang xác thực...';
    rfSetMsg('', '');

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    try {
    const res = await fetch('/api/v1/customer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
});
    if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Tên đăng nhập hoặc mật khẩu không đúng.');
}
    const data = await res.json();

    // Cập nhật lại localStorage
    localStorage.setItem('accessToken',   data.accessToken);
    localStorage.setItem('userId',         data.userId);
    localStorage.setItem('fullName',       data.fullName);
    localStorage.setItem('email',          data.email);
    localStorage.setItem('userRole',       data.role || 'ROLE_USER');

    // Tính expirationDate đúng (8 tiếng) — giống login.js
    const _exp = data.expirationDate ? new Date(data.expirationDate).getTime() : NaN;
    const _expFinal = (!isNaN(_exp) && _exp > Date.now()) ? _exp : Date.now() + 8 * 60 * 60 * 1000;
    localStorage.setItem('expirationDate', new Date(_expFinal).toISOString());

    // Lấy lại workBranch nếu là nhân viên / quản lý
    const role = data.role || '';
    if (role === 'ROLE_EMPLOYEE' || role === 'ROLE_MANAGER') {
    try {
    const brRes = await fetch(`/api/v1/employees/getbranch?id=${data.userId}`, {
    headers: { Authorization: 'Bearer ' + data.accessToken }
});
    if (brRes.ok) localStorage.setItem('workBranch', await brRes.text());
} catch (_) { /* bỏ qua, không ảnh hưởng login */ }
}

    rfSetMsg('✅ Đăng nhập thành công!', 'ok');
    setTimeout(() => rfHideRelogin(), 800);

} catch (e) {
    rfSetMsg(e.message || 'Đăng nhập thất bại. Vui lòng thử lại.', 'err');
} finally {
    btn.disabled = false;
    btn.textContent = 'Đăng nhập lại';
}
}

    // ----- Kiểm tra khi trang load xong -----
    document.addEventListener('DOMContentLoaded', () => {
    if (!rfIsTokenValid()) {
    rfShowRelogin();
}
});

    // ----- Kiểm tra định kỳ mỗi 5 phút (phòng hết hạn khi đang dùng) -----
    setInterval(() => {
    if (!rfIsTokenValid()) {
    rfShowRelogin();
}
}, 5 * 60 * 1000);
