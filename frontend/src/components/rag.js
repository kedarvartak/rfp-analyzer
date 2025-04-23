// src/components/RAGInterface.js
import { DocumentIcon, ArrowUpTrayIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function RAGInterface({ 
  fileName, 
  onFileChange, 
  query, 
  setQuery, 
  onSubmit, 
  loading, 
  isUploaded, 
  results, 
  error 
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-indigo-900">
            Document AI Assistant
          </h1>
          <p className="text-lg text-indigo-700/80">
            Upload your document and get instant answers
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col items-center space-y-6">
              <DocumentIcon className="w-12 h-12 text-indigo-600" />
              <label className="w-full cursor-pointer">
                <div className={`flex flex-col items-center p-6 border-2 border-dashed rounded-xl transition-all duration-300
                  ${isUploaded ? 'border-green-500 bg-green-50/30' : 'border-indigo-200 hover:border-indigo-400'}`}>
                  <ArrowUpTrayIcon className="w-8 h-8 mb-4 text-indigo-500" />
                  <span className="text-center text-indigo-700">
                    {fileName || 'Drop your document here'}
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={onFileChange}
                  accept=".pdf,.txt"
                />
              </label>
              {isUploaded && (
                <div className="flex items-center text-green-500 bg-green-50 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Document uploaded successfully!</span>
                </div>
              )}
            </div>
          </div>

          {/* Query Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-bl from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <form onSubmit={onSubmit} className="relative space-y-6">
              <div className="flex items-center space-x-4">
                <QuestionMarkCircleIcon className="w-8 h-8 text-indigo-600" />
                <h2 className="text-xl font-semibold text-indigo-900">
                  Ask a Question
                </h2>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-4 rounded-xl border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300"
                placeholder="What would you like to know?"
              />
              <button
                type="submit"
                disabled={loading || !isUploaded}
                className={`w-full py-4 px-6 rounded-xl text-white font-medium transition-all duration-300
                  ${loading || !isUploaded 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent" />
                    <span>Processing...</span>
                  </div>
                ) : !isUploaded ? 'Upload a document first' : 'Get Answer'}
              </button>
            </form>
          </div>
        </div>

        {/* Results Section */}
        {(results || error) && (
          <div className="bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
              {error ? (
                <div className="flex items-center space-x-3 text-red-500 bg-red-50 p-4 rounded-lg">
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700">{error}</span>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <h3 className="text-2xl font-semibold mb-4 text-indigo-900">Answer</h3>
                  <div className="text-indigo-800 whitespace-pre-wrap bg-indigo-50/50 p-4 rounded-lg">
                    {results}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}