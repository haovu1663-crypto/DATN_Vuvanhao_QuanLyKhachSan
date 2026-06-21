// ===== CẬP NHẬT GIAO DIỆN HEADER THEO TRẠNG THÁI ĐĂNG NHẬP =====
function updateAuthUI(isLoggedIn, fullName) {
    const btnLogin       = document.getElementById('btnLogin');
    const btnRegister    = document.getElementById('btnRegister');
    const menuWrap       = document.getElementById('menuWrap');
    const userInfo       = document.getElementById('userInfo');
    const userAvatar     = document.getElementById('userAvatar');
    const userFullname   = document.getElementById('userFullname');
    const btnQuanLyPhong = document.getElementById('menu-quan-ly-phong');

    if (isLoggedIn && fullName) {
        // Ẩn nút Đăng nhập / Đăng ký
        btnLogin.style.display    = 'none';
        btnRegister.style.display = 'none';
        // Hiện tên user và menu
        userInfo.style.display    = 'flex';
        menuWrap.style.display    = 'block';
        // Lấy chữ cái đầu làm avatar
        userFullname.textContent  = fullName;
        userAvatar.textContent    = fullName.trim().charAt(0).toUpperCase();

        // Ẩn/hiện nút "Quản lý phòng" theo role
        const role = localStorage.getItem('userRole') || '';
        if (btnQuanLyPhong) {
            // Chỉ hiện cho ADMIN và MANAGER, ẩn với ROLE_USER
            btnQuanLyPhong.style.display = (role === 'ROLE_USER') ? 'none' : 'flex';
        }
    } else {
        // Hiện nút Đăng nhập / Đăng ký
        btnLogin.style.display    = '';
        btnRegister.style.display = '';
        // Ẩn tên user và menu
        userInfo.style.display    = 'none';
        menuWrap.style.display    = 'none';
        // Ẩn nút quản lý phòng khi chưa đăng nhập
        if (btnQuanLyPhong) btnQuanLyPhong.style.display = 'none';
    }
}

// ===== ĐĂNG XUẤT =====
function handleLogout() {
    closeAll();
    Swal.fire({
        icon: 'question',
        title: 'Đăng xuất?',
        text: 'Bạn có chắc muốn đăng xuất khỏi StayViet?',
        showCancelButton: true,
        confirmButtonText: 'Đăng xuất',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#1a2744'
    }).then(result => {
        if (result.isConfirmed) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('fullName');
            localStorage.removeItem('expirationDate');
            localStorage.removeItem('workBranch');
            localStorage.removeItem('userRole');
            localStorage.removeItem('email');
            updateAuthUI(false);
            Swal.fire({
                icon: 'success',
                title: 'Đã đăng xuất',
                text: 'Hẹn gặp lại bạn sớm nhé!',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

// ===== KIỂM TRA TOKEN CÒN HẠN KHÔNG =====
function isTokenValid() {
    const token = localStorage.getItem('accessToken');
    const exp   = localStorage.getItem('expirationDate');
    if (!token) return false;
    // Nếu không có exp hoặc bị lưu sai → coi token vẫn hợp lệ (tương thích cũ)
    if (!exp || exp === 'undefined' || exp === 'null') return true;
    const expMs = new Date(exp).getTime();
    if (isNaN(expMs)) return true;
    return Date.now() < expMs;
}

// ===== KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP KHI TẢI TRANG =====
(function checkLoginOnLoad() {
    const token    = localStorage.getItem('accessToken');
    const fullName = localStorage.getItem('fullName');
    if (token && fullName) {
        updateAuthUI(true, fullName);
        // Nếu token hết hạn thì nhắc nhở nhẹ, KHÔNG tự đăng xuất
        if (!isTokenValid()) {
            Swal.fire({
                icon: 'info',
                title: 'Phiên đăng nhập sắp hết hạn',
                text: 'Vui lòng đăng nhập lại để đảm bảo không bị gián đoạn.',
                confirmButtonText: 'Đăng nhập lại',
                confirmButtonColor: '#1a2744',
                showCancelButton: true,
                cancelButtonText: 'Tiếp tục'
            }).then(r => { if (r.isConfirmed) showLogin(); });
        }
    } else {
        updateAuthUI(false);
    }
})();