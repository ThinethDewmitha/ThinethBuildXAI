import React, { useEffect, useState } from 'react';
import {
  FolderOpen, ArrowLeft, Loader2, Trash2, Calendar, ArrowRight, AlertCircle,
} from 'lucide-react';
import { getMyProjects, deleteProject } from '../services/api';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function ProjectHistory({ onBack, onOpenProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyProjects();
      setProjects(data.projects || []);
    } catch (err) {
      const msg = err.message || 'Failed to load projects.';
      setError(
        msg.includes('session expired') || msg.includes('Invalid or expired token')
          ? 'Your session expired. Please log out and sign in again.'
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete project.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="project-history-container animate-in">
      <div className="project-history-header">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <div className="welcome-badge"><FolderOpen size={14} /> My Projects</div>
          <h2>Saved Blueprints</h2>
          <p>Open a past project or start a new analysis from the home page.</p>
        </div>
      </div>

      {error && (
        <div className="auth-error project-history-error" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="project-history-loading">
          <Loader2 size={28} className="spin" />
          <span>Loading your projects…</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="project-history-empty glass-card">
          <FolderOpen size={40} strokeWidth={1.5} />
          <h3>No saved projects yet</h3>
          <p>Complete a blueprint and click <strong>Save Project</strong> to store it here.</p>
          <button type="button" className="btn btn-primary" onClick={onBack}>
            Go to Home
          </button>
        </div>
      ) : (
        <ul className="project-history-list">
          {projects.map((project) => (
            <li key={project.id} className="project-history-card glass-card">
              <div className="project-history-card-body">
                <h3>{project.project_name || 'Untitled Project'}</h3>
                <p className="project-history-meta">
                  <Calendar size={14} />
                  {formatDate(project.created_at)}
                  {project.specs?.buildingType && (
                    <span> · {String(project.specs.buildingType).replace(/_/g, ' ')}</span>
                  )}
                </p>
              </div>
              <div className="project-history-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onOpenProject(project)}
                >
                  Open <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDelete(project.id, project.project_name)}
                  disabled={deletingId === project.id}
                  aria-label="Delete project"
                >
                  {deletingId === project.id
                    ? <Loader2 size={14} className="spin" />
                    : <Trash2 size={14} />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
