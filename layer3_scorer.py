def calculate_displacement(product, llm_result, det_result, competitors):
    """
    Layer 3: The novel Competitive Displacement Scorer & Priority Matrix.
    Combines LLM instinct with Deterministic logic to rank what needs fixing first.
    """
    category = product.get('category', '')
    
    # Smart fallback: if LLM failed, derive rejection probability from deterministic data
    ai_rejection_prob = llm_result.get("ai_rejection_probability", None)
    if ai_rejection_prob is None or llm_result.get("error"):
        # If det engine found issues, scale rejection prob from conversion_loss
        det_issues_count = len(det_result.get("deterministic_issues", []))
        conversion_loss = det_result.get("conversion_loss_weight", 0.0)
        ai_rejection_prob = min(0.4 + (conversion_loss * 0.5) + (det_issues_count * 0.1), 1.0)
        
    conversion_loss = det_result.get("conversion_loss_weight", 0.0)
    fix_diff = det_result.get("fix_difficulty_inverse", 1.0)
    
    # THE PRIORITY MATRIX ALGORITHM
    impact_score = (ai_rejection_prob * 0.5) + (conversion_loss * 0.3) + (fix_diff * 0.2)
    
    priority = "MEDIUM"
    if impact_score > 0.75:
        priority = "CRITICAL"
    elif impact_score >= 0.50:
        priority = "HIGH"
        
    # DISPLACEMENT RISK EXPOSURE
    # Find the generic competitor matching this product's broad category
    comp = next((c for c in competitors if c.get('category','').lower() in category.lower() or category.lower() in c.get('category','').lower()), None)
    
    if comp and ai_rejection_prob > 0.6:
        displacement_risk = f"SEVERE: An AI shopping agent is highly likely to ignore this product and recommend the '{comp.get('competitor_name')}' instead because of gaps."
        rival_advantage = comp.get('strengths')
    elif ai_rejection_prob <= 0.3:
        displacement_risk = "LOW: AI safely understands this product."
        rival_advantage = "N/A"
    else:
        displacement_risk = "MODERATE: Vulnerable to highly-specific generic listings."
        rival_advantage = comp.get('strengths') if comp else "N/A"
        
    return {
        "calculated_impact_score": round(impact_score, 2),
        "priority_rank": priority,
        "displacement_risk": displacement_risk,
        "competitor_advantage_note": rival_advantage
    }
