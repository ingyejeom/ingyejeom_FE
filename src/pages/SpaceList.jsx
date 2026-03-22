import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';

export default function SpaceList() {
    const navigate = useNavigate();
    const { groupId } = useParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [spaces, setSpaces] = useState([]);

    useEffect(() => {
        const fetchSpaces = async () => {
            try {
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
        setInviteEmail('');
        setIsModalOpen(true);
    };

    // 초대(인계하기) API 호출 로직 추가
    const handleConfirmInvite = async () => {
        if (!inviteEmail.trim()) { alert('이메일을 입력해주세요.'); return; }
        try {
            await api.post('/userSpace/invite', {
                spaceId: selectedSpace.id,
                email: inviteEmail.trim()
            });
            alert('인계(초대) 메일을 발송했습니다.');
            setIsModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || "초대에 실패했습니다.");
        }
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
                        <span className="material-icons" style={{ fontSize: '16px' }}>person</span>
                    </div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <h1 style={styles.pageTitle}>스페이스 관리</h1>
                {/* 스크롤 리스트 적용 */}
                <div style={styles.listContainer}>
                    {spaces.length > 0 ? (
                        spaces.map(space => (
                            <div key={space.id} style={styles.spaceCard}>
                                <div style={styles.cardInfo}>
                                    <h3 style={styles.spaceTitle}>{space.workName || '이름 없음'}</h3>
                                    {/* 담당자 정보 추가 (API에서 담당자 필드가 추가되면 교체 가능) */}
                                    <p style={styles.spaceManager}>담당자: {space.userName || '확인 필요'}</p>
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

            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>업무 인계하기 (초대)</h2>
                        <p style={styles.modalDesc}>'{selectedSpace?.workName}' 스페이스를 인계받을 사용자의 이메일을 입력하세요.</p>
                        <input
                            type="email"
                            style={styles.modalInput}
                            placeholder="participant@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancel} onClick={() => setIsModalOpen(false)}>취소</button>
                            <button style={styles.modalConfirm} onClick={handleConfirmInvite}>초대 발송</button>
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
    profileAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    mainContainer: { flex: 1, maxWidth: '1000px', margin: '40px auto', width: '100%', padding: '0 24px' },
    pageTitle: { fontSize: '18px', fontWeight: '700', fontStyle: 'italic', color: '#0F172A', marginBottom: '24px' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }, // 💡 스크롤 적용
    spaceCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { display: 'flex', flexDirection: 'column', gap: '6px' },
    spaceTitle: { fontSize: '16px', fontWeight: '700', fontStyle: 'italic', color: '#0F172A' },
    spaceManager: { fontSize: '13px', color: '#3B82F6', fontWeight: '600' },
    spaceDate: { fontSize: '12px', color: '#64748B' },
    cardActions: { display: 'flex', gap: '12px' },
    primaryBtn: { backgroundColor: '#4F46E5', color: '#FFFFFF', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', border: 'none', cursor: 'pointer' },
    secondaryBtn: { backgroundColor: '#FFFFFF', color: '#334155', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', border: '1px solid #E2E8F0', cursor: 'pointer' },
    tertiaryBtn: { backgroundColor: 'transparent', color: '#64748B', padding: '10px 12px', fontSize: '13px', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
    footer: { textAlign: 'center', padding: '24px', fontSize: '14px', color: '#64748B' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '8px' },
    modalDesc: { fontSize: '14px', color: '#64748B', marginBottom: '24px' },
    modalInput: { width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', outline: 'none' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    modalCancel: { padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    modalConfirm: { padding: '10px 20px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};