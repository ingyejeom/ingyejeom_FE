import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ leftType = 'logo', leftContent, title = '내 스페이스', rightElement }) {
    const navigate = useNavigate();

    const renderLeft = () => {
        if (leftContent) return leftContent;

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
        return (
            <div style={styles.logoBox} onClick={() => navigate('/')}>
                <div style={styles.logoIcon}></div>
                <span style={styles.logoText}>INGYEJEOM</span>
            </div>
        );
    };

    return (
        <>
            <div style={styles.headerPlaceholder}></div>

            <header style={styles.header}>
                <div style={styles.left}>
                    {renderLeft()}
                </div>

                <div style={styles.center}>
                    <span style={styles.pageTitle}>{title}</span>
                </div>

                <div style={styles.right}>
                    {rightElement}
                    <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>
                        <span className="material-icons" style={{ fontSize: '18px' }}>person</span>
                    </div>
                </div>
            </header>
        </>
    );
}

const styles = {
    headerPlaceholder: {
        height: '70px',
        width: '100%',
        flexShrink: 0
    },
    header: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100vw',
        height: '70px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 40px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        zIndex: 9999,
        boxSizing: 'border-box'
    },
    left: { display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 },
    logoBox: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoIcon: { width: '28px', height: '28px', backgroundColor: '#4F46E5', borderRadius: '6px' },
    logoText: { fontSize: '22px', fontWeight: '800', fontStyle: 'italic', color: '#111827', letterSpacing: '-0.5px' },
    backBtn: { display: 'flex', alignItems: 'center', color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },

    center: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', flex: 2, pointerEvents: 'none' },

    // 수정: 모든 페이지에 공통으로 적용될 통일된 타이틀 디자인 (18px, 진한 색, 굵게)
    pageTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', pointerEvents: 'auto' },

    right: { display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end' },
    profileAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
};