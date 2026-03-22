// Symptom Checker JavaScript
const API_URL = 'http://127.0.0.1:5000';

// ==========================================
// CHARACTER COUNTER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('symptomsText');
    const charCount = document.getElementById('charCount');
    
    if (textarea && charCount) {
        textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
        });
    }
});

// ==========================================
// ADD QUICK SYMPTOM
// ==========================================
function addSymptom(symptomText) {
    const textarea = document.getElementById('symptomsText');
    
    if (textarea) {
        if (textarea.value.trim() !== '') {
            textarea.value += ', ' + symptomText;
        } else {
            textarea.value = symptomText;
        }
        
        // Update character count
        document.getElementById('charCount').textContent = textarea.value.length;
        
        // Focus on textarea
        textarea.focus();
    }
}

// ==========================================
// USE EXAMPLE
// ==========================================
function useExample(exampleCard) {
    const textarea = document.getElementById('symptomsText');
    const exampleText = exampleCard.querySelector('p').textContent.replace(/"/g, '');
    
    if (textarea) {
        textarea.value = exampleText;
        document.getElementById('charCount').textContent = textarea.value.length;
        
        // Scroll to form
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textarea.focus();
    }
}

// ==========================================
// ANALYZE SYMPTOMS
// ==========================================
async function analyzeSymptoms(event) {
    event.preventDefault();
    
    const symptomsText = document.getElementById('symptomsText').value.trim();
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsSection = document.getElementById('resultsSection');
    
    if (!symptomsText) {
        alert(' Please describe your fish symptoms');
        return;
    }
    
    // Show loading state
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    analyzeBtn.disabled = true;
    
    try {
        console.log(' Analyzing symptoms:', symptomsText);
        
        // Call the /suggest API endpoint
        const response = await fetch(`${API_URL}/suggest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symptoms: symptomsText
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const results = await response.json();
        console.log(' Results:', results);
        
        // Display results
        displayResults(results);
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error(' Error:', error);
        alert(' Error analyzing symptoms. Please check if the server is running.\n\n' + error.message);
    } finally {
        // Reset button
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
}

// ==========================================
// DISPLAY RESULTS
// ==========================================
function displayResults(results) {
    const resultsSection = document.getElementById('resultsSection');
    const resultDisease = document.getElementById('resultDisease');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceValue = document.getElementById('confidenceValue');
    const viewTreatmentBtn = document.getElementById('viewTreatmentBtn');
    const alternativeResults = document.getElementById('alternativeResults');
    const alternativeList = document.getElementById('alternativeList');
    
    // Show results section
    resultsSection.style.display = 'block';
    
    if (!results || results.length === 0) {
        resultDisease.textContent = 'No matching disease found';
        confidenceBar.style.width = '0%';
        confidenceValue.textContent = '0%';
        viewTreatmentBtn.style.display = 'none';
        alternativeResults.style.display = 'none';
        return;
    }
    
    // Get top result
    const topResult = results[0];
    const confidence = (topResult.confidence_score * 100).toFixed(1);
    
    // Display main result
    resultDisease.textContent = topResult.disease || 'Unknown';
    confidenceBar.style.width = confidence + '%';
    confidenceValue.textContent = confidence + '%';
    
    // Set confidence bar color based on value
    if (confidence >= 70) {
        confidenceBar.style.background = 'linear-gradient(90deg, #4caf50, #66bb6a)';
    } else if (confidence >= 40) {
        confidenceBar.style.background = 'linear-gradient(90deg, #ff9800, #ffa726)';
    } else {
        confidenceBar.style.background = 'linear-gradient(90deg, #f44336, #e57373)';
    }
    
    // Show/hide treatment button
    if (topResult.medication_page && !topResult.disease.includes('Healthy')) {
        viewTreatmentBtn.style.display = 'flex';
        viewTreatmentBtn.href = topResult.medication_page;
    } else {
        viewTreatmentBtn.style.display = 'none';
    }
    
    // Show alternative results if there are multiple matches
    if (results.length > 1) {
        alternativeResults.style.display = 'block';
        alternativeList.innerHTML = '';
        
        // Show next 3 alternatives
        for (let i = 1; i < Math.min(results.length, 4); i++) {
            const alt = results[i];
            const altConfidence = (alt.confidence_score * 100).toFixed(1);
            
            const altItem = document.createElement('div');
            altItem.className = 'alternative-item';
            altItem.innerHTML = `
                <span class="alternative-disease">${alt.disease}</span>
                <span class="alternative-confidence">${altConfidence}%</span>
            `;
            
            alternativeList.appendChild(altItem);
        }
    } else {
        alternativeResults.style.display = 'none';
    }
}

// ==========================================
// CLEAR FORM
// ==========================================
function clearForm() {
    const textarea = document.getElementById('symptomsText');
    const charCount = document.getElementById('charCount');
    
    if (textarea) {
        textarea.value = '';
    }
    
    if (charCount) {
        charCount.textContent = '0';
    }
    
    textarea.focus();
}

// ==========================================
// START NEW CHECK
// ==========================================
function startNewCheck() {
    const resultsSection = document.getElementById('resultsSection');
    const symptomsText = document.getElementById('symptomsText');
    
    // Hide results
    resultsSection.style.display = 'none';
    
    // Clear form
    clearForm();
    
    // Scroll to form
    symptomsText.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Make functions globally accessible
window.analyzeSymptoms = analyzeSymptoms;
window.addSymptom = addSymptom;
window.useExample = useExample;
window.clearForm = clearForm;
window.startNewCheck = startNewCheck;