import React, { useState, useEffect, useMemo } from 'react';
import { IconSearch } from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { fetchSurveyFlags } from '../services/mongodb';
import { login } from '../services/auth';
import { SurveyFlag } from '../types/survey';

const ValidationForm: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submissions, setSubmissions] = useState<SurveyFlag[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SurveyFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const columnHelper = createColumnHelper<SurveyFlag>();

  // Now read catch values from the catches array rather than top-level fields.
  const columns = useMemo(() => [
    columnHelper.accessor('submission_id', {
      header: 'SUBMISSION ID',
      cell: info => info.getValue(),
    }),
    // For the catch numbers, join all n_catch values from the catches array.
    columnHelper.accessor(row => row.catches.map(c => c.n_catch).join(', '), {
      id: 'n_catch',
      header: 'CATCH #',
      cell: info => info.getValue(),
    }),
    // For alert flags, gather all defined flags.
    columnHelper.accessor(row => {
      const flags = row.catches
        .map(c => c.alert_flag)
        .filter(flag => flag !== undefined && flag !== null && flag !== '');
      return flags.length ? flags.join(', ') : null;
    }, {
      id: 'alert_flag',
      header: 'ALERT FLAG',
      cell: info => {
        const flags = info.getValue();
        return flags ? (
          <span className="badge bg-danger">Flag: {flags}</span>
        ) : (
          <span className="badge bg-success">No Flag</span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setSelectedSubmission(row.original)}
        >
          Review
        </button>
      ),
    }),
  ], [columnHelper]);

  const table = useReactTable({
    data: submissions,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: Math.ceil(submissions.length / pageSize),
    initialState: { pagination: { pageSize } },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      if (response.success && response.token) {
        setIsAuthenticated(true);
        setError(null);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
      setIsAuthenticated(false);
    }
  };

  const loadSurveyData = async () => {
    try {
      setLoading(true);
      const data = await fetchSurveyFlags();
      setSubmissions(data);
      setError(null);
    } catch (error: any) {
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
    if (!selectedSubmission) return;
    try {
      // API call to update status goes here
      console.log('Updating status for submission', selectedSubmission.submission_id);
    } catch (error) {
      console.error('Error updating status', error);
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
            <div className="text-center">Loading...</div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <IconSearch className="text-muted" />
                  <input
                    type="text"
                    className="form-control ms-2"
                    placeholder="Search submissions..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-vcenter">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-4">
                <div className="text-muted">
                  Showing{' '}
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getPrePaginationRowModel().rows.length
                  )}{' '}
                  of {table.getPrePaginationRowModel().rows.length}
                </div>
                <div className="btn-group">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedSubmission && (
        <div className="modal modal-blur fade show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Review Submission {selectedSubmission.submission_id}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedSubmission(null)}></button>
              </div>
              <div className="modal-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Catch #</th>
                        <th>Alert Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSubmission.catches.map((catchItem, index) => (
                        <tr key={index} className={catchItem.alert_flag ? 'table-danger' : ''}>
                          <td>{catchItem.n_catch}</td>
                          <td>
                            {catchItem.alert_flag ? (
                              <span className="badge bg-danger">Flag: {catchItem.alert_flag}</span>
                            ) : (
                              <span className="badge bg-success">No Flag</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedSubmission(null)}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={handleStatusUpdate}>
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationForm;