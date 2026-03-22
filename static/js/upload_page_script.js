// Image Upload & Preview Logic
let selectedFile = null;

//  FIXED: Set correct backend URL
const BACKEND_URL = "http://127.0.0.1:5000";

function handleFiles(files) {
    const file = files[0];
    const preview = document.getElementById('preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const actionButtons = document.getElementById('action-buttons');
  
    if (file && file.type.startsWith("image/")) {
        selectedFile = file;
        const reader = new FileReader();
        
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = "block";
            uploadPlaceholder.style.display = "none";
            actionButtons.style.display = "flex";
        };
        
        reader.readAsDataURL(file);
    } else {
        alert("Please upload a valid image file (JPG, PNG).");
    }
}
  
function removeFile() {
    const fileElem = document.getElementById('fileElem');
    const preview = document.getElementById('preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const actionButtons = document.getElementById('action-buttons');
  
    fileElem.value = "";
    preview.src = "";
    preview.style.display = "none";
    selectedFile = null;
    
    uploadPlaceholder.style.display = "flex";
    actionButtons.style.display = "none";
}

//  FIXED: Complete Upload Function with Port 5000
async function uploadImage() {
    if (!selectedFile) {
        alert("Please select an image first!");
        return;
    }

    const continueBtn = document.querySelector(".btn-continue");
    const originalText = continueBtn.innerHTML;
    continueBtn.innerHTML = "Analyzing... <i class='fas fa-spinner fa-spin'></i>";
    continueBtn.disabled = true;

    const formData = new FormData();
    formData.append("file", selectedFile);
    
    //  Add username if logged in
    const username = localStorage.getItem('username') || 'Guest';
    formData.append("username", username);

    try {
        console.log(" Sending image to backend on port 5000...");
        
        //  FIXED: Use full URL with port 5000
        const response = await fetch(`${BACKEND_URL}/predict`, {
            method: "POST",
            body: formData
        });

        console.log(" Response status:", response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(" Response data:", data);

        // Store prediction result
        localStorage.setItem("predictionResult", JSON.stringify(data));
        
        //  Store uploaded image (Base64 from preview)
        const previewImage = document.getElementById('preview').src;
        localStorage.setItem("uploadedImage", previewImage);

        console.log(" Data saved, redirecting...");
        
        //  Redirect to identification page
        window.location.href = "/identification";

    } catch (error) {
        console.error(" Error:", error);
        
        //  Better error message
        let errorMessage = "Server connection failed!\n\n";
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += "• Make sure Flask is running: python app.py\n";
            errorMessage += "• Backend should be on: http://127.0.0.1:5000\n";
            errorMessage += "• Check your firewall settings";
        } else if (error.message.includes('500')) {
            errorMessage += "• Backend error occurred\n";
            errorMessage += "• Check Flask console for details";
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        
    } finally {
        continueBtn.innerHTML = originalText;
        continueBtn.disabled = false;
    }
}

//  Test backend connection on page load
window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log(" Testing backend connection...");
        const response = await fetch(`${BACKEND_URL}/`, {
            method: 'GET',
            mode: 'cors'
        });
        
        if (response.ok) {
            console.log(" Backend is running and accessible!");
            console.log(" Connected to:", BACKEND_URL);
        } else {
            console.warn(" Backend responded with status:", response.status);
        }
    } catch (error) {
        console.error(" Cannot connect to backend!");
        console.error("   Expected backend URL:", BACKEND_URL);
        console.error("   Error:", error.message);
        console.log(" Solution: Make sure Flask is running with: python app.py");
    }
});