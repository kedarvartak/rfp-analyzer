import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { uploadFile, queryDocument } from './api';
import Landing from './components/landing';
import RAGInterface from './components/rag';
import { ThemeProvider } from './components/theme';
import { BrowserRouter } from 'react-router-dom';
export default function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      try {
        setLoading(true);
        await uploadFile(selectedFile);
        setIsUploaded(true);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isUploaded) {
      setError('Please upload a document first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryDocument(query);
      setResults(result.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen bg-[#f8f8f8]">
         
          
          <Routes>
            {/* Landing Page Route */}
            <Route 
              path="/" 
              element={
                <div >
                  <Landing />
                </div>
              } 
            />

            {/* RAG Interface Route */}
            <Route 
              path="/app" 
              element={
                <div >
                  <RAGInterface
                    fileName={fileName}
                    onFileChange={handleFileChange}
                    query={query}
                    setQuery={setQuery}
                    onSubmit={handleSubmit}
                    loading={loading}
                    isUploaded={isUploaded}
                    results={results}
                    error={error}
                  />
                </div>
              } 
            />

            {/* Redirect any unknown routes to home */}
            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
          
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}