import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Profile() {
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState({ name: '-', email: '-', username: '' });
    const [adminGroups, setAdminGroups] = useState([]);
    const [memberSpaces, setMemberSpaces] = useState([]);

    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
    const [selectedSpaceId, setSelectedSpaceId] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');

    const [loginId, setLoginId] = useState('SD');

    useEffect(() => {
        const savedId = localStorage.getItem("loginId");
        if (savedId) {
            setLoginId(savedId.substring(0, 2).toUpperCase());
        }

        loadMyProfile(savedId);
        loadMySpaces();
    }, []);

    const loadMyProfile = async (savedId) => {
        try {
            const res = await api.get('/user', { params: { deleted: false } });
            setUserInfo({
                name: res.data.name || res.data.username || savedId || '',
                email: res.data.email || '',
                username: res.data.username || savedId || ''
            });
        } catch (error) {
            const savedId = localStorage.getItem("loginId");
            if (savedId) {
                setUserInfo({ name: savedId, email: '정보 없음', username: savedId });
            } else {
                navigate('/auth');
            }
        }
    };

    const loadMySpaces = async () => {
        try {
            const res = await api.get('/userSpace/getProfileSpaces', { params: { deleted: false } });
            const data = res.data;

            const adminGroupSet = new Map();
            const parsedAdmins = [];
            const parsedMembers = [];

            data.forEach(item => {
                const role = item.role;
                const groupName = item.groupName || "그룹없음";
                const workName = item.workName || "업무명없음";
                const spaceCode = item.spaceCode || "";
                const groupId = item.groupId;

                if (role === 'ADMIN') {
                    if (!adminGroupSet.has(groupName)) {
                        adminGroupSet.set(groupName, groupId);
                        parsedAdmins.push({
                            id: groupId, spaceId: item.spaceId, name: groupName, description: '관리 중인 그룹', role: 'admin', roleLabel: '그룹 관리자', code: spaceCode
                        });
                    }
                } else if (role === 'USER') {
                    parsedMembers.push({
                        id: groupId, spaceId: item.spaceId, name: groupName, description: workName, role: 'member', roleLabel: '워크 스페이스', code: spaceCode, adminName: item.adminName
                    });
                }
            });

            setAdminGroups(parsedAdmins);
            setMemberSpaces(parsedMembers);
        } catch (error) {
            console.error('스페이스 목록 로드 실패:', error);
        }
    };

    const handleLogout = () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            localStorage.clear();
            navigate("/auth");
        }
    };

    const handleOpenHandoverModal = (spaceId) => {
        setSelectedSpaceId(spaceId);
        setInviteEmail('');
        setIsHandoverModalOpen(true);
    };

    const handleConfirmHandover = async () => {
        if (!inviteEmail.trim()) { alert('이메일을 입력해주세요.'); return; }

        try {
            await api.post('/userSpace/invite', {
                spaceId: selectedSpaceId,
                email: inviteEmail.trim()
            });
            alert('인계(초대) 메일을 발송했습니다.');
            setIsHandoverModalOpen(false);
            loadMySpaces();
        } catch (error) {
            alert(error.response?.data?.message || "초대에 실패했습니다.");
        }
    };

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate(-1)}><span className="material-icons" style={{ fontSize: '20px', marginRight: '4px' }}>arrow_back</span>이전</button>
                <h1 style={styles.headerTitle}>마이 프로필</h1>
                <div style={styles.headerRight}>
                    <button style={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
                    <div style={styles.profileAvatarHeader}>
                        <span className="material-icons" style={{ fontSize: '18px' }}>person</span>
                    </div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <section style={styles.leftPanel}>
                    <div style={styles.panelTitleRowSpaceBetween}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons" style={{ color: '#3B82F6', fontSize: '24px' }}>person</span>
                            <h2 style={styles.panelTitle}>기본 정보</h2>
                        </div>
                        <button style={styles.editBtn} onClick={() => alert('정보 수정 기능은 준비 중입니다.')}>수정하기</button>
                    </div>

                    <div style={styles.profileCard}>
                        <div style={styles.avatarWrapper}><span className="material-icons" style={{ fontSize: '48px', color: '#9CA3AF' }}>person</span></div>
                        <h3 style={styles.userName}>{userInfo.name}</h3>
                        <p style={styles.userRole}>사용자 ID: {userInfo.username}</p>

                        <div style={styles.infoList}>
                            <div style={styles.infoItem}>
                                <p style={styles.infoLabel}>메일</p>
                                <div style={styles.infoValueBox}><span className="material-icons" style={styles.infoIcon}>mail</span><span style={styles.infoText}>{userInfo.email || '-'}</span></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section style={styles.rightPanel}>
                    <div style={styles.panelTitleRow}>
                        <span className="material-icons" style={{ color: '#3B82F6', fontSize: '24px' }}>corporate_fare</span>
                        <h2 style={styles.panelTitle}>내 스페이스 정보</h2>
                    </div>

                    <div style={styles.groupList}>
                        {adminGroups.length === 0 && memberSpaces.length === 0 && (
                            <p style={{ color: '#6B7280', textAlign: 'center', padding: '40px' }}>참여 중인 스페이스가 없습니다.</p>
                        )}

                        {/* 💡 내가 관리 중인 그룹 섹션 */}
                        {adminGroups.length > 0 && (
                            <div style={styles.subSection}>
                                <h3 style={styles.subSectionTitle}>👑 내가 관리 중인 그룹</h3>
                                {adminGroups.map((group, idx) => (
                                    <div key={`admin-${group.id}-${idx}`} style={styles.groupCard}>
                                        <div style={styles.groupHeader}>
                                            <span style={styles.badgeAdmin}>{group.roleLabel}</span>
                                        </div>
                                        <div style={styles.groupBody}>
                                            <div>
                                                <h4 style={styles.groupName}>{group.name}</h4>
                                                <p style={styles.groupDesc}>{group.description}</p>
                                            </div>
                                            <button style={styles.manageBtn} onClick={() => navigate(`/group/manage/${group.id}`)}>그룹 관리</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 💡 내가 참여 중인 스페이스 섹션 */}
                        {memberSpaces.length > 0 && (
                            <div style={styles.subSection}>
                                <h3 style={styles.subSectionTitle}>🏢 내가 참여 중인 스페이스</h3>
                                {memberSpaces.map((space, idx) => (
                                    <div key={`member-${space.id}-${idx}`} style={styles.groupCard}>
                                        <div style={styles.groupHeader}>
                                            <span style={styles.badgeMember}>{space.roleLabel}</span>
                                            {space.code && <span style={styles.spaceCode}>코드: {space.code}</span>}
                                        </div>
                                        <div style={styles.groupBody}>
                                            <div>
                                                <h4 style={styles.groupName}>{space.name}</h4>
                                                <p style={styles.groupDesc}>{space.description}</p>
                                                <p style={styles.adminNameText}>관리자: {space.adminName}</p>
                                            </div>
                                            <button style={styles.handoverBtn} onClick={() => handleOpenHandoverModal(space.spaceId)}>인계하기</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* 💡 버튼명 및 라우팅 경로 변경 */}
                    <button style={styles.joinNewGroupBtn} onClick={() => navigate('/group/create')}>+ 새로운 그룹 생성하기</button>
                </section>
            </main>

            {isHandoverModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>업무 인계하기</h2>
                        <p style={styles.modalDesc}>업무를 인계받을 사용자의 이메일을 입력하세요.</p>
                        <input type="email" style={styles.modalInput} placeholder="example@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancel} onClick={() => setIsHandoverModalOpen(false)}>취소</button>
                            <button style={styles.modalConfirm} onClick={handleConfirmHandover}>초대 발송</button>
                        </div>
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
    logoutBtn: { padding: '8px 16px', backgroundColor: '#FFFFFF', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    editBtn: { padding: '6px 12px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid #D1D5DB', cursor: 'pointer' },
    profileAvatarHeader: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    mainContainer: { flex: 1, maxWidth: '1100px', margin: '40px auto', width: '100%', display: 'flex', gap: '24px', padding: '0 24px' },
    leftPanel: { flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '32px', height: 'fit-content' },
    rightPanel: { flex: 1.5, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column' },
    panelTitleRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' },
    panelTitleRowSpaceBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
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

    groupList: { display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto', maxHeight: '500px', paddingRight: '8px' },
    subSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
    subSectionTitle: { fontSize: '15px', fontWeight: '700', color: '#374151', paddingBottom: '8px', borderBottom: '1px solid #E5E7EB', marginBottom: '4px' },
    groupCard: { border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', backgroundColor: '#F9FAFB' },
    groupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    badgeAdmin: { backgroundColor: '#DBEAFE', color: '#1D4ED8', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' },
    badgeMember: { backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' },
    spaceCode: { fontSize: '12px', color: '#111827', fontWeight: '500' },
    groupBody: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    groupName: { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
    groupDesc: { fontSize: '13px', color: '#6B7280' },
    adminNameText: { fontSize: '11px', color: '#9CA3AF', marginTop: '6px', fontWeight: '500' },
    manageBtn: { backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #DBEAFE', padding: '8px 16px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
    handoverBtn: { backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #DCFCE7', padding: '8px 16px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' },
    joinNewGroupBtn: { marginTop: '24px', width: '100%', padding: '16px', backgroundColor: 'rgba(239, 246, 255, 0.5)', border: '1px dashed #3B82F6', borderRadius: '8px', color: '#3B82F6', fontSize: '14px', cursor: 'pointer', fontWeight: '600', textAlign: 'center' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#111827' },
    modalDesc: { fontSize: '14px', color: '#64748B', marginBottom: '24px' },
    modalInput: { width: '100%', padding: '14px', border: '1px solid #D1D5DB', borderRadius: '8px', marginBottom: '24px', outline: 'none' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    modalCancel: { padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    modalConfirm: { padding: '10px 20px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};