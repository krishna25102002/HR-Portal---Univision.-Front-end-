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
                      <option value="interview">🟣 Interview</option>
                      <option value="invitation_sent">🔵 Invitation Sent</option>
                      <option value="hold">🟡 Hold</option>
                      <option value="offered">🟢 Offered</option>
                      <option value="accepted">✅ Accepted</option>
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
