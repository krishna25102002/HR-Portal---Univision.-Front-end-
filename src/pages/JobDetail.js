import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidatesAPI } from '../api/client';
import { toast } from 'react-toastify';
import '../pages/AnimationsAndStyles.css';

export default function JobDetail() {
  const { position } = useParams();
  const decodedPosition = decodeURIComponent(position);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCandidates = async () => {
    try {
      const res = await candidatesAPI.getAll();

      const filtered = res.data.filter(
        c =>
          (c.position || '').toLowerCase() ===
          decodedPosition.toLowerCase()
      );

      setCandidates(filtered);
    } catch {
      toast.error('Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  return (
    <div style={page}>
      <style>{css}</style>

      <div className="card">
        {/* HEADER */}
        <div className="header">
          <div>
            <h2>{decodedPosition}</h2>
            <p className="subtitle">
              {candidates.length} candidate(s) found
            </p>
          </div>

          <button className="btn outline" onClick={() => navigate('/jobs')}>
            ← Back
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <p className="loading">Loading candidates...</p>
        ) : candidates.length === 0 ? (
          <p className="empty">No candidates found for this position.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th align="right">Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(c => (
                <tr key={c.id}>
                  <td className="name">
                    <div className="avatar">
                      {(c.first_name || 'C')[0]}
                    </div>
                    <div>
                      <strong>
                        {c.first_name} {c.last_name}
                      </strong>
                      <div className="muted">ID #{c.id}</div>
                    </div>
                  </td>
                  <td>{c.email_id || '-'}</td>
                  <td>{c.phone_number || '-'}</td>
                  <td>
                    <span className={`status ${c.status}`}>
                      {c.status || 'applied'}
                    </span>
                  </td>
                  <td align="right">
                    <button
                      className="btn primary"
                      onClick={() =>
                        navigate(`/candidates/${c.id}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ================= INLINE STYLES ================= */

const page = {
  minHeight: '100vh',
  background: '#FFFFFF',
  padding: '28px',
  fontFamily: 'Inter, sans-serif',
  color: '#FFFFFF'
};

const css = `
.card {
  background: #FFFFFF;
  color: #0F172A;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 15px 32px rgba(0,0,0,0.2);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 13px;
  color: #64748B;
}

.loading,
.empty {
  padding: 40px;
  text-align: center;
  color: #64748B;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #F1F5F9;
  padding: 14px;
  text-align: left;
  font-size: 14px;
}

td {
  padding: 14px;
  border-top: 1px solid #E5E7EB;
  font-size: 14px;
}

.name {
  display: flex;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #1E40AF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.muted {
  font-size: 12px;
  color: #64748B;
}

.status {
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status.applied {
  background: #E5E7EB;
}

.status.shortlisted {
  background: #DBEAFE;
  color: #1E40AF;
}

.status.interview {
  background: #FEF3C7;
  color: #92400E;
}

.status.offered {
  background: #DCFCE7;
  color: #166534;
}

.status.rejected {
  background: #FEE2E2;
  color: #991B1B;
}

.btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  background: #1E40AF;
  color: white;
}

.outline {
  background: white;
  border: 1px solid #1E40AF;
  color: #1E40AF;
}
`;

// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { candidatesAPI } from '../api/client';
// import { toast } from 'react-toastify';

// export default function JobDetail() {
//   const { position } = useParams();
//   const decodedPosition = decodeURIComponent(position);
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchCandidates();
//   }, [position]);

//   const fetchCandidates = async () => {
//     try {
//       const res = await candidatesAPI.getAll();

//       const filtered = res.data.filter(
//         c =>
//           (c.position || '').toLowerCase() ===
//           decodedPosition.toLowerCase()
//       );

//       setCandidates(filtered);
//     } catch {
//       toast.error('Failed to fetch candidates');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="card">
//       <div className="flex-between">
//         <h2>Candidates – {decodedPosition}</h2>
//         <button onClick={() => navigate('/jobs')}>Back</button>
//       </div>

//       {loading ? (
//         <p>Loading...</p>
//       ) : candidates.length === 0 ? (
//         <p>No candidates found for this position.</p>
//       ) : (
//         <table className="table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>Email</th>
//               <th>Phone</th>
//               <th>Status</th>
//               <th>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {candidates.map(c => (
//               <tr key={c.id}>
//                 <td>{c.first_name} {c.last_name}</td>
//                 <td>{c.email_id || '-'}</td>
//                 <td>{c.phone_number || '-'}</td>
//                 <td style={{ textTransform: 'capitalize' }}>
//                   {c.status}
//                 </td>
//                 <td>
//                   <button
//                     onClick={() => navigate(`/candidates/${c.id}`)}
//                   >
//                     View
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }
