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

    // Sử dụng URLSearchParams vì Backend dùng @ModelAttribute
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    // Hiển thị loading đúng cách
    Swal.fire({
        title: 'Đang đăng nhập...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

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
            console.log('[DEBUG] Login response:', data); // debug tạm

            // 1. LƯU DỮ LIỆU CƠ BẢN VÀO LOCALSTORAGE
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('fullName', data.fullName);
            localStorage.setItem('email', data.email);

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

/* =============================================================
   FORGOT PASSWORD — 3-step flow
   Step 1: nhập email → POST /api/email/mk  → lấy OTP
   Step 2: nhập OTP 4 số → so sánh với kết quả trả về
   Step 3: nhập mật khẩu mới → PUT /api/v1/customer/mk
   ============================================================= */

let _fpOtpCode   = null;   // OTP do server trả về
let _fpEmail     = '';     // Email đã xác nhận ở bước 1

// ---------- Mở / đóng modal ----------
function showForgotPassword() {
    closeAll();             // đóng overlay khác nếu đang mở
    fpGoStep(1);            // reset về bước 1 mỗi lần mở
    document.getElementById('modal-forgot-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideForgotPassword() {
    document.getElementById('modal-forgot-overlay').classList.remove('show');
    document.body.style.overflow = '';
}

function handleForgotOverlayClick(e) {
    if (e.target === document.getElementById('modal-forgot-overlay')) {
        hideForgotPassword();
    }
}

// ---------- Điều hướng bước ----------
function fpGoStep(step) {
    [1, 2, 3].forEach(n => {
        const el = document.getElementById('fp-step-' + n);
        if (el) el.style.display = n === step ? 'block' : 'none';
    });

    // reset message boxes
    ['fp-email-msg', 'fp-otp-msg', 'fp-pw-msg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.className = 'fp-msg'; el.textContent = ''; }
    });

    if (step === 1) {
        _fpOtpCode = null;
        _fpEmail   = '';
        const emailEl = document.getElementById('fp-email');
        if (emailEl) emailEl.value = '';
        fpClearOtpInputs();
    }
    if (step === 2) fpClearOtpInputs();
    if (step === 3) {
        const pw1 = document.getElementById('fp-new-password');
        const pw2 = document.getElementById('fp-confirm-password');
        if (pw1) pw1.value = '';
        if (pw2) pw2.value = '';
    }
}

function fpClearOtpInputs() {
    [0,1,2,3].forEach(i => {
        const el = document.getElementById('fp-otp-' + i);
        if (el) el.value = '';
    });
    const st = document.getElementById('fp-otp-status');
    if (st) { st.className = 'reg-otp-status'; st.textContent = ''; }
}

// ---------- BƯỚC 1: Gửi OTP ----------
function fpSendOtp(isResend) {
    const emailEl = document.getElementById('fp-email');
    const msgEl   = document.getElementById('fp-email-msg');
    const email   = emailEl ? emailEl.value.trim() : '';

    if (!email) {
        fpShowMsg(msgEl, 'err', 'Vui lòng nhập địa chỉ email.');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fpShowMsg(msgEl, 'err', 'Địa chỉ email không hợp lệ.');
        return;
    }

    const btn = document.getElementById('fp-btn-send-otp');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang gửi...'; }

    const params = new URLSearchParams();
    params.append('email', email);

    fetch('/api/email/mk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
        .then(async res => {
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Email chưa được đăng ký trong hệ thống.');
            }
            return res.json();  // server trả về số OTP
        })
        .then(otp => {
            _fpOtpCode = String(otp);
            _fpEmail   = email;

            if (isResend) {
                // Đang ở bước 2 rồi, chỉ thông báo
                fpClearOtpInputs();
                const st = document.getElementById('fp-otp-msg');
                fpShowMsg(st, 'info', '✅ Mã OTP mới đã được gửi lại!');
            } else {
                // Chuyển sang bước 2
                const sub = document.getElementById('fp-otp-subtitle');
                if (sub) sub.textContent = 'Mã 4 số đã gửi tới ' + email;
                fpGoStep(2);
            }
        })
        .catch(err => {
            fpShowMsg(msgEl, 'err', err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        })
        .finally(() => {
            if (btn) { btn.disabled = false; btn.innerHTML = '📨 &nbsp;Gửi mã OTP'; }
        });
}

// ---------- BƯỚC 2: OTP input handlers ----------
function fpOtpInput(idx) {
    const el = document.getElementById('fp-otp-' + idx);
    if (!el) return;
    // chỉ cho nhập số
    el.value = el.value.replace(/\D/g, '').slice(0, 1);
    if (el.value && idx < 3) {
        const next = document.getElementById('fp-otp-' + (idx + 1));
        if (next) next.focus();
    }
}

function fpOtpKey(e, idx) {
    if (e.key === 'Backspace') {
        const el = document.getElementById('fp-otp-' + idx);
        if (el && !el.value && idx > 0) {
            const prev = document.getElementById('fp-otp-' + (idx - 1));
            if (prev) { prev.value = ''; prev.focus(); }
        }
    }
}

// ---------- BƯỚC 2: Xác nhận OTP ----------
function fpVerifyOtp() {
    const digits = [0,1,2,3].map(i => {
        const el = document.getElementById('fp-otp-' + i);
        return el ? el.value : '';
    });
    const entered = digits.join('');
    const msgEl   = document.getElementById('fp-otp-msg');
    const statusEl= document.getElementById('fp-otp-status');

    if (entered.length < 4) {
        fpShowMsg(msgEl, 'err', 'Vui lòng nhập đủ 4 chữ số OTP.');
        return;
    }

    if (entered === _fpOtpCode) {
        if (statusEl) { statusEl.className = 'reg-otp-status success'; statusEl.textContent = '✅ Mã chính xác!'; }
        fpShowMsg(msgEl, 'ok', 'Xác thực thành công!');
        setTimeout(() => fpGoStep(3), 500);
    } else {
        if (statusEl) { statusEl.className = 'reg-otp-status error'; statusEl.textContent = '❌ Mã không đúng, vui lòng kiểm tra lại.'; }
        fpShowMsg(msgEl, 'err', 'OTP không khớp. Vui lòng nhập lại hoặc gửi mã mới.');
        // Rung 4 ô
        [0,1,2,3].forEach(i => {
            const el = document.getElementById('fp-otp-' + i);
            if (el) { el.style.borderColor = '#ef4444'; setTimeout(() => el.style.borderColor = '', 1500); }
        });
    }
}

// ---------- BƯỚC 3: Lưu mật khẩu mới ----------
function fpSavePassword() {
    const pw1El  = document.getElementById('fp-new-password');
    const pw2El  = document.getElementById('fp-confirm-password');
    const msgEl  = document.getElementById('fp-pw-msg');
    const pw1    = pw1El  ? pw1El.value  : '';
    const pw2    = pw2El  ? pw2El.value  : '';

    if (!pw1 || pw1.length < 6) {
        fpShowMsg(msgEl, 'err', 'Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }
    if (pw1 !== pw2) {
        fpShowMsg(msgEl, 'err', 'Hai mật khẩu không khớp nhau.');
        return;
    }

    const btn = document.getElementById('fp-btn-save');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang lưu...'; }

    const params = new URLSearchParams();
    params.append('email', _fpEmail);
    params.append('mk', pw1);

    fetch('/api/v1/customer/mk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
        .then(async res => {
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Không thể cập nhật mật khẩu.');
            }
            return res.json();
        })
        .then(() => {
            hideForgotPassword();
            Swal.fire({
                icon: 'success',
                title: 'Đổi mật khẩu thành công! 🎉',
                text: 'Bạn có thể đăng nhập với mật khẩu mới ngay bây giờ.',
                confirmButtonColor: '#1a2744',
                confirmButtonText: 'Đăng nhập ngay'
            }).then(() => showLogin());
        })
        .catch(err => {
            fpShowMsg(msgEl, 'err', err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        })
        .finally(() => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '🔑 &nbsp;Lưu mật khẩu mới';
            }
        });
}

// ---------- Helper ----------
function fpShowMsg(el, type, text) {
    if (!el) return;
    el.className = 'fp-msg ' + type;
    el.textContent = text;
}