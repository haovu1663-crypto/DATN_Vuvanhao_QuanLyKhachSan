

    function showLogin() {
    closeAll(); // Đóng các dropdown khác nếu đang mở
    document.getElementById('modal-login-overlay').classList.add('show');
    document.body.style.overflow = 'hidden'; // Chặn cuộn trang khi mở modal
}

    // Hàm ẩn modal Đăng nhập
    function hideLogin() {
    document.getElementById('modal-login-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

    // Hàm đóng modal khi click ra ngoài vùng form (phần nền mờ)
    function handleLoginOverlayClick(e) {
    if (e.target === document.getElementById('modal-login-overlay')) {
    hideLogin();
}
}
    // Hàm xử lý Đăng nhập
    function submitLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
    Swal.fire({
    icon: 'warning',
    title: 'Chú ý',
    text: 'Vui lòng nhập tên đăng nhập và mật khẩu!',
    confirmButtonColor: '#1a2744'
});
    return;
}

    Swal.showLoading();

    // Sử dụng URLSearchParams vì Backend của bạn dùng @ModelAttribute
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    // Endpoint dựa trên CustomerController của bạn[cite: 6]
    fetch('/api/v1/customer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
})
    .then(async response => {
    if (!response.ok) {
    // Xử lý thông báo lỗi từ RuntimeException trong CustomerService
    const errorMsg = await response.text();
    throw new Error(errorMsg);
}
    return response.json();
})
    .then(data => {
    // LƯU DỮ LIỆU VÀO LOCALSTORAGE
    // data sẽ khớp với cấu trúc JwtRespone: accessToken, userId, fullName...[cite: 7, 8]
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('fullName', data.fullName);

    // Lưu trực tiếp giá trị chuỗi từ backend trả về
    const userRole = data.role || 'ROLE_USER';
    localStorage.setItem('userRole', userRole);

    // Tự tính expirationDate — tránh lưu "undefined" nếu backend không trả về
    // ⚠️ Sửa 3600000 cho khớp jwt.expired trong application.properties (hiện là 1 giờ)
    const _exp = data.expirationDate ? new Date(data.expirationDate).getTime() : NaN;
    const _expFinal = (!isNaN(_exp) && _exp > Date.now()) ? _exp : Date.now() + 3600000;
    localStorage.setItem('expirationDate', new Date(_expFinal).toISOString());
    // Cập nhật giao diện header ngay lập tức
    updateAuthUI(true, data.fullName);
    hideLogin();

    Swal.fire({
    icon: 'success',
    title: 'Thành công',
    text: `Chào mừng ${data.fullName}! Đang chuyển hướng...`,
    timer: 1500,
    showConfirmButton: false
});
    // Xoá redirect nếu muốn ở lại trang, hoặc giữ nguyên nếu cần chuyển trang
    // setTimeout(() => window.location.href = '/home', 1500);
})
    .catch(error => {
    Swal.fire({
    icon: 'error',
    title: 'Lỗi',
    text: error.message || 'Tên đăng nhập hoặc mật khẩu không đúng',
    confirmButtonColor: '#dc2626'
});
});

}

    //== ẩn quản lý phòng nếu là user ===//

