import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function Layout() {
    return (
        <div>
            <Header />
            {/* 일단 안 씀 */}
            <main style={{ padding: '20px' }}>
                <Outlet />
            </main>
        </div>
    );
}