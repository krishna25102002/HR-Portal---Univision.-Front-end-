import React, { useState, useEffect } from "react";
import api from "../api/client";
import "./admin.css";
import { useNavigate } from "react-router-dom";


export default function Admin() {
  /* ================= ADMIN AUTH ================= */
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); 
  /* ================= FORM STATES ================= */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("HR");
  const [editingId, setEditingId] = useState(null);

  /* ================= DATA ================= */
  const [users, setUsers] = useState([]);

  /* ================= UI STATES ================= */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= INIT ================= */
  useEffect(() => {
    const admin = localStorage.getItem("adminLoggedIn");
    if (admin === "true") {
      setLoggedIn(true);
      fetchUsers();
    }
  }, []);

  /* ================= ADMIN LOGIN ================= */
  const handleAdminLogin = async () => {
    if (!username || !password) {
      alert("Enter username & password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/admin/login", { username, password });

      localStorage.setItem("adminLoggedIn", "true");
      setLoggedIn(true);
      fetchUsers();
    } catch (err) {
      setError("Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
  localStorage.removeItem("adminLoggedIn");
  setLoggedIn(false);
  setUsers([]);
  resetForm();
  navigate("/login"); // ✅ redirect to login page
};

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users failed", err);
    }
  };

  /* ================= ADD USER ================= */
  const handleAddUser = async () => {
    if (!email || !name) {
      alert("Name & Email required");
      return;
    }

    setLoading(true);
    try {
      await api.post("/admin/add-user", { name, email, role });
      alert("User added successfully");
      fetchUsers();
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT USER ================= */
  const handleEdit = (user) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
  };

  /* ================= UPDATE USER ================= */
  const handleUpdateUser = async () => {
    setLoading(true);
    try {
      await api.put(`/admin/update-user/${editingId}`, {
        name,
        email,
        role,
      });
      alert("User updated");
      fetchUsers();
      resetForm();
    } catch {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE USER ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await api.delete(`/admin/delete-user/${id}`);
      alert("User deleted");
      fetchUsers();
    } catch {
      alert("Delete failed");
    }
  };

  /* ================= RESET FORM ================= */
  const resetForm = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setRole("HR");
  };

  /* ================= UI ================= */
  return (
    <div className="admin-container">
      {!loggedIn ? (
        /* ================= LOGIN SCREEN ================= */
        <div className="admin-card">
          <h2>Admin Login</h2>

          {error && <p className="error">{error}</p>}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
          />

          <button onClick={handleAdminLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      ) : (
        /* ================= DASHBOARD ================= */
        <div className="admin-dashboard">
          <div className="dashboard-header">
            <h2>HR User Management</h2>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* ================= FORM ================= */}
          <div className="form-section">
            <h3>{editingId ? "Edit User" : "Add HR User"}</h3>

            <div className="form-grid">
              <input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="HR">HR</option>
                <option value="HR Manager">HR Manager</option>
                <option value="Recruiter">Recruiter</option>
              </select>
            </div>

            <div className="form-actions">
              {editingId ? (
                <>
                  <button onClick={handleUpdateUser}>Update</button>
                  <button onClick={resetForm}>Cancel</button>
                </>
              ) : (
                <button onClick={handleAddUser}>Add User</button>
              )}
            </div>
          </div>

          {/* ================= TABLE ================= */}
          <div className="table-section">
            <h3>Users ({users.length})</h3>

            <table className="hr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <button onClick={() => handleEdit(u)}>Edit</button>
                      <button onClick={() => handleDelete(u.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
