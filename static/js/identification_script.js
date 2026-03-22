document.addEventListener("DOMContentLoaded", function () {
    console.log(" Identification page loaded");
    
    // Get data from localStorage
    const predictionData = localStorage.getItem("predictionResult");
    const uploadedImageData = localStorage.getItem("uploadedImage");

    console.log(" Prediction data:", predictionData);
    console.log(" Image data exists:", !!uploadedImageData);

    // Get HTML elements
    const diseaseNameElem = document.getElementById("disease-name");
    const confidenceElem = document.getElementById("confidence-score");
    const resultImageElem = document.getElementById("result-image");
    const medicationBtn = document.getElementById("medication-btn");
    const descriptionElem = document.getElementById("disease-description");

    // Disease descriptions for dynamic display
    const diseaseDescriptions = {
        "Fin Rot": "Fin rot is a common bacterial or fungal disease that causes the fins to deteriorate. Immediate treatment with antibacterial medication is recommended to prevent further damage.",
        
        "Hole in the Head": "Also known as Head and Lateral Line Erosion (HLLE), this condition causes pitting and erosion in the head region. It's often linked to poor water quality or nutritional deficiencies.",
        
        "Pop Eye": "Exophthalmia (pop eye) causes one or both eyes to bulge outward. This can be caused by bacterial infection, poor water quality, or internal issues. Prompt treatment is essential.",
        
        "White Spots (Ich)": "Ichthyophthirius multifiliis, commonly known as 'Ich' or white spot disease, is a parasitic infection that causes white spots on the body and fins. It's highly contagious and requires immediate treatment.",
        
        "No Symptoms Detected": "Great news! Your fish appears healthy with no visible disease symptoms detected. Continue maintaining good water quality and proper nutrition.",
        
        "Inconclusive (Detection Uncertain)": "The AI system could not confidently identify a specific condition. This may be due to image quality, unusual symptoms, or early-stage disease. Consider uploading a clearer image or consulting with a veterinarian."
    };

    // Check if data exists
    if (predictionData && uploadedImageData) {
        const result = JSON.parse(predictionData);
        console.log("Parsed result:", result);

        // A. Update disease name
        if (diseaseNameElem) {
            diseaseNameElem.innerText = result.disease;
            
            // Color coding
            if (result.disease.includes("Healthy") || result.disease.includes("No Symptoms")) {
                diseaseNameElem.style.color = "#2ecc71"; // Green
            } else if (result.disease.includes("Inconclusive")) {
                diseaseNameElem.style.color = "#ffa502"; // Orange
            } else {
                diseaseNameElem.style.color = "#ff4757"; // Red
            }
        }

        // B. Update confidence score
        if (confidenceElem) {
            const percentage = (result.confidence * 100).toFixed(2);
            confidenceElem.innerText = percentage + "% Confidence";
            
            //  Add color based on confidence level
            if (result.confidence >= 0.8) {
                confidenceElem.style.background = "#2ecc71";
                confidenceElem.style.color = "#000";
            } else if (result.confidence >= 0.5) {
                confidenceElem.style.background = "#ffa502";
                confidenceElem.style.color = "#000";
            } else {
                confidenceElem.style.background = "#ff4757";
                confidenceElem.style.color = "#fff";
            }
        }

        // C. Update description based on disease
        if (descriptionElem) {
            const description = diseaseDescriptions[result.disease] || 
                "Based on the image analysis, this is the condition identified by our AI system. Please review the medication guide for treatment steps.";
            descriptionElem.innerText = description;
        }

        // D. Display uploaded image
        if (resultImageElem) {
            resultImageElem.src = uploadedImageData;
            resultImageElem.alt = "Analyzed Fish - " + result.disease;
        }

        // E. Setup medication button
        if (medicationBtn) {
            if (result.medication_page) {
                medicationBtn.style.display = "inline-block";
                medicationBtn.onclick = function () {
                    console.log("Redirecting to:", result.medication_page);
                    window.location.href = result.medication_page;
                };
            } else {
                // Hide medication button for healthy fish
                medicationBtn.style.display = "none";
            }
        }

    } else {
        console.error(" No prediction data found");
        alert("No prediction data found. Please upload an image first.");
        window.location.href = "/upload";
    }
});

// Back button function
function goBack() {
    localStorage.removeItem("predictionResult");
    localStorage.removeItem("uploadedImage");
    window.location.href = "/upload";
}
