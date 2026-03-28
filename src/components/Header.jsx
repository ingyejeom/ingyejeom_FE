import { useNavigate } from 'react-router-dom';

export default function Header({ leftType = 'logo', leftContent, title = '내 스페이스', rightElement }) {
    const navigate = useNavigate();

    // 왼쪽 영역 렌더링 (커스텀 요소 / 로고 / 뒤로가기 / 닫기)
    const renderLeft = () => {
        if (leftContent) return leftContent; // 커스텀 요소가 넘어오면 그대로 렌더링

        if (leftType === 'back') {
            return (
                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    <span className="material-icons" style={{ fontSize: '20px', marginRight: '4px' }}>arrow_back</span>이전
                </button>
            );
        }
        if (leftType === 'close') {
            return (
                <button style={styles.backBtn} onClick={() => navigate(-1)}>✕</button>
            );
        }
        // 기본값: 로고
        return (
            <div style={styles.logoBox} onClick={() => navigate('/')}>
                <span style={styles.logoIcon}></span>
                <span style={styles.logoText}>INGYEJEOM</span>
            </div>
        );
    };

    return (
        <header style={styles.header}>
            <div style={styles.left}>
                {renderLeft()}
            </div>

            <div style={styles.center}>
                <span style={leftType === 'logo' && !leftContent ? styles.navText : styles.pageTitle}>{title}</span>
            </div>

            <div style={styles.right}>
                {rightElement}
                <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>
                    <span className="material-icons" style={{ fontSize: '18px' }}>person</span>
                </div>
            </div>
        </header>
    );
}

const styles = {
    header: {
        position: 'sticky', top: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        height: '64px', padding: '0 40px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
        zIndex: 50
    },
    left: { display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 },
    logoBox: { display: 'flex', alignItems: 'center', gap: '8px' },
    logoIcon: { width: '24px', height: '24px', backgroundColor: '#4F46E5', borderRadius: '4px' },
    logoText: { fontSize: '20px', fontWeight: '700', fontStyle: 'italic', color: '#111827' },
    backBtn: { display: 'flex', alignItems: 'center', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },

    center: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', flex: 2 },
    navText: { fontSize: '16px', fontWeight: '700', color: '#374151', cursor: 'pointer' },
    pageTitle: { fontSize: '18px', fontWeight: '700', color: '#111827' },

    right: { display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end' },
    profileAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
};