function empFormatSalary(input) {
    const raw = input.value.replace(/\D/g, '');
    input.dataset.raw = raw;
    input.value = raw ? new Intl.NumberFormat('vi-VN').format(parseInt(raw)) : '';
}

function empUpdateDeptBadge(sel) {
    const badge = document.getElementById('emp-dept-badge');
    const text  = document.getElementById('emp-dept-badge-text');
    const map   = {
        RECEPTIONIST:   { label: '🛎️ Lễ tân',             cls: 'badge-RECEPTIONIST' },
        CLEANING_STAFF: { label: '🧹 Nhân viên dọn phòng', cls: 'badge-CLEANING_STAFF' }
    };
    if (!sel.value) { badge.classList.remove('show'); return; }
    text.textContent = map[sel.value].label;
    text.className   = map[sel.value].cls;
    badge.classList.add('show');
}

function empTogglePassword() {
    const input = document.getElementById('emp-password');
    const btn   = document.getElementById('emp-pw-toggle-btn');
    if (input.type === 'password') { input.type = 'text';     btn.textContent = '🙈'; }
    else                           { input.type = 'password'; btn.textContent = '👁️'; }
}

function empResetForm() {
    ['emp-name','emp-email','emp-phone','emp-username','emp-password','emp-salary'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.classList.remove('error'); el.dataset.raw = ''; }
    });
    document.getElementById('emp-department').value = '';
    document.getElementById('emp-location').value   = '';
    document.getElementById('emp-dept-badge').classList.remove('show');
}

function empSubmit() {
    const salaryRaw = document.getElementById('emp-salary').dataset.raw || '';
    const empName   = document.getElementById('emp-name').value.trim();

    const fields = [
        { id: 'emp-name',       check: v => v.length > 0,                          label: 'Họ và tên' },
        { id: 'emp-department', check: v => v !== '',                               label: 'Chức vụ' },
        { id: 'emp-salary',     check: _ => parseInt(salaryRaw || '0') >= 6500000, label: 'Lương (tối thiểu 6.500.000 ₫)' },
        { id: 'emp-location',   check: v => v !== '',                               label: 'Địa điểm làm việc' },
        { id: 'emp-email',      check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),  label: 'Email' },
        { id: 'emp-phone',      check: v => /^0\d{9,10}$/.test(v),                 label: 'Số điện thoại' },
        { id: 'emp-username',   check: v => /^[a-z0-9_]{3,}$/.test(v),             label: 'Tên đăng nhập' },
        { id: 'emp-password',   check: v => v.length >= 6,                         label: 'Mật khẩu (tối thiểu 6 ký tự)' }
    ];

    let errors = [];
    fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (!f.check(el.value.trim())) { el.classList.add('error'); errors.push(f.label); }
        else                            { el.classList.remove('error'); }
    });

    if (errors.length > 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Vui lòng kiểm tra lại',
            html: 'Các trường chưa hợp lệ:<br><b>' + errors.join(', ') + '</b>',
            confirmButtonColor: '#0f1c35'
        });
        return;
    }

    const formData = new FormData();
    formData.append('name',       empName);
    formData.append('department', document.getElementById('emp-department').value);
    formData.append('workBranch', document.getElementById('emp-location').value);
    formData.append('email',      document.getElementById('emp-email').value.trim());
    formData.append('phone',      document.getElementById('emp-phone').value.trim());
    formData.append('userName',   document.getElementById('emp-username').value.trim());
    formData.append('password',   document.getElementById('emp-password').value);
    formData.append('salary',     salaryRaw);

    const btn = document.getElementById('emp-btn-submit');
    btn.disabled  = true;
    btn.innerHTML = '⏳&nbsp; Đang xử lý...';

    fetch('/api/v1/employees/register', { method: 'POST', body: formData })
        .then(async res => {
            const body = await res.text();
            if (!res.ok) {
                // Thử parse JSON để lấy message lỗi từ backend
                try {
                    const json = JSON.parse(body);
                    throw new Error(json.message || json.msg || body);
                } catch (_) {
                    throw new Error(body || 'Lỗi ' + res.status);
                }
            }
            return body;
        })
        .then(() => {
            btn.disabled  = false;
            btn.innerHTML = '<span>✅</span> Tạo nhân viên';
            Swal.fire({
                icon: 'success',
                title: 'Tạo nhân viên thành công! 🎉',
                text: 'Tài khoản của ' + empName + ' đã được tạo.',
                confirmButtonColor: '#0f1c35'
            }).then(() => empResetForm());
        })
        .catch(err => {
            btn.disabled  = false;
            btn.innerHTML = '<span>✅</span> Tạo nhân viên';
            Swal.fire({
                icon: 'error',
                title: 'Tạo thất bại',
                text: err.message || 'Có lỗi xảy ra, vui lòng thử lại.',
                confirmButtonColor: '#dc2626'
            });
        });
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#emp-form-card .emp-input, #emp-form-card .emp-select').forEach(el => {
        el.addEventListener('input',  () => el.classList.remove('error'));
        el.addEventListener('change', () => el.classList.remove('error'));
    });
});
/* ============================================================
   MANAGE EMPLOYEES — LIST VIEW
============================================================ */
let _empAllData = []; // cache toàn bộ danh sách

function empLoadList() {
    const tbody = document.getElementById('emp-table-body');
    const empty = document.getElementById('emp-empty-state');
    if (!tbody) return;

    // Loading state
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-16 text-slate-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-3 block"></i>
                Đang tải danh sách...
            </td>
        </tr>`;
    empty?.classList.add('hidden');

    const token = localStorage.getItem('accessToken');
    fetch('/api/v1/employees', {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
    })
        .then(async res => {
            if (!res.ok) throw new Error('Lỗi ' + res.status);
            return res.json();
        })
        .then(json => {
            // ApiResponse wrapper: { data: [...] }
            const list = json.data ?? json ?? [];
            _empAllData = Array.isArray(list) ? list : [];
            empRenderTable(_empAllData);
            empUpdateStats(_empAllData);
        })
        .catch(err => {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-16 text-red-400">
                        <i class="fas fa-exclamation-circle text-2xl mb-3 block"></i>
                        ${err.message || 'Không thể tải danh sách nhân viên'}
                    </td>
                </tr>`;
        });
}

function empRenderTable(list) {
    const tbody = document.getElementById('emp-table-body');
    const empty = document.getElementById('emp-empty-state');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    empty?.classList.add('hidden');

    const DEPT_MAP = {
        RECEPTIONIST:   { label: 'Lễ tân',              color: 'bg-blue-50 text-blue-700' },
        CLEANING_STAFF: { label: 'Dọn phòng',            color: 'bg-green-50 text-green-700' },
    };

    tbody.innerHTML = list.map(emp => {
        const dept  = DEPT_MAP[emp.department] ?? { label: emp.department ?? '—', color: 'bg-slate-100 text-slate-600' };
        const salary = emp.salary
            ? new Intl.NumberFormat('vi-VN').format(emp.salary) + ' ₫'
            : '—';
        const avatar = (emp.name || '?').trim().charAt(0).toUpperCase();
        const colors = ['#3b6fd4','#e67e22','#27ae60','#8e44ad','#c0392b','#16a085'];
        const avatarColor = colors[emp.id % colors.length] || colors[0];

        return `
        <tr class="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
            <td class="px-6 py-4 text-slate-400 font-mono text-xs">#${emp.id}</td>
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                         style="background:${avatarColor}">${avatar}</div>
                    <span class="font-semibold text-slate-800">${emp.name ?? '—'}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${dept.color}">
                    ${dept.label}
                </span>
            </td>
            <td class="px-6 py-4 text-slate-600">${emp.phone ?? '—'}</td>
            <td class="px-6 py-4 text-right font-semibold text-slate-700">${salary}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="empOpenUpdate(${emp.id})"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-all">
                    <i class="fas fa-edit"></i> Cập nhật
                </button>
            </td>
        </tr>`;
    }).join('');
}

function empUpdateStats(list) {
    const total       = list.length;
    const receptionist = list.filter(e => e.department === 'RECEPTIONIST').length;
    const cleaning     = list.filter(e => e.department === 'CLEANING_STAFF').length;
    const totalEl = document.getElementById('emp-stat-total');
    const recEl   = document.getElementById('emp-stat-receptionist');
    const clnEl   = document.getElementById('emp-stat-cleaning');
    if (totalEl) totalEl.textContent = total;
    if (recEl)   recEl.textContent   = receptionist;
    if (clnEl)   clnEl.textContent   = cleaning;
}

function empSearchFilter() {
    const keyword = (document.getElementById('emp-search-input')?.value || '').toLowerCase().trim();
    if (!keyword) {
        empRenderTable(_empAllData);
        return;
    }
    const filtered = _empAllData.filter(e =>
        (e.name  || '').toLowerCase().includes(keyword) ||
        (e.phone || '').includes(keyword)
    );
    empRenderTable(filtered);
}

function empDeleteConfirm(id, name) {
    Swal.fire({
        icon: 'warning',
        title: 'Xác nhận xóa',
        html: `Bạn có chắc muốn xóa nhân viên <b>${name}</b>?<br><span style="font-size:12px;color:#94a3b8">Hành động này không thể hoàn tác.</span>`,
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#dc2626',
        cancelButtonColor:  '#64748b',
    }).then(result => {
        if (!result.isConfirmed) return;
        const token = localStorage.getItem('accessToken');
        fetch('/api/v1/employees/' + id, {
            method: 'DELETE',
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        })
            .then(async res => {
                if (!res.ok) throw new Error(await res.text());
                Swal.fire({
                    icon: 'success', title: 'Đã xóa!',
                    text: name + ' đã được xóa khỏi hệ thống.',
                    confirmButtonColor: '#0f1c35', timer: 2000, timerProgressBar: true
                });
                empLoadList(); // reload lại bảng
            })
            .catch(err => {
                Swal.fire({ icon: 'error', title: 'Xóa thất bại', text: err.message, confirmButtonColor: '#dc2626' });
            });
    });
}
/* ============================================================
   UPDATE EMPLOYEE
============================================================ */

function empOpenUpdate(id) {
    // Chuyển sang view update trước, sau đó load dữ liệu
    if (typeof switchToView === 'function') switchToView('update-employee');

    const token = localStorage.getItem('accessToken');
    fetch('/api/v1/employees/' + id, {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
    })
        .then(async res => {
            if (!res.ok) throw new Error('Lỗi ' + res.status);
            return res.json();
        })
        .then(json => {
            // Hỗ trợ cả ApiResponse wrapper { data: {...} } và object thẳng
            const emp = json.data ?? json;
            eupFillForm(emp);
        })
        .catch(err => {
            Swal.fire({
                icon: 'error',
                title: 'Không thể tải dữ liệu',
                text: err.message || 'Có lỗi xảy ra khi tải thông tin nhân viên.',
                confirmButtonColor: '#dc2626'
            });
        });
}

function eupFillForm(emp) {
    document.getElementById('eup-id').value          = emp.id ?? '';
    document.getElementById('eup-name').value        = emp.name ?? '';
    document.getElementById('eup-email').value       = emp.email ?? '';
    document.getElementById('eup-phone').value       = emp.phone ?? '';
    document.getElementById('eup-username').value    = emp.userName ?? emp.username ?? '';
    document.getElementById('eup-password').value   = '';

    // Salary — format hiển thị
    const salaryRaw = emp.salary ? String(emp.salary) : '';
    const salaryEl  = document.getElementById('eup-salary');
    salaryEl.dataset.raw = salaryRaw;
    salaryEl.value = salaryRaw
        ? new Intl.NumberFormat('vi-VN').format(parseInt(salaryRaw))
        : '';

    // Department
    const deptSel = document.getElementById('eup-department');
    deptSel.value = emp.department ?? '';
    eupUpdateDeptBadge(deptSel);

    // Location — workBranch có thể là full-string hoặc short key
    const locSel = document.getElementById('eup-location');
    const locVal = emp.workBranch ?? emp.location ?? '';
    // Thử match theo value trực tiếp
    locSel.value = locVal;
    // Nếu không match, thử tìm option chứa chuỗi đó
    if (!locSel.value) {
        Array.from(locSel.options).forEach(opt => {
            if (opt.value && locVal.includes(opt.value)) locSel.value = opt.value;
        });
    }

    // Update banner name
    const banner = document.getElementById('eup-banner-name');
    if (banner) banner.textContent = emp.name ? 'Cập nhật: ' + emp.name : 'Cập nhật nhân viên';

    // Clear error states
    document.querySelectorAll('#view-update-employee .emp-input, #view-update-employee .emp-select')
        .forEach(el => el.classList.remove('error'));
}

function eupFormatSalary(input) {
    const raw = input.value.replace(/\D/g, '');
    input.dataset.raw = raw;
    input.value = raw ? new Intl.NumberFormat('vi-VN').format(parseInt(raw)) : '';
}

function eupUpdateDeptBadge(sel) {
    const badge = document.getElementById('eup-dept-badge');
    const text  = document.getElementById('eup-dept-badge-text');
    const map   = {
        RECEPTIONIST:   { label: '🛎️ Lễ tân',             cls: 'badge-RECEPTIONIST' },
        CLEANING_STAFF: { label: '🧹 Nhân viên dọn phòng', cls: 'badge-CLEANING_STAFF' }
    };
    if (!sel.value) { badge.classList.remove('show'); return; }
    text.textContent = map[sel.value].label;
    text.className   = map[sel.value].cls;
    badge.classList.add('show');
}

function eupTogglePassword() {
    const input = document.getElementById('eup-password');
    const btn   = document.getElementById('eup-pw-toggle-btn');
    if (input.type === 'password') { input.type = 'text';     btn.textContent = '🙈'; }
    else                           { input.type = 'password'; btn.textContent = '👁️'; }
}

function eupSubmit() {
    const salaryRaw = document.getElementById('eup-salary').dataset.raw || '';
    const empId     = document.getElementById('eup-id').value;
    const empName   = document.getElementById('eup-name').value.trim();
    const password  = document.getElementById('eup-password').value;

    const fields = [
        { id: 'eup-name',       check: v => v.length > 0,                          label: 'Họ và tên' },
        { id: 'eup-department', check: v => v !== '',                               label: 'Chức vụ' },
        { id: 'eup-salary',     check: _ => parseInt(salaryRaw || '0') >= 6500000, label: 'Lương (tối thiểu 6.500.000 ₫)' },
        { id: 'eup-location',   check: v => v !== '',                               label: 'Địa điểm làm việc' },
        { id: 'eup-email',      check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),  label: 'Email' },
        { id: 'eup-phone',      check: v => /^0\d{9,10}$/.test(v),                 label: 'Số điện thoại' },
        { id: 'eup-username',   check: v => /^[a-z0-9_]{3,}$/.test(v),             label: 'Tên đăng nhập' },
    ];
    // Chỉ validate password nếu người dùng nhập
    if (password.length > 0) {
        fields.push({ id: 'eup-password', check: v => v.length >= 6, label: 'Mật khẩu (tối thiểu 6 ký tự)' });
    }

    let errors = [];
    fields.forEach(f => {
        const el = document.getElementById(f.id);
        if (!f.check(el.value.trim())) { el.classList.add('error'); errors.push(f.label); }
        else                            { el.classList.remove('error'); }
    });

    if (errors.length > 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Vui lòng kiểm tra lại',
            html: 'Các trường chưa hợp lệ:<br><b>' + errors.join(', ') + '</b>',
            confirmButtonColor: '#0f1c35'
        });
        return;
    }

    const formData = new FormData();
    formData.append('name',       empName);
    formData.append('department', document.getElementById('eup-department').value);
    formData.append('workBranch', document.getElementById('eup-location').value);
    formData.append('email',      document.getElementById('eup-email').value.trim());
    formData.append('phone',      document.getElementById('eup-phone').value.trim());
    formData.append('userName',   document.getElementById('eup-username').value.trim());
    formData.append('salary',     salaryRaw);
    if (password.length > 0) formData.append('password', password);

    const btn = document.getElementById('eup-btn-submit');
    btn.disabled  = true;
    btn.innerHTML = '⏳&nbsp; Đang xử lý...';

    const token = localStorage.getItem('accessToken');
    fetch('/api/v1/employees/' + empId, {
        method: 'PUT',
        headers: token ? { Authorization: 'Bearer ' + token } : {},
        body: formData
    })
        .then(async res => {
            const body = await res.text();
            if (!res.ok) {
                try {
                    const json = JSON.parse(body);
                    throw new Error(json.message || json.msg || body);
                } catch (_) {
                    throw new Error(body || 'Lỗi ' + res.status);
                }
            }
            return body;
        })
        .then(() => {
            btn.disabled  = false;
            btn.innerHTML = '<span>💾</span> Cập nhật nhân viên';
            Swal.fire({
                icon: 'success',
                title: 'Cập nhật thành công! 🎉',
                text: 'Thông tin của ' + empName + ' đã được cập nhật.',
                confirmButtonColor: '#0f1c35'
            }).then(() => {
                switchToView('manage-employee');
                empLoadList();
            });
        })
        .catch(err => {
            btn.disabled  = false;
            btn.innerHTML = '<span>💾</span> Cập nhật nhân viên';
            Swal.fire({
                icon: 'error',
                title: 'Cập nhật thất bại',
                text: err.message || 'Có lỗi xảy ra, vui lòng thử lại.',
                confirmButtonColor: '#dc2626'
            });
        });
}

function eupDeleteConfirm() {
    const id   = document.getElementById('eup-id').value;
    const name = document.getElementById('eup-name').value.trim() || 'nhân viên này';
    Swal.fire({
        icon: 'warning',
        title: 'Xác nhận xóa',
        html: `Bạn có chắc muốn xóa nhân viên <b>${name}</b>?<br><span style="font-size:12px;color:#94a3b8">Hành động này không thể hoàn tác.</span>`,
        showCancelButton: true,
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#dc2626',
        cancelButtonColor:  '#64748b',
    }).then(result => {
        if (!result.isConfirmed) return;
        const token = localStorage.getItem('accessToken');
        fetch('/api/v1/employees/' + id, {
            method: 'DELETE',
            headers: token ? { Authorization: 'Bearer ' + token } : {}
        })
            .then(async res => {
                if (!res.ok) throw new Error(await res.text());
                Swal.fire({
                    icon: 'success', title: 'Đã xóa!',
                    text: name + ' đã được xóa khỏi hệ thống.',
                    confirmButtonColor: '#0f1c35', timer: 2000, timerProgressBar: true
                }).then(() => {
                    switchToView('manage-employee');
                    empLoadList();
                });
            })
            .catch(err => {
                Swal.fire({ icon: 'error', title: 'Xóa thất bại', text: err.message, confirmButtonColor: '#dc2626' });
            });
    });
}

// Clear error on input/change for update form
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#view-update-employee .emp-input, #view-update-employee .emp-select').forEach(el => {
        el.addEventListener('input',  () => el.classList.remove('error'));
        el.addEventListener('change', () => el.classList.remove('error'));
    });
});