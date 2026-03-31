/**
 * vmall-confirm.js
 * Beautiful inline confirmation modal — replaces browser confirm() everywhere.
 * Usage: vmConfirm({ title, message, confirmText, cancelText, variant, onConfirm, onCancel })
 * Variants: 'danger' (red), 'warning' (amber), 'success' (green), 'info' (blue)
 */

(function () {
    // Inject styles once
    if (!document.getElementById('vmall-confirm-styles')) {
        const style = document.createElement('style');
        style.id = 'vmall-confirm-styles';
        style.textContent = `
            #vmall-confirm-overlay {
                position: fixed;
                inset: 0;
                background: rgba(15,23,42,0.55);
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: vcfadeIn 0.18s ease;
            }

            #vmall-confirm-overlay.closing {
                animation: vcfadeOut 0.18s ease forwards;
            }

            @keyframes vcfadeIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }
            @keyframes vcfadeOut {
                from { opacity: 1; }
                to   { opacity: 0; }
            }

            #vmall-confirm-box {
                background: #ffffff;
                border-radius: 24px;
                padding: 32px 28px 24px;
                max-width: 420px;
                width: 100%;
                box-shadow: 0 32px 80px rgba(0,0,0,0.22);
                animation: vcslideUp 0.22s cubic-bezier(0.34,1.56,0.64,1);
                text-align: center;
                position: relative;
            }

            #vmall-confirm-box.closing {
                animation: vcslideDown 0.18s ease forwards;
            }

            @keyframes vcslideUp {
                from { opacity:0; transform: translateY(32px) scale(0.95); }
                to   { opacity:1; transform: translateY(0) scale(1); }
            }
            @keyframes vcslideDown {
                from { opacity:1; transform: translateY(0) scale(1); }
                to   { opacity:0; transform: translateY(20px) scale(0.95); }
            }

            .vc-icon-wrap {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 18px;
                font-size: 26px;
            }

            .vc-icon-wrap.danger  { background: #fee2e2; color: #dc2626; }
            .vc-icon-wrap.warning { background: #fef3c7; color: #d97706; }
            .vc-icon-wrap.success { background: #d1fae5; color: #059669; }
            .vc-icon-wrap.info    { background: #dbeafe; color: #2563eb; }

            #vmall-confirm-title {
                font-size: 19px;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 8px;
                font-family: 'Inter', sans-serif;
            }

            #vmall-confirm-message {
                font-size: 14px;
                color: #6b7280;
                line-height: 1.6;
                margin: 0 0 28px;
                font-family: 'Inter', sans-serif;
            }

            .vc-buttons {
                display: flex;
                gap: 12px;
            }

            .vc-btn {
                flex: 1;
                padding: 12px 16px;
                border-radius: 40px;
                font-size: 14px;
                font-weight: 700;
                border: none;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Inter', sans-serif;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 7px;
            }

            .vc-btn:hover { transform: translateY(-2px); }
            .vc-btn:active { transform: translateY(0); }

            .vc-btn-cancel {
                background: #f3f4f6;
                color: #374151;
            }
            .vc-btn-cancel:hover { background: #e5e7eb; }

            .vc-btn-confirm.danger  { background: linear-gradient(135deg,#ef4444,#dc2626); color:white; }
            .vc-btn-confirm.warning { background: linear-gradient(135deg,#f59e0b,#d97706); color:white; }
            .vc-btn-confirm.success { background: linear-gradient(135deg,#10b981,#059669); color:white; }
            .vc-btn-confirm.info    { background: linear-gradient(135deg,#3b82f6,#2563eb); color:white; }

            .vc-btn-confirm.danger:hover  { box-shadow: 0 8px 24px rgba(239,68,68,0.4); }
            .vc-btn-confirm.warning:hover { box-shadow: 0 8px 24px rgba(245,158,11,0.4); }
            .vc-btn-confirm.success:hover { box-shadow: 0 8px 24px rgba(16,185,129,0.4); }
            .vc-btn-confirm.info:hover    { box-shadow: 0 8px 24px rgba(59,130,246,0.4); }
        `;
        document.head.appendChild(style);
    }

    const ICONS = {
        danger:  'fas fa-trash-alt',
        warning: 'fas fa-exclamation-triangle',
        success: 'fas fa-check-circle',
        info:    'fas fa-info-circle',
    };

    /**
     * @param {Object} opts
     * @param {string}   opts.title        — Bold heading (required)
     * @param {string}   opts.message      — Sub-text (required)
     * @param {string}   [opts.confirmText='Confirm'] — Confirm button label
     * @param {string}   [opts.cancelText='Cancel']  — Cancel button label
     * @param {string}   [opts.variant='danger']     — 'danger'|'warning'|'success'|'info'
     * @param {Function} opts.onConfirm    — Called when user clicks confirm
     * @param {Function} [opts.onCancel]   — Called when user clicks cancel/backdrop
     */
    window.vmConfirm = function (opts) {
        const {
            title       = 'Are you sure?',
            message     = '',
            confirmText = 'Confirm',
            cancelText  = 'Cancel',
            variant     = 'danger',
            onConfirm   = () => {},
            onCancel    = () => {},
        } = opts;

        // Remove any existing modal
        const existing = document.getElementById('vmall-confirm-overlay');
        if (existing) existing.remove();

        const iconClass = ICONS[variant] || ICONS.danger;

        const overlay = document.createElement('div');
        overlay.id = 'vmall-confirm-overlay';
        overlay.innerHTML = `
            <div id="vmall-confirm-box">
                <div class="vc-icon-wrap ${variant}">
                    <i class="${iconClass}"></i>
                </div>
                <div id="vmall-confirm-title">${title}</div>
                <p id="vmall-confirm-message">${message}</p>
                <div class="vc-buttons">
                    <button class="vc-btn vc-btn-cancel" id="vc-cancel-btn">
                        <i class="fas fa-times"></i> ${cancelText}
                    </button>
                    <button class="vc-btn vc-btn-confirm ${variant}" id="vc-confirm-btn">
                        <i class="${iconClass}"></i> ${confirmText}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        function closeModal(cb) {
            overlay.classList.add('closing');
            document.getElementById('vmall-confirm-box').classList.add('closing');
            setTimeout(() => {
                overlay.remove();
                if (cb) cb();
            }, 180);
        }

        document.getElementById('vc-cancel-btn').onclick = () => closeModal(onCancel);
        document.getElementById('vc-confirm-btn').onclick = () => closeModal(onConfirm);

        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(onCancel);
        });

        // Close on Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') { document.removeEventListener('keydown', escHandler); closeModal(onCancel); }
        };
        document.addEventListener('keydown', escHandler);
    };
})();
