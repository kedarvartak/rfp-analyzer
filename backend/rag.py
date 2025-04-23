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
from langchain.retrievers import EnsembleRetriever
from langchain_core.documents import Document
from langchain_community.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from pydantic import BaseModel

load_dotenv()

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
        """Set up both semantic and keyword retrievers"""
        # Set up ChromaDB for semantic search
        self.vectorstore = Chroma.from_documents(
            documents=self.splits,
            embedding=self.embeddings,
            collection_name="hybrid_rag"
        )
        
        # Set up BM25 for keyword search with increased k
        self.bm25_retriever = BM25Retriever.from_documents(self.splits)
        self.bm25_retriever.k = 5
        
        # Set up semantic search retriever with increased k
        self.semantic_retriever = self.vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        
        # Adjust ensemble retriever weights to favor semantic search more
        self.ensemble_retriever = EnsembleRetriever(
            retrievers=[self.semantic_retriever, self.bm25_retriever],
            weights=[0.8, 0.2]
        )
    
    def setup_rag(self) -> None:
        """Set up the RAG chain with Ollama"""
        try:
            llm = Ollama(
                model=self.model_name,
                temperature=0.3,
                base_url="http://localhost:11434"
            )
            
            # Create the RAG chain without custom prompt template for now
            self.rag_chain = RetrievalQA.from_chain_type(
                llm=llm,
                chain_type="stuff",
                retriever=self.ensemble_retriever,
                return_source_documents=True
            )
            print("RAG chain setup completed successfully")
        except Exception as e:
            print(f"Error setting up RAG chain: {str(e)}")
            raise
    
    def query(self, question: str) -> Tuple[str, List[Document]]:
        """Query the RAG system"""
        if not hasattr(self, 'rag_chain'):
            raise ValueError("RAG chain not initialized. Please call setup_rag() first.")
        result = self.rag_chain.invoke(question)
        return result["result"], result["source_documents"]

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
        print(f"\n[Backend] Received file upload: {file.filename}")  # Debug log
        
        # Save the uploaded file
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"\n[Backend] File saved at: {file_path}")  # Debug log
        
        # Load and process the document
        rag_system.load_single_document(str(file_path))
        rag_system.setup_retrievers()
        rag_system.setup_rag()
        
        print("\n[Backend] Document processed successfully")  # Debug log
        return {"message": "File uploaded and processed successfully"}
    except Exception as e:
        print(f"\n[Backend] Error in upload: {str(e)}")  # Debug log
        return {"error": str(e)}

@app.post("/query")
async def query(question: str = Form(...)):
    try:
        print(f"\n[Backend] Received question: {question}")
        
        # Add question preprocessing to improve retrieval
        processed_question = question.lower().strip()
        if "nickname" in processed_question or "called" in processed_question:
            # Add specific terms to help with nickname-related queries
            processed_question += " name called nicknamed"
        
        if not hasattr(rag_system, 'rag_chain'):
            raise ValueError("RAG system not properly initialized. Please upload a document first.")
            
        answer, sources = rag_system.query(processed_question)
        print(f"\n[Backend] Generated answer: {answer}")
        
        # Format sources and add relevance score
        formatted_sources = []
        for doc in sources:
            formatted_sources.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "relevance_score": doc.metadata.get("score", 1.0) if hasattr(doc, "metadata") else 1.0
            })
        
        response_data = {
            "answer": answer,
            "sources": formatted_sources
        }
        print(f"\n[Backend] Sending response: {response_data}")
        return response_data
        
    except Exception as e:
        print(f"\n[Backend] Error occurred: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)