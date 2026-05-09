import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Space from './pages/Space';
import Handover from './pages/Handover';
import HandoverList from './pages/handover/HandoverList';
import Admin from './pages/Admin';
import CreateGroup from './pages/CreateGroup';
import JoinSpace from './pages/JoinSpace';
import Archive from './pages/Archive';
import Profile from './pages/Profile';
import SpaceList from './pages/SpaceList';

// (상근) 서명 페이지 라우팅 설정
import Approval from './pages/Approval';

// Demo pages (no login required)
import DemoArchive from './pages/demo/DemoArchive';
import DemoHandover from './pages/demo/DemoHandover';
import DemoHandoverList from './pages/demo/DemoHandoverList';

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
        <Route path="/space/:spaceId/handovers" element={<ProtectedRoute><HandoverList /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/group/spacelist/:groupId" element={<ProtectedRoute><SpaceList /></ProtectedRoute>} />

        <Route path="/handover/create" element={<ProtectedRoute><Handover /></ProtectedRoute>} />
        <Route path="/handover/view/:id" element={<ProtectedRoute><Handover /></ProtectedRoute>} />
        <Route path="/handover/edit/:id" element={<ProtectedRoute><Handover /></ProtectedRoute>} />

        {/* (상근) 서명 페이지 라우팅 설정 */}
        <Route path="/approval/:approvalId" element={<Approval />} />

        {/* 관리자 페이지만 기존 Layout을 사용 */}
        <Route path="/admin" element={<ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>} />

        {/* Demo routes (no login required) */}
        <Route path="/demo" element={<Navigate to="/demo/archive" replace />} />
        <Route path="/demo/archive" element={<DemoArchive />} />
        <Route path="/demo/handovers" element={<DemoHandoverList />} />
        <Route path="/demo/handover/create" element={<DemoHandover />} />
        <Route path="/demo/handover/edit/:id" element={<DemoHandover />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
