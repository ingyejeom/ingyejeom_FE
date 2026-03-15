import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();

    // 프로필 이니셜 상태 추가 (기본값 'SD')
    const [loginId, setLoginId] = useState('SD');

    // 컴포넌트가 렌더링될 때 로컬스토리지에서 로그인한 아이디를 가져옴
    useEffect(() => {
        const savedId = localStorage.getItem("loginId");
        if (savedId) {
            // 아이디의 앞 2글자를 대문자로 잘라서 세팅
            setLoginId(savedId.substring(0, 2).toUpperCase());
        }
    }, []);

    return (
        <header style={styles.header}>
            {/* 왼쪽: 로고 */}
            <div style={styles.left} onClick={() => navigate('/')}>
                <div style={styles.logoBox}>
                    <span style={styles.logoIcon}></span>
                    <span style={styles.logoText}>INGYEJEOM</span>
                </div>
            </div>

            <div style={styles.center}>
                <span style={styles.navText}>내 스페이스</span>
            </div>

            {/* 오른쪽: 액션 버튼 */}
            <div style={styles.right}>
                <button style={styles.joinBtn} onClick={() => navigate('/space/join')}>
                    워크스페이스 참여
                </button>
                <button style={styles.createBtn} onClick={() => navigate('/group/create')}>
                    + 그룹 생성
                </button>
                <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>
                    {loginId}
                </div>
            </div>
        </header>
    );
}

const styles = {
    header: {
        position: 'relative',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: '64px', padding: '0 40px', backgroundColor: 'var(--white)', borderBottom: '1px solid var(--border-color)',
    },
    left: { display: 'flex', alignItems: 'center', cursor: 'pointer' },
    logoBox: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoIcon: { width: '24px', height: '24px', backgroundColor: 'var(--primary-color)', borderRadius: '4px' },
    logoText: { fontSize: '20px', fontWeight: '700', fontStyle: 'italic', color: '#111827' },

    center: { position: 'absolute', left: '50%', transform: 'translateX(-50%)' },
    navText: { fontSize: '16px', fontWeight: '700', color: '#374151', cursor: 'pointer' },

    right: { display: 'flex', alignItems: 'center', gap: '12px' },
    joinBtn: { padding: '8px 16px', backgroundColor: '#EFF6FF', color: 'var(--primary-color)', borderRadius: 'var(--border-radius-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
    createBtn: { padding: '8px 16px', backgroundColor: 'var(--primary-color)', color: 'var(--white)', borderRadius: 'var(--border-radius-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
    profileAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }
};