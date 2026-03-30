import axios from 'axios';

const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = isProd ? 'https://ptjs-backend.onrender.com/api' : 'http://localhost:3001/api';

const promptInput = document.getElementById('prompt-input');
const parseBtn = document.getElementById('parse-btn');
const jsonViewer = document.getElementById('json-viewer');
const validationResult = document.getElementById('validation-result');
const handoffArea = document.getElementById('handoff-area');
const handoffBtn = document.getElementById('handoff-btn');
const statusBar = document.getElementById('status-bar');

let currentPayload = null;

async function checkHealth() {
    try {
        await axios.get(`${API_BASE}/services`);
        statusBar.textContent = 'SYSTEM ACTIVE';
        statusBar.style.color = '#005bc2'; // Surgical Blue
    } catch (err) {
        statusBar.textContent = 'SYSTEM OFFLINE';
        statusBar.style.color = '#9f403d'; // Error Red
    }
}

async function handleParse() {
    const prompt = promptInput.value.trim();
    if (!prompt) return;

    parseBtn.disabled = true;
    parseBtn.textContent = 'Parsing...';

    try {
        const response = await axios.post(`${API_BASE}/parse`, { prompt });
        currentPayload = response.data;

        // Display JSON
        jsonViewer.textContent = JSON.stringify(currentPayload, null, 2);

        // Update validation result with message from parser
        validationResult.textContent = currentPayload.message || 'Processing...';

        if (currentPayload.status === 'ready') {
            validatePayload(currentPayload);
        } else if (currentPayload.status === 'clarify') {
            validationResult.className = 'warning';
            handoffArea.classList.add('hidden');
        } else {
            validationResult.className = 'invalid';
            handoffArea.classList.add('hidden');
        }

    } catch (err) {
        jsonViewer.textContent = 'Error parsing prompt.';
        console.error(err);
    } finally {
        parseBtn.disabled = false;
        parseBtn.textContent = 'Parse to JSON';
    }
}

async function validatePayload(payload) {
    if (!payload.service_key) {
        validationResult.textContent = 'Unsupported: No service key identified.';
        validationResult.className = 'invalid';
        handoffArea.classList.add('hidden');
        return;
    }

    try {
        const response = await axios.post(`${API_BASE}/validate`, { payload });
        const { valid, errors } = response.data;

        if (valid) {
            validationResult.textContent = '✅ Valid payload for ' + payload.service_key;
            validationResult.className = 'valid';
            handoffArea.classList.remove('hidden');
        } else {
            validationResult.textContent = '❌ Invalid: ' + (errors ? errors[0].message : 'Schema mismatch');
            validationResult.className = 'invalid';
            handoffArea.classList.add('hidden');
        }
    } catch (err) {
        validationResult.textContent = 'Error validating schema.';
        validationResult.className = 'invalid';
    }
}

function handleHandoff() {
    if (!currentPayload || !currentPayload.service_key) return;

    // In a real app, we would look up the target_url from the service registry
    // For this demo, let's assume we get it or have a map.
    // Fetching from backend is better.

    axios.get(`${API_BASE}/services`).then(res => {
        const service = res.data.find(s => s.service_key === currentPayload.service_key);
        if (service) {
            try {
                const url = new URL(service.target_url);

                // Safe Base64 encoding for Unicode (Korean) characters
                const jsonStr = JSON.stringify(currentPayload);
                const encodedPayload = btoa(unescape(encodeURIComponent(jsonStr)));

                url.searchParams.set('payload', encodedPayload);
                url.searchParams.set('sv', currentPayload.schema_version);

                window.open(url.toString(), '_blank');
            } catch (e) {
                console.error("Payload encoding or URL error:", e);
                alert("서비스로 전송 중 오류가 발생했습니다: " + e.message);
            }
        }
    }).catch(err => {
        console.error("Error fetching services for handoff:", err);
    });
}

parseBtn.addEventListener('click', handleParse);
handoffBtn.addEventListener('click', handleHandoff);

// Initial health check
checkHealth();
setInterval(checkHealth, 5000);
