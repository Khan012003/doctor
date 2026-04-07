import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Appointment {
  id: string;
  patientName: string;
  phoneNumber: string;
  symptoms: string;
  date: string;
  time: string;
  status: 'Pending' | 'Completed';
  queueNumber: number;
  isRevisit?: boolean;
}

export interface MedicationItem {
  id: string;
  name: string;
  timing: 'Before Food' | 'After Food';
  frequencies: string[];
  daysToTake: number;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  diagnosis: string;
  medications: MedicationItem[];
  requiredTests?: string[];
  doctorComments?: string;
  date: string;
}

interface ClinicContextType {
  queue: Appointment[];
  history: Prescription[];
  isClinicOpen: boolean;
  bookAppointment: (details: Omit<Appointment, 'id' | 'status' | 'queueNumber'>) => Promise<number>;
  completeAppointment: (appointmentId: string, prescriptionDetails: Omit<Prescription, 'id' | 'appointmentId' | 'date'>) => Promise<void>;
  getPatientHistory: (patientName: string) => Prescription[];
  getPastAppointmentByPhone: (phone: string) => Appointment | undefined;
  toggleClinicStatus: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [history, setHistory] = useState<Prescription[]>([]);
  const [isClinicOpen, setIsClinicOpen] = useState(true);

  const fetchInitialData = async () => {
    try {
      const [queueRes, historyRes, statusRes] = await Promise.all([
        fetch('/api/queue').then(r => r.json()),
        fetch('/api/history').then(r => r.json()),
        fetch('/api/status').then(r => r.json())
      ]);
      setQueue(queueRes || []);
      setHistory(historyRes || []);
      setIsClinicOpen(Boolean(statusRes));
    } catch (error) {
      console.error("Failed to fetch clinic data from backend", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
    // Poll for queue updates every 5 seconds (useful for a queue app)
    const interval = setInterval(fetchInitialData, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleClinicStatus = async () => {
    try {
      const res = await fetch('/api/status', { method: 'POST' });
      const newStatus = await res.json();
      setIsClinicOpen(newStatus);
    } catch (e) {
      console.error(e);
    }
  };

  const bookAppointment = async (details: Omit<Appointment, 'id' | 'status' | 'queueNumber'>) => {
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details)
      });
      const queueNumber = await res.json();
      await fetchInitialData(); // Refresh queue
      return queueNumber as number;
    } catch (e) {
      console.error(e);
      return -1;
    }
  };

  const completeAppointment = async (appointmentId: string, details: Omit<Prescription, 'id' | 'appointmentId' | 'date'>) => {
    try {
      await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          ...details
        })
      });
      
      await fetchInitialData(); // Refresh queue and history

      // Mocking WhatsApp Integration
      const appointment = queue.find(q => q.id === appointmentId);
      if (appointment) {
        console.log(`💬 MESSAGE API CALL -> To: ${appointment.phoneNumber} | Body: Prescription generated for ${details.diagnosis}.`);
        
        // Example Twilio actual call if you have it
        /*
        fetch('/twilio-api/2010-04-01/Accounts/.../Messages.json', { ... })
        */
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getPatientHistory = (patientName: string) => {
    const patientAppointments = queue.filter(q => q.patientName.toLowerCase() === patientName.toLowerCase()).map(q => q.id);
    return history.filter(h => patientAppointments.includes(h.appointmentId));
  };

  const getPastAppointmentByPhone = (phone: string) => {
    return [...queue].reverse().find(q => q.phoneNumber === phone);
  };

  return (
    <ClinicContext.Provider value={{ queue, history, isClinicOpen, bookAppointment, completeAppointment, getPatientHistory, getPastAppointmentByPhone, toggleClinicStatus }}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
