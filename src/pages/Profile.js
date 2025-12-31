import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import api from "../api/client";
import "../pages/AnimationsAndStyles.css";

export default function Profile() {
  const navigate = useNavigate();

  // ✅ MSAL is optional (Google-only users won't break)
  let instance;
  try {
    const msal = useMsal();
    instance = msal?.instance;
  } catch (err) {
    console.warn("MSAL not initialized (Google login only):", err.message);
    instance = null;
  }

  /* ================= STATE ================= */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= FETCH PROFILE ================= */
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
        // ✅ Preferred: backend validation
        const res = await api.get("/auth/me");

        if (isMounted) {
          setUser(res.data);
          setError(null);
        }
      } catch (err) {
        console.error("Profile fetch failed:", err);

        // ✅ Fallback: decode JWT token
        try {
          const decoded = jwtDecode(token);

          if (isMounted) {
            setUser(decoded);
            setError("Using cached profile data");
          }
        } catch (decodeErr) {
          console.error("Token decode failed:", decodeErr);

          if (isMounted) {
            setError("Session expired or invalid");
            setTimeout(() => handleLogout(), 1500);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    // Cleanup function
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    try {
      // 🔐 Microsoft logout (only if MSAL exists)
      if (instance) {
        await instance.logoutPopup({
          postLogoutRedirectUri: window.location.origin,
        });
      }
    } catch (err) {
      console.warn("Microsoft logout skipped or failed:", err?.message);
    } finally {
      // 🧹 Clear all app storage (works for both Google & Microsoft)
      localStorage.clear();
      sessionStorage.clear();

      // 🔁 Redirect to login
      navigate("/login", { replace: true });
    }
  };

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div style={page}>
        <style>{css}</style>
        <div style={styles.centeredCard}>
          <div style={styles.loadingSpinner}>⏳</div>
          <h2 style={styles.loadingTitle}>Loading Profile...</h2>
          <p style={styles.emptyText}>Please wait while we fetch your information.</p>
        </div>
      </div>
    );
  }

  /* ================= SESSION EXPIRED / NO USER ================= */
  if (!user) {
    return (
      <div style={page}>
        <style>{css}</style>
        <div style={styles.centeredCard}>
          <div style={styles.emptyIcon}>🔓</div>
          <h2 style={styles.errorTitle}>Session Expired</h2>
          <p style={styles.emptyText}>
            {error || "Please login again to continue."}
          </p>
          <button style={styles.buttonDanger} onClick={handleLogout}>
            🔄 Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* ================= PROFILE VIEW ================= */
  return (
    <div style={page}>
      <style>{css}</style>

      <div style={styles.container}>
        <div style={styles.profileCard}>
          {/* Header Section */}
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.title}>👤 My Profile</h2>
              <p style={styles.subtitle}>Account information & settings</p>
            </div>
            <span style={styles.roleBadge}>{user.role || "User"}</span>
          </div>

          {/* Warning Banner (if using cached data) */}
          {error && (
            <div style={styles.warningBanner}>
              ⚠️ {error}
            </div>
          )}

          <div style={styles.divider} />

          {/* Profile Information */}
          <div style={styles.profileInfo}>
            <ProfileField 
              label="👤 Full Name" 
              value={user.name || user.username || "N/A"} 
            />
            <ProfileField 
              label="✉️ Email Address" 
              value={user.email || "N/A"} 
            />
            <ProfileField 
              label="🎯 Role" 
              value={user.role || "User"} 
            />
            {/* {(user.id || user._id) && (
              <ProfileField 
                label="🆔 User ID" 
                value={user.id || user._id} 
              />
            )} */}
          </div>

          <div style={styles.divider} />

          {/* Logout Section */}
          {/* <div style={styles.logoutBox}>
            <div>
              <strong style={styles.logoutTitle}>⚠️ Logout</strong>
              <p style={styles.logoutSubtext}>
                This will end your current session.
              </p>
            </div>
            <button 
              style={styles.buttonDanger} 
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              🚪 Logout
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}

/* ================= PROFILE FIELD COMPONENT ================= */
const ProfileField = ({ label, value }) => (
  <div style={styles.field}>
    <label style={styles.fieldLabel}>{label}</label>
    <div style={styles.fieldValue}>{value || "—"}</div>
  </div>
);

/* ================= STYLES ================= */

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
  },
  profileCard: {
    background: '#FFFFFF',
    color: '#0F172A',
    padding: '28px',
    borderRadius: '18px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
    animation: 'fadeInUp 0.6s ease-out',
    fontFamily: "'Times New Roman', Times, serif",
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: 'bold',
    fontFamily: "'Times New Roman', Times, serif",
    color: '#0F172A',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: '0',
    fontFamily: "'Times New Roman', Times, serif",
  },
  roleBadge: {
    background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: "'Times New Roman', Times, serif",
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
  },
  warningBanner: {
    background: '#FEF3C7',
    color: '#92400E',
    padding: '12px 16px',
    borderRadius: '10px',
    marginTop: '16px',
    fontSize: '14px',
    fontFamily: "'Times New Roman', Times, serif",
    border: '1px solid #FCD34D',
  },
  divider: {
    height: '1px',
    background: '#E2E8F0',
    margin: '20px 0',
  },
  profileInfo: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  field: {
    animation: 'fadeInUp 0.5s ease-out',
  },
  fieldLabel: {
    fontSize: '11px',
    color: '#64748B',
    marginBottom: '6px',
    display: 'block',
    fontWeight: '600',
    fontFamily: "'Times New Roman', Times, serif",
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  fieldValue: {
    background: 'linear-gradient(135deg, #F8FAFC, #F0F4FF)',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    fontSize: '15px',
    fontWeight: '500',
    fontFamily: "'Times New Roman', Times, serif",
    color: '#0F172A',
  },
  logoutBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: '#FEF2F2',
    borderRadius: '12px',
    animation: 'fadeInUp 0.6s ease-out 0.1s both',
    flexWrap: 'wrap',
    gap: '12px',
  },
  logoutTitle: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: '16px',
    color: '#0F172A',
  },
  logoutSubtext: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0 0',
    fontFamily: "'Times New Roman', Times, serif",
  },
  buttonDanger: {
    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
    transition: 'all 0.3s ease',
  },
  centeredCard: {
    maxWidth: '500px',
    margin: 'auto',
    background: '#FFFFFF',
    color: '#0F172A',
    padding: '40px 28px',
    borderRadius: '18px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
    textAlign: 'center',
    animation: 'scaleIn 0.5s ease-out',
    fontFamily: "'Times New Roman', Times, serif",
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  loadingSpinner: {
    fontSize: '64px',
    marginBottom: '16px',
    animation: 'spin 2s linear infinite',
  },
  loadingTitle: {
    color: '#0F172A',
    fontSize: '24px',
    margin: '0 0 12px 0',
    fontFamily: "'Times New Roman', Times, serif",
  },
  errorTitle: {
    color: '#DC2626',
    fontSize: '24px',
    margin: '0 0 12px 0',
    fontFamily: "'Times New Roman', Times, serif",
  },
  emptyText: {
    color: '#64748B',
    fontSize: '14px',
    margin: '12px 0 20px 0',
    fontFamily: "'Times New Roman', Times, serif",
    lineHeight: '1.6',
  },
};

const page = {
  minHeight: "100vh",
  background: "#FFFFFF",
  padding: "32px",
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: "14px",
  color: "#0F172A",
};

const css = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Additional Global Styles */
.card {
  max-width: 640px;
  margin: auto;
  background: #FFFFFF;
  color: #0F172A;
  padding: 28px;
  border-radius: 18px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.25);
  font-family: 'Times New Roman', Times, serif;
}

.center {
  text-align: center;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subtitle {
  font-size: 14px;
  color: #64748B;
  margin-top: 4px;
  font-family: 'Times New Roman', Times, serif;
}

.role-badge {
  background: #1E40AF;
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: bold;
  font-family: 'Times New Roman', Times, serif;
}

.divider {
  height: 1px;
  background: #E5E7EB;
  margin: 20px 0;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.profile-field label {
  font-size: 11px;
  color: #64748B;
  margin-bottom: 4px;
  display: block;
  font-weight: 600;
  font-family: 'Times New Roman', Times, serif;
}

.profile-field .value {
  background: #F8FAFC;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Times New Roman', Times, serif;
}

.logout-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.muted {
  font-size: 13px;
  color: #64748B;
  font-family: 'Times New Roman', Times, serif;
}

.btn {
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Times New Roman', Times, serif;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn.danger {
  background: #DC2626;
  color: white;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .logout-box {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  button {
    width: 100%;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start !important;
  }

  .role-badge {
    align-self: flex-start;
  }
}
`;

// import React, { useEffect, useState } from "react";
// import { jwtDecode } from "jwt-decode";
// import { useNavigate } from "react-router-dom";
// import { useMsal } from "@azure/msal-react"; // ✅ FIXED IMPORT
// import api from "../api/client";
// import "../pages/AnimationsAndStyles.css";

// export default function Profile() {
//   const navigate = useNavigate();
//   const { instance } = useMsal(); // ✅ MSAL instance

//   // ================= STATE =================
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

  
//   /* ================= FETCH PROFILE ================= */
//   useEffect(() => {
//     let isMounted = true;

//     const fetchProfile = async () => {
//       const token = localStorage.getItem("token");

//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       try {
//         // Preferred: backend validation
//         const res = await api.get("/auth/me");

//         if (isMounted) {
//           setUser(res.data);
//           setError(null);
//         }
//       } catch (err) {
//         console.error("Profile fetch failed:", err);

//         // Fallback: decode token
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
//         if (isMounted) setLoading(false);
//       }
//     };

//     fetchProfile();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   /* ================= LOGOUT ================= */
//   const handleLogout = async () => {
//     try {
//       // 🔐 Microsoft logout (clears MSAL + Microsoft cache)
//       await instance.logoutPopup({
//         postLogoutRedirectUri: window.location.origin,
//       });

//       // 🧹 Clear app storage
//       localStorage.clear();
//       sessionStorage.clear();

//       // 🔁 Redirect
//       navigate("/login", { replace: true });
//     } catch (err) {
//       console.error("Logout failed:", err);
//     }
//   };

//   /* ================= LOADING ================= */
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

//   /* ================= NO USER ================= */
//   if (!user) {
//     return (
//       <div style={page}>
//         <style>{css}</style>
//         <div style={styles.centeredCard}>
//           <div style={styles.emptyIcon}>🔓</div>
//           <h2 style={styles.errorTitle}>Session Expired</h2>
//           <p style={styles.emptyText}>{error || "Please login again."}</p>
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
//           <div style={styles.cardHeader}>
//             <div>
//               <h2 style={styles.title}>👤 My Profile</h2>
//               <p style={styles.subtitle}>Account information & settings</p>
//             </div>
//             <span style={styles.roleBadge}>{user.role || "User"}</span>
//           </div>

//           {error && <div style={styles.warningBanner}>⚠️ {error}</div>}

//           <div style={styles.divider} />

//           <div style={styles.profileInfo}>
//             <ProfileField label="👤 Full Name" value={user.name || "N/A"} />
//             <ProfileField label="✉️ Email" value={user.email || "N/A"} />
//             <ProfileField label="🎯 Role" value={user.role || "User"} />
//           </div>

//           <div style={styles.divider} />

//           <div style={styles.logoutBox}>
//             <div>
//               <strong style={styles.logoutTitle}>⚠️ Logout</strong>
//               <p style={styles.logoutSubtext}>This will end your session.</p>
//             </div>
//             <button style={styles.buttonDanger} onClick={handleLogout}>
//               🚪 Logout
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ================= PROFILE FIELD ================= */
// const ProfileField = ({ label, value }) => (
//   <div style={styles.field}>
//     <label style={styles.fieldLabel}>{label}</label>
//     <div style={styles.fieldValue}>{value || "-"}</div>
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

// .card {
//   max-width: 640px;
//   margin: auto;
//   background: #FFFFFF;
//   color: #0F172A;
//   padding: 28px;
//   border-radius: 18px;
//   box-shadow: 0 15px 35px rgba(0,0,0,0.25);
//   font-family: 'Times New Roman', Times, serif;
// }

// .center {
//   text-align: center;
// }

// .header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// }

// .subtitle {
//   font-size: 14px;
//   color: #64748B;
//   margin-top: 4px;
//   font-family: 'Times New Roman', Times, serif;
// }

// .role-badge {
//   background: #1E40AF;
//   color: white;
//   padding: 6px 14px;
//   border-radius: 16px;
//   font-size: 13px;
//   font-weight: bold;
//   font-family: 'Times New Roman', Times, serif;
// }

// .divider {
//   height: 1px;
//   background: #E5E7EB;
//   margin: 20px 0;
// }

// .profile-grid {
//   display: grid;
//   grid-template-columns: 1fr;
//   gap: 16px;
// }

// .profile-field label {
//   font-size: 11px;
//   color: #64748B;
//   margin-bottom: 4px;
//   display: block;
//   font-weight: 600;
//   font-family: 'Times New Roman', Times, serif;
// }

// .profile-field .value {
//   background: #F8FAFC;
//   padding: 12px 14px;
//   border-radius: 10px;
//   border: 1px solid #E5E7EB;
//   font-size: 14px;
//   font-weight: 500;
//   font-family: 'Times New Roman', Times, serif;
// }

// .logout-box {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// }

// .muted {
//   font-size: 13px;
//   color: #64748B;
//   font-family: 'Times New Roman', Times, serif;
// }

// .btn {
//   padding: 10px 18px;
//   border-radius: 10px;
//   border: none;
//   cursor: pointer;
//   font-weight: bold;
//   font-family: 'Times New Roman', Times, serif;
//   font-size: 14px;
// }

// .btn.danger {
//   background: #DC2626;
//   color: white;
// }

// button:hover {
//   transform: translateY(-2px);
//   box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
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
// }
// `;
