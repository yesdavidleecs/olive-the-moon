// Authentication Utilities for Birthday Coupon App
// Manages session state across all pages

const AUTH_CONFIG = {
    PASSWORD: 'iloveyou',
    SESSION_DURATION: 60 * 60 * 1000, // 1 hour in milliseconds
    SESSION_KEY: 'birthday_coupon_session'
};

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.sessionData = null;
        this.init();
    }

    init() {
        this.checkSession();
    }

    // Check if there's a valid session
    checkSession() {
        try {
            const sessionData = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                
                if (session.expiresAt > now) {
                    // Session is still valid
                    this.isAuthenticated = true;
                    this.sessionData = session;
                    console.log('✅ Valid session found, expires at:', new Date(session.expiresAt).toLocaleString());
                    return true;
                } else {
                    // Session has expired
                    console.log('⏰ Session expired, clearing...');
                    this.clearSession();
                }
            }
        } catch (error) {
            console.error('Error checking session:', error);
            this.clearSession();
        }
        
        this.isAuthenticated = false;
        return false;
    }

    // Create a new session after successful password entry
    createSession() {
        const now = Date.now();
        const expiresAt = now + AUTH_CONFIG.SESSION_DURATION;
        
        this.sessionData = {
            authenticatedAt: now,
            expiresAt: expiresAt,
            expiresAtFormatted: new Date(expiresAt).toLocaleString()
        };
        
        localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(this.sessionData));
        this.isAuthenticated = true;
        
        console.log('🔐 New session created, expires at:', this.sessionData.expiresAtFormatted);
        return this.sessionData;
    }

    // Clear the session
    clearSession() {
        localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        this.isAuthenticated = false;
        this.sessionData = null;
        console.log('🗑️ Session cleared');
    }

    // Check if password is correct
    validatePassword(password) {
        return password === AUTH_CONFIG.PASSWORD;
    }

    // Get remaining session time in minutes
    getRemainingTime() {
        if (!this.isAuthenticated || !this.sessionData) {
            return 0;
        }
        
        const remaining = this.sessionData.expiresAt - Date.now();
        return Math.max(0, Math.ceil(remaining / (60 * 1000)));
    }

    // Check if session is about to expire (within 5 minutes)
    isSessionExpiringSoon() {
        const remainingMinutes = this.getRemainingTime();
        return remainingMinutes <= 5 && remainingMinutes > 0;
    }

    // Extend session by another hour
    extendSession() {
        if (this.isAuthenticated && this.sessionData) {
            this.sessionData.expiresAt += AUTH_CONFIG.SESSION_DURATION;
            this.sessionData.expiresAtFormatted = new Date(this.sessionData.expiresAt).toLocaleString();
            localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(this.sessionData));
            console.log('⏰ Session extended, new expiry:', this.sessionData.expiresAtFormatted);
            return true;
        }
        return false;
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Auto-check session every minute
setInterval(() => {
    if (authManager.isAuthenticated) {
        authManager.checkSession();
        
        // Show warning if session is expiring soon
        if (authManager.isSessionExpiringSoon()) {
            const remainingMinutes = authManager.getRemainingTime();
            console.log(`⚠️ Session expires in ${remainingMinutes} minute(s)`);
            
            // Show user-friendly notification
            showSessionWarning(remainingMinutes);
        }
    }
}, 60 * 1000);

// Show session expiration warning
function showSessionWarning(minutes) {
    // Check if warning is already shown
    if (document.getElementById('sessionWarning')) {
        return;
    }
    
    const warning = document.createElement('div');
    warning.id = 'sessionWarning';
    warning.className = 'session-warning';
    warning.innerHTML = `
        <div class="session-warning-content">
            <span>⚠️ Your session expires in ${minutes} minute(s)</span>
            <button onclick="extendSession()" class="extend-session-btn">Extend Session</button>
            <button onclick="dismissWarning()" class="dismiss-warning-btn">×</button>
        </div>
    `;
    
    document.body.appendChild(warning);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (warning.parentNode) {
            warning.remove();
        }
    }, 10000);
}

// Global functions for HTML buttons
window.extendSession = function() {
    if (authManager.extendSession()) {
        const warning = document.getElementById('sessionWarning');
        if (warning) {
            warning.remove();
        }
        showMessage('Session extended by 1 hour! 🎉', 'success');
    }
};

window.dismissWarning = function() {
    const warning = document.getElementById('sessionWarning');
    if (warning) {
        warning.remove();
    }
};

// Show temporary message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `temp-message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}
