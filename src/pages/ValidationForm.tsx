import React, { useState, useEffect } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { fetchSurveyFlags, type SurveyResponse } from '../services/mongodb';
import { login, type AuthResponse } from '../services/auth';

const ValidationForm: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submissions, setSubmissions] = useState<SurveyResponse[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SurveyResponse | null>(null);
  const [status, setStatus] = useState('validation_status_approved');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with:', { username, password }); // Debug log

    try {
      const response = await login(username, password);
      console.log('Login response:', response);
      
      if (response.success && response.token) {
        setIsAuthenticated(true);
        setError(null);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.response?.data?.error || 'Login failed');
      setIsAuthenticated(false);
    }
  };

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      const data = await fetchSurveyFlags();
      console.log('Survey data:', data); // Debug log
      setSubmissions(data);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load surveys:', error);
      if (error.response?.status === 401) {
        setIsAuthenticated(false);
        setError('Session expired. Please login again.');
      } else {
        setError(error.response?.data?.error || 'Failed to load survey data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSurveyData();
    }
  }, [isAuthenticated]);

  const handleStatusUpdate = async () => {
    if (!selectedSubmission) {
      setUpdateMessage("Please select a submission before updating status");
      return;
    }

    try {
      // Implement actual API call
      setUpdateMessage("Status updated successfully");
    } catch (error) {
      setUpdateMessage("Error updating status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validation_status_approved':
        return 'success';
      case 'validation_status_not_approved':
        return 'danger';
      case 'validation_status_on_hold':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page page-center">
        <div className="container container-tight py-4">
          <div className="text-center mb-4">
            <h1>Fishery Validation Portal</h1>
            <h2 className="text-muted">Login to access the validation interface</h2>
          </div>
          <div className="card card-md">
            <div className="card-body">
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-footer">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={!username || !password}
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-xl">
      <div className="page-header mb-3">
        <div className="row align-items-center">
          <div className="col">
            <h2 className="page-title">Fishery Catch Form Validation</h2>
            <div className="text-muted mt-1">Manage and validate submission forms</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : submissions.length === 0 ? (
            <div className="alert alert-info">No submissions found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-vcenter card-table table-striped">
                <thead>
                  <tr>
                    <th>Submission ID</th>
                    <th>Catches</th>
                    <th>Alerts</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr 
                      key={submission.submission_id}
                      className={selectedSubmission?.submission_id === submission.submission_id ? 'table-active' : ''}
                      onClick={() => setSelectedSubmission(submission)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{submission.submission_id}</td>
                      <td>{submission.catches.length}</td>
                      <td>
                        {submission.total_alerts > 0 && (
                          <span className="badge bg-danger">{submission.total_alerts}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge bg-${getStatusColor(status)}`}>
                          {status.replace('validation_status_', '')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedSubmission && (
            <div className="mt-3">
              <div className="alert alert-info d-inline-flex">
                <IconAlertTriangle className="me-2" />
                Selected submission: {selectedSubmission.submission_id}
              </div>
              
              <div className="d-flex gap-2 mt-3">
                <select 
                  className="form-select" 
                  style={{ width: '200px' }}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="validation_status_approved">Approved</option>
                  <option value="validation_status_not_approved">Not Approved</option>
                  <option value="validation_status_on_hold">On Hold</option>
                </select>
                
                <button className="btn btn-primary" onClick={handleStatusUpdate}>
                  Update Status
                </button>
                
                <a 
                  href="#" 
                  className="btn btn-secondary" 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Edit Submission
                </a>
              </div>
            </div>
          )}

          {updateMessage && (
            <div className="alert alert-primary mt-3">
              {updateMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationForm; 