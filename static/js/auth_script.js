/* Authentication Module 
   Handles API communication, session storage, and UI state management.
*/

// User Registration Logic
async function registerUser(username, email, password, confirmPassword) {
    // Basic Client-side Validation
    if (!username || !password || !confirmPassword) {
        alert('⚠️ All required fields must be filled!');
        return false;
    }

    if (username.length < 3 || username.length > 50) {
        alert('⚠️ Username must be between 3 and 50 characters!');
        return false;
    }

    if (password.length < 6) {
        alert('⚠️ Password must be at least 6 characters long!');
        return false;
    }

    if (password !== confirmPassword) {
        alert('⚠️ Passwords do not match!');
        return false;
    }

    try {
        console.log('🚀 Attempting to register user:', username);

        // API Call
        const response = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        const data = await response.json();
        console.log('📡 Register response:', data);

        if (response.ok && data.status === 201) {
            alert('✅ Registration successful! You can now log in.');
            console.log('✅ User registered:', data.username);
            window.location.href = '/login';
            return true;
        } else {
            alert('❌ Registration failed: ' + (data.error || 'Unknown error'));
            console.error('❌ Registration error:', data);
            return false;
        }

    } catch (error) {
        console.error('❌ Network error:', error);
        alert('❌ Connection failed! Please check if the server is running.');
        return false;
    }
}

// Login & Session Management
async function loginUser(username, password, rememberMe = false) {
    if (!username || !password) {
        alert('⚠️ Username and password are required!');
        return false;
    }

    try {
        console.log('🚀 Attempting to login user:', username);

        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for session cookies
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        console.log('📡 Login response:', data);

        if (response.ok && data.status === 200) {
            console.log('✅ Login successful!');
            
            // Persist session data to LocalStorage
            localStorage.setItem('username', data.username);
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('isLoggedIn', 'true');
            
            if (data.email) {
                localStorage.setItem('email', data.email);
            }
            
            if (data.created_at) {
                localStorage.setItem('member_since', data.created_at);
            }
            
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            
            alert('✅ Welcome back, ' + data.username + '!');
            
            console.log('➡️  Redirecting to profile...');
            window.location.href = '/profile';
            return true;
        } else {
            alert('❌ Login failed: ' + (data.error || 'Invalid credentials'));
            console.error('❌ Login error:', data);
            return false;
        }

    } catch (error) {
        console.error('❌ Network error:', error);
        alert('❌ Connection failed! Please check if the server is running.');
        return false;
    }
}

// Logout Handling
async function logoutUser() {
    const username = localStorage.getItem('username') || 'Unknown';
    
    try {
        console.log('👋 Logging out user:', username);

        await fetch(`${API_URL}/api/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username: username })
        });

        // Clear local storage
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('email');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('member_since');
        
        console.log('✅ Logout successful');
        alert('👋 You have been logged out successfully!');
        
        window.location.href = '/';
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        localStorage.clear();
        window.location.href = '/';
    }
}

// Auth Helpers / Getters
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function getCurrentUsername() {
    return localStorage.getItem('username') || 'Guest';
}

function getUserEmail() {
    return localStorage.getItem('email') || null;
}

function getUserId() {
    return localStorage.getItem('user_id') || null;
}

function getMemberSince() {
    return localStorage.getItem('member_since') || null;
}

// Backend Session Verification
async function checkSession() {
    try {
        const response = await fetch(`${API_URL}/api/session`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.logged_in) {
            console.log('✅ [SESSION] User is logged in:', data.username);
            
            // Sync LocalStorage with backend state
            localStorage.setItem('username', data.username);
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('isLoggedIn', 'true');
            
            return true;
        } else {
            console.log('⚠️  [SESSION] No active session');
            return false;
        }
        
    } catch (error) {
        console.error('❌ [SESSION] Error:', error);
        return false;
    }
}

// UI State Management
function updateNavbarForUser() {
    const isLoggedIn = isUserLoggedIn();
    const username = getCurrentUsername();
    
    console.log('🔄 Updating navbar, logged in:', isLoggedIn, 'as:', username);
    
    if (isLoggedIn) {
        console.log('✅ User authenticated:', username);
    }
}

// Route Protection (Client Side)
function requireLogin(redirectTo = '/login') {
    if (!isUserLoggedIn()) {
        alert('⚠️ Please log in to access this page.');
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

// Utility: Password Strength Analysis
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (password.length < 6) {
        return { strength: 0, label: 'Too Short', color: '#ff4757' };
    } else if (strength <= 3) {
        return { strength: 1, label: 'Weak', color: '#ff6348' };
    } else if (strength <= 5) {
        return { strength: 2, label: 'Medium', color: '#ffa502' };
    } else {
        return { strength: 3, label: 'Strong', color: '#00bcd4' };
    }
}

// Utility: Toggle Input Visibility
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();
    updateNavbarForUser();
    
    console.log('🔐 Auth System Loaded');
    console.log('📊 Login Status:', isUserLoggedIn());
    console.log('👤 Current User:', getCurrentUsername());
});

// Global Export
window.authFunctions = {
    loginUser,
    registerUser,
    logoutUser,
    isUserLoggedIn,
    getCurrentUsername,
    getUserEmail,
    getUserId,
    getMemberSince,
    requireLogin,
    checkPasswordStrength,
    checkSession,
    updateNavbarForUser
};