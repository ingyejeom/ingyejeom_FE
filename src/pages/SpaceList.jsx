import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';

// 스페이스 관리 페이지 (그룹 관리자용)
export default function SpaceList() {
    const navigate = useNavigate();
    const { groupId } = useParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [spaces, setSpaces] = useState([]);
    const [loginId, setLoginId] = useState('SD');

    useEffect(() => {
        const savedId = localStorage.getItem("loginId");
        if (savedId) setLoginId(savedId.substring(0, 2).toUpperCase());

        // 백엔드에서 그룹 내 스페이스 목록 가져오기
        const fetchSpaces = async () => {
            try {
                // 특정 groupId에 속한 스페이스 목록을 호출
                const res = await api.get('/space/list', { params: { groupId: groupId, deleted: false } });
                setSpaces(res.data || []);
            } catch (error) {
                console.error("스페이스 목록 로딩 실패:", error);
            }
        };

        if (groupId) fetchSpaces();
    }, [groupId]);

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
                        {loginId}
                    </div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <h1 style={styles.pageTitle}>스페이스 관리</h1>
                <div style={styles.listContainer}>
                    {spaces.length > 0 ? (
                        spaces.map(space => (
                            <div key={space.id} style={styles.spaceCard}>
                                <div style={styles.cardInfo}>
                                    <h3 style={styles.spaceTitle}>{space.workName || '이름 없음'}</h3>
                                    <p style={styles.spaceDate}>생성일: {space.createdAt ? space.createdAt.split('T')[0] : '알 수 없음'}</p>
                                </div>
                                <div style={styles.cardActions}>
                                    <button style={styles.primaryBtn} onClick={() => navigate(`/space/${space.id}`)}>스페이스 입장</button>
                                    <button style={styles.secondaryBtn} onClick={() => navigate(`/space/${space.id}/archive`)}>자료실 보기</button>
                                    <button style={styles.tertiaryBtn} onClick={() => handleOpenModal(space)}>초대 / 권한</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                            이 그룹에 아직 생성된 스페이스(업무)가 없습니다.
                        </div>
                    )}
                </div>
            </main>

            <footer style={styles.footer}>© 2026 INGYEJEOM. All rights reserved.</footer>

            {/* 임시 권한/초대 모달 */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>멤버 관리 / 초대</h2>
                        <p style={styles.modalDesc}>'{selectedSpace?.workName}' 스페이스의 접근 권한을 관리합니다.</p>
                        <input style={styles.modalInput} placeholder="이메일 또는 이름 검색..." />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancel} onClick={() => setIsModalOpen(false)}>취소</button>
                            <button style={styles.modalConfirm} onClick={() => { alert('기능 준비 중입니다.'); setIsModalOpen(false); }}>변경하기</button>
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