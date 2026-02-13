// import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

// // ✅ Get Azure credentials from environment variables
// const AZURE_CLIENT_ID = process.env.REACT_APP_AZURE_CLIENT_ID;
// const AZURE_TENANT_ID = process.env.REACT_APP_AZURE_TENANT_ID;
// const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || window.location.origin;

// // ⚠️ Validate required environment variables
// const validateConfig = () => {
//   const errors = [];
  
//   if (!AZURE_CLIENT_ID) {
//     errors.push("REACT_APP_AZURE_CLIENT_ID is missing");
//   }
  
//   if (!AZURE_TENANT_ID) {
//     errors.push("REACT_APP_AZURE_TENANT_ID is missing");
//   }
  
//   if (errors.length > 0) {
//     console.error("❌ MSAL Configuration Errors:", errors);
//     if (process.env.NODE_ENV === 'production') {
//       throw new Error(`MSAL configuration invalid: ${errors.join(', ')}`);
//     }
//   }
// };

// validateConfig();

// export const msalConfig = {
//   auth: {
//     clientId: AZURE_CLIENT_ID || "fallback-client-id",
//     authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID || "common"}`,
//     redirectUri: REDIRECT_URI,
//     postLogoutRedirectUri: REDIRECT_URI,
//     navigateToLoginRequestUrl: false,
//   },
//   cache: {
//     cacheLocation: "localStorage",
//     storeAuthStateInCookie: false,
//   },
//   system: {
//     loggerOptions: {
//       loggerCallback: (level, message, containsPii) => {
//         if (containsPii) return;
        
//         switch (level) {
//           case LogLevel.Error:
//             console.error(message);
//             break;
//           case LogLevel.Info:
//             console.info(message);
//             break;
//           case LogLevel.Verbose:
//             console.debug(message);
//             break;
//           case LogLevel.Warning:
//             console.warn(message);
//             break;
//           default:
//             break;
//         }
//       },
//       logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Verbose : LogLevel.Error,
//     },
//   },
// };

// // ✅ Log configuration status (only in development)
// if (process.env.NODE_ENV === 'development') {
//   console.log('🔐 MSAL Configuration Status:', {
//     clientId: AZURE_CLIENT_ID ? '✓ Configured' : '✗ Missing',
//     tenantId: AZURE_TENANT_ID ? '✓ Configured' : '✗ Missing',
//     redirectUri: REDIRECT_URI,
//     environment: process.env.NODE_ENV,
//   });
// }

// // ✅ Initialize MSAL instance
// export const msalInstance = new PublicClientApplication(msalConfig);

// // ✅ Export login request configuration
// export const loginRequest = {
//   scopes: ["User.Read"],
// };

// // ✅ Export Graph API configuration
// export const graphConfig = {
//   graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
// };

import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "36d3fe1c-93f5-439c-9ada-f6cb3d38a92e", // EXACT App (client) ID
    authority: "https://login.microsoftonline.com/8b635c92-15fd-439f-a90b-872d13827fd9",
    // redirectUri: "http://localhost:3000/auth/microsoft",
    redirectUri: "http://hrportalfrontend.s3-website.ap-south-1.amazonaws.com/auth/microsoft"
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

//http://172.31.44.149:5000/api/auth/microsoft-login 