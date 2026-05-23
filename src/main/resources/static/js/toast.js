// ===== TOAST SYSTEM =====
function showToast(type, title, message, duration = 4000) {
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error:   '<i class="fas fa-times-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
        info:    '<i class="fas fa-info-circle"></i>',
    };
    const labels = { success: 'Thành công', error: 'Thất bại', warning: 'Cảnh báo', info: 'Thông tin' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title || labels[type]}</div>
            ${message ? `<div class="toast-msg">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="dismissToast(this.closest('.toast'))"><i class="fas fa-times"></i></button>
        <div class="toast-bar" style="animation-duration:${duration}ms;"></div>
    `;
    container.appendChild(toast);
    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._timer = timer;
}

function dismissToast(toast) {
    if (!toast || toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(toast._timer);
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
}