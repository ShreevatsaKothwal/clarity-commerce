console.log("app.js loaded at the top level");
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
                    <h3 style="margin-bottom: 1rem;">Cross-Origin Request Blocked</h3>
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
                    <span style="color:var(--color-primary); font-weight: 500;">Inspect</span>
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
                    warningEl.innerText = `${data.store_summary.store_level_warning}`;
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
                    const icon = vClass === 'buy' ? 'Buy' : 'Reject';
                    personasHtml += `<div class="decision-row ${vClass}">
                        <span class="decision-icon">${icon}</span> 
                        <span class="decision-name">${cleanName}</span> 
                        <span class="decision-arrow">→</span> 
                        <span class="decision-verdict">${data.verdict.toUpperCase()}</span>
                    </div>`;
                }
            }
        } else {
            personasHtml = '<div class="decision-row reject"><span class="decision-icon"></span> <span class="decision-name">RATE LIMIT ERROR</span></div>';
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
                        <h3>Risk: High Displacement</h3>
                        <p>${p.displacement_risk}</p>
                        <div class="competitor-text"><strong>Rival Advantage:</strong> ${p.competitor_advantage}</div>
                    </div>

                    <!-- SECTION 2: AI DECISION SUMMARY -->
                    <div class="insight-section">
                        <h3>AI Decision Summary</h3>
                        <div class="ai-decision-list">
                            ${personasHtml}
                        </div>
                    </div>

                    <!-- SECTION 3: KEY ISSUES -->
                    <div class="insight-section">
                        <h3>Key Issues Detected</h3>
                        <ul class="key-issues-list">
                            ${issuesHtml}
                        </ul>
                    </div>

                    <!-- SECTION 4: IMPROVED LISTING -->
                    <div class="insight-section">
                        <h3>Improved Listing</h3>
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
                applyBtn.innerText = "Listing Applied";
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
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('active');
    });

    console.log("Setting up event listeners for product form...");
    const openBtn = document.getElementById('openFormBtn');
    console.log("openFormBtn element:", openBtn);
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            console.log("openFormBtn clicked!");
            document.getElementById('productFormOverlay').classList.add('active');
        });
    }

    document.getElementById('closeFormBtn').addEventListener('click', () => {
        document.getElementById('productFormOverlay').classList.remove('active');
    });

    document.getElementById('submitProductBtn').addEventListener('click', async () => {
        const title = document.getElementById('f_title').value.trim();
        const price = parseFloat(document.getElementById('f_price').value);
        const category = document.getElementById('f_category').value;
        const description = document.getElementById('f_desc').value.trim();
        const merchant_intent = document.getElementById('f_intent').value.trim();
        const image_url = document.getElementById('f_image').value.trim();

        if (!title || !category) {
            alert('Please fill in at least Title and Category.');
            return;
        }

        const product = {
            id: 'live_' + Date.now(),
            title, price, category, description, merchant_intent,
            image_url: image_url || null
        };

        document.getElementById('productFormOverlay').classList.remove('active');
        document.getElementById('analysisOverlay').classList.add('active');
        document.getElementById('analysisResult').style.display = 'none';

        await runLiveAnalysis(product);
    });

    async function runLiveAnalysis(product) {
        const stepsContainer = document.getElementById('analysisSteps');
        stepsContainer.innerHTML = '';

        const steps = [
            { id: 'step1', icon: '', text: 'Ingesting product data into audit context...' },
            { id: 'step2', icon: '', text: 'Running deterministic rule engine (12 checks)...' },
            { id: 'step3', icon: '', text: 'Simulating AI buyer personas (Travel Planner, Deal Finder, Stylist)...' },
            { id: 'step4', icon: '', text: 'Calculating Competitive Displacement Score...' },
            { id: 'step5', icon: '', text: 'Updating Store AI Readiness Score...' },
        ];

        // Render all steps as pending
        steps.forEach(s => {
            stepsContainer.innerHTML += `
                <div class="analysis-step pending" id="${s.id}">
                    <span class="step-icon">${s.icon}</span>
                    <span class="step-text">${s.text}</span>
                    <span class="step-status">Pending</span>
                </div>
            `;
        });

        // Animate each step completing
        for (let i = 0; i < steps.length; i++) {
            await delay(900);
            const el = document.getElementById(steps[i].id);
            el.classList.remove('pending');
            el.classList.add('done');
            el.querySelector('.step-status').innerText = 'Done';
        }

        // Now call the real backend
        try {
            const response = await fetch('/api/analyze_product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            const result = await response.json();
            showAnalysisResult(result, product);
        } catch (err) {
            document.getElementById('analysisResult').style.display = 'block';
            document.getElementById('analysisResult').innerHTML = `<p style="color:red;">Analysis failed. Is the server running?</p>`;
        }
    }

    function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

    function showAnalysisResult(result, product) {
        const container = document.getElementById('analysisResult');
        const priorityClass = result.priority ? result.priority.toLowerCase() : 'medium';

        let issuesHtml = '';
        if (result.deterministic_issues && result.deterministic_issues.length > 0) {
            result.deterministic_issues.forEach(i => { issuesHtml += `<li>• ${i}</li>`; });
        } else {
            issuesHtml = '<li style="color:var(--color-success)">• No rule violations detected.</li>';
        }

        let personasHtml = '';
        if (result.llm_persona_verdicts && Object.keys(result.llm_persona_verdicts).length > 0) {
            for (let [name, data] of Object.entries(result.llm_persona_verdicts)) {
                const vClass = data.verdict === 'buy' ? 'buy' : 'reject';
                const icon = vClass === 'buy' ? 'Buy' : 'Reject';
                personasHtml += `<div class="decision-row ${vClass}">
                    ${icon} <strong>${name.replace('_',' ').toUpperCase()}</strong> → ${data.verdict.toUpperCase()}
                    <br/><small>${data.reason}</small>
                </div>`;
            }
        } else {
            personasHtml = '<p style="color:var(--text-secondary)">AI persona verdicts unavailable (rate limit hit — deterministic fallback was used).</p>';
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <div>
                        <h3>${product.title}</h3>
                        <p style="color:var(--text-secondary)">${product.category} · $${product.price}</p>
                    </div>
                    <span class="badge ${priorityClass}">${result.priority}</span>
                </div>
                <div class="result-score">
                    Impact Score: <strong>${result.impact_score}</strong> &nbsp;|&nbsp;
                    ${result.displacement_risk}
                </div>
                <div class="result-split">
                    <div>
                        <h4>Issues Detected</h4>
                        <ul class="key-issues-list">${issuesHtml}</ul>
                    </div>
                    <div>
                        <h4>AI Persona Verdicts</h4>
                        <div class="ai-decision-list">${personasHtml}</div>
                    </div>
                </div>
                ${result.suggested_fix && result.suggested_fix.updated_text ? `
                <div class="result-fix">
                    <h4>AI-Suggested Improved Listing</h4>
                    <div class="improved-listing-box"><p>${result.suggested_fix.updated_text}</p></div>
                </div>` : ''}
                <div class="result-actions">
                    <button class="apply-btn" onclick="addToDashboard(${JSON.stringify(result).replace(/'/g, "&#39;")})">
                        Add to Dashboard
                    </button>
                    <button class="secondary-btn" onclick="document.getElementById('analysisOverlay').classList.remove('active')">
                        Close
                    </button>
                </div>
            </div>
        `;
    }

    function addToDashboard(result) {
        productData.push(result);
        renderGrid(productData);
        document.getElementById('analysisOverlay').classList.remove('active');
        updateStats({ products: productData, store_summary: null });
    }
    
    window.addToDashboard = addToDashboard;
});
