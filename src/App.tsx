
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClinicProvider } from './context/ClinicContext'
import PatientPortal from './pages/PatientPortal'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <ClinicProvider>
      <BrowserRouter>
        <Routes>
          {/* Patient facing route */}
          <Route path="/book" element={<PatientPortal />} />
          
          {/* Doctor facing route */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Default Route */}
          <Route path="*" element={<Navigate to="/book" replace />} />
        </Routes>
      </BrowserRouter>
    </ClinicProvider>
  )
}

export default App
