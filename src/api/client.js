import axios from "axios";

/* ================= BASE CONFIG ================= */
const API_BASE_URL = "http://localhost:5000/api";
//const API_BASE_URL = "http://13.233.18.243:5000/api";
//const API_BASE_URL = "https://d3akj83x87be4b.cloudfront.net/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

/* ================= JWT INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

/* ================= AUTH API ================= */
export const authAPI = {
  // Google OAuth login
  googleLogin: (token) =>
    api.post("/auth/google-login", { token }),

  // Verify OTP
  verifyOTP: (userId, otp) =>
    api.post("/auth/verify-otp", { userId, otp }),
  
  // Microsoft OAuth login
  microsoftLogin: (token) =>
    api.post("/auth/microsoft-login", { token }),
};

/* ================= ADMIN API ================= */
export const adminAPI = {
  login: (data) => api.post("/admin/login", data),
  addUser: (data) => api.post("/admin/add-user", data),
};

/* ================= CANDIDATES API ================= */
export const candidatesAPI = {
  getAll: () => api.get("/candidates"),
  getById: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post("/candidates", data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
};

/* ================= INTERVIEWS API ================= */
export const interviewsAPI = {
  getAll: () => api.get("/interviews"),
  getByCandidate: (candidateId) =>
    api.get(`/interviews/candidate/${candidateId}`),
  create: (data) => api.post("/interviews", data),
  update: (id, data) =>
    api.put(`/interviews/${id}`, data),
  updateStatus: (id, data) =>
    api.put(`/interviews/${id}/status`, data),
};

/* ================= OFFERS API ================= */
export const offersAPI = {
  getByCandidate: (candidateId) =>
    api.get(`/offers/candidate/${candidateId}`),
  create: (data) => api.post("/offers", data),
};

/* ================= EMAILS API ================= */
export const emailsAPI = {
  sendInterview: (data) =>
    api.post("/emails/interview", data),
  sendOffer: (data) =>
    api.post("/emails/offer", data),
  getLogs: () =>
    api.get("/emails/logs"),
};

/* ================= AI API ================= */
export const aiAPI = {
  parseResume: (formData) =>
    api.post("/ai/parse-resume", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  analyzeResume: (data) =>
    api.post("/ai/analyze", data),
  getJDSuggestions: (data) =>
    api.post("/ai/jd-suggestions", data),
  getInterviewTips: (data) =>
    api.post("/ai/interview-tips", data),
  convertResumeFormat: (formData) =>
    api.post("/ai/convert-resume-format", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  generateFormattedResume: (data) =>
    api.post("/ai/generate-formatted-resume", data),
  downloadFormattedResume: (data) =>
    api.post("/ai/generate-formatted-resume", data, {
      responseType: "blob",
    }),
};

/* ================= INTERVIEWERS API ================= */
export const interviewersAPI = {
  getAll: () => api.get("/interviewers"),
  create: (data) => api.post("/interviewers", data),
  delete: (id) => api.delete(`/interviewers/${id}`),
};

/* ================= RESUMES API - ✅ FIXED & COMPLETE ================= */
export const resumesAPI = {
  // ✅ CRITICAL: Parse resume to extract candidate data (THIS WAS MISSING!)
  parseResume: (formData) =>
    api.post("/ai/parse-resume", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // Upload resume file for a candidate
  upload: (formData) =>
    api.post("/resumes/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Get all resume updates (for Profile page)
  getAllUpdates: () => api.get("/resumes/all-updates"),

  // Get resume by candidate
  getByCandidate: (candidateId) =>
    api.get(`/resumes/candidate/${candidateId}`),

  // Get resume by ID
  getById: (id) =>
    api.get(`/resumes/${id}`),

  // Download resume
  download: (id) =>
    api.get(`/resumes/download/${id}`, 
    ),
};

/* ================= ✅ PROFILE API - NEW! ================= */
export const profileAPI = {
  // ✅ STATUS ACTIVITY - THIS FIXES YOUR ERROR!
  getStatusActivity: () => api.get("/profile/status-activity"),
  
  // Profile info
  getProfile: () => api.get("/profile/me"),
}; 

/* ================= STATUS SYNC HELPER ================= */
export const notifyStatusUpdated = () => {
  localStorage.setItem("STATUS_UPDATED_AT", Date.now().toString());
};
