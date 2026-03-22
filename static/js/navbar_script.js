document.addEventListener("DOMContentLoaded", function () {
    // 1. Navigation Bar HTML Structure (with dynamic login/profile)
    const navbarHTML = `
    <header>
        <a href="/" class="logo" style="text-decoration: none; cursor: pointer;">
            <img src="/static/images/logo.png" alt="Aquamed Logo" class="logo-img">
            <span>Aquamed</span>
        </a>
        
        <nav class="navbar">
            <div class="menu-icon" id="menu-icon">
                <i class="fas fa-bars"></i>
            </div>
            
            <ul class="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/guide">Guide</a></li>
                <li><a href="/medication/general">Medication</a></li>
                <li><a href="/gallery">Gallery</a></li>
                <li><a href="/about">About Us</a></li>
                
                
                <!-- Profile link (hidden by default, shown when logged in) -->
                <li id="profileLinkItem" style="display: none;">
                    <a href="/profile" id="profileLink">
                        <i class="fas fa-user-circle"></i> Profile
                    </a>
                </li>
                
                <!-- Login/Logout button (changes based on login state) -->
                <li>
                    <a href="/login" class="login-link" id="authLink">
                        <i class="fas fa-sign-in-alt"></i> Log in
                    </a>
                </li>
            </ul>
        </nav>
    </header>
    `;

    // 2. Insert HTML at the beginning of body
    document.body.insertAdjacentHTML("afterbegin", navbarHTML);

    // 3. Mobile Menu Toggle Logic
    const menuIcon = document.getElementById("menu-icon");
    const navLinks = document.querySelector(".nav-links");

    if (menuIcon) {
        menuIcon.addEventListener("click", () => {
            navLinks.classList.toggle("active");
            
            const icon = menuIcon.querySelector("i");
            if (navLinks.classList.contains("active")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-times");
            } else {
                icon.classList.remove("fa-times");
                icon.classList.add("fa-bars");
            }
        });
    }

    // 4. Update navbar based on login status
    updateNavbarForAuth();

    // 5. Active Page Highlight Logic
    highlightActiveLink();
});

// ==========================================
// UPDATE NAVBAR BASED ON LOGIN STATUS
// ==========================================
function updateNavbarForAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username') || 'Guest';
    
    console.log(' Updating navbar, logged in:', isLoggedIn);
    
    const authLink = document.getElementById('authLink');
    const profileLinkItem = document.getElementById('profileLinkItem');
    
    if (isLoggedIn && authLink) {
        // User is logged in - show profile link and change to logout
        console.log(' User logged in as:', username);
        
        if (profileLinkItem) {
            profileLinkItem.style.display = 'list-item';
            console.log(' Profile link shown');
        }
        
        // Change login button to logout with username
        authLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        authLink.href = '#';
        authLink.onclick = function(e) {
            e.preventDefault();
            handleLogout();
        };
        
        // Add username tooltip
        authLink.title = `Logged in as ${username}`;
        
    } else if (authLink) {
        // User is not logged in - hide profile link and show login
        console.log('❌ User not logged in');
        
        if (profileLinkItem) {
            profileLinkItem.style.display = 'none';
            console.log('ℹProfile link hidden');
        }
        
        authLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Log in';
        authLink.href = '/login';
        authLink.onclick = null;
        authLink.title = '';
    }
}

// ==========================================
// LOGOUT HANDLER
// ==========================================
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log(' Logging out user...');
        
        // Clear all user data from localStorage
        localStorage.removeItem('username');
        localStorage.removeItem('user_id');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_fullname');
        localStorage.removeItem('user_avatar');
        localStorage.removeItem('member_since');
        
        // Optional: Call backend logout endpoint
        fetch('http://127.0.0.1:5000/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: 'user' })
        }).catch(err => console.log('Logout API call failed:', err));
        
        // Show logout message
        alert(' You have been logged out successfully!');
        
        // Redirect to home page
        window.location.href = '/';
    }
}

// ==========================================
// ACTIVE PAGE HIGHLIGHT LOGIC
// ==========================================
function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll(".nav-links a");

    links.forEach(link => {
        const href = link.getAttribute("href");
        
        // Skip the auth link and profile link from highlighting
        if (link.id === 'authLink' || link.id === 'profileLink') {
            return;
        }
        
        if (href === "/" && currentPath === "/") {
            link.style.color = "#00bcd4";
            link.style.fontWeight = "bold";
        }
        else if (href !== "/" && currentPath.includes(href)) {
            link.style.color = "#00bcd4";
            link.style.fontWeight = "bold";
        }
    });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function isUserLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function getCurrentUsername() {
    return localStorage.getItem('username') || 'Guest';
}

// ==========================================
// AUTO-UPDATE NAVBAR ON PAGE CHANGES
// ==========================================
// Listen for storage changes (in case user logs in/out in another tab)
window.addEventListener('storage', function(e) {
    if (e.key === 'isLoggedIn') {
        updateNavbarForAuth();
    }
});

// Optional: Update navbar every time page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updateNavbarForAuth();
    }
});