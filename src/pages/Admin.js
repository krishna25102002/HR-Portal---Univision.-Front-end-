import React, { useState, useEffect } from "react";
import api from "../api/client";
import "./admin.css";

export default function Admin() {
  /* ================= ADMIN AUTH ================= */
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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

// import React, { useState, useEffect } from "react";
// import "./admin.css";

// // Import your API service
// import api from "../api/client"; // Adjust the path to your API service file

// export default function Admin() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [loggedIn, setLoggedIn] = useState(false);
  
//   // Form states
//   const [email, setEmail] = useState("");
//   const [name, setName] = useState("");
//   const [role, setRole] = useState("HR");
//   const [editingId, setEditingId] = useState(null);
  
//   // HR Users list
//   const [hrUsers, setHrUsers] = useState([]);
  
//   // Loading and error states
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Check if admin is already logged in
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       setLoggedIn(true);
//       fetchUsers();
//     }
//   }, []);

//   // Fetch all HR users from backend
//   const fetchUsers = async () => {
//     setLoading(true);
//     setError("");
    
//     try {
//       const response = await api.get("/admin/users", {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`
//         }
//       });
      
//       setHrUsers(response.data.users || response.data);
//     } catch (err) {
//       console.error("Error fetching users:", err);
//       setError(err.response?.data?.message || "Failed to fetch users");
      
//       // Handle 401 Unauthorized
//       if (err.response?.status === 401) {
//         handleLogout();
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Admin login
//   const handleAdminLogin = async () => {
//     if (!username || !password) {
//       alert("Please enter both username and password");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const response = await api.post("/admin/login", {
//         username,
//         password
//       });

//       const token = response.data.token;
//       localStorage.setItem("token", token);
      
//       setLoggedIn(true);
//       alert("Login successful!");
      
//       // Fetch users after login
//       await fetchUsers();
      
//     } catch (err) {
//       console.error("Login error:", err);
//       setError(err.response?.data?.message || "Invalid Admin Credentials");
//       alert(err.response?.data?.message || "Invalid Admin Credentials");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Add new HR user
//   const handleAddUser = async () => {
//     if (!email || !name || !role) {
//       alert("Please fill all fields");
//       return;
//     }

//     // Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       alert("Please enter a valid email address");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const response = await api.post("/admin/add-user", 
//         {
//           name,
//           email,
//           role
//         }, 
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`
//           }
//         }
//       );

//       // Add new user to the list
//       setHrUsers([...hrUsers, response.data.user || response.data]);
      
//       alert(`User ${name} added successfully`);
      
//       // Reset form
//       setEmail("");
//       setName("");
//       setRole("HR");
      
//     } catch (err) {
//       console.error("Error adding user:", err);
//       const errorMessage = err.response?.data?.message || "Failed to add user";
//       setError(errorMessage);
//       alert(errorMessage);
      
//       // Handle 401 Unauthorized
//       if (err.response?.status === 401) {
//         handleLogout();
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Edit user - populate form
//   const handleEditUser = (user) => {
//     setEditingId(user.id || user._id);
//     setName(user.name);
//     setEmail(user.email);
//     setRole(user.role);
//   };

//   // Update existing HR user
//   const handleUpdateUser = async () => {
//     if (!email || !name || !role) {
//       alert("Please fill all fields");
//       return;
//     }

//     // Email validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       alert("Please enter a valid email address");
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       const response = await api.put(`/admin/update-user/${editingId}`, 
//         {
//           name,
//           email,
//           role
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`
//           }
//         }
//       );

//       // Update user in the list
//       const updatedUsers = hrUsers.map(user => 
//         (user.id || user._id) === editingId 
//           ? (response.data.user || response.data)
//           : user
//       );

//       setHrUsers(updatedUsers);
      
//       alert("User updated successfully");
      
//       // Reset form
//       setEditingId(null);
//       setEmail("");
//       setName("");
//       setRole("HR");
      
//     } catch (err) {
//       console.error("Error updating user:", err);
//       const errorMessage = err.response?.data?.message || "Failed to update user";
//       setError(errorMessage);
//       alert(errorMessage);
      
//       // Handle 401 Unauthorized
//       if (err.response?.status === 401) {
//         handleLogout();
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Delete HR user
//   const handleDeleteUser = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this user?")) {
//       return;
//     }

//     setLoading(true);
//     setError("");

//     try {
//       await api.delete(`/admin/delete-user/${id}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`
//         }
//       });

//       // Remove user from the list
//       setHrUsers(hrUsers.filter(user => (user.id || user._id) !== id));
      
//       alert("User deleted successfully");
      
//     } catch (err) {
//       console.error("Error deleting user:", err);
//       const errorMessage = err.response?.data?.message || "Failed to delete user";
//       setError(errorMessage);
//       alert(errorMessage);
      
//       // Handle 401 Unauthorized
//       if (err.response?.status === 401) {
//         handleLogout();
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Cancel edit mode
//   const handleCancelEdit = () => {
//     setEditingId(null);
//     setEmail("");
//     setName("");
//     setRole("HR");
//   };

//   // Logout
//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     setLoggedIn(false);
//     setHrUsers([]);
//     setUsername("");
//     setPassword("");
//     setEmail("");
//     setName("");
//     setRole("HR");
//     setEditingId(null);
//     setError("");
//   };

//   return (
//     <div className="admin-container">
//       {!loggedIn ? (
//         <div className="admin-card">
//           <h2>Admin Login</h2>
          
//           {error && <div className="error-message">{error}</div>}
          
//           <input
//             type="text"
//             placeholder="Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             disabled={loading}
//           />
          
//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
//             disabled={loading}
//           />
          
//           <button onClick={handleAdminLogin} disabled={loading}>
//             {loading ? "Logging in..." : "Login"}
//           </button>
//         </div>
//       ) : (
//         <div className="admin-dashboard">
//           <div className="dashboard-header">
//             <h2>HR User Management</h2>
//             <button className="logout-btn" onClick={handleLogout} disabled={loading}>
//               Logout
//             </button>
//           </div>

//           {error && <div className="error-banner">{error}</div>}

//           <div className="form-section">
//             <h3>{editingId ? "Edit HR User" : "Add New HR User"}</h3>
            
//             <div className="form-grid">
//               <input
//                 type="text"
//                 placeholder="Full Name"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 disabled={loading}
//               />
              
//               <input
//                 type="email"
//                 placeholder="Email Address"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 disabled={loading}
//               />
              
//               <select 
//                 value={role} 
//                 onChange={(e) => setRole(e.target.value)}
//                 disabled={loading}
//               >
//                 <option value="HR">HR</option>
//                 <option value="HR Manager">HR Manager</option>
//                 <option value="HR Coordinator">HR Coordinator</option>
//                 <option value="Recruiter">Recruiter</option>
//                 <option value="HR Admin">HR Admin</option>
//               </select>
//             </div>

//             <div className="form-actions">
//               {editingId ? (
//                 <>
//                   <button 
//                     className="btn-update" 
//                     onClick={handleUpdateUser}
//                     disabled={loading}
//                   >
//                     {loading ? "Updating..." : "Update User"}
//                   </button>
//                   <button 
//                     className="btn-cancel" 
//                     onClick={handleCancelEdit}
//                     disabled={loading}
//                   >
//                     Cancel
//                   </button>
//                 </>
//               ) : (
//                 <button 
//                   className="btn-add" 
//                   onClick={handleAddUser}
//                   disabled={loading}
//                 >
//                   {loading ? "Adding..." : "Add User"}
//                 </button>
//               )}
//             </div>
//           </div>

//           <div className="table-section">
//             <h3>Current HR Users ({hrUsers.length})</h3>
            
//             {loading && <div className="loading-spinner">Loading...</div>}
            
//             <div className="table-wrapper">
//               <table className="hr-table">
//                 <thead>
//                   <tr>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Role</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {hrUsers.length === 0 ? (
//                     <tr>
//                       <td colSpan="4" className="no-data">
//                         {loading ? "Loading users..." : "No HR users found. Add one to get started."}
//                       </td>
//                     </tr>
//                   ) : (
//                     hrUsers.map((user) => (
//                       <tr 
//                         key={user.id || user._id} 
//                         className={editingId === (user.id || user._id) ? "editing-row" : ""}
//                       >
//                         <td>{user.name}</td>
//                         <td>{user.email}</td>
//                         <td>
//                           <span className="role-badge">{user.role}</span>
//                         </td>
//                         <td>
//                           <div className="action-buttons">
//                             <button 
//                               className="btn-edit"
//                               onClick={() => handleEditUser(user)}
//                               disabled={loading || (editingId && editingId !== (user.id || user._id))}
//                             >
//                               Edit
//                             </button>
//                             <button 
//                               className="btn-delete"
//                               onClick={() => handleDeleteUser(user.id || user._id)}
//                               disabled={loading || editingId}
//                             >
//                               Delete
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
