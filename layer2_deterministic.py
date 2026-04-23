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
                fix_difficulty_inverse = min(fix_difficulty_inverse, 0.9) # Very easy fix (just change the text)

    # 2. Field Completeness Analyzer 
    if 'luggage' in category or 'suitcase' in title:
        if 'dimensions' not in desc and 'inches' not in desc and 'cm' not in desc:
            issues.append("Missing Spec: Luggage lacks precise hardware dimensions.")
            conversion_loss_weight += 0.9
            fix_difficulty_inverse = min(fix_difficulty_inverse, 0.8)
            
    # 3. Policy Conflict Check (e.g. 'Final Sale' text vs Store 'Free Returns')
    policies = store_context.get('policies', {})
    if 'final sale' in desc and 'free return' in policies.get('returns', '').lower():
        issues.append("Policy Conflict: Item description claims 'Final Sale' but store context promises 'Free Returns'. AI will confuse the buyer.")
        conversion_loss_weight += 0.7
        fix_difficulty_inverse = min(fix_difficulty_inverse, 0.3) # Policy conflict involves business decisions, harder to fix casually

    # 4. Empty Description Detector
    if not product.get('description'):
        issues.append("Critical Gap: Product has no description. An AI shopping agent will have zero data to evaluate this product.")
        conversion_loss_weight += 1.0
        fix_difficulty_inverse = min(fix_difficulty_inverse, 0.5)

    # 5. Vague Title Detector
    if len(product.get('title', '').split()) < 4:
        issues.append("Weak Signal: Product title is too vague (under 4 words). AI agents cannot infer category, use-case, or audience from it.")
        conversion_loss_weight += 0.6

    # 6. Jargon / Gibberish Detector for Electronics
    if 'electronics' in category:
        jargon_words = ['hyper', 'quantum', 'mesh', 'vector', 'sub-assembly', 'capacitive', 'spectrum']
        jargon_count = sum(1 for word in jargon_words if word in desc)
        if jargon_count >= 3:
            issues.append("Clarity Failure: Description is heavily jargon-laden. Consumer AI agents cannot match this to any real buyer use-case.")
            conversion_loss_weight += 0.75

    # 7. Missing Category Detector
    if not product.get('category'):
        issues.append("Missing Metadata: No product category defined. AI shopping agents use category to route and rank products in search results.")
        conversion_loss_weight += 0.5

    # 8. Price Anchor Missing
    if not product.get('price'):
        issues.append("Trust Gap: No price listed. AI agents cannot perform price-vs-value comparison, and will deprioritize this listing.")
        conversion_loss_weight += 0.4

    # 9. Description Length Check
    if desc and len(desc) < 50:
        issues.append("Weak Signal: Description is present but too short (< 50 chars) to provide meaningful AI context.")
        conversion_loss_weight += 0.5
        fix_difficulty_inverse = min(fix_difficulty_inverse, 0.7)

    # 10. Price Anomalies
    price = product.get('price', 0)
    if price > 0 and (price < 0.10 or (price > 5000 and len(desc) < 100)):
        issues.append("Trust Gap: Price is highly anomalous (too cheap or excessively expensive with little detail). AI agents will flag as risky.")
        conversion_loss_weight += 0.6
        fix_difficulty_inverse = min(fix_difficulty_inverse, 0.8)

    # 11. Missing Main Image
    if not product.get('image_url'):
        issues.append("Critical Gap: Missing product image. AI vision models cannot verify the product, and human buyers won't trust it.")
        conversion_loss_weight += 0.9
        fix_difficulty_inverse = min(fix_difficulty_inverse, 0.6)
        
    # 12. Generic Title Detector
    generic_titles = ['shoes', 'bag', 'shirt', 'pants', 'wallet', 'luggage']
    if title in generic_titles:
        issues.append("Clarity Failure: Title is purely a generic category word. AI agents cannot distinguish this from millions of others.")
        conversion_loss_weight += 0.8
        fix_difficulty_inverse = min(fix_difficulty_inverse, 0.4)

    # Hard cap weights
    return {
        "deterministic_issues": issues,
        "conversion_loss_weight": min(conversion_loss_weight, 1.0),
        "fix_difficulty_inverse": fix_difficulty_inverse
    }
