import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { toast } from "react-toastify";
import api from "../api/client";
import { resumesAPI, profileAPI } from "../api/client";
import "../pages/AnimationsAndStyles.css";

export default function Profile() {
  const navigate = useNavigate();

  // MSAL setup (unchanged)
  let instance;
  try {
    const msal = useMsal();
    instance = msal?.instance;
  } catch (err) {
    console.warn("MSAL not initialized:", err.message);
    instance = null;
  }

  /* ================= ENHANCED STATE WITH GRAPHICS ================= */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("profile");
  
  // Resume state
  const [resumeUpdates, setResumeUpdates] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  
 // Search state
const [resumeSearch, setResumeSearch] = useState("");

  const filteredResumes = resumeUpdates.filter(item => {
  const search = resumeSearch.toLowerCase();

  return (
    item.candidate_name?.toLowerCase().includes(search) ||
    item.updated_by_name?.toLowerCase().includes(search)
  );
});

  // Status activity state
  const [statusLogs, setStatusLogs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusLoading, setStatusLoading] = useState(false);

  /* ================= GRAPHICS INTEGRATION ================= */
  const getStatusIcon = (status) => {
    const icons = {
      applied: "🟢",
      hold: "🟡", 
      "invitation_sent": "🔵",
      rejected: "🔴",
      all: "📊"
    };
    return icons[status] || "📈";
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: '#10B981',
      hold: '#F59E0B',
      invitation_sent: '#3B82F6',
      rejected: '#EF4444',
      all: '#64748B'
    };
    return colors[status] || '#64748B';
  };

  /* ================= DOWNLOAD & FETCH FUNCTIONS (UNCHANGED) ================= */
const handleDownload = async (resumeId) => {
  try {
    const res = await resumesAPI.download(resumeId);

    console.log("Download response:", res.data);

    const downloadUrl = res.data.downloadUrl;

    if (!downloadUrl) {
      toast.error("No download URL received");
      return;
    }

    // Open signed S3 URL
    window.open(downloadUrl, "_blank");

  } catch (err) {
    console.error(err);
    toast.error("Download failed");
  }
};


  // const handleDownload = async (resumeId) => {
  //   try {
  //     const res = await resumesAPI.download(resumeId);
  //     const url = window.URL.createObjectURL(new Blob([res.data]));
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute("download", `resume-${resumeId}.pdf`);
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //     window.URL.revokeObjectURL(url);
  //     toast.success("Resume downloaded!");
  //   } catch (err) {
  //     toast.error("Download failed");
  //   }
  // };

  // Fetch resume updates (unchanged)
  useEffect(() => {
    if (activeTab !== "resumes") return;
    const fetchResumeUpdates = async () => {
      try {
        setResumeLoading(true);
        const res = await resumesAPI.getAllUpdates();
        setResumeUpdates(res.data);
      } catch (err) {
        toast.error("Failed to load resume updates");
      } finally {
        setResumeLoading(false);
      }
    };
    fetchResumeUpdates();
  }, [activeTab]);

  // Fetch status activity (enhanced with graphics prep)
  useEffect(() => {
  if (activeTab !== "status") return;

  const fetchStatusLogs = async () => {
    try {
      setStatusLoading(true);
      const res = await profileAPI.getStatusActivity(); // ✅ CORRECT
      setStatusLogs(res.data);
    } catch (err) {
      toast.error("Failed to load status activity");
    } finally {
      setStatusLoading(false);
    }
  };

  fetchStatusLogs();
}, [activeTab]);

  // Profile fetch (unchanged)
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }
      try {
        const res = await api.get("/auth/me");
        if (isMounted) {
          setUser(res.data);
          setError(null);
        }
      } catch (err) {
        try {
          const decoded = jwtDecode(token);
          if (isMounted) {
            setUser(decoded);
            setError("Using cached data");
          }
        } catch (decodeErr) {
          if (isMounted) {
            setError("Session expired");
            setTimeout(() => handleLogout(), 1500);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    try {
      if (instance) await instance.logoutPopup({ postLogoutRedirectUri: window.location.origin });
    } catch (err) {
      console.warn("Logout skipped:", err?.message);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  /* ================= STATUS FILTER LOGIC ================= */
  const filteredLogs = statusLogs.filter(log => 
    statusFilter === "all" ? true : log.status === statusFilter
  );

  // Status summary for graphics
  const statusSummary = statusLogs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={page}>
        <style>{css}</style>
        <div style={styles.centeredCard}>
          <div style={styles.loadingSpinner}>⏳</div>
          <h2 style={styles.loadingTitle}>Loading Profile...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={page}>
        <style>{css}</style>
        <div style={styles.centeredCard}>
          <div style={styles.emptyIcon}>🔓</div>
          <h2 style={styles.errorTitle}>Session Expired</h2>
          <button style={styles.buttonDanger} onClick={handleLogout}>🔄 Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <style>{css}</style>
      <div style={styles.container}>
        <div style={styles.profileCard}>
          {/* 🎨 ENHANCED HEADER WITH GRAPHICS */}
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.title}>👤 My Profile</h2>
              <p style={styles.subtitle}>Account & Activity Dashboard</p>
            </div>
            <span style={{
              ...styles.roleBadge,
              background: `linear-gradient(135deg, ${getStatusColor('invitation_sent')}, #1e40af)`
            }}>
              👑 {user.role?.toUpperCase() || "HR"}
            </span>
          </div>

          {error && <div style={styles.warningBanner}>⚠️ {error}</div>}

          <div style={styles.divider} />

          {/* 🎨 ENHANCED TABS WITH ICONS & BADGES */}
          <div style={styles.tabs}>
            <button style={{...styles.tabButton, ...(activeTab === "profile" ? styles.activeTab : {})}} onClick={() => setActiveTab("profile")}>
              👤 Profile
            </button>
            <button style={{...styles.tabButton, ...(activeTab === "resumes" ? styles.activeTab : {})}} onClick={() => setActiveTab("resumes")}>
              📄 Resumes {resumeUpdates.length > 0 && `(${resumeUpdates.length})`}
            </button>
            <button style={{...styles.tabButton, ...(activeTab === "status" ? styles.activeTab : {})}} onClick={() => setActiveTab("status")}>
              📊 Status {statusLogs.length > 0 && `(${statusLogs.length})`}
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <>
              <div style={styles.profileInfo}>
                <ProfileField label="👤 Full Name" value={user.name || user.username || "N/A"} />
                <ProfileField label="✉️ Email" value={user.email || "N/A"} />
                <ProfileField label="🎯 Role" value={user.role || "HR"} />
              </div>
              <div style={styles.divider} />
              <div style={styles.logoutBox}>
                <div>
                  <strong style={styles.logoutTitle}>⚠️ Logout</strong>
                  <p style={styles.logoutSubtext}>End current session</p>
                </div>
                <button style={styles.buttonDanger} onClick={handleLogout}>🚪 Logout</button>
              </div>
            </>
          )}

          {/* Resumes Tab (unchanged structure) */}
          {activeTab === "resumes" && (
            
            <div style={styles.resumeSection}>
                              {/* 🔍 Resume Search */}
                <div style={{ marginBottom: "16px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search by Candidate or Updated By"
                    value={resumeSearch}
                    onChange={(e) => setResumeSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "2px solid #E2E8F0",
                      fontSize: "15px",
                      fontFamily: "'Times New Roman', serif",
                      outline: "none",
                    }}
                  />
                </div>

              {resumeLoading ? (
                <div style={styles.centeredMessage}><div style={styles.loadingSpinner}>⏳</div><p>Loading...</p></div>
              ) : resumeUpdates.length === 0 ? (
                <div style={styles.centeredMessage}><div style={styles.emptyIcon}>📄</div><p>No updates</p></div>
              ) : (
                    filteredResumes.map(item => (
    <div key={item.id} style={styles.resumeCard}>
    <div style={styles.resumeDetails}>
      <div style={styles.resumeField}>
        <strong>👤 Candidate:</strong> {item.candidate_name}
      </div>

      {/* <div style={styles.resumeField}>
        <strong>🎯 Role:</strong> {item.candidate_role || "N/A"}
      </div> */}

      <div style={styles.resumeField}>
        <strong>👨‍💼 Updated by:</strong> {item.updated_by_name}
      </div>

      <div style={styles.resumeField}>
        <strong>🕒 Date:</strong>{" "}
        {new Date(item.created_at).toLocaleString()}
      </div>
    </div>

    <button
      style={styles.downloadBtn}
      onClick={() => handleDownload(item.id)}
    >
      ⬇️ Download
    </button>
  </div>
))

              )}
            </div>
          )}

          {/* 🎨 ENHANCED STATUS TAB WITH GRAPHICS */}
          {activeTab === "status" && (
            <div style={styles.statusSection}>
              {/* 📊 STATUS SUMMARY GRAPHICS */}
              <div style={styles.statusSummary}>
                <h3 style={styles.sectionTitle}>📈 Activity Overview</h3>
                <div style={styles.statusMetrics}>
                  {Object.entries(statusSummary).map(([status, count]) => (
                    <div key={status} style={{
                      ...styles.metricCard,
                      borderLeft: `4px solid ${getStatusColor(status)}`
                    }}>
                      <div style={styles.metricIcon}>{getStatusIcon(status)}</div>
                      <div>
                        <div style={styles.metricCount}>{count}</div>
                        <div style={styles.metricLabel}>{status.replace('_', ' ').toUpperCase()}</div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(statusSummary).length === 0 && (
                    <div style={styles.metricEmpty}>No activity yet</div>
                  )}
                </div>
              </div>

              {/* 🔍 FILTER WITH GRAPHIC INDICATOR */}
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Filter: </label>
                <select 
                  style={{
                    ...styles.filterSelect,
                    borderColor: getStatusColor(statusFilter),
                    background: `linear-gradient(135deg, ${getStatusColor(statusFilter)}10, transparent)`
                  }} 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">📊 All ({statusLogs.length})</option>
                  <option value="applied">🟢 Applied</option>
                  <option value="hold">🟡 Hold</option>
                  <option value="invitation_sent">🔵 Invitation Sent</option>
                  <option value="rejected">🔴 Rejected</option>
                </select>
              </div>

              {/* 📱 CARDS WITH ENHANCED GRAPHICS */}
              {statusLoading ? (
                <div style={styles.centeredMessage}>
                  <div style={styles.loadingSpinner}>🔄</div>
                  <p>Loading activity...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div style={styles.centeredMessage}>
                  <div style={styles.emptyIcon}>📊</div>
                  <p>No {statusFilter === "all" ? "activity" : statusFilter} found</p>
                </div>
              ) : (
                <div style={styles.statusGrid}>
                  {filteredLogs.map(item => {
                    const statusColor = getStatusColor(item.status);
                    return (
                      <div key={item.id} style={{
                        ...styles.statusCard,
                        boxShadow: `0 4px 12px ${statusColor}20`,
                        borderTop: `3px solid ${statusColor}`
                      }}>
                        <div style={styles.statusHeader}>
                          <div style={styles.candidateName}>
                            👤 {item.first_name} {item.last_name}
                          </div>
                          <div style={{
                            ...styles.statusBadge,
                            background: `linear-gradient(135deg, ${statusColor}, ${statusColor}cc)`,
                            boxShadow: `0 2px 8px ${statusColor}40`
                          }}>
                            {getStatusIcon(item.status)} {item.status.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <div style={styles.statusDate}>
                          🕒 {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ProfileField component (unchanged) */
const ProfileField = ({ label, value }) => (
  <div style={styles.field}>
    <label style={styles.fieldLabel}>{label}</label>
    <div style={styles.fieldValue}>{value || "—"}</div>
  </div>
);

/* 🎨 COMPLETE ENHANCED STYLES */
const styles = {
  container: { maxWidth: '800px', margin: '0 auto' },
  profileCard: {
    background: '#FFFFFF',
    color: '#0F172A',
    padding: '32px',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    animation: 'fadeInUp 0.7s ease-out',
    fontFamily: "'Times New Roman', serif",
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#0F172A',
    fontFamily: "'Times New Roman', serif",
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748B',
    margin: '4px 0 0 0',
  },
  roleBadge: {
    color: 'white',
    padding: '12px 20px',
    borderRadius: '25px',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: '0 6px 16px rgba(30,64,175,0.4)',
    fontFamily: "'Times New Roman', serif",
  },
  tabs: {
    display: 'flex',
    gap: '16px',
    marginBottom: '28px',
    flexWrap: 'wrap',
  },
  tabButton: {
    padding: '14px 24px',
    borderRadius: '20px',
    border: '2px solid #E2E8F0',
    background: '#F8FAFC',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#475569',
    fontFamily: "'Times New Roman', serif",
    whiteSpace: 'nowrap',
  },
  activeTab: {
    background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
    color: 'white',
    borderColor: '#1E40AF',
    boxShadow: '0 8px 20px rgba(30,64,175,0.4)',
    transform: 'translateY(-2px)',
  },
  statusSection: { marginTop: '8px' },
  statusSummary: {
    background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
    padding: '24px',
    borderRadius: '16px',
    marginBottom: '24px',
    border: '1px solid #0EA5E9',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    color: '#0F172A',
    fontFamily: "'Times New Roman', serif",
  },
  statusMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  metricIcon: {
    fontSize: '24px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.8)',
  },
  metricCount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  filterLabel: {
    fontWeight: '600',
    color: '#0F172A',
    fontSize: '15px',
  },
  filterSelect: {
    padding: '12px 20px',
    borderRadius: '12px',
    border: '2px solid',
    background: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    minWidth: '220px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  statusGrid: {
    display: 'grid',
    gap: '16px',
  },
  statusCard: {
    padding: '20px',
    borderRadius: '16px',
    background: 'white',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    transition: 'all 0.3s ease',
    border: '1px solid #E2E8F0',
  },
  statusHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  candidateName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statusDate: {
    fontSize: '14px',
    color: '#64748B',
    fontFamily: "'Times New Roman', serif",
  },
  // Include all other existing styles...
  profileInfo: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' },
  field: { animation: 'fadeInUp 0.6s ease-out' },
  fieldLabel: { fontSize: '12px', color: '#64748B', marginBottom: '8px', display: 'block', fontWeight: '700', textTransform: 'uppercase' },
  fieldValue: { background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '16px', fontWeight: '600' },
  logoutBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: '#FEF2F2', borderRadius: '16px', flexWrap: 'wrap', gap: '16px' },
  logoutTitle: { fontSize: '18px', color: '#0F172A' },
  logoutSubtext: { fontSize: '14px', color: '#64748B', margin: '4px 0 0 0' },
  buttonDanger: { background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '15px', boxShadow: '0 6px 16px rgba(239,68,68,0.4)' },
  resumeSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  resumeCard: { padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)', flexWrap: 'wrap', gap: '16px' },
  downloadBtn: { background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', boxShadow: '0 6px 16px rgba(30,64,175,0.4)' },
  centeredCard: { maxWidth: '500px', margin: 'auto', background: 'white', padding: '48px 32px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', textAlign: 'center', animation: 'scaleIn 0.6s ease-out' },
  loadingSpinner: { fontSize: '64px', marginBottom: '20px', animation: 'spin 2s linear infinite' },
  loadingTitle: { color: '#0F172A', fontSize: '28px', margin: '0 0 16px 0' },
  errorTitle: { color: '#DC2626', fontSize: '28px', margin: '0 0 16px 0' },
  emptyIcon: { fontSize: '72px', marginBottom: '20px' },
  emptyText: { color: '#64748B', fontSize: '16px', margin: '16px 0 24px 0', lineHeight: '1.6' },
  centeredMessage: { textAlign: 'center', padding: '48px 24px' },
  metricEmpty: { gridColumn: '1 / -1', textAlign: 'center', color: '#94A3B8', fontSize: '16px', padding: '24px' },
};

const page = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)",
  padding: "40px 20px",
  fontFamily: "'Times New Roman', serif",
};

const css = `
@keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@media (max-width: 768px) { .container { padding: 0 16px; } .tabs { flex-direction: column; } }
`;

// import React, { useEffect, useState } from "react";
// import { jwtDecode } from "jwt-decode";
// import { useNavigate } from "react-router-dom";
// import { useMsal } from "@azure/msal-react";
// import { toast } from "react-toastify";
// import api from "../api/client";                    // ✅ FIXED: Import api
// import { resumesAPI } from "../api/client";        // ✅ Import resumesAPI
// import "../pages/AnimationsAndStyles.css";

// export default function Profile() {
//   const navigate = useNavigate();

//   // ✅ MSAL is optional (Google-only users won't break)
//   let instance;
//   try {
//     const msal = useMsal();
//     instance = msal?.instance;
//   } catch (err) {
//     console.warn("MSAL not initialized (Google login only):", err.message);
//     instance = null;
//   }

//   /* ================= STATE ================= */
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [activeTab, setActiveTab] = useState("profile");
//   const [resumeUpdates, setResumeUpdates] = useState([]);
//   const [resumeLoading, setResumeLoading] = useState(false);

//   /* ================= DOWNLOAD HANDLER ================= */
//   const handleDownload = async (resumeId) => {
//     try {
//       const res = await resumesAPI.download(resumeId);

//       // Create blob URL and trigger download
//       const url = window.URL.createObjectURL(new Blob([res.data]));
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", `resume-${resumeId}.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
      
//       window.URL.revokeObjectURL(url); // Clean up
//       toast.success("Resume downloaded successfully!");
//     } catch (err) {
//       console.error("Download failed:", err);
//       toast.error("Failed to download resume");
//     }
//   };

//   /* ================= FETCH RESUME UPDATES ================= */
//   useEffect(() => {
//     if (activeTab !== "resumes") return;

//     const fetchResumeUpdates = async () => {
//       try {
//         setResumeLoading(true);
//         const res = await resumesAPI.getAllUpdates();  // ✅ Use resumesAPI
//         setResumeUpdates(res.data);
//       } catch (err) {
//         console.error("Failed to load resume updates", err);
//         toast.error("Failed to load resume updates");
//       } finally {
//         setResumeLoading(false);
//       }
//     };

//     fetchResumeUpdates();
//   }, [activeTab]);

//   /* ================= FETCH PROFILE ================= */
//   useEffect(() => {
//     let isMounted = true;

//     const fetchProfile = async () => {
//       const token = localStorage.getItem("token");

//       if (!token) {
//         setLoading(false);
//         navigate("/login", { replace: true });
//         return;
//       }

//       try {
//         // ✅ FIXED: Now api is imported
//         const res = await api.get("/auth/me");

//         if (isMounted) {
//           setUser(res.data);
//           setError(null);
//         }
//       } catch (err) {
//         console.error("Profile fetch failed:", err);

//         // ✅ Fallback: decode JWT token
//         try {
//           const decoded = jwtDecode(token);

//           if (isMounted) {
//             setUser(decoded);
//             setError("Using cached profile data");
//           }
//         } catch (decodeErr) {
//           console.error("Token decode failed:", decodeErr);

//           if (isMounted) {
//             setError("Session expired or invalid");
//             setTimeout(() => handleLogout(), 1500);
//           }
//         }
//       } finally {
//         if (isMounted) {
//           setLoading(false);
//         }
//       }
//     };

//     fetchProfile();

//     // Cleanup function
//     return () => {
//       isMounted = false;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* ================= LOGOUT ================= */
//   const handleLogout = async () => {
//     try {
//       // 🔐 Microsoft logout (only if MSAL exists)
//       if (instance) {
//         await instance.logoutPopup({
//           postLogoutRedirectUri: window.location.origin,
//         });
//       }
//     } catch (err) {
//       console.warn("Microsoft logout skipped or failed:", err?.message);
//     } finally {
//       // 🧹 Clear all app storage (works for both Google & Microsoft)
//       localStorage.clear();
//       sessionStorage.clear();

//       // 🔁 Redirect to login
//       navigate("/login", { replace: true });
//     }
//   };

//   // ... [REST OF THE RENDER METHOD AND STYLES REMAIN EXACTLY SAME AS BEFORE]

//   /* ================= LOADING STATE ================= */
//   if (loading) {
//     return (
//       <div style={page}>
//         <style>{css}</style>
//         <div style={styles.centeredCard}>
//           <div style={styles.loadingSpinner}>⏳</div>
//           <h2 style={styles.loadingTitle}>Loading Profile...</h2>
//           <p style={styles.emptyText}>Please wait while we fetch your information.</p>
//         </div>
//       </div>
//     );
//   }

//   /* ================= SESSION EXPIRED / NO USER ================= */
//   if (!user) {
//     return (
//       <div style={page}>
//         <style>{css}</style>
//         <div style={styles.centeredCard}>
//           <div style={styles.emptyIcon}>🔓</div>
//           <h2 style={styles.errorTitle}>Session Expired</h2>
//           <p style={styles.emptyText}>
//             {error || "Please login again to continue."}
//           </p>
//           <button style={styles.buttonDanger} onClick={handleLogout}>
//             🔄 Go to Login
//           </button>
//         </div>
//       </div>
//     );
//   }

//   /* ================= PROFILE VIEW ================= */
//   return (
//     <div style={page}>
//       <style>{css}</style>

//       <div style={styles.container}>
//         <div style={styles.profileCard}>
//           {/* Header Section */}
//           <div style={styles.cardHeader}>
//             <div>
//               <h2 style={styles.title}>👤 My Profile</h2>
//               <p style={styles.subtitle}>Account information & settings</p>
//             </div>
//             <span style={styles.roleBadge}>{user.role || "User"}</span>
//           </div>

//           {/* Warning Banner (if using cached data) */}
//           {error && (
//             <div style={styles.warningBanner}>
//               ⚠️ {error}
//             </div>
//           )}

//           <div style={styles.divider} />

//           {/* Tabs */}
//           <div style={styles.tabs}>
//             <button
//               style={{
//                 ...styles.tabButton,
//                 ...(activeTab === "profile" ? styles.activeTab : {}),
//               }}
//               onClick={() => setActiveTab("profile")}
//             >
//               👤 Profile
//             </button>

//             <button
//               style={{
//                 ...styles.tabButton,
//                 ...(activeTab === "resumes" ? styles.activeTab : {}),
//               }}
//               onClick={() => setActiveTab("resumes")}
//             >
//               📄 Resume Updates
//             </button>
//           </div>

//           {/* Profile Information Tab */}
//           {activeTab === "profile" && (
//             <>
//               <div style={styles.profileInfo}>
//                 <ProfileField 
//                   label="👤 Full Name" 
//                   value={user.name || user.username || "N/A"} 
//                 />
//                 <ProfileField 
//                   label="✉️ Email Address" 
//                   value={user.email || "N/A"} 
//                 />
//                 <ProfileField 
//                   label="🎯 Role" 
//                   value={user.role || "User"} 
//                 />
//               </div>

//               <div style={styles.divider} />

//               {/* Logout Section */}
//               <div style={styles.logoutBox}>
//                 <div>
//                   <strong style={styles.logoutTitle}>⚠️ Logout</strong>
//                   <p style={styles.logoutSubtext}>
//                     This will end your current session.
//                   </p>
//                 </div>
//                 <button 
//                   style={styles.buttonDanger} 
//                   onClick={handleLogout}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.transform = 'translateY(-2px)';
//                     e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.4)';
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.transform = 'translateY(0)';
//                     e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
//                   }}
//                 >
//                   🚪 Logout
//                 </button>
//               </div>
//             </>
//           )}

//           {/* Resume Updates Tab */}
//           {activeTab === "resumes" && (
//             <div style={styles.resumeSection}>
//               {resumeLoading ? (
//                 <div style={styles.centeredMessage}>
//                   <div style={styles.loadingSpinner}>⏳</div>
//                   <p style={styles.emptyText}>Loading resume updates...</p>
//                 </div>
//               ) : resumeUpdates.length === 0 ? (
//                 <div style={styles.centeredMessage}>
//                   <div style={styles.emptyIcon}>📄</div>
//                   <p style={styles.emptyText}>No resume updates found.</p>
//                 </div>
//               ) : (
//                 resumeUpdates.map((item) => (
//                   <div key={item.id} style={styles.resumeCard}>
//                     <div style={styles.resumeDetails}>
//                       <div style={styles.resumeField}>
//                         <strong>👤 Candidate:</strong> {item.candidate_name}
//                       </div>
//                       <div style={styles.resumeField}>
//                         <strong>✍️ Updated By:</strong> {item.updated_by_hr_name}
//                       </div>
//                       <div style={styles.resumeField}>
//                         <strong>🕒 Date:</strong>{" "}
//                         {new Date(item.created_at).toLocaleString()}
//                       </div>
//                     </div>

//                     <button
//                       style={styles.downloadBtn}
//                       onClick={() => handleDownload(item.id)}
//                       onMouseEnter={(e) => {
//                         e.currentTarget.style.background = '#1e3a8a';
//                         e.currentTarget.style.transform = 'translateY(-2px)';
//                       }}
//                       onMouseLeave={(e) => {
//                         e.currentTarget.style.background = 'linear-gradient(135deg, #1E40AF, #1e3a8a)';
//                         e.currentTarget.style.transform = 'translateY(0)';
//                       }}
//                     >
//                       ⬇️ Download
//                     </button>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ... [ProfileField component and styles remain exactly the same - no changes needed]


// /* ================= PROFILE FIELD COMPONENT ================= */
// const ProfileField = ({ label, value }) => (
//   <div style={styles.field}>
//     <label style={styles.fieldLabel}>{label}</label>
//     <div style={styles.fieldValue}>{value || "—"}</div>
//   </div>
// );

// /* ================= STYLES ================= */
// const styles = {
//   container: {
//     maxWidth: '700px',
//     margin: '0 auto',
//   },
//   profileCard: {
//     background: '#FFFFFF',
//     color: '#0F172A',
//     padding: '28px',
//     borderRadius: '18px',
//     boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
//     animation: 'fadeInUp 0.6s ease-out',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   cardHeader: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: '16px',
//     flexWrap: 'wrap',
//     gap: '16px',
//   },
//   title: {
//     margin: '0 0 8px 0',
//     fontSize: '28px',
//     fontWeight: 'bold',
//     fontFamily: "'Times New Roman', Times, serif",
//     color: '#0F172A',
//   },
//   subtitle: {
//     fontSize: '14px',
//     color: '#64748B',
//     margin: '0',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   roleBadge: {
//     background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
//     color: 'white',
//     padding: '8px 16px',
//     borderRadius: '20px',
//     fontSize: '13px',
//     fontWeight: '600',
//     fontFamily: "'Times New Roman', Times, serif",
//     boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
//   },
//   warningBanner: {
//     background: '#FEF3C7',
//     color: '#92400E',
//     padding: '12px 16px',
//     borderRadius: '10px',
//     marginTop: '16px',
//     fontSize: '14px',
//     fontFamily: "'Times New Roman', Times, serif",
//     border: '1px solid #FCD34D',
//   },
//   divider: {
//     height: '1px',
//     background: '#E2E8F0',
//     margin: '20px 0',
//   },
//   tabs: {
//     display: 'flex',
//     gap: '12px',
//     marginBottom: '20px',
//   },
//   tabButton: {
//     padding: '10px 20px',
//     borderRadius: '20px',
//     border: '1px solid #E2E8F0',
//     background: '#F8FAFC',
//     cursor: 'pointer',
//     fontFamily: "'Times New Roman', Times, serif",
//     fontSize: '14px',
//     fontWeight: '500',
//     transition: 'all 0.3s ease',
//     color: '#64748B',
//   },
//   activeTab: {
//     background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
//     color: '#FFFFFF',
//     border: '1px solid #1E40AF',
//     boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
//   },
//   profileInfo: {
//     display: 'grid',
//     gridTemplateColumns: '1fr',
//     gap: '16px',
//     marginBottom: '16px',
//   },
//   field: {
//     animation: 'fadeInUp 0.5s ease-out',
//   },
//   fieldLabel: {
//     fontSize: '11px',
//     color: '#64748B',
//     marginBottom: '6px',
//     display: 'block',
//     fontWeight: '600',
//     fontFamily: "'Times New Roman', Times, serif",
//     textTransform: 'uppercase',
//     letterSpacing: '0.5px',
//   },
//   fieldValue: {
//     background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)',
//     padding: '12px 16px',
//     borderRadius: '10px',
//     border: '1px solid #E2E8F0',
//     fontSize: '15px',
//     fontWeight: '500',
//     fontFamily: "'Times New Roman', Times, serif",
//     color: '#0F172A',
//   },
//   logoutBox: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '16px',
//     background: '#FEF2F2',
//     borderRadius: '12px',
//     animation: 'fadeInUp 0.6s ease-out 0.1s both',
//     flexWrap: 'wrap',
//     gap: '12px',
//   },
//   logoutTitle: {
//     fontFamily: "'Times New Roman', Times, serif",
//     fontSize: '16px',
//     color: '#0F172A',
//   },
//   logoutSubtext: {
//     fontSize: '13px',
//     color: '#64748B',
//     margin: '4px 0 0 0',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   buttonDanger: {
//     background: 'linear-gradient(135deg, #EF4444, #DC2626)',
//     color: 'white',
//     padding: '10px 20px',
//     borderRadius: '10px',
//     border: 'none',
//     cursor: 'pointer',
//     fontWeight: 'bold',
//     fontFamily: "'Times New Roman', Times, serif",
//     fontSize: '14px',
//     boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
//     transition: 'all 0.3s ease',
//   },
//   resumeSection: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '16px',
//     marginTop: '4px',
//   },
//   resumeCard: {
//     padding: '16px',
//     borderRadius: '12px',
//     border: '1px solid #E2E8F0',
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)',
//     animation: 'fadeInUp 0.5s ease-out',
//     flexWrap: 'wrap',
//     gap: '12px',
//   },
//   resumeDetails: {
//     flex: '1',
//     minWidth: '200px',
//   },
//   resumeField: {
//     fontSize: '14px',
//     color: '#0F172A',
//     fontFamily: "'Times New Roman', Times, serif",
//     marginBottom: '6px',
//   },
//   downloadBtn: {
//     textDecoration: 'none',
//     background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
//     color: '#FFFFFF',
//     padding: '8px 16px',
//     borderRadius: '8px',
//     border: 'none',
//     cursor: 'pointer',
//     fontSize: '13px',
//     fontWeight: '600',
//     fontFamily: "'Times New Roman', Times, serif",
//     transition: 'all 0.3s ease',
//     boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
//     whiteSpace: 'nowrap',
//   },
//   centeredCard: {
//     maxWidth: '500px',
//     margin: 'auto',
//     background: '#FFFFFF',
//     color: '#0F172A',
//     padding: '40px 28px',
//     borderRadius: '18px',
//     boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
//     textAlign: 'center',
//     animation: 'scaleIn 0.5s ease-out',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   centeredMessage: {
//     textAlign: 'center',
//     padding: '40px 20px',
//   },
//   emptyIcon: {
//     fontSize: '64px',
//     marginBottom: '16px',
//   },
//   loadingSpinner: {
//     fontSize: '64px',
//     marginBottom: '16px',
//     animation: 'spin 2s linear infinite',
//   },
//   loadingTitle: {
//     color: '#0F172A',
//     fontSize: '24px',
//     margin: '0 0 12px 0',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   errorTitle: {
//     color: '#DC2626',
//     fontSize: '24px',
//     margin: '0 0 12px 0',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   emptyText: {
//     color: '#64748B',
//     fontSize: '14px',
//     margin: '12px 0 20px 0',
//     fontFamily: "'Times New Roman', Times, serif",
//     lineHeight: '1.6',
//   },
// };

// const page = {
//   minHeight: "100vh",
//   background: "#FFFFFF",
//   padding: "32px",
//   fontFamily: "'Times New Roman', Times, serif",
//   fontSize: "14px",
//   color: "#0F172A",
// };

// const css = `
// @keyframes fadeInUp {
//   from {
//     opacity: 0;
//     transform: translateY(30px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }

// @keyframes scaleIn {
//   from {
//     opacity: 0;
//     transform: scale(0.95);
//   }
//   to {
//     opacity: 1;
//     transform: scale(1);
//   }
// }

// @keyframes spin {
//   from {
//     transform: rotate(0deg);
//   }
//   to {
//     transform: rotate(360deg);
//   }
// }

// /* Responsive Design */
// @media (max-width: 768px) {
//   .logout-box {
//     flex-direction: column;
//     gap: 16px;
//     text-align: center;
//   }
  
//   button {
//     width: 100%;
//   }

//   .card-header {
//     flex-direction: column;
//     align-items: flex-start !important;
//   }

//   .role-badge {
//     align-self: flex-start;
//   }
// }
// `;

// // import React, { useEffect, useState } from "react";
// // import { jwtDecode } from "jwt-decode";
// // import { useNavigate } from "react-router-dom";
// // import { useMsal } from "@azure/msal-react";
// // import api from "../api/client";
// // import "../pages/AnimationsAndStyles.css";

// // export default function Profile() {
// //   const navigate = useNavigate();

// //   // ✅ MSAL is optional (Google-only users won't break)
// //   let instance;
// //   try {
// //     const msal = useMsal();
// //     instance = msal?.instance;
// //   } catch (err) {
// //     console.warn("MSAL not initialized (Google login only):", err.message);
// //     instance = null;
// //   }

// //   /* ================= STATE ================= */
// //   const [user, setUser] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   const [activeTab, setActiveTab] = useState("profile");
// //   const [resumeUpdates, setResumeUpdates] = useState([]);
// //   const [resumeLoading, setResumeLoading] = useState(false);

// //   /* ================= FETCH RESUME UPDATES ================= */
// //   useEffect(() => {
// //     if (activeTab !== "resumes") return;

// //     const fetchResumeUpdates = async () => {
// //       try {
// //         setResumeLoading(true);
// //         const res = await api.get("/resumes/all-updates");
// //         setResumeUpdates(res.data);

// //       } catch (err) {
// //         console.error("Failed to load resume updates", err);
// //       } finally {
// //         setResumeLoading(false);
// //       }
// //     };

// //     fetchResumeUpdates();
// //   }, [activeTab]);

// //   /* ================= FETCH PROFILE ================= */
// //   useEffect(() => {
// //     let isMounted = true;

// //     const fetchProfile = async () => {
// //       const token = localStorage.getItem("token");

// //       if (!token) {
// //         setLoading(false);
// //         navigate("/login", { replace: true });
// //         return;
// //       }

// //       try {
// //         // ✅ Preferred: backend validation
// //         const res = await api.get("/auth/me");

// //         if (isMounted) {
// //           setUser(res.data);
// //           setError(null);
// //         }
// //       } catch (err) {
// //         console.error("Profile fetch failed:", err);

// //         // ✅ Fallback: decode JWT token
// //         try {
// //           const decoded = jwtDecode(token);

// //           if (isMounted) {
// //             setUser(decoded);
// //             setError("Using cached profile data");
// //           }
// //         } catch (decodeErr) {
// //           console.error("Token decode failed:", decodeErr);

// //           if (isMounted) {
// //             setError("Session expired or invalid");
// //             setTimeout(() => handleLogout(), 1500);
// //           }
// //         }
// //       } finally {
// //         if (isMounted) {
// //           setLoading(false);
// //         }
// //       }
// //     };

// //     fetchProfile();

// //     // Cleanup function
// //     return () => {
// //       isMounted = false;
// //     };
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, []);

// //   /* ================= LOGOUT ================= */
// //   const handleLogout = async () => {
// //     try {
// //       // 🔐 Microsoft logout (only if MSAL exists)
// //       if (instance) {
// //         await instance.logoutPopup({
// //           postLogoutRedirectUri: window.location.origin,
// //         });
// //       }
// //     } catch (err) {
// //       console.warn("Microsoft logout skipped or failed:", err?.message);
// //     } finally {
// //       // 🧹 Clear all app storage (works for both Google & Microsoft)
// //       localStorage.clear();
// //       sessionStorage.clear();

// //       // 🔁 Redirect to login
// //       navigate("/login", { replace: true });
// //     }
// //   };

// //   /* ================= LOADING STATE ================= */
// //   if (loading) {
// //     return (
// //       <div style={page}>
// //         <style>{css}</style>
// //         <div style={styles.centeredCard}>
// //           <div style={styles.loadingSpinner}>⏳</div>
// //           <h2 style={styles.loadingTitle}>Loading Profile...</h2>
// //           <p style={styles.emptyText}>Please wait while we fetch your information.</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   /* ================= SESSION EXPIRED / NO USER ================= */
// //   if (!user) {
// //     return (
// //       <div style={page}>
// //         <style>{css}</style>
// //         <div style={styles.centeredCard}>
// //           <div style={styles.emptyIcon}>🔓</div>
// //           <h2 style={styles.errorTitle}>Session Expired</h2>
// //           <p style={styles.emptyText}>
// //             {error || "Please login again to continue."}
// //           </p>
// //           <button style={styles.buttonDanger} onClick={handleLogout}>
// //             🔄 Go to Login
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   /* ================= PROFILE VIEW ================= */
// //   return (
// //     <div style={page}>
// //       <style>{css}</style>

// //       <div style={styles.container}>
// //         <div style={styles.profileCard}>
// //           {/* Header Section */}
// //           <div style={styles.cardHeader}>
// //             <div>
// //               <h2 style={styles.title}>👤 My Profile</h2>
// //               <p style={styles.subtitle}>Account information & settings</p>
// //             </div>
// //             <span style={styles.roleBadge}>{user.role || "User"}</span>
// //           </div>

// //           {/* Warning Banner (if using cached data) */}
// //           {error && (
// //             <div style={styles.warningBanner}>
// //               ⚠️ {error}
// //             </div>
// //           )}

// //           <div style={styles.divider} />

// //           {/* Tabs */}
// //           <div style={styles.tabs}>
// //             <button
// //               style={{
// //                 ...styles.tabButton,
// //                 ...(activeTab === "profile" ? styles.activeTab : {}),
// //               }}
// //               onClick={() => setActiveTab("profile")}
// //             >
// //               👤 Profile
// //             </button>

// //             <button
// //               style={{
// //                 ...styles.tabButton,
// //                 ...(activeTab === "resumes" ? styles.activeTab : {}),
// //               }}
// //               onClick={() => setActiveTab("resumes")}
// //             >
// //               📄 Resume Updates
// //             </button>
// //           </div>

// //           {/* Profile Information Tab */}
// //           {activeTab === "profile" && (
// //             <>
// //               <div style={styles.profileInfo}>
// //                 <ProfileField 
// //                   label="👤 Full Name" 
// //                   value={user.name || user.username || "N/A"} 
// //                 />
// //                 <ProfileField 
// //                   label="✉️ Email Address" 
// //                   value={user.email || "N/A"} 
// //                 />
// //                 <ProfileField 
// //                   label="🎯 Role" 
// //                   value={user.role || "User"} 
// //                 />
// //               </div>

// //               <div style={styles.divider} />

// //               {/* Logout Section */}
// //               <div style={styles.logoutBox}>
// //                 <div>
// //                   <strong style={styles.logoutTitle}>⚠️ Logout</strong>
// //                   <p style={styles.logoutSubtext}>
// //                     This will end your current session.
// //                   </p>
// //                 </div>
// //                 <button 
// //                   style={styles.buttonDanger} 
// //                   onClick={handleLogout}
// //                   onMouseEnter={(e) => {
// //                     e.currentTarget.style.transform = 'translateY(-2px)';
// //                     e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.4)';
// //                   }}
// //                   onMouseLeave={(e) => {
// //                     e.currentTarget.style.transform = 'translateY(0)';
// //                     e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
// //                   }}
// //                 >
// //                   🚪 Logout
// //                 </button>
// //               </div>
// //             </>
// //           )}

// //           {/* Resume Updates Tab */}
// //           {activeTab === "resumes" && (
// //             <div style={styles.resumeSection}>
// //               {resumeLoading ? (
// //                 <div style={styles.centeredMessage}>
// //                   <div style={styles.loadingSpinner}>⏳</div>
// //                   <p style={styles.emptyText}>Loading resume updates...</p>
// //                 </div>
// //               ) : resumeUpdates.length === 0 ? (
// //                 <div style={styles.centeredMessage}>
// //                   <div style={styles.emptyIcon}>📄</div>
// //                   <p style={styles.emptyText}>No resume updates found.</p>
// //                 </div>
// //               ) : (
// //                 resumeUpdates.map((item) => (
// //                   <div key={item.id} style={styles.resumeCard}>
// //                     <div style={styles.resumeDetails}>
// //                       <div style={styles.resumeField}>
// //                         <strong>👤 Candidate:</strong> {item.candidate_name}
// //                       </div>
// //                       <div style={styles.resumeField}>
// //                         <strong>✍️ Updated By:</strong> {item.updated_by_hr_name}
// //                       </div>
// //                       <div style={styles.resumeField}>
// //                         <strong>🕒 Date:</strong>{" "}
// //                         {new Date(item.created_at).toLocaleString()}
// //                       </div>
// //                     </div>

// //                     <a
// //                       href={item.download_url}
// //                       target="_blank"
// //                       rel="noopener noreferrer"
// //                       style={styles.downloadBtn}
// //                       onMouseEnter={(e) => {
// //                         e.currentTarget.style.background = '#1e3a8a';
// //                       }}
// //                       onMouseLeave={(e) => {
// //                         e.currentTarget.style.background = 'linear-gradient(135deg, #1E40AF, #1e3a8a)';
// //                       }}
// //                     >
// //                       ⬇️ Download
// //                     </a>
// //                   </div>
// //                 ))
// //               )}
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // /* ================= PROFILE FIELD COMPONENT ================= */
// // const ProfileField = ({ label, value }) => (
// //   <div style={styles.field}>
// //     <label style={styles.fieldLabel}>{label}</label>
// //     <div style={styles.fieldValue}>{value || "—"}</div>
// //   </div>
// // );

// // /* ================= STYLES ================= */

// // const styles = {
// //   container: {
// //     maxWidth: '700px',
// //     margin: '0 auto',
// //   },
// //   profileCard: {
// //     background: '#FFFFFF',
// //     color: '#0F172A',
// //     padding: '28px',
// //     borderRadius: '18px',
// //     boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
// //     animation: 'fadeInUp 0.6s ease-out',
// //     fontFamily: "'Times New Roman', Times, serif",
// //   },
// //   cardHeader: {
// //     display: 'flex',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     marginBottom: '16px',
// //     flexWrap: 'wrap',
// //     gap: '16px',
// //   },
// //   title: {
// //     margin: '0 0 8px 0',
// //     fontSize: '28px',
// //     fontWeight: 'bold',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     color: '#0F172A',
// //   },
// //   subtitle: {
// //     fontSize: '14px',
// //     color: '#64748B',
// //     margin: '0',
// //     fontFamily: "'Times New Roman', Times, serif",
// //   },
// //   roleBadge: {
// //     background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
// //     color: 'white',
// //     padding: '8px 16px',
// //     borderRadius: '20px',
// //     fontSize: '13px',
// //     fontWeight: '600',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
// //   },
// //   warningBanner: {
// //     background: '#FEF3C7',
// //     color: '#92400E',
// //     padding: '12px 16px',
// //     borderRadius: '10px',
// //     marginTop: '16px',
// //     fontSize: '14px',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     border: '1px solid #FCD34D',
// //   },
// //   divider: {
// //     height: '1px',
// //     background: '#E2E8F0',
// //     margin: '20px 0',
// //   },
// //   tabs: {
// //     display: 'flex',
// //     gap: '12px',
// //     marginBottom: '20px',
// //   },
// //   tabButton: {
// //     padding: '10px 20px',
// //     borderRadius: '20px',
// //     border: '1px solid #E2E8F0',
// //     background: '#F8FAFC',
// //     cursor: 'pointer',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     fontSize: '14px',
// //     fontWeight: '500',
// //     transition: 'all 0.3s ease',
// //     color: '#64748B',
// //   },
// //   activeTab: {
// //     background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
// //     color: '#FFFFFF',
// //     border: '1px solid #1E40AF',
// //     boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
// //   },
// //   profileInfo: {
// //     display: 'grid',
// //     gridTemplateColumns: '1fr',
// //     gap: '16px',
// //     marginBottom: '16px',
// //   },
// //   field: {
// //     animation: 'fadeInUp 0.5s ease-out',
// //   },
// //   fieldLabel: {
// //     fontSize: '11px',
// //     color: '#64748B',
// //     marginBottom: '6px',
// //     display: 'block',
// //     fontWeight: '600',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     textTransform: 'uppercase',
// //     letterSpacing: '0.5px',
// //   },
// //   fieldValue: {
// //     background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)',
// //     padding: '12px 16px',
// //     borderRadius: '10px',
// //     border: '1px solid #E2E8F0',
// //     fontSize: '15px',
// //     fontWeight: '500',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     color: '#0F172A',
// //   },
// //   logoutBox: {
// //     display: 'flex',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     padding: '16px',
// //     background: '#FEF2F2',
// //     borderRadius: '12px',
// //     animation: 'fadeInUp 0.6s ease-out 0.1s both',
// //     flexWrap: 'wrap',
// //     gap: '12px',
// //   },
// //   logoutTitle: {
// //     fontFamily: "'Times New Roman', Times, serif",
// //     fontSize: '16px',
// //     color: '#0F172A',
// //   },
// //   logoutSubtext: {
// //     fontSize: '13px',
// //     color: '#64748B',
// //     margin: '4px 0 0 0',
// //     fontFamily: "'Times New Roman', Times, serif",
// //   },
// //   buttonDanger: {
// //     background: 'linear-gradient(135deg, #EF4444, #DC2626)',
// //     color: 'white',
// //     padding: '10px 20px',
// //     borderRadius: '10px',
// //     border: 'none',
// //     cursor: 'pointer',
// //     fontWeight: 'bold',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     fontSize: '14px',
// //     boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
// //     transition: 'all 0.3s ease',
// //   },
// //   resumeSection: {
// //     display: 'flex',
// //     flexDirection: 'column',
// //     gap: '16px',
// //     marginTop: '4px',
// //   },
// //   resumeCard: {
// //     padding: '16px',
// //     borderRadius: '12px',
// //     border: '1px solid #E2E8F0',
// //     display: 'flex',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)',
// //     animation: 'fadeInUp 0.5s ease-out',
// //     flexWrap: 'wrap',
// //     gap: '12px',
// //   },
// //   resumeDetails: {
// //     flex: '1',
// //     minWidth: '200px',
// //   },
// //   resumeField: {
// //     fontSize: '14px',
// //     color: '#0F172A',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     marginBottom: '6px',
// //   },
// //   downloadBtn: {
// //     textDecoration: 'none',
// //     background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
// //     color: '#FFFFFF',
// //     padding: '8px 16px',
// //     borderRadius: '8px',
// //     fontSize: '13px',
// //     fontWeight: '600',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     transition: 'all 0.3s ease',
// //     boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
// //     whiteSpace: 'nowrap',
// //   },
// //   centeredCard: {
// //     maxWidth: '500px',
// //     margin: 'auto',
// //     background: '#FFFFFF',
// //     color: '#0F172A',
// //     padding: '40px 28px',
// //     borderRadius: '18px',
// //     boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
// //     textAlign: 'center',
// //     animation: 'scaleIn 0.5s ease-out',
// //     fontFamily: "'Times New Roman', Times, serif",
// //   },
// //   centeredMessage: {
// //     textAlign: 'center',
// //     padding: '40px 20px',
// //   },
// //   emptyIcon: {
// //     fontSize: '64px',
// //     marginBottom: '16px',
// //   },
// //   loadingSpinner: {
// //     fontSize: '64px',
// //     marginBottom: '16px',
// //     animation: 'spin 2s linear infinite',
// //   },
// //   loadingTitle: {
// //     color: '#0F172A',
// //     fontSize: '24px',
// //     margin: '0 0 12px 0',
// //     fontFamily: "'Times New Roman', Times, serif",
// //   },
// //   errorTitle: {
// //     color: '#DC2626',
// //     fontSize: '24px',
// //     margin: '0 0 12px 0',
// //     fontFamily: "'Times New Roman', Times, serif",
// //   },
// //   emptyText: {
// //     color: '#64748B',
// //     fontSize: '14px',
// //     margin: '12px 0 20px 0',
// //     fontFamily: "'Times New Roman', Times, serif",
// //     lineHeight: '1.6',
// //   },
// // };

// // const page = {
// //   minHeight: "100vh",
// //   background: "#FFFFFF",
// //   padding: "32px",
// //   fontFamily: "'Times New Roman', Times, serif",
// //   fontSize: "14px",
// //   color: "#0F172A",
// // };

// // const css = `
// // @keyframes fadeInUp {
// //   from {
// //     opacity: 0;
// //     transform: translateY(30px);
// //   }
// //   to {
// //     opacity: 1;
// //     transform: translateY(0);
// //   }
// // }

// // @keyframes scaleIn {
// //   from {
// //     opacity: 0;
// //     transform: scale(0.95);
// //   }
// //   to {
// //     opacity: 1;
// //     transform: scale(1);
// //   }
// // }

// // @keyframes spin {
// //   from {
// //     transform: rotate(0deg);
// //   }
// //   to {
// //     transform: rotate(360deg);
// //   }
// // }

// // /* Responsive Design */
// // @media (max-width: 768px) {
// //   .logout-box {
// //     flex-direction: column;
// //     gap: 16px;
// //     text-align: center;
// //   }
  
// //   button {
// //     width: 100%;
// //   }

// //   .card-header {
// //     flex-direction: column;
// //     align-items: flex-start !important;
// //   }

// //   .role-badge {
// //     align-self: flex-start;
// //   }
// // }
// // `;

// // // import React, { useEffect, useState } from "react";
// // // import { jwtDecode } from "jwt-decode";
// // // import { useNavigate } from "react-router-dom";
// // // import { useMsal } from "@azure/msal-react";
// // // import api from "../api/client";
// // // import "../pages/AnimationsAndStyles.css";

// // // export default function Profile() {
// // //   const navigate = useNavigate();

// // //   // ✅ MSAL is optional (Google-only users won't break)
// // //   let instance;
// // //   try {
// // //     const msal = useMsal();
// // //     instance = msal?.instance;
// // //   } catch (err) {
// // //     console.warn("MSAL not initialized (Google login only):", err.message);
// // //     instance = null;
// // //   }

// // //   /* ================= STATE ================= */
// // //   const [user, setUser] = useState(null);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState(null);

// // //   const [activeTab, setActiveTab] = useState("profile");
// // //   const [resumeUpdates, setResumeUpdates] = useState([]);
// // //   const [resumeLoading, setResumeLoading] = useState(false);

// // // useEffect(() => {
// // //   if (activeTab !== "resumes") return;

// // //   const fetchResumeUpdates = async () => {
// // //     try {
// // //       setResumeLoading(true);
// // //       const res = await api.get("/resumes/all-updates");
// // //       setResumeUpdates(res.data);
// // //     } catch (err) {
// // //       console.error("Failed to load resume updates", err);
// // //     } finally {
// // //       setResumeLoading(false);
// // //     }
// // //   };

// // //   fetchResumeUpdates();
// // // }, [activeTab]);

// // //   /* ================= FETCH PROFILE ================= */
// // //   useEffect(() => {
// // //     let isMounted = true;

// // //     const fetchProfile = async () => {
// // //       const token = localStorage.getItem("token");

// // //       if (!token) {
// // //         setLoading(false);
// // //         navigate("/login", { replace: true });
// // //         return;
// // //       }

// // //       try {
// // //         // ✅ Preferred: backend validation
// // //         const res = await api.get("/auth/me");

// // //         if (isMounted) {
// // //           setUser(res.data);
// // //           setError(null);
// // //         }
// // //       } catch (err) {
// // //         console.error("Profile fetch failed:", err);

// // //         // ✅ Fallback: decode JWT token
// // //         try {
// // //           const decoded = jwtDecode(token);

// // //           if (isMounted) {
// // //             setUser(decoded);
// // //             setError("Using cached profile data");
// // //           }
// // //         } catch (decodeErr) {
// // //           console.error("Token decode failed:", decodeErr);

// // //           if (isMounted) {
// // //             setError("Session expired or invalid");
// // //             setTimeout(() => handleLogout(), 1500);
// // //           }
// // //         }
// // //       } finally {
// // //         if (isMounted) {
// // //           setLoading(false);
// // //         }
// // //       }
// // //     };

// // //     fetchProfile();

// // //     // Cleanup function
// // //     return () => {
// // //       isMounted = false;
// // //     };
// // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, []);

// // //   /* ================= LOGOUT ================= */
// // //   const handleLogout = async () => {
// // //     try {
// // //       // 🔐 Microsoft logout (only if MSAL exists)
// // //       if (instance) {
// // //         await instance.logoutPopup({
// // //           postLogoutRedirectUri: window.location.origin,
// // //         });
// // //       }
// // //     } catch (err) {
// // //       console.warn("Microsoft logout skipped or failed:", err?.message);
// // //     } finally {
// // //       // 🧹 Clear all app storage (works for both Google & Microsoft)
// // //       localStorage.clear();
// // //       sessionStorage.clear();

// // //       // 🔁 Redirect to login
// // //       navigate("/login", { replace: true });
// // //     }
// // //   };

// // //   /* ================= LOADING STATE ================= */
// // //   if (loading) {
// // //     return (
// // //       <div style={page}>
// // //         <style>{css}</style>
// // //         <div style={styles.centeredCard}>
// // //           <div style={styles.loadingSpinner}>⏳</div>
// // //           <h2 style={styles.loadingTitle}>Loading Profile...</h2>
// // //           <p style={styles.emptyText}>Please wait while we fetch your information.</p>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   /* ================= SESSION EXPIRED / NO USER ================= */
// // //   if (!user) {
// // //     return (
// // //       <div style={page}>
// // //         <style>{css}</style>
// // //         <div style={styles.centeredCard}>
// // //           <div style={styles.emptyIcon}>🔓</div>
// // //           <h2 style={styles.errorTitle}>Session Expired</h2>
// // //           <p style={styles.emptyText}>
// // //             {error || "Please login again to continue."}
// // //           </p>
// // //           <button style={styles.buttonDanger} onClick={handleLogout}>
// // //             🔄 Go to Login
// // //           </button>
// // //         </div>
// // //       </div>
// // //     );
// // //   }

// // //   /* ================= PROFILE VIEW ================= */
// // //   return (
// // //     <div style={page}>
// // //       <style>{css}</style>

// // //       <div style={styles.container}>
// // //         <div style={styles.profileCard}>
// // //                     {/* Tabs */}
// // //             <div style={styles.tabs}>
// // //               <button
// // //                 style={{
// // //                   ...styles.tabButton,
// // //                   ...(activeTab === "profile" ? styles.activeTab : {}),
// // //                 }}
// // //                 onClick={() => setActiveTab("profile")}
// // //               >
// // //                 👤 Profile
// // //               </button>

// // //               <button
// // //                 style={{
// // //                   ...styles.tabButton,
// // //                   ...(activeTab === "resumes" ? styles.activeTab : {}),
// // //                 }}
// // //                 onClick={() => setActiveTab("resumes")}
// // //               >
// // //                 📄 Resume Updates
// // //               </button>
// // //             </div>

// // //           {/* Header Section */}
// // //           <div style={styles.cardHeader}>
// // //             <div>
// // //               <h2 style={styles.title}>👤 My Profile</h2>
// // //               <p style={styles.subtitle}>Account information & settings</p>
// // //             </div>
// // //             <span style={styles.roleBadge}>{user.role || "User"}</span>
// // //           </div>

// // //           {/* Warning Banner (if using cached data) */}
// // //           {error && (
// // //             <div style={styles.warningBanner}>
// // //               ⚠️ {error}
// // //             </div>
// // //           )}

// // //           <div style={styles.divider} />

// // //           {/* Profile Information */}
// // //           <div style={styles.profileInfo}>
// // //             <ProfileField 
// // //               label="👤 Full Name" 
// // //               value={user.name || user.username || "N/A"} 
// // //             />
// // //             <ProfileField 
// // //               label="✉️ Email Address" 
// // //               value={user.email || "N/A"} 
// // //             />
// // //             <ProfileField 
// // //               label="🎯 Role" 
// // //               value={user.role || "User"} 
// // //             />
// // //             {/* {(user.id || user._id) && (
// // //               <ProfileField 
// // //                 label="🆔 User ID" 
// // //                 value={user.id || user._id} 
// // //               />
// // //             )} */}
// // //           </div>

// // //           <div style={styles.divider} />

// // //           {/* Logout Section */}
// // //           {/* <div style={styles.logoutBox}>
// // //             <div>
// // //               <strong style={styles.logoutTitle}>⚠️ Logout</strong>
// // //               <p style={styles.logoutSubtext}>
// // //                 This will end your current session.
// // //               </p>
// // //             </div>
// // //             <button 
// // //               style={styles.buttonDanger} 
// // //               onClick={handleLogout}
// // //               onMouseEnter={(e) => {
// // //                 e.currentTarget.style.transform = 'translateY(-2px)';
// // //                 e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.4)';
// // //               }}
// // //               onMouseLeave={(e) => {
// // //                 e.currentTarget.style.transform = 'translateY(0)';
// // //                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
// // //               }}
// // //             >
// // //               🚪 Logout
// // //             </button>
// // //           </div> */}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // /* ================= PROFILE FIELD COMPONENT ================= */
// // // const ProfileField = ({ label, value }) => (
// // //   <div style={styles.field}>
// // //     <label style={styles.fieldLabel}>{label}</label>
// // //     <div style={styles.fieldValue}>{value || "—"}</div>
// // //   </div>
// // // );

// // // /* ================= STYLES ================= */

// // // const styles = {
// // //   container: {
// // //     maxWidth: '700px',
// // //     margin: '0 auto',
// // //   },
// // //   profileCard: {
// // //     background: '#FFFFFF',
// // //     color: '#0F172A',
// // //     padding: '28px',
// // //     borderRadius: '18px',
// // //     boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
// // //     animation: 'fadeInUp 0.6s ease-out',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //   },
// // //   cardHeader: {
// // //     display: 'flex',
// // //     justifyContent: 'space-between',
// // //     alignItems: 'center',
// // //     marginBottom: '16px',
// // //     flexWrap: 'wrap',
// // //     gap: '16px',
// // //   },
// // //   title: {
// // //     margin: '0 0 8px 0',
// // //     fontSize: '28px',
// // //     fontWeight: 'bold',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //     color: '#0F172A',
// // //   },
// // //   subtitle: {
// // //     fontSize: '14px',
// // //     color: '#64748B',
// // //     margin: '0',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //   },
// // //   roleBadge: {
// // //     background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
// // //     color: 'white',
// // //     padding: '8px 16px',
// // //     borderRadius: '20px',
// // //     fontSize: '13px',
// // //     fontWeight: '600',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //     boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
// // //   },
// // //   warningBanner: {
// // //     background: '#FEF3C7',
// // //     color: '#92400E',
// // //     padding: '12px 16px',
// // //     borderRadius: '10px',
// // //     marginTop: '16px',
// // //     fontSize: '14px',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //     border: '1px solid #FCD34D',
// // //   },
// // //   divider: {
// // //     height: '1px',
// // //     background: '#E2E8F0',
// // //     margin: '20px 0',
// // //   },
// // //   profileInfo: {
// // //     display: 'grid',
// // //     gridTemplateColumns: '1fr',
// // //     gap: '16px',
// // //     marginBottom: '16px',
// // //   },
// // //   field: {
// // //     animation: 'fadeInUp 0.5s ease-out',
// // //   },
// // //   fieldLabel: {
// // //     fontSize: '11px',
// // //     color: '#64748B',
// // //     marginBottom: '6px',
// // //     display: 'block',
// // //     fontWeight: '600',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //     textTransform: 'uppercase',
// // //     letterSpacing: '0.5px',
// // //   },
// // //   fieldValue: {
// // //     background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)',
// // //     padding: '12px 16px',
// // //     borderRadius: '10px',
// // //     border: '1px solid #E2E8F0',
// // //     fontSize: '15px',
// // //     fontWeight: '500',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //     color: '#0F172A',
// // //   },
// // //   logoutBox: {
// // //     display: 'flex',
// // //     justifyContent: 'space-between',
// // //     alignItems: 'center',
// // //     padding: '16px',
// // //     background: '#FEF2F2',
// // //     borderRadius: '12px',
// // //     animation: 'fadeInUp 0.6s ease-out 0.1s both',
// // //     flexWrap: 'wrap',
// // //     gap: '12px',
// // //   },
// // //   logoutTitle: {
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //     fontSize: '16px',
// // //     color: '#0F172A',
// // //   },
// // //   logoutSubtext: {
// // //     fontSize: '13px',
// // //     color: '#64748B',
// // //     margin: '4px 0 0 0',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //   },
// // //   buttonDanger: {
// // //     background: 'linear-gradient(135deg, #EF4444, #DC2626)',
// // //     color: 'white',
// // //     padding: '10px 20px',
// // //     borderRadius: '10px',
// // //     border: 'none',
// // //     cursor: 'pointer',
// // //     fontWeight: 'bold',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //     fontSize: '14px',
// // //     boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
// // //     transition: 'all 0.3s ease',
// // //   },
// // //   centeredCard: {
// // //     maxWidth: '500px',
// // //     margin: 'auto',
// // //     background: '#FFFFFF',
// // //     color: '#0F172A',
// // //     padding: '40px 28px',
// // //     borderRadius: '18px',
// // //     boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
// // //     textAlign: 'center',
// // //     animation: 'scaleIn 0.5s ease-out',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //   },
// // //   emptyIcon: {
// // //     fontSize: '64px',
// // //     marginBottom: '16px',
// // //   },
// // //   loadingSpinner: {
// // //     fontSize: '64px',
// // //     marginBottom: '16px',
// // //     animation: 'spin 2s linear infinite',
// // //   },
// // //   loadingTitle: {
// // //     color: '#0F172A',
// // //     fontSize: '24px',
// // //     margin: '0 0 12px 0',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //   },
// // //   errorTitle: {
// // //     color: '#DC2626',
// // //     fontSize: '24px',
// // //     margin: '0 0 12px 0',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //   },
// // //   emptyText: {
// // //     color: '#64748B',
// // //     fontSize: '14px',
// // //     margin: '12px 0 20px 0',
// // //     fontFamily: "'Times New Roman', Times, serif",
// // //     lineHeight: '1.6',
// // //   },
// // // };

// // // const page = {
// // //   minHeight: "100vh",
// // //   background: "#FFFFFF",
// // //   padding: "32px",
// // //   fontFamily: "'Times New Roman', Times, serif",
// // //   fontSize: "14px",
// // //   color: "#0F172A",
// // // };

// // // const css = `
// // // @keyframes fadeInUp {
// // //   from {
// // //     opacity: 0;
// // //     transform: translateY(30px);
// // //   }
// // //   to {
// // //     opacity: 1;
// // //     transform: translateY(0);
// // //   }
// // // }

// // // @keyframes scaleIn {
// // //   from {
// // //     opacity: 0;
// // //     transform: scale(0.95);
// // //   }
// // //   to {
// // //     opacity: 1;
// // //     transform: scale(1);
// // //   }
// // // }

// // // @keyframes spin {
// // //   from {
// // //     transform: rotate(0deg);
// // //   }
// // //   to {
// // //     transform: rotate(360deg);
// // //   }
// // // }

// // // /* Additional Global Styles */
// // // .card {
// // //   max-width: 640px;
// // //   margin: auto;
// // //   background: #FFFFFF;
// // //   color: #0F172A;
// // //   padding: 28px;
// // //   border-radius: 18px;
// // //   box-shadow: 0 15px 35px rgba(0,0,0,0.25);
// // //   font-family: 'Times New Roman', Times, serif;
// // // }

// // // .center {
// // //   text-align: center;
// // // }

// // // .header {
// // //   display: flex;
// // //   justify-content: space-between;
// // //   align-items: center;
// // // }

// // // .subtitle {
// // //   font-size: 14px;
// // //   color: #64748B;
// // //   margin-top: 4px;
// // //   font-family: 'Times New Roman', Times, serif;
// // // }

// // // .role-badge {
// // //   background: #1E40AF;
// // //   color: white;
// // //   padding: 6px 14px;
// // //   border-radius: 16px;
// // //   font-size: 13px;
// // //   font-weight: bold;
// // //   font-family: 'Times New Roman', Times, serif;
// // // }

// // // .divider {
// // //   height: 1px;
// // //   background: #E5E7EB;
// // //   margin: 20px 0;
// // // }

// // // .profile-grid {
// // //   display: grid;
// // //   grid-template-columns: 1fr;
// // //   gap: 16px;
// // // }

// // // .profile-field label {
// // //   font-size: 11px;
// // //   color: #64748B;
// // //   margin-bottom: 4px;
// // //   display: block;
// // //   font-weight: 600;
// // //   font-family: 'Times New Roman', Times, serif;
// // // }

// // // .profile-field .value {
// // //   background: #F8FAFC;
// // //   padding: 12px 14px;
// // //   border-radius: 10px;
// // //   border: 1px solid #E5E7EB;
// // //   font-size: 14px;
// // //   font-weight: 500;
// // //   font-family: 'Times New Roman', Times, serif;
// // // }

// // // .logout-box {
// // //   display: flex;
// // //   justify-content: space-between;
// // //   align-items: center;
// // // }

// // // .muted {
// // //   font-size: 13px;
// // //   color: #64748B;
// // //   font-family: 'Times New Roman', Times, serif;
// // // }

// // // .btn {
// // //   padding: 10px 18px;
// // //   border-radius: 10px;
// // //   border: none;
// // //   cursor: pointer;
// // //   font-weight: bold;
// // //   font-family: 'Times New Roman', Times, serif;
// // //   font-size: 14px;
// // //   transition: all 0.3s ease;
// // // }

// // // .btn.danger {
// // //   background: #DC2626;
// // //   color: white;
// // // }

// // // button:hover {
// // //   transform: translateY(-2px);
// // //   box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
// // // }

// // // /* Responsive Design */
// // // @media (max-width: 768px) {
// // //   .logout-box {
// // //     flex-direction: column;
// // //     gap: 16px;
// // //     text-align: center;
// // //   }
  
// // //   button {
// // //     width: 100%;
// // //   }

// // //   .card-header {
// // //     flex-direction: column;
// // //     align-items: flex-start !important;
// // //   }

// // //   .role-badge {
// // //     align-self: flex-start;
// // //   }
// // // }
// // // `;

// // // // import React, { useEffect, useState } from "react";
// // // // import { jwtDecode } from "jwt-decode";
// // // // import { useNavigate } from "react-router-dom";
// // // // import { useMsal } from "@azure/msal-react"; // ✅ FIXED IMPORT
// // // // import api from "../api/client";
// // // // import "../pages/AnimationsAndStyles.css";

// // // // export default function Profile() {
// // // //   const navigate = useNavigate();
// // // //   const { instance } = useMsal(); // ✅ MSAL instance

// // // //   // ================= STATE =================
// // // //   const [user, setUser] = useState(null);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [error, setError] = useState(null);

  
// // // //   /* ================= FETCH PROFILE ================= */
// // // //   useEffect(() => {
// // // //     let isMounted = true;

// // // //     const fetchProfile = async () => {
// // // //       const token = localStorage.getItem("token");

// // // //       if (!token) {
// // // //         setLoading(false);
// // // //         return;
// // // //       }

// // // //       try {
// // // //         // Preferred: backend validation
// // // //         const res = await api.get("/auth/me");

// // // //         if (isMounted) {
// // // //           setUser(res.data);
// // // //           setError(null);
// // // //         }
// // // //       } catch (err) {
// // // //         console.error("Profile fetch failed:", err);

// // // //         // Fallback: decode token
// // // //         try {
// // // //           const decoded = jwtDecode(token);

// // // //           if (isMounted) {
// // // //             setUser(decoded);
// // // //             setError("Using cached profile data");
// // // //           }
// // // //         } catch (decodeErr) {
// // // //           console.error("Token decode failed:", decodeErr);

// // // //           if (isMounted) {
// // // //             setError("Session expired or invalid");
// // // //             setTimeout(() => handleLogout(), 1500);
// // // //           }
// // // //         }
// // // //       } finally {
// // // //         if (isMounted) setLoading(false);
// // // //       }
// // // //     };

// // // //     fetchProfile();

// // // //     return () => {
// // // //       isMounted = false;
// // // //     };
// // // //   }, []);

// // // //   /* ================= LOGOUT ================= */
// // // //   const handleLogout = async () => {
// // // //     try {
// // // //       // 🔐 Microsoft logout (clears MSAL + Microsoft cache)
// // // //       await instance.logoutPopup({
// // // //         postLogoutRedirectUri: window.location.origin,
// // // //       });

// // // //       // 🧹 Clear app storage
// // // //       localStorage.clear();
// // // //       sessionStorage.clear();

// // // //       // 🔁 Redirect
// // // //       navigate("/login", { replace: true });
// // // //     } catch (err) {
// // // //       console.error("Logout failed:", err);
// // // //     }
// // // //   };

// // // //   /* ================= LOADING ================= */
// // // //   if (loading) {
// // // //     return (
// // // //       <div style={page}>
// // // //         <style>{css}</style>
// // // //         <div style={styles.centeredCard}>
// // // //           <div style={styles.loadingSpinner}>⏳</div>
// // // //           <h2 style={styles.loadingTitle}>Loading Profile...</h2>
// // // //           <p style={styles.emptyText}>Please wait while we fetch your information.</p>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   /* ================= NO USER ================= */
// // // //   if (!user) {
// // // //     return (
// // // //       <div style={page}>
// // // //         <style>{css}</style>
// // // //         <div style={styles.centeredCard}>
// // // //           <div style={styles.emptyIcon}>🔓</div>
// // // //           <h2 style={styles.errorTitle}>Session Expired</h2>
// // // //           <p style={styles.emptyText}>{error || "Please login again."}</p>
// // // //           <button style={styles.buttonDanger} onClick={handleLogout}>
// // // //             🔄 Go to Login
// // // //           </button>
// // // //         </div>
// // // //       </div>
// // // //     );
// // // //   }

// // // //   /* ================= PROFILE VIEW ================= */
// // // //   return (
// // // //     <div style={page}>
// // // //       <style>{css}</style>

// // // //       <div style={styles.container}>
// // // //         <div style={styles.profileCard}>
// // // //           <div style={styles.cardHeader}>
// // // //             <div>
// // // //               <h2 style={styles.title}>👤 My Profile</h2>
// // // //               <p style={styles.subtitle}>Account information & settings</p>
// // // //             </div>
// // // //             <span style={styles.roleBadge}>{user.role || "User"}</span>
// // // //           </div>

// // // //           {error && <div style={styles.warningBanner}>⚠️ {error}</div>}

// // // //           <div style={styles.divider} />

// // // //           <div style={styles.profileInfo}>
// // // //             <ProfileField label="👤 Full Name" value={user.name || "N/A"} />
// // // //             <ProfileField label="✉️ Email" value={user.email || "N/A"} />
// // // //             <ProfileField label="🎯 Role" value={user.role || "User"} />
// // // //           </div>

// // // //           <div style={styles.divider} />

// // // //           <div style={styles.logoutBox}>
// // // //             <div>
// // // //               <strong style={styles.logoutTitle}>⚠️ Logout</strong>
// // // //               <p style={styles.logoutSubtext}>This will end your session.</p>
// // // //             </div>
// // // //             <button style={styles.buttonDanger} onClick={handleLogout}>
// // // //               🚪 Logout
// // // //             </button>
// // // //           </div>
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // // /* ================= PROFILE FIELD ================= */
// // // // const ProfileField = ({ label, value }) => (
// // // //   <div style={styles.field}>
// // // //     <label style={styles.fieldLabel}>{label}</label>
// // // //     <div style={styles.fieldValue}>{value || "-"}</div>
// // // //   </div>
// // // // );

// // // // /* ================= STYLES ================= */

// // // // const styles = {
// // // //   container: {
// // // //     maxWidth: '700px',
// // // //     margin: '0 auto',
// // // //   },
// // // //   profileCard: {
// // // //     background: '#FFFFFF',
// // // //     color: '#0F172A',
// // // //     padding: '28px',
// // // //     borderRadius: '18px',
// // // //     boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
// // // //     animation: 'fadeInUp 0.6s ease-out',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //   },
// // // //   cardHeader: {
// // // //     display: 'flex',
// // // //     justifyContent: 'space-between',
// // // //     alignItems: 'center',
// // // //     marginBottom: '16px',
// // // //   },
// // // //   title: {
// // // //     margin: '0 0 8px 0',
// // // //     fontSize: '28px',
// // // //     fontWeight: 'bold',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //     color: '#0F172A',
// // // //   },
// // // //   subtitle: {
// // // //     fontSize: '14px',
// // // //     color: '#64748B',
// // // //     margin: '0',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //   },
// // // //   roleBadge: {
// // // //     background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
// // // //     color: 'white',
// // // //     padding: '8px 16px',
// // // //     borderRadius: '20px',
// // // //     fontSize: '13px',
// // // //     fontWeight: '600',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //     boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
// // // //   },
// // // //   warningBanner: {
// // // //     background: '#FEF3C7',
// // // //     color: '#92400E',
// // // //     padding: '12px 16px',
// // // //     borderRadius: '10px',
// // // //     marginTop: '16px',
// // // //     fontSize: '14px',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //     border: '1px solid #FCD34D',
// // // //   },
// // // //   divider: {
// // // //     height: '1px',
// // // //     background: '#E2E8F0',
// // // //     margin: '20px 0',
// // // //   },
// // // //   profileInfo: {
// // // //     display: 'grid',
// // // //     gridTemplateColumns: '1fr',
// // // //     gap: '16px',
// // // //     marginBottom: '16px',
// // // //   },
// // // //   field: {
// // // //     animation: 'fadeInUp 0.5s ease-out',
// // // //   },
// // // //   fieldLabel: {
// // // //     fontSize: '11px',
// // // //     color: '#64748B',
// // // //     marginBottom: '6px',
// // // //     display: 'block',
// // // //     fontWeight: '600',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //     textTransform: 'uppercase',
// // // //     letterSpacing: '0.5px',
// // // //   },
// // // //   fieldValue: {
// // // //     background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)',
// // // //     padding: '12px 16px',
// // // //     borderRadius: '10px',
// // // //     border: '1px solid #E2E8F0',
// // // //     fontSize: '15px',
// // // //     fontWeight: '500',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //     color: '#0F172A',
// // // //   },
// // // //   logoutBox: {
// // // //     display: 'flex',
// // // //     justifyContent: 'space-between',
// // // //     alignItems: 'center',
// // // //     padding: '16px',
// // // //     background: '#FEF2F2',
// // // //     borderRadius: '12px',
// // // //     animation: 'fadeInUp 0.6s ease-out 0.1s both',
// // // //   },
// // // //   logoutTitle: {
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //     fontSize: '16px',
// // // //     color: '#0F172A',
// // // //   },
// // // //   logoutSubtext: {
// // // //     fontSize: '13px',
// // // //     color: '#64748B',
// // // //     margin: '4px 0 0 0',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //   },
// // // //   buttonDanger: {
// // // //     background: 'linear-gradient(135deg, #EF4444, #DC2626)',
// // // //     color: 'white',
// // // //     padding: '10px 20px',
// // // //     borderRadius: '10px',
// // // //     border: 'none',
// // // //     cursor: 'pointer',
// // // //     fontWeight: 'bold',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //     fontSize: '14px',
// // // //     boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
// // // //     transition: 'all 0.3s ease',
// // // //   },
// // // //   centeredCard: {
// // // //     maxWidth: '500px',
// // // //     margin: 'auto',
// // // //     background: '#FFFFFF',
// // // //     color: '#0F172A',
// // // //     padding: '40px 28px',
// // // //     borderRadius: '18px',
// // // //     boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
// // // //     textAlign: 'center',
// // // //     animation: 'scaleIn 0.5s ease-out',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //   },
// // // //   emptyIcon: {
// // // //     fontSize: '64px',
// // // //     marginBottom: '16px',
// // // //   },
// // // //   loadingSpinner: {
// // // //     fontSize: '64px',
// // // //     marginBottom: '16px',
// // // //     animation: 'spin 2s linear infinite',
// // // //   },
// // // //   loadingTitle: {
// // // //     color: '#0F172A',
// // // //     fontSize: '24px',
// // // //     margin: '0 0 12px 0',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //   },
// // // //   errorTitle: {
// // // //     color: '#DC2626',
// // // //     fontSize: '24px',
// // // //     margin: '0 0 12px 0',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //   },
// // // //   emptyText: {
// // // //     color: '#64748B',
// // // //     fontSize: '14px',
// // // //     margin: '12px 0 20px 0',
// // // //     fontFamily: "'Times New Roman', Times, serif",
// // // //   },
// // // // };

// // // // const page = {
// // // //   minHeight: "100vh",
// // // //   background: "#FFFFFF",
// // // //   padding: "32px",
// // // //   fontFamily: "'Times New Roman', Times, serif",
// // // //   fontSize: "14px",
// // // //   color: "#0F172A",
// // // // };

// // // // const css = `
// // // // @keyframes fadeInUp {
// // // //   from {
// // // //     opacity: 0;
// // // //     transform: translateY(30px);
// // // //   }
// // // //   to {
// // // //     opacity: 1;
// // // //     transform: translateY(0);
// // // //   }
// // // // }

// // // // @keyframes scaleIn {
// // // //   from {
// // // //     opacity: 0;
// // // //     transform: scale(0.95);
// // // //   }
// // // //   to {
// // // //     opacity: 1;
// // // //     transform: scale(1);
// // // //   }
// // // // }

// // // // @keyframes spin {
// // // //   from {
// // // //     transform: rotate(0deg);
// // // //   }
// // // //   to {
// // // //     transform: rotate(360deg);
// // // //   }
// // // // }

// // // // .card {
// // // //   max-width: 640px;
// // // //   margin: auto;
// // // //   background: #FFFFFF;
// // // //   color: #0F172A;
// // // //   padding: 28px;
// // // //   border-radius: 18px;
// // // //   box-shadow: 0 15px 35px rgba(0,0,0,0.25);
// // // //   font-family: 'Times New Roman', Times, serif;
// // // // }

// // // // .center {
// // // //   text-align: center;
// // // // }

// // // // .header {
// // // //   display: flex;
// // // //   justify-content: space-between;
// // // //   align-items: center;
// // // // }

// // // // .subtitle {
// // // //   font-size: 14px;
// // // //   color: #64748B;
// // // //   margin-top: 4px;
// // // //   font-family: 'Times New Roman', Times, serif;
// // // // }

// // // // .role-badge {
// // // //   background: #1E40AF;
// // // //   color: white;
// // // //   padding: 6px 14px;
// // // //   border-radius: 16px;
// // // //   font-size: 13px;
// // // //   font-weight: bold;
// // // //   font-family: 'Times New Roman', Times, serif;
// // // // }

// // // // .divider {
// // // //   height: 1px;
// // // //   background: #E5E7EB;
// // // //   margin: 20px 0;
// // // // }

// // // // .profile-grid {
// // // //   display: grid;
// // // //   grid-template-columns: 1fr;
// // // //   gap: 16px;
// // // // }

// // // // .profile-field label {
// // // //   font-size: 11px;
// // // //   color: #64748B;
// // // //   margin-bottom: 4px;
// // // //   display: block;
// // // //   font-weight: 600;
// // // //   font-family: 'Times New Roman', Times, serif;
// // // // }

// // // // .profile-field .value {
// // // //   background: #F8FAFC;
// // // //   padding: 12px 14px;
// // // //   border-radius: 10px;
// // // //   border: 1px solid #E5E7EB;
// // // //   font-size: 14px;
// // // //   font-weight: 500;
// // // //   font-family: 'Times New Roman', Times, serif;
// // // // }

// // // // .logout-box {
// // // //   display: flex;
// // // //   justify-content: space-between;
// // // //   align-items: center;
// // // // }

// // // // .muted {
// // // //   font-size: 13px;
// // // //   color: #64748B;
// // // //   font-family: 'Times New Roman', Times, serif;
// // // // }

// // // // .btn {
// // // //   padding: 10px 18px;
// // // //   border-radius: 10px;
// // // //   border: none;
// // // //   cursor: pointer;
// // // //   font-weight: bold;
// // // //   font-family: 'Times New Roman', Times, serif;
// // // //   font-size: 14px;
// // // // }

// // // // .btn.danger {
// // // //   background: #DC2626;
// // // //   color: white;
// // // // }

// // // // button:hover {
// // // //   transform: translateY(-2px);
// // // //   box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
// // // // }

// // // // /* Responsive Design */
// // // // @media (max-width: 768px) {
// // // //   .logout-box {
// // // //     flex-direction: column;
// // // //     gap: 16px;
// // // //     text-align: center;
// // // //   }
  
// // // //   button {
// // // //     width: 100%;
// // // //   }
// // // // }
// // // // `;
