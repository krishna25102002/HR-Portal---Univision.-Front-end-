import React, { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import CandidatesList from "./pages/CandidatesList";
import CandidateDetail from "./pages/CandidateDetail";
import InterviewsList from "./pages/InterviewsList";
import OffersList from "./pages/OffersList";
import AIAssistant from "./pages/AIAssistant";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import OTP from "./pages/OTP";
import Setup2FA from "./pages/Setup2FA";

const styles = {
  navbarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "12px",
    fontWeight: "bold",
  },
  navbarLogo: {
    maxHeight: "50px",
    width: "auto",
  },
};

function App() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  /* ================= AUTH STATE SYNC ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);
  }, []);

  /* ================= LOGOUT HANDLER ================= */
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLoggedIn(false);
    navigate("/login", { replace: true });
  };

  /* ================= NOT LOGGED IN ROUTES ================= */
  if (!loggedIn) {
    return (
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={<Login onLoginSuccess={() => setLoggedIn(true)} />}
          />
          <Route path="/setup-2fa" element={<Setup2FA />} />
          <Route
            path="/otp"
            element={<OTP onVerified={() => setLoggedIn(true)} />}
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <ToastContainer position="bottom-right" autoClose={3000} />
      </div>
    );
  }

  /* ================= LOGGED IN ROUTES ================= */
  return (
    <div className="App">
      {/* NAVBAR */}
      <nav className="navbar">
        <div style={styles.navbarBrand}>
          <img
            src={require("./assest/logo.png")}
            alt="Univision Logo"
            style={styles.navbarLogo}
          />
        </div>

        <ul className="nav-links">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/candidates">Candidates</Link></li>
          <li><Link to="/jobs">Jobs</Link></li>
          <li><Link to="/interviews">Interviews</Link></li>
          <li><Link to="/ai">AI Assistant</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>

        {/* Professional Logout Button */}
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/candidates" element={<CandidatesList />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:position" element={<JobDetail />} />
          <Route path="/interviews" element={<InterviewsList />} />
          <Route path="/offers" element={<OffersList />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route
            path="/profile"
            element={<Profile onLogout={handleLogout} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}

export default App;

// import React, { useState, useEffect } from "react";
// import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "./App.css";

// import Admin from "./pages/Admin";
// import Dashboard from "./pages/Dashboard";
// import CandidatesList from "./pages/CandidatesList";
// import CandidateDetail from "./pages/CandidateDetail";
// import InterviewsList from "./pages/InterviewsList";
// import OffersList from "./pages/OffersList";
// import AIAssistant from "./pages/AIAssistant";
// import Jobs from "./pages/Jobs";
// import JobDetail from "./pages/JobDetail";
// import Profile from "./pages/Profile";
// import Login from "./pages/Login";
// import OTP from "./pages/OTP";
// import Setup2FA from "./pages/Setup2FA";

// const styles = {
//   navbarBrand: {
//     display: "flex",
//     alignItems: "center",
//     gap: "15px",
//     fontFamily: "'Times New Roman', Times, serif",
//     fontSize: "12px",
//     fontWeight: "bold",
//   },
//   navbarLogo: {
//     maxHeight: "50px",
//     width: "auto",
//   },
// };

// function App() {
//   const navigate = useNavigate();
//   const [loggedIn, setLoggedIn] = useState(false);

//   /* ================= AUTH STATE SYNC ================= */
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     setLoggedIn(!!token);
//   }, []);

//   /* ================= LOGOUT HANDLER ================= */
//   const handleLogout = () => {
//     localStorage.clear();
//     sessionStorage.clear();
//     setLoggedIn(false);
//     navigate("/login", { replace: true });
//   };

//   /* ================= NOT LOGGED IN ROUTES ================= */
//   if (!loggedIn) {
//     return (
//       <div className="App">
//         <Routes>
//           <Route
//             path="/login"
//             element={<Login onLoginSuccess={() => setLoggedIn(true)} />}
//           />
//           <Route path="/setup-2fa" element={<Setup2FA />} />
//           <Route
//             path="/otp"
//             element={<OTP onVerified={() => setLoggedIn(true)} />}
//           />
//           <Route path="/admin" element={<Admin />} />
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>

//         <ToastContainer position="bottom-right" autoClose={3000} />
//       </div>
//     );
//   }

//   /* ================= LOGGED IN ROUTES ================= */
//   return (
//     <div className="App">
//       {/* NAVBAR */}
//       <nav className="navbar">
//         <div style={styles.navbarBrand}>
//           <img
//             src={require("./assest/logo.png")}
//             alt="Univision Logo"
//             style={styles.navbarLogo}
//           />
//         </div>

//         <ul className="nav-links">
//           <li><Link to="/">Dashboard</Link></li>
//           <li><Link to="/candidates">Candidates</Link></li>
//           <li><Link to="/jobs">Jobs</Link></li>
//           <li><Link to="/interviews">Interviews</Link></li>
//           <li><Link to="/ai">AI Assistant</Link></li>
//           <li><Link to="/profile">Profile</Link></li>
//           <li>
//             <button onClick={handleLogout} className="logout-btn">
//               Logout
//             </button>
//           </li>
//         </ul>
//       </nav>

//       {/* MAIN CONTENT */}
//       <main className="main-content">
//         <Routes>
//           <Route path="/" element={<Dashboard />} />
//           <Route path="/candidates" element={<CandidatesList />} />
//           <Route path="/candidates/:id" element={<CandidateDetail />} />
//           <Route path="/jobs" element={<Jobs />} />
//           <Route path="/jobs/:position" element={<JobDetail />} />
//           <Route path="/interviews" element={<InterviewsList />} />
//           <Route path="/offers" element={<OffersList />} />
//           <Route path="/ai" element={<AIAssistant />} />
//           <Route
//             path="/profile"
//             element={<Profile onLogout={handleLogout} />}
//           />
//           <Route path="*" element={<Navigate to="/" replace />} />
//         </Routes>
//       </main>

//       <ToastContainer position="bottom-right" autoClose={3000} />
//     </div>
//   );
// }

// export default App;
