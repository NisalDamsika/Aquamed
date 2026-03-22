// ==========================================
// CUSTOM MODAL UTILITY
// Beautiful popups for confirmations & alerts
// ==========================================

/**
 * Show custom confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} confirmText - Confirm button text (default: "Confirm")
 * @param {string} cancelText - Cancel button text (default: "Cancel")
 * @param {string} type - Modal type: 'info', 'warning', 'danger', 'success' (default: 'warning')
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirmModal(title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning') {
    return new Promise((resolve) => {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // Icon based on type
        const icons = {
            'warning': '<i class="fas fa-exclamation-triangle"></i>',
            'danger': '<i class="fas fa-exclamation-circle"></i>',
            'info': '<i class="fas fa-info-circle"></i>',
            'success': '<i class="fas fa-check-circle"></i>'
        };
        
        // Create modal HTML
        overlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon ${type}">
                        ${icons[type] || icons.warning}
                    </div>
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" data-action="cancel">
                        <i class="fas fa-times"></i> ${cancelText}
                    </button>
                    <button class="modal-btn modal-btn-${type === 'danger' ? 'danger' : 'primary'}" data-action="confirm">
                        <i class="fas fa-check"></i> ${confirmText}
                    </button>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Handle button clicks
        const confirmBtn = overlay.querySelector('[data-action="confirm"]');
        const cancelBtn = overlay.querySelector('[data-action="cancel"]');
        
        const removeModal = () => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        };
        
        confirmBtn.addEventListener('click', () => {
            removeModal();
            resolve(true);
        });
        
        cancelBtn.addEventListener('click', () => {
            removeModal();
            resolve(false);
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                removeModal();
                resolve(false);
            }
        });
        
        // Close on ESC key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                removeModal();
                resolve(false);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

/**
 * Show custom alert modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} type - Modal type: 'info', 'warning', 'danger', 'success' (default: 'info')
 * @returns {Promise<void>}
 */
function showAlertModal(title, message, type = 'info') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const icons = {
            'warning': '<i class="fas fa-exclamation-triangle"></i>',
            'danger': '<i class="fas fa-exclamation-circle"></i>',
            'info': '<i class="fas fa-info-circle"></i>',
            'success': '<i class="fas fa-check-circle"></i>'
        };
        
        overlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon ${type}">
                        ${icons[type] || icons.info}
                    </div>
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-body">
                    ${message}
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-primary" data-action="ok">
                        <i class="fas fa-check"></i> OK
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const okBtn = overlay.querySelector('[data-action="ok"]');
        
        const removeModal = () => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        };
        
        okBtn.addEventListener('click', () => {
            removeModal();
            resolve();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                removeModal();
                resolve();
            }
        });
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                removeModal();
                resolve();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    });
}

/**
 * Show custom prompt modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} placeholder - Input placeholder
 * @param {string} defaultValue - Default input value
 * @returns {Promise<string|null>} - Resolves to input value or null if cancelled
 */
function showPromptModal(title, message, placeholder = '', defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon info">
                        <i class="fas fa-keyboard"></i>
                    </div>
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-body">
                    ${message}
                    <input type="text" class="modal-input" placeholder="${placeholder}" value="${defaultValue}" id="modalPromptInput">
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" data-action="cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="modal-btn modal-btn-primary" data-action="submit">
                        <i class="fas fa-check"></i> Submit
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const input = overlay.querySelector('#modalPromptInput');
        const submitBtn = overlay.querySelector('[data-action="submit"]');
        const cancelBtn = overlay.querySelector('[data-action="cancel"]');
        
        // Focus input
        setTimeout(() => input.focus(), 100);
        
        const removeModal = () => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        };
        
        const submit = () => {
            const value = input.value.trim();
            removeModal();
            resolve(value || null);
        };
        
        submitBtn.addEventListener('click', submit);
        cancelBtn.addEventListener('click', () => {
            removeModal();
            resolve(null);
        });
        
        // Submit on Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submit();
            }
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                removeModal();
                resolve(null);
            }
        });
    });
}

/**
 * Show password prompt modal (masked input)
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} placeholder - Input placeholder
 * @returns {Promise<string|null>}
 */
function showPasswordModal(title, message, placeholder = 'Enter password') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon warning">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-body">
                    ${message}
                    <input type="password" class="modal-input" placeholder="${placeholder}" id="modalPasswordInput">
                </div>
                <div class="modal-footer">
                    <button class="modal-btn modal-btn-secondary" data-action="cancel">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button class="modal-btn modal-btn-primary" data-action="submit">
                        <i class="fas fa-check"></i> Submit
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const input = overlay.querySelector('#modalPasswordInput');
        const submitBtn = overlay.querySelector('[data-action="submit"]');
        const cancelBtn = overlay.querySelector('[data-action="cancel"]');
        
        setTimeout(() => input.focus(), 100);
        
        const removeModal = () => {
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        };
        
        const submit = () => {
            const value = input.value;
            removeModal();
            resolve(value || null);
        };
        
        submitBtn.addEventListener('click', submit);
        cancelBtn.addEventListener('click', () => {
            removeModal();
            resolve(null);
        });
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submit();
            }
        });
    });
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export functions
window.customModal = {
    confirm: showConfirmModal,
    alert: showAlertModal,
    prompt: showPromptModal,
    password: showPasswordModal
};

console.log(' Custom Modal System Loaded');
