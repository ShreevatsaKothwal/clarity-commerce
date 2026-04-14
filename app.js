document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('productGrid');
    const modal = document.getElementById('inspectorModal');
    const closeBtn = document.getElementById('closeModal');
    let productData = [];

    // Fetch JSON safely
    fetch('shopmind_results.json')
        .then(response => response.json())
        .then(data => {
            productData = data;
            renderGrid(data);
            updateStats(data);
        })
        .catch(err => {
            console.error("Error loading JSON.", err);
            // CORS Fallback warning
            grid.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); padding: 2rem; border-radius: 12px; border: 1px solid #ef4444; width: 100%; grid-column: 1 / -1; color: #fca5a5;">
                    <h3 style="margin-bottom: 1rem;">⚠️ Cross-Origin Request Blocked</h3>
                    <p style="margin-bottom: 1rem;">You cannot load local JSON files directly via the file:// protocol in modern browsers for security reasons.</p>
                    <p>Instead of double-clicking index.html, run a quick local server in your terminal:</p>
                    <code style="background: rgba(0,0,0,0.5); padding: 0.5rem; display: block; margin-top: 1rem; border-radius: 4px;">python3 -m http.server 8000</code>
                    <p style="margin-top: 1rem;">Then open <strong>http://localhost:8000</strong> in your browser!</p>
                </div>
            `;
        });

    function renderGrid(data) {
        grid.innerHTML = '';
        data.forEach((p, index) => {
            const priorityClass = p.priority ? p.priority.toLowerCase() : 'medium';
            const riskText = p.displacement_risk || "Risk profile unavailable";
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${p.title}</div>
                    <div class="badge ${priorityClass}">${p.priority}</div>
                </div>
                <div class="card-risk">
                    <strong>Displacement Risk:</strong><br/>
                    ${riskText.slice(0, 95)}...
                </div>
                <div class="card-footer">
                    <span>Impact Score: ${p.impact_score}</span>
                    <span style="color:var(--color-accent)">Inspect ➔</span>
                </div>
            `;
            
            card.addEventListener('click', () => openModal(p));
            grid.appendChild(card);
        });
    }

    function updateStats(data) {
        const statsObj = document.getElementById('headerStats');
        const count = data.length;
        const criticalCount = data.filter(p => p.priority === "CRITICAL").length;
        statsObj.innerText = `Total Audited: ${count} | Critical Issues: ${criticalCount}`;
    }

    function openModal(p) {
        const priorityClass = p.priority ? p.priority.toLowerCase() : 'medium';
        
        // Header
        const badge = document.getElementById('modalBadge');
        badge.className = `badge ${priorityClass}`;
        badge.innerText = p.priority;
        document.getElementById('modalTitle').innerText = p.title;

        // Risk Text
        document.getElementById('modalRisk').innerText = p.displacement_risk;
        document.getElementById('modalCompetitor').innerText = p.competitor_advantage;

        // Layer 2A: Personas
        const personasContainer = document.getElementById('modalPersonas');
        personasContainer.innerHTML = '';
        if (p.llm_persona_verdicts && Object.keys(p.llm_persona_verdicts).length > 0) {
            for (let [personaName, data] of Object.entries(p.llm_persona_verdicts)) {
                if(data.verdict) {
                    const cleanName = personaName.replace('_', ' ').toUpperCase();
                    const vClass = data.verdict.toLowerCase() === 'buy' ? 'buy' : 'reject';
                    const icon = vClass === 'buy' ? '✅' : '❌';
                    personasContainer.innerHTML += `
                        <div class="persona-item ${vClass}">
                            <div class="persona-verdict ${vClass}">${icon} ${cleanName}: ${data.verdict.toUpperCase()}</div>
                            <div class="persona-reason">${data.reason}</div>
                        </div>
                    `;
                }
            }
        } else {
            personasContainer.innerHTML = '<div class="persona-item reject"><div class="persona-verdict reject">⚠️ RATE LIMIT ERROR</div><div class="persona-reason">LLM failed to respond. The system seamlessly fell back to the Deterministic Python layer to evaluate this product.</div></div>';
        }

        // Layer 2B: Deterministic rules
        const detContainer = document.getElementById('modalDeterministic');
        detContainer.innerHTML = '';
        if (p.deterministic_issues && p.deterministic_issues.length > 0) {
            p.deterministic_issues.forEach(issue => {
                detContainer.innerHTML += `<li>${issue}</li>`;
            });
        } else {
            detContainer.innerHTML = '<li style="border-left-color: var(--color-medium); color: #6ee7b7;">No Python deterministic rule violations detected.</li>';
        }

        // Suggested Fix
        const fixText = document.getElementById('modalFixText');
        if (p.suggested_fix && p.suggested_fix.updated_text) {
             fixText.innerText = p.suggested_fix.updated_text;
        } else {
             fixText.innerText = "No AI generated fix available. A manual override involves rewriting the product to resolve the python-listed errors above.";
        }

        modal.classList.add('active');
    }

    // Modal Events
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('active');
    });
});
