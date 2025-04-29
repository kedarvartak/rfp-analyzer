import os
from typing import List, Tuple
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever, ContextualCompressionRetriever
from langchain_cohere import CohereRerank
from langchain_core.documents import Document
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from pydantic import BaseModel
import cohere

# --- CORRECTED IMPORT ---
try:
    from models.analysis import extract_structured_rfp_data # Import the new function
    print("[Import Check] Successfully imported extract_structured_rfp_data from models.analysis")
except ImportError as e:
    print(f"Error: Could not import from models.analysis. Details: {e}")
    # Define a dummy function
    def extract_structured_rfp_data(text: str) -> dict:
        print("Warning: Using dummy extract_structured_rfp_data function.")
        return {"error": "Structured extraction module not loaded"}
# -----------------------

load_dotenv()

# Check for Cohere API Key
COHERE_API_KEY = os.getenv("COHERE_API_KEY")
if not COHERE_API_KEY:
    print("Warning: COHERE_API_KEY not found in environment variables. Re-ranking will not work.")
    # Or raise an exception if it's critical: raise ValueError("COHERE_API_KEY not set")

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the prompt template properly
template = """Based on the following context, please answer the question.
If the answer is explicitly stated in the context, use that information.
If not explicitly stated, indicate that the information is not found in the provided context.

Context: {context}

Question: {question}

Answer:"""

PROMPT = PromptTemplate(template=template, input_variables=["context", "question"])

class HybridRAGSystem:
    def __init__(self, model_name: str = "llama2"):
        self.model_name = model_name
        self.documents = []
        self.splits = [] # Initialize splits
        self.full_text: str | None = None # Make sure this is populated
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        self.vectorstore = None
        self.bm25_retriever = None
        self.semantic_retriever = None
        self.ensemble_retriever = None
        self.compression_retriever = None
        self.rag_chain = None

    def load_single_document(self, file_path: str) -> None:
        """Load a single document and store its full text."""
        print(f"\n[Backend] Loading document: {file_path}")
        if file_path.endswith('.txt'):
            loader = TextLoader(file_path)
            self.documents = loader.load()
        elif file_path.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
            self.documents = loader.load()
            print(f"[Backend] Loaded PDF with {len(self.documents)} pages.")
        else:
             raise ValueError(f"Unsupported file type: {Path(file_path).suffix}")

        if not self.documents:
            raise ValueError("Document loaded but resulted in no content.")

        # --- Store full text ---
        self.full_text = "\n\n".join([doc.page_content for doc in self.documents])
        print(f"[Backend] Stored full text (length: {len(self.full_text)} chars).")
        # -----------------------------

        self.splits = self.text_splitter.split_documents(self.documents)
        if not self.splits:
             print("Warning: Text splitting resulted in zero chunks. Using full document text as one chunk.")
             if self.full_text: self.splits = [Document(page_content=self.full_text)]
             else: raise ValueError("Cannot proceed: No text content found.")
        print(f"[Backend] Created {len(self.splits)} chunks from the document")

    def setup_retrievers(self) -> None:
        """Set up base retrievers and the compression retriever with reranking."""
        if not self.splits:
             raise ValueError("Documents must be loaded and split before setting up retrievers.")

        print("\n[RAG DEBUG] Setting up base retrievers (Semantic + BM25)...")
        self.vectorstore = Chroma.from_documents(
            documents=self.splits, embedding=self.embeddings, collection_name="hybrid_rag"
        )
        self.semantic_retriever = self.vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 10}) # Increase initial K
        self.bm25_retriever = BM25Retriever.from_documents(self.splits)
        self.bm25_retriever.k = 10 # Increase initial K

        self.ensemble_retriever = EnsembleRetriever(retrievers=[self.semantic_retriever, self.bm25_retriever], weights=[0.7, 0.3]) # Adjust weights if needed
        print("[RAG DEBUG] Base ensemble retriever setup complete (k=10).")

        if COHERE_API_KEY:
            print("[RAG DEBUG] COHERE_API_KEY found. Setting up Cohere Rerank...")
            try:
                reranker = CohereRerank(model="rerank-english-v2.0", top_n=5) # Increase top_n slightly
                self.compression_retriever = ContextualCompressionRetriever(base_compressor=reranker, base_retriever=self.ensemble_retriever)
                print("[RAG DEBUG] ContextualCompressionRetriever with CohereRerank(top_n=5) setup complete.")
            except Exception as e:
                print(f"[RAG DEBUG] Error setting up CohereRerank: {e}. Falling back to ensemble retriever.")
                self.compression_retriever = self.ensemble_retriever
        else:
            print("[RAG DEBUG] COHERE_API_KEY not found. Using standard ensemble retriever without reranking.")
            self.compression_retriever = self.ensemble_retriever

    def setup_rag(self) -> None:
        """Set up the RAG chain using the compression retriever."""
        if not self.compression_retriever:
             raise ValueError("Retrievers must be set up before setting up the RAG chain.")
        retriever_type = "Compression Retriever (Cohere Rerank)" if isinstance(self.compression_retriever, ContextualCompressionRetriever) and isinstance(self.compression_retriever.base_compressor, CohereRerank) else "Ensemble/Semantic Retriever"
        print(f"\n[RAG DEBUG] Setting up RAG chain with retriever type: {retriever_type}")
        try:
            llm_rag = Ollama(model=self.model_name, base_url="http://localhost:11434", temperature=0.2)
            self.rag_chain = RetrievalQA.from_chain_type(
                llm=llm_rag, chain_type="stuff", retriever=self.compression_retriever,
                return_source_documents=True, chain_type_kwargs={"prompt": PROMPT}
            )
            print("[RAG DEBUG] RAG chain setup complete.")
        except Exception as e: print(f"[RAG DEBUG] Error setting up RAG chain: {str(e)}"); raise

    def query(self, question: str) -> Tuple[str, List[Document]]:
        """Query the RAG system"""
        if not self.rag_chain:
            raise ValueError("RAG chain not initialized. Please call setup_rag() first after loading data.")

        retriever_in_use = self.rag_chain.retriever.__class__.__name__
        base_retriever_type = "N/A"; compressor_type = "N/A"

        if isinstance(self.rag_chain.retriever, ContextualCompressionRetriever):
             retriever_in_use = "ContextualCompressionRetriever"
             base_retriever_type = self.rag_chain.retriever.base_retriever.__class__.__name__
             compressor_type = self.rag_chain.retriever.base_compressor.__class__.__name__ if hasattr(self.rag_chain.retriever, 'base_compressor') else "None"
        elif hasattr(self.rag_chain.retriever, '__class__'): # Handle cases where it's not a compression retriever
            retriever_in_use = self.rag_chain.retriever.__class__.__name__

        print(f"\n[RAG DEBUG] Invoking RAG chain with question: '{question}'")
        print(f"[RAG DEBUG] Retriever in use by chain: {retriever_in_use}")
        if retriever_in_use == "ContextualCompressionRetriever":
            print(f"[RAG DEBUG]   Base Retriever: {base_retriever_type}")
            print(f"[RAG DEBUG]   Compressor: {compressor_type}")

        result = self.rag_chain.invoke({"query": question}) # Ensure input key matches chain expectation
        print("[RAG DEBUG] RAG chain invocation complete.")

        answer = result.get("result", "Error: Could not parse answer from RAG chain result.")
        source_docs = result.get("source_documents", [])

        print(f"[RAG DEBUG] Number of source documents returned to LLM: {len(source_docs)}")

        return answer, source_docs

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Initialize RAG system
rag_system = HybridRAGSystem(model_name="mistral")

class QueryRequest(BaseModel):
    question: str

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        print(f"\n[Backend] Received file upload: {file.filename}")
        # Save the uploaded file
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"\n[Backend] File saved at: {file_path}")

        # Load and process the document
        rag_system.load_single_document(str(file_path))
        # Setup retrievers and RAG chain *after* loading
        rag_system.setup_retrievers()
        rag_system.setup_rag()

        print("\n[Backend] Document processed and RAG system initialized successfully")
        # Return filename along with success message
        return {"message": "File uploaded and RAG system ready", "filename": file.filename}
    except Exception as e:
        error_message = f"Error during upload/processing: {str(e)}"
        print(f"\n[Backend] {error_message}")
        # Use HTTPException for clearer error status codes
        raise HTTPException(status_code=500, detail=error_message)

@app.post("/query")
async def query_endpoint(question: str = Form(...)): # Renamed to avoid conflict
    try:
        print(f"\n[Backend] Received question: {question}")
        processed_question = question.strip()

        if not hasattr(rag_system, 'rag_chain') or rag_system.rag_chain is None:
             raise HTTPException(status_code=400, detail="RAG system not initialized. Please upload a document first.")

        answer, sources = rag_system.query(processed_question)
        print(f"\n[Backend] Generated answer length: {len(answer)}")

        formatted_sources = []
        for doc in sources:
            formatted_sources.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "relevance_score": doc.metadata.get('relevance_score', 'N/A') # Check if reranker adds score
            })

        response_data = {"answer": answer, "sources": formatted_sources}
        print(f"\n[Backend] Sending response with {len(formatted_sources)} sources.")
        return response_data

    except Exception as e:
        error_message = f"Error during query: {str(e)}"
        print(f"\n[Backend] {error_message}")
        raise HTTPException(status_code=500, detail=error_message)

# --- MODIFIED/RENAMED ENDPOINT for Structured Extraction ---
@app.get("/analyze-rfp-details")
async def get_rfp_analysis():
    """
    Endpoint to trigger structured LLM extraction on the last uploaded document.
    """
    print("\n[Backend] Received request for /analyze-rfp-details")
    if not rag_system.full_text:
        print("[Backend] Error: No document text loaded for analysis.")
        raise HTTPException(status_code=400, detail="No document has been uploaded and processed yet.")

    try:
        print("[Backend] Calling extract_structured_rfp_data function...")
        # Pass the stored full text to the extraction function
        structured_data = extract_structured_rfp_data(rag_system.full_text)
        print(f"[Backend] Structured extraction complete.")

        if "error" in structured_data: # Check for errors from the extraction function
             print(f"[Backend] Error returned from extraction function: {structured_data['error']}")
             raise HTTPException(status_code=500, detail=f"Structured extraction failed: {structured_data['error']}")

        return structured_data
    except Exception as e:
        error_message = f"Error during structured analysis: {str(e)}"
        print(f"[Backend] {error_message}")
        raise HTTPException(status_code=500, detail=error_message)

if __name__ == "__main__":
    import uvicorn
    # Corrected the reference to 'app' for uvicorn.run
    uvicorn.run("rag:app", host="0.0.0.0", port=8000, reload=True) # Use string format for reload