# analysis_models.py
import spacy
from collections import defaultdict
import re # Import regular expressions for pattern matching

print("Loading spaCy model (en_core_web_lg)... This might take a moment.")
nlp = None # Initialize nlp as None
try:
    # Load model, disabling components less likely to be needed for senter/ner
    nlp = spacy.load("en_core_web_lg", disable=["lemmatizer", "attribute_ruler"])
    print(f"Initial pipeline after load: {nlp.pipe_names}")

    # --- FIX: Add 'senter' if it's actually missing ---
    if not nlp.has_pipe("senter"):
        print("Warning: 'senter' pipe not found, adding it...")
        # Add before 'ner' if possible, otherwise first
        try:
             nlp.add_pipe("senter", before="ner")
             print("Added 'senter' pipe before 'ner'.")
        except ValueError: # If 'ner' isn't there or other issues
             try:
                 nlp.add_pipe("senter", first=True)
                 print("Added 'senter' pipe first.")
             except ValueError as e_add:
                 print(f"Could not add 'senter' pipe: {e_add}")
                 raise # Re-raise if adding fails critically
    # ---------------------------------------------

    print(f"Final spaCy pipeline: {nlp.pipe_names}")

except OSError as e:
    # Specific error for model not found
    print(f"OSError loading spaCy model: {e}")
    print("Model 'en_core_web_lg' likely not downloaded or installed correctly.")
    print("Please run: python -m spacy download en_core_web_lg")
except Exception as e:
    # Catch any other unexpected error during loading
    print(f"Unexpected error loading/configuring spaCy model: {e}")
    print("Check spaCy installation, model download, and memory usage.")
    nlp = None # Ensure nlp is None on any load error

# --- Enhanced Entity Extraction with Context ---

def extract_entities_with_context(text: str) -> dict:
    """
    Processes text using spaCy and regex to extract entities and their
    surrounding sentence context, relevant for RFPs.

    Args:
        text: The input string (e.g., a section or full text of an RFP).

    Returns:
        A dictionary grouping extracted items by label. Each item is a
        dictionary containing 'text' (the entity) and 'context' (the sentence).
        e.g., {'DATE': [{'text': 'December 15, 2024', 'context': 'Proposals must be received...'}], ...}
    """
    if not nlp:
        print("Skipping entity extraction because spaCy model is not loaded (load failed during startup).")
        return {"error": "spaCy model failed to load during application startup. Check backend logs."} # More informative error

    print(f"\n[NER Context] Processing text for entities (length: {len(text)} chars)...")
    doc = nlp(text)

    entities_with_context = defaultdict(list)
    processed_spans = set() # Keep track of text spans already processed by spaCy NER

    # --- Standard SpaCy Entity Extraction with Context ---
    print("[NER Context] Extracting standard entities...")
    for ent in doc.ents:
        # Filter for potentially relevant labels
        relevant_labels = ["DATE", "ORG", "GPE", "LAW", "PRODUCT", "QUANTITY", "MONEY", "CARDINAL"]
        if ent.label_ in relevant_labels:
            entity_text = ent.text.strip()
            # Use ent.sent to get the sentence containing the entity
            # Add a check here in case senter failed silently
            if not ent.sent:
                 print(f"Warning: No sentence found for entity '{entity_text}'. Is 'senter' pipe active?")
                 sentence_context = "[Context Unavailable]" # Fallback context
            else:
                 sentence_context = ent.sent.text.strip()

            if entity_text and sentence_context:
                # Check if this span overlaps significantly with a custom match later
                span_tuple = (ent.start_char, ent.end_char)

                entities_with_context[ent.label_].append({
                    "text": entity_text,
                    "context": sentence_context
                })
                processed_spans.add(span_tuple) # Mark this span as processed

    # --- Custom Pattern Extraction with Context ---
    # Certifications, Formatting, etc.
    custom_patterns = {
        "CERTIFICATION": [
            r"\bISO\s?\d{4,5}\b",
            r"\bCMMC\s?(Level|Lvl)\s?\d\b",
            r"\bFedRAMP\s?(High|Moderate|Low)?\b",
        ],
        "PAGE_LIMIT": [
            r"(\d+)\s*page\s*limit",
            r"limit\s*of\s*(\d+)\s*pages",
            r"not\s*exceed\s*(\d+)\s*pages",
        ],
        "FONT_REQUIREMENT": [
             # Match common phrases like "font shall be Times New Roman 12pt"
             r"(font|typeface)\s*(?:shall|must)\s*be\s*([A-Za-z\s.\-]+(?:,\s*\d+[\s-]*pt)?)", # More flexible font capture
             # Match phrases like "12-point Times New Roman font"
             r"(\d+[\s-]*pt|\d+[\s-]*point)[\s,]+([A-Za-z\s.\-]+?)\s+(?:font|typeface)",
        ],
         "SUBMISSION_METHOD": [
            # Look for keywords related to how to submit
            r"(submit|submission).*(electronically|via\s+\w+\s+system|email|mail|hand-deliver)",
        ]
        # Add more categories and patterns as needed
    }

    print("[NER Context] Extracting custom patterns...")
    # Use doc.sents only if senter seems active based on pipeline check during load
    sentence_list = []
    if nlp and nlp.has_pipe("senter"):
        sentence_list = list(doc.sents)
    else:
        # Fallback: Split by newline if sentences aren't available
        print("Warning: 'senter' pipe inactive, falling back to newline splitting for custom patterns.")
        sentence_list = [span for span in text.split('\n') if span.strip()] # Basic split


    for label, patterns in custom_patterns.items():
        found_items = set() # Use set to store tuples of (item_text, sentence_text) to avoid duplicates per sentence
        for pattern in patterns:
            try:
                # Find all matches in the full text first to get the precise match text
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    # Check if this match was already covered by spaCy NER to avoid redundancy
                    match_span = (match.start(), match.end())
                    already_processed = False
                    for proc_span in processed_spans:
                         # Basic overlap check (can be refined)
                        if max(match_span[0], proc_span[0]) < min(match_span[1], proc_span[1]):
                            already_processed = True
                            break
                    if already_processed:
                        continue

                    # Determine the exact text to capture
                    # If regex has capture groups, prioritize group 1 or 2 based on pattern
                    captured_text = match.group(0) # Default to full match
                    if label == "PAGE_LIMIT" and match.groups():
                         captured_text = match.group(1) # Capture the number
                    elif label == "FONT_REQUIREMENT" and len(match.groups()) > 1 :
                        # Combine relevant groups for font info
                         group1 = match.group(1)
                         group2 = match.group(2)
                         if group1 is not None and group1.lower() in ['font', 'typeface']: # Pattern 1 matched
                              captured_text = group2.strip() if group2 else group1 # Use group 2 if present
                         elif group1 is not None and group2 is not None: # Pattern 2 matched
                             captured_text = f"{group1.strip()} {group2.strip()}"
                         # Add more specific handling if needed based on regex group structure

                    # Find the sentence containing this match
                    match_sentence = "[Context Unavailable - Senter Inactive]"
                    if sentence_list and isinstance(sentence_list[0], spacy.tokens.Span): # Check if we have actual spaCy sentences
                        for sent in sentence_list:
                            # Ensure sent is a valid Span object with start/end chars
                            if hasattr(sent, 'start_char') and hasattr(sent, 'end_char'):
                               if match.start() >= sent.start_char and match.end() <= sent.end_char:
                                  match_sentence = sent.text.strip()
                                  break
                            else:
                                print(f"Warning: Invalid sentence object encountered: {sent}")
                    elif sentence_list: # If using fallback split list
                         for line in sentence_list:
                              if match.group(0) in line: # Simple check if match is in the line
                                   match_sentence = line.strip()
                                   break


                    if match_sentence and match_sentence != "[Context Unavailable - Senter Inactive]":
                        item_text = captured_text.strip()
                        if item_text:
                             found_items.add((item_text, match_sentence))

            except re.error as e:
                print(f"Warning: Regex error for pattern '{pattern}': {e}")
            except Exception as e_match: # Catch other potential errors during matching/group access
                print(f"Warning: Error processing match for pattern '{pattern}': {e_match}")


        # Add unique found items to the results dictionary
        if found_items:
            # Sort by the order they appear in the text (approximated by sentence start)
            # Storing sentence start char for sorting
            sorted_items_with_pos = []
            for item, context_sentence in found_items:
                # Be robust: find might return -1 if context changed slightly
                start_pos = text.find(context_sentence) if context_sentence != "[Context Unavailable - Senter Inactive]" else float('inf')
                sorted_items_with_pos.append((start_pos, {"text": item, "context": context_sentence}))

            # Sort based on start position
            sorted_items_with_pos.sort(key=lambda x: x[0])

            # Extract sorted dictionaries
            entities_with_context[label].extend([item_dict for _, item_dict in sorted_items_with_pos])


    # Optional: Deduplicate identical text/context pairs within a label list if needed (more robustly)
    final_result = {}
    for label, items in entities_with_context.items():
        unique_items_final = []
        seen_final = set()
        for item in items:
            item_tuple = (item['text'], item['context'])
            if item_tuple not in seen_final:
                unique_items_final.append(item)
                seen_final.add(item_tuple)
        if unique_items_final: # Only add label if it has items
            final_result[label] = unique_items_final


    print(f"[NER Context] Extraction complete. Found items in categories: {list(final_result.keys())}")
    return final_result


# --- Example Usage ---
if __name__ == "__main__":
    print("--- NER Model with Context Example ---")

    # Ensure model is loaded before running example
    if nlp:
        sample_rfp_text = """
        **Submission Deadline:** Proposals must be received no later than 5:00 PM EST on December 15, 2024.
        Submit proposals electronically via the NASA NSPIRES system. Email submissions are not accepted.
        The proposing organization must be registered to do business in the state of Virginia (VA).
        Offerors must possess active ISO 9001 certification at the time of proposal submission.
        Experience with Agile methodologies is required. CMMC Level 2 compliance is mandatory. FedRAMP Moderate is preferred.
        The technical volume shall not exceed 25 pages. There is a limit of 5 pages for the management plan.
        The font must be Times New Roman, 12pt. Use standard 12-point Arial font for appendices.
        Any questions should be directed to John Doe, Contracting Officer.
        The contract value is estimated at $1.5M. Payment terms are Net 30.
        Reference solicitation number: NASA-RFP-2024-XYZ. See FAR Clause 52.212-4.
        """

        extracted_data = extract_entities_with_context(sample_rfp_text)

        print("\n--- Extracted Entities with Context: ---")
        for label, items in extracted_data.items():
            print(f"\n=== {label} ===")
            for item in items:
                print(f"  - Text: '{item['text']}'")
                print(f"    Context: \"{item['context']}\"")
        print("--------------------------------------")
    else:
        print("\nCannot run example because spaCy model failed to load.")
