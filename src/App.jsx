import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 독립 페이지들 (헤더/레이아웃이 자체적으로 있는 페이지) */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/group/create" element={<CreateGroup />} />
        <Route path="/space/join" element={<JoinSpace />} />
        <Route path="/space/:spaceId" element={<Space />} />
        <Route path="/space/:spaceId/archive" element={<Archive />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/group/manage/:groupId" element={<SpaceList />} />

        {/* 💡 인수인계서 라우터 버그 수정 완료 (파라미터 및 view 추가) */}
        <Route path="/handover/create" element={<Handover />} />
        <Route path="/handover/view/:id" element={<Handover />} />
        <Route path="/handover/edit/:id" element={<Handover />} />

        {/* 공통 레이아웃이 적용되는 페이지 (Layout 내부에서 Header 렌더링) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;