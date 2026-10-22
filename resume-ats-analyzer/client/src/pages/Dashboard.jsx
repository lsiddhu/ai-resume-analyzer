import { useState, useRef, useId } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SAMPLE_JOB_DESCRIPTION = `Senior Full Stack Developer (React & Node.js)

About the Role:
We are seeking an experienced Full Stack Developer to lead the development of our high-scale web platforms. You will design, build, and maintain robust frontend interfaces and scalable backend microservices.

Key Responsibilities:
• Build responsive, accessible, and performant web applications using React.js, TypeScript, and Tailwind CSS.
• Design and implement RESTful APIs and microservices using Node.js, Express, and MongoDB.
• Optimize application performance, scalability, and security across the entire stack.
• Collaborate with cross-functional teams including product managers, UI/UX designers, and DevOps engineers.
• Write unit and integration tests to ensure high code quality and reliability.

Requirements & Qualifications:
• 4+ years of professional software engineering experience.
• Strong proficiency in JavaScript (ES6+), TypeScript, React, and state management.
• Solid hands-on experience with Node.js, Express, MongoDB, and Mongoose.
• Familiarity with Git version control, CI/CD pipelines, Docker, and AWS cloud services.
• Experience with REST API design, JWT authentication, and database optimization.
• Excellent problem-solving, communication, and collaboration skills.`;

function Dashboard() {
  const [resume, setResume] = useState(null);
  const [resumeId, setResumeId] = useState(
    localStorage.getItem("resumeId") || ""
  );
  const [resumeFileName, setResumeFileName] = useState(
    localStorage.getItem("resumeFileName") || ""
  );

  const [jobDescription, setJobDescription] = useState("");
  const [uploadMessage, setUploadMessage] = useState({ type: "", text: "" });
  const [analyzeMessage, setAnalyzeMessage] = useState({ type: "", text: "" });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // UX Enhancements: drag state, keywords filter & search, copy status
  const [isDragging, setIsDragging] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState("all"); // 'all' | 'matched' | 'missing'
  const [keywordSearch, setKeywordSearch] = useState("");
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // File Validation Helper
  const validateAndSetFile = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadMessage({
        type: "error",
        text: "Please select a valid PDF file.",
      });
      setResume(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage({
        type: "error",
        text: "File size exceeds 5 MB. Please upload a smaller PDF.",
      });
      setResume(null);
      return;
    }

    setResume(file);
    setUploadMessage({ type: "", text: "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleUpload = async () => {
    if (!resume) {
      setUploadMessage({
        type: "error",
        text: "Please select a PDF resume to upload.",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setUploadMessage({
        type: "error",
        text: "Session expired. Please log in again.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);

    setUploadLoading(true);
    setUploadMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/api/resume/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadMessage({
          type: "error",
          text: data.message || "Failed to upload resume.",
        });
        return;
      }

      const uploadedResumeId = data.resume?.id || data.resume?._id;
      const uploadedName = data.fileName || data.resume?.fileName || resume.name;

      if (!uploadedResumeId) {
        setUploadMessage({
          type: "error",
          text: "Resume uploaded, but identifier was not returned.",
        });
        return;
      }

      setResumeId(uploadedResumeId);
      setResumeFileName(uploadedName);

      localStorage.setItem("resumeId", uploadedResumeId);
      localStorage.setItem("resumeFileName", uploadedName);

      setUploadMessage({
        type: "success",
        text: "Resume parsed & ready for evaluation.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage({
        type: "error",
        text: "Unable to reach server. Please check your connection.",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAnalyze = async () => {
    const currentResumeId = resumeId || localStorage.getItem("resumeId");

    if (!currentResumeId) {
      setAnalyzeMessage({
        type: "error",
        text: "Please upload your resume PDF before analyzing.",
      });
      return;
    }

    if (!jobDescription.trim()) {
      setAnalyzeMessage({
        type: "error",
        text: "Please provide the target job description to match against.",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setAnalyzeMessage({
        type: "error",
        text: "Session expired. Please log in again.",
      });
      return;
    }

    setAnalyzeLoading(true);
    setAnalyzeMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_URL}/api/resume/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeId: currentResumeId,
          jobDescription: jobDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnalyzeMessage({
          type: "error",
          text: data.message || "Resume analysis failed.",
        });
        setAnalysisResult(null);
        return;
      }

      setAnalysisResult(data.result);
      setAnalyzeMessage({
        type: "success",
        text: "Evaluation completed successfully.",
      });

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalyzeMessage({
        type: "error",
        text: "Network error during analysis. Please try again.",
      });
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("resumeId");
    localStorage.removeItem("resumeFileName");
    window.location.href = "/login";
  };

  const handleCopySummary = () => {
    if (!analysisResult?.aiAnalysis?.summary) return;

    const reportText = `RESUME ATS REPORT
Overall Score: ${score}%
Matching Keywords: ${analysisResult.matchingKeywords?.length || 0}
Missing Keywords: ${analysisResult.missingKeywords?.length || 0}

EXECUTIVE SUMMARY:
${analysisResult.aiAnalysis.summary}

TOP STRENGTHS:
${(analysisResult.aiAnalysis.strengths || []).map((s) => `• ${s}`).join("\n")}

AREAS FOR IMPROVEMENT:
${(analysisResult.aiAnalysis.weaknesses || []).map((w) => `• ${w}`).join("\n")}

RECOMMENDED ACTIONS:
${(analysisResult.aiAnalysis.suggestions || []).map((sg) => `• ${sg}`).join("\n")}`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  const score = analysisResult?.atsScore || 0;

  // Score categorization
  const getScoreTheme = (val) => {
    if (val >= 80) {
      return {
        badge: "Strong Fit",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        stroke: "#059669",
        textClass: "text-emerald-700",
        bgLight: "bg-emerald-50/60",
        description: "Your resume aligns exceptionally well with the target role requirements.",
      };
    }
    if (val >= 60) {
      return {
        badge: "Moderate Match",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
        stroke: "#d97706",
        textClass: "text-amber-700",
        bgLight: "bg-amber-50/60",
        description: "Good foundation, but several key technical skills or keywords are missing.",
      };
    }
    return {
      badge: "Needs Optimization",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
      stroke: "#e11d48",
      textClass: "text-rose-700",
      bgLight: "bg-rose-50/60",
      description: "Low keyword density detected. Tailor your resume before submitting.",
    };
  };

  const scoreTheme = getScoreTheme(score);

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Keyword filtering logic
  const matchingList = analysisResult?.matchingKeywords || [];
  const missingList = analysisResult?.missingKeywords || [];

  const filteredKeywords = () => {
    let list = [];
    if (keywordFilter === "all") {
      list = [
        ...matchingList.map((k) => ({ text: k, matched: true })),
        ...missingList.map((k) => ({ text: k, matched: false })),
      ];
    } else if (keywordFilter === "matched") {
      list = matchingList.map((k) => ({ text: k, matched: true }));
    } else {
      list = missingList.map((k) => ({ text: k, matched: false }));
    }

    if (keywordSearch.trim()) {
      const q = keywordSearch.toLowerCase();
      list = list.filter((item) => item.text.toLowerCase().includes(q));
    }

    return list;
  };

  const activeKeywords = filteredKeywords();
  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Refined Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M9 15h6" />
                <path d="M9 11h6" />
                <path d="M9 19h3" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  ResumeIQ
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-600 uppercase">
                  ATS Scanner
                </span>
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">
                Precision Resume & Job Matching Engine
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 py-1 pr-3.5 pl-1.5 md:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700">
                {user?.name || "User"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100"
            >
              <svg
                className="h-3.5 w-3.5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Workspace Intro Hero Banner */}
        <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                ATS Optimization Workspace
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Resume & Role Compatibility Analysis
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
                Upload your resume in PDF format, provide the target job description, and obtain automated keyword matching metrics alongside Gemini AI diagnostics.
              </p>
            </div>

            {/* Quick stats badge if already uploaded */}
            {(resumeFileName || resume) && (
              <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs">
                  <svg
                    className="h-5 w-5 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">
                    Active Document
                  </p>
                  <p className="max-w-[180px] truncate text-xs font-semibold text-slate-800">
                    {resume?.name || resumeFileName}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Workstation: 2-Column Split */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Column 1: Document Upload (5 cols) */}
          <div className="lg:col-span-5">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      1
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Upload Resume
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    PDF · Max 5MB
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Select or drag your latest resume. Text will be extracted securely.
                </p>

                {/* Dropzone Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                    isDragging
                      ? "border-slate-900 bg-slate-50/80 scale-[0.99]"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-xs ring-1 ring-slate-200">
                    <svg
                      className="h-6 w-6 text-slate-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>

                  <p className="mt-3 text-xs font-medium text-slate-700">
                    <span className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2">
                      Click to choose file
                    </span>{" "}
                    or drag and drop here
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    PDF format only up to 5 MB
                  </p>
                </div>

                {/* Active Selection / Stored File Card */}
                {resume ? (
                  <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs ring-1 ring-slate-200">
                        <svg
                          className="h-4 w-4 text-emerald-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {resume.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(resume.size / (1024 * 1024)).toFixed(2)} MB · Pending upload
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setResume(null);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600"
                      title="Clear file"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  resumeFileName && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                            Ready on Server
                          </p>
                          <p className="truncate text-xs font-medium text-slate-700">
                            {resumeFileName}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        Loaded
                      </span>
                    </div>
                  )
                )}

                {/* Status Message */}
                {uploadMessage.text && (
                  <div
                    className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-xs leading-5 ${
                      uploadMessage.type === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border border-rose-200 bg-rose-50 text-rose-800"
                    }`}
                  >
                    <span className="mt-0.5 font-bold">
                      {uploadMessage.type === "success" ? "✓" : "!"}
                    </span>
                    <span>{uploadMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Upload CTA Button */}
              <div className="mt-5 pt-3">
                <button
                  onClick={handleUpload}
                  disabled={uploadLoading || !resume}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploadLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span>Processing Document...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <span>{resume ? "Upload & Parse Resume" : "Select PDF First"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Job Description Input (7 cols) */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      2
                    </span>
                    <h2 className="text-base font-bold text-slate-900">
                      Target Job Description
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setJobDescription(SAMPLE_JOB_DESCRIPTION)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                    >
                      Use Sample JD
                    </button>
                    {jobDescription && (
                      <button
                        type="button"
                        onClick={() => setJobDescription("")}
                        className="text-[11px] font-medium text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-1.5 text-xs text-slate-500">
                  Paste the requirements, qualifications, and role responsibilities from the job listing.
                </p>

                {/* Textarea */}
                <div className="relative mt-4">
                  <textarea
                    rows={9}
                    placeholder="Paste the target job description here (e.g. required skills, tech stack, minimum experience, education)..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:outline-none transition sm:text-sm"
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-400 backdrop-blur-xs ring-1 ring-slate-200">
                    <span>{wordCount} words</span>
                    <span>·</span>
                    <span>{jobDescription.length} chars</span>
                  </div>
                </div>

                {/* Status Message */}
                {analyzeMessage.text && (
                  <div
                    className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-xs leading-5 ${
                      analyzeMessage.type === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border border-rose-200 bg-rose-50 text-rose-800"
                    }`}
                  >
                    <span className="mt-0.5 font-bold">
                      {analyzeMessage.type === "success" ? "✓" : "!"}
                    </span>
                    <span>{analyzeMessage.text}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzeLoading || !jobDescription.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 active:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {analyzeLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span>Analyzing Compatibility with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Run ATS Evaluation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Output Section */}
        {analysisResult && (
          <section id="results-section" className="mt-10 scroll-mt-20">
            {/* Section Header with Actions */}
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Evaluation Completed
                  </p>
                </div>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  ATS Compatibility Report
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {copiedSummary ? (
                    <>
                      <svg
                        className="h-3.5 w-3.5 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-3.5 w-3.5 text-slate-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Copy Full Report</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <svg
                    className="h-3.5 w-3.5 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Score & Primary Metrics Hero Grid */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Radial Progress Gauge Card (5 cols) */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col items-center justify-between text-center">
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    ATS Match Index
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${scoreTheme.badgeClass}`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: scoreTheme.stroke }}
                    ></span>
                    {scoreTheme.badge}
                  </span>
                </div>

                {/* SVG Radial Gauge */}
                <div className="relative my-4 flex items-center justify-center">
                  <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 128 128">
                    {/* Background Track */}
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      stroke="#E2E8F0"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Colored Progress Ring */}
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      stroke={scoreTheme.stroke}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Centered Score Readout */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {score}%
                    </span>
                    <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                      Match Score
                    </span>
                  </div>
                </div>

                {/* Descriptive verdict */}
                <p className="text-xs leading-relaxed text-slate-600 max-w-sm">
                  {scoreTheme.description}
                </p>
              </div>

              {/* 3 Metric Detail Cards (7 cols) */}
              <div className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Matched Keywords */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Matched Skills
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {matchingList.length}
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] text-emerald-700 font-medium">
                    Found in candidate profile
                  </p>
                </div>

                {/* Missing Keywords */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Missing Keywords
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {missingList.length}
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] text-rose-700 font-medium">
                    Required by employer
                  </p>
                </div>

                {/* Total JD Requirements */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      JD Keywords
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {analysisResult.totalJobKeywords || 0}
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500 font-medium">
                    Extracted requirements
                  </p>
                </div>
              </div>
            </div>

            {/* Keyword Analysis Explorer */}
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Keyword Alignment Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review which skills were detected in your resume versus requirements in the job description.
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button
                      onClick={() => setKeywordFilter("all")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        keywordFilter === "all"
                          ? "bg-white text-slate-900 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({matchingList.length + missingList.length})
                    </button>
                    <button
                      onClick={() => setKeywordFilter("matched")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        keywordFilter === "matched"
                          ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-emerald-700"
                      }`}
                    >
                      Matched ({matchingList.length})
                    </button>
                    <button
                      onClick={() => setKeywordFilter("missing")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                        keywordFilter === "missing"
                          ? "bg-white text-rose-800 shadow-2xs font-semibold"
                          : "text-slate-600 hover:text-rose-700"
                      }`}
                    >
                      Missing ({missingList.length})
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search keywords..."
                      value={keywordSearch}
                      onChange={(e) => setKeywordSearch(e.target.value)}
                      className="w-40 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pr-2.5 pl-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition sm:w-48"
                    />
                    <svg
                      className="absolute top-2 left-2.5 h-3.5 w-3.5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pills Display */}
              <div className="mt-5 flex flex-wrap gap-2">
                {activeKeywords.length > 0 ? (
                  activeKeywords.map((item, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                        item.matched
                          ? "border border-emerald-200/90 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/60"
                          : "border border-rose-200/80 bg-rose-50/70 text-rose-800 hover:bg-rose-100/60"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          item.matched ? "bg-emerald-600" : "bg-rose-500"
                        }`}
                      ></span>
                      {item.text}
                      <span className="text-[10px] opacity-60">
                        {item.matched ? "✓" : "+"}
                      </span>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 italic">
                    No keywords matching your current filter.
                  </p>
                )}
              </div>
            </div>

            {/* AI Strategic Assessment (Deep Diagnostic) */}
            {analysisResult.aiAnalysis && (
              <div className="mt-6 space-y-6">
                {/* Executive Summary Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Executive Fit Summary
                      </h3>
                      <p className="text-xs text-slate-400">
                        Synthesized evaluation based on resume profile and job criteria
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border-l-4 border-slate-900 bg-slate-50/70 p-4">
                    <p className="text-xs leading-relaxed text-slate-700 sm:text-sm">
                      {analysisResult.aiAnalysis.summary}
                    </p>
                  </div>
                </div>

                {/* 2-Column Strengths & Weaknesses */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Key Strengths */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Demonstrated Strengths
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Strong alignment with target role expectations
                        </p>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2.5">
                      {analysisResult.aiAnalysis.strengths?.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs leading-5 text-slate-700"
                        >
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                            ✓
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement / Weaknesses */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-700">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Identified Gaps & Vulnerabilities
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Areas likely to trigger ATS filters or recruiter concerns
                        </p>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2.5">
                      {analysisResult.aiAnalysis.weaknesses?.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs leading-5 text-slate-700"
                        >
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-800">
                            !
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 2-Column Suggestions & Missing Skills */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Actionable Suggestions */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Recommended Action Items
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Step-by-step improvements to boost your match score
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      {analysisResult.aiAnalysis.suggestions?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <p className="text-xs leading-5 text-slate-700">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Missing Skills */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          High-Impact Missing Skills
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Key competencies requested in JD but not found
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {analysisResult.aiAnalysis.missingSkills?.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/70 px-3 py-1.5 text-xs font-semibold text-amber-900"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          {item}
                        </span>
                      ))}
                    </div>

                    <p className="mt-5 text-[11px] leading-relaxed text-slate-500">
                      💡 Tip: Incorporate these competencies directly into your work experience bullet points or technical skills section with concrete achievements.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;