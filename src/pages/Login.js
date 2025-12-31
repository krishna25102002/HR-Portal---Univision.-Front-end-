import { GoogleLogin } from "@react-oauth/google";
import { authAPI } from "../api/client";
import { useNavigate, Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import "../pages/AnimationsAndStyles.css";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { instance } = useMsal();

  /* ================= GOOGLE LOGIN ================= */
  const handleGoogleLogin = async (res) => {
    try {
      const response = await authAPI.googleLogin(res.credential);

      // Check if 2FA setup is required
      if (response.data.setup2FA) {
        localStorage.setItem("pendingUserId", response.data.userId);
        localStorage.setItem("qrCode", response.data.qrCode);
        localStorage.setItem("manualKey", response.data.manualKey);
        navigate("/setup-2fa");
        return;
      }

      // Check if OTP verification is required
      if (response.data.requireOTP) {
        localStorage.setItem("pendingUserId", response.data.userId);
        navigate("/otp");
        return;
      }

      // Direct login success
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        onLoginSuccess();
        navigate("/");
      }
    } catch (err) {
      console.error("Google login failed:", err);
      alert("❌ Google login failed. Please try again.");
    }
  };

  /* ================= MICROSOFT LOGIN ================= */
  const handleMicrosoftLogin = async () => {
    try {
      // Force account picker to show
      await instance.loginPopup({
        scopes: ["User.Read"],
        prompt: "select_account", // Always show email chooser
      });

      // Get selected account
      const account = instance.getAllAccounts()[0];
      if (!account) {
        alert("❌ No Microsoft account selected");
        return;
      }

      // Get Microsoft Graph access token
      const tokenResponse = await instance.acquireTokenSilent({
        account,
        scopes: ["User.Read"],
      });

      const accessToken = tokenResponse.accessToken;

      // Send access token to backend
      const response = await authAPI.microsoftLogin(accessToken);

      // Store app token and navigate
      localStorage.setItem("token", response.data.token);
      onLoginSuccess();
      navigate("/");

    } catch (err) {
      console.error("Microsoft login failed:", err);

      // Handle specific error cases
      if (err?.response?.data?.error === "USER_NOT_REGISTERED") {
        alert("🚫 Your email is not registered. Please contact admin.");
        return;
      }

      if (err.errorCode === "user_cancelled") {
        alert("❌ Login cancelled by user");
        return;
      }

      alert("❌ Microsoft login failed. Please try again.");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <style>{css}</style>

      {/* Background Decorative Shapes */}
      <div style={styles.bgShapes}>
        <div style={styles.bgShape1}></div>
        <div style={styles.bgShape2}></div>
      </div>

      <div style={styles.contentWrapper}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.adminLinkWrapper}>
            <Link to="/admin" style={styles.adminLink}>
              🔐 Admin Login
            </Link>
          </div>

          <img
            src={require("../assest/logo.png")}
            alt="Univision Logo"
            style={styles.logoImage}
          />
          <h1 style={styles.logoText}>HR Management System</h1>
          <p style={styles.logoSubtext}>Professional Recruitment Platform</p>
        </div>

        {/* Login Card */}
        <div style={styles.loginCard}>
          <div style={styles.formContent}>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>
              Sign in with your account to continue
            </p>

            {/* Google Login Button */}
            <div style={styles.googleLoginWrapper}>
              <GoogleLogin 
                onSuccess={handleGoogleLogin}
                onError={() => {
                  console.error('Google Login Failed');
                  alert('❌ Google login failed. Please try again.');
                }}
                theme="outline"
                size="large"
                text="continue_with"
              />
            </div>

            {/* Microsoft Login Button */}
            <div style={styles.microsoftLoginWrapper}>
              <button
                onClick={handleMicrosoftLogin}
                style={styles.microsoftBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1E40AF';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#2563EB';
                }}
              >
                🔐 Sign in with Microsoft
              </button>
            </div>

            <div style={styles.divider}>
              <span style={styles.dividerText}>Secure Authentication</span>
            </div>

            <p style={styles.footerText}>
              💡 Secure login powered by Google & Microsoft
            </p>

            <p style={styles.securityNote}>
              🔒 Your data is protected with industry-standard encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Times New Roman', Times, serif",
    position: 'relative',
    overflow: 'hidden',
  },

  bgShapes: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 0,
    opacity: 0.1,
  },

  bgShape1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    top: '-100px',
    left: '-100px',
    animation: 'float 6s ease-in-out infinite',
  },

  bgShape2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.15)',
    bottom: '-50px',
    right: '-50px',
    animation: 'float 8s ease-in-out infinite 1s',
  },

  contentWrapper: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '500px',
    width: '100%',
  },

  logoSection: {
    textAlign: 'center',
    marginBottom: '40px',
    animation: 'fadeInDown 0.6s ease-out',
  },

  adminLinkWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },

  adminLink: {
    fontSize: '13px',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    fontFamily: "'Times New Roman', Times, serif",
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },

  logoImage: {
    maxWidth: '280px',
    height: 'auto',
    marginBottom: '20px',
    animation: 'rotateIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
  },

  logoText: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    margin: '12px 0',
    fontFamily: "'Times New Roman', Times, serif",
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },

  logoSubtext: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.85)',
    margin: 0,
    fontFamily: "'Times New Roman', Times, serif",
    fontWeight: '400',
  },

  loginCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },

  formContent: {
    padding: '40px',
  },

  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#0F172A',
    margin: '0 0 8px 0',
    fontFamily: "'Times New Roman', Times, serif",
  },

  subtitle: {
    fontSize: '14px',
    color: '#64748B',
    margin: '0 0 32px 0',
    fontFamily: "'Times New Roman', Times, serif",
    lineHeight: '1.5',
  },

  googleLoginWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },

  microsoftLoginWrapper: {
    marginTop: '16px',
    textAlign: 'center',
  },

  microsoftBtn: {
    width: '100%',
    padding: '12px 20px',
    borderRadius: '8px',
    border: '2px solid #2563EB',
    background: 'white',
    color: '#2563EB',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    fontFamily: "'Times New Roman', Times, serif",
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.1)',
  },

  divider: {
    position: 'relative',
    height: '1px',
    background: '#E2E8F0',
    margin: '28px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dividerText: {
    background: 'white',
    padding: '0 12px',
    fontSize: '12px',
    color: '#94A3B8',
    fontWeight: '500',
    fontFamily: "'Times New Roman', Times, serif",
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  footerText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748B',
    margin: '0 0 12px 0',
    fontFamily: "'Times New Roman', Times, serif",
    lineHeight: '1.6',
  },

  securityNote: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94A3B8',
    margin: 0,
    fontFamily: "'Times New Roman', Times, serif",
    fontStyle: 'italic',
  },
};

/* ================= CSS ANIMATIONS ================= */

const css = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes rotateIn {
    from {
      opacity: 0;
      transform: rotate(-10deg) scale(0.9);
    }
    to {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(5deg);
    }
  }

  /* Admin Link Hover Effect */
  a[href="/admin"]:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  /* Responsive Design */
  @media (max-width: 600px) {
    .login-card {
      padding: 30px 20px !important;
    }

    h1 {
      font-size: 24px !important;
    }

    h2 {
      font-size: 22px !important;
    }
  }
`;

// import { GoogleLogin } from "@react-oauth/google";
// import { authAPI } from "../api/client";
// import { useNavigate, Link } from "react-router-dom";
// import "../pages/AnimationsAndStyles.css";
// import { useMsal } from "@azure/msal-react";

// export default function Login({ onLoginSuccess }) {
//   const navigate = useNavigate();
//   const { instance } = useMsal(); // ✅ use initialized MSAL

//   // ================= GOOGLE LOGIN =================
//   const handleLogin = async (res) => {
//     try {
//       const response = await authAPI.googleLogin(res.credential);

//       if (response.data.setup2FA) {
//         localStorage.setItem("pendingUserId", response.data.userId);
//         localStorage.setItem("qrCode", response.data.qrCode);
//         localStorage.setItem("manualKey", response.data.manualKey);
//         navigate("/setup-2fa");
//         return;
//       }

//       if (response.data.requireOTP) {
//         localStorage.setItem("pendingUserId", response.data.userId);
//         navigate("/otp");
//         return;
//       }

//       if (response.data.token) {
//         localStorage.setItem("token", response.data.token);
//         onLoginSuccess();
//         navigate("/");
//       }
//     } catch (err) {
//       console.error("Login failed", err);
//     }
//   };

 
//   // ================= MICROSOFT LOGIN =================
// // const handleMicrosoftLogin = async () => {
// //   try {
// //     // 1️⃣ Login (interactive)
// //     await instance.loginPopup({
// //       scopes: ["User.Read"], // Microsoft Graph scope
// //     });

// //     // 2️⃣ Get logged-in account
// //     const account = instance.getAllAccounts()[0];
// //     if (!account) {
// //       throw new Error("No Microsoft account found");
// //     }

// //     // 3️⃣ Get GRAPH ACCESS TOKEN
// //     const tokenResponse = await instance.acquireTokenSilent({
// //       account,
// //       scopes: ["User.Read"], // Graph scope
// //     });

// //     const accessToken = tokenResponse.accessToken; // ✅ THIS is what Graph needs

// //     // 4️⃣ Send ACCESS TOKEN to backend
// //     const response = await authAPI.microsoftLogin(accessToken);

// //     // 5️⃣ App login success
// //     localStorage.setItem("token", response.data.token);
// //     onLoginSuccess();
// //     navigate("/");

// //   } catch (err) {
// //     console.error("Microsoft login failed", err);
// //     alert("Microsoft login failed");
// //   }
// // };
// // ================= MICROSOFT LOGIN =================
// const handleMicrosoftLogin = async () => {
//   try {
//     // 1️⃣ Force email input / account picker
//     await instance.loginPopup({
//       scopes: ["User.Read"],
//       prompt: "select_account", // 👈 ALWAYS show email chooser
//     });

//     // 2️⃣ Get selected account
//     const account = instance.getAllAccounts()[0];
//     if (!account) {
//       throw new Error("No Microsoft account selected");
//     }

//     // 3️⃣ Get GRAPH access token
//     const tokenResponse = await instance.acquireTokenSilent({
//       account,
//       scopes: ["User.Read"],
//     });

//     const accessToken = tokenResponse.accessToken;

//     // 4️⃣ Backend login
//     const response = await authAPI.microsoftLogin(accessToken);

//     localStorage.setItem("token", response.data.token);
//     onLoginSuccess();
//     navigate("/");

//   } catch (err) {
//     console.error("Microsoft login failed", err);
//       if (err?.response?.data?.error === "USER_NOT_REGISTERED") {
//     alert("🚫 Your email is not registered. Please contact admin.");
//     return;
//   }

//   if (err.errorCode === "user_cancelled") {
//     alert("❌ Login cancelled by user");
//     return;
//   }

//   alert("❌ Microsoft login failed");
  
// };



//   return (
//     <div style={styles.pageContainer}>
//       <style>{css}</style>

//       <div style={styles.bgShapes}>
//         <div style={styles.bgShape1}></div>
//         <div style={styles.bgShape2}></div>
//       </div>

//       <div style={styles.contentWrapper}>
//         <div style={styles.logoSection}>
//           <div style={styles.adminLinkWrapper}>
//             <Link to="/admin" style={styles.adminLink}>
//               Admin Login
//             </Link>
//           </div>

//           <img
//             src={require("../assest/logo.png")}
//             alt="Univision Logo"
//             style={styles.logoImage}
//           />
//           <h1 style={styles.logoText}>HR Management System</h1>
//           <p style={styles.logoSubtext}>Professional Recruitment Platform</p>
//         </div>

//         <div style={styles.loginCard}>
//           <div style={styles.formContent}>
//             <h2 style={styles.title}>Welcome Back</h2>
//             <p style={styles.subtitle}>
//               Sign in with your account to continue
//             </p>

//             <div style={styles.googleLoginWrapper}>
//               <GoogleLogin onSuccess={handleLogin} />
//             </div>

//             <div style={{ marginTop: "16px", textAlign: "center" }}>
//               <button
//                 onClick={handleMicrosoftLogin}
//                 style={{
//                   padding: "10px 18px",
//                   borderRadius: "10px",
//                   border: "1px solid #2563EB",
//                   background: "white",
//                   color: "#2563EB",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                 }}
//               >
//                 🔐 Sign in with Microsoft
//               </button>
//             </div>

//             <div style={styles.divider}></div>

//             <p style={styles.footerText}>
//               💡 Secure login powered by Google & Microsoft
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   //admmin css
//   adminLinkWrapper: {
//   display: 'flex',
//   justifyContent: 'flex-end',
//   marginBottom: '10px',
// },

// adminLink: {
//   fontSize: '12px',
//   color: '#ffffff',
//   textDecoration: 'underline',
//   cursor: 'pointer',
//   fontWeight: 'bold',
// },

//   pageContainer: {
//     minHeight: '100vh',
//     background: '#FFFFFF',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: '20px',
//     fontFamily: "'Times New Roman', Times, serif",
//     fontSize: '12px',
//     position: 'relative',
//     overflow: 'hidden',
//   },
//   bgShapes: {
//     position: 'absolute',
//     width: '100%',
//     height: '100%',
//     top: 0,
//     left: 0,
//     zIndex: 0,
//     opacity: 0.1,
//   },
//   bgShape1: {
//     position: 'absolute',
//     width: '400px',
//     height: '400px',
//     borderRadius: '50%',
//     background: 'rgba(255, 255, 255, 0.2)',
//     top: '-100px',
//     left: '-100px',
//     animation: 'float 6s ease-in-out infinite',
//   },
//   bgShape2: {
//     position: 'absolute',
//     width: '300px',
//     height: '300px',
//     borderRadius: '50%',
//     background: 'rgba(255, 255, 255, 0.15)',
//     bottom: '-50px',
//     right: '-50px',
//     animation: 'float 8s ease-in-out infinite 1s',
//   },
//   contentWrapper: {
//     position: 'relative',
//     zIndex: 1,
//     maxWidth: '500px',
//     width: '100%',
//   },
//   logoSection: {
//     textAlign: 'center',
//     marginBottom: '40px',
//     animation: 'fadeInDown 0.6s ease-out',
//   },
//   logoIcon: {
//     fontSize: 'var(--fs-3xl)',
//     marginBottom: '16px',
//     display: 'inline-block',
//     animation: 'rotateIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
//   },
//   logoImage: {
//     maxWidth: '280px',
//     height: 'auto',
//     marginBottom: '20px',
//     animation: 'rotateIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
//   },
//   logoText: {
//     fontSize: 'var(--fs-2xl)',
//     fontWeight: 'bold',
//     color: 'white',
//     margin: '12px 0',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   logoSubtext: {
//     fontSize: 'var(--fs-md)',
//     color: 'rgba(255, 255, 255, 0.8)',
//     margin: 0,
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   loginCard: {
//     background: 'white',
//     borderRadius: '20px',
//     boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
//     overflow: 'hidden',
//     animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
//     position: 'relative',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   formContent: {
//     padding: '40px',
//   },
//   title: {
//     fontSize: 'var(--fs-2xl)',
//     fontWeight: 'bold',
//     color: '#0F172A',
//     margin: '0 0 8px 0',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   subtitle: {
//     fontSize: 'var(--fs-md)',
//     color: '#64748B',
//     margin: '0 0 28px 0',
//     fontFamily: "'Times New Roman', Times, serif",
//   },
//   googleLoginWrapper: {
//     display: 'flex',
//     justifyContent: 'center',
//     marginBottom: '24px',
//   },
//   divider: {
//     height: '1px',
//     background: '#E2E8F0',
//     margin: '24px 0',
//   },
//   footerText: {
//     textAlign: 'center',
//     fontSize: 'var(--fs-xs)',
//     color: '#94A3B8',
//     margin: 0,
//     fontFamily: "'Times New Roman', Times, serif",
//   },
// };

// const css = `
//   @keyframes fadeInDown {
//     from {
//       opacity: 0;
//       transform: translateY(-20px);
//     }
//     to {
//       opacity: 1;
//       transform: translateY(0);
//     }
//   }

//   @keyframes scaleIn {
//     from {
//       opacity: 0;
//       transform: scale(0.95);
//     }
//     to {
//       opacity: 1;
//       transform: scale(1);
//     }
//   }

//   @keyframes rotateIn {
//     from {
//       opacity: 0;
//       transform: rotate(-10deg) scale(0.9);
//     }
//     to {
//       opacity: 1;
//       transform: rotate(0deg) scale(1);
//     }
//   }

//   @keyframes float {
//     0%, 100% {
//       transform: translateY(0px);
//     }
//     50% {
//       transform: translateY(-20px);
//     }
//   }
// `;
