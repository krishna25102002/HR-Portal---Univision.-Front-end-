import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // ❌ Not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Logged in → allow page
  return children;
}
