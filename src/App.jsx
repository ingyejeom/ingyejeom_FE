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
        {/* 독립 페이지들 */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/group/create" element={<CreateGroup />} />
        <Route path="/space/join" element={<JoinSpace />} />
        <Route path="/space/:spaceId" element={<Space />} />
        <Route path="/space/:spaceId/archive" element={<Archive />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/group/manage/:groupId" element={<SpaceList />} />
        <Route path="handover/create" element={<Handover />} />
        <Route path="handover/edit" element={<Handover />} />

        {/* 공통 레이아웃이 적용되는 페이지... 라고 하고 그냥 홈 레이아웃임 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;