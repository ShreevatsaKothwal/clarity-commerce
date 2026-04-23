def generate_store_summary(results, store_context):
    total = len(results)
    critical = sum(1 for r in results if r.get('priority') == 'CRITICAL')
    high = sum(1 for r in results if r.get('priority') == 'HIGH')
    medium = sum(1 for r in results if r.get('priority') == 'MEDIUM')
    
    avg_score = round(sum(r.get('impact_score', 0) for r in results) / total, 2) if total else 0
    
    # Store AI Readiness Score: inverse of average impact (higher impact = lower readiness)
    store_readiness_score = round((1 - avg_score) * 100, 1)
    
    # Trust signal check
    trust = store_context.get('trust_signals', {})
    faq_warning = None
    if trust.get('faq_coverage', '').lower() in ['low', 'moderate', 'none']:
        faq_warning = f"Store FAQ coverage is '{trust.get('faq_coverage')}'. AI agents answering buyer questions will find gaps and lose trust."
    
    return {
        "store_name": store_context.get('store_name', 'Unknown Store'),
        "store_ai_readiness_score": store_readiness_score,
        "total_products_audited": total,
        "priority_breakdown": {"CRITICAL": critical, "HIGH": high, "MEDIUM": medium},
        "avg_impact_score": avg_score,
        "store_level_warning": faq_warning,
        "verdict": "STORE AT RISK" if store_readiness_score < 50 else "STORE NEEDS IMPROVEMENT" if store_readiness_score < 75 else "STORE AI READY"
    }
