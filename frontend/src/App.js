import { useState } from 'react';
import { uploadFile, queryDocument } from './api';

// Add API base URL constant
const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('[Frontend] File selected:', selectedFile.name);  // Debug log
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Frontend] Form submitted');  // Debug log
    
    if (!file && !fileName) {
      setError('Please upload a document first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First upload the file if it hasn't been uploaded
      if (file) {
        console.log('[Frontend] Starting file upload');  // Debug log
        const uploadResponse = await uploadFile(file);
        console.log('[Frontend] Upload completed:', uploadResponse);  // Debug log
        setFile(null);
      }

      // Then process the query
      console.log('[Frontend] Sending query:', query);  // Debug log
      const result = await queryDocument(query);
      console.log('[Frontend] Query result received:', result);  // Debug log
      
      if (result && result.answer) {
        console.log('[Frontend] Setting results with answer:', result.answer);  // Debug log
        setResults(result.answer);
      } else {
        console.log('[Frontend] No answer in result:', result);  // Debug log
        throw new Error('No answer received from the server');
      }
    } catch (err) {
      console.error('[Frontend] Error in handleSubmit:', err);  // Debug log
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Modified results display section with debugging
  console.log('[Frontend] Current results state:', results);  // Debug log

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Document Q&A Assistant
          </h1>
          <p className="text-gray-600">Upload your document and ask questions to get instant answers</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Upload Your Document</h2>
            <div className="flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-indigo-500 transition-colors">
                <div className="flex flex-col items-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="mt-2 text-gray-600">
                    {fileName ? fileName : 'Drop your file here or click to upload'}
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </label>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Ask Your Question</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-gray-400 text-gray-700"
                  placeholder="What would you like to know about the document?"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 border border-transparent rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : 'Get Answer'}
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {results && !error && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Answer</h3>
            <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
              {typeof results === 'string' ? (
                results
              ) : (
                <pre>{JSON.stringify(results, null, 2)}</pre>
              )}
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Debug info: Type of results: {typeof results}
            </div>
          </div>
        )}

        {/* Add a debug section */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h4 className="text-sm font-semibold">Debug Info:</h4>
          <pre className="text-xs mt-2">
            {JSON.stringify({
              hasFile: !!file,
              fileName,
              hasQuery: !!query,
              hasResults: !!results,
              resultsType: typeof results,
              isLoading: loading,
              hasError: !!error
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default App;