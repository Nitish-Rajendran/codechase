import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, Zap, Trophy } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0F172A] text-white">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 w-full h-full pointer-events-none"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20" />
          </motion.div>
          
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/room/:id" element={<Room />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>

          <div className="fixed bottom-4 right-4 flex gap-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 bg-purple-600 rounded-full"
            >
              <Terminal size={24} />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 bg-blue-600 rounded-full"
            >
              <Zap size={24} />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-2 bg-yellow-600 rounded-full"
            >
              <Trophy size={24} />
            </motion.div>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;