# analysis_models.py
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from langchain_community.llms import Ollama
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import os
import json

# --- Define Structured Output Schemas using Pydantic ---

class SubmissionDetail(BaseModel):
    deadline_date: Optional[str] = Field(None, description="The final date for submission (YYYY-MM-DD if possible, otherwise as stated).")
    deadline_time: Optional[str] = Field(None, description="The final time for submission (HH:MM if possible, include timezone if stated).")
    submission_method: Optional[str] = Field(None, description="How the proposal must be submitted (e.g., electronically via portal, email, mail).")

class FormattingDetail(BaseModel):
    section: Optional[str] = Field(None, description="Specific section the limit applies to (e.g., 'technical volume', 'management plan', 'overall').")
    page_limit: Optional[int] = Field(None, description="The maximum number of pages allowed for the section.")

class FormattingRequirements(BaseModel):
    page_limits: List[FormattingDetail] = Field(default_factory=list, description="List of page limit requirements for different sections.")
    font_details: Optional[str] = Field(None, description="Required font specifications (e.g., 'Times New Roman 12pt', 'Arial 11pt').")
    line_spacing: Optional[str] = Field(None, description="Required line spacing (e.g., 'single', 'double', '1.5 lines').")
    required_sections: List[str] = Field(default_factory=list, description="List any specific section titles explicitly required (e.g., 'Table of Contents', 'Executive Summary').")

class EligibilityRequirement(BaseModel):
    requirement_type: str = Field(description="Type of requirement (e.g., 'Certification', 'Registration', 'Experience', 'Insurance')")
    details: str = Field(description="Specific details of the requirement (e.g., 'ISO 9001', 'Registered in Virginia', '5 years Agile experience', '$1M General Liability').")
    is_mandatory: Optional[bool] = Field(None, description="True if explicitly stated as mandatory/required, False if preferred/desired, None if unclear.")

class RFPAnalysis(BaseModel):
    """Structured information extracted from an RFP document."""
    issuing_agency: Optional[str] = Field(None, description="The name of the agency or organization issuing the RFP.")
    solicitation_number: Optional[str] = Field(None, description="The official RFP/solicitation identifier number, if found.")
    submission_details: Optional[SubmissionDetail] = Field(None, description="Details regarding proposal submission.")
    formatting_requirements: Optional[FormattingRequirements] = Field(None, description="Specific formatting rules for the proposal.")
    eligibility_criteria: List[EligibilityRequirement] = Field(default_factory=list, description="List of key eligibility requirements extracted.")
    # Add more fields as needed (e.g., contact_person, contract_value_estimate, key_dates)

# --- LLM Extraction Function ---

# Initialize LLM (ensure Ollama is running)
# Use the same model name as in rag.py for consistency, or choose another if needed
LLM_MODEL_NAME = os.getenv("OLLAMA_MODEL", "phi3:mini") # Default to mistral if not set
try:
    llm = Ollama(model=LLM_MODEL_NAME, base_url="http://localhost:11434", temperature=0.1)
    print(f"[Analysis] Initialized Ollama LLM with model: {LLM_MODEL_NAME}")
except Exception as e:
    print(f"[Analysis] ERROR initializing Ollama LLM: {e}")
    llm = None

# --- Text Splitter for Chunking ---
# Use similar settings as in rag.py for consistency, adjust if needed
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000, # Larger chunk size for extraction might capture more context
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", ". ", ", ", " ", ""] # Added ". " and ", "
)

# --- Helper Function for Merging Results ---
def merge_analysis_results(results: List[Dict]) -> Dict:
    """Merges results from multiple chunks into a single consolidated dictionary."""
    print(f"[Analysis Merge] Merging results from {len(results)} chunks...")
    merged = RFPAnalysis().dict() # Start with an empty Pydantic model dict

    # Simple fields: Take the first non-null value found
    simple_fields = ['issuing_agency', 'solicitation_number']
    for field in simple_fields:
        for res in results:
            if res.get(field):
                merged[field] = res[field]
                break # Found one, move to next field

    # Nested objects: Merge fields within them, prioritizing non-nulls
    # Submission Details
    merged['submission_details'] = SubmissionDetail().dict()
    submission_fields = ['deadline_date', 'deadline_time', 'submission_method']
    for field in submission_fields:
         for res in results:
            if res.get('submission_details') and res['submission_details'].get(field):
                merged['submission_details'][field] = res['submission_details'][field]
                break

    # Formatting Requirements
    merged['formatting_requirements'] = FormattingRequirements().dict()
    formatting_simple_fields = ['font_details', 'line_spacing']
    for field in formatting_simple_fields:
         for res in results:
             if res.get('formatting_requirements') and res['formatting_requirements'].get(field):
                 merged['formatting_requirements'][field] = res['formatting_requirements'][field]
                 break

    # Lists: Combine unique items
    # Page Limits (handle potential duplicate sections)
    seen_page_limits = set()
    for res in results:
        if res.get('formatting_requirements') and res['formatting_requirements'].get('page_limits'):
            for limit in res['formatting_requirements']['page_limits']:
                 limit_tuple = (limit.get('section', 'general'), limit.get('page_limit'))
                 if limit_tuple[1] is not None and limit_tuple not in seen_page_limits:
                      merged['formatting_requirements']['page_limits'].append(limit)
                      seen_page_limits.add(limit_tuple)

    # Required Sections
    seen_sections = set()
    for res in results:
        if res.get('formatting_requirements') and res['formatting_requirements'].get('required_sections'):
            for section in res['formatting_requirements']['required_sections']:
                if section and section not in seen_sections:
                     merged['formatting_requirements']['required_sections'].append(section)
                     seen_sections.add(section)

    # Eligibility Criteria (handle potential duplicate details for same type)
    seen_eligibility = set()
    for res in results:
        if res.get('eligibility_criteria'):
            for criterion in res['eligibility_criteria']:
                 # Use type and details to check for uniqueness
                 # Consider normalizing details (lowercase, strip) for better matching
                 criterion_tuple = (criterion.get('requirement_type'), criterion.get('details', '').lower().strip())
                 if criterion_tuple[0] and criterion_tuple[1] and criterion_tuple not in seen_eligibility:
                      merged['eligibility_criteria'].append(criterion)
                      seen_eligibility.add(criterion_tuple)

    # Clean up empty nested objects if no details were found
    if all(v is None for v in merged['submission_details'].values()):
        merged['submission_details'] = None
    if all(v is None or v == [] for v in merged['formatting_requirements'].values()):
         merged['formatting_requirements'] = None

    print("[Analysis Merge] Merging complete.")
    return merged

# --- Updated LLM Extraction Function ---
def extract_structured_rfp_data(text: str) -> Dict:
    """
    Uses a dedicated analysis LLM to extract structured info from RFP text in chunks.
    """
    if not llm:
        return {"error": "Analysis LLM not initialized. Cannot perform extraction."}
    if not text:
        return {"error": "No text provided for analysis."}

    print(f"\n[Analysis Chunking] Splitting text (length: {len(text)} chars)...")
    chunks = text_splitter.split_text(text)
    print(f"[Analysis Chunking] Created {len(chunks)} chunks.")

    all_chunk_results = []
    has_errors = False
    parser = PydanticOutputParser(pydantic_object=RFPAnalysis)

    # --- MODIFIED: Stricter Prompt Template ---
    prompt_template = """
    You are an expert assistant analyzing sections of a Request for Proposals (RFP).
    Carefully read the following RFP text section and extract ONLY the information relevant to this section that matches the JSON schema.
    Format your output strictly according to the provided JSON schema.
    If information for a field is not present IN THIS SECTION, omit the field or use null. Do not guess information from other potential sections.

    IMPORTANT: Your response MUST be ONLY the JSON object requested, enclosed in triple backticks using the json format marker (```json ... ```).
    Do NOT include any explanations, apologies, greetings, or any other text outside the ```json ... ``` block.

    {format_instructions}

    RFP Text Section:
    -------
    {rfp_section_text}
    -------

    Extracted Information from this section (JSON):
    ```json
    """ # Add the opening fence to guide the model

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["rfp_section_text"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )

    for i, chunk in enumerate(chunks):
        print(f"[Analysis Processing] Processing chunk {i + 1}/{len(chunks)} using {LLM_MODEL_NAME}...")
        cleaned_output = "" # Initialize cleaned output string
        raw_output = "" # Initialize raw_output
        try:
            _input = prompt.format_prompt(rfp_section_text=chunk)
            raw_output = llm.invoke(_input.to_string()) # Store raw output

            # --- ADDED: Clean the raw output ---
            # Remove potential markdown fences and surrounding whitespace/newlines
            if raw_output.strip().startswith("```json"):
                cleaned_output = raw_output.strip()[7:] # Remove ```json
            elif raw_output.strip().startswith("```"):
                 cleaned_output = raw_output.strip()[3:] # Remove ```
            else:
                 cleaned_output = raw_output

            if cleaned_output.strip().endswith("```"):
                cleaned_output = cleaned_output.strip()[:-3] # Remove trailing ```

            cleaned_output = cleaned_output.strip() # Final strip
            # ---------------------------------

            # print(f"[Analysis DEBUG] Cleaned Output chunk {i+1}:\n{cleaned_output}\n") # Debug cleaned output

            # Attempt to parse the cleaned output
            try:
                # --- ADDED: Attempt to load as JSON first for better error context ---
                try:
                     json_object = json.loads(cleaned_output)
                     parsed_output = RFPAnalysis.parse_obj(json_object) # Parse from dict
                except json.JSONDecodeError as json_err:
                    # If basic JSON loading fails, re-raise a more informative error
                    raise ValueError(f"Output is not valid JSON: {json_err}") from json_err
                except Exception as pydantic_err: # Catch Pydantic validation errors specifically
                    raise ValueError(f"JSON is valid, but does not match Pydantic schema: {pydantic_err}") from pydantic_err
                # ----------------------------------------------------------------------

                all_chunk_results.append(parsed_output.dict())
                print(f"[Analysis Processing] Chunk {i + 1} parsed successfully.")

            except Exception as parse_error:
                 # --- MODIFIED: Log the FULL cleaned output ---
                 print(f"[Analysis Processing] Warning: Failed to parse CLEANED output for chunk {i + 1}.")
                 print(f"  Parse Error Type: {type(parse_error).__name__}")
                 print(f"  Parse Error Details: {parse_error}")
                 print(f"--- FULL Cleaned Output for Chunk {i+1} ---")
                 print(cleaned_output)
                 print(f"--- END Cleaned Output ---")
                 # ----------------------------------------------

        except Exception as llm_error:
            print(f"[Analysis Processing] Error invoking Analysis LLM ({LLM_MODEL_NAME}) for chunk {i + 1}: {llm_error}")
            # Optionally log raw_output here too if LLM fails completely
            # print(f"--- Raw Output (LLM Error) --- \n{raw_output}\n--- End Raw Output ---")
            has_errors = True

    if not all_chunk_results and has_errors:
         return {"error": f"Analysis LLM ({LLM_MODEL_NAME}) invocation failed for all chunks."}
    if not all_chunk_results:
         return {"warning": "No structured data could be extracted from any chunk.", "details": {}}

    try:
        final_merged_data = merge_analysis_results(all_chunk_results)
        return final_merged_data
    except Exception as merge_error:
        print(f"[Analysis Merge] Error during merging: {merge_error}")
        return {"error": f"Failed to merge results from chunks: {merge_error}"}


# --- Example Usage ---
if __name__ == "__main__":
    print("\n--- LLM Structured Extraction Example (Chunked) ---")
    if llm:
        sample_rfp_text = """
        **REQUEST FOR PROPOSAL (RFP)**
        **Solicitation Number:** HHS-2024-PROCURE-007
        **Issuing Agency:** Department of Health Services (DHS)
        **Project Title:** Cloud Migration Services

        **Submission Deadline:** Proposals must be submitted electronically via FedConnect no later than **August 30, 2024, 2:00 PM Eastern Time**. Late proposals will not be considered. Email submissions are prohibited.

        **Eligibility:** Offerors must be registered in SAM.gov and possess active **FedRAMP Moderate** certification for their proposed cloud solution. Bidders must demonstrate **at least 5 years** of experience migrating similar workloads to the cloud for federal agencies. Must be authorized to work in Virginia.

        **Formatting:** The technical proposal is limited to **30 pages**. The management proposal must not exceed **15 pages**. Use **Times New Roman, 11pt font** with single line spacing. A Table of Contents is required. Appendices do not count towards page limits.

        **Contact:** Jane Smith, jane.smith@dhs.example.gov

        --- Next Section ---

        Additional requirements include ISO 27001 compliance. The overall proposal should follow standard governmental formatting. Ensure all attachments listed in Appendix B are included. Line spacing must be exactly single spaced. Prior experience with DHS systems is preferred but not mandatory. The final submission method is solely through the FedConnect portal.
        """

        extracted_data = extract_structured_rfp_data(sample_rfp_text)

        print("\n--- Extracted Structured Data (Merged): ---")
        print(json.dumps(extracted_data, indent=2))
        print("----------------------------------------")
    else:
        print("\nCannot run example because Ollama LLM failed to initialize.")
