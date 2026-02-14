import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { candidatesAPI, interviewsAPI } from '../api/client';
import '../pages/AnimationsAndStyles.css';

export default function Dashboard() {
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : { name: 'User', role: 'HR' };

  const [stats, setStats] = useState({
    totalCandidates: 0,
    interviewsScheduled: 0,
    offersExtended: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('🔄 Fetching candidates and interviews...');
      const [candidatesRes, interviewsRes] = await Promise.all([
        candidatesAPI.getAll(),
        interviewsAPI.getAll()
      ]);

      console.log('✅ Candidates Response:', candidatesRes);
      console.log('✅ Interviews Response:', interviewsRes);

      const totalCandidates = candidatesRes.data ? candidatesRes.data.length : 0;
      const interviewsScheduled = interviewsRes.data ? interviewsRes.data.filter(i => i.status === 'scheduled').length : 0;
      const offersExtended = interviewsRes.data ? interviewsRes.data.filter(i => i.status === 'interview').length : 0;

      console.log('📊 Stats:', { totalCandidates, interviewsScheduled, offersExtended });

      setStats({
        totalCandidates,
        interviewsScheduled,
        offersExtended
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>
      
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📊 Dashboard</h1>
          <p style={styles.subtitle}>
            Welcome back, <strong>{user.name}</strong>
          </p>
        </div>
        <div style={styles.roleBadge}>{user.role}</div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={styles.loader}>
          <div style={styles.spinner}></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <div style={styles.grid}>
          <StatCard
            title="Total Candidates"
            value={stats.totalCandidates}
            color="#2563EB"
            icon="👥"
          />
          <StatCard
            title="Interviews Scheduled"
            value={stats.interviewsScheduled}
            color="#0EA5E9"
            icon="📅"
          />
          <StatCard
            title="In Interview Stage"
            value={stats.offersExtended}
            color="#1E40AF"
            icon="🎯"
          />
        </div>
      )}
    </div>
  );
}

/* ================= STAT CARD COMPONENT ================= */
function StatCard({ title, value, color, icon }) {
  return (
    <div style={{ ...styles.card, borderLeft: `6px solid ${color}` }}>
      <div style={styles.cardIcon}>{icon}</div>
      <h2 style={styles.cardValue}>{value}</h2>
      <p style={styles.cardTitle}>{title}</p>
    </div>
  );
}

/* ================= INLINE STYLES ================= */
const styles = {
  page: {
    minHeight: '100vh',
    background: '#FFFFFF',
    padding: '20px',
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: '12px',
    color: '#FFFFFF',
    position: 'relative',
    animation: 'fadeInUp 0.6s ease-out',
  },

  header: {
    background: '#FFFFFF',
    color: '#0F172A',
    borderRadius: '16px',
    padding: '20px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
    animation: 'fadeInDown 0.5s ease-out',
    fontFamily: "'Times New Roman', Times, serif",
  },

  title: {
    margin: 0,
    fontSize: 'var(--fs-2xl)',
    fontWeight: 'bold',
    fontFamily: "'Times New Roman', Times, serif",
  },

  subtitle: {
    marginTop: '6px',
    color: '#64748B',
    fontSize: 'var(--fs-md)',
    fontWeight: 500,
    fontFamily: "'Times New Roman', Times, serif",
  },

  roleBadge: {
    background: 'linear-gradient(135deg, #1E40AF, #1e3a8a)',
    color: '#FFFFFF',
    padding: '10px 18px',
    borderRadius: '22px',
    fontSize: 'var(--fs-sm)',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
    animation: 'slideInRight 0.5s ease-out',
    fontFamily: "'Times New Roman', Times, serif",
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    animation: 'fadeInUp 0.6s ease-out 0.1s both',
  },

  card: {
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
    color: '#0F172A',
    borderRadius: '18px',
    padding: '28px 24px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'default',
    border: '1px solid rgba(226, 232, 240, 0.6)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Times New Roman', Times, serif",
  },

  cardIcon: {
    fontSize: 'var(--fs-3xl)',
    marginBottom: '12px',
    animation: 'float 3s ease-in-out infinite',
  },

  cardValue: {
    fontSize: 'var(--fs-3xl)',
    fontWeight: 'bold',
    margin: '8px 0 12px 0',
    fontFamily: "'Times New Roman', Times, serif",
    color: '#0F172A',
  },

  cardTitle: {
    fontSize: 'var(--fs-sm)',
    color: '#64748B',
    margin: 0,
    fontWeight: 600,
    fontFamily: "'Times New Roman', Times, serif",
  },

  loader: {
    textAlign: 'center',
    padding: '80px 20px',
    fontSize: 'var(--fs-lg)',
    color: '#E5E7EB',
    animation: 'fadeInUp 0.5s ease-out',
  },

  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(226, 232, 240, 0.3)',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    margin: '0 auto 20px',
    animation: 'spin 1s linear infinite',
  },
};

const css = `
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

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(40px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-12px);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
