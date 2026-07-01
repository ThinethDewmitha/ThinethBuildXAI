import React, { useState, useEffect } from 'react';
import {
    getAdminStats, getAdminUsers, getAdminProjects,
    updateAdminUser, deleteAdminUser, updateAdminProject, deleteAdminProject,
    getAdminUser
} from '../services/api';

export default function AdminDashboard({ onBack }) {
    const [tab, setTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            if (tab === 'overview' || !stats) {
                const s = await getAdminStats();
                setStats(s.stats);
            }
            if (tab === 'users') {
                const u = await getAdminUsers();
                setUsers(u.users);
            }
            if (tab === 'projects') {
                const p = await getAdminProjects();
                setProjects(p.projects);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await updateAdminUser(userId, { status: newStatus });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        } catch (err) { setError(err.message); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Delete this user and all their projects? This cannot be undone.')) return;
        try {
            await deleteAdminUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err) { setError(err.message); }
    };

    const handleUpdateProjectStatus = async (projId, newStatus) => {
        try {
            await updateAdminProject(projId, { status: newStatus });
            setProjects(prev => prev.map(p => p.id === projId ? { ...p, status: newStatus } : p));
        } catch (err) { setError(err.message); }
    };

    const handleDeleteProject = async (projId) => {
        if (!window.confirm('Delete this project? This cannot be undone.')) return;
        try {
            await deleteAdminProject(projId);
            setProjects(prev => prev.filter(p => p.id !== projId));
        } catch (err) { setError(err.message); }
    };

    const viewUserDetails = async (userId) => {
        try {
            const data = await getAdminUser(userId);
            setSelectedUser(data);
        } catch (err) { setError(err.message); }
    };

    return (
        <div className="admin-container animate-in">
            <div className="admin-top-bar">
                <div>
                    <button className="btn btn-secondary" onClick={onBack}>← Back to App</button>
                    <h2>Admin Dashboard</h2>
                    <p>Manage users, projects, and monitor activity</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                {[['overview', '📊 Overview'], ['users', '👥 Users'], ['projects', '📁 Projects']].map(([key, label]) => (
                    <button key={key} className={`admin-tab ${tab === key ? 'active' : ''}`} onClick={() => { setTab(key); setSelectedUser(null); setSelectedProject(null); }}>
                        {label}
                    </button>
                ))}
            </div>

            {error && <div className="admin-error">❌ {error}</div>}

            {/* Overview Tab */}
            {tab === 'overview' && stats && (
                <div className="admin-stats-grid">
                    <div className="glass-card stat-card"><div className="stat-icon blue">👥</div><div className="stat-val">{stats.totalUsers}</div><div className="stat-label">Total Users</div></div>
                    <div className="glass-card stat-card"><div className="stat-icon green">✅</div><div className="stat-val">{stats.activeUsers}</div><div className="stat-label">Active Users</div></div>
                    <div className="glass-card stat-card"><div className="stat-icon amber">📁</div><div className="stat-val">{stats.totalProjects}</div><div className="stat-label">Total Projects</div></div>
                    <div className="glass-card stat-card"><div className="stat-icon purple">🏗️</div><div className="stat-val">{stats.completedProjects}</div><div className="stat-label">Completed</div></div>
                </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && !selectedUser && (
                <div className="glass-card admin-card">
                    {loading ? <div className="admin-loading">Loading users...</div> : (
                        <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                    <th>Projects</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No users yet.</td></tr>
                                ) : users.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{u.name} {u.isAdmin ? '👑' : ''}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                        </td>
                                        <td>{u.phone || '—'}</td>
                                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.address || '—'}</td>
                                        <td><span className="project-count">{u.project_count}</span></td>
                                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge ${u.status}`}>{u.status}</span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-mini" onClick={() => viewUserDetails(u.id)}>👁️</button>
                                                <button className="btn-mini" onClick={() => handleToggleUserStatus(u.id, u.status)}>
                                                    {u.status === 'active' ? '🚫' : '✅'}
                                                </button>
                                                {!u.isAdmin && <button className="btn-mini danger" onClick={() => handleDeleteUser(u.id)}>🗑️</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            )}

            {/* User Detail View */}
            {tab === 'users' && selectedUser && (
                <div className="user-detail-view">
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>← Back to Users</button>
                    <div className="glass-card user-detail-card">
                        <div className="user-detail-header">
                            <div className="user-avatar">{selectedUser.user.name?.charAt(0)?.toUpperCase() || '?'}</div>
                            <div>
                                <h3>{selectedUser.user.name} {selectedUser.user.isAdmin ? '👑 Admin' : ''}</h3>
                                <p>{selectedUser.user.email}</p>
                            </div>
                        </div>
                        <div className="user-detail-grid">
                            <div className="detail-item"><span className="detail-label">Phone</span><span>{selectedUser.user.phone || '—'}</span></div>
                            <div className="detail-item"><span className="detail-label">Address</span><span>{selectedUser.user.address || '—'}</span></div>
                            <div className="detail-item"><span className="detail-label">Status</span><span className={`status-badge ${selectedUser.user.status}`}>{selectedUser.user.status}</span></div>
                            <div className="detail-item"><span className="detail-label">Joined</span><span>{new Date(selectedUser.user.created_at).toLocaleDateString()}</span></div>
                        </div>

                        <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Projects ({selectedUser.projects.length})</h4>
                        {selectedUser.projects.length === 0 ? (
                            <p className="text-muted">No projects yet.</p>
                        ) : (
                            <div className="user-projects-list">
                                {selectedUser.projects.map(p => (
                                    <div key={p.id} className="glass-card project-mini-card" onClick={() => setSelectedProject(p)}>
                                        <div className="project-mini-name">{p.project_name}</div>
                                        <div className="project-mini-meta">
                                            {p.specs?.length}×{p.specs?.width} {p.specs?.unit} • {p.specs?.floors} floor{p.specs?.floors > 1 ? 's' : ''} • {new Date(p.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Projects Tab */}
            {tab === 'projects' && !selectedProject && (
                <div className="glass-card admin-card">
                    {loading ? <div className="admin-loading">Loading projects...</div> : (
                        <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>User</th>
                                    <th>Dimensions</th>
                                    <th>Floors</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No projects yet.</td></tr>
                                ) : projects.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600 }}>{p.project_name}</td>
                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>{p.user_name || '—'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{p.user_email || ''}</div>
                                        </td>
                                        <td>{p.specs?.length}×{p.specs?.width} {p.specs?.unit}</td>
                                        <td>{p.specs?.floors || '—'}</td>
                                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <select className="status-select" value={p.status} onChange={(e) => handleUpdateProjectStatus(p.id, e.target.value)}>
                                                <option value="completed">Completed</option>
                                                <option value="pending">Pending Review</option>
                                                <option value="reviewed">Reviewed</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-mini" onClick={() => setSelectedProject(p)}>👁️</button>
                                                <button className="btn-mini danger" onClick={() => handleDeleteProject(p.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            )}

            {/* Project Detail Modal */}
            {selectedProject && (
                <div className="project-detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedProject(null); }}>
                    <div className="glass-card project-detail-modal">
                        <div className="modal-top-bar">
                            <h3>📁 {selectedProject.project_name}</h3>
                            <button className="btn-mini" onClick={() => setSelectedProject(null)}>✕</button>
                        </div>

                        <div className="project-detail-body">
                            {/* Specs */}
                            <div className="detail-section">
                                <h4>📐 Building Specifications</h4>
                                <div className="detail-grid">
                                    <div className="detail-item"><span className="detail-label">Dimensions</span><span>{selectedProject.specs?.length}×{selectedProject.specs?.width} {selectedProject.specs?.unit}</span></div>
                                    <div className="detail-item"><span className="detail-label">Height</span><span>{selectedProject.specs?.totalHeight} {selectedProject.specs?.unit}</span></div>
                                    <div className="detail-item"><span className="detail-label">Floors</span><span>{selectedProject.specs?.floors}</span></div>
                                    <div className="detail-item"><span className="detail-label">Wall Type</span><span>{selectedProject.specs?.wallType}</span></div>
                                    <div className="detail-item"><span className="detail-label">Wall Thickness</span><span>{selectedProject.specs?.wallThickness}mm</span></div>
                                </div>
                                {selectedProject.specs?.description && (
                                    <div className="detail-desc">
                                        <span className="detail-label">Description</span>
                                        <p>{selectedProject.specs.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* AI Analysis Summary */}
                            {selectedProject.ai_analysis && Object.keys(selectedProject.ai_analysis).length > 0 && (
                                <div className="detail-section">
                                    <h4>🤖 AI Analysis</h4>
                                    {selectedProject.ai_analysis.siteAssessment && (
                                        <div className="detail-desc">
                                            <span className="detail-label">Soil Assessment</span>
                                            <p>{selectedProject.ai_analysis.siteAssessment.soilNature}</p>
                                        </div>
                                    )}
                                    {selectedProject.ai_analysis.foundationEngineering && (
                                        <div className="detail-grid">
                                            <div className="detail-item"><span className="detail-label">Foundation</span><span>{selectedProject.ai_analysis.foundationEngineering.recommendedType}</span></div>
                                            <div className="detail-item"><span className="detail-label">Depth</span><span>{selectedProject.ai_analysis.foundationEngineering.depth}</span></div>
                                        </div>
                                    )}
                                    {selectedProject.ai_analysis.concreteMixDesign && (
                                        <div className="detail-grid">
                                            <div className="detail-item"><span className="detail-label">Concrete Grade</span><span>{selectedProject.ai_analysis.concreteMixDesign.targetGrade}</span></div>
                                            <div className="detail-item"><span className="detail-label">Mix Ratio</span><span>{selectedProject.ai_analysis.concreteMixDesign.ratio}</span></div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Estimate Summary */}
                            {selectedProject.estimate && selectedProject.estimate.summary && (
                                <div className="detail-section">
                                    <h4>💰 Material Estimate</h4>
                                    <div className="detail-grid">
                                        <div className="detail-item"><span className="detail-label">Cement</span><span>{selectedProject.estimate.summary.cementBags} bags</span></div>
                                        <div className="detail-item"><span className="detail-label">Sand</span><span>{selectedProject.estimate.summary.sandCft} cft</span></div>
                                        <div className="detail-item"><span className="detail-label">Aggregate</span><span>{selectedProject.estimate.summary.aggregateCft} cft</span></div>
                                        <div className="detail-item"><span className="detail-label">Steel</span><span>{selectedProject.estimate.summary.steelKg} kg</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
