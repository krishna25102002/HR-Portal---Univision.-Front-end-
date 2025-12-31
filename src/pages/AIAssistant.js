import React, { useState, useRef } from "react";
import { aiAPI } from "../api/client";
import { toast } from "react-toastify";
import "./AIAssistant.css";

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState("analyze");
  const [loading, setLoading] = useState(false);

  /* ================= Resume vs JD ================= */
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [matchPercent, setMatchPercent] = useState(0);

  /* ================= JD Suggestions ================= */
  const [suggestions, setSuggestions] = useState(null);

  /* ================= Format Resume ================= */
  const [formatFile, setFormatFile] = useState(null);
  const [formatFileName, setFormatFileName] = useState("");
  const [resumeFields, setResumeFields] = useState(null);
  const [downloadType, setDownloadType] = useState("pdf");

  const resumeInputRef = useRef(null);
  const formatInputRef = useRef(null);

  /* ================= FILE UPLOAD ================= */

  const handleResumeFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setResumeText(e.target.result);
    reader.readAsText(file);
  };

  const handleFormatFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormatFile(file);
    setFormatFileName(file.name);
    setResumeFields(null);
  };

  /* ================= ANALYZE RESUME ================= */

  const handleAnalyzeResume = async () => {
    if (!resumeText || !jobDescription) {
      return toast.error("Upload resume & job description");
    }

    setLoading(true);
    try {
      const res = await aiAPI.analyzeResume({
        resumeText,
        jobDescription,
      });

      const rawScore = res.data.analysis.matchScore ?? 0;
      const percent = rawScore <= 1 ? rawScore * 100 : rawScore;

      setAnalysis(res.data.analysis);
      setMatchPercent(Math.min(100, Math.round(percent)));
    } catch {
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= JD SUGGESTIONS ================= */

  const handleGetSuggestions = async () => {
    if (!jobDescription) return toast.error("Enter Job Description");

    setLoading(true);
    try {
      const res = await aiAPI.getJDSuggestions({ jobDescription });
      setSuggestions(res.data.suggestions);
    } catch {
      toast.error("Failed to generate JD suggestions");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FORMAT RESUME FLOW ================= */

  const handleConvertResume = async () => {
    if (!formatFile) return toast.error("Upload resume");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("resume", formatFile);

      const res = await aiAPI.convertResumeFormat(formData);
      setResumeFields(res.data.fields);
      toast.success("Fields extracted. Edit below.");
    } catch {
      toast.error("Extraction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setResumeFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.downloadFormattedResume({
        ...resumeFields,
        format: downloadType,
      });

      const blob = new Blob([res.data], {
        type:
          downloadType === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Resume.${downloadType}`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Resume downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="ai-container">
      <div className="ai-header">
        <h2>AI Assistant</h2>
        <p className="subtitle">AI-powered resume matching & job intelligence</p>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "analyze" ? "tab active" : "tab"}
          onClick={() => setActiveTab("analyze")}
        >
          Resume vs JD
        </button>
        <button
          className={activeTab === "suggestions" ? "tab active" : "tab"}
          onClick={() => setActiveTab("suggestions")}
        >
          JD Suggestions
        </button>
        <button
          className={activeTab === "format" ? "tab active" : "tab"}
          onClick={() => setActiveTab("format")}
        >
          Format Resume
        </button>
      </div>

      {/* ================= Resume vs JD ================= */}
      {activeTab === "analyze" && (
        <div className="tab-panel">
          <div className="upload-box">
            <input
              ref={resumeInputRef}
              type="file"
              hidden
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleResumeFile}
            />
            <button
              className="upload-btn"
              onClick={() => resumeInputRef.current.click()}
            >
              📎 {resumeFileName || "Upload Resume"}
            </button>
            {resumeFileName && <span className="file-name">{resumeFileName}</span>}
          </div>

          <div className="input-group">
            <label>📋 Job Description</label>
            <textarea
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
            />
          </div>

          <button className="btn-primary" onClick={handleAnalyzeResume}>
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          {analysis && (
            <div className="results">
              <h3>Match Score</h3>
              <div className="score-display">
                <span className="score-number">{matchPercent}%</span>
                <span className="score-label">
                  {matchPercent >= 75
                    ? "⚡ Moderate Match"
                    : matchPercent >= 50
                    ? "⚡ Moderate Match"
                    : "💪 Room to Improve"}
                </span>
              </div>

              <div className="progress-bar">
                <div
                  className={`progress-fill ${
                    matchPercent >= 75
                      ? "high"
                      : matchPercent >= 50
                      ? "mid"
                      : "low"
                  }`}
                  style={{ width: `${matchPercent}%` }}
                />
              </div>

              <div className="section">
                <h4>Strengths</h4>
                <div className="tags">
                  {analysis.strengths?.map((item, idx) => (
                    <span key={idx} className="tag tag-green">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>Missing Skills</h4>
                <div className="tags">
                  {analysis.missingSkills?.map((item, idx) => (
                    <span key={idx} className="tag tag-yellow">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>AI Recommendation</h4>
                <div className="recommendation-box">
                  {analysis.recommendation}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= JD Suggestions ================= */}
      {activeTab === "suggestions" && (
        <div className="tab-panel">
          <div className="input-group">
            <label>📋 Job Description</label>
            <textarea
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
            />
          </div>

          <button className="btn-primary" onClick={handleGetSuggestions}>
            {loading ? "Generating..." : "Generate Suggestions"}
          </button>

          {suggestions && (
            <div className="results">
              <h3>JD Search Helper</h3>

              <div className="action-btns">
                <button
                  className="btn-outline"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      JSON.stringify(suggestions, null, 2)
                    )
                  }
                >
                  Copy All Keywords
                </button>
                <button
                  className="btn-success"
                  onClick={() =>
                    navigator.clipboard.writeText(suggestions.booleanSearch)
                  }
                >
                  Copy Boolean Search
                </button>
              </div>

              <div className="section">
                <h4>Job Titles</h4>
                <div className="tags">
                  {suggestions.jobTitles?.map((item, idx) => (
                    <span key={idx} className="tag tag-blue">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>Primary Skills</h4>
                <div className="tags">
                  {suggestions.primarySkills?.map((item, idx) => (
                    <span key={idx} className="tag tag-purple">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>Secondary Skills</h4>
                <div className="tags">
                  {suggestions.secondarySkills?.map((item, idx) => (
                    <span key={idx} className="tag tag-gray">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>Tools & Technologies</h4>
                <div className="tags">
                  {suggestions.toolsAndTechnologies?.map((item, idx) => (
                    <span key={idx} className="tag tag-gray">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h4>Boolean Search</h4>
                <div className="boolean-box">{suggestions.booleanSearch}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= Format Resume ================= */}
      {activeTab === "format" && (
        <div className="tab-panel">
          <div className="upload-box">
            <input
              ref={formatInputRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFormatFile}
            />
            <button
              className="upload-btn"
              onClick={() => formatInputRef.current.click()}
            >
              📎 {formatFileName || "Upload Resume"}
            </button>
            {formatFileName && <span className="file-name">{formatFileName}</span>}
          </div>

          {formatFile && !resumeFields && (
            <button className="btn-primary" onClick={handleConvertResume}>
              {loading ? "Extracting..." : "Extract Resume Data"}
            </button>
          )}

          {resumeFields && (
            <div className="results">
              <h3>Edit Resume Fields</h3>

              {Object.entries(resumeFields).map(([key, value]) => (
                <div key={key} className="input-group">
                  <label>
                    {key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                  <textarea
                    value={value || ""}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    rows={3}
                  />
                </div>
              ))}

              <div className="input-group">
                <label>Download Format</label>
                <select
                  value={downloadType}
                  onChange={(e) => setDownloadType(e.target.value)}
                >
                  <option value="pdf">PDF</option>
                  {/* <option value="docx">DOCX</option> */}
                </select>
              </div>

              <button className="btn-success" onClick={handleDownload}>
                {loading ? "Preparing..." : "Download Resume"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// import React, { useState, useRef } from "react";
// import { aiAPI } from "../api/client";
// import { toast } from "react-toastify";
// import "../pages/AnimationsAndStyles.css";

// export default function AIAssistant() {
//   const [activeTab, setActiveTab] = useState("analyze");
//   const [loading, setLoading] = useState(false);

//   /* ================= Resume vs JD ================= */
//   const [resumeText, setResumeText] = useState("");
//   const [resumeFileName, setResumeFileName] = useState("");
//   const [jobDescription, setJobDescription] = useState("");
//   const [analysis, setAnalysis] = useState(null);
//   const [matchPercent, setMatchPercent] = useState(0);

//   /* ================= JD Suggestions ================= */
//   const [suggestions, setSuggestions] = useState(null);

//   /* ================= Format Resume ================= */
//   const [formatFile, setFormatFile] = useState(null);
//   const [formatFileName, setFormatFileName] = useState("");
//   const [resumeFields, setResumeFields] = useState(null);
//   const [downloadType, setDownloadType] = useState("pdf");

//   const resumeInputRef = useRef(null);
//   const formatInputRef = useRef(null);

//   /* ================= SVG Gradients ================= */
//   const svgGradients = (
//     <svg width="0" height="0" style={{ position: "absolute" }}>
//       <defs>
//         <linearGradient id="excellentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//           <stop offset="0%" stopColor="#10b981" />
//           <stop offset="100%" stopColor="#059669" />
//         </linearGradient>
//         <linearGradient id="moderateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//           <stop offset="0%" stopColor="#f59e0b" />
//           <stop offset="100%" stopColor="#d97706" />
//         </linearGradient>
//         <linearGradient id="lowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//           <stop offset="0%" stopColor="#ef4444" />
//           <stop offset="100%" stopColor="#dc2626" />
//         </linearGradient>
//       </defs>
//     </svg>
//   );

//   /* ================= FILE UPLOAD ================= */

//   const handleResumeFile = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setResumeFileName(file.name);
//     const reader = new FileReader();
//     reader.onload = (e) => setResumeText(e.target.result);
//     reader.readAsText(file);
//   };

//   const handleFormatFile = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setFormatFile(file);
//     setFormatFileName(file.name);
//     setResumeFields(null);
//   };

//   /* ================= ANALYZE RESUME ================= */

//   const handleAnalyzeResume = async () => {
//     if (!resumeText || !jobDescription) {
//       return toast.error("Upload resume & job description");
//     }

//     setLoading(true);
//     try {
//       const res = await aiAPI.analyzeResume({
//         resumeText,
//         jobDescription,
//       });

//       const rawScore = res.data.analysis.matchScore ?? 0;
//       const percent = rawScore <= 1 ? rawScore * 100 : rawScore;

//       setAnalysis(res.data.analysis);
//       setMatchPercent(Math.min(100, Math.round(percent)));
//     } catch {
//       toast.error("Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= JD SUGGESTIONS ================= */

//   const handleGetSuggestions = async () => {
//     if (!jobDescription) return toast.error("Enter Job Description");

//     setLoading(true);
//     try {
//       const res = await aiAPI.getJDSuggestions({ jobDescription });
//       setSuggestions(res.data.suggestions);
//     } catch {
//       toast.error("Failed to generate JD suggestions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= FORMAT RESUME FLOW ================= */

//   const handleConvertResume = async () => {
//     if (!formatFile) return toast.error("Upload resume");

//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("resume", formatFile);

//       const res = await aiAPI.convertResumeFormat(formData);
//       setResumeFields(res.data.fields);
//       toast.success("Fields extracted. Edit below.");
//     } catch {
//       toast.error("Extraction failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFieldChange = (key, value) => {
//     setResumeFields((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleDownload = async () => {
//     setLoading(true);
//     try {
//       const res = await aiAPI.downloadFormattedResume({
//         ...resumeFields,
//         format: downloadType,
//       });

//       const blob = new Blob([res.data], {
//         type:
//           downloadType === "pdf"
//             ? "application/pdf"
//             : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       });

//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = `Resume.${downloadType}`;
//       link.click();
//       window.URL.revokeObjectURL(url);

//       toast.success("Resume downloaded");
//     } catch {
//       toast.error("Download failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= UI ================= */

//   return (
//     <div className="ai-assistant-container">
//       {svgGradients}
//       <div className="card ai-card">
//         <div className="card-header">
//           <h2 className="gradient-text">AI Assistant</h2>
//           <p className="subtitle">
//             AI-powered resume matching & job intelligence
//           </p>
//         </div>

//         <div className="tabs">
//           {["analyze", "suggestions", "format"].map((tab) => (
//             <button
//               key={tab}
//               className={activeTab === tab ? "tab active" : "tab"}
//               onClick={() => setActiveTab(tab)}
//               disabled={loading}
//             >
//               <span className="tab-icon">
//                 {tab === "analyze" && "📊"}
//                 {tab === "suggestions" && "💡"}
//                 {tab === "format" && "✨"}
//               </span>
//               {tab === "analyze"
//                 ? "Resume vs JD"
//                 : tab === "suggestions"
//                 ? "JD Suggestions"
//                 : "Format Resume"}
//             </button>
//           ))}
//         </div>

//         <div className="tab-content">
//           {/* ================= Resume vs JD ================= */}
//           {activeTab === "analyze" && (
//             <div className="fade-in">
//               <div className="upload-section">
//                 <input
//                   ref={resumeInputRef}
//                   type="file"
//                   hidden
//                   accept=".txt,.pdf,.doc,.docx"
//                   onChange={handleResumeFile}
//                 />
//                 <button
//                   className={`btn outline ${resumeFileName ? "uploaded" : ""}`}
//                   onClick={() => resumeInputRef.current.click()}
//                   disabled={loading}
//                 >
//                   <span className="btn-icon">📄</span>
//                   {resumeFileName ? resumeFileName : "Upload Resume"}
//                 </button>
//               </div>

//               <div className="textarea-wrapper">
//                 <label className="input-label">Job Description</label>
//                 <textarea
//                   className="styled-textarea"
//                   placeholder="Paste the job description here..."
//                   value={jobDescription}
//                   onChange={(e) => setJobDescription(e.target.value)}
//                   disabled={loading}
//                   rows={8}
//                 />
//               </div>

//               <button
//                 className="btn primary btn-large"
//                 onClick={handleAnalyzeResume}
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <>
//                     <span className="spinner"></span>
//                     Analyzing...
//                   </>
//                 ) : (
//                   <>
//                     <span className="btn-icon">🔍</span>
//                     Analyze Match
//                   </>
//                 )}
//               </button>

//               {analysis && (
//                 <div className="analysis-card slide-up">
//                   <div className="score-section">
//                     <h3 className="section-title">Match Score</h3>
//                     <div className="score-box">
//                       <div className="score-circle">
//                         <svg className="score-ring" viewBox="0 0 120 120">
//                           <circle
//                             className="score-ring-bg"
//                             cx="60"
//                             cy="60"
//                             r="54"
//                           />
//                           <circle
//                             className={`score-ring-fill ${
//                               matchPercent >= 75
//                                 ? "excellent"
//                                 : matchPercent >= 50
//                                 ? "moderate"
//                                 : "low"
//                             }`}
//                             cx="60"
//                             cy="60"
//                             r="54"
//                             style={{
//                               strokeDashoffset: `${
//                                 339.292 - (339.292 * matchPercent) / 100
//                               }`,
//                             }}
//                           />
//                         </svg>
//                         <div className="score-text">
//                           <span className="score-number">{matchPercent}%</span>
//                         </div>
//                       </div>
//                       <span
//                         className={`score-label ${
//                           matchPercent >= 75
//                             ? "excellent"
//                             : matchPercent >= 50
//                             ? "moderate"
//                             : "low"
//                         }`}
//                       >
//                         {matchPercent >= 75
//                           ? "🎯 Excellent Match"
//                           : matchPercent >= 50
//                           ? "⚡ Moderate Match"
//                           : "💪 Room to Improve"}
//                       </span>
//                     </div>
//                   </div>

//                   <TagBlock
//                     title="Strengths"
//                     icon="✅"
//                     items={analysis.strengths}
//                     type="good"
//                   />
//                   <TagBlock
//                     title="Missing Skills"
//                     icon="⚠️"
//                     items={analysis.missingSkills}
//                     type="warn"
//                   />

//                   <div className="recommendation-section">
//                     <h4 className="section-title">
//                       <span className="title-icon">💬</span>
//                       AI Recommendation
//                     </h4>
//                     <div className="recommendation">
//                       {analysis.recommendation}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* ================= JD Suggestions ================= */}
//           {activeTab === "suggestions" && (
//             <div className="fade-in">
//               <div className="textarea-wrapper">
//                 <label className="input-label">Job Description</label>
//                 <textarea
//                   className="styled-textarea"
//                   placeholder="Paste the job description to get AI-powered suggestions..."
//                   value={jobDescription}
//                   onChange={(e) => setJobDescription(e.target.value)}
//                   disabled={loading}
//                   rows={8}
//                 />
//               </div>

//               <button
//                 className="btn primary btn-large"
//                 onClick={handleGetSuggestions}
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <>
//                     <span className="spinner"></span>
//                     Generating...
//                   </>
//                 ) : (
//                   <>
//                     <span className="btn-icon">✨</span>
//                     Generate Suggestions
//                   </>
//                 )}
//               </button>

//               {suggestions && <JDSuggestionUI suggestions={suggestions} />}
//             </div>
//           )}

//           {/* ================= Format Resume ================= */}
//           {activeTab === "format" && (
//             <div className="fade-in">
//               <div className="upload-section">
//                 <input
//                   ref={formatInputRef}
//                   type="file"
//                   hidden
//                   accept=".pdf,.doc,.docx,.txt"
//                   onChange={handleFormatFile}
//                 />
//                 <button
//                   className={`btn outline ${formatFileName ? "uploaded" : ""}`}
//                   onClick={() => formatInputRef.current.click()}
//                   disabled={loading}
//                 >
//                   <span className="btn-icon">📎</span>
//                   {formatFileName ? formatFileName : "Upload Resume"}
//                 </button>
//               </div>

//               {formatFile && !resumeFields && (
//                 <button
//                   className="btn primary btn-large"
//                   onClick={handleConvertResume}
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <span className="spinner"></span>
//                       Extracting...
//                     </>
//                   ) : (
//                     <>
//                       <span className="btn-icon">🔄</span>
//                       Extract Resume Data
//                     </>
//                   )}
//                 </button>
//               )}

//               {resumeFields && (
//                 <div className="analysis-card slide-up">
//                   <h3 className="section-title">
//                     <span className="title-icon">✏️</span>
//                     Edit Resume Fields
//                   </h3>

//                   <div className="fields-grid">
//                     {Object.entries(resumeFields).map(([k, v], index) => (
//                       <div key={k} className="field-group" style={{ '--index': index }}>
//                         <label className="field-label">
//                           {k
//                             .replace(/_/g, " ")
//                             .replace(/\b\w/g, (l) => l.toUpperCase())}
//                         </label>
//                         <textarea
//                           className="field-input"
//                           value={v || ""}
//                           onChange={(e) => handleFieldChange(k, e.target.value)}
//                           rows={3}
//                         />
//                       </div>
//                     ))}
//                   </div>

//                   <div className="download-section">
//                     <label className="field-label">Download Format</label>
//                     <select
//                       className="styled-select"
//                       value={downloadType}
//                       onChange={(e) => setDownloadType(e.target.value)}
//                     >
//                       <option value="pdf">📄 PDF</option>
//                       <option value="docx">📝 DOCX</option>
//                     </select>
//                   </div>

//                   <button
//                     className="btn success btn-large"
//                     onClick={handleDownload}
//                     disabled={loading}
//                   >
//                     {loading ? (
//                       <>
//                         <span className="spinner"></span>
//                         Preparing...
//                       </>
//                     ) : (
//                       <>
//                         <span className="btn-icon">⬇️</span>
//                         Download Resume
//                       </>
//                     )}
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ================= SMALL COMPONENTS ================= */

// const TagBlock = ({ title, icon, items = [], type }) => (
//   <div className="tag-block">
//     <h4 className="section-title">
//       <span className="title-icon">{icon}</span>
//       {title}
//     </h4>
//     <div className="tags">
//       {items.map((i, idx) => (
//         <span
//           key={idx}
//           className={`tag ${type}`}
//           style={{ animationDelay: `${idx * 0.05}s` }}
//         >
//           {i}
//         </span>
//       ))}
//     </div>
//   </div>
// );

// const JDSuggestionUI = ({ suggestions }) => (
//   <div className="analysis-card slide-up">
//     <h3 className="section-title">
//       <span className="title-icon">🎯</span>
//       JD Search Helper
//     </h3>

//     <div className="action-buttons">
//       <button
//         className="btn outline btn-action"
//         onClick={() =>
//           navigator.clipboard.writeText(JSON.stringify(suggestions, null, 2))
//         }
//       >
//         <span className="btn-icon">📋</span>
//         Copy All Keywords
//       </button>

//       <button
//         className="btn success btn-action"
//         onClick={() =>
//           navigator.clipboard.writeText(suggestions.booleanSearch)
//         }
//       >
//         <span className="btn-icon">🔗</span>
//         Copy Boolean Search
//       </button>
//     </div>

//     <TagBlock
//       title="Job Titles"
//       icon="💼"
//       items={suggestions.jobTitles}
//       type="info"
//     />
//     <TagBlock
//       title="Primary Skills"
//       icon="⭐"
//       items={suggestions.primarySkills}
//       type="primary"
//     />
//     <TagBlock
//       title="Secondary Skills"
//       icon="🔸"
//       items={suggestions.secondarySkills}
//       type="secondary"
//     />
//     <TagBlock
//       title="Tools & Technologies"
//       icon="🛠️"
//       items={suggestions.toolsAndTechnologies}
//       type="tech"
//     />

//     <div className="boolean-section">
//       <h4 className="section-title">
//         <span className="title-icon">🔍</span>
//         Boolean Search Query
//       </h4>
//       <div className="recommendation boolean-query">
//         {suggestions.booleanSearch}
//       </div>
//     </div>
//   </div>
// );
