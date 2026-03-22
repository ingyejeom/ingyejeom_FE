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

// 💡 핵심: 로그인 상태를 검사하는 '보호된 라우트' 래퍼(Wrapper) 컴포넌트
const ProtectedRoute = ({ children }) => {
  // 로컬 스토리지에 로그인 기록(loginId)이 있는지 확인합니다.
  const isLoggedin = localStorage.getItem('loginId');

  // 로그인 기록이 없다면 무조건 로그인 페이지로 튕겨냅니다(Redirect).
  if (!isLoggedin) {
    return <Navigate to="/auth" replace />;
  }

  // 로그인 상태라면 정상적으로 원래 가려던 페이지(children)를 보여줍니다.
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인/회원가입 페이지는 누구나 접근 가능해야 함 */}
        <Route path="/auth" element={<Auth />} />

        {/* 💡 로그인해야만 접근할 수 있는 페이지들을 <ProtectedRoute>로 감싸줍니다. */}
        <Route path="/group/create" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/space/join" element={<ProtectedRoute><JoinSpace /></ProtectedRoute>} />
        <Route path="/space/:spaceId" element={<ProtectedRoute><Space /></ProtectedRoute>} />
        <Route path="/space/:spaceId/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/group/manage/:groupId" element={<ProtectedRoute><SpaceList /></ProtectedRoute>} />

        <Route path="/handover/create" element={<ProtectedRoute><Handover /></ProtectedRoute>} />
        <Route path="/handover/view/:id" element={<ProtectedRoute><Handover /></ProtectedRoute>} />
        <Route path="/handover/edit/:id" element={<ProtectedRoute><Handover /></ProtectedRoute>} />

        {/* 💡 홈 화면(루트) 역시 로그인 검사를 거치도록 Layout을 감싸줍니다. */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;