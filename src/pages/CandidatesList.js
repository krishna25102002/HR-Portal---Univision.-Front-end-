import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesAPI, resumesAPI } from '../api/client';
import { toast } from 'react-toastify';
import '../pages/AnimationsAndStyles.css';

export default function CandidatesList() {
  const [candidates, setCandidates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email_id: '',
    phone_number: '',
    skills: '',
    experience: '',
    education: '',
    position: ''
  });

  const navigate = useNavigate();

  /* ================= 1. LOAD CANDIDATES ================= */
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await candidatesAPI.getAll();
      setCandidates(res.data);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      toast.error('Failed to fetch candidates');
    }
  };

  /* ================= 2. LIVE SEARCH FILTER ================= */
  const filteredCandidates = candidates.filter(candidate => {
    const search = searchTerm.toLowerCase().trim();
    
    if (!search) return true;

    const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.toLowerCase();
    const email = (candidate.email_id || '').toLowerCase();
    const phone = (candidate.phone_number || '').toLowerCase();

    return (
      fullName.includes(search) ||
      email.includes(search) ||
      phone.includes(search)
    );
  });

  /* ================= 3. FORM INPUT HANDLER ================= */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /* ================= 4. SEARCH HANDLER ================= */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  /* ================= 5. RESUME AI PARSING ================= */
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setResumeFile(file);
    setParsing(true);

    try {
      const fd = new FormData();
      fd.append("resume", file);

      const res = await resumesAPI.parseResume(fd);

            setFormData(prev => ({
            ...prev,
            first_name: res.data.first_name || "",
            last_name: res.data.last_name || "",
            email_id: res.data.email_id || "",
            phone_number: res.data.phone_number || "",
            skills: Array.isArray(res.data.skills)
              ? res.data.skills.join(", ")
              : res.data.skills || "",
            experience: res.data.experience || "",
            education: Array.isArray(res.data.education)
              ? res.data.education.join(" ")
              : res.data.education || "",
          }));



      toast.success("✅ Resume parsed successfully");

    } catch (err) {
      console.error("Resume parsing failed:", err);
      toast.error("Resume parsing failed. Please fill manually.");
      // Keep file for manual upload
    } finally {
      setParsing(false);
    }
  };

  /* ================= 6. SAVE CANDIDATE + RESUME ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // STEP 1: Create candidate
      const createRes = await candidatesAPI.create(formData);
      const candidateId = createRes.data.id;
      toast.success("Candidate created successfully");

      // STEP 2: Upload resume if exists
      if (resumeFile) {
        const fd = new FormData();
        fd.append("resume", resumeFile);
        fd.append("candidate_id", candidateId);
        await resumesAPI.upload(fd);
        toast.success("Resume uploaded successfully");
      }

      // Reset form
      setShowForm(false);
      setResumeFile(null);
      setFormData({
        first_name: '',
        last_name: '',
        email_id: '',
        phone_number: '',
        skills: '',
        experience: '',
        education: '',
        position: ''
      });

      fetchCandidates(); // Refresh list

    } catch (err) {
      console.error("Failed to add candidate:", err);
      if (err.response?.status === 409) {
        toast.error('Candidate already exists with this email');
      } else {
        toast.error('Failed to save candidate');
      }
    }
  };

  /* ================= 7. DELETE CANDIDATE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    
    try {
      await candidatesAPI.delete(id);
      toast.success('Candidate deleted successfully');
      fetchCandidates();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete candidate');
    }
  };

  /* ================= 8. MAIN RENDER ================= */
  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* HEADER */}
      <div className="header">
        <div>
          <h2>👥 Candidate Management</h2>
          <p className="subtitle">Manage and track all candidates ({candidates.length})</p>
        </div>
        <button 
          className="btn primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '✚ Add Candidate'}
        </button>
      </div>

      {/* ADD CANDIDATE FORM */}
      {showForm && (
        <form className="card" onSubmit={handleSubmit}>
          <h3>📝 Add New Candidate</h3>

          {/* RESUME UPLOAD */}
          <label>📄 Upload Resume (PDF) - Auto Parse</label>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleResumeUpload}
            disabled={parsing}
          />
          {parsing && (
            <div style={{
              marginTop: '-8px',
              marginBottom: '16px',
              color: '#3B82F6',
              fontSize: '13px',
              fontFamily: "'Times New Roman', Times, serif"
            }}>
              ⏳ Parsing resume with AI...
            </div>
          )}
          {resumeFile && !parsing && (
            <div style={{
              marginTop: '-8px',
              marginBottom: '16px',
              color: '#10B981',
              fontSize: '13px',
              fontFamily: "'Times New Roman', Times, serif"
            }}>
              ✓ Selected: {resumeFile.name}
            </div>
          )}

          {/* FORM FIELDS */}
          <div className="form-grid">
                <input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First Name *"
                />

                <input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last Name"
                />

                <input
                  name="email_id"
                  value={formData.email_id}
                  onChange={handleChange}
                  placeholder="Email Address *"
                />

            <input 
              name="phone_number" 
              placeholder="Phone (+91-XXXXXXXXXX)" 
              value={formData.phone_number} 
              onChange={handleChange}
            />
            <input 
              name="skills" 
              placeholder="Skills (React, Node.js, Python)" 
              value={formData.skills} 
              onChange={handleChange}
            />
            <input 
              name="experience" 
              placeholder="Experience (5 years)" 
              value={formData.experience} 
              onChange={handleChange}
            />
            <input 
              name="education" 
              placeholder="B.Tech Computer Science" 
              value={formData.education} 
              onChange={handleChange}
            />
          </div>

          {/* POSITION DROPDOWN */}
          <label>🎯 Position</label>
          <select 
            name="position" 
            value={formData.position}
            onChange={handleChange} 
            required
          >
            <option value="">Select Position</option>
            <option value="Engineer">Software Engineer</option>
            <option value="Embedded System">Embedded System</option>
            <option value="Embedded Software">Embedded Software</option>
            <option value="Post Silicon Validation">Post Silicon Validation</option>
            <option value="VLSI">VLSI</option>
            <option value="HR">HR</option>
            <option value="Business Unit">Business Unit</option>
          </select>

          <button 
            className="btn primary" 
            type="submit"
            disabled={parsing}
            style={{marginTop: '20px'}}
          >
            {parsing ? '⏳ Saving...' : '💾 Save Candidate & Resume'}
          </button>
        </form>
      )}

      {/* CANDIDATES TABLE */}
      <div className="card">
        <div className="search-header">
          <h3>All Candidates ({filteredCandidates.length})</h3>
          
          {/* SEARCH BAR */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="🔍 Search by name, email or phone..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn" 
                  onClick={clearSearch}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* EMPTY STATE */}
        {filteredCandidates.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-icon">
              {searchTerm ? '🔍' : '👥'}
            </p>
            <p className="empty-state-text">
              {searchTerm 
                ? `No candidates found matching "${searchTerm}"` 
                : 'No candidates found. Add your first candidate!'
              }
            </p>
            {searchTerm && (
              <button className="btn outline" onClick={clearSearch} style={{marginTop: '16px'}}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          /* TABLE */
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Updated By</th>
                  <th align="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c, idx) => (
                  <tr key={c.id} style={{animationDelay: `${idx * 0.05}s`}}>
                    <td className="name">
                      <div className="avatar">
                        {(c.first_name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <strong>{c.first_name || 'Unknown'} {c.last_name || ''}</strong>
                        <div className="muted">ID #{c.id}</div>
                      </div>
                    </td>
                    <td>{c.email_id || '-'}</td>
                    <td>{c.phone_number || '-'}</td>
                    <td>
                      <span className={`status ${c.status || 'applied'}`}>
                        {c.status || 'Applied'}
                      </span>
                    </td>
                    <td>{c.updated_by_name || 'Unknown'}</td>
                    <td align="right">
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                        <button 
                          className="btn outline" 
                          onClick={() => navigate(`/candidates/${c.id}`)}
                        >
                          👁 View
                        </button>
                        <button 
                          className="btn danger" 
                          onClick={() => handleDelete(c.id)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= COMPLETE STYLES ================= */
const styles = {
  page: {
    padding: '28px',
    background: '#FFFFFF',
    minHeight: '100vh',
    fontFamily: "'Times New Roman', Times, serif",
    color: '#0F172A',
    animation: 'fadeInUp 0.6s ease-out',
  }
};

const css = `
/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 20px;
  flex-wrap: wrap;
}
.header h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'Times New Roman', Times, serif;
}
.subtitle {
  color: #64748B;
  font-size: 14px;
  margin: 4px 0 0 0;
}

/* Cards */
.card {
  background: white;
  padding: 28px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.15);
  animation: fadeInUp 0.5s ease-out;
}
.card:hover {
  box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  transform: translateY(-2px);
}

/* Search */
.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}
.search-container {
  flex: 1;
  max-width: 400px;
  min-width: 250px;
}
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.search-input {
  width: 100%;
  padding: 12px 45px 12px 16px;
  border: 2px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Times New Roman', Times, serif;
  background: #F8FAFC;
  transition: all 0.3s ease;
}
.search-input:focus {
  outline: none;
  border-color: #1E40AF;
  background: white;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}
.clear-search-btn {
  position: absolute;
  right: 12px;
  background: #E2E8F0;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 14px;
  color: #64748B;
  transition: all 0.2s ease;
}
.clear-search-btn:hover {
  background: #CBD5E1;
  color: #0F172A;
  transform: scale(1.1);
}

/* Form */
label {
  display: block;
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #0F172A;
  font-size: 14px;
}
input, select {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 2px solid #E2E8F0;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Times New Roman', Times, serif;
  transition: all 0.3s ease;
  box-sizing: border-box;
}
input:focus, select:focus {
  outline: none;
  border-color: #1E40AF;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 0;
}

/* Buttons */
.btn {
  padding: 11px 22px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Times New Roman', Times, serif;
}
.btn.primary {
  background: linear-gradient(135deg, #1E40AF, #1e3a8a);
  color: white;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
}
.btn.primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
  transform: translateY(-2px);
}
.btn.outline {
  background: transparent;
  color: #1E40AF;
  border: 2px solid #1E40AF;
  padding: 9px 16px;
  font-size: 13px;
}
.btn.outline:hover {
  background: #1E40AF;
  color: white;
}
.btn.danger {
  background: linear-gradient(135deg, #EF4444, #DC2626);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  padding: 9px 16px;
  font-size: 13px;
}
.btn.danger:hover {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #0F172A;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #E2E8F0;
  background: linear-gradient(90deg, #F8FAFC, #F0F4FF);
}
td {
  padding: 16px;
  border-bottom: 1px solid #E2E8F0;
  color: #0F172A;
  font-size: 14px;
}
.name {
  display: flex;
  gap: 12px;
  align-items: center;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1E40AF, #0EA5E9);
  color: white;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}
.status.applied { background: #EFF6FF; color: #1E40AF; }
.status.interview { background: #F0FDF4; color: #10B981; }
.status.offered { background: #DCFCE7; color: #166534; }
.status.rejected { background: #FEF2F2; color: #EF4444; }
.muted {
  color: #94A3B8;
  font-size: 12px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
}
.empty-state-icon {
  font-size: 64px;
  margin-bottom: 12px;
}
.empty-state-text {
  color: #64748B;
  font-size: 16px;
  margin: 0;
}

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .header, .search-header { flex-direction: column; align-items: stretch; }
  .form-grid { grid-template-columns: 1fr; }
  .name { flex-direction: column; align-items: flex-start; }
  th, td { padding: 12px 8px; }
}
`;
