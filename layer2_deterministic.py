def analyze_deterministic_gaps(product, store_context):
    """
    Layer 2B: Pure Python Gap Analyzer.
    No API needed. Fast string matching, policy parsing, and logic gates.
    """
    issues = []
    conversion_loss_weight = 0.0
    fix_difficulty_inverse = 1.0
    
    title = product.get('title', '').lower()
    desc = product.get('description', '').lower()
    category = product.get('category', '').lower()
    
    # 1. Contradiction Detector (e.g. Title says 'black', desc says 'brown')
    colors = ['black', 'brown', 'red', 'blue', 'white']
    for color in colors:
        if color in title and color not in desc:
            if any(c in desc for c in colors if c != color):
                issues.append(f"Contradiction: Title mentions {color}, but description mentions a different color.")
                conversion_loss_weight += 0.8
                fix_difficulty_inverse = 0.9 # Very easy fix (just change the text)

    # 2. Field Completeness Analyzer 
    if 'luggage' in category or 'suitcase' in title:
        if 'dimensions' not in desc and 'inches' not in desc and 'cm' not in desc:
            issues.append("Missing Spec: Luggage lacks precise hardware dimensions.")
            conversion_loss_weight += 0.9
            fix_difficulty_inverse = 0.8
            
    # 3. Policy Conflict Check (e.g. 'Final Sale' text vs Store 'Free Returns')
    policies = store_context.get('policies', {})
    if 'final sale' in desc and 'free return' in policies.get('returns', '').lower():
        issues.append("Policy Conflict: Item description claims 'Final Sale' but store context promises 'Free Returns'. AI will confuse the buyer.")
        conversion_loss_weight += 0.7
        fix_difficulty_inverse = 0.3 # Policy conflict involves business decisions, harder to fix casually

    # Hard cap weights
    return {
        "deterministic_issues": issues,
        "conversion_loss_weight": min(conversion_loss_weight, 1.0),
        "fix_difficulty_inverse": fix_difficulty_inverse
    }
