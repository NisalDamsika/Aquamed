// ==========================================
// PROFILE PAGE SCRIPT
// ==========================================

//  FIXED: Check if API_URL exists before declaring
if (typeof API_URL === 'undefined') {
    var API_URL = 'http://127.0.0.1:5000';
}

// ==========================================
// LOAD PROFILE DATA
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log(' [PROFILE] Page loaded');
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    
    console.log(' [PROFILE] Login status:', isLoggedIn);
    console.log(' [PROFILE] Username:', username);
    
    if (!isLoggedIn || !username) {
        alert(' Please log in to view your profile.');
        window.location.href = '/login';
        return;
    }
    
    console.log(' [PROFILE] User authenticated:', username);
    
    await loadProfileInfo();
    await loadUserStats();
    await loadRecentScans();
});

// ==========================================
// LOAD PROFILE INFO
// ==========================================
async function loadProfileInfo() {
    console.log('👤 [PROFILE INFO] Starting...');
    
    const username = localStorage.getItem('username');
    const memberSince = localStorage.getItem('member_since');
    
    const profileUsername = document.getElementById('profileUsername');
    if (profileUsername) {
        profileUsername.textContent = `Welcome ${username}!`;
    }
    
    const displayUsername = document.getElementById('displayUsername');
    if (displayUsername) {
        displayUsername.textContent = username;
    }
    
    if (memberSince) {
        const memberSinceElem = document.getElementById('memberSince');
        if (memberSinceElem) {
            const year = memberSince.split('-')[0];
            memberSinceElem.textContent = `Member since: ${year}`;
        }
    }
    
    console.log(' [PROFILE INFO] Complete');
}

// ==========================================
// LOAD USER STATS
// ==========================================
async function loadUserStats() {
    const username = localStorage.getItem('username');
    
    console.log(' [STATS] Starting for user:', username);
    
    try {
        const response = await fetch(`${API_URL}/api/user-stats?username=${encodeURIComponent(username)}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log(' [STATS] Response status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log(' [STATS] Data received:', data);
        
        document.getElementById('totalScans').textContent = data.total_scans || 0;
        document.getElementById('diseasesDetected').textContent = data.diseases_detected || 0;
        document.getElementById('healthyFish').textContent = data.healthy_fish || 0;
        
        if (data.last_scan && data.last_scan !== 'Never') {
            const date = new Date(data.last_scan);
            const formatted = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            document.getElementById('lastScan').textContent = formatted;
        } else {
            document.getElementById('lastScan').textContent = 'Never';
        }
        
        console.log(' [STATS] Updated successfully');
        
    } catch (error) {
        console.error(' [STATS] Error:', error);
    }
}

// ==========================================
// LOAD RECENT SCANS
// ==========================================
async function loadRecentScans() {
    const username = localStorage.getItem('username');
    
    console.log(' [SCANS] Starting for user:', username);
    
    try {
        const response = await fetch(`${API_URL}/api/scan-history?username=${encodeURIComponent(username)}&limit=10`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const scans = await response.json();
        console.log(' [SCANS] Found', scans.length, 'scans');
        
        const scanGrid = document.querySelector('.scan-photos-grid');
        if (!scanGrid) return;
        
        if (scans.length > 0) {
            scanGrid.innerHTML = '';
            
            scans.forEach((scan) => {
                const scanItem = document.createElement('div');
                scanItem.className = 'scan-item';
                scanItem.style.cssText = 'position: relative; cursor: pointer;';
                
                const img = document.createElement('div');
                img.style.cssText = 'width: 100%; padding-top: 100%; border-radius: 8px; position: relative;';
                
                // Colors based on disease
                let bgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                if (scan.predicted_disease.includes('Healthy')) {
                    bgColor = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                } else if (scan.predicted_disease.includes('Fin Rot')) {
                    bgColor = 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)';
                } else if (scan.predicted_disease.includes('White Spot')) {
                    bgColor = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
                } else if (scan.predicted_disease.includes('Pop Eye')) {
                    bgColor = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
                } else if (scan.predicted_disease.includes('Hole')) {
                    bgColor = 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
                }
                
                img.style.background = bgColor;
                
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 8px; font-size: 11px; border-radius: 0 0 8px 8px;';
                overlay.innerHTML = `<strong>${scan.predicted_disease}</strong><br><small>${(scan.confidence * 100).toFixed(1)}% confidence</small>`;
                
                img.appendChild(overlay);
                scanItem.appendChild(img);
                scanItem.onclick = () => showScanDetails(scan);
                scanGrid.appendChild(scanItem);
            });
            
            console.log(' [SCANS] Displayed', scans.length, 'items');
        } else {
            scanGrid.innerHTML = '<p style="text-align: center; color: #888; grid-column: 1 / -1;">No scans yet. <a href="/upload" style="color: #00bcd4;">Upload an image</a> to get started!</p>';
        }
        
    } catch (error) {
        console.error(' [SCANS] Error:', error);
    }
}

// ==========================================
// SHOW SCAN DETAILS
// ==========================================
function showScanDetails(scan) {
    const date = new Date(scan.timestamp);
    const formatted = date.toLocaleString();
    
    alert(`Scan Details\n\nDisease: ${scan.predicted_disease}\nConfidence: ${(scan.confidence * 100).toFixed(1)}%\nDate: ${formatted}\nFile: ${scan.filename}`);
}

// ==========================================
// PASSWORD CHANGE
// ==========================================
let editMode = { account: false };

function toggleEdit(section) {
    if (section === 'account') {
        editMode.account = !editMode.account;
        const saveButtons = document.getElementById('accountSaveButtons');
        const editBtn = document.querySelector('.edit-btn');
        
        if (editMode.account) {
            if (saveButtons) saveButtons.style.display = 'flex';
            if (editBtn) editBtn.style.display = 'none';
        } else {
            if (saveButtons) saveButtons.style.display = 'none';
            if (editBtn) editBtn.style.display = 'inline-flex';
        }
    }
}

function cancelEdit(section) {
    toggleEdit(section);
}

async function saveChanges(section) {
    if (section === 'account') {
        const currentPassword = prompt('Enter your current password:');
        if (!currentPassword) return;
        
        const newPassword = prompt('Enter new password (min 6 characters):');
        if (!newPassword || newPassword.length < 6) {
            alert(' Password must be at least 6 characters!');
            return;
        }
        
        const confirmPassword = prompt('Confirm new password:');
        if (newPassword !== confirmPassword) {
            alert(' Passwords do not match!');
            return;
        }
        
        const username = localStorage.getItem('username');
        
        try {
            const response = await fetch(`${API_URL}/api/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: username,
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 200) {
                alert(' Password updated successfully!');
                toggleEdit('account');
            } else {
                alert('❌ ' + (data.error || 'Failed to update password'));
            }
        } catch (error) {
            alert(' Connection failed!');
        }
    }
}

// ==========================================
// LOGOUT
// ==========================================
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    const username = localStorage.getItem('username');
    
    try {
        await fetch(`${API_URL}/api/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: username })
        });
    } catch (error) {
        console.log('Logout API call failed');
    }
    
    localStorage.clear();
    alert(' Logged out successfully!');
    window.location.href = '/';
}

// ==========================================
// DELETE ACCOUNT
// ==========================================
async function confirmDeleteAccount() {
    const confirmation = prompt(' WARNING: Type "DELETE" to confirm account deletion:');
    
    if (confirmation !== 'DELETE') {
        alert('Cancelled.');
        return;
    }
    
    const username = localStorage.getItem('username');
    
    try {
        const response = await fetch(`${API_URL}/api/delete-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: username })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 200) {
            localStorage.clear();
            alert('🗑️ Account deleted.');
            window.location.href = '/';
        } else {
            alert('❌ Failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('❌ Connection failed!');
    }
}

// ==========================================
// AVATAR UPDATE
// ==========================================
function updateAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarImage = document.getElementById('avatarImage');
            if (avatarImage) {
                avatarImage.src = e.target.result;
            }
            alert(' Avatar updated!');
        };
        reader.readAsDataURL(file);
    }
}

console.log(' [PROFILE] Script loaded');
