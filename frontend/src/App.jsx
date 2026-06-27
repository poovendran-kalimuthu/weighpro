import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Weighment from './pages/Weighment';
import Customers from './pages/Customers';
import Vehicles from './pages/Vehicles';
import Materials from './pages/Materials';
import Drivers from './pages/Drivers';
import SmsDashboard from './pages/SmsDashboard';
import SmsHistory from './pages/SmsHistory';
import SmsSettings from './pages/SmsSettings';
import SerialConfig from './pages/SerialConfig';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="weighment" element={<Weighment />} />
          <Route path="customers" element={<Customers />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="materials" element={<Materials />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="sms" element={<SmsDashboard />} />
          <Route path="sms/history" element={<SmsHistory />} />
          <Route path="sms/settings" element={<SmsSettings />} />
          <Route path="serial/settings" element={<SerialConfig />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
