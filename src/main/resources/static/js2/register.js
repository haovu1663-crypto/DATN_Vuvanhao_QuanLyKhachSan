
    // ===== TRẠNG THÁI OTP ĐĂNG KÝ =====
    let _regOtpCode    = null;   // Mã OTP từ server trả về
    let _regOtpVerified = false; // Đã xác minh thành công chưa
    let _regOtpTimer   = null;   // Interval đếm ngược

    // ----- Gửi OTP -----
    function regSendOtp() {
    const email = document.getElementById('reg-email').value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    Swal.fire({ icon: 'warning', title: 'Email không hợp lệ', text: 'Vui lòng nhập đúng địa chỉ email trước khi gửi mã.', confirmButtonColor: '#1a2744' });
    return;
}

    const btn = document.getElementById('btn-reg-send-otp');
    btn.disabled = true;
    btn.innerHTML = 'Đang gửi...';

    fetch('/api/email/register?email=' + encodeURIComponent(email), { method: 'POST' })
    .then(async res => {
    const body = await res.text();
    if (!res.ok) {
    // Gắn status code vào error để catch phân biệt loại lỗi
    const err = new Error(body);
    err.status = res.status;
    throw err;
}
    // body lúc này là số OTP dạng string (server trả ResponseEntity<Integer>)
    return body;
})
    .then(otp => {
    _regOtpCode     = otp.trim();
    _regOtpVerified = false;

    // Hiện khu vực nhập OTP
    const section = document.getElementById('reg-otp-section');
    section.classList.add('show');
    // Reset các ô
    [0,1,2,3].forEach(i => {
    const el = document.getElementById('reg-otp-' + i);
    el.value = '';
    el.className = 'reg-otp-digit';
});
    document.getElementById('reg-otp-status').textContent = '';
    document.getElementById('reg-otp-status').className = 'reg-otp-status';
    document.getElementById('reg-otp-0').focus();

    // Đếm ngược 120 giây cho phép gửi lại
    regStartOtpCountdown(120);

    Swal.fire({ icon: 'success', title: 'Đã gửi mã!', text: 'Kiểm tra hộp thư ' + email + ' và nhập mã 4 số.', confirmButtonColor: '#1a2744', timer: 2500, showConfirmButton: false });
})
    .catch(err => {
    btn.disabled = false;
    btn.innerHTML = 'Gửi mã<br>xác nhận';

    if (err.status === 409) {
    // Email đã tồn tại — DataConfickException trả plain text 409
    document.getElementById('reg-email').classList.add('error');
    Swal.fire({
    icon: 'warning',
    title: 'Email đã được đăng ký',
    text: err.message,
    confirmButtonColor: '#1a2744'
});
} else {
    Swal.fire({ icon: 'error', title: 'Gửi mã thất bại', text: err.message || 'Vui lòng thử lại.', confirmButtonColor: '#dc2626' });
}
});
}

    // ----- Đếm ngược & cho phép gửi lại -----
    function regStartOtpCountdown(seconds) {
    clearInterval(_regOtpTimer);
    const btn      = document.getElementById('btn-reg-send-otp');
    const resendEl = document.getElementById('reg-otp-resend');
    let remaining  = seconds;

    function tick() {
    btn.disabled = true;
    btn.innerHTML = `Gửi lại<br>(${remaining}s)`;
    resendEl.innerHTML = `Chưa nhận được? <a onclick="regResendOtp()">Gửi lại sau ${remaining}s</a>`;
}
    tick();
    _regOtpTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
    clearInterval(_regOtpTimer);
    btn.disabled = false;
    btn.innerHTML = 'Gửi lại<br>mã mới';
    resendEl.innerHTML = `<a onclick="regResendOtp()">Gửi lại mã xác nhận</a>`;
} else {
    tick();
}
}, 1000);
}

    function regResendOtp() { regSendOtp(); }

    // ----- Xử lý nhập từng ô OTP -----
    function regOtpInput(idx) {
    const el  = document.getElementById('reg-otp-' + idx);
    const val = el.value.replace(/\D/g, '');
    el.value  = val ? val[0] : '';
    if (el.value) {
    el.classList.add('filled');
    if (idx < 3) document.getElementById('reg-otp-' + (idx+1)).focus();
} else {
    el.classList.remove('filled');
}
    // Kiểm tra ngay khi đủ 4 số
    const full = [0,1,2,3].map(i => document.getElementById('reg-otp-'+i).value).join('');
    if (full.length === 4) regVerifyOtp(full);
}

    function regOtpKey(e, idx) {
    if (e.key === 'Backspace' && !document.getElementById('reg-otp-'+idx).value && idx > 0) {
    document.getElementById('reg-otp-'+(idx-1)).focus();
}
}

    // ----- Xác minh OTP -----
    function regVerifyOtp(entered) {
    const statusEl = document.getElementById('reg-otp-status');
    const submitBtn = document.getElementById('btn-reg-submit');

    if (entered === _regOtpCode) {
    // ĐÚNG
    _regOtpVerified = true;
    [0,1,2,3].forEach(i => {
    const el = document.getElementById('reg-otp-'+i);
    el.className = 'reg-otp-digit success';
    el.disabled  = true;
});
    statusEl.textContent = '✅ Xác minh thành công! Bạn có thể tạo tài khoản.';
    statusEl.className   = 'reg-otp-status success';
    // Mở khoá nút Tạo tài khoản
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor  = 'pointer';
    submitBtn.innerHTML = '🚀 &nbsp;Tạo tài khoản';
} else {
    // SAI — chỉ nếu đã nhập đủ 4 số
    _regOtpVerified = false;
    [0,1,2,3].forEach(i => {
    document.getElementById('reg-otp-'+i).className = 'reg-otp-digit error';
});
    statusEl.textContent = '❌ Mã xác nhận không đúng. Vui lòng thử lại.';
    statusEl.className   = 'reg-otp-status error';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor  = 'not-allowed';
    submitBtn.innerHTML = '🔒 &nbsp;Xác nhận email để tạo tài khoản';
    // Xóa ô và focus lại ô đầu sau 800ms
    setTimeout(() => {
    [0,1,2,3].forEach(i => {
    const el = document.getElementById('reg-otp-'+i);
    el.value = '';
    el.className = 'reg-otp-digit';
});
    document.getElementById('reg-otp-0').focus();
}, 800);
}
}

    // ----- Submit đăng ký -----
    function submitRegister() {
    if (!_regOtpVerified) {
    Swal.fire({ icon: 'warning', title: 'Chưa xác minh email', text: 'Vui lòng gửi và nhập đúng mã OTP trước khi tạo tài khoản.', confirmButtonColor: '#1a2744' });
    return;
}

    const fullname = document.getElementById('reg-fullname').value;
    const email    = document.getElementById('reg-email').value;
    const phone    = document.getElementById('reg-phone').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    if (!fullname || !email || !phone || !username || !password) {
    Swal.fire({ icon: 'warning', title: 'Thiếu thông tin', text: 'Vui lòng điền đầy đủ các trường bắt buộc!', confirmButtonColor: '#1a2744' });
    return;
}

    const params = new URLSearchParams();
    params.append('fullname', fullname);
    params.append('email',    email);
    params.append('phone',    phone);
    params.append('username', username);
    params.append('password', password);

    Swal.showLoading();

    fetch('/api/v1/customer/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
})
    .then(async response => {
    if (!response.ok) throw new Error(await response.text());
    return response.json();
})
    .then(() => {
    Swal.fire({ icon: 'success', title: 'Chúc mừng!', text: 'Tài khoản của bạn đã được tạo thành công.', confirmButtonColor: '#c9a84c', timer: 2500 });
    hideRegister();
    document.querySelectorAll('.reg-input').forEach(input => input.value = '');
    // Reset OTP state
    _regOtpCode = null; _regOtpVerified = false;
    clearInterval(_regOtpTimer);
    document.getElementById('reg-otp-section').classList.remove('show');
    const submitBtn = document.getElementById('btn-reg-submit');
    submitBtn.disabled = true; submitBtn.style.opacity = '0.5';
    submitBtn.style.cursor = 'not-allowed';
    submitBtn.innerHTML = '🔒 &nbsp;Xác nhận email để tạo tài khoản';
})
    .catch(error => {
    Swal.fire({ icon: 'error', title: 'Đăng ký thất bại', text: error.message, confirmButtonColor: '#dc2626' });
});
}

