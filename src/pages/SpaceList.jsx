import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// 스페이스 관리 페이지 (그룹 관리자용)
export default function SpaceList() {
    const navigate = useNavigate();
    const { groupId } = useParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState(null);

    const spaces = [
        { id: 1, title: '2024 신입생 환영회', date: '2024.01.15', assignee: '이인계 (대리)' },
        { id: 2, title: '멘토링 프로그램', date: '2024.02.01', assignee: '박퇴사 (과장)' },
        { id: 3, title: '기획 세미나', date: '2024.02.10', assignee: '김영업 (차장)' }
    ];

    const handleOpenModal = (space) => {
        setSelectedSpace(space);
        setIsModalOpen(true);
    };

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <button style={styles.backBtn} onClick={() => navigate(-1)}>
                        <span className="material-icons" style={{ fontSize: '20px', marginRight: '4px' }}>arrow_back</span>이전
                    </button>
                    <div style={styles.logoBox} onClick={() => navigate('/')}>
                        <span style={styles.logoIcon}></span>
                        <span style={styles.logoText}>INGYEJEOM</span>
                    </div>
                </div>
                <div style={styles.headerRight}>
                    <div style={styles.profileAvatar} onClick={() => navigate('/profile')} title="마이 프로필로 이동">
                        SD
                    </div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <h1 style={styles.pageTitle}>스페이스 목록</h1>
                <div style={styles.listContainer}>
                    {spaces.map(space => (
                        <div key={space.id} style={styles.spaceCard}>
                            <div style={styles.cardInfo}>
                                <h3 style={styles.spaceTitle}>{space.title}</h3>
                                <p style={styles.spaceDate}>생성일: {space.date}</p>
                                <div style={styles.assigneeBox}>
                                    <span style={styles.assigneeLabel}>인계자:</span>
                                    <div style={styles.assigneeTag}>
                                        <div style={styles.avatarMini}>K</div>
                                        <span>{space.assignee}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={styles.cardActions}>
                                <button style={styles.primaryBtn} onClick={() => navigate(`/space/${space.id}`)}>스페이스로 이동</button>
                                <button style={styles.secondaryBtn} onClick={() => navigate(`/space/${space.id}/archive`)}>인수인계서 보기</button>
                                <button style={styles.tertiaryBtn} onClick={() => handleOpenModal(space)}>권한 변경</button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <footer style={styles.footer}>© 2026 INGYEJEOM. All rights reserved.</footer>

            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>권한 변경</h2>
                        <p style={styles.modalDesc}>'{selectedSpace?.title}'의 새로운 인계자를 설정하세요.</p>
                        <input style={styles.modalInput} placeholder="이메일 또는 이름 검색..." />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancel} onClick={() => setIsModalOpen(false)}>취소</button>
                            <button style={styles.modalConfirm} onClick={() => { alert('권한이 변경되었습니다.'); setIsModalOpen(false); }}>변경하기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F1F5F9', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { height: '64px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '24px' },
    backBtn: { display: 'flex', alignItems: 'center', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
    logoBox: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    logoIcon: { width: '24px', height: '24px', backgroundColor: '#4F46E5', borderRadius: '4px' },
    logoText: { fontSize: '20px', fontWeight: '700', fontStyle: 'italic', color: '#0F172A' },
    headerRight: { display: 'flex', alignItems: 'center' },
    profileAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    mainContainer: { flex: 1, maxWidth: '1000px', margin: '40px auto', width: '100%', padding: '0 24px' },
    pageTitle: { fontSize: '18px', fontWeight: '700', fontStyle: 'italic', color: '#0F172A', marginBottom: '24px' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
    spaceCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { display: 'flex', flexDirection: 'column', gap: '8px' },
    spaceTitle: { fontSize: '16px', fontWeight: '700', fontStyle: 'italic', color: '#0F172A' },
    spaceDate: { fontSize: '13px', color: '#64748B' },
    assigneeBox: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
    assigneeLabel: { fontSize: '13px', fontWeight: '700', fontStyle: 'italic', color: '#475569' },
    assigneeTag: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '4px 12px', borderRadius: '24px', fontSize: '13px', color: '#334155' },
    avatarMini: { width: '20px', height: '20px', backgroundColor: '#E0E7FF', color: '#4F46E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', fontStyle: 'italic' },
    cardActions: { display: 'flex', gap: '12px' },
    primaryBtn: { backgroundColor: '#4F46E5', color: '#FFFFFF', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', border: 'none', cursor: 'pointer' },
    secondaryBtn: { backgroundColor: '#FFFFFF', color: '#334155', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', border: '1px solid #E2E8F0', cursor: 'pointer' },
    tertiaryBtn: { backgroundColor: 'transparent', color: '#64748B', padding: '10px 12px', fontSize: '13px', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
    footer: { textAlign: 'center', padding: '24px', fontSize: '14px', color: '#64748B' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '8px' },
    modalDesc: { fontSize: '14px', color: '#64748B', marginBottom: '24px' },
    modalInput: { width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    modalCancel: { padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    modalConfirm: { padding: '10px 20px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};