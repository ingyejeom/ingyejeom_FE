import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Header from '../components/Header'; // 공통 헤더 가져오기

export default function Archive() {
    const { spaceId } = useParams();
    const navigate = useNavigate();

    const [currentSpace, setCurrentSpace] = useState({ name: '로딩 중...', department: '' });
    const [mySpaces, setMySpaces] = useState([]);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const [latestHandover, setLatestHandover] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const fetchSpaceInfo = async () => {
            try {
                const res = await api.get('/space', { params: { id: spaceId } });
                setCurrentSpace({
                    name: res.data.workName || '스페이스',
                    department: res.data.groupName || '그룹'
                });
            } catch (error) { console.error(error); }
        };

        const fetchMySpaces = async () => {
            try {
                const res = await api.get('/userSpace/list', { params: { deleted: false } });
                const spaces = res.data.map(item => ({ id: item.spaceId, name: item.workName || item.groupName })).filter(s => s.id != null);
                const uniqueSpaces = Array.from(new Set(spaces.map(s => s.id))).map(id => spaces.find(s => s.id === id));
                setMySpaces(uniqueSpaces);
            } catch (error) { console.error(error); }
        };

        fetchSpaceInfo();
        fetchMySpaces();
        loadArchiveData();
    }, [spaceId]);

    const loadArchiveData = async () => {
        try {
            const handoverRes = await api.get(`/handover/space/${spaceId}`);
            const handovers = handoverRes.data || [];
            if (handovers.length > 0) {
                handovers.sort((a, b) => b.id - a.id);
                setLatestHandover(handovers[0]);
                setHistoryList(handovers.slice(1));
            } else {
                setLatestHandover(null);
                setHistoryList([]);
            }
            const fileRes = await api.get('/file/list', { params: { spaceId: spaceId } });
            setFiles(fileRes.data || []);
        } catch (error) { console.error(error); }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) { alert('업로드할 파일을 선택해주세요.'); return; }
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('spaceId', spaceId.toString());

        try {
            await api.post('/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('자료가 성공적으로 업로드되었습니다!');
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            loadArchiveData();
        } catch (error) { alert('파일 업로드에 실패했습니다.'); }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0].replace(/-/g, '.');
    };

    // 💡 헤더에 넘겨줄 커스텀 왼쪽 요소 (홈 버튼 + 드롭다운)
    const customHeaderLeft = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={styles.homeIcon} onClick={() => navigate('/')}>
                <span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>home</span>
            </div>
            <div style={styles.dropdownContainer}>
                <div style={styles.dropdownToggle} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div><p style={styles.dropdownLabel}>현재 공간</p><p style={styles.dropdownTitle}>{currentSpace.name} - {currentSpace.department}</p></div>
                    <span className="material-icons" style={{ color: '#94A3B8' }}>expand_more</span>
                </div>
                {isDropdownOpen && (
                    <div style={styles.dropdownMenu}>
                        {mySpaces.map(space => <div key={space.id} style={styles.dropdownItem} onClick={() => { setIsDropdownOpen(false); navigate(`/space/${space.id}/archive`); }}>{space.name}</div>)}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div style={styles.pageBackground}>
            {/* 💡 공통 헤더 적용 */}
            <Header leftContent={customHeaderLeft} title="자료실" />

            <main style={styles.mainContainer}>
                <div style={styles.titleSection}>
                    <div><h2 style={styles.pageTitle}>자료실 관리</h2><p style={styles.pageSubTitle}>팀 내 중요 문서와 인수인계 자료를 관리하는 공간입니다.</p></div>
                    <button style={styles.addBtn} onClick={() => setIsUploadModalOpen(true)}>+ 파일 첨부</button>
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>최신 인수인계서</h3>
                        {latestHandover && <span style={styles.lastUpdated}>Last updated: {formatDate(latestHandover.createdAt || latestHandover.modifiedAt)}</span>}
                    </div>

                    {latestHandover ? (
                        <div style={styles.handoverCard}>
                            <div style={styles.handoverContent} onClick={() => navigate(`/handover/view/${latestHandover.id}`)}>
                                <div style={styles.handoverTitleRow}><h4 style={styles.handoverTitle}>{latestHandover.title}</h4><span style={styles.badge}>LATEST</span></div>
                                <p style={styles.handoverDesc}>{latestHandover.role}</p>
                                <div style={styles.handoverMeta}>
                                    <span>작성자: {latestHandover.userName}</span><span style={styles.dot}>•</span>
                                    <span>{formatDate(latestHandover.createdAt)}</span>
                                </div>
                            </div>
                            <div style={styles.handoverActions}>
                                {historyList.length > 0 && <button style={styles.textBtn} onClick={() => setIsHistoryModalOpen(true)}>+ 이전 인수인계서 ({historyList.length})</button>}
                                <button style={styles.textBtn} onClick={() => navigate(`/handover/create?spaceId=${spaceId}`)}>+ 새 인수인계서 작성</button>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.emptyCard}>
                            <p style={styles.emptyText}>아직 작성된 인수인계서가 없습니다.</p>
                            <button style={styles.textBtn} onClick={() => navigate(`/handover/create?spaceId=${spaceId}`)}>+ 첫 인수인계서 작성하기</button>
                        </div>
                    )}
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>첨부 파일 목록</h3>
                    </div>

                    {files.length > 0 ? (
                        <div style={styles.folderGrid}>
                            {files.map(file => (
                                <div key={file.id} style={styles.folderCard} onClick={() => alert(`${file.originalFileName} 다운로드 API 연결 필요`)}>
                                    <span className="material-icons" style={styles.fileIcon}>description</span>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h4 style={styles.folderName} title={file.originalFileName}>{file.originalFileName}</h4>
                                        <p style={styles.folderCount}>{file.uploaderName} • {(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={styles.emptyCard}>
                            <p style={styles.emptyText}>업로드된 파일이 없습니다.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer style={styles.footer}>© 2026 INGYEJEOM. All rights reserved.</footer>

            {isUploadModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>자료 첨부</h3><p style={styles.modalSub}>업로드할 파일을 선택해주세요. (PDF, 이미지 등)</p>
                        <input type="file" style={styles.fileInput} onChange={(e) => setSelectedFile(e.target.files[0])} />
                        <div style={styles.modalActions}>
                            <button style={styles.cancelBtn} onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); }}>취소</button>
                            <button style={styles.confirmBtn} onClick={handleFileUpload}>업로드</button>
                        </div>
                    </div>
                </div>
            )}

            {isHistoryModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContentWide}>
                        <div style={styles.modalHeader}><h3 style={styles.modalTitle}>이전 인수인계서 기록</h3><button style={styles.closeBtn} onClick={() => setIsHistoryModalOpen(false)}>✕</button></div>
                        <div style={styles.historyList}>
                            {historyList.map(item => (
                                <div key={item.id} style={styles.historyItem} onClick={() => navigate(`/handover/view/${item.id}`)}>
                                    <div><h4 style={styles.historyTitle}>{item.title}</h4><p style={styles.historyMeta}>작성자: {item.userName} | 작성일: {formatDate(item.createdAt)}</p></div>
                                    <span className="material-icons" style={{ color: '#94A3B8' }}>chevron_right</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    // 헤더 관련 요소 (홈 버튼, 드롭다운) 스타일은 Header에 넘기기 위해 유지
    homeIcon: { width: '32px', height: '32px', backgroundColor: '#475569', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    dropdownContainer: { position: 'relative' },
    dropdownToggle: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' },
    dropdownLabel: { fontSize: '10px', color: '#64748B' },
    dropdownTitle: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
    dropdownMenu: { position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', width: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '8px', zIndex: 20 },
    dropdownItem: { padding: '12px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },

    mainContainer: { maxWidth: '1000px', margin: '40px auto', flex: 1, width: '100%', padding: '0 20px' },
    titleSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    pageTitle: { fontSize: '24px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' },
    pageSubTitle: { fontSize: '14px', color: '#64748B' },
    addBtn: { padding: '12px 24px', backgroundColor: '#4F46E5', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: 'none' },
    section: { marginBottom: '48px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1E293B' },
    lastUpdated: { fontSize: '12px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' },
    handoverCard: { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', transition: 'box-shadow 0.2s' },
    handoverContent: { flex: 1, cursor: 'pointer' },
    handoverTitleRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
    handoverTitle: { fontSize: '18px', fontWeight: '700', color: '#0F172A' },
    badge: { backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '10px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' },
    handoverDesc: { fontSize: '14px', color: '#64748B', marginBottom: '16px' },
    handoverMeta: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94A3B8' },
    dot: { fontSize: '10px' },
    handoverActions: { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', borderLeft: '1px solid #E2E8F0', paddingLeft: '24px' },
    textBtn: { background: 'none', border: 'none', color: '#4F46E5', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    emptyCard: { backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '12px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
    emptyText: { fontSize: '14px', color: '#64748B' },
    folderGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
    folderCard: { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' },
    fileIcon: { color: '#6366F1', fontSize: '40px' },
    folderName: { fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    folderCount: { fontSize: '12px', color: '#64748B' },
    footer: { textAlign: 'center', padding: '24px', fontSize: '12px', color: '#94A3B8', borderTop: '1px solid #E2E8F0', backgroundColor: '#fff' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalContentWide: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' },
    modalSub: { fontSize: '14px', color: '#64748B', marginBottom: '24px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '20px', color: '#64748B', cursor: 'pointer' },
    fileInput: { width: '100%', padding: '12px', border: '1px dashed #CBD5E1', borderRadius: '8px', marginBottom: '24px' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    cancelBtn: { padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    confirmBtn: { padding: '10px 20px', backgroundColor: '#4F46E5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    historyList: { overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' },
    historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer' },
    historyTitle: { fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' },
    historyMeta: { fontSize: '12px', color: '#64748B' }
};