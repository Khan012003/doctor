import React, { useState, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import type { Appointment, MedicationItem } from '../context/ClinicContext';
import { Users, FileText, Send, Clock, User, CheckCircle, Search, Pill, Stethoscope, Plus, Trash2, MessageSquare, FileSignature, LayoutDashboard, ClipboardList, Settings, Power, Download, Calendar, AlertTriangle } from 'lucide-react';

const AdminDashboard: React.FC = () => {

  const { queue, completeAppointment, getPatientHistory, history: globalHistory, isClinicOpen, toggleClinicStatus } = useClinic();
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'settings'>('overview');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');

  const PREDEFINED_TESTS = ['Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'Lipid Panel', 'Thyroid Panel', 'HbA1c', 'Urinalysis', 'X-Ray', 'MRI', 'Migraine Assessment', 'ECG', 'Allergy Test'];
  const [requiredTests, setRequiredTests] = useState<string[]>([]);
  const [testDropdownOpen, setTestDropdownOpen] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [doctorComments, setDoctorComments] = useState('');
  const [medications, setMedications] = useState<MedicationItem[]>([
    { id: Date.now().toString(), name: '', timing: 'After Food', frequencies: [], daysToTake: 5 }
  ]);

  // Filter and sort the queue dynamically
  const pendingQueue = useMemo(() => {
    return queue
      .filter(q => q.status === 'Pending')
      .filter(q => q.patientName.toLowerCase().includes(searchFilter.toLowerCase()) || q.queueNumber.toString().includes(searchFilter))
      .sort((a, b) => a.queueNumber - b.queueNumber);
  }, [queue, searchFilter]);

  const localHistory = useMemo(() => selectedPatient ? getPatientHistory(selectedPatient.patientName) : [], [selectedPatient, getPatientHistory]);

  const addMedication = () => {
    setMedications([...medications, { id: Date.now().toString(), name: '', timing: 'After Food', frequencies: [], daysToTake: 5 }]);
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const updateMedication = (id: string, field: keyof MedicationItem | 'frequencies', value: any) => {
    setMedications(medications.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const validMedications = medications.filter(m => m.name.trim() !== '');
    if (!selectedPatient || !diagnosis || validMedications.length === 0) return;

    // Formatting physical prescription
    const medsText = validMedications.map((m, i) => `${i + 1}. ${m.name} [${m.frequencies.join(', ')}] (${m.timing}) for ${m.daysToTake} days`).join('\n');
    const testsText = requiredTests.length > 0 ? `\n\nRecommended Tests:\n- ${requiredTests.join('\n- ')}` : '';
    const smsContent = `ModernHealth Clinic\n\nPatient: ${selectedPatient.patientName}\nDiagnosis: ${diagnosis}\n\nRx Medications:\n${medsText}${testsText}\n\nDoctor Notes: ${doctorComments.trim() || 'Please take rest and drink plenty of fluids.'}\n\nGet well soon!`;

    console.log(`SMS Dispatch Disabled -> To: ${selectedPatient.phoneNumber} | Body:\n${smsContent}`);
    alert(`e-Prescription securely saved for ${selectedPatient.patientName}! (SMS disabled)`);

    await completeAppointment(selectedPatient.id, {
      diagnosis,
      medications: validMedications,
      requiredTests: requiredTests.length > 0 ? requiredTests : undefined,
      doctorComments: doctorComments.trim() || undefined
    });

    setSelectedPatient(null);
    setDiagnosis('');
    setDoctorComments('');
    setRequiredTests([]);
    setMedications([{ id: Date.now().toString(), name: '', timing: 'After Food', frequencies: [], daysToTake: 5 }]);
  };

  return (
    <div className="layout-container admin-layout-wrapper">

      {/* Global Sidebar Menu */}
      <div className="admin-sidebar">
        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', marginLeft: '1rem', marginBottom: '1rem', color: '#525252' }}>Menu</p>

        <div className="admin-sidebar-menu">
          <button
            onClick={() => setActiveTab('overview')}
            className={`admin-menu-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} /> <span style={{ fontWeight: 600 }}>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`admin-menu-btn ${activeTab === 'directory' ? 'active' : ''}`}
          >
            <Users size={18} /> <span style={{ fontWeight: 600 }}>Patient Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`admin-menu-btn ${activeTab === 'settings' ? 'active' : ''}`}
            style={activeTab === 'settings' ? { borderLeftColor: 'var(--secondary-color)', borderBottomColor: 'var(--secondary-color)' } : {}}
          >
            <Settings size={18} /> <span style={{ fontWeight: 600 }}>Clinic Settings</span>
          </button>
        </div>
      </div>

      {/* Main Rendering Area */}
      <div className="admin-viewport">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="admin-overview-grid">
            {/* Live Queue Panel */}
            <div className={`admin-queue-panel ${selectedPatient ? 'mobile-hidden' : ''}`}>
              <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--surface-border)', background: 'linear-gradient(to right, var(--primary-light), var(--surface-color))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
                    <ClipboardList size={20} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Live Consultations</h2>
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Search size={16} /></div>
                  <input type="text" className="input-field" placeholder="Search patients..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} style={{ paddingLeft: '2.5rem', background: 'var(--bg-color)', border: 'none', borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--bg-secondary)' }}>
                {pendingQueue.length === 0 ? (
                  <div className="animate-scale-in" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                    <CheckCircle size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--secondary-color)', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.9rem' }}>Queue is fully cleared.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pendingQueue.map((app, index) => (
                      <div
                        key={app.id} className="animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms`, background: 'var(--surface-color)', padding: '1.25rem', cursor: 'pointer', borderRadius: 'var(--radius-md)', border: `1px solid ${selectedPatient?.id === app.id ? 'var(--primary-color)' : 'var(--surface-border)'}`, boxShadow: selectedPatient?.id === app.id ? '0 0 0 2px var(--primary-glow)' : 'var(--shadow-sm)' }}
                        onClick={() => setSelectedPatient(app)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: '0 0 0.35rem 0', color: selectedPatient?.id === app.id ? 'var(--primary-color)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {app.patientName}
                              {app.isRevisit && <span title="Revisiting: Medication Ineffective" style={{ display: 'flex' }}><AlertTriangle size={14} color="#ef4444" /></span>}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> {app.date} • {app.time}
                            </span>
                          </div>
                          <div style={{ background: selectedPatient?.id === app.id ? 'var(--primary-color)' : 'var(--bg-secondary)', color: selectedPatient?.id === app.id ? 'white' : 'var(--text-secondary)', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.9rem' }}>
                            #{app.queueNumber}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Area */}
            <div className={`admin-form-area ${!selectedPatient ? 'mobile-hidden' : ''}`}>
              <div className="medical-bg-mesh" style={{ opacity: 0.3, zIndex: 0 }}></div>
              {!selectedPatient ? (
                <div className="animate-scale-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={72} strokeWidth={1} style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', opacity: 0.3 }} />
                  <h2 style={{ color: 'var(--text-secondary)' }}>Welcome to the Clinical Terminal</h2>
                  <p>Select a patient from the queue to start consulting.</p>
                </div>
              ) : (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>

                  <button 
                    className="btn btn-outline mobile-show animate-slide-right" 
                    onClick={() => setSelectedPatient(null)} 
                    style={{ width: '100%', background: 'var(--surface-color)' }}
                  >
                    ← Back to Live Queue
                  </button>

                  <div className="clinical-card" style={{ display: 'flex', padding: '1.5rem 2rem', gap: '2rem', alignItems: 'center', borderLeft: '4px solid var(--primary-color)' }}>
                    <div style={{ background: 'var(--primary-light)', minWidth: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={30} color="var(--primary-color)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                        <h1 style={{ margin: 0 }}>{selectedPatient.patientName}</h1>
                        <span className="badge badge-pending">Waiting</span>
                        {selectedPatient.isRevisit && (
                          <span className="badge" style={{ background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid #fecaca' }}>
                            <AlertTriangle size={12} /> Revisiting (Meds Ineffective)
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
                        Contact: <strong style={{ color: 'var(--text-secondary)' }}>{selectedPatient.phoneNumber}</strong> | Ticket Number: <strong style={{ color: 'var(--text-secondary)' }}>#{selectedPatient.queueNumber}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="admin-form-inner">

                    <div className="clinical-card" style={{ borderTop: '4px solid var(--secondary-color)' }}>
                      <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                        <Stethoscope size={20} color="var(--secondary-color)" /> Consultation Notes
                      </h3>

                      <div style={{ background: 'var(--accent-light)', color: '#be123c', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                        <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reported Symptoms</strong>
                        <span style={{ fontWeight: 500 }}>{selectedPatient.symptoms}</span>
                      </div>

                      <form onSubmit={handleComplete}>
                        <div className="input-group">
                          <label className="input-label">Clinical Diagnosis</label>
                          <input name="diagnosis" className="input-field" placeholder="e.g. Acute Bronchitis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label className="input-label" style={{ marginBottom: '1rem' }}>Prescribed Medications</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {medications.map((med, index) => (
                              <div key={med.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms`, background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <Pill size={16} color="var(--primary-color)" />
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tablet {index + 1}</strong>
                                  {medications.length > 1 && (
                                    <button type="button" onClick={() => removeMedication(med.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={16} /></button>
                                  )}
                                </div>
                                <input className="input-field" style={{ padding: '0.5rem 1rem' }} placeholder="Medicine Name & Dosage" value={med.name} onChange={(e) => updateMedication(med.id, 'name', e.target.value)} required />
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                  {['Morning', 'Afternoon', 'Evening', 'Night'].map((freq) => (
                                    <label key={freq} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--bg-color)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', border: `1px solid ${med.frequencies.includes(freq) ? 'var(--primary-color)' : 'var(--surface-border)'}`, userSelect: 'none' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={med.frequencies.includes(freq)} 
                                        onChange={(e) => {
                                          const newFreqs = e.target.checked ? [...med.frequencies, freq] : med.frequencies.filter(f => f !== freq);
                                          updateMedication(med.id, 'frequencies', newFreqs);
                                        }} 
                                        style={{ accentColor: 'var(--primary-color)', width: '14px', height: '14px' }} 
                                      /> {freq}
                                    </label>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--surface-border)', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input type="radio" name={`timing-${med.id}`} checked={med.timing === 'Before Food'} onChange={() => updateMedication(med.id, 'timing', 'Before Food')} style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }} /> Before Food
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                    <input type="radio" name={`timing-${med.id}`} checked={med.timing === 'After Food'} onChange={() => updateMedication(med.id, 'timing', 'After Food')} style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }} /> After Food
                                  </label>
                                  <div style={{ flex: 1, minWidth: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Duration:</span>
                                    <input 
                                      type="number" 
                                      min="1" 
                                      className="input-field" 
                                      style={{ width: '60px', padding: '0.2rem 0.5rem', textAlign: 'center' }} 
                                      value={med.daysToTake} 
                                      onChange={(e) => updateMedication(med.id, 'daysToTake', parseInt(e.target.value) || 0)} 
                                    />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>days</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button type="button" onClick={addMedication} className="btn btn-outline" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', borderStyle: 'dashed' }}>
                            <Plus size={16} /> Add Another Tablet
                          </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                          <label className="input-label" style={{ marginBottom: '1rem' }}>Required Laboratory/Diagnostic Tests</label>
                          <div style={{ border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem', background: 'var(--bg-secondary)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '48px', alignItems: 'center' }} onClick={() => setTestDropdownOpen(true)}>
                            {requiredTests.map(test => (
                              <span key={test} style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                {test}
                                <span style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setRequiredTests(requiredTests.filter(t => t !== test)); }}>&times;</span>
                              </span>
                            ))}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: '0.5rem', cursor: 'pointer' }}>
                              {requiredTests.length === 0 ? "Click to add tests..." : "+ Add more"}
                            </span>
                          </div>
                          {testDropdownOpen && (
                            <>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setTestDropdownOpen(false)}></div>
                              <div className="clinical-card animate-scale-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '0.5rem', zIndex: 20, maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', boxShadow: 'var(--shadow-lg)' }}>
                                {PREDEFINED_TESTS.filter(t => !requiredTests.includes(t)).map(test => (
                                  <div 
                                    key={test} 
                                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s', fontSize: '0.9rem' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => {
                                      setRequiredTests([...requiredTests, test]);
                                      setTestDropdownOpen(false);
                                    }}
                                  >
                                    {test}
                                  </div>
                                ))}
                                {PREDEFINED_TESTS.filter(t => !requiredTests.includes(t)).length === 0 && (
                                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>All standard tests added.</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="input-group" style={{ marginBottom: '2.5rem' }}>
                          <label className="input-label">Doctor's Comments & Advice</label>
                          <textarea name="doctorComments" className="input-field" placeholder="Notes..." rows={3} value={doctorComments} onChange={(e) => setDoctorComments(e.target.value)} style={{ resize: 'none' }} />
                        </div>

                        <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}>
                          <Send size={18} /> Complete & Dispatch e-Prescription
                        </button>
                      </form>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: 'fit-content' }}>
                      <div className="clinical-card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                          <Pill size={20} color="var(--primary-color)" /> Treatment History
                        </h3>
                        {localHistory.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)' }}>
                            <FileText size={32} color="var(--surface-border)" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No past records found.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '2px solid var(--surface-border)', paddingLeft: '1.5rem', marginLeft: '0.5rem' }}>
                            {localHistory.slice().reverse().map((record, index) => (
                              <div key={record.id} className="animate-slide-right" style={{ position: 'relative', animationDelay: `${index * 100}ms` }}>
                                <div style={{ position: 'absolute', left: '-1.85rem', top: '5px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--primary-color)', border: '3px solid var(--bg-secondary)' }}></div>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>{new Date(record.date).toLocaleDateString()}</p>
                                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', padding: '1.2rem', borderRadius: 'var(--radius-md)' }}>
                                  <strong style={{ display: 'block', marginBottom: '0.75rem' }}>{record.diagnosis}</strong>
                                  {record.medications?.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                      {record.medications.map((med, midx) => (
                                        <div key={midx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                          <Pill size={14} color="var(--primary-color)" /> <span>{med.name} ({med.frequencies?.length ? med.frequencies.join(', ') + ' - ' : ''}{med.timing}) <strong style={{color: 'var(--primary-color)'}}>- {med.daysToTake} days</strong></span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {record.requiredTests && record.requiredTests.length > 0 && (
                                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                                      <strong style={{ color: 'var(--text-muted)' }}>Required Tests: </strong>
                                      {record.requiredTests.join(', ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {(diagnosis || medications.some(m => m.name.trim()) || doctorComments) && (
                        <div className="clinical-card animate-scale-in" style={{ border: '2px dashed var(--primary-color)', background: 'var(--surface-color)' }}>
                          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--surface-border)' }}>
                            <FileSignature size={20} /> Preview e-Prescription
                          </h3>
                          
                          <div style={{ marginBottom: '1.5rem' }}>
                            <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-main)' }}>{selectedPatient?.patientName || 'Patient'}</strong>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ticket #{selectedPatient?.queueNumber} • {new Date().toLocaleDateString()}</span>
                          </div>

                          {diagnosis && (
                            <div style={{ marginBottom: '1.5rem' }}>
                              <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Clinical Diagnosis</strong>
                              <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--primary-color)' }}>{diagnosis}</p>
                            </div>
                          )}

                          {medications.some(m => m.name.trim()) && (
                            <div style={{ marginBottom: '1.5rem' }}>
                              <div style={{ fontSize: '1.5rem', fontFamily: 'serif', fontStyle: 'italic', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Rx</div>
                              <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--surface-border)' }}>
                                {medications.filter(m => m.name.trim()).map((med, idx) => (
                                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>{med.name}</strong> 
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{med.frequencies?.length > 0 ? med.frequencies.join(', ') + ' (' + med.timing + ')' : med.timing} • <strong style={{ color: 'var(--primary-color)' }}>For {med.daysToTake} days</strong></span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {requiredTests.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                               <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Recommended Tests</strong>
                               <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                 {requiredTests.map(test => (
                                   <span key={test} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--surface-border)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>{test}</span>
                                 ))}
                               </div>
                            </div>
                          )}

                          {doctorComments && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={14} color="var(--primary-color)" /> Doctor's Advice</strong>
                              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{doctorComments}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DIRECTORY TAB */}
        {activeTab === 'directory' && (
          <div className="md-p-responsive" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>Patient Global Directory</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Complete immutable ledger of all prescriptions passed within the clinic.</p>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Search size={16} /></div>
              <input type="text" className="input-field" placeholder="Search by Patient Name or Diagnosis..." value={directorySearch} onChange={(e) => setDirectorySearch(e.target.value)} style={{ paddingLeft: '2.5rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {globalHistory.length === 0 ? (
                <div className="clinical-card" style={{ textAlign: 'center', padding: '4rem' }}>No history records in database.</div>
              ) : (
                globalHistory.slice().reverse().filter(record => {
                  if (!directorySearch) return true;
                  const appointmentRecord = queue.find(q => q.id === record.appointmentId);
                  return (appointmentRecord?.patientName || '').toLowerCase().includes(directorySearch.toLowerCase()) || 
                         record.diagnosis.toLowerCase().includes(directorySearch.toLowerCase());
                }).map(record => {
                  const appointmentRecord = queue.find(q => q.id === record.appointmentId);
                  return (
                    <div
                      key={record.id}
                      className="clinical-card animate-slide-up"
                      style={{ cursor: 'pointer', border: expandedRecordId === record.id ? '2px solid var(--primary-color)' : '1px solid var(--surface-border)' }}
                      onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                    >
                      <div className="admin-history-grid">
                        <div>
                          <strong style={{ fontSize: '1.1rem' }}>{appointmentRecord?.patientName || "Unknown File"}</strong>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                            <Calendar size={12} /> {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary-color)' }}>{record.diagnosis}</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{record.medications?.length || 0} Medications Prescribed</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-success">Archived</span>
                        </div>
                      </div>

                      {/* Expanded View */}
                      {expandedRecordId === record.id && (
                        <div className="animate-fade-in admin-history-expanded">
                          <div>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> Patient Profile</h4>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}><strong style={{ color: 'var(--text-main)' }}>Contact:</strong> <span style={{ color: 'var(--text-muted)' }}>{appointmentRecord?.phoneNumber || 'N/A'}</span></p>
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}><strong style={{ color: 'var(--text-main)' }}>Initial Symptoms:</strong> <span style={{ color: 'var(--text-muted)' }}>{appointmentRecord?.symptoms || 'N/A'}</span></p>
                              <p style={{ margin: 0, fontSize: '0.9rem' }}><strong style={{ color: 'var(--text-main)' }}>Booking Time:</strong> <span style={{ color: 'var(--text-muted)' }}>{appointmentRecord?.date} {appointmentRecord?.time}</span></p>
                            </div>
                          </div>
                          <div>
                            <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Pill size={16} /> Prescription Details</h4>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                              {record.medications?.map((m, idx) => (
                                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: idx !== record.medications.length - 1 ? '1px dashed var(--surface-border)' : 'none', paddingBottom: '0.5rem' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{m.name}</span>
                                  <span style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>{m.frequencies?.length ? m.frequencies.join(', ') + ' - ' : ''}{m.timing} (for {m.daysToTake} days)</span>
                                </div>
                              ))}
                              {record.requiredTests && record.requiredTests.length > 0 && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                                  <strong style={{ color: 'var(--text-main)' }}>Recommended Tests:</strong> <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{record.requiredTests.join(', ')}</span>
                                </div>
                              )}
                              {record.doctorComments && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)', fontSize: '0.9rem' }}>
                                  <strong style={{ color: 'var(--text-main)' }}>Doctor's Advice:</strong> <span style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{record.doctorComments}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="md-p-responsive" style={{ backgroundColor: '#111', color: 'white', minHeight: '100vh' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', color: '#a3a3a3', marginBottom: '2.5rem' }}>Configure global platform toggles</h2>

            <div className="admin-settings-grid">
              {/* Scheduling Rules */}
              <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 2rem 0', fontSize: '1.25rem' }}>
                  <Calendar size={20} color="#a3a3a3" /> Scheduling Rules
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '2rem' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Enforce Lunch Block</strong>
                    <span style={{ color: '#737373', fontSize: '0.9rem' }}>Automatically blocks 1:00 PM for all dates globally.</span>
                  </div>
                  <div style={{ background: '#22c55e', width: '44px', height: '24px', borderRadius: '24px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ background: 'white', width: '20px', height: '20px', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Current Wait Delay</strong>
                    <span style={{ color: '#737373', fontSize: '0.9rem' }}>Updates the client portal with current wait times.</span>
                  </div>
                  <select style={{ background: '#262626', color: 'white', border: '1px solid #404040', padding: '0.5rem 1rem', borderRadius: '6px', outline: 'none' }}>
                    <option>On Time</option>
                    <option>+15 Mins</option>
                    <option>+30 Mins</option>
                  </select>
                </div>
              </div>

              {/* Critical Actions */}
              <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '12px', border: '1px solid #333' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 2rem 0', fontSize: '1.25rem' }}>
                  <Power size={20} color="#ef4444" /> Critical Actions
                </h3>

                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Emergency Shutdown Protocol</strong>
                <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5, opacity: 0.8 }}>
                  Immediately blocks ALL available slots for future bookings. Existing bookings are preserved.
                </p>

                <button
                  onClick={toggleClinicStatus}
                  style={{
                    background: isClinicOpen ? 'rgba(239, 68, 68, 0.1)' : '#ef4444',
                    color: isClinicOpen ? '#ef4444' : 'white',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  {isClinicOpen ? 'Trigger Emergency Lockdown' : 'Restore Operations - Lift Lockdown'}
                </button>
              </div>
            </div>

            <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '12px', border: '1px solid #333', marginTop: '2rem', width: '100%', maxWidth: '500px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 2rem 0', fontSize: '1.25rem' }}>
                <Download size={20} color="#3b82f6" /> Data Extraction
              </h3>

              <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Generate Audit CSV</strong>
              <p style={{ color: '#737373', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                Download a full `.csv` dump of the entire booking database including patient details, specialty logic, and exact appointment statuses for external medical record keeping.
              </p>
              <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Extract Audit Report</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
