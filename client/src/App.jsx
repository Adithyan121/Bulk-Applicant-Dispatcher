import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';
import { FiSend, FiPlus, FiBriefcase, FiMapPin, FiMail, FiCheckCircle, FiXCircle, FiClock, FiSearch, FiEdit2, FiTrash2, FiZap, FiList, FiUpload, FiAlertTriangle, FiGlobe, FiCheck } from 'react-icons/fi';

const API_URL = 'http://localhost:3000';

function App() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Data State
  const [sendingLogs, setSendingLogs] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', title: '', onConfirm: null, isDangerous: false });

  const [selectedLog, setSelectedLog] = useState(null);

  const [companyForm, setCompanyForm] = useState({
    company: '',
    role: '',
    email: '',
    place: '',
    website: ''
  });

  // Template State
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({ name: '', content: '' });
  const [selectedTemplateForRun, setSelectedTemplateForRun] = useState('');

  // Run Configuration State
  const [showRunConfig, setShowRunConfig] = useState(false);
  const [runConfig, setRunConfig] = useState({ force: false });

  const [previewContent, setPreviewContent] = useState('');

  useEffect(() => {
    fetchCompanies();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/templates`);
      setTemplates(response.data);
      if (response.data.length > 0 && !selectedTemplateForRun) {
        setSelectedTemplateForRun(response.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    }
  };

  const loadPreview = async (name) => {
    try {
      const response = await axios.get(`${API_URL}/templates/${name}`);
      setPreviewContent(response.data.content);
    } catch (error) {
      console.error("Failed to load preview");
      setPreviewContent("Failed to load preview.");
    }
  };

  const loadTemplateContent = async (name) => {
    try {
      const response = await axios.get(`${API_URL}/templates/${name}`);
      setCurrentTemplate(response.data);
    } catch (error) {
      toast.error("Failed to load template content");
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate.name || !currentTemplate.content) {
      toast.error("Name and Content are required");
      return;
    }
    try {
      await axios.post(`${API_URL}/templates`, currentTemplate);
      toast.success("Template Saved");
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const handleDeleteTemplate = async (name) => {
    if (!window.confirm(`Delete template ${name}?`)) return;
    try {
      await axios.delete(`${API_URL}/templates/${name}`);
      toast.success("Template Deleted");
      if (currentTemplate.name === name) setCurrentTemplate({ name: '', content: '' });
      fetchTemplates();
    } catch (error) {
      toast.error("Failed to delete template");
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/companies`);
      setCompanies(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/logs`);
      setHistoryLogs(response.data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to fetch history");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) {
          toast.error("Invalid JSON: Root must be an array");
          return;
        }

        const existingEmails = new Set(companies.map(c => c.email));
        const newCompanies = importedData.filter(c => c.email && !existingEmails.has(c.email));

        if (newCompanies.length === 0) {
          toast("No new unique companies found.", { icon: 'ℹ️' });
          return;
        }

        const updatedList = [...companies, ...newCompanies];
        setCompanies(updatedList);
        await saveToBackend(updatedList);
        toast.success(`Imported ${newCompanies.length} companies!`);
        fetchCompanies();

      } catch (err) {
        console.error("Import failed:", err);
        toast.error("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleInputChange = (e) => {
    setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
  };

  const calculateDaysAgo = (dateString) => {
    if (!dateString) return null;
    const sentDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - sentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper to open confirmation modal
  const requestConfirm = (title, message, onConfirm, isDangerous = false) => {
    setConfirmState({ isOpen: true, title, message, onConfirm, isDangerous });
  };

  const closeConfirm = () => {
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const handleConfirmAction = () => {
    if (confirmState.onConfirm) confirmState.onConfirm();
    closeConfirm();
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setCompanyForm({ company: '', role: '', email: '', place: '', website: '' });
    setShowModal(true);
  };

  const openEditModal = (company, originalIndex) => {
    setEditingIndex(originalIndex);
    setCompanyForm({
      company: company.company || '',
      role: company.role || '',
      email: company.email || '',
      place: company.place || '',
      website: company.website || ''
    });
    setShowModal(true);
  };

  const saveToBackend = async (updatedList) => {
    const rawList = updatedList.map(({ lastSent, ...rest }) => rest);
    await axios.post(`${API_URL}/companies`, rawList);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.email || !companyForm.role) return;

    let updatedCompanies = [...companies];

    if (editingIndex !== null) {
      updatedCompanies[editingIndex] = {
        ...updatedCompanies[editingIndex],
        ...companyForm // Preserve lastSent from original, overwrite fields
      };
    } else {
      updatedCompanies.push(companyForm);
    }

    setCompanies(updatedCompanies);
    setShowModal(false);

    try {
      await saveToBackend(updatedCompanies);
      toast.success(editingIndex !== null ? "Company Updated" : "Company Added");
      if (editingIndex === null) setCompanyForm({ company: '', role: '', email: '', place: '', website: '' });
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Failed to save changes");
      fetchCompanies();
    }
  };

  const handleDeleteCompany = (originalIndex) => {
    requestConfirm(
      "Delete Company?",
      "Are you sure you want to permanently remove this company from your list?",
      async () => {
        const updatedCompanies = companies.filter((_, idx) => idx !== originalIndex);
        setCompanies(updatedCompanies);
        try {
          await saveToBackend(updatedCompanies);
          toast.success("Company Deleted");
        } catch (error) {
          console.error("Error deleting company:", error);
          toast.error("Failed to delete company");
          fetchCompanies();
        }
      },
      true // Dangerous
    );
  };

  const handleSendEmails = async (force = false) => {
    setRunConfig({ force });
    setShowRunConfig(true);

    // Ensure accurate template list and selection
    let currentTemplates = templates;
    if (currentTemplates.length === 0) {
      try {
        const response = await axios.get(`${API_URL}/templates`);
        setTemplates(response.data);
        currentTemplates = response.data;
      } catch (e) { console.error(e); }
    }

    let defaultTemplate = selectedTemplateForRun;
    if (currentTemplates.length > 0 && !defaultTemplate) {
      defaultTemplate = currentTemplates[0];
      setSelectedTemplateForRun(defaultTemplate);
    }

    if (defaultTemplate) {
      loadPreview(defaultTemplate);
    }
  };

  const executeRun = async () => {
    setShowRunConfig(false);
    setIsSending(true);
    setSendingLogs([]);
    setShowLogModal(true);

    try {
      const response = await axios.post(`${API_URL}/send`, {
        force: runConfig.force,
        templateName: selectedTemplateForRun
      });
      setSendingLogs(response.data.results);
      fetchCompanies();
      toast.success("Batch Process Completed");
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Batch Process Failed");
      setSendingLogs([{ email: 'SYSTEM', status: 'Failed', reason: 'Network or Server Error' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSingleForceSend = (company) => {
    requestConfirm(
      "Force Send Single Email?",
      `Force send email to ${company.email}? This ignores the 15-day cooldown.`,
      async () => {
        setIsSending(true);
        setSendingLogs([]);
        setShowLogModal(true);

        try {
          const response = await axios.post(`${API_URL}/send`, { force: true, specificEmail: company.email });
          setSendingLogs(response.data.results);
          fetchCompanies();
          toast.success("Single Email Sent");
        } catch (error) {
          console.error("Error sending email:", error);
          toast.error("Failed to send email");
          setSendingLogs([{ email: company.email, status: 'Failed', reason: 'Network Error' }]);
        } finally {
          setIsSending(false);
        }
      },
      true
    );
  };

  // Attach original index to filtered items so we can edit/delete the right one
  // FILTER: Only show companies that have NOT been sent an email yet
  const filteredCompaniesWithIndex = companies
    .map((c, idx) => ({ ...c, originalIndex: idx }))
    .filter(c => !c.lastSent)
    .filter(c =>
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(148, 163, 184, 0.1)',
          },
        }}
      />

      <header className="header">
        <h1>
          <span style={{ color: '#6366f1' }}>🚀</span> Bulk Applicant Dispatcher
        </h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn btn-secondary" onClick={fetchHistory}>
            <FiList /> History
          </button>
          <button className="btn btn-secondary" onClick={() => setShowTemplateModal(true)}>
            <FiEdit2 /> Templates
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiUpload /> Import JSON
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-secondary" onClick={openAddModal}>
            <FiPlus /> Add Company
          </button>

          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="btn btn-primary" onClick={() => handleSendEmails(false)} disabled={isSending}>
              <FiSend /> {isSending ? 'Sending...' : 'Start Run'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleSendEmails(true)}
              disabled={isSending}
              title="Force send to everyone (Ignore 15-day rule)"
              style={{ padding: '0 15px', color: '#ef4444', borderColor: '#ef4444' }}
            >
              Force All ⚡
            </button>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#6366f1' }}>
            {companies.filter(c => !c.lastSent).length}
          </span>
          <span className="stat-label">Pending Reviews</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#10b981' }}>
            {companies.filter(c => c.lastSent).length}
          </span>
          <span className="stat-label">Total Sent</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <FiSearch style={{ position: 'absolute', left: '15px', top: '12px', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 12px 12px 40px',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: '12px',
            color: 'white',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div className="companies-grid">
        {isLoading ? <p>Loading...</p> : filteredCompaniesWithIndex.map((company) => {
          const daysAgo = calculateDaysAgo(company.lastSent);
          const isCooldown = daysAgo !== null && daysAgo <= 15;

          return (
            <div key={company.originalIndex} className="company-card" style={{ borderColor: isCooldown ? 'rgba(16, 185, 129, 0.3)' : '' }}>
              <div className="company-header">
                <div>
                  <h3 className="company-name">{company.company || 'Unknown Company'}</h3>
                  <div className="company-role">{company.role}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                  {company.lastSent ? (
                    <div title={`Sent on ${new Date(company.lastSent).toLocaleDateString()}`} className="status-badge" style={{
                      background: isCooldown ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      color: isCooldown ? '#34d399' : '#94a3b8',
                      display: 'flex', alignItems: 'center'
                    }}>
                      {isCooldown ? <FiCheckCircle style={{ marginRight: 4 }} /> : <FiClock style={{ marginRight: 4 }} />}
                      {daysAgo} days ago
                    </div>
                  ) : (
                    <div className="status-badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                      New
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleSingleForceSend(company)}
                      title="Force Send to THIS company only"
                      style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '4px' }}>
                      <FiZap />
                    </button>
                    <button
                      onClick={() => openEditModal(company, company.originalIndex)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.originalIndex)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>

              <div className="company-details">
                <div className="detail-item">
                  <FiMail /> {company.email}
                </div>
                <div className="detail-item">
                  <FiMapPin /> {company.place || 'Remote/Unknown'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmState.isOpen && (
        <div className="modal-overlay" onClick={closeConfirm}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '20px', color: confirmState.isDangerous ? '#ef4444' : '#6366f1' }}>
              <FiAlertTriangle size={50} />
            </div>
            <h2 style={{ marginBottom: '10px' }}>{confirmState.title}</h2>
            <p style={{ color: '#94a3b8', marginBottom: '30px' }}>{confirmState.message}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={closeConfirm}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmAction}
                style={{
                  background: confirmState.isDangerous ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : undefined,
                  boxShadow: confirmState.isDangerous ? '0 4px 15px rgba(239, 68, 68, 0.4)' : undefined
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Email History</h2>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#cbd5e1' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Company</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLogs.map((log, i) => (
                    <tr
                      key={i}
                      onClick={() => setSelectedLog(log)}
                      style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.5)', cursor: 'pointer', transition: 'background 0.2s' }}
                      className="history-row"
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px' }}>{new Date(log.dateSent).toLocaleString()}</td>
                      <td style={{ padding: '10px' }}>{log.company}</td>
                      <td style={{ padding: '10px' }}>{log.email}</td>
                      <td style={{ padding: '10px' }}>{log.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* History Dropdown Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)} style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Sent Details</h2>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <div className="company-details" style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: '#e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiBriefcase size={20} color="#6366f1" />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Company</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedLog.company}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiCheckCircle size={20} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Position</div>
                  <div style={{ fontSize: '1.1rem' }}>{selectedLog.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiMail size={20} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Email Sent To</div>
                  <div style={{ fontSize: '1.1rem' }}>{selectedLog.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiMapPin size={20} color="#ec4899" />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Location</div>
                  <div style={{ fontSize: '1.1rem' }}>{selectedLog.place || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiGlobe size={20} color="#3b82f6" />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Website</div>
                  <div style={{ fontSize: '1.1rem' }}>
                    {selectedLog.website ? (
                      <a href={selectedLog.website.startsWith('http') ? selectedLog.website : `https://${selectedLog.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>
                        {selectedLog.website}
                      </a>
                    ) : 'N/A'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiClock size={20} color="#8b5cf6" />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Time Sent</div>
                  <div style={{ fontSize: '1.1rem' }}>{new Date(selectedLog.dateSent).toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)} style={{ flex: 1 }}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleSingleForceSend(selectedLog);
                  setSelectedLog(null);
                }}
                style={{ flex: 1, background: '#f59e0b', borderColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              >
                <FiZap /> Force Resend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingIndex !== null ? 'Edit Company' : 'Add New Company'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <form onSubmit={handleSaveCompany}>
              <div className="form-group">
                <label>Company Name</label>
                <input required name="company" className="form-input" value={companyForm.company} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Job Role</label>
                <input required name="role" className="form-input" value={companyForm.role} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" name="email" className="form-input" value={companyForm.email} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input name="place" className="form-input" value={companyForm.place} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Website (Optional)</label>
                <input name="website" className="form-input" value={companyForm.website} onChange={handleInputChange} placeholder="e.g. google.com" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingIndex !== null ? 'Save Changes' : 'Add Company'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplateModal && (
        <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', display: 'flex', gap: '20px', height: '80vh' }}>

            {/* Sidebar List */}
            <div style={{ width: '250px', borderRight: '1px solid rgba(148, 163, 184, 0.1)', paddingRight: '15px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Templates</h3>
                <button
                  onClick={() => setCurrentTemplate({ name: '', content: '' })}
                  style={{ background: 'none', border: '1px solid #6366f1', color: '#6366f1', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <FiPlus />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {templates.map(t => (
                  <div
                    key={t}
                    onClick={() => loadTemplateContent(t)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: currentTemplate.name === t ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: currentTemplate.name === t ? '#fff' : '#94a3b8',
                      marginBottom: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {currentTemplate.name === t && <FiCheck style={{ color: '#10b981', flexShrink: 0 }} />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                    </div>
                    <FiTrash2
                      onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t); }}
                      style={{ color: '#ef4444', opacity: 0.6 }}
                      className="hover-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px', fontSize: '0.9rem' }}>Template Name (e.g., my_template.html)</label>
                <input
                  value={currentTemplate.name}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                  placeholder="new_template.html"
                  className="form-input"
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', color: '#94a3b8', marginBottom: '5px', fontSize: '0.9rem' }}>HTML Content</label>
                <textarea
                  value={currentTemplate.content}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, content: e.target.value })}
                  style={{
                    flex: 1,
                    width: '100%',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '8px',
                    padding: '15px',
                    fontFamily: 'monospace',
                    resize: 'none'
                  }}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowTemplateModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={handleSaveTemplate}>Save Template</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Run Configuration Modal */}
      {showRunConfig && (
        <div className="modal-overlay" onClick={() => setShowRunConfig(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{runConfig.force ? '⚠️ Force Run Config' : '🚀 Start Run Config'}</h2>
              <button onClick={() => setShowRunConfig(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#94a3b8', marginBottom: '15px' }}>
                {runConfig.force
                  ? "You are about to FORCE send emails to ALL recipients, ignoring the 15-day cooldown. Please select a template."
                  : "Prepare to send emails to eligible recipients. Please select the template you wish to use."}
              </p>

              <div className="form-group">
                <label>Select Email Template</label>
                <select
                  className="form-input"
                  value={selectedTemplateForRun}
                  onChange={(e) => {
                    const newTemplate = e.target.value;
                    setSelectedTemplateForRun(newTemplate);
                    loadPreview(newTemplate);
                  }}
                >
                  {templates.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {previewContent && (
                <div className="form-group">
                  <label>Template Preview</label>
                  <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace'
                  }}>
                    {previewContent}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRunConfig(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={executeRun}
                disabled={!selectedTemplateForRun}
                style={{
                  background: runConfig.force ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : undefined
                }}
              >
                {runConfig.force ? 'Launch Force Run ⚡' : 'Start Sending 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sending Logs Modal */}
      {showLogModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Sending Application... {isSending && <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>(Do not close)</span>}</h2>
              {!isSending && <button onClick={() => setShowLogModal(false)} className="btn btn-secondary">Close</button>}
            </div>
            <div className="log-terminal">
              {sendingLogs.length === 0 && <p>Initializing...</p>}
              {sendingLogs.map((log, idx) => (
                <div key={idx} className="log-entry">
                  <span style={{ width: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.email}</span>
                  {log.status === 'Sent' && <span className="log-success">✅ Sent</span>}
                  {log.status === 'Skipped' && <span className="log-skipped">⏭️ Skipped ({log.reason})</span>}
                  {log.status === 'Failed' && <span className="log-error">❌ Failed ({log.reason})</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

  );
}

export default App;
