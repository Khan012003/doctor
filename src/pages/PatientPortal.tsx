import React, { useState, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import { CalendarPlus, Activity, User, Phone, Clock, Stethoscope, ShieldCheck, ActivitySquare, Users, Calendar, MapPin, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const PatientPortal: React.FC = () => {
  const navigate = useNavigate();
  const { queue, bookAppointment, isClinicOpen, getPastAppointmentByPhone } = useClinic();
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isRevisit, setIsRevisit] = useState<boolean>(false);
  const [fetchedPhone, setFetchedPhone] = useState<string>('');
  const [queueNum, setQueueNum] = useState<number | null>(null);

  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');

  // Time options for the dropdown
  const timeOptions = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"
  ];

  const [formData, setFormData] = useState({
    patientName: '',
    phoneNumber: '',
    symptoms: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM'
  });

  // Calculate live tracking metrics
  const pendingQueue = useMemo(() => {
    return queue.filter(q => q.status === 'Pending').sort((a,b) => a.queueNumber - b.queueNumber);
  }, [queue]);

  const currentServingTicket = pendingQueue.length > 0 ? pendingQueue[0].queueNumber : null;
  const totalWaiting = pendingQueue.length;

  const calculateEstimatedWait = (targetTicket: number) => {
    if (!currentServingTicket) return 0;
    const peopleAhead = pendingQueue.filter(q => q.queueNumber < targetTicket).length;
    return peopleAhead * 15; // default 15 mins estimate
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.phoneNumber || !formData.symptoms || !formData.date || !formData.time) return;

    const fullPhone = '+91' + formData.phoneNumber;
    const qNum = await bookAppointment({ ...formData, phoneNumber: fullPhone, isRevisit });
    setQueueNum(qNum);
    setSubmitted(true);
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setQueueNum(null);
    setIsRevisit(false);
    setFetchedPhone('');
    setFormData({
      patientName: '',
      phoneNumber: '',
      symptoms: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00 AM'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (e.target.name === 'phoneNumber') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  React.useEffect(() => {
    if (isRevisit && formData.phoneNumber.length === 10 && formData.phoneNumber !== fetchedPhone) {
      const past = getPastAppointmentByPhone('+91' + formData.phoneNumber);
      if (past) {
        setFormData(prev => ({
          ...prev,
          patientName: past.patientName,
          symptoms: `[Previous: ${past.symptoms}]\n`
        }));
        setFetchedPhone(formData.phoneNumber);
      }
    }
  }, [isRevisit, formData.phoneNumber, getPastAppointmentByPhone, fetchedPhone]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      navigate('/admin');
    } else {
      alert('Incorrect Password');
      setAdminPassword('');
    }
  };

  const renderAdminModal = () => (
    <>
      <button 
        onClick={(e) => { e.preventDefault(); setShowAdminModal(true); }}
        style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', zIndex: 10, boxShadow: 'var(--shadow-sm)' }}
      >
        <ShieldCheck size={14} /> Admin Access
      </button>

      {showAdminModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="clinical-card animate-scale-in" style={{ width: '100%', maxWidth: '350px', background: 'var(--surface-color)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ margin: '0 0 1.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}><ShieldCheck color="var(--primary-color)" /> Admin Verification</h3>
            <form onSubmit={handleAdminLogin}>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <input type="password" placeholder="Enter Password" className="input-field" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} autoFocus required />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setShowAdminModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.75rem' }}>Authorize</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  if (!isClinicOpen) {
    return (
      <div className="layout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
        {renderAdminModal()}
        <div className="medical-bg-mesh"></div>
        <div className="clinical-card animate-scale-in" style={{ textAlign: 'center', maxWidth: '500px', width: '100%', padding: '4rem 3rem', borderTop: '4px solid #ef4444' }}>
          <div className="animate-float" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            width: '80px', height: '80px', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            boxShadow: '0 0 0 10px rgba(239, 68, 68, 0.05)'
          }}>
            <AlertTriangle color="#ef4444" size={42} />
          </div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.8rem' }}>Emergency Registration Lockdown</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1rem', lineHeight: 1.6 }}>
            The clinic is currently handling a critical situation or has reached absolute maximum capacity. 
            <br/><br/>
            <strong>New bookings are temporarily suspended.</strong> If you already hold a ticket, it remains active. Please refer to on-site reception for guidance.
          </p>
        </div>
      </div>
    );
  }

  if (submitted && queueNum !== null) {
    const minWait = calculateEstimatedWait(queueNum);
    const qrData = JSON.stringify({
      queueNumber: queueNum,
      name: formData.patientName,
      date: formData.date,
      time: formData.time,
      location: "ModernHealth HQ",
      doctor: "Dr. Specialist"
    });
    
    return (
      <div className="layout-container grid-patient-verification" style={{ background: 'var(--bg-secondary)' }}>
        {renderAdminModal()}
        <div className="medical-bg-mesh"></div>
        
        {/* Left column: Live Tracker Status */}
        <div className="animate-slide-right md-p-responsive" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.05) 0%, rgba(13, 148, 136, 0.05) 100%)',
          borderRight: '1px solid var(--surface-border)'
        }}>
          
          <div className="animate-check" style={{ 
            background: 'var(--secondary-light)', 
            width: '70px', height: '70px', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 0 0 8px rgba(13, 148, 136, 0.1)'
          }}>
            <ShieldCheck color="var(--secondary-color)" size={36} />
          </div>
          
          <h2 style={{ marginBottom: '0.25rem', color: 'var(--text-main)', fontSize: '2rem', lineHeight: 1.2 }}>Booking Verified</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1rem' }}>
            Your consultation digital ticket has been minted successfully.
          </p>

          <div className="clinical-card animate-slide-up delay-200" style={{ padding: '2rem', background: 'var(--surface-color)', marginBottom: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
              <ActivitySquare size={18} color="var(--secondary-color)" /> Live Tracking Active
            </h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Your Number</p>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>
                  #{queueNum}
                </div>
              </div>
              <div style={{ width: '1px', background: 'var(--surface-border)' }}></div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Now Serving</p>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary-color)', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {currentServingTicket ? `#${currentServingTicket}` : '--'}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <Clock color="var(--text-muted)" size={20} />
               <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Estimated Wait</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {pendingQueue.findIndex(q => q.queueNumber === queueNum) === 0 ? 'You are next! Please proceed.' : `~ ${minWait} Minutes`}
                  </div>
               </div>
            </div>
          </div>
          
          <button className="btn btn-outline animate-slide-up delay-400" onClick={handleResetForm}>
            Book Another Consultation
          </button>
        </div>

        {/* Right column: Golden Ticket QR Code */}
        <div className="p-responsive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
          <div className="clinical-card animate-scale-in delay-300" style={{ 
            width: '100%', maxWidth: '580px', padding: 0, overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 0 0 1px var(--primary-light)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Ticket Header */}
            <div style={{ background: 'var(--primary-color)', color: 'white', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Appointment Token</span>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>TICKET #{queueNum}</h3>
              </div>
              <Stethoscope size={32} opacity={0.5} />
            </div>

            {/* Ticket Body Split */}
            <div className="grid-patient-golden">
              {/* Left Side: QR Code */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', borderRight: '2px dashed var(--surface-border)', paddingRight: '2rem' }}>
                <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                  <QRCodeSVG value={qrData} size={140} level="M" />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scan upon arrival</span>
              </div>

              {/* Right Side: Appointment Details */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <User size={12} /> Patient Name
                  </p>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{formData.patientName}</strong>
                </div>

                <div className="grid-patient-ticket-split">
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={12} /> Date
                    </p>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{formData.date}</strong>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={12} /> Time
                    </p>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{formData.time}</strong>
                  </div>
                </div>

                <div className="grid-patient-ticket-split">
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Stethoscope size={12} /> Physician
                    </p>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Dr. Specialist</strong>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={12} /> Location
                    </p>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>ModernHealth HQ</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Footer */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem 2rem', borderTop: '1px solid var(--surface-border)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Please arrive 10 minutes prior to your scheduled time slot.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container grid-patient-main">
      {renderAdminModal()}
      <div className="medical-bg-mesh"></div>
      
      {/* Left side Live Dashboard / Info */}
      <div className="animate-slide-right p-responsive" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.05) 0%, rgba(13, 148, 136, 0.05) 100%)',
        borderRight: '1px solid var(--surface-border)'
      }}>
        
        <div style={{ marginBottom: 'auto' }}>
          <div className="animate-float" style={{ 
            width: '64px', height: '64px', 
            background: 'var(--surface-color)', 
            borderRadius: '16px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-floating)',
            marginBottom: '1.5rem'
          }}>
            <Stethoscope size={32} color="var(--primary-color)" />
          </div>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: '1.1' }}>
            Digital Queue<br/><span className="text-gradient">Registry Portal</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '380px', lineHeight: '1.6', marginBottom: '2.5rem' }}>
            Reserve your consultation ticket digitally and avoid unnecessary waiting times inside the clinic lobby.
          </p>
        </div>

        {/* Live Clinic Metrics Box */}
        <div className="clinical-card" style={{ padding: '2rem', background: 'var(--surface-color)', marginTop: 'auto' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>
            <ActivitySquare size={18} color="var(--secondary-color)" /> Live Clinic Status
          </h3>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Currently Serving</p>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-color)', lineHeight: 1 }}>
                {currentServingTicket ? `#${currentServingTicket}` : '--'}
              </div>
            </div>
            
            <div style={{ width: '1px', background: 'var(--surface-border)' }}></div>
            
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Patients Waiting</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                 <Users size={20} color="var(--text-muted)" /> {totalWaiting}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right side Form */}
      <div className="p-responsive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="clinical-card animate-slide-left" style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2>Book Consultation</h2>
            <p style={{ color: 'var(--text-muted)' }}>Select a date, time, and provide your details.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group delay-100 animate-slide-up" style={{ animationFillMode: 'both' }}>
              <label className="input-label">
                <User size={14} /> Full Legal Name
              </label>
              <input 
                type="text" 
                name="patientName"
                className="input-field" 
                placeholder="e.g. Jane Doe" 
                value={formData.patientName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group delay-200 animate-slide-up" style={{ animationFillMode: 'both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>
                  <Phone size={14} /> Contact Number
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600 }}>
                  <input type="checkbox" checked={isRevisit} onChange={(e) => setIsRevisit(e.target.checked)} style={{ accentColor: 'var(--accent-color)' }} />
                  Revisiting? (Medication ineffective)
                </label>
              </div>
              <div style={{ display: 'flex', position: 'relative', marginTop: '0.4rem' }}>
                <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--text-muted)' }}>+91</span>
                <input 
                  type="tel" 
                  name="phoneNumber"
                  className="input-field" 
                  placeholder="9876543210" 
                  pattern="\d{10}"
                  maxLength={10}
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  style={{ paddingLeft: '3.5rem' }}
                  required
                />
              </div>
            </div>

            <div className="delay-300 animate-slide-up inner-form-grid">
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">
                  <Calendar size={14} /> Preferred Date
                </label>
                <input 
                  type="date" 
                  name="date"
                  className="input-field"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ cursor: 'pointer' }}
                  required
                />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">
                  <Clock size={14} /> Preferred Time
                </label>
                <select 
                  name="time"
                  className="input-field"
                  value={formData.time}
                  onChange={handleChange}
                  style={{ cursor: 'pointer' }}
                  required
                >
                  {timeOptions.map((t, idx) => (
                     <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group delay-400 animate-slide-up" style={{ marginBottom: '2.5rem', animationFillMode: 'both' }}>
              <label className="input-label">
                <Activity size={14} /> Primary Symptoms
              </label>
              <textarea 
                name="symptoms"
                className="input-field" 
                placeholder="Describe your condition briefly..." 
                rows={3}
                value={formData.symptoms}
                onChange={handleChange}
                style={{ resize: 'none' }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary delay-500 animate-slide-up" style={{ width: '100%', display: 'flex', justifyContent: 'center', animationFillMode: 'both' }}>
              <CalendarPlus size={20} />
              Generate Queue Ticket
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
