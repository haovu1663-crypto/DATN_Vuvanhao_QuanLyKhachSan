// ===== ĐIỀU HƯỚNG MENU =====
function menuAction(action) {
    closeAll();

    const token = localStorage.getItem('accessToken');
    const ROLE_ROUTES = {
        'quan-ly-phong': '/rooms/form',
        'lich-su':        '/booking/history',
        'yeu-thich':      '/favorites',
        'ho-tro':         '/support'
    };

    if (action === 'quan-ly-phong') {
        // Kiểm tra đăng nhập trước khi chuyển trang
        if (!token || !isTokenValid()) {
            Swal.fire({
                icon: 'warning',
                title: 'Cần đăng nhập',
                text: 'Vui lòng đăng nhập để truy cập trang quản lý phòng.',
                confirmButtonText: 'Đăng nhập',
                confirmButtonColor: '#1a2744',
                showCancelButton: true,
                cancelButtonText: 'Hủy'
            }).then(r => { if (r.isConfirmed) showLogin(); });
            return;
        }
        window.location.href = '/rooms/form';
        return;
    }

    // Các action chưa làm
    Swal.fire({
        icon: 'info',
        title: 'Tính năng đang phát triển',
        text: 'Tính năng này sẽ sớm được ra mắt.',
        confirmButtonColor: '#1a2744',
        timer: 2000,
        showConfirmButton: false
    });
}