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

    document.getElementById('menuResetStatus')?.addEventListener('click',   e => { e.preventDefault(); switchToView('reset');           rsLoadRooms(); });
    document.getElementById('menuCheckIn')?.addEventListener('click',       e => { e.preventDefault(); switchToView('checkin');         ciLoadBookings(); });
    document.getElementById('menuCheckOut')?.addEventListener('click',      e => { e.preventDefault(); switchToView('checkout');        coLoadBookings(); });
    document.getElementById('menuBooking')?.addEventListener('click',       e => { e.preventDefault(); switchToView('booking');         bkLoadRooms(); });
    document.getElementById('menuAddRoomType')?.addEventListener('click',   e => { e.preventDefault(); switchToView('add-room-type');   });
    document.getElementById('menuUpdateRoomType')?.addEventListener('click',e => { e.preventDefault(); switchToView('update-room-type'); });
    document.getElementById('menuAdd')?.addEventListener('click',           e => { e.preventDefault(); switchToView('form');            });
    document.getElementById('menuUpdate')?.addEventListener('click',        e => { e.preventDefault(); switchToView('update');          });

});