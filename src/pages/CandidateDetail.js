import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidatesAPI } from '../api/client';
import { toast } from 'react-toastify';
import '../pages/AnimationsAndStyles.css';

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */

  const fetchCandidate = async () => {
    setLoading(true);
    try {
      const res = await candidatesAPI.getById(id);
      setCandidate(res.data);
      setFormData(res.data);
    } catch (err) {
      console.error('Failed to fetch candidate:', err);
      toast.error('Failed to fetch candidate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ================= CHANGE ================= */

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    try {
      await candidatesAPI.update(id, {
        ...formData,
        note,
      });

      toast.success('Candidate updated successfully');
      setEditMode(false);
      setNote('');
      fetchCandidate();
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Update failed');
    }
  };

  /* ================= LOADING STATE ================= */

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="candidate-detail-page">
          <div className="candidate-card loading-card">
            <div className="loading-spinner">⏳</div>
            <h3>Loading candidate details...</h3>
          </div>
        </div>
      </>
    );
  }

  if (!candidate) {
    return (
      <>
        <style>{css}</style>
        <div className="candidate-detail-page">
          <div className="candidate-card">
            <p>Candidate not found</p>
            <button onClick={() => navigate('/candidates')}>⬅ Back to List</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ================= INLINE CSS ================= */}
      <style>{css}</style>

      <div className="candidate-detail-page">
        <div className="candidate-card">

          {/* ================= HEADER ================= */}
          <div className="card-header">
            <div className="header-left">
              <div className="avatar-large">
                {(candidate.first_name || 'C')[0].toUpperCase()}
              </div>
              <div className="header-info">
                {editMode ? (
                  <div className="name-edit-group">
                    <input
                      name="first_name"
                      value={formData.first_name || ''}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="name-input"
                    />
                    <input
                      name="last_name"
                      value={formData.last_name || ''}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="name-input"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="candidate-name">
                      {candidate.first_name} {candidate.last_name}
                    </h1>
                    <p className="candidate-id">ID: #{candidate.id}</p>
                  </>
                )}
              </div>
            </div>

            <div className="header-actions">
              <button className="btn-back" onClick={() => navigate('/candidates')}>
                ⬅ Back
              </button>

              {!editMode ? (
                <button className="btn-edit" onClick={() => setEditMode(true)}>
                  ✏️ Edit
                </button>
              ) : (
                <>
                  <button className="btn-save" onClick={handleSave}>
                    💾 Save
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setEditMode(false);
                      setFormData(candidate);
                      setNote('');
                    }}
                  >
                    ✖ Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ================= META INFO ================= */}
          <div className="meta-info-section">
            <div className="meta-item">
              <span className="meta-icon">👤</span>
              <div>
                <span className="meta-label">Updated By</span>
                <span className="meta-value">{candidate.updated_by_name || '—'}</span>
              </div>
            </div>
            <div className="meta-divider"></div>
            <div className="meta-item">
              <span className="meta-icon">🕒</span>
              <div>
                <span className="meta-label">Last Updated</span>
                <span className="meta-value">
                  {candidate.updated_at
                    ? new Date(candidate.updated_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* ================= CONTACT INFORMATION ================= */}
          <div className="section">
            <h3 className="section-title">📧 Contact Information</h3>
            <div className="section-grid">
              {renderField('Email Address', 'email_id', false, '✉️')}
              {renderField('Phone Number', 'phone_number', false, '📱')}
            </div>
          </div>

          {/* ================= PROFESSIONAL DETAILS ================= */}
          <div className="section">
            <h3 className="section-title">💼 Professional Details</h3>
            <div className="section-grid">
              {renderPositionField()}
              {renderStatusField()}
              {renderField('Current Employer', 'custom_current_employer', false, '🏢')}
              {renderField('Total Experience', 'custom_overall_experience_years', false, '⏱️', ' years')}
              {renderField('Relevant Experience', 'custom_relevant_experience_years', false, '🎯', ' years')}
              {renderField('Notice Period', 'notice_period', false, '📅', ' days')}
            </div>
          </div>

          {/* ================= COMPENSATION ================= */}
          <div className="section">
            <h3 className="section-title">💰 Compensation</h3>
            <div className="section-grid">
              {renderField('Current Salary', 'custom_current_salary_lpa', false, '💵', ' LPA')}
              {renderField('Expected Salary', 'custom_expected_salary_lpa', false, '💸', ' LPA')}
            </div>
          </div>

          {/* ================= SKILLS & EDUCATION ================= */}
          <div className="section">
            <h3 className="section-title">🎓 Skills & Education</h3>
            <div className="section-grid-full">
              {renderField('Skills', 'skills', true, '⚡')}
              {renderField('Education', 'education', true, '🎓')}
            </div>
          </div>

          {/* ================= HR NOTE ================= */}
          {editMode && (
            <div className="note-section">
              <h3 className="section-title">📝 HR Note</h3>
              <textarea
                className="note-textarea"
                rows={4}
                placeholder="Add a note about this update (optional)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );

  /* ================= HELPERS ================= */

  function renderField(label, name, textarea = false, icon = '', suffix = '') {
    return (
      <div className="detail-field">
        <label className="field-label">
          {icon && <span className="field-icon">{icon}</span>}
          {label}
        </label>
        {editMode ? (
          textarea ? (
            <textarea
              name={name}
              value={formData[name] || ''}
              onChange={handleChange}
              rows={3}
              className="field-textarea"
            />
          ) : (
            <input
              name={name}
              value={formData[name] || ''}
              onChange={handleChange}
              className="field-input"
            />
          )
        ) : (
          <div className="field-value">
            {candidate[name] ? `${candidate[name]}${suffix}` : '—'}
          </div>
        )}
      </div>
    );
  }

  function renderPositionField() {
    return (
      <div className="detail-field">
        <label className="field-label">
          <span className="field-icon">💼</span>
          Position
        </label>
        {editMode ? (
          <select
            name="position"
            value={formData.position || ''}
            onChange={handleChange}
            className="field-select"
          >
            <option value="">Select Position</option>
            <option value="Software Engineer">Software Engineer</option>
            <option value="Embedded System">Embedded System</option>
            <option value="Embedded Software">Embedded Software</option>
            <option value="Post Silicon Validation">Post Silicon Validation</option>
            <option value="VLSI">VLSI</option>
            <option value="HR">HR</option>
            <option value="Business Unit">Business Unit</option>
            <option value="Others">Others</option>
          </select>
        ) : (
          <div className="field-value position-badge">
            {candidate.position || '—'}
          </div>
        )}
      </div>
    );
  }

  function renderStatusField() {
    return (
      <div className="detail-field">
        <label className="field-label">
          <span className="field-icon">📊</span>
          Status
        </label>
        {editMode ? (
          <select
            name="status"
            value={formData.status || 'applied'}
            onChange={handleChange}
            className="field-select"
          >
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="invitation_sent">Invitation Sent</option>
            <option value="hold">Hold</option>
            <option value="offered">Offered</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        ) : (
          <span className={`status-badge status-${candidate.status}`}>
            {candidate.status || 'applied'}
          </span>
        )}
      </div>
    );
  }
}

/* ================= PROFESSIONAL INLINE CSS ================= */

const css = `
/* ================= PAGE LAYOUT ================= */

.candidate-detail-page {
  min-height: 100vh;
  background: #F8FAFC;
  padding: 32px;
  font-family: 'Times New Roman', Times, serif;
  animation: fadeIn 0.5s ease-out;
}

.candidate-card {
  background: #FFFFFF;
  max-width: 1200px;
  margin: 0 auto;
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.12);
  overflow: hidden;
  animation: slideUp 0.6s ease-out;
}

.loading-card {
  text-align: center;
  padding: 60px 32px;
}

.loading-spinner {
  font-size: 48px;
  margin-bottom: 16px;
  animation: spin 2s linear infinite;
}

/* ================= HEADER ================= */

.card-header {
  background: linear-gradient(135deg, #1E40AF, #1e3a8a);
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  gap: 20px;
  flex-wrap: wrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6, #0EA5E9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: bold;
  color: white;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.header-info {
  flex: 1;
}

.candidate-name {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: white;
  font-family: 'Times New Roman', Times, serif;
}

.candidate-id {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.name-edit-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.name-input {
  padding: 10px 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-family: 'Times New Roman', Times, serif;
  min-width: 150px;
}

.name-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.name-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.6);
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ================= BUTTONS ================= */

button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  font-family: 'Times New Roman', Times, serif;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-back {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-edit {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-edit:hover {
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.btn-save {
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-save:hover {
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  transform: translateY(-2px);
}

.btn-cancel {
  background: linear-gradient(135deg, #EF4444, #DC2626);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-cancel:hover {
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

/* ================= META INFO ================= */

.meta-info-section {
  display: flex;
  padding: 24px 32px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  gap: 32px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-icon {
  font-size: 24px;
}

.meta-label {
  display: block;
  font-size: 12px;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.meta-value {
  display: block;
  font-size: 14px;
  color: #0F172A;
  font-weight: 500;
  margin-top: 2px;
}

.meta-divider {
  width: 1px;
  height: 40px;
  background: #CBD5E1;
}

/* ================= SECTIONS ================= */

.section {
  padding: 32px;
  border-bottom: 1px solid #E2E8F0;
}

.section:last-child {
  border-bottom: none;
}

.section-title {
  margin: 0 0 24px 0;
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  font-family: 'Times New Roman', Times, serif;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.section-grid-full {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

/* ================= FIELDS ================= */

.detail-field {
  animation: fadeInUp 0.4s ease-out;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  font-family: 'Times New Roman', Times, serif;
}

.field-icon {
  font-size: 16px;
}

.field-value {
  padding: 12px 16px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 15px;
  color: #0F172A;
  font-weight: 500;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.field-input,
.field-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #CBD5E1;
  border-radius: 8px;
  font-size: 15px;
  font-family: 'Times New Roman', Times, serif;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.field-input:focus,
.field-select:focus {
  outline: none;
  border-color: #1E40AF;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.field-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #CBD5E1;
  border-radius: 8px;
  font-size: 15px;
  font-family: 'Times New Roman', Times, serif;
  transition: all 0.3s ease;
  resize: vertical;
  box-sizing: border-box;
}

.field-textarea:focus {
  outline: none;
  border-color: #1E40AF;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

/* ================= BADGES ================= */

.position-badge {
  background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
  color: #1E40AF;
  font-weight: 600;
  border: 1px solid #BFDBFE;
}

.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;
  font-family: 'Times New Roman', Times, serif;
}

.status-badge.status-applied {
  background: #EFF6FF;
  color: #1E40AF;
  border: 1px solid #BFDBFE;
}

.status-badge.status-shortlisted {
  background: #FEF3C7;
  color: #92400E;
  border: 1px solid #FCD34D;
}

.status-badge.status-interview {
  background: #DBEAFE;
  color: #1E3A8A;
  border: 1px solid #93C5FD;
}

.status-badge.status-offered {
  background: #D1FAE5;
  color: #065F46;
  border: 1px solid #6EE7B7;
}

.status-badge.status-rejected {
  background: #FEE2E2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

/* ================= NOTE SECTION ================= */

.note-section {
  padding: 32px;
  background: #FFFBEB;
  border-top: 3px solid #FCD34D;
}

.note-textarea {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #FCD34D;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Times New Roman', Times, serif;
  background: white;
  resize: vertical;
  box-sizing: border-box;
}

.note-textarea:focus {
  outline: none;
  border-color: #F59E0B;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.note-textarea::placeholder {
  color: #94A3B8;
}

/* ================= ANIMATIONS ================= */

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ================= RESPONSIVE ================= */

@media (max-width: 768px) {
  .candidate-detail-page {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
    justify-content: center;
  }

  .candidate-name {
    font-size: 24px;
  }

  .avatar-large {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }

  .section {
    padding: 24px 20px;
  }

  .section-grid {
    grid-template-columns: 1fr;
  }

  .meta-info-section {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
    gap: 16px;
  }

  .meta-divider {
    display: none;
  }

  .name-edit-group {
    flex-direction: column;
    width: 100%;
  }

  .name-input {
    width: 100%;
  }
}
`;

/* fallback inline style */
const styles = {
  card: {
    padding: '20px'
  }
};

// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { candidatesAPI } from '../api/client';
// import { toast } from 'react-toastify';
// import '../pages/AnimationsAndStyles.css';

// export default function CandidateDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [candidate, setCandidate] = useState(null);
//   const [editMode, setEditMode] = useState(false);
//   const [formData, setFormData] = useState({});
//   const [note, setNote] = useState('');

//   /* ================= FETCH ================= */

//   const fetchCandidate = async () => {
//     try {
//       const res = await candidatesAPI.getById(id);
//       setCandidate(res.data);
//       setFormData(res.data);
//     } catch {
//       toast.error('Failed to fetch candidate');
//     }
//   };

//   useEffect(() => {
//     fetchCandidate();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   /* ================= CHANGE ================= */

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   /* ================= SAVE ================= */

//   const handleSave = async () => {
//     try {
//       await candidatesAPI.update(id, {
//         ...formData,
//         note,
//       });

//       toast.success('Candidate updated successfully');
//       setEditMode(false);
//       setNote('');
//       fetchCandidate();
//     } catch {
//       toast.error('Update failed');
//     }
//   };

//   if (!candidate) return <div style={styles.card}>Loading...</div>;

//   return (
//     <>
//       {/* ================= INLINE CSS ================= */}
//       <style>{css}</style>

//       <div className="candidate-card">

//         {/* ================= HEADER ================= */}
//         <div className="header">
//           <div>
//             {editMode ? (
//               <div className="name-edit">
//                 <input
//                   name="first_name"
//                   value={formData.first_name || ''}
//                   onChange={handleChange}
//                   placeholder="First Name"
//                 />
//                 <input
//                   name="last_name"
//                   value={formData.last_name || ''}
//                   onChange={handleChange}
//                   placeholder="Last Name"
//                 />
//               </div>
//             ) : (
//               <h2>{candidate.first_name} {candidate.last_name}</h2>
//             )}
//           </div>

//           <div className="actions">
//             <button onClick={() => navigate('/candidates')}>⬅ Back</button>

//             {!editMode ? (
//               <button className="primary" onClick={() => setEditMode(true)}>
//                 ✏ Edit
//               </button>
//             ) : (
//               <>
//                 <button className="success" onClick={handleSave}>💾 Save</button>
//                 <button
//                   className="danger"
//                   onClick={() => {
//                     setEditMode(false);
//                     setFormData(candidate);
//                     setNote('');
//                   }}
//                 >
//                   ✖ Cancel
//                 </button>
//               </>
//             )}
//           </div>
//         </div>

//         {/* ================= META ================= */}
//         <div className="meta">
//           <span><strong>Updated By:</strong> {candidate.updated_by_name || '—'}</span>
//           <span>
//             <strong>Updated At:</strong>{' '}
//             {candidate.updated_at
//               ? new Date(candidate.updated_at).toLocaleString()
//               : '—'}
//           </span>
//         </div>

//         {/* ================= FORM GRID ================= */}
//         <div className="grid">
//           {renderField('Email', 'email_id')}
//           {renderField('Phone', 'phone_number')}
//           {renderField('Skills', 'skills', true)}
//           {renderField('Education', 'education', true)}
//           {renderField('Current Employer', 'custom_current_employer')}
//           {renderField('Total Experience (Years)', 'custom_overall_experience_years')}
//           {renderField('Relevant Experience (Years)', 'custom_relevant_experience_years')}
//           {renderField('Current Salary (LPA)', 'custom_current_salary_lpa')}
//           {renderField('Expected Salary (LPA)', 'custom_expected_salary_lpa')}
//           {renderField('Notice Period (Days)', 'notice_period')}
//           {renderPositionField()}
//           {renderStatusField()}
//         </div>

//         {/* ================= HR NOTE ================= */}
//         {editMode && (
//           <div className="note-section">
//             <label>HR Note</label>
//             <textarea
//               rows={3}
//               placeholder="Reason for update (optional)"
//               value={note}
//               onChange={(e) => setNote(e.target.value)}
//             />
//           </div>
//         )}
//       </div>
//     </>
//   );

//   /* ================= HELPERS ================= */

//   function renderField(label, name, textarea = false) {
//     return (
//       <div className="field">
//         <label>{label}</label>
//         {editMode ? (
//           textarea ? (
//             <textarea
//               name={name}
//               value={formData[name] || ''}
//               onChange={handleChange}
//               rows={3}
//             />
//           ) : (
//             <input
//               name={name}
//               value={formData[name] || ''}
//               onChange={handleChange}
//             />
//           )
//         ) : (
//           <div className="value">{candidate[name] || '—'}</div>
//         )}
//       </div>
//     );
//   }

//   function renderPositionField() {
//     return (
//       <div className="field">
//         <label>Position</label>
//         {editMode ? (
//           <select
//             name="position"
//             value={formData.position || ''}
//             onChange={handleChange}
//           >
//             <option value="">Select</option>
//             <option value="Embedded System">Embedded System</option>
//             <option value="Embedded Software">Embedded Software</option>
//             <option value="Post Silicon Validation">Post Silicon Validation</option>
//             <option value="VLSI">VLSI</option>
//             <option value="HR">HR</option>
//             <option value="Business Unit">Business Unit</option>
//             <option value="Others">Others</option>
//           </select>
//         ) : (
//           <div className="value">{candidate.position || '—'}</div>
//         )}
//       </div>
//     );
//   }

//   function renderStatusField() {
//     return (
//       <div className="field">
//         <label>Status</label>
//         {editMode ? (
//           <select
//             name="status"
//             value={formData.status || 'applied'}
//             onChange={handleChange}
//           >
//             <option value="applied">Applied</option>
//             <option value="shortlisted">Shortlisted</option>
//             <option value="interview">Interview</option>
//             <option value="offered">Offered</option>
//             <option value="rejected">Rejected</option>
//           </select>
//         ) : (
//           <span className={`status ${candidate.status}`}>
//             {candidate.status}
//           </span>
//         )}
//       </div>
//     );
//   }
// }

// /* ================= INLINE CSS STRING ================= */

// const css = `
// .candidate-card {
//   background: #fff;
//   padding: 24px;
//   max-width: 1100px;
//   margin: auto;
//   border-radius: 10px;
//   box-shadow: 0 6px 16px rgba(0,0,0,0.08);
// }

// .header {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
// }

// .name-edit input {
//   width: 160px;
//   margin-right: 8px;
// }

// .actions button {
//   margin-left: 8px;
// }

// .meta {
//   margin: 14px 0 22px;
//   font-size: var(--fs-md);
//   color: #555;
//   display: flex;
//   gap: 24px;
// }

// .grid {
//   display: grid;
//   grid-template-columns: repeat(2, 1fr);
//   gap: 18px;
// }

// .field label {
//   font-size: var(--fs-xs);
//   color: #666;
//   margin-bottom: 4px;
// }

// .field input,
// .field textarea,
// .field select {
//   padding: 7px;
//   border-radius: 5px;
//   border: 1px solid #ccc;
//   font-size: var(--fs-md);
// }

// .value {
//   padding: 6px 0;
// }

// .note-section {
//   margin-top: 24px;
// }

// .note-section textarea {
//   width: 100%;
//   padding: 8px;
// }

// /* Buttons */
// button {
//   padding: 6px 12px;
//   border-radius: 5px;
//   border: none;
//   cursor: pointer;
// }

// .primary { background: #1976d2; color: #fff; }
// .success { background: #2e7d32; color: #fff; }
// .danger { background: #d32f2f; color: #fff; }

// /* Status Badge */
// .status {
//   padding: 4px 10px;
//   border-radius: 12px;
//   font-size: var(--fs-xs);
//   display: inline-block;
//   text-transform: capitalize;
// }

// .status.applied { background: #e3f2fd; }
// .status.shortlisted { background: #fff3cd; }
// .status.interview { background: #d1ecf1; }
// .status.offered { background: #d4edda; }
// .status.rejected { background: #f8d7da; }
// `;

// /* fallback inline style */
// const styles = {
//   card: {
//     padding: '20px'
//   }
// };
