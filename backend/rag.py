import os
from typing import List, Tuple
from fastapi import FastAPI, UploadFile, File, Form
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
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=100,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        # Initialize placeholders for retrievers and chain
        self.vectorstore = None
        self.bm25_retriever = None
        self.semantic_retriever = None
        self.ensemble_retriever = None
        self.compression_retriever = None
        self.rag_chain = None

    def load_single_document(self, file_path: str) -> None:
        """Load a single document"""
        if file_path.endswith('.txt'):
            loader = TextLoader(file_path)
            self.documents = loader.load()
        elif file_path.endswith('.pdf'):
            loader = PyPDFLoader(file_path)
            self.documents = loader.load()
            print(f"Loaded PDF: {file_path}")
        
        if not self.documents:
            raise ValueError("Document could not be loaded.")
        
        # Split documents into chunks
        self.splits = self.text_splitter.split_documents(self.documents)
        print(f"Created {len(self.splits)} chunks from the document")
        
    def setup_retrievers(self) -> None:
        """Set up base retrievers and the compression retriever with reranking."""
        if not self.splits:
             raise ValueError("Documents must be loaded and split before setting up retrievers.")

        # --- Setup Base Retrievers ---
        print("\n[RAG DEBUG] Setting up base retrievers (Semantic + BM25)...")
        # ChromaDB for semantic search
        self.vectorstore = Chroma.from_documents(
            documents=self.splits,
            embedding=self.embeddings,
            # Consider persisting ChromaDB for larger datasets/production
            # persist_directory="./chroma_db_hybrid",
            collection_name="hybrid_rag" # Use a consistent name
        )
        self.semantic_retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5} # Retrieve top 5 initially
        )

        # BM25 for keyword search
        self.bm25_retriever = BM25Retriever.from_documents(self.splits)
        self.bm25_retriever.k = 5 # Retrieve top 5 initially

        # Ensemble Retriever combines semantic and keyword
        self.ensemble_retriever = EnsembleRetriever(
            retrievers=[self.semantic_retriever, self.bm25_retriever],
            weights=[0.8, 0.2] # Favor semantic search results
        )
        print("[RAG DEBUG] Base ensemble retriever setup complete.")

        # --- Setup Compression Retriever with Cohere Rerank ---
        if COHERE_API_KEY:
            print("[RAG DEBUG] COHERE_API_KEY found. Setting up Cohere Rerank...")
            try:
                reranker = CohereRerank(model="rerank-english-v2.0", top_n=3)
                self.compression_retriever = ContextualCompressionRetriever(
                    base_compressor=reranker,
                    base_retriever=self.ensemble_retriever
                )
                print("[RAG DEBUG] ContextualCompressionRetriever with CohereRerank(model='rerank-english-v2.0', top_n=3) setup complete.")
            except Exception as e:
                print(f"[RAG DEBUG] Error setting up CohereRerank: {e}. Falling back to ensemble retriever.")
                self.compression_retriever = self.ensemble_retriever # Fallback
        else:
            print("[RAG DEBUG] COHERE_API_KEY not found. Using standard ensemble retriever without reranking.")
            self.compression_retriever = self.ensemble_retriever # Use ensemble if no key

    def setup_rag(self) -> None:
        """Set up the RAG chain using the compression retriever."""
        if not self.compression_retriever:
             raise ValueError("Retrievers must be set up before setting up the RAG chain.")

        retriever_type = "Compression Retriever (with Cohere Rerank if API key was valid)" if COHERE_API_KEY and isinstance(self.compression_retriever, ContextualCompressionRetriever) and isinstance(self.compression_retriever.base_compressor, CohereRerank) else "Ensemble Retriever (No Reranking)"
        print(f"\n[RAG DEBUG] Setting up RAG chain with retriever type: {retriever_type}")

        try:
            llm = Ollama(
                model=self.model_name,
                temperature=0.2, # Slightly lower temp might help with factuality
                base_url="http://localhost:11434" # Ensure Ollama is running here
            )

            # Use the compression_retriever (which includes reranking if API key is set)
            self.rag_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff", # Suitable for smaller, reranked context
                retriever=self.compression_retriever, # Use the retriever with reranking
                return_source_documents=True,
                chain_type_kwargs={"prompt": PROMPT} # Pass the defined prompt
            )
            print("[RAG DEBUG] RAG chain setup complete.")
        except Exception as e:
            print(f"[RAG DEBUG] Error setting up RAG chain: {str(e)}")
            raise

    def query(self, question: str) -> Tuple[str, List[Document]]:
        """Query the RAG system"""
        if not self.rag_chain:
            raise ValueError("RAG chain not initialized. Please call setup_rag() first after loading data.")

        retriever_in_use = self.rag_chain.retriever.__class__.__name__
        base_retriever_type = "N/A"
        compressor_type = "N/A"

        if isinstance(self.rag_chain.retriever, ContextualCompressionRetriever):
             retriever_in_use = "ContextualCompressionRetriever"
             base_retriever_type = self.rag_chain.retriever.base_retriever.__class__.__name__
             compressor_type = self.rag_chain.retriever.base_compressor.__class__.__name__ if hasattr(self.rag_chain.retriever, 'base_compressor') else "None"

        print(f"\n[RAG DEBUG] Invoking RAG chain with question: '{question}'")
        print(f"[RAG DEBUG] Retriever in use by chain: {retriever_in_use}")
        if retriever_in_use == "ContextualCompressionRetriever":
            print(f"[RAG DEBUG]   Base Retriever: {base_retriever_type}")
            print(f"[RAG DEBUG]   Compressor: {compressor_type}")

        result = self.rag_chain.invoke({"query": question}) # Ensure input key matches chain expectation
        print("[RAG DEBUG] RAG chain invocation complete.")

        # Debug: Print raw result keys
        # print(f"Raw RAG result keys: {result.keys()}")

        answer = result.get("result", "Error: Could not parse answer from RAG chain result.")
        source_docs = result.get("source_documents", [])

        print(f"[RAG DEBUG] Number of source documents returned to LLM: {len(source_docs)}")
        # Optional: Print metadata or first few chars of source docs if needed for deeper debugging
        # for i, doc in enumerate(source_docs):
        #     print(f"[RAG DEBUG]   Source Doc {i+1}: {doc.page_content[:100]}... | Metadata: {doc.metadata}")

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
        # Setup retrievers (including reranker) and RAG chain *after* loading
        rag_system.setup_retrievers()
        rag_system.setup_rag()

        print("\n[Backend] Document processed and RAG system initialized successfully")
        return {"message": "File uploaded and RAG system ready"}
    except Exception as e:
        error_message = f"Error during upload/processing: {str(e)}"
        print(f"\n[Backend] {error_message}")
        return {"error": error_message}

@app.post("/query")
async def query(question: str = Form(...)): # Keep using Form for simplicity with frontend fetch
    try:
        print(f"\n[Backend] Received question: {question}")

        # Simple preprocessing (can be expanded)
        processed_question = question.strip()

        if not hasattr(rag_system, 'rag_chain') or rag_system.rag_chain is None:
             return {"error": "RAG system not initialized. Please upload a document first."}

        answer, sources = rag_system.query(processed_question)
        print(f"\n[Backend] Generated answer length: {len(answer)}")

        # Format sources for response - Note: relevance score from Cohere isn't directly added to metadata by default in this flow
        formatted_sources = []
        for doc in sources:
            formatted_sources.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                # Cohere relevance score might be in doc.metadata['relevance_score'] if added by the compressor, check LanchChain docs/debug
                "relevance_score": doc.metadata.get('relevance_score', 'N/A')
            })

        response_data = {
            "answer": answer,
            "sources": formatted_sources
        }
        # print(f"\n[Backend] Sending response: {response_data}") # Avoid printing potentially large content
        print(f"\n[Backend] Sending response with {len(formatted_sources)} sources.")
        return response_data

    except Exception as e:
        error_message = f"Error during query: {str(e)}"
        print(f"\n[Backend] {error_message}")
        return {"error": error_message}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)