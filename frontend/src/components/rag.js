import { useState, useRef, useEffect } from 'react';
import { FiUploadCloud, FiHelpCircle, FiCheckCircle, FiAlertTriangle, FiLoader, FiDatabase, FiTerminal, FiFileText, FiZap, FiCpu, FiClipboard, FiCalendar, FiPaperclip, FiCheckSquare, FiAlertCircle } from 'react-icons/fi';

// Minimalist Icon Components (Keep if preferred)
const UploadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
const QuestionIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>;
const OutputIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 4 6 20 6 20 17 4 17"/><polyline points="4 11 20 11"/></svg>;
const ErrorIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const LoadingIcon = () => <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>;


// --- Panel Component ---
// Modify Panel's child wrapper slightly
const Panel = ({ title, icon, children, className = '', titleClassName = '' }) => (
  <section className={`border-2 border-white/80 bg-black/30 flex flex-col ${className}`}>
    <header className={`flex items-center space-x-3 p-3 border-b-2 border-white/80 flex-shrink-0 ${titleClassName}`}> {/* Ensure header doesn't shrink */}
      <span className="text-white/80">{icon}</span>
      <h2 className="text-xs font-bold uppercase tracking-widest text-white/90">{title}</h2>
    </header>
    {/* This div takes remaining space and allows its direct child (the results div) to scroll if needed */}
    <div className="p-4 flex-1 overflow-hidden flex flex-col"> {/* Added flex flex-col */}
      {children}
    </div>
  </section>
);


export default function RAGInterface({ 
  fileName, 
  onFileChange: originalOnFileChange,
  query, 
  setQuery, 
  onSubmit: originalOnSubmit,
  loading, 
  isUploaded, 
  results, 
  error 
}) {
  const containerRef = useRef(null);
  const [currentFileName, setCurrentFileName] = useState(fileName || null); // Local state for filename
  const [currentIsUploaded, setCurrentIsUploaded] = useState(isUploaded || false); // Local state for upload status

  // Local loading/error/results states for RAG query
  const [ragLoading, setRagLoading] = useState(loading || false);
  const [ragResults, setRagResults] = useState(results || null);
  const [ragError, setRagError] = useState(error || null);

  // --- RENAMED State for Analysis Results ---
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  // ------------------------------------------

  // Example state for progress simulation
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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

  // Update log based on state changes
  useEffect(() => {
      if (isUploading && uploadProgress === 0) setLogMessages(prev => [...prev, `UPLOADING :: ${currentFileName || 'Starting...'}`]);
      if (isUploading && uploadProgress === 100) setLogMessages(prev => [...prev, `UPLOAD_COMPLETE :: ${currentFileName}`]);
      if (ragLoading) setLogMessages(prev => [...prev, `PROCESSING_QUERY :: ${query.substring(0, 20)}...`]);
      if (analysisLoading) setLogMessages(prev => [...prev, `ANALYZING_RFP :: Processing...`]);
      if (ragError) setLogMessages(prev => [...prev, `ERROR (RAG) :: ${ragError}`]);
      if (analysisError) setLogMessages(prev => [...prev, `ERROR (Analysis) :: ${analysisError}`]);
      if (ragResults && !ragLoading) setLogMessages(prev => [...prev, `RESPONSE_GENERATED :: OK`]);
      if (analysisResults && !analysisLoading) setLogMessages(prev => [...prev, `RFP_ANALYSIS :: COMPLETE`]);
  }, [ragLoading, analysisLoading, ragError, analysisError, ragResults, analysisResults, isUploading, uploadProgress, currentFileName, query]);


  // --- Wrapped Handlers to manage local state ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCurrentFileName(file.name); // Update local filename state
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentIsUploaded(false); // Reset upload status
    setAnalysisResults(null);
    setAnalysisError(null);
    setRagResults(null); // Clear previous RAG results
    setRagError(null);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setCurrentIsUploaded(true); // Set upload success
      }
    }, 150);

    // Call the original prop function (which likely handles the actual backend upload)
    originalOnFileChange(e);
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setRagLoading(true);
      setRagError(null);
      setRagResults(null);

      // Prepare data for the original function (assuming it expects an event or similar)
       // If originalOnSubmit just needs the query, you might adjust how it's called.
       // For now, let's assume it can handle the event or uses the state directly.
      try {
          // If originalOnSubmit is async and updates state via props, we await it
          // but rely on useEffect to update local state based on prop changes.
          // If originalOnSubmit returns data directly, handle it here.
          const response = await originalOnSubmit(e); // Await if it's async

          // Example: If originalOnSubmit returns results directly
          if (response && response.answer) {
               setRagResults(response); // Assuming response has { answer: ..., sources: ...}
          } else if (response && response.error) {
               setRagError(response.error);
          }
          // If originalOnSubmit updates props, the useEffect hook reacting to prop changes should handle it.

      } catch (err) {
          console.error("RAG Submit Error:", err);
          setRagError(err.message || "Failed to submit query.");
      } finally {
          setRagLoading(false);
      }
  };

  // --- RENAMED Handler for Structured Analysis ---
  const handleAnalyzeRfp = async () => {
      setAnalysisLoading(true);
      setAnalysisError(null);
      setAnalysisResults(null);
      setLogMessages(prev => [...prev, `REQ :: /analyze-rfp-details`]);

      try {
          const response = await fetch('http://localhost:8000/analyze-rfp-details');
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          setAnalysisResults(data);
      } catch (err) {
          console.error("RFP Analysis Fetch Error:", err);
          setAnalysisError(err.message || "Failed to fetch analysis details.");
      } finally {
          setAnalysisLoading(false);
      }
  };
  // ------------------------------------------

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
          <span>VECTOR_DB: <span className={currentIsUploaded ? "text-green-400" : "text-yellow-400"}>{currentIsUploaded ? 'LOADED' : 'EMPTY'}</span></span>
        </div>
      </header>

      {/* Main Content Grid (Now 3 Columns) */}
      <main className="row-start-2 row-end-3 grid grid-cols-[minmax(350px,_1fr)_2fr_1fr] gap-0 overflow-hidden">

        {/* --- Left Column: Input & Status --- */}
        <section className="col-span-1 border-r-4 border-white flex flex-col gap-0 overflow-hidden">

          {/* 1. Upload Panel */}
          <Panel title="Data Input Vector" icon={<FiFileText />} className="flex-shrink-0">
            <label className={`block w-full cursor-pointer border-2 border-dashed p-5 text-center ${isUploading ? 'border-yellow-400 animate-pulse' : (currentIsUploaded ? 'border-green-400' : 'border-white/40 hover:border-white')} transition-none`}>
              <div className={`flex flex-col items-center justify-center space-y-2 ${isUploading ? 'opacity-50' : ''}`}>
                <FiUploadCloud className="w-8 h-8 mb-1" />
                <span className="text-[11px] tracking-wider">
                  {currentIsUploaded ? `LOADED: ${currentFileName}` : (isUploading ? `UPLOADING...` : 'DRAG FILE OR CLICK')}
                  </span>
                </div>
              <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.txt,.md" disabled={isUploading} />
              </label>
              {(isUploading || currentIsUploaded) && (
                 <div className="w-full bg-black/50 border border-white/30 mt-3 h-3">
                   <div className={`h-full ${isUploading ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${currentIsUploaded ? 100 : uploadProgress}%`, transition: isUploading ? 'width 0.15s linear' : 'none' }}></div>
                </div>
              )}
          </Panel>

          {/* 2. Query Panel */}
          <Panel title="Query Interface" icon={<FiHelpCircle />} className="flex-shrink-0">
             <form onSubmit={handleSubmit} className="space-y-3">
                <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-24 p-2 border-2 border-white/40 bg-black text-sm font-medium focus:border-white focus:outline-none placeholder:text-white/30 resize-none scrollbar-thin scrollbar-thumb-white/50 scrollbar-track-black text-white/90"
                  placeholder="Enter query text..."
                  disabled={!currentIsUploaded || ragLoading || isUploading}
                />
              <button
                type="submit"
                  disabled={ragLoading || !currentIsUploaded || isUploading}
                   className={`w-full flex items-center justify-center gap-2 relative px-4 py-2 border-2 border-white bg-black text-[10px] font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-none duration-0 active:translate-y-px active:translate-x-px ${(!currentIsUploaded || isUploading) ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-[3px_3px_0px_#FFF]'} ${ragLoading ? 'opacity-70 cursor-wait' : ''}`}
                >
                   {ragLoading ? <><LoadingIcon />PROCESSING</> : (!currentIsUploaded || isUploading) ? 'AWAITING DATA' : <>EXECUTE RAG <FiZap className="w-3 h-3"/> </>}
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
                  else if (log.includes('PROCESSING') || log.includes('UPLOADING') || log.includes('ANALYZING')) color = 'text-yellow-400';
                  return <p key={i} className={`text-[10px] ${color} mb-0.5 whitespace-nowrap font-medium`}>&gt; {log}</p>
               })}
          </div>
          </Panel>

        </section>

        {/* --- Middle Column: RAG Output --- */}
        <section className="col-span-1 border-r-4 border-white flex flex-col gap-0 overflow-hidden">
             <Panel title="RAG Response Output" icon={<OutputIcon />} className="flex-1">
                 <div className="h-full border-2 border-white/40 bg-black/60 p-4 overflow-y-auto
                                 scrollbar scrollbar-w-1.5 scrollbar-track-black/30 scrollbar-thumb-white/50 hover:scrollbar-thumb-white/70">
                     {ragError && !ragLoading && (
                       <div className="flex items-start space-x-2 text-red-500">
                         <FiAlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0"/>
                         <span className="text-sm font-semibold">{ragError}</span>
                       </div>
                     )}
                     {!ragError && ragResults && !ragLoading && (
                       <div className="text-sm text-white/95 whitespace-pre-wrap leading-relaxed font-medium">
                         {ragResults.answer}
                       </div>
                     )}
                     {!ragError && !ragResults && !ragLoading && (
                         <p className="text-xs text-white/50 italic">RAG Output display area. Awaiting query execution...</p>
                     )}
                      {ragLoading && (
                         <div className="flex items-center space-x-2 text-sm text-yellow-400">
                             <LoadingIcon />
                             <span>Generating RAG response...</span>
                         </div>
                     )}
                 </div>
             </Panel>
         </section>

        {/* --- Right Column: Structured Analysis Output & Actions --- */}
        <section className="col-span-1 flex flex-col gap-0 overflow-hidden">
             <Panel title="RFP Analysis Details" icon={<FiClipboard />} className="flex-1 min-h-0">
                 <button
                   onClick={handleAnalyzeRfp}
                   disabled={!currentIsUploaded || analysisLoading || isUploading}
                   className={`w-full mb-4 flex-shrink-0 flex items-center justify-center gap-2 relative px-4 py-2 border-2 border-white bg-black text-[10px] font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-none duration-0 active:translate-y-px active:translate-x-px ${(!currentIsUploaded || isUploading) ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-[3px_3px_0px_#FFF]'} ${analysisLoading ? 'opacity-70 cursor-wait' : ''}`}
                 >
                   {analysisLoading ? <><LoadingIcon />ANALYZING</> : (!currentIsUploaded || isUploading) ? 'AWAITING DATA' : 'ANALYZE RFP'}
                 </button>

                 <div className="flex-1 border-2 border-white/40 bg-black/60 p-4 overflow-y-auto
                                 scrollbar scrollbar-w-1.5 scrollbar-track-black/30 scrollbar-thumb-white/50 hover:scrollbar-thumb-white/70">
                     {analysisError && !analysisLoading && (
                       <div className="flex items-start space-x-2 text-red-500">
                         <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                         <span className="text-xs font-semibold">{analysisError}</span>
                       </div>
                     )}
                     {!analysisError && analysisResults && !analysisLoading && (
                       <div className="space-y-5 text-xs">
                          <div>
                              <InfoItem label="Issuing Agency" value={analysisResults.issuing_agency} />
                              <InfoItem label="Solicitation #" value={analysisResults.solicitation_number} />
                          </div>

                          {analysisResults.submission_details && (
                              <div>
                                  <SectionTitle title="Submission" icon={<FiCalendar />} />
                                  <InfoItem label="Deadline Date" value={analysisResults.submission_details.deadline_date} />
                                  <InfoItem label="Deadline Time" value={analysisResults.submission_details.deadline_time} />
                                  <InfoItem label="Method" value={analysisResults.submission_details.submission_method} />
                              </div>
                          )}

                          {analysisResults.formatting_requirements && (
                              <div>
                                  <SectionTitle title="Formatting" icon={<FiPaperclip />} />
                                  <InfoItem label="Font" value={analysisResults.formatting_requirements.font_details} />
                                  <InfoItem label="Spacing" value={analysisResults.formatting_requirements.line_spacing} />
                                  {analysisResults.formatting_requirements.page_limits?.map((pl, i) => (
                                      <InfoItem key={`pl-${i}`} label={`Page Limit (${pl.section || 'General'})`} value={pl.page_limit} />
                                  ))}
                                   {analysisResults.formatting_requirements.required_sections?.length > 0 && (
                                      <InfoList label="Required Sections" items={analysisResults.formatting_requirements.required_sections} />
                                  )}
                              </div>
                          )}

                           {analysisResults.eligibility_criteria?.length > 0 && (
                              <div>
                                  <SectionTitle title="Eligibility Criteria" icon={<FiCheckSquare />} />
                                  {analysisResults.eligibility_criteria.map((ec, i) => (
                                      <div key={`ec-${i}`} className="mb-1.5 pl-2 border-l border-white/20">
                                          <InfoItem label={ec.requirement_type} value={ec.details} />
                                          {ec.is_mandatory !== null && (
                                              <InfoItem label="Mandatory" value={ec.is_mandatory ? 'Yes' : 'No'} color={ec.is_mandatory ? 'text-green-400' : 'text-yellow-400'} />
                                          )}
                                      </div>
                                  ))}
                              </div>
                          )}

                       </div>
                     )}
                     {!analysisError && !analysisResults && !analysisLoading && (
                         <p className="text-xs text-white/50 italic">RFP Analysis display area. Click "Analyze RFP" after upload.</p>
                     )}
                      {analysisLoading && (
                         <div className="flex items-center space-x-2 text-xs text-yellow-400">
                             <LoadingIcon />
                             <span>Analyzing RFP structure...</span>
                         </div>
                     )}
                 </div>
             </Panel>
         </section>

      </main>

      {/* Footer */}
      <footer className="row-start-3 row-end-4 border-t-4 border-white p-2 text-center">
        <p className="text-[9px] text-white/40 tracking-widest">INITIA AI CORE INTERFACE v1.1 :: SECURE SESSION</p>
      </footer>

    </div>
  );
}

// --- Helper components for structured display ---
const SectionTitle = ({ title, icon }) => (
    <h4 className="text-[11px] flex items-center gap-2 font-bold tracking-widest text-white/80 border-b border-white/20 pb-1 mb-2 mt-3 first:mt-0">
        {icon} {title}
    </h4>
);

const InfoItem = ({ label, value, color = 'text-white/70' }) => {
    if (!value && value !== 0 && value !== false) return null; // Don't render if value is null/undefined/empty string
    return (
        <p className="text-[10px] mb-0.5">
            <span className="text-white/50 font-medium w-24 inline-block">{label}:</span>
            <span className={`${color} font-semibold`}>{String(value)}</span>
        </p>
    );
};

const InfoList = ({ label, items }) => {
    if (!items || items.length === 0) return null;
    return (
         <div>
             <p className="text-[10px] text-white/50 font-medium mb-0.5">{label}:</p>
             <ul className="list-disc list-inside pl-2">
                 {items.map((item, i) => (
                    <li key={i} className="text-xs text-white/70">{item}</li>
                 ))}
             </ul>
         </div>
    );
}

/* Add scrollbar utility classes & animations to global CSS */
/* Make sure your tailwind.config.js is set up for scrollbar variants
   or you have the tailwind-scrollbar plugin installed and configured.
   These classes assume you have *some* way to style webkit scrollbars.
*/