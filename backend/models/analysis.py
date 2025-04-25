# analysis_models.py
import spacy
from collections import defaultdict
import re # Import regular expressions for pattern matching

print("Loading spaCy model (en_core_web_lg)... This might take a moment.")
# Load a medium or large English model from spaCy. 'lg' has better accuracy.
# Disable components we don't need right now (parser, tagger) for efficiency.
try:
    nlp = spacy.load("en_core_web_lg", disable=["parser", "tagger"])
    print("SpaCy model loaded successfully.")
except OSError:
    print("Error: spaCy model 'en_core_web_lg' not found.")
    print("Please run: python -m spacy download en_core_web_lg")
    nlp = None # Set nlp to None if loading fails

# --- Named Entity Recognition (NER) Function ---

def extract_entities(text: str) -> dict:
    """
    Processes text using spaCy to extract named entities relevant to RFPs.

    Args:
        text: The input string (e.g., a section of an RFP).

    Returns:
        A dictionary grouping extracted entities by their label
        (e.g., {'DATE': ['2024-12-31'], 'ORG': ['NASA'], ...}).
        Also includes custom patterns like 'CERTIFICATIONS'.
    """
    if not nlp:
        print("Skipping entity extraction because spaCy model is not loaded.")
        return {"error": "spaCy model not loaded"}
        
    print(f"\n[NER] Processing text for entities (length: {len(text)} chars)...")
    doc = nlp(text) # Process the text with spaCy

    entities = defaultdict(list) # Use defaultdict for easier appending

    # --- Standard SpaCy Entity Extraction ---
    for ent in doc.ents:
        # We are interested in specific entity types common in RFPs
        # DATE: Absolute or relative dates or periods (Deadlines)
        # ORG: Companies, agencies, institutions (Issuing Agency, Competitors)
        # GPE: Geo-Political Entities (Locations, state requirements)
        # LAW: Named documents made into laws
        # PRODUCT: Objects, vehicles, foods, etc. (May catch specific software/hardware reqs)
        # QUANTITY: Measurements, amounts (Page limits, years of experience)
        # MONEY: Monetary values
        # CARDINAL: Numerals that do not fall under another type (Page numbers, section numbers)
        # PERSON: People's names (Contact persons) - Use with caution for privacy

        # Filter for potentially relevant labels
        relevant_labels = ["DATE", "ORG", "GPE", "LAW", "PRODUCT", "QUANTITY", "MONEY", "CARDINAL"]
        if ent.label_ in relevant_labels:
             # Clean up whitespace and add to dictionary
            entity_text = ent.text.strip()
            if entity_text: # Avoid adding empty strings
                 entities[ent.label_].append(entity_text)

    # --- Custom Pattern Extraction (Example: Certifications) ---
    # SpaCy's default NER might not perfectly capture specific certifications.
    # We can supplement with regular expressions or more advanced techniques later.
    # Example: Look for common certification patterns (like ISO XXXX, CMMC Level X)
    # This is a basic example, real-world patterns would be more complex.
    certification_patterns = [
        r"\bISO\s?\d{4,5}\b",
        r"\bCMMC\s?(Level|Lvl)\s?\d\b",
        r"\bFedRAMP\s?(High|Moderate|Low)?\b",
        # Add more specific patterns as needed
    ]
    found_certifications = set() # Use a set to avoid duplicates
    for pattern in certification_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
             # re.findall might return tuples if the pattern has capture groups
             # Ensure we are adding the full matched string
             full_match = match if isinstance(match, str) else match[0] # Adjust if needed based on pattern
             found_certifications.add(full_match.strip())

    if found_certifications:
        entities["CERTIFICATION"] = sorted(list(found_certifications)) # Add custom category

    # --- Custom Pattern Extraction (Example: Formatting - Basic) ---
    # Look for explicit mentions of font, size, limits
    page_limit_match = re.search(r"(\d+)\s*page\s*limit", text, re.IGNORECASE)
    font_match = re.search(r"(font|typeface)\s*(?:shall|must)\s*be\s*([A-Za-z\s-]+)\s*(\d+)?(?:pt|point)?", text, re.IGNORECASE)

    if page_limit_match:
        entities["PAGE_LIMIT"] = [page_limit_match.group(1)]
    if font_match:
        font_info = f"{font_match.group(2).strip()}"
        if font_match.group(3):
            font_info += f" {font_match.group(3)}pt"
        entities["FONT_REQUIREMENT"] = [font_info]


    # Remove duplicates within each list (optional, defaultdict handles accumulation)
    # for label in entities:
    #    entities[label] = sorted(list(set(entities[label])))

    print(f"[NER] Extraction complete. Found entities in categories: {list(entities.keys())}")
    return dict(entities) # Convert back to a regular dict for output


# --- Example Usage ---
if __name__ == "__main__":
    print("--- NER Model Example ---")

    # Ensure model is loaded before running example
    if nlp:
        sample_rfp_text = """
        **Submission Deadline:** Proposals must be received no later than 5:00 PM EST on December 15, 2024.
        Submit proposals electronically via the NASA NSPIRES system.
        The proposing organization must be registered to do business in the state of Virginia (VA).
        Offerors must possess active ISO 9001 certification at the time of proposal submission.
        Experience with Agile methodologies is required. CMMC Level 2 compliance is mandatory.
        The technical volume shall not exceed 25 pages. The font must be Times New Roman 12pt.
        Any questions should be directed to John Doe, Contracting Officer.
        The contract value is estimated at $1.5M. Payment terms are Net 30.
        Reference solicitation number: NASA-RFP-2024-XYZ. See FAR Clause 52.212-4.
        """

        extracted_data = extract_entities(sample_rfp_text)

        print("\n--- Extracted Entities: ---")
        for label, items in extracted_data.items():
            print(f"- {label}:")
            for item in items:
                print(f"  - {item}")
        print("-------------------------")
    else:
        print("\nCannot run example because spaCy model failed to load.")
