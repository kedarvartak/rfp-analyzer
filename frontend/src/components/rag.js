import { useState, useRef, useEffect } from 'react';
// Use more specific icons or keep minimalist ones
import { FiUploadCloud, FiHelpCircle, FiCheckCircle, FiAlertTriangle, FiLoader, FiDatabase, FiTerminal, FiFileText, FiZap } from 'react-icons/fi';

// Minimalist Icon Components (Keep if preferred)
const UploadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
const QuestionIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>;
const OutputIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 4 6 20 6 20 17 4 17"/><polyline points="4 11 20 11"/></svg>;
const ErrorIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const LoadingIcon = () => <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>;


// --- Panel Component ---
// Reusable Panel structure
const Panel = ({ title, icon, children, className = '', titleClassName = '' }) => (
  <section className={`border-2 border-white/80 bg-black/30 flex flex-col ${className}`}>
    <header className={`flex items-center space-x-3 p-3 border-b-2 border-white/80 ${titleClassName}`}>
      <span className="text-white/80">{icon}</span>
      <h2 className="text-xs font-bold uppercase tracking-widest text-white/90">{title}</h2>
    </header>
    <div className="p-4 flex-1 overflow-hidden">
      {children}
    </div>
  </section>
);


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
  // Example state for progress simulation
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        onFileChange(e); // Call original handler
      }
    }, 150);
  };

  // Mock system log state
  const [logMessages, setLogMessages] = useState([
    "SYS_BOOT :: OK", "MODULE_LOAD :: RAG_CORE v1.1", "NET_STATUS :: CONNECTED", "AUTH :: SESSION_ACTIVE",
  ]);
  const logContainerRef = useRef(null);

  // Effect to scroll log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logMessages]);

  // Add messages to log based on component state
  useEffect(() => {
      if (isUploading && uploadProgress === 0) setLogMessages(prev => [...prev, `UPLOADING :: ${fileName || 'Starting...'}`]);
      if (isUploading && uploadProgress === 100) setLogMessages(prev => [...prev, `UPLOAD_COMPLETE :: ${fileName}`]);
      if (loading) setLogMessages(prev => [...prev, `PROCESSING_QUERY :: ${query.substring(0, 20)}...`]);
      if (error) setLogMessages(prev => [...prev, `ERROR :: ${error}`]);
      if (results && !loading) setLogMessages(prev => [...prev, `RESPONSE_GENERATED :: OK`]);
  }, [loading, error, results, isUploading, uploadProgress, fileName, query]);


  return (
    <div ref={containerRef} className="h-screen w-screen bg-black text-white font-mono border-4 border-white grid grid-rows-[auto_1fr_auto] overflow-hidden">

      {/* Header */}
      <header className="row-start-1 row-end-2 border-b-4 border-white p-3 flex justify-between items-center">
        <h1 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
          <FiDatabase/> AI Core // Document Interface
        </h1>
        <div className="flex items-center space-x-4 text-[10px] font-semibold">
          <span>SYS_STATUS: <span className="text-green-400 font-bold">ONLINE</span></span>
          <span>|</span>
          <span>VECTOR_DB: <span className={isUploaded ? "text-green-400" : "text-yellow-400"}>{isUploaded ? 'LOADED' : 'EMPTY'}</span></span>
        </div>
      </header>

      {/* Main Content Grid (2 Columns) */}
      <main className="row-start-2 row-end-3 grid grid-cols-[minmax(350px,_1fr)_2fr] gap-0 overflow-hidden">

        {/* --- Left Column: Input & Status --- */}
        <section className="col-span-1 border-r-4 border-white flex flex-col gap-0 overflow-hidden">

          {/* 1. Upload Panel */}
          <Panel title="Data Input Vector" icon={<FiFileText />} className="flex-shrink-0">
            <label className={`block w-full cursor-pointer border-2 border-dashed p-5 text-center ${isUploading ? 'border-yellow-400' : (isUploaded ? 'border-green-400' : 'border-white/40 hover:border-white')} transition-none`}>
              <div className={`flex flex-col items-center justify-center space-y-2 ${isUploading ? 'opacity-50' : ''}`}>
                <FiUploadCloud className="w-8 h-8 mb-1" />
                <span className="text-[11px] tracking-wider">
                  {isUploaded ? `LOADED: ${fileName}` : (isUploading ? `UPLOADING...` : 'DRAG FILE OR CLICK')}
                </span>
              </div>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.md" disabled={isUploading} />
            </label>
            {/* Progress Bar */}
            {(isUploading || isUploaded) && (
                 <div className="w-full bg-black/50 border border-white/30 mt-3 h-3">
                   <div className="bg-green-500 h-full" style={{ width: `${isUploaded ? 100 : uploadProgress}%`, transition: 'width 0.15s linear' }}></div>
                 </div>
             )}
          </Panel>

          {/* 2. Query Panel */}
          <Panel title="Query Interface" icon={<FiHelpCircle />} className="flex-shrink-0">
             <form onSubmit={onSubmit} className="space-y-3">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-24 p-2 border-2 border-white/40 bg-black text-sm font-medium focus:border-white focus:outline-none placeholder:text-white/30 resize-none scrollbar-thin scrollbar-thumb-white/50 scrollbar-track-black text-white/90"
                  placeholder="Enter query text..."
                  disabled={!isUploaded || loading}
                />
                <button
                  type="submit"
                  disabled={loading || !isUploaded || isUploading}
                   className={`w-full flex items-center justify-center gap-2 relative px-4 py-2 border-2 border-white bg-black text-[10px] font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-none duration-0 active:translate-y-px active:translate-x-px ${(!isUploaded || isUploading) ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-[3px_3px_0px_#FFF]'} ${loading ? 'opacity-70 cursor-wait' : ''}`}
                >
                   {loading ? <><LoadingIcon />PROCESSING</> : (!isUploaded || isUploading) ? 'AWAITING DATA' : <>EXECUTE <FiZap className="w-3 h-3"/> </>}
                </button>
             </form>
          </Panel>

          {/* 3. System Log Panel */}
          <Panel title="System Monitor" icon={<FiTerminal />} className="flex-1 min-h-0">
             <div ref={logContainerRef} className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/50 scrollbar-track-black/50 pr-2">
               {logMessages.map((log, i) => {
                  let color = 'text-white/60';
                  if (log.includes('ERROR')) color = 'text-red-500';
                  else if (log.includes('OK') || log.includes('COMPLETE') || log.includes('GENERATED')) color = 'text-green-400';
                  else if (log.includes('PROCESSING') || log.includes('UPLOADING')) color = 'text-yellow-400';
                  return <p key={i} className={`text-[10px] ${color} mb-0.5 whitespace-nowrap font-medium`}>&gt; {log}</p>
               })}
             </div>
          </Panel>

        </section>

        {/* --- Right Column: Output --- */}
        <section className="col-span-1 flex flex-col gap-0 overflow-hidden">
            <Panel title="Response Output" icon={<OutputIcon />} className="flex-1">
                <div className="h-full border-2 border-white/40 bg-black/60 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/50 scrollbar-track-black/50">
                    {error && !loading && (
                      <div className="flex items-start space-x-2 text-red-500">
                        <FiAlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0"/>
                        <span className="text-sm font-semibold">{error}</span>
                      </div>
                    )}
                    {!error && results && !loading && (
                      <div className="text-sm text-white/95 whitespace-pre-wrap leading-relaxed font-medium">
                        {results}
                      </div>
                    )}
                    {!error && !results && !loading && (
                        <p className="text-xs text-white/50 italic">Output display area. Awaiting query results...</p>
                    )}
                    {loading && (
                        <div className="flex items-center space-x-2 text-sm text-yellow-400">
                            <LoadingIcon />
                            <span>Generating response...</span>
                        </div>
                    )}
                </div>
            </Panel>
        </section>

      </main>

      {/* Footer - Minimal */}
      <footer className="row-start-3 row-end-4 border-t-4 border-white p-2 text-center">
        <p className="text-[9px] text-white/40 tracking-widest">INITIA AI CORE INTERFACE v1.1 :: SECURE SESSION</p>
      </footer>

    </div>
  );
}

/* Add scrollbar utility classes to your tailwind.config.js if needed */
/* ... (previous tailwind scrollbar setup comment) ... */