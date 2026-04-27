import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Header from '../components/Header';

export default function Profile() {
    const navigate = useNavigate();

    const [userInfo, setUserInfo] = useState({ name: '-', email: '-', username: '' });
    const [adminGroups, setAdminGroups] = useState([]);
    const [memberSpaces, setMemberSpaces] = useState([]);

    const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
    const [selectedSpaceId, setSelectedSpaceId] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');

    // --- 스페이스 수정 모달 상태 ---
    const [isSpaceEditModalOpen, setIsSpaceEditModalOpen] = useState(false);
    const [editSpaceName, setEditSpaceName] = useState('');
    const [editingSpaceId, setEditingSpaceId] = useState(null);

    // 🌟 [추가] 무한 스크롤 상태 관리 (Cursor 기반)
    const [adminCursor, setAdminCursor] = useState(null);
    const [hasMoreAdmin, setHasMoreAdmin] = useState(true);
    const [isAdminFetching, setIsAdminFetching] = useState(false);

    const [memberCursor, setMemberCursor] = useState(null);
    const [hasMoreMember, setHasMoreMember] = useState(true);
    const [isMemberFetching, setIsMemberFetching] = useState(false);

    const PER_PAGE = 10; //

    // 🌟 [수정] 초기 데이터 로드 로직 분리
    useEffect(() => {
        const savedId = localStorage.getItem("loginId");
        loadMyProfile(savedId);
        refreshAllSpaces(); // 처음 진입 시 데이터 초기화 및 로드
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

    // 🌟 [추가] 전체 새로고침 함수 (수정/인계 후 사용)
    const refreshAllSpaces = () => {
        setAdminGroups([]);
        setAdminCursor(null);
        setHasMoreAdmin(true);
        loadAdminGroups(true);

        setMemberSpaces([]);
        setMemberCursor(null);
        setHasMoreMember(true);
        loadMemberSpaces(true);
    };

    // 🌟 [추가/수정] 관리 중인 그룹 로드 (무한 스크롤 대응)
    const loadAdminGroups = async (isInitial = false) => {
        if (!isInitial && (!hasMoreAdmin || isAdminFetching)) return;
        setIsAdminFetching(true);

        try {
            const res = await api.get('/userSpace/getAdminSpaces', { 
                params: { 
                    cursor: isInitial ? null : adminCursor, 
                    perPage: PER_PAGE, 
                    orderWay: 'desc', 
                    deleted: false 
                } 
            });

            const newData = res.data || [];
            if (newData.length < PER_PAGE) setHasMoreAdmin(false);
            if (newData.length > 0) setAdminCursor(newData[newData.length - 1].id);

            const parsedAdmins = [];
            const adminGroupSet = new Map(); // 중복 그룹 방지 로직 유지

            newData.forEach(item => {
                const groupName = item.groupName || "그룹없음";
                const groupId = item.groupId;
                if (!adminGroupSet.has(groupName)) {
                    adminGroupSet.set(groupName, groupId);
                    parsedAdmins.push({
                        id: groupId,
                        spaceId: item.spaceId,
                        name: groupName,
                        description: '관리 중인 그룹',
                        role: 'admin',
                        roleLabel: '그룹 관리자',
                        code: item.spaceCode || ""
                    });
                }
            });

            setAdminGroups(prev => isInitial ? parsedAdmins : [...prev, ...parsedAdmins]);
        } catch (error) {
            console.error('관리자 그룹 로드 실패:', error);
        } finally {
            setIsAdminFetching(false);
        }
    };

    // 🌟 [추가/수정] 참여 중인 스페이스 로드 (무한 스크롤 대응)
    const loadMemberSpaces = async (isInitial = false) => {
        if (!isInitial && (!hasMoreMember || isMemberFetching)) return;
        setIsMemberFetching(true);

        try {
            const res = await api.get('/userSpace/getProfileSpaces', { 
                params: { 
                    cursor: isInitial ? null : memberCursor, 
                    perPage: PER_PAGE, 
                    orderWay: 'desc', 
                    deleted: false 
                } 
            });

            const newData = res.data || [];
            if (newData.length < PER_PAGE) setHasMoreMember(false);
            if (newData.length > 0) setMemberCursor(newData[newData.length - 1].id);

            const parsedMembers = newData.map(item => ({
                id: item.groupId,
                spaceId: item.spaceId,
                name: item.groupName || "그룹없음",
                description: item.workName || "업무명없음",
                role: 'member',
                roleLabel: '워크 스페이스',
                code: item.spaceCode || "",
                adminName: item.adminName || '확인 필요',
                ongoingApprovalId: item.ongoingApprovalId // 인계 상태 유지
            }));

            setMemberSpaces(prev => isInitial ? parsedMembers : [...prev, ...parsedMembers]);
        } catch (error) {
            console.error('참여 스페이스 로드 실패:', error);
        } finally {
            setIsMemberFetching(false);
        }
    };

    // 🌟 [추가] 스크롤 이벤트 핸들러
    const handleAdminScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 30) {
            loadAdminGroups();
        }
    };

    const handleMemberScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 30) {
            loadMemberSpaces();
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
            await api.post('/approval/start', {
                spaceId: selectedSpaceId,
                email: inviteEmail.trim()
            });
            alert('인계(초대) 메일을 발송했습니다.');
            setIsHandoverModalOpen(false);
            refreshAllSpaces(); // 🌟 [수정] 새로고침 호출
        } catch (error) {
            alert(error.response?.data?.message || "초대에 실패했습니다.");
        }
    };

    const handleOpenSpaceEdit = (spaceId, currentName) => {
        setEditingSpaceId(spaceId);
        setEditSpaceName(currentName);
        setIsSpaceEditModalOpen(true);
    };

    const handleSpaceUpdate = async () => {
        if (!editSpaceName.trim()) { alert('변경할 스페이스 이름을 입력해주세요.'); return; }
        try {
            await api.put('/space', { id: editingSpaceId, workName: editSpaceName.trim() });
            alert('스페이스 이름이 변경되었습니다.');
            setIsSpaceEditModalOpen(false);
            refreshAllSpaces(); // 🌟 [수정] 새로고침 호출
        } catch (error) {
            alert(error.response?.data?.message || '스페이스 수정에 실패했습니다.');
        }
    };

    return (
        <div style={styles.pageBackground}>
            <Header
                leftType="back"
                title="마이 프로필"
                rightElement={
                    <button style={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
                }
            />

            <main style={styles.mainContainer}>
                {/* 1: 기본 정보 */}
                <section style={styles.panel}>
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

                {/* 2: 내가 관리 중인 그룹 */}
                <section style={styles.panel}>
                    <div style={styles.panelTitleRow}>
                        <span className="material-icons" style={{ color: '#F59E0B', fontSize: '24px' }}>workspace_premium</span>
                        <h2 style={styles.panelTitle}>내가 관리 중인 그룹</h2>
                    </div>

                    {/* 🌟 [수정] onScroll 핸들러 연결 */}
                    <div style={styles.scrollArea} onScroll={handleAdminScroll}>
                        {adminGroups.length === 0 ? (
                            <p style={styles.emptyText}>관리 중인 그룹이 없습니다.</p>
                        ) : (
                            adminGroups.map((group, idx) => (
                                <div key={`admin-${group.id}-${idx}`} style={styles.groupCard}>
                                    <div style={styles.groupHeader}>
                                        <span style={styles.badgeAdmin}>{group.roleLabel}</span>
                                    </div>
                                    <div style={styles.groupBody}>
                                        <div>
                                            <h4 style={styles.groupName}>{group.name}</h4>
                                            <p style={styles.groupDesc}>{group.description}</p>
                                        </div>
                                        <button style={styles.manageBtn} onClick={() => navigate(`/group/spacelist/${group.id}`)}>그룹 관리</button>
                                    </div>
                                </div>
                            ))
                        )}
                        {/* 🌟 [추가] 로딩 표시 */}
                        {isAdminFetching && <div style={{textAlign: 'center', padding: '10px', fontSize: '12px', color: '#94A3B8'}}>목록을 더 불러오는 중...</div>}
                    </div>
                    <button style={styles.joinNewGroupBtn} onClick={() => navigate('/group/create')}>+ 새로운 그룹 생성하기</button>
                </section>

                {/* 3: 내가 참여 중인 스페이스 */}
                <section style={styles.panel}>
                    <div style={styles.panelTitleRow}>
                        <span className="material-icons" style={{ color: '#10B981', fontSize: '24px' }}>corporate_fare</span>
                        <h2 style={styles.panelTitle}>내가 참여 중인 스페이스</h2>
                    </div>

                    {/* 🌟 [수정] onScroll 핸들러 연결 */}
                    <div style={styles.scrollArea} onScroll={handleMemberScroll}>
                        {memberSpaces.length === 0 ? (
                            <p style={styles.emptyText}>참여 중인 스페이스가 없습니다.</p>
                        ) : (
                            memberSpaces.map((space, idx) => (
                                <div key={`member-${space.id}-${idx}`} style={styles.groupCard}>
                                    <div style={styles.groupHeader}>
                                        <span style={styles.badgeMember}>{space.roleLabel}</span>
                                    </div>
                                    <div style={styles.groupBody}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                                <h4 style={{ ...styles.groupName, marginBottom: 0 }}>{space.description}</h4>
                                                <button
                                                    style={{ background: 'none', border: 'none', cursor: space.ongoingApprovalId ? 'not-allowed' : 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}
                                                    onClick={() => !space.ongoingApprovalId && handleOpenSpaceEdit(space.spaceId, space.description)}
                                                    disabled={!!space.ongoingApprovalId}
                                                    title={space.ongoingApprovalId ? "인수인계 중에는 수정할 수 없습니다." : "스페이스 이름 수정"}
                                                >
                                                    <span className="material-icons" style={{ color: space.ongoingApprovalId ? '#D1D5DB' : '#9CA3AF', fontSize: '16px' }}>edit</span>
                                                </button>
                                            </div>
                                            <p style={styles.groupDesc}>{space.name}</p>
                                            <p style={styles.adminNameText}>관리자: {space.adminName}</p>
                                        </div>
                                        {/* 🌟 [수정] 인계 중 상태 버튼 차단 로직 유지 */}
                                        {space.ongoingApprovalId ? (
                                            <button style={{...styles.handoverBtn, backgroundColor: '#E2E8F0', color: '#94A3B8', borderColor: '#CBD5E1', cursor: 'not-allowed'}} disabled>인계 중</button>
                                        ) : (
                                            <button style={styles.handoverBtn} onClick={() => handleOpenHandoverModal(space.spaceId)}>인계하기</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        {/* 🌟 [추가] 로딩 표시 */}
                        {isMemberFetching && <div style={{textAlign: 'center', padding: '10px', fontSize: '12px', color: '#94A3B8'}}>목록을 더 불러오는 중...</div>}
                    </div>
                </section>
            </main>

            {/* ... 모달들 생략 (변동 없음) ... */}
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

            {isSpaceEditModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>스페이스 이름 수정</h2>
                        <input
                            type="text"
                            style={styles.modalInput}
                            placeholder="새 스페이스 이름"
                            value={editSpaceName}
                            onChange={(e) => setEditSpaceName(e.target.value)}
                        />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancel} onClick={() => setIsSpaceEditModalOpen(false)}>취소</button>
                            <button style={styles.modalConfirm} onClick={handleSpaceUpdate}>수정 완료</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// styles 객체는 기존과 동일하게 유지
const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    logoutBtn: { padding: '8px 16px', backgroundColor: '#FFFFFF', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    editBtn: { padding: '6px 12px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid #D1D5DB', cursor: 'pointer' },
    mainContainer: { flex: 1, maxWidth: '1400px', margin: '40px auto', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', padding: '0 24px' },
    panel: { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' },
    panelTitleRowSpaceBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0 },
    panelTitleRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexShrink: 0 },
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
    emptyText: { color: '#6B7280', textAlign: 'center', padding: '40px', fontSize: '14px' },
    scrollArea: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' },
    groupCard: { border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', backgroundColor: '#F9FAFB', flexShrink: 0 },
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
    joinNewGroupBtn: { marginTop: '24px', width: '100%', padding: '16px', backgroundColor: 'rgba(239, 246, 255, 0.5)', border: '1px dashed #3B82F6', borderRadius: '8px', color: '#3B82F6', fontSize: '14px', cursor: 'pointer', fontWeight: '600', textAlign: 'center', flexShrink: 0 },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#111827' },
    modalDesc: { fontSize: '14px', color: '#64748B', marginBottom: '24px' },
    modalInput: { width: '100%', padding: '14px', border: '1px solid #D1D5DB', borderRadius: '8px', marginBottom: '24px', outline: 'none', boxSizing: 'border-box' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    modalCancel: { padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    modalConfirm: { padding: '10px 20px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};