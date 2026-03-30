const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('magic-form');
    const input = document.getElementById('magic-input');
    const msgBox = document.getElementById('magic-message');
    const submitBtn = document.getElementById('magic-submit');
    const chips = document.querySelectorAll('.chip');

    // Pre-load services to make redirect instant
    let servicesCache = [];
    axios.get(`${API_BASE}/services`).then(res => {
        servicesCache = res.data;
    }).catch(e => console.error("Failed to load services cache", e));

    const handleParse = async (promptText) => {
        if (!promptText.trim()) return;

        // UI State: Loading
        input.disabled = true;
        submitBtn.innerHTML = '<div class="spinner"></div>';
        msgBox.classList.add('hidden');

        try {
            const parseRes = await axios.post(`${API_BASE}/parse`, { prompt: promptText });
            const payload = parseRes.data;

            if (payload.status === "ready" && payload.service_key) {
                // Instantly Hand off
                const service = servicesCache.find(s => s.service_key === payload.service_key);
                if (service) {
                    msgBox.textContent = "Redirecting...";
                    msgBox.classList.remove('hidden');
                    msgBox.classList.add('success');

                    const url = new URL(service.target_url);
                    // Safe UTF-8 Base64 Encoding
                    const encodedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
                    url.searchParams.set('payload', encodedPayload);
                    url.searchParams.set('sv', payload.schema_version);

                    // Redirect the current window to the service
                    window.location.href = url.toString();
                } else {
                    showError("Service target not found.");
                }
            } else {
                // Not ready, needs clarification or unsupported
                showError(payload.message || "I didn't quite get that.");
            }
        } catch (error) {
            console.error(error);
            showError("An error occurred connecting to the Router.");
        } finally {
            // Restore UI
            input.disabled = false;
            submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
            input.focus();
        }
    };

    function showError(text) {
        msgBox.textContent = text;
        msgBox.classList.remove('hidden', 'success');
        msgBox.classList.add('error');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleParse(input.value);
    });

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            input.value = prompt;
            handleParse(prompt);
        });
    });
});
