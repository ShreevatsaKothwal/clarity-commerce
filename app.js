document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('productGrid');
    const modal = document.getElementById('inspectorModal');
    const closeBtn = document.getElementById('closeModal');
    let productData = [];

    // Fetch JSON safely
    fetch('shopmind_results.json')
        .then(response => response.json())
        .then(data => {
            productData = data.products;
            renderGrid(data.products);
            updateStats(data);
        })
        .catch(err => {
            console.error("Error loading JSON.", err);
            // CORS Fallback warning
            grid.innerHTML = `
                <div style="background: var(--bg-danger); padding: 2rem; border-radius: 12px; border: 1px solid #fecaca; width: 100%; grid-column: 1 / -1; color: var(--text-danger);">
                    <h3 style="margin-bottom: 1rem;">⚠️ Cross-Origin Request Blocked</h3>
                    <p style="margin-bottom: 1rem;">You cannot load local JSON files directly via the file:// protocol in modern browsers for security reasons.</p>
                    <p>Instead of double-clicking index.html, run a quick local server in your terminal:</p>
                    <code style="background: rgba(0,0,0,0.05); padding: 0.5rem; display: block; margin-top: 1rem; border-radius: 4px; color: var(--text-primary);">python3 server.py</code>
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
                    <span style="color:var(--color-primary); font-weight: 500;">Inspect ➔</span>
                </div>
            `;
            
            card.addEventListener('click', () => openModal(p));
            grid.appendChild(card);
        });
    }

    function updateStats(data) {
        const statsObj = document.getElementById('headerStats');
        const count = data.products ? data.products.length : 0;
        const criticalCount = data.products ? data.products.filter(p => p.priority === "CRITICAL").length : 0;
        const score = data.store_summary ? data.store_summary.store_ai_readiness_score : "N/A";
        const verdict = data.store_summary ? data.store_summary.verdict : "N/A";
        statsObj.innerText = `Total Audited: ${count} | Critical Issues: ${criticalCount} | Store AI Readiness: ${score}% (${verdict})`;
        
        // Populate new Store Summary Panel
        if (data.store_summary) {
            const panel = document.getElementById('storeSummaryPanel');
            if (panel) {
                panel.style.display = 'flex';
                document.getElementById('summaryScore').innerText = data.store_summary.store_ai_readiness_score;
                document.getElementById('summaryVerdict').innerText = data.store_summary.verdict;
                
                const warningEl = document.getElementById('summaryWarning');
                if (data.store_summary.store_level_warning) {
                    warningEl.innerText = `⚠️ ${data.store_summary.store_level_warning}`;
                } else {
                    warningEl.innerText = "";
                }
                
                // Color circle based on score
                const circle = document.querySelector('.score-circle');
                if (data.store_summary.store_ai_readiness_score < 50) {
                    circle.style.borderColor = "var(--color-danger)";
                    document.getElementById('summaryVerdict').style.color = "var(--color-danger)";
                } else if (data.store_summary.store_ai_readiness_score < 75) {
                    circle.style.borderColor = "var(--color-warning)";
                    document.getElementById('summaryVerdict').style.color = "var(--color-warning)";
                } else {
                    circle.style.borderColor = "var(--color-success)";
                    document.getElementById('summaryVerdict').style.color = "var(--color-success)";
                    warningEl.style.color = "var(--text-secondary)";
                }
            }
        }
    }

    function openModal(p) {
        const priorityClass = p.priority ? p.priority.toLowerCase() : 'medium';
        const priceText = p.price ? `$${p.price.toFixed(2)}` : '$$$'; 
        const categoryText = p.category ? p.category : 'E-Commerce Product';
        const modalContainer = document.getElementById('modalContentContainer');

        let personasHtml = '';
        if (p.llm_persona_verdicts && Object.keys(p.llm_persona_verdicts).length > 0) {
            for (let [personaName, data] of Object.entries(p.llm_persona_verdicts)) {
                if(data.verdict) {
                    const cleanName = personaName.replace('_', ' ').toUpperCase();
                    const vClass = data.verdict.toLowerCase() === 'buy' ? 'buy' : 'reject';
                    const icon = vClass === 'buy' ? '✔' : '❌';
                    personasHtml += `<div class="decision-row ${vClass}">
                        <span class="decision-icon">${icon}</span> 
                        <span class="decision-name">${cleanName}</span> 
                        <span class="decision-arrow">→</span> 
                        <span class="decision-verdict">${data.verdict.toUpperCase()}</span>
                    </div>`;
                }
            }
        } else {
            personasHtml = '<div class="decision-row reject"><span class="decision-icon">⚠️</span> <span class="decision-name">RATE LIMIT ERROR</span></div>';
        }

        let issuesHtml = '';
        if (p.deterministic_issues && p.deterministic_issues.length > 0) {
            p.deterministic_issues.forEach(issue => {
                issuesHtml += `<li>• ${issue}</li>`;
            });
        } else {
            issuesHtml = '<li style="color: var(--color-success);">• No deterministic rule violations detected.</li>';
        }

        let fixHtml = '';
        if (p.suggested_fix && p.suggested_fix.updated_text) {
             const paragraphs = p.suggested_fix.updated_text.split('\n').filter(t => t.trim() !== '');
             fixHtml = paragraphs.map(t => `<p>${t}</p>`).join('');
        } else {
             fixHtml = "<p>No improved listing available.</p>";
        }

        modalContainer.innerHTML = `
            <button class="close-btn" id="closeModal">×</button>
            <div class="product-modal-layout">
                <!-- LEFT COLUMN -->
                <div class="product-info-col">
                    <div class="product-image-placeholder">
                        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        <span>No Image Available</span>
                    </div>
                    <div class="product-meta">
                        <div class="product-category">${categoryText}</div>
                        <h2 class="product-title">${p.title}</h2>
                        <div class="product-price">${priceText}</div>
                        <span class="badge ${priorityClass}">${p.priority} PRIORITY</span>
                    </div>
                    <div class="product-desc-summary">
                        <strong>Current Description:</strong><br/>
                        ${p.description ? p.description : '<span style="color:#9ca3af;">(Description not provided in audit payload)</span>'}
                    </div>
                </div>

                <!-- RIGHT COLUMN -->
                <div class="product-insights-col">
                    
                    <!-- SECTION 1: RISK ALERT -->
                    <div class="insight-section risk-banner">
                        <h3>⚠️ Risk: High Displacement</h3>
                        <p>${p.displacement_risk}</p>
                        <div class="competitor-text"><strong>Rival Advantage:</strong> ${p.competitor_advantage}</div>
                    </div>

                    <!-- SECTION 2: AI DECISION SUMMARY -->
                    <div class="insight-section">
                        <h3>🤖 AI Decision Summary</h3>
                        <div class="ai-decision-list">
                            ${personasHtml}
                        </div>
                    </div>

                    <!-- SECTION 3: KEY ISSUES -->
                    <div class="insight-section">
                        <h3>⚙️ Key Issues Detected</h3>
                        <ul class="key-issues-list">
                            ${issuesHtml}
                        </ul>
                    </div>

                    <!-- SECTION 4: IMPROVED LISTING -->
                    <div class="insight-section">
                        <h3>💡 Improved Listing</h3>
                        <div class="improved-listing-box">
                            ${fixHtml}
                        </div>
                    </div>

                    <!-- SECTION 5: PRIMARY ACTION -->
                    <button class="apply-btn" id="applyFixBtn">Apply Improved Listing</button>

                </div>
            </div>
        `;

        // Bind events
        document.getElementById('closeModal').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        const applyBtn = document.getElementById('applyFixBtn');
        applyBtn.addEventListener('click', () => {
            if (!p.suggested_fix || !p.suggested_fix.updated_text) {
                alert("No valid fix available to apply.");
                return;
            }
            
            applyBtn.innerText = "Applying...";
            applyBtn.disabled = true;
            
            fetch('/api/apply_fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: p.product_id, updated_text: p.suggested_fix.updated_text })
            })
            .then(res => res.json())
            .then(data => {
                applyBtn.innerText = "✅ Listing Applied";
                applyBtn.style.background = "var(--color-success)";
                
                // Visual update to the card in grid
                const cards = document.querySelectorAll('.product-card');
                cards.forEach(card => {
                    if (card.querySelector('.card-title').innerText === p.title) {
                        card.style.borderColor = "var(--color-success)";
                        const badge = card.querySelector('.badge');
                        badge.className = "badge fixed";
                        badge.innerText = "FIXED";
                        card.querySelector('.card-risk').innerHTML = "<strong>Status:</strong><br/>Optimized for AI Agents. Ready for sync.";
                        card.classList.add('fixed-animation');
                    }
                });
                
                setTimeout(() => {
                    modal.classList.remove('active');
                }, 1000);
            })
            .catch(err => {
                console.error(err);
                applyBtn.innerText = "Error - See Console";
                applyBtn.disabled = false;
            });
        });

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
