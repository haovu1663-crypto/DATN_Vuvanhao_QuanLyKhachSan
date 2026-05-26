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

    // Sử dụng URLSearchParams vì Backend dùng @ModelAttribute
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    // Endpoint dựa trên CustomerController
    fetch('/api/v1/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
        .then(async response => {
            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error(errorMsg);
            }
            return response.json();
        })
        .then(async data => {
            // 1. LƯU DỮ LIỆU CƠ BẢN VÀO LOCALSTORAGE
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('fullName', data.fullName);

            const userRole = data.role || 'ROLE_USER';
            localStorage.setItem('userRole', userRole);

            // Tự tính expirationDate — tránh lưu "undefined"
            const _exp = data.expirationDate ? new Date(data.expirationDate).getTime() : NaN;
            const _expFinal = (!isNaN(_exp) && _exp > Date.now()) ? _exp : Date.now() + 3600000;
            localStorage.setItem('expirationDate', new Date(_expFinal).toISOString());

            // 2. KIỂM TRA ROLE ĐỂ GỌI API GET BRANCH (NHÂN VIÊN / QUẢN LÝ)
            // Lưu ý sửa lỗi chính tả từ yêu cầu: ROLE_MANAGER
            if (userRole === 'ROLE_EMPLOYEE' || userRole === 'ROLE_MANAGER') {
                try {
                    // Gọi API lấy branch dựa theo userId vừa đăng nhập
                    const branchResponse = await fetch(`/api/v1/employees/getbranch?id=${data.userId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${data.accessToken}` // Thêm token nếu API này yêu cầu bảo mật
                        }
                    });

                    if (branchResponse.ok) {
                        const branchData = await branchResponse.text(); // Vì hàm getBranch trả về String trực tiếp
                        localStorage.setItem('workBranch', branchData);
                    } else {
                        console.error('Không thể lấy thông tin chi nhánh làm việc');
                    }
                } catch (branchError) {
                    console.error('Lỗi khi gọi API lấy chi nhánh:', branchError);
                }
            } else {
                // Nếu là khách hàng bình thường (ROLE_USER), xóa thông tin branch cũ tránh nhầm lẫn
                localStorage.removeItem('workBranch');
            }

            // 3. CẬP NHẬT GIAO DIỆN VÀ THÔNG BÁO KHÁCH HÀNG
            updateAuthUI(true, data.fullName);
            hideLogin();

            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: `Chào mừng ${data.fullName}! Đang chuyển hướng...`,
                timer: 1500,
                showConfirmButton: false
            });
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