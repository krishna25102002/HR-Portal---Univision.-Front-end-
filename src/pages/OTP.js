import { useState } from "react";
import { authAPI } from "../api/client";
import { useNavigate } from "react-router-dom";
import '../pages/AnimationsAndStyles.css';

const css = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
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
`;

export default function OTP({ onVerified }) {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const styles = {
    pageContainer: {
      minHeight: '100vh',
      background: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: '12px',
      position: 'relative',
      overflow: 'hidden',
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
    logoImage: {
      maxWidth: '280px',
      height: 'auto',
      marginBottom: '20px',
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      padding: '40px',
      overflow: 'hidden',
      animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      fontFamily: "'Times New Roman', Times, serif",
    },
    title: {
      fontSize: 'var(--fs-2xl)',
      fontWeight: 'bold',
      color: '#0F172A',
      margin: '0 0 24px 0',
      fontFamily: "'Times New Roman', Times, serif",
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '20px',
      border: '2px solid #E2E8F0',
      borderRadius: '10px',
      fontSize: '12px',
      fontFamily: "'Times New Roman', Times, serif",
      textAlign: 'center',
      letterSpacing: '8px',
      fontWeight: 600,
      boxSizing: 'border-box',
      transition: 'border-color 0.3s ease',
    },
    button: {
      width: '100%',
      padding: '12px 20px',
      background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '12px',
      fontWeight: 'bold',
      fontFamily: "'Times New Roman', Times, serif",
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
  };

  const verify = async () => {
    try {
      const userId = localStorage.getItem("pendingUserId");

      if (!userId) {
        alert("Session expired. Please login again.");
        navigate("/");
        return;
      }

      const res = await authAPI.verifyOTP(userId, otp);

      localStorage.setItem("token", res.data.token);
      localStorage.removeItem("pendingUserId");

      if (onVerified) onVerified();

      navigate("/");

    } catch (err) {
      console.error("OTP verification failed", err);
      alert(err.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <style>{css}</style>
      <div style={styles.contentWrapper}>
        <div style={styles.logoSection}>
          <img src={require('../assest/logo.png')} alt="Univision Logo" style={styles.logoImage} />
        </div>
        <div style={styles.card}>
          <h3 style={styles.title}>Enter Authenticator Code</h3>
          <input
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit OTP"
            style={styles.input}
            onFocus={(e) => e.target.style.borderColor = '#1E40AF'}
            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
          />
          <button 
            onClick={verify}
            style={styles.button}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

// import { useState } from "react";
// import { authAPI } from "../api/client";
// import { useNavigate } from "react-router-dom";

// export default function OTP({ onVerified }) {
//   const [otp, setOtp] = useState("");
//   const navigate = useNavigate();

//   const verify = async () => {
//     try {
//       const userId = localStorage.getItem("pendingUserId");

//       const res = await authAPI.verifyOTP({
//         userId,
//         otp
//       });

//       // save final JWT
//       localStorage.setItem("token", res.data.token);

//       // cleanup
//       localStorage.removeItem("pendingUserId");

//       if (onVerified) onVerified();

//       // redirect to dashboard
//       navigate("/");

//     } catch (err) {
//       console.error("OTP verification failed", err);
//       alert("Invalid OTP");
//     }
//   };

//   return (
//     <div className="card">
//       <h3>Enter Authenticator Code</h3>

//       <input
//         type="text"
//         maxLength="6"
//         placeholder="6-digit OTP"
//         value={otp}
//         onChange={(e) => setOtp(e.target.value)}
//       />

//       <button onClick={verify}>Verify</button>
//     </div>
//   );
// }
