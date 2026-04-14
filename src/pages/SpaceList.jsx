import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import Header from '../components/Header';

export default function SpaceList() {
    const navigate = useNavigate();
    const { groupId } = useParams();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [spaces, setSpaces] = useState([]);

    // 그룹 정보를 저장하기 위한 state (그룹 이름 표시용)
    const [groupInfo, setGroupInfo] = useState({ name: '그룹' });

    // 추가된 모달 상태 관리
    const [isGroupEditModalOpen, setIsGroupEditModalOpen] = useState(false);
    const [editGroupName, setEditGroupName] = useState('');

    const [isAddSpaceModalOpen, setIsAddSpaceModalOpen] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');

    const [isSpaceEditModalOpen, setIsSpaceEditModalOpen] = useState(false);
    const [editingSpace, setEditingSpace] = useState(null);
    const [editSpaceName, setEditSpaceName] = useState('');

    const fetchSpaces = async () => {
        try {
            const res = await api.get('/userSpace/getAdminSpaces', {
                params: { groupId: groupId, deleted: false }
            });

            const formattedSpaces = res.data.map(item => ({
                id: item.spaceId,
                workName: item.workName || '이름 없음',
                userName: item.userName || '확인 필요',
                createdAt: item.createdAt
            }));

            setSpaces(formattedSpaces);
        } catch (error) {
            console.error("스페이스 목록 로딩 실패:", error);
        }
    };

    const fetchGroupInfo = async () => {
        try {
            const res = await api.get('/group', { params: { id: groupId } });
            // 백엔드 응답(groupName)을 프론트엔드 상태(name)에 매핑
            if (res.data) {
                setGroupInfo({ ...res.data, name: res.data.groupName || '그룹' });
            }
        } catch (error) {
            console.error("그룹 정보 로딩 실패:", error);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchSpaces();
            fetchGroupInfo();
        }
    }, [groupId]);

    const handleOpenModal = (space) => {
        setSelectedSpace(space);
        setInviteEmail('');
        setIsModalOpen(true);
    };

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

    // --- 그룹 관련 핸들러 ---
    const handleGroupUpdate = async () => {
        if (!editGroupName.trim()) { alert('변경할 그룹 이름을 입력해주세요.'); return; }
        try {
            // 수정 완료: DTO에 맞춰 name 대신 groupName으로 파라미터 전송
            await api.put('/group', { id: groupId, groupName: editGroupName.trim() });
            alert('그룹 이름이 변경되었습니다.');
            setIsGroupEditModalOpen(false);
            fetchGroupInfo(); // 변경된 이름 다시 불러오기
        } catch (error) {
            alert('그룹 수정에 실패했습니다.');
        }
    };

    const handleGroupDelete = async () => {
        if (!window.confirm("정말 이 그룹을 삭제하시겠습니까?\n포함된 모든 스페이스도 함께 삭제 처리됩니다.")) return;
        try {
            await api.delete('/group', { data: { id: groupId } });
            alert('그룹이 삭제되었습니다.');
            navigate('/'); // 삭제 후 홈으로 이동
        } catch (error) {
            alert('그룹 삭제에 실패했습니다.');
        }
    };

    // --- 스페이스 추가 핸들러 ---
    const handleAddSpace = async () => {
        if (!newSpaceName.trim()) { alert('스페이스(업무) 명을 입력해주세요.'); return; }
        try {
            await api.post('/space', { groupId: groupId, workName: newSpaceName.trim() });
            alert('스페이스가 생성되었습니다.');
            setIsAddSpaceModalOpen(false);
            setNewSpaceName('');
            fetchSpaces();
        } catch (error) {
            alert('스페이스 생성에 실패했습니다.');
        }
    };

    // --- 스페이스 수정 및 삭제 핸들러 ---
    const handleOpenSpaceEdit = (space) => {
        setEditingSpace(space);
        setEditSpaceName(space.workName);
        setIsSpaceEditModalOpen(true);
    };

    const handleSpaceUpdate = async () => {
        if (!editSpaceName.trim()) { alert('변경할 스페이스 이름을 입력해주세요.'); return; }
        try {
            await api.put('/space', { id: editingSpace.id, workName: editSpaceName.trim() });
            alert('스페이스 이름이 변경되었습니다.');
            setIsSpaceEditModalOpen(false);
            fetchSpaces();
        } catch (error) {
            alert('스페이스 수정에 실패했습니다.');
        }
    };

    const handleSpaceDelete = async (spaceId) => {
        if (!window.confirm("정말 이 스페이스를 삭제하시겠습니까?")) return;
        try {
            await api.delete('/space', { data: { id: spaceId } });
            alert('스페이스가 삭제되었습니다.');
            fetchSpaces(); // 리스트 갱신
        } catch (error) {
            alert('스페이스 삭제에 실패했습니다.');
        }
    };

    // Header 왼쪽 영역 (홈 아이콘만 배치, 타이틀은 Header 컴포넌트 prop으로 넘겨서 중앙정렬)
    const customHeaderLeft = (
        <div style={styles.homeIcon} onClick={() => navigate('/')}>
            <span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>home</span>
        </div>
    );

    return (
        <div style={styles.pageBackground}>
            <Header leftContent={customHeaderLeft} title="스페이스 관리" />

            <main style={styles.mainContainer}>
                {/* 그룹 제목 및 관리 버튼 영역 */}
                <div style={styles.headerSection}>
                    <h2 style={styles.groupTitle}>{groupInfo.name}</h2>
                    <div style={styles.groupActions}>
                        <button style={styles.addSpaceBtn} onClick={() => setIsAddSpaceModalOpen(true)}>+ 스페이스 추가</button>
                        <button style={styles.editGroupBtn} onClick={() => { setEditGroupName(groupInfo.name); setIsGroupEditModalOpen(true); }}>그룹 수정</button>
                        <button style={styles.deleteGroupBtn} onClick={handleGroupDelete}>그룹 삭제</button>
                    </div>
                </div>

                {/* 스페이스 목록 타이틀 */}
                <h1 style={styles.pageTitle}>스페이스 목록</h1>
                <div style={styles.listContainer}>
                    {spaces.length > 0 ? (
                        spaces.map(space => (
                            <div key={space.id} style={styles.spaceCard}>
                                <div style={styles.cardInfo}>
                                    <h3 style={styles.spaceTitle}>{space.workName}</h3>
                                    <p style={styles.spaceManager}>담당자: {space.userName}</p>
                                    <p style={styles.spaceDate}>생성일: {space.createdAt ? space.createdAt.split('T')[0] : '알 수 없음'}</p>
                                </div>
                                <div style={styles.cardActions}>
                                    <button style={styles.primaryBtn} onClick={() => navigate(`/space/${space.id}`)}>스페이스 입장</button>
                                    <button style={styles.secondaryBtn} onClick={() => navigate(`/space/${space.id}/archive`)}>자료실 보기</button>
                                    <button style={styles.tertiaryBtn} onClick={() => handleOpenModal(space)}>초대/권한</button>
                                    {/* 개별 스페이스 관리 뱃지버튼 */}
                                    <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid #E2E8F0', paddingLeft: '12px', marginLeft: '4px' }}>
                                        <button style={styles.iconActionBtn} onClick={() => handleOpenSpaceEdit(space)} title="수정"><span className="material-icons" style={{ fontSize: '16px' }}>edit</span></button>
                                        <button style={{ ...styles.iconActionBtn, color: '#EF4444' }} onClick={() => handleSpaceDelete(space.id)} title="삭제"><span className="material-icons" style={{ fontSize: '16px' }}>delete</span></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                            이 그룹에 아직 생성된 스페이스(업무)가 없습니다.<br />우측 상단의 '+ 스페이스 추가' 버튼을 눌러 스페이스를 생성해보세요.
                        </div>
                    )}
                </div>
            </main>

            <footer style={styles.footer}>© 2026 INGYEJEOM. All rights reserved.</footer>

            {/* 초대 모달 */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>업무 인계하기 (초대)</h2>
                        <p style={styles.modalDesc}>'{selectedSpace?.workName}' 스페이스를 인계받을 사용자의 이메일을 입력하세요.</p>
                        <input type="email" style={styles.modalInput} placeholder="participant@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancel} onClick={() => setIsModalOpen(false)}>취소</button>
                            <button style={styles.modalConfirm} onClick={handleConfirmInvite}>초대 발송</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 그룹 이름 수정 모달 */}
            {isGroupEditModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>그룹 이름 수정</h2>
                        <input type="text" style={styles.modalInput} placeholder="새 그룹 이름" value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancel} onClick={() => setIsGroupEditModalOpen(false)}>취소</button>
                            <button style={styles.modalConfirm} onClick={handleGroupUpdate}>수정 완료</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 스페이스 추가 모달 */}
            {isAddSpaceModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>스페이스 추가</h2>
                        <p style={styles.modalDesc}>새로운 업무 스페이스 이름을 입력하세요.</p>
                        <input type="text" style={styles.modalInput} placeholder="스페이스(업무) 명" value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} />
                        <div style={styles.modalActions}>
                            <button style={styles.modalCancel} onClick={() => setIsAddSpaceModalOpen(false)}>취소</button>
                            <button style={styles.modalConfirm} onClick={handleAddSpace}>추가</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 스페이스 이름 수정 모달 */}
            {isSpaceEditModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>스페이스 이름 수정</h2>
                        <input type="text" style={styles.modalInput} placeholder="새 스페이스 이름" value={editSpaceName} onChange={(e) => setEditSpaceName(e.target.value)} />
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

const styles = {
    pageBackground: { backgroundColor: '#F1F5F9', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    homeIcon: { width: '32px', height: '32px', backgroundColor: '#475569', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    mainContainer: { flex: 1, maxWidth: '1000px', margin: '40px auto', width: '100%', padding: '0 24px' },
    headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    groupTitle: { fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 },
    pageTitle: { fontSize: '18px', fontWeight: '700', fontStyle: 'italic', color: '#0F172A', marginBottom: '24px' },
    groupActions: { display: 'flex', gap: '8px' },
    addSpaceBtn: { padding: '8px 16px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    editGroupBtn: { padding: '8px 16px', backgroundColor: '#fff', color: '#334155', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    deleteGroupBtn: { padding: '8px 16px', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' },
    spaceCard: { backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { display: 'flex', flexDirection: 'column', gap: '6px' },
    spaceTitle: { fontSize: '16px', fontWeight: '700', fontStyle: 'italic', color: '#0F172A' },
    spaceManager: { fontSize: '13px', color: '#3B82F6', fontWeight: '600' },
    spaceDate: { fontSize: '12px', color: '#64748B' },
    cardActions: { display: 'flex', gap: '12px', alignItems: 'center' },
    primaryBtn: { backgroundColor: '#4F46E5', color: '#FFFFFF', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', border: 'none', cursor: 'pointer', fontWeight: '600' },
    secondaryBtn: { backgroundColor: '#FFFFFF', color: '#334155', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', border: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: '600' },
    tertiaryBtn: { backgroundColor: 'transparent', color: '#64748B', padding: '10px 12px', fontSize: '13px', border: 'none', cursor: 'pointer', textDecoration: 'underline' },
    iconActionBtn: { backgroundColor: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '4px' },
    footer: { textAlign: 'center', padding: '24px', fontSize: '14px', color: '#64748B' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalTitle: { fontSize: '18px', fontWeight: '700', marginBottom: '8px' },
    modalDesc: { fontSize: '14px', color: '#64748B', marginBottom: '24px' },
    modalInput: { width: '100%', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    modalCancel: { padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    modalConfirm: { padding: '10px 20px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};