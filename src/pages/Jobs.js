import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidatesAPI } from '../api/client';
import { toast } from 'react-toastify';
import '../pages/AnimationsAndStyles.css';

const POSITIONS = [
  'Engineer',
  'Embedded System',
  'Embedded Software',
  'Post Silicon Validation',
  'VLSI',
  'Others',
  'HR',
  'Business Unit'
];

export default function Jobs() {
  const [counts, setCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await candidatesAPI.getAll();
      const map = {};
      POSITIONS.forEach(p => (map[p] = 0));

      res.data.forEach(c => {
        if (c.position && map[c.position] !== undefined) {
          map[c.position]++;
        }
      });

      setCounts(map);
    } catch {
      toast.error('Failed to load job counts');
    }
  };

  return (
    <div style={page}>
      <style>{css}</style>

      {/* HEADER */}
      <div className="header">
        <div>
          <h2>🏢 Job Positions</h2>
          <p className="subtitle">Candidates grouped by role</p>
        </div>
      </div>

      {/* GRID */}
      <div className="grid">
        {POSITIONS.map((pos, idx) => (
          <div
            key={pos}
            className="job-card"
            onClick={() => navigate(`/jobs/${encodeURIComponent(pos)}`)}
            style={{animationDelay: `${idx * 0.08}s`}}
          >
            <div className="job-card-header">
              <h3>{pos}</h3>
              <span className="job-badge">{counts[pos] || 0}</span>
            </div>
            <p className="job-subtitle">candidates available</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= INLINE STYLES ================= */

const page = {
  minHeight: '100vh',
  background: '#FFFFFF',
  padding: '28px',
  fontFamily: "'Times New Roman', Times, serif",
  fontSize: '15px',
  color: '#FFFFFF',
  animation: 'fadeInUp 0.6s ease-out',
};

const css = `
.header {
  margin-bottom: 32px;
  animation: fadeInDown 0.5s ease-out;
}

.header h2 {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 8px 0;
  font-family: 'Times New Roman', Times, serif;
}

.subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
  font-family: 'Times New Roman', Times, serif;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.job-card {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
  color: #0F172A;
  padding: 28px;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(0,0,0,0.15);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 6px solid #1E40AF;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.5s ease-out;
  font-family: 'Times New Roman', Times, serif;
}

.job-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: right 0.5s ease;
}

.job-card:hover::before {
  right: 100%;
}

.job-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.25);
  border-left-color: #0EA5E9;
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.job-card h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  flex: 1;
  font-family: 'Times New Roman', Times, serif;
}

.job-badge {
  background: linear-gradient(135deg, #1E40AF, #1e3a8a);
  color: white;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  font-family: 'Times New Roman', Times, serif;
  min-width: 32px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  animation: scaleIn 0.4s ease-out;
}

.job-subtitle {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 500;
  color: #64748B;
  font-family: 'Times New Roman', Times, serif;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .header h2 {
    font-size: 24px;
  }
}
`;

// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { candidatesAPI } from '../api/client';
// import { toast } from 'react-toastify';

// const POSITIONS = [
//   'Embedded System',
//   'Embedded Software',
//   'Post Silicon Validation',
//   'VLSI',
//   'Others',
//   'HR',
//   'Business Unit'
// ];

// export default function Jobs() {
//   const [counts, setCounts] = useState({});
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchCounts();
//   }, []);

//   const fetchCounts = async () => {
//     try {
//       const res = await candidatesAPI.getAll();
//       const map = {};

//       POSITIONS.forEach(p => (map[p] = 0));

//       res.data.forEach(c => {
//         if (c.position && map[c.position] !== undefined) {
//           map[c.position]++;
//         }
//       });

//       setCounts(map);
//     } catch {
//       toast.error('Failed to load job counts');
//     }
//   };

//   return (
//     <div className="card">
//       <h2>Jobs</h2>

//       <div style={gridStyle}>
//         {POSITIONS.map(pos => (
//           <div
//             key={pos}
//             style={jobCard}
//             onClick={() =>
//               navigate(`/jobs/${encodeURIComponent(pos)}`)
//             }
//           >
//             <h3>{pos}</h3>
//             <p style={countStyle}>{counts[pos] || 0} Candidates</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* ================= STYLES ================= */

// const gridStyle = {
//   display: 'grid',
//   gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
//   gap: 16
// };

// const jobCard = {
//   background: '#f8fbff',
//   padding: 20,
//   borderRadius: 8,
//   cursor: 'pointer',
//   border: '1px solid #e0e0e0',
//   transition: '0.2s',
// };

// const countStyle = {
//   marginTop: 10,
//   fontWeight: 'bold',
//   color: '#007bff'
// };
