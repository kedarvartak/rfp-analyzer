import { useRef } from 'react';


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
  const containerRef = useRef(null);
  const uploadRef = useRef(null);
  const queryRef = useRef(null);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8f8f8] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="bg-pattern absolute inset-0 w-full h-full">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#e0e0e0] rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-[#1a1a1a] mb-6">
            Document AI Assistant
          </h1>
          <p className="text-lg text-[#666] max-w-2xl mx-auto">
            Transform your documents into intelligent conversations using advanced AI technology
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Upload Section */}
          <div ref={uploadRef} className="group relative backdrop-blur-md bg-white/80 rounded-2xl p-8 
                                        border border-[#1a1a1a]/10 transition-all duration-300 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a]/5 to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#1a1a1a]/5 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#1a1a1a]">Upload Document</h2>
              </div>

              <label className="block w-full cursor-pointer">
                <div className={`flex flex-col items-center p-8 border-2 border-dashed rounded-xl transition-all duration-300
                  ${isUploaded ? 'border-[#1a1a1a] bg-[#1a1a1a]/5' : 'border-[#1a1a1a]/20 hover:border-[#1a1a1a]/40'}`}>
                  <svg className="w-8 h-8 mb-4 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-center text-[#1a1a1a]/80">
                    {fileName || 'Drop your document here or click to browse'}
                  </span>
                </div>
                <input type="file" className="hidden" onChange={onFileChange} accept=".pdf,.txt" />
              </label>

              {isUploaded && (
                <div className="flex items-center justify-center text-[#1a1a1a] bg-[#1a1a1a]/5 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Document ready for analysis</span>
                </div>
              )}
            </div>
          </div>

          {/* Query Section */}
          <div ref={queryRef} className="group relative backdrop-blur-md bg-white/80 rounded-2xl p-8 
                                       border border-[#1a1a1a]/10 transition-all duration-300 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-bl from-[#1a1a1a]/5 to-transparent 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            
            <form onSubmit={onSubmit} className="relative z-10 space-y-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#1a1a1a]/5 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#1a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#1a1a1a]">Ask a Question</h2>
              </div>

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-4 rounded-xl bg-white/50 border border-[#1a1a1a]/10 
                         focus:border-[#1a1a1a] focus:ring-2 focus:ring-[#1a1a1a]/5 transition-all duration-300
                         placeholder-[#1a1a1a]/40"
                placeholder="What would you like to know about your document?"
              />

              <button
                type="submit"
                disabled={loading || !isUploaded}
                className={`w-full py-4 px-6 rounded-xl text-white font-medium transition-all duration-300
                  ${loading || !isUploaded 
                    ? 'bg-[#1a1a1a]/40 cursor-not-allowed' 
                    : 'bg-[#1a1a1a] hover:bg-black hover:shadow-xl'}`}
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
          <div className="relative backdrop-blur-md bg-white/80 rounded-2xl p-8 border border-[#1a1a1a]/10 
                         transition-all duration-300 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/5 via-transparent to-[#1a1a1a]/5 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            
            <div className="relative z-10">
              {error ? (
                <div className="flex items-center space-x-3 text-red-600 bg-red-50/50 p-4 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-[#1a1a1a]">Answer</h3>
                  <div className="text-[#1a1a1a]/80 bg-[#1a1a1a]/5 p-6 rounded-xl whitespace-pre-wrap">
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