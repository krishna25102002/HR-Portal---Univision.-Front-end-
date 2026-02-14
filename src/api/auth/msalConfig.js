
import { PublicClientApplication } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "36d3fe1c-93f5-439c-9ada-f6cb3d38a92e", // EXACT App (client) ID
    authority: "https://login.microsoftonline.com/8b635c92-15fd-439f-a90b-872d13827fd9",
     redirectUri: "http://localhost:3000/auth/microsoft",
    // redirectUri: "http://13.233.127.83/auth/microsoft"
    //redirectUri: "https://d2aacj83qbzrx4.cloudfront.net/auth/microsoft"
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

//http://172.31.44.149:5000/api/auth/microsoft-login 