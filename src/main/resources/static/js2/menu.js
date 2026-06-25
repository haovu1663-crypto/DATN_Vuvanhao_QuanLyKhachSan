// ===== ĐIỀU HƯỚNG MENU =====
function menuAction(action) {
    closeAll();

    const token = localStorage.getItem('accessToken');

    if (action === 'trang-chu') {
        if (typeof showHomeSections === 'function') showHomeSections();
        return;
    }

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

    if (action === 'dat-phong') {
        if (typeof hideHomeSections === 'function') hideHomeSections();
        if (typeof loadRooms === 'function') loadRooms();
        setTimeout(function() {
            var rs = document.getElementById('room-section');
            if (rs) rs.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
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