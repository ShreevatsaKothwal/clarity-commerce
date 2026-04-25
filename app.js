console.log("app.js loaded at the top level");
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('productGrid');
    const modal = document.getElementById('inspectorModal');
    const closeBtn = document.getElementById('closeModal');
    let productData = [];
    let lastKnownSummary = null;

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
            const priorityClass = p.isFixed ? 'fixed' : (p.priority ? p.priority.toLowerCase() : 'medium');
            const priorityText = p.isFixed ? 'FIXED' : p.priority;
            const riskText = p.displacement_risk || "Risk profile unavailable";
            
            let descHtml = '';
            let footerHtml = '';
            
            if (p.isFixed) {
                const newText = p.appliedFixText || 'Optimized description';
                descHtml = `<strong>Optimized Description:</strong><br/>${newText.slice(0, 95).replace(/\n/g, ' ')}...`;
                footerHtml = `<span>AI-Optimized &middot; Synced to Store</span>`;
            } else {
                descHtml = `<strong>Displacement Risk:</strong><br/>${riskText.slice(0, 95)}...`;
                footerHtml = `<span>Impact Score: ${p.impact_score}</span>`;
            }
            
            const cardClass = p.isFixed ? 'product-card fixed-card' : 'product-card';
            
            const card = document.createElement('div');
            card.className = cardClass;
            card.innerHTML = `
                <div class="card-header">
                    <div class="card-title">${p.title}</div>
                    <div class="badge ${priorityClass}">${priorityText}</div>
                </div>
                <div class="card-risk">
                    ${descHtml}
                </div>
                <div class="card-footer">
                    ${footerHtml}
                    <span style="color:var(--color-primary); font-weight: 500;">Inspect</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                openModal(p);
            });
            grid.appendChild(card);
        });
    }

    function updateStats(data) {
        if (data.store_summary) {
            lastKnownSummary = data.store_summary;
        }

        const statsObj = document.getElementById('headerStats');
        const count = data.products ? data.products.length : 0;
        const criticalCount = data.products ? data.products.filter(p => p.priority === "CRITICAL").length : 0;
        const score = lastKnownSummary ? lastKnownSummary.store_ai_readiness_score : "N/A";
        const verdict = lastKnownSummary ? lastKnownSummary.verdict : "N/A";
        statsObj.innerText = `Total Audited: ${count} | Critical Issues: ${criticalCount} | Store AI Readiness: ${score}% (${verdict})`;
        
        // Populate new Store Summary Panel
        if (lastKnownSummary) {
            const panel = document.getElementById('storeSummaryPanel');
            if (panel) {
                panel.style.display = 'flex';
                document.getElementById('summaryScore').innerText = lastKnownSummary.store_ai_readiness_score;
                document.getElementById('summaryVerdict').innerText = lastKnownSummary.verdict;
                
                const warningEl = document.getElementById('summaryWarning');
                if (lastKnownSummary.store_level_warning) {
                    warningEl.innerText = `${lastKnownSummary.store_level_warning}`;
                } else {
                    warningEl.innerText = "";
                }
                
                // Update gauge
                const gaugeFill = document.getElementById('gaugeFill');
                const scoreValue = parseFloat(lastKnownSummary.store_ai_readiness_score) || 0;
                const offset = 125.66 - (125.66 * scoreValue / 100);
                
                setTimeout(() => {
                    if (gaugeFill) {
                        gaugeFill.style.strokeDashoffset = offset;
                    }
                }, 50);

                if (scoreValue < 50) {
                    if (gaugeFill) gaugeFill.style.stroke = "var(--color-danger)";
                    document.getElementById('summaryVerdict').style.color = "var(--color-danger)";
                } else if (scoreValue < 75) {
                    if (gaugeFill) gaugeFill.style.stroke = "var(--color-warning)";
                    document.getElementById('summaryVerdict').style.color = "var(--color-warning)";
                } else {
                    if (gaugeFill) gaugeFill.style.stroke = "var(--color-success)";
                    document.getElementById('summaryVerdict').style.color = "var(--color-success)";
                    warningEl.style.color = "var(--text-secondary)";
                }
            }
        }
    }

    function openModal(p) {
        const modalContainer = document.getElementById('modalContentContainer');
        
        if (p.isFixed === true) {
            modalContainer.innerHTML = `
                <button class="close-btn" id="closeModal">×</button>
                <div style="background: #dcfce7; padding: 1rem; border-radius: 8px; border: 1px solid #bbf7d0; color: #166534; font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>✅</span> This listing has been optimized and synced to store.
                </div>
                <h2 style="margin-bottom: 1.5rem;">Optimization Applied</h2>
                <div class="split-view-container" style="display: grid; grid-template-columns: 1fr 40px 1fr; gap: 1rem; align-items: stretch;">
                    <div class="split-col split-left" style="background: #fff5f5; padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
                        <h3 style="margin-top: 0; margin-bottom: 1rem;">Original Listing</h3>
                        <div style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); flex-grow: 1;">
                            <div style="margin-bottom:0.5rem;"><strong>Title:</strong> ${p.title}</div>
                            <div><strong>Description:</strong><br/>${(p.originalDescription || p.description || 'Not provided').replace(/\n/g, '<br/>')}</div>
                        </div>
                    </div>
                    <div class="split-arrow" style="display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #9ca3af;">→</div>
                    <div class="split-col split-right" style="background: #f0fdf4; padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
                        <h3 style="margin-top: 0; margin-bottom: 1rem;">AI-Optimized Listing</h3>
                        <div style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); flex-grow: 1;">
                            <div style="margin-bottom:0.5rem;"><strong>Title:</strong> ${p.title}</div>
                            <div><strong>Description:</strong><br/>
                                <div style="background: #dcfce7; padding: 1rem; border-radius: 8px; border: 1px solid #bbf7d0; margin-top: 0.5rem;">
                                    ${(p.appliedFixText || '').replace(/\n/g, '<br/>')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="result-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                    <button class="secondary-btn" id="reviewCloseBtn" style="width: 150px; flex: none;">Close</button>
                </div>
            `;
            document.getElementById('closeModal').addEventListener('click', () => {
                modal.classList.remove('active');
            });
            document.getElementById('reviewCloseBtn').addEventListener('click', () => {
                modal.classList.remove('active');
            });
            modal.classList.add('active');
            return;
        }

        const priorityClass = p.priority ? p.priority.toLowerCase() : 'medium';
        const priceText = p.price ? `₹${p.price.toFixed(2)}` : '₹₹₹'; 
        const categoryText = p.category ? p.category : 'E-Commerce Product';


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
                
                p.originalDescription = p.description;
                p.appliedFixText = p.suggested_fix.updated_text;
                p.isFixed = true;
                
                // Visual update to the card in grid
                const cards = document.querySelectorAll('.product-card');
                cards.forEach(card => {
                    if (card.querySelector('.card-title').innerText === p.title) {
                        card.style.borderColor = "var(--color-success)";
                        const badge = card.querySelector('.badge');
                        badge.className = "badge fixed";
                        badge.innerText = "FIXED";
                        card.querySelector('.card-risk').innerHTML = `<strong>Optimized Description:</strong><br/>${p.appliedFixText.slice(0, 95).replace(/\n/g, ' ')}...`;
                        card.querySelector('.card-footer').innerHTML = `<span>AI-Optimized &middot; Synced to Store</span><span style="color:var(--color-primary); font-weight: 500;">Inspect</span>`;
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
            el.querySelector('.step-status').innerHTML = '<span style="color: #16a34a; font-weight: bold; font-size: 1rem;">✓</span>';
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
        let rejectCount = 0;
        let rejectingPersona = '';
        if (result.llm_persona_verdicts && Object.keys(result.llm_persona_verdicts).length > 0) {
            for (let [name, data] of Object.entries(result.llm_persona_verdicts)) {
                const vClass = data.verdict === 'buy' ? 'buy' : 'reject';
                const icon = vClass === 'buy' ? 'Buy' : 'Reject';
                if (vClass === 'reject') {
                    rejectCount++;
                    if (!rejectingPersona) rejectingPersona = name.replace('_', ' ');
                }
                personasHtml += `<div class="decision-row ${vClass}">
                    ${icon} <strong>${name.replace('_',' ').toUpperCase()}</strong> → ${data.verdict.toUpperCase()}
                    <br/><small>${data.reason}</small>
                </div>`;
            }
        } else {
            personasHtml = '<p style="color:var(--text-secondary)">AI persona verdicts unavailable (rate limit hit — deterministic fallback was used).</p>';
        }

        let aiUnderstoodText = "AI correctly understood this product";
        if (rejectCount >= 2) {
            aiUnderstoodText = "AI classified this product as ambiguous and deprioritized it in search results";
        } else if (rejectCount === 1) {
            aiUnderstoodText = `AI partially understood this product but flagged gaps in ${rejectingPersona}'s area`;
        }

        const impactVal = parseFloat(result.impact_score) || 0;
        let impactColorClass = "green";
        if (impactVal > 0.75) impactColorClass = "red";
        else if (impactVal >= 0.5) impactColorClass = "amber";

        const intentGapHtml = `
            <div class="intent-gap-screen">
                <div class="intent-gap-title">Intent Gap Detected</div>
                <div class="intent-boxes">
                    <div class="intent-box">
                        <h4>What You Intended</h4>
                        <p>${product.merchant_intent || "Not specified"}</p>
                    </div>
                    <div class="intent-box">
                        <h4>What AI Actually Understood</h4>
                        <p>${aiUnderstoodText}</p>
                    </div>
                </div>
                <div class="impact-score-display">
                    <div style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Displacement Impact Score</div>
                    <div class="impact-score-value ${impactColorClass}">${result.impact_score}</div>
                </div>
                <button class="apply-btn" id="seeFullAnalysisBtn" style="margin-top: 1rem; width: auto; padding: 0.75rem 2rem;">See Full Analysis →</button>
            </div>
        `;

        const rejectionRisk = Math.round(impactVal * 100);
        
        let hasValidFix = result.suggested_fix && result.suggested_fix.updated_text && result.suggested_fix.updated_text.trim() !== '';
        let fixContentHtml = '';
        let fixBoxClass = 'highlight-green';
        let fixLabelHtml = '';

        if (hasValidFix) {
            fixContentHtml = result.suggested_fix.updated_text.replace(/\n/g, '<br/>');
        } else {
            fixBoxClass = 'highlight-amber';
            let numberedIssues = '';
            if (result.deterministic_issues && result.deterministic_issues.length > 0) {
                result.deterministic_issues.forEach((issue, index) => {
                    numberedIssues += `${index + 1}. ${issue}<br/>`;
                });
            } else {
                numberedIssues = '1. General content gaps detected.<br/>';
            }
            
            fixLabelHtml = `<div style="font-size: 0.85rem; color: #b45309; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">⚠️ AI rewrite unavailable (API limit) — improvement guide generated instead</div>`;
            
            fixContentHtml = `Based on our analysis, here is what needs to be improved in this listing:<br/>
${numberedIssues}<br/>
To fix this product for AI readiness:<br/>
- Add precise dimensions and measurements<br/>
- Resolve any title-description contradictions<br/>
- Add material specifications<br/>
- Ensure the title contains at least 4 descriptive words`;
        }
        
        const splitViewHtml = `
            <div class="split-view-container">
                <div class="split-col split-left">
                    <h3>Current Listing — What Merchant Submitted</h3>
                    <div class="split-card">
                        <div style="margin-bottom:0.5rem;"><strong>Title:</strong> ${product.title}</div>
                        <div style="margin-bottom:0.5rem;"><strong>Description:</strong><br/>${product.description || 'Not provided'}</div>
                        <div><strong>Intent:</strong><br/>${product.merchant_intent || 'Not provided'}</div>
                    </div>
                    <div class="split-warning-box">
                        <h4>How AI Currently Sees This Product</h4>
                        <p style="margin-bottom: 0.5rem;">${result.displacement_risk || 'Unknown risk'}</p>
                        <p style="margin-bottom: 0.5rem; font-weight: bold;">AI Rejection Risk: ${rejectionRisk}%</p>
                        <div style="margin-top: 0.5rem;">
                            <strong>Issues Detected:</strong>
                            <ul class="key-issues-list" style="margin-top: 0.25rem;">${issuesHtml}</ul>
                        </div>
                    </div>
                </div>

                <div class="split-arrow">→</div>

                <div class="split-col split-right">
                    <h3>AI-Optimized Listing — What ShopMind Recommends</h3>
                    <div class="split-card">
                        <div style="margin-bottom:0.5rem;"><strong>Title:</strong> ${product.title}</div>
                        <div><strong>Description:</strong></div>
                        ${fixLabelHtml}
                        <div class="improved-listing-box ${fixBoxClass}" style="margin-top:0.5rem;">
                            ${fixContentHtml}
                        </div>
                    </div>
                    <div class="split-success-box">
                        <h4>How AI Will See This After Fix</h4>
                        <div class="displacement-low">Displacement Risk: LOW after applying this fix</div>
                        <div class="ai-decision-list split-list">${personasHtml}</div>
                    </div>
                </div>
            </div>
            <div class="result-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button class="apply-btn" id="splitApplyBtn" style="margin-top:0;">Apply Fix & Add to Dashboard</button>
                <button class="secondary-btn" id="splitDiscardBtn" style="margin-top:0;">Discard & Close</button>
            </div>
        `;

        container.style.display = 'block';
        container.innerHTML = intentGapHtml;

        let transitioned = false;
        const transitionToSplit = () => {
            if (transitioned) return;
            transitioned = true;
            container.innerHTML = splitViewHtml;
            
            document.getElementById('splitDiscardBtn').addEventListener('click', () => {
                document.getElementById('analysisOverlay').classList.remove('active');
            });

            document.getElementById('splitApplyBtn').addEventListener('click', () => {
                const applyBtn = document.getElementById('splitApplyBtn');
                applyBtn.innerText = "Applying...";
                applyBtn.disabled = true;

                let textToSave = '';
                if (hasValidFix) {
                    textToSave = result.suggested_fix.updated_text;
                } else {
                    let numberedIssuesText = '';
                    if (result.deterministic_issues && result.deterministic_issues.length > 0) {
                        result.deterministic_issues.forEach((issue, index) => {
                            numberedIssuesText += `${index + 1}. ${issue}\n`;
                        });
                    } else {
                        numberedIssuesText = '1. General content gaps detected.\n';
                    }
                    textToSave = `Based on our analysis, here is what needs to be improved in this listing:\n${numberedIssuesText}\nTo fix this product for AI readiness:\n- Add precise dimensions and measurements\n- Resolve any title-description contradictions\n- Add material specifications\n- Ensure the title contains at least 4 descriptive words`;
                }

                fetch('/api/apply_fix', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: result.product_id, updated_text: textToSave })
                })
                .then(res => res.json())
                .then(data => {
                    result.isFixed = true;
                    result.originalDescription = product.description;
                    result.appliedFixText = textToSave;
                    addToDashboard(result);
                    document.getElementById('analysisOverlay').classList.remove('active');
                })
                .catch(err => {
                    console.error(err);
                    applyBtn.innerText = "Error - See Console";
                    applyBtn.disabled = false;
                });
            });
        };

        const seeFullBtn = document.getElementById('seeFullAnalysisBtn');
        if (seeFullBtn) {
            seeFullBtn.addEventListener('click', transitionToSplit);
        }

        setTimeout(() => {
            transitionToSplit();
        }, 2000);
    }

    function addToDashboard(result) {
        productData.push(result);
        renderGrid(productData);
        document.getElementById('analysisOverlay').classList.remove('active');
        updateStats({ products: productData, store_summary: null });
    }
    
    window.addToDashboard = addToDashboard;
});
