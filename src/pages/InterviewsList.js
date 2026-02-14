import React, { useEffect, useState } from 'react';
import {
  candidatesAPI,
  interviewsAPI,
  emailsAPI,
  interviewersAPI
} from '../api/client';
import { toast } from 'react-toastify';
import '../pages/AnimationsAndStyles.css';

/* ================= UTILITY: Convert to 12-hour format ================= */
const convert24to12 = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`;
};

const convert12to24 = (time12) => {
  if (!time12) return '';
  const [time, period] = time12.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

/* ================= CONSTANTS ================= */

const POSITIONS = [
  'All',
  'Embedded System',
  'Embedded Software',
  'Post Silicon Validation',
  'VLSI',
  'Others',
  'HR',
  'Business Unit'
];

/* ================= COMPONENT ================= */

export default function InterviewsList() {

  /* ================= STATES ================= */

  const [candidates, setCandidates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('All');
  
  // 🔹 Search State
  const [searchTerm, setSearchTerm] = useState('');

  // 🔹 Interview Type Tabs
  const [interviewCategory, setInterviewCategory] = useState('internal');

  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [interviewers, setInterviewers] = useState([]);
  const [showInterviewerModal, setShowInterviewerModal] = useState(false);

  const [newInterviewer, setNewInterviewer] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  });

  const [form, setForm] = useState({
    scheduled_date: '',
    interview_type: 'Technical',
    interviewer_name: '',
    interviewer_email: '',
    interviewer_role: '',
    interviewer_department: ''
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    fetchCandidates();
    fetchInterviewers();
  }, []);

  /* ================= API ================= */

  const fetchCandidates = async () => {
    try {
      const res = await candidatesAPI.getAll();
      setCandidates(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      toast.error('Failed to fetch candidates');
    }
  };

  const fetchInterviewers = async () => {
    try {
      const res = await interviewersAPI.getAll();
      setInterviewers(res.data);
    } catch (err) {
      console.error('Failed to load interviewers:', err);
      toast.error('Failed to load interviewers');
    }
  };

  /* ================= FILTER & SEARCH ================= */

  const applyFilters = () => {
    let result = candidates;

    // Filter by position
    if (selectedPosition !== 'All') {
      result = result.filter(c =>
        (c.position || '').toLowerCase().includes(selectedPosition.toLowerCase())
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(c => {
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const position = (c.position || '').toLowerCase();
        const status = (c.status || '').toLowerCase();

        return (
          fullName.includes(search) ||
          position.includes(search) ||
          status.includes(search)
        );
      });
    }

    setFiltered(result);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPosition, searchTerm, candidates]);

  /* ================= SEARCH HANDLERS ================= */

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  /* ================= SCHEDULE ================= */

  const openModal = (candidate) => {
    setSelectedCandidate(candidate);
    setForm({
      scheduled_date: '',
      interview_type: 'Technical',
      interviewer_name: '',
      interviewer_email: '',
      interviewer_role: '',
      interviewer_department: ''
    });
    setShowModal(true);
  };

  const scheduleInterview = async () => {
    const {
      scheduled_date,
      interviewer_name,
      interviewer_department
    } = form;

    if (!scheduled_date || !interviewer_name || !interviewer_department) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const interviewRes = await interviewsAPI.create({
        candidate_id: selectedCandidate.id,
        scheduled_date: form.scheduled_date,
        interview_type: form.interview_type,
        interviewer_name: form.interviewer_name,
        interviewer_email: form.interviewer_email,
        interviewer_role: form.interviewer_role,
        interviewer_department: form.interviewer_department
      });

      const interviewId = interviewRes.data.id;

      await emailsAPI.sendInterview({
  candidate_email: selectedCandidate.email_id,
  interviewer_email: form.interviewer_email, // 👈 CC
  scheduled_date: form.scheduled_date,
  interview_type: form.interview_type,
  interviewer: form.interviewer_name
});

//       await emailsAPI.sendInterview({
//   candidate_email: selectedCandidate.email_id,
//   scheduled_date: form.scheduled_date,
//   interview_type: form.interview_type,
//   interviewer: form.interviewer_name
// });


      await interviewsAPI.updateStatus(interviewId, {
        status: 'invitation_sent'
      });

      await fetchCandidates();

      toast.success('Interview scheduled & invitation sent');
      setShowModal(false);

    } catch (err) {
      console.error(err);
      toast.error('Interview scheduled but email failed');
    }
  };

  /* ================= INTERVIEWERS ================= */

  const addInterviewer = async () => {
    const { name, email, role, department } = newInterviewer;

    if (!name || !role || !department) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      await interviewersAPI.create({ name, email, role, department });
      setNewInterviewer({ name: '', email: '', role: '', department: '' });
      fetchInterviewers();
      toast.success('Interviewer added');
    } catch (err) {
      console.error('Failed to add interviewer:', err);
      toast.error('Failed to add interviewer');
    }
  };

  const deleteInterviewer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interviewer?')) return;
    
    try {
      await interviewersAPI.delete(id);
      fetchInterviewers();
      toast.success('Interviewer removed');
    } catch (err) {
      console.error('Failed to delete interviewer:', err);
      toast.error('Failed to delete interviewer');
    }
  };

  /* ================= UI ================= */

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.pageTitle}>Schedule Interview</h2>
          <p style={styles.pageSubtitle}>Manage candidate interview scheduling</p>
        </div>

        <button
          style={styles.manageBtn}
          onClick={() => setShowInterviewerModal(true)}
        >
          👥 Manage Interviewers
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...(interviewCategory === 'internal' ? styles.tabActive : {})
          }}
          onClick={() => setInterviewCategory('internal')}
        >
          📋 Internal Interviews
        </button>
        <button
          style={{
            ...styles.tab,
            ...(interviewCategory === 'client' ? styles.tabActive : {})
          }}
          onClick={() => setInterviewCategory('client')}
        >
          👥 Client Interviews
        </button>
      </div>

      {/* FILTER & SEARCH SECTION */}
      <div style={styles.filterSearchSection}>
        {/* Position Filter */}
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Filter by Position:</label>
          <select
            style={styles.filterSelect}
            value={selectedPosition}
            onChange={e => setSelectedPosition(e.target.value)}
          >
            {POSITIONS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Search Input */}
        <div style={styles.searchGroup}>
          <div style={styles.searchInputWrapper}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search by name, position or status..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button style={styles.clearSearchBtn} onClick={clearSearch}>
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div style={styles.resultsCount}>
        Showing <strong>{filtered.length}</strong> candidate{filtered.length !== 1 ? 's' : ''}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* TABLE OR EMPTY STATE */}
      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            {searchTerm ? '🔍' : '📭'}
          </div>
          <h3 style={styles.emptyTitle}>
            {searchTerm ? 'No Results Found' : 'No Candidates Available'}
          </h3>
          <p style={styles.emptyText}>
            {searchTerm 
              ? `No candidates found matching "${searchTerm}". Try a different search term.`
              : 'There are no candidates to schedule interviews for at this time.'}
          </p>
          {searchTerm && (
            <button style={styles.clearSearchButton} onClick={clearSearch}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Candidate Name</th>
                <th style={styles.th}>Position</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.id} style={{
                  ...styles.tableRow,
                  animationDelay: `${idx * 0.05}s`
                }}>
                  <td style={styles.td}>
                    <div style={styles.candidateCell}>
                      <div style={styles.avatar}>
                        {(c.first_name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.candidateName}>
                          {c.first_name} {c.last_name}
                        </div>
                        <div style={styles.candidateId}>ID: #{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{c.position || '—'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background:
                        c.status === 'invitation_sent' ? '#E5E7EB' :
                        c.status === 'scheduled' ? '#F3F4F6' :
                        c.status === 'interview' ? '#E5E7EB' : '#F9FAFB',
                      color: '#0F172A',
                      border: '1px solid #D1D5DB'
                    }}>
                      {c.status || 'pending'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.scheduleBtn} onClick={() => openModal(c)}>
                      📅 Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {showModal && (
        <div style={styles.backdrop}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Schedule Interview</h3>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.candidateInfo}>
                <p style={styles.infoLabel}><strong>Candidate:</strong> {selectedCandidate?.first_name} {selectedCandidate?.last_name}</p>
                <p style={styles.infoLabel}><strong>Position:</strong> {selectedCandidate?.position}</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date & Time</label>
               <input
                    type="datetime-local"
                    value={form.scheduled_date}
                    onChange={(e) =>
                      setForm(prev => ({
                        ...prev,
                        scheduled_date: e.target.value
                      }))
                    }
                  />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Interview Type</label>
                <select
                  style={styles.input}
                  value={form.interview_type}
                  onChange={e => setForm(prev => ({ ...prev, interview_type: e.target.value }))}
                >
                  <option>Technical</option>
                  <option>Non-Technical</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Department</label>
                <select
                  style={styles.input}
                  value={form.interviewer_department}
                  onChange={e => setForm(prev => ({ ...prev, interviewer_department: e.target.value }))}
                >
                  <option value="">Select Department</option>
                  {POSITIONS.filter(p => p !== 'All').map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Interviewer</label>
                <select
                  style={styles.input}
                  value={form.interviewer_name}
                  onChange={e => {
                    const interviewer = interviewers.find(i => i.name === e.target.value);
                    if (interviewer) {
                      setForm(prev => ({
                        ...prev,
                        interviewer_name: interviewer.name,
                        interviewer_email: interviewer.email || '',
                        interviewer_role: interviewer.role || '',
                        interviewer_department: interviewer.department || ''
                      }));
                    }
                  }}
                >
                  <option value="">Select Interviewer</option>
                  {interviewers.map(i => (
                    <option key={i.id} value={i.name}>{i.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.okBtn} onClick={scheduleInterview}>
                💾 Schedule & Send Email
              </button>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE INTERVIEWERS MODAL */}
      {showInterviewerModal && (
        <div style={styles.backdrop}>
          <div style={{ ...styles.modal, width: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>👥 Manage Interviewers</h3>
              <button style={styles.closeBtn} onClick={() => setShowInterviewerModal(false)}>✕</button>
            </div>

            <div style={styles.modalContent}>
              <h4 style={styles.sectionTitle}>Add New Interviewer</h4>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input
                  placeholder="Enter full name"
                  style={styles.input}
                  value={newInterviewer.name}
                  onChange={e =>
                    setNewInterviewer({ ...newInterviewer, name: e.target.value })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  style={styles.input}
                  value={newInterviewer.email}
                  onChange={e =>
                    setNewInterviewer({ ...newInterviewer, email: e.target.value })
                  }
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role *</label>
                <select
                  style={styles.input}
                  value={newInterviewer.role}
                  onChange={e =>
                    setNewInterviewer({ ...newInterviewer, role: e.target.value })
                  }
                >
                  <option value="">Select Role</option>
                  <option value="HR">HR</option>
                  <option value="Technical">Technical</option>
                  <option value="Managerial">Managerial</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Department *</label>
                <select
                  style={styles.input}
                  value={newInterviewer.department}
                  onChange={e =>
                    setNewInterviewer({ ...newInterviewer, department: e.target.value })
                  }
                >
                  <option value="">Select Department</option>
                  {POSITIONS.filter(p => p !== 'All').map(p => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              <button style={styles.addBtn} onClick={addInterviewer}>
                ➕ Add Interviewer
              </button>

              <hr style={styles.divider} />

              <div style={styles.interviewersList}>
                <h4 style={styles.sectionTitle}>Current Interviewers ({interviewers.length})</h4>
                {interviewers.length === 0 ? (
                  <p style={styles.emptyText}>No interviewers added yet</p>
                ) : (
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Email</th>
                          <th style={styles.th}>Role</th>
                          <th style={styles.th}>Department</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {interviewers.map(i => (
                          <tr key={i.id} style={styles.tableRow}>
                            <td style={styles.td}>{i.name}</td>
                            <td style={styles.td}>{i.email || '—'}</td>
                            <td style={styles.td}>{i.role || '—'}</td>
                            <td style={styles.td}>{i.department || '—'}</td>
                            <td style={styles.td}>
                              <button
                                style={styles.deleteBtn}
                                onClick={() => deleteInterviewer(i.id)}
                              >
                                🗑 Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowInterviewerModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= PROFESSIONAL BLACK & WHITE STYLES ================= */

const styles = {
  page: {
    padding: '32px',
    background: '#FFFFFF',
    minHeight: '100vh',
    fontFamily: "'Times New Roman', Times, serif",
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '2px solid #E5E7EB',
    flexWrap: 'wrap',
    gap: '16px'
  },

  pageTitle: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: '700',
    fontFamily: "'Times New Roman', Times, serif",
    color: '#0F172A'
  },

  pageSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748B',
    fontWeight: '400'
  },

  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
    borderBottom: '2px solid #E5E7EB'
  },

  tab: {
    flex: 1,
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'Times New Roman', Times, serif",
    color: '#64748B',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  tabActive: {
    color: '#0F172A',
    borderBottomColor: '#0F172A'
  },

  filterSearchSection: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },

  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#F9FAFB',
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB'
  },

  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Times New Roman', Times, serif",
    color: '#374151',
    whiteSpace: 'nowrap'
  },

  filterSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #D1D5DB',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: "'Times New Roman', Times, serif",
    cursor: 'pointer',
    background: '#FFFFFF',
    color: '#0F172A',
    minWidth: '160px'
  },

  searchGroup: {
    flex: 1,
    minWidth: '280px'
  },

  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },

  searchIcon: {
    position: 'absolute',
    left: '14px',
    fontSize: '18px',
    color: '#9CA3AF',
    pointerEvents: 'none'
  },

  searchInput: {
    width: '100%',
    padding: '12px 45px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'Times New Roman', Times, serif",
    background: '#FFFFFF',
    color: '#0F172A',
    transition: 'all 0.3s ease'
  },

  clearSearchBtn: {
    position: 'absolute',
    right: '12px',
    background: '#E5E7EB',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6B7280',
    transition: 'all 0.2s ease'
  },

  resultsCount: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '16px',
    padding: '8px 16px',
    background: '#F9FAFB',
    borderRadius: '6px',
    display: 'inline-block',
    border: '1px solid #E5E7EB'
  },

  emptyState: {
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '60px 32px',
    textAlign: 'center',
    border: '2px dashed #D1D5DB'
  },

  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.5
  },

  emptyTitle: {
    fontSize: '24px',
    color: '#0F172A',
    marginBottom: '12px',
    fontFamily: "'Times New Roman', Times, serif",
    fontWeight: '700'
  },

  emptyText: {
    fontSize: '15px',
    color: '#6B7280',
    marginBottom: '24px',
    maxWidth: '500px',
    margin: '0 auto 24px',
    lineHeight: '1.6'
  },

  clearSearchButton: {
    padding: '10px 24px',
    background: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Times New Roman', Times, serif",
    transition: 'all 0.3s ease'
  },

  tableWrapper: {
    background: '#FFFFFF',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  th: {
    padding: '16px',
    textAlign: 'left',
    background: '#F9FAFB',
    color: '#374151',
    fontWeight: '700',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: "'Times New Roman', Times, serif",
    borderBottom: '2px solid #E5E7EB'
  },

  td: {
    padding: '16px',
    borderBottom: '1px solid #F3F4F6',
    color: '#0F172A',
    fontSize: '14px',
    fontFamily: "'Times New Roman', Times, serif"
  },

  tableRow: {
    transition: 'background 0.2s ease',
    animation: 'fadeInUp 0.4s ease-out',
    cursor: 'pointer'
  },

  candidateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#0F172A',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '16px',
    flexShrink: 0
  },

  candidateName: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#0F172A'
  },

  candidateId: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '2px'
  },

  statusBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily: "'Times New Roman', Times, serif"
  },

  scheduleBtn: {
    background: '#0F172A',
    color: '#FFFFFF',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontFamily: "'Times New Roman', Times, serif",
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '13px'
  },

  manageBtn: {
    padding: '12px 24px',
    background: '#0F172A',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontFamily: "'Times New Roman', Times, serif",
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '14px'
  },

  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
    padding: '20px'
  },

  modal: {
    background: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '90vh',
    overflow: 'auto',
    animation: 'slideUp 0.3s ease',
    border: '1px solid #E5E7EB'
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #E5E7EB',
    background: '#0F172A'
  },

  modalTitle: {
    margin: 0,
    color: '#FFFFFF',
    fontSize: '20px',
    fontWeight: '700',
    fontFamily: "'Times New Roman', Times, serif"
  },

  closeBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '20px',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.3s ease'
  },

  modalContent: {
    padding: '28px 24px',
    color: '#0F172A'
  },

  candidateInfo: {
    background: '#F9FAFB',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    border: '1px solid #E5E7EB'
  },

  infoLabel: {
    margin: '6px 0',
    fontSize: '14px',
    color: '#374151',
    fontFamily: "'Times New Roman', Times, serif"
  },

  formGroup: {
    marginBottom: '20px'
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    fontFamily: "'Times New Roman', Times, serif"
  },

  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: "'Times New Roman', Times, serif",
    boxSizing: 'border-box',
    transition: 'all 0.3s ease'
  },

  modalFooter: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    padding: '20px 24px',
    borderTop: '1px solid #E5E7EB',
    background: '#F9FAFB'
  },

  okBtn: {
    background: '#0F172A',
    color: '#FFFFFF',
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Times New Roman', Times, serif",
    transition: 'all 0.3s ease'
  },

  cancelBtn: {
    background: '#E5E7EB',
    color: '#374151',
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Times New Roman', Times, serif",
    transition: 'all 0.3s ease'
  },

  addBtn: {
    width: '100%',
    background: '#0F172A',
    color: '#FFFFFF',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Times New Roman', Times, serif",
    transition: 'all 0.3s ease'
  },

  deleteBtn: {
    background: '#0F172A',
    color: '#FFFFFF',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: "'Times New Roman', Times, serif",
    transition: 'all 0.3s ease'
  },

  divider: {
    border: 'none',
    borderTop: '1px solid #E5E7EB',
    margin: '28px 0'
  },

  interviewersList: {
    marginTop: '20px'
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: '16px',
    fontFamily: "'Times New Roman', Times, serif"
  }
};
