import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 마이 프로필 페이지
export default function Profile() {
    const navigate = useNavigate();

    const [userInfo] = useState({ name: '김철수', role: 'UX Designer', department: 'Design Team', phone: '010-1234-5678', email: 'chulsu.kim@example.com', birth: '1990. 05. 21' });
    const [myGroups] = useState([
        { id: 1, name: '한동 기업 - 기획 1팀', description: '2024 신입생 환영회, 멘토링 프로그램, 기획 세미나', role: 'admin', roleLabel: '그룹 관리자', code: '' },
        { id: 3, name: '삼동전자 - 사내 독서 그룹', description: '도서 선정 및 토론 발제문 작성', role: 'member', roleLabel: '워크 스페이스', code: 'A8F-92K-X01' }
    ]);

    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
    const [selectedSpaceId, setSelectedSpaceId] = useState(null);
    const [selectedApplicant, setSelectedApplicant] = useState(null);

    const applicants = [
        { id: 101, name: '이신입', role: '사원', message: '열심히 배우겠습니다!' },
        { id: 102, name: '박경력', role: '대리', message: '기존 독서 그룹 경험 있습니다.' },
    ];

    const handleOpenHandoverModal = (spaceId) => { setSelectedSpaceId(spaceId); setSelectedApplicant(null); setIsHandoverModalOpen(true); };
    const handleConfirmHandover = () => {
        if (!selectedApplicant) { alert('인계할 사람을 선택해주세요.'); return; }
        alert(`성공적으로 인계되었습니다.`); setIsHandoverModalOpen(false);
    };

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    <span className="material-icons" style={{ fontSize: '20px', marginRight: '4px' }}>arrow_back</span>이전
                </button>
                <h1 style={styles.headerTitle}>마이 프로필</h1>
                <div style={styles.headerRight}>
                    <button style={styles.editBtn} onClick={() => alert('정보 수정 기능은 준비 중입니다.')}>수정하기</button>
                    <div style={styles.profileAvatarHeader}>SD</div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <section style={styles.leftPanel}>
                    <div style={styles.panelTitleRow}><span className="material-icons" style={{ color: '#3B82F6', fontSize: '24px' }}>person</span><h2 style={styles.panelTitle}>기본 정보</h2></div>
                    <div style={styles.profileCard}>
                        <div style={styles.avatarWrapper}><span className="material-icons" style={{ fontSize: '48px', color: '#9CA3AF' }}>person</span></div>
                        <h3 style={styles.userName}>{userInfo.name}</h3><p style={styles.userRole}>{userInfo.role} @ {userInfo.department}</p>
                        <div style={styles.infoList}>
                            <div style={styles.infoItem}><p style={styles.infoLabel}>전화번호</p><div style={styles.infoValueBox}><span className="material-icons" style={styles.infoIcon}>phone</span><span style={styles.infoText}>{userInfo.phone}</span></div></div>
                            <div style={styles.infoItem}><p style={styles.infoLabel}>메일</p><div style={styles.infoValueBox}><span className="material-icons" style={styles.infoIcon}>mail</span><span style={styles.infoText}>{userInfo.email}</span></div></div>
                            <div style={styles.infoItem}><p style={styles.infoLabel}>생년월일</p><div style={styles.infoValueBox}><span className="material-icons" style={styles.infoIcon}>cake</span><span style={styles.infoText}>{userInfo.birth}</span></div></div>
                        </div>
                    </div>
                </section>

                <section style={styles.rightPanel}>
                    <div style={styles.panelTitleRowSpaceBetween}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-icons" style={{ color: '#3B82F6', fontSize: '24px' }}>corporate_fare</span><h2 style={styles.panelTitle}>내 그룹 정보</h2></div>
                    </div>
                    <div style={styles.groupList}>
                        {myGroups.map(group => (
                            <div key={group.id} style={styles.groupCard}>
                                <div style={styles.groupHeader}>
                                    <span style={group.role === 'admin' ? styles.badgeAdmin : styles.badgeMember}>{group.roleLabel}</span>
                                    {group.role === 'member' && group.code && <span style={styles.spaceCode}>스페이스 코드: {group.code}</span>}
                                </div>
                                <div style={styles.groupBody}>
                                    <div><h4 style={styles.groupName}>{group.name}</h4><p style={styles.groupDesc}>{group.description}</p></div>
                                    {group.role === 'admin' ? <button style={styles.manageBtn} onClick={() => navigate(`/group/manage/${group.id}`)}>그룹 관리</button> : <button style={styles.handoverBtn} onClick={() => handleOpenHandoverModal(group.id)}>인계하기</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button style={styles.joinNewGroupBtn} onClick={() => navigate('/space/join')}>새로운 그룹 참여하기</button>
                </section>
            </main>

            {isHandoverModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>인계하기</h2><p style={styles.modalDesc}>스페이스 참여 신청을 보낸 인원 중 인계자를 선택하세요.</p>
                        <div style={styles.applicantList}>
                            {applicants.map(app => (
                                <div key={app.id} style={selectedApplicant === app.id ? styles.applicantCardSelected : styles.applicantCard} onClick={() => setSelectedApplicant(app.id)}>
                                    <div style={styles.applicantInfo}><span style={styles.applicantName}>{app.name}</span><span style={styles.applicantRole}>{app.role}</span></div>
                                    <p style={styles.applicantMsg}>"{app.message}"</p>
                                </div>
                            ))}
                        </div>
                        <div style={styles.modalActions}><button style={styles.modalCancel} onClick={() => setIsHandoverModalOpen(false)}>취소</button><button style={styles.modalConfirm} onClick={handleConfirmHandover}>인계 완료</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { position: 'relative', height: '64px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
    backBtn: { display: 'flex', alignItems: 'center', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', flex: 1 },
    headerTitle: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '18px', fontWeight: '700', color: '#111827' },
    headerRight: { flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' },
    editBtn: { padding: '8px 16px', backgroundColor: '#3B82F6', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer' },
    profileAvatarHeader: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px' },
    mainContainer: { flex: 1, maxWidth: '1100px', margin: '40px auto', width: '100%', display: 'flex', gap: '24px', padding: '0 24px' },
    leftPanel: { flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '32px' },
    rightPanel: { flex: 1.5, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column' },
    panelTitleRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' },
    panelTitleRowSpaceBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
    panelTitle: { fontSize: '18px', fontWeight: '700', color: '#111827' },
    profileCard: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    avatarWrapper: { width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #FFFFFF', outline: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', marginBottom: '16px' },
    userName: { fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
    userRole: { fontSize: '14px', color: '#6B7280', marginBottom: '32px' },
    infoList: { width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
    infoLabel: { fontSize: '12px', fontWeight: '700', color: '#6B7280' },
    infoValueBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F9FAFB', padding: '12px 16px', borderRadius: '8px' },
    infoIcon: { color: '#9CA3AF', fontSize: '18px' },
    infoText: { fontSize: '14px', color: '#374151' },
    groupList: { display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 },
    groupCard: { border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', backgroundColor: '#F9FAFB' },
    groupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    badgeAdmin: { backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' },
    badgeMember: { backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' },
    spaceCode: { fontSize: '12px', color: '#111827', fontWeight: '500' },
    groupBody: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    groupName: { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
    groupDesc: { fontSize: '13px', color: '#6B7280' },
    manageBtn: { backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', padding: '8px 16px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
    handoverBtn: { backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7', padding: '8px 16px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
    joinNewGroupBtn: { marginTop: '24px', width: '100%', padding: '16px', backgroundColor: 'rgba(239, 246, 255, 0.5)', border: '1px dashed #3B82F6', borderRadius: '8px', color: '#3B82F6', fontSize: '14px', cursor: 'pointer', fontWeight: '600', textAlign: 'center' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#111827' },
    modalDesc: { fontSize: '14px', color: '#64748B', marginBottom: '24px' },
    applicantList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' },
    applicantCard: { padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#F9FAFB' },
    applicantCardSelected: { padding: '16px', border: '2px solid #3B82F6', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#EFF6FF' },
    applicantInfo: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
    applicantName: { fontSize: '15px', fontWeight: '700', color: '#111827' },
    applicantRole: { fontSize: '12px', color: '#6B7280' },
    applicantMsg: { fontSize: '13px', color: '#4B5563', fontStyle: 'italic' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    modalCancel: { padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    modalConfirm: { padding: '10px 20px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};