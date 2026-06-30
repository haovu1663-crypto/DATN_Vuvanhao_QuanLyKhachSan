document.addEventListener('DOMContentLoaded', function() {

    // ===== SWITCH VIEWS =====
    const _menuMap = {
        'form':              'menuAdd',
        'update':            'menuUpdate',
        'reset':             'menuResetStatus',
        'checkin':           'menuCheckIn',
        'checkout':          'menuCheckOut',
        'booking':           'menuBooking',
        'add-room-type':     'menuAddRoomType',
        'update-room-type':  'menuUpdateRoomType',
        'add-employee':      'menuAddEmployee',
        'manage-employee':   'menuManageEmployee',
        'update-employee':   'menuManageEmployee',
        'revenue':           'menuRevenue',
        'service':           'menuService',
        'information':       'menuInformation',
    };

    function setActiveMenu(view) {
        Object.entries(_menuMap).forEach(([v, id]) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.toggle('active-menu', v === view);
        });
    }

    window.switchToView = function(view) {
        document.getElementById('view-form').style.display             = (view === 'form' || view === 'update') ? '' : 'none';
        document.getElementById('view-reset-status').style.display     = view === 'reset'             ? 'flex' : 'none';
        document.getElementById('view-checkin').style.display          = view === 'checkin'            ? 'flex' : 'none';
        document.getElementById('view-checkout').style.display         = view === 'checkout'           ? 'flex' : 'none';
        document.getElementById('view-booking').style.display          = view === 'booking'            ? 'flex' : 'none';
        document.getElementById('view-add-room-type').style.display    = view === 'add-room-type'      ? 'flex' : 'none';
        document.getElementById('view-update-room-type').style.display = view === 'update-room-type'   ? 'flex' : 'none';
        document.getElementById('view-add-employee').style.display     = view === 'add-employee'       ? 'flex' : 'none';
        document.getElementById('view-manage-employee').style.display  = view === 'manage-employee'    ? 'flex' : 'none';
        document.getElementById('view-update-employee').style.display  = view === 'update-employee'    ? 'flex' : 'none';
        document.getElementById('view-revenue').style.display          = view === 'revenue'             ? 'flex' : 'none';
        document.getElementById('view-service').style.display          = view === 'service'             ? 'flex' : 'none';
        document.getElementById('view-information').style.display      = view === 'information'         ? 'flex' : 'none';
        setActiveMenu(view);

        // ===== SWITCH ADD / UPDATE ROOM FORM =====
        const searchSection = document.getElementById('searchSection');
        const btnReset   = document.getElementById('btnReset');
        const btnDelete  = document.getElementById('btnDelete');
        const submitText = document.getElementById('submitText');
        const submitIcon = document.getElementById('submitIcon');

        if (view === 'update') {
            searchSection?.classList.remove('hidden');
            btnDelete?.classList.remove('hidden');
            btnReset?.classList.add('hidden');
            if (submitText) submitText.innerText = "Update Room";
            if (submitIcon) submitIcon.className = "fas fa-sync-alt text-[10px]";
            document.getElementById('addRoomForm')?.reset();
        } else if (view === 'form') {
            searchSection?.classList.add('hidden');
            btnDelete?.classList.add('hidden');
            btnReset?.classList.remove('hidden');
            if (submitText) submitText.innerText = "Save Room";
            if (submitIcon) submitIcon.className = "fas fa-arrow-right text-[10px]";
            const roomIdEl = document.getElementById('roomId');
            if (roomIdEl) roomIdEl.value = "";
            document.getElementById('addRoomForm')?.reset();
        }
    };


    // ===== ROLE-BASED MENU VISIBILITY =====
    const MANAGER_ONLY_MENUS = [
        'menuAdd',
        'menuUpdate',
        'menuAddRoomType',
        'menuUpdateRoomType',
        'menuManageEmployee',
        'menuRevenue',
    ];

    function applyRolePermissions() {
        const userRole = localStorage.getItem('userRole');
        const isManager = userRole === 'ROLE_MANAGER';
        MANAGER_ONLY_MENUS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.display = isManager ? '' : 'none';
        });
        // Ẩn/hiện các section label và wrapper
        const displayVal = isManager ? '' : 'none';
        const labelRoomTypes     = document.getElementById('labelRoomTypes');
        const sectionManageRooms = document.getElementById('sectionManageRooms');
        const sectionEmployees   = document.getElementById('sectionEmployees');
        if (labelRoomTypes)     labelRoomTypes.style.display     = displayVal;
        if (sectionManageRooms) sectionManageRooms.style.display = displayVal;
        if (sectionEmployees)   sectionEmployees.style.display   = displayVal;
    }

    applyRolePermissions();

    document.getElementById('menuResetStatus')?.addEventListener('click',   e => { e.preventDefault(); switchToView('reset');           rsLoadRooms(); });
    document.getElementById('menuCheckIn')?.addEventListener('click',       e => { e.preventDefault(); switchToView('checkin');         ciLoadBookings(); });
    document.getElementById('menuCheckOut')?.addEventListener('click',      e => { e.preventDefault(); switchToView('checkout');        coLoadBookings(); });
    document.getElementById('menuBooking')?.addEventListener('click',       e => { e.preventDefault(); switchToView('booking');         bkLoadRooms(); });
    document.getElementById('menuAddRoomType')?.addEventListener('click',   e => { e.preventDefault(); switchToView('add-room-type');   });
    document.getElementById('menuUpdateRoomType')?.addEventListener('click',e => { e.preventDefault(); switchToView('update-room-type'); });
    document.getElementById('menuAdd')?.addEventListener('click',           e => { e.preventDefault(); switchToView('form');            });
    document.getElementById('menuUpdate')?.addEventListener('click',        e => { e.preventDefault(); switchToView('update');          });
    document.getElementById('menuManageEmployee')?.addEventListener('click', e => { e.preventDefault(); switchToView('manage-employee'); empLoadList(); });
    document.getElementById('menuRevenue')?.addEventListener('click',        e => { e.preventDefault(); switchToView('revenue'); });
    document.getElementById('menuService')?.addEventListener('click',        e => { e.preventDefault(); switchToView('service'); if (typeof svLoad === 'function') svLoad(); else if (typeof svLoadRooms === 'function') svLoadRooms(); });
    document.getElementById('menuInformation')?.addEventListener('click',    e => { e.preventDefault(); switchToView('information'); });

    // Default: mở Booking Room khi load trang
    switchToView('booking');
    setTimeout(function() {
        if (typeof bkLoadRooms === 'function' && document.getElementById('bkrt-grid')) {
            bkLoadRooms();
        }
    }, 100);

});


<!-- ===== SCRIPT: BẬT/TẮT SIDEBAR BẰNG NÚT 3 GẠCH ===== -->
function toggleAppSidebar() {
    const sidebar = document.getElementById('appSidebar');
    const isCollapsed = sidebar.classList.toggle('sb-collapsed');
    document.body.classList.toggle('sb-open', !isCollapsed);
    localStorage.setItem('sidebarCollapsed', isCollapsed ? '1' : '0');
}

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('appSidebar');
    if (!sidebar) return;
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === '1') {
        sidebar.classList.add('sb-collapsed');
        document.body.classList.remove('sb-open');
    } else {
        document.body.classList.add('sb-open');
    }
});