import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Space from './pages/Space';
import Handover from './pages/Handover';
import Admin from './pages/Admin';
import CreateGroup from './pages/CreateGroup';
import JoinSpace from './pages/JoinSpace';
import Archive from './pages/Archive';
import Profile from './pages/Profile';
import SpaceList from './pages/SpaceList';

const ProtectedRoute = ({ children }) => {
  const isLoggedin = localStorage.getItem('loginId');
  if (!isLoggedin) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />

        {/* Home*/}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        {/* 단독 헤더를 사용하는 페이지들 */}
        <Route path="/group/create" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/space/join" element={<ProtectedRoute><JoinSpace /></ProtectedRoute>} />
        <Route path="/space/:spaceId" element={<ProtectedRoute><Space /></ProtectedRoute>} />
        <Route path="/space/:spaceId/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/group/spacelist/:groupId" element={<ProtectedRoute><SpaceList /></ProtectedRoute>} />

        <Route path="/handover/create" element={<ProtectedRoute><Handover /></ProtectedRoute>} />
        <Route path="/handover/view/:id" element={<ProtectedRoute><Handover /></ProtectedRoute>} />
        <Route path="/handover/edit/:id" element={<ProtectedRoute><Handover /></ProtectedRoute>} />

        {/* 관리자 페이지만 기존 Layout을 사용 */}
        <Route path="/admin" element={<ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;