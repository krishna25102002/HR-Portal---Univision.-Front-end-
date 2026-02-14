import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { msalInstance } from "./api/auth/msalConfig";

import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MsalProvider } from "@azure/msal-react";

const root = ReactDOM.createRoot(document.getElementById("root"));

// ✅ Get Google Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

async function renderApp() {
  // 🔥 Validate required environment variables
  if (!GOOGLE_CLIENT_ID) {
    console.error("❌ REACT_APP_GOOGLE_CLIENT_ID is not defined in .env file");
    root.render(
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        fontFamily: 'Arial, sans-serif' 
      }}>
        <h2 style={{ color: '#e74c3c' }}>⚠️ Configuration Error</h2>
        <p>Google Client ID is missing. Please check your .env file.</p>
      </div>
    );
    return;
  }

  // 🔥 REQUIRED for Microsoft login
  try {
    await msalInstance.initialize();
  } catch (error) {
    console.error("❌ MSAL initialization failed:", error);
  }

  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <MsalProvider instance={msalInstance}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MsalProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}

renderApp();
