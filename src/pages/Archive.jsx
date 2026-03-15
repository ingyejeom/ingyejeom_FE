import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Archive() {
    const { spaceId } = useParams();
    const navigate = useNavigate();

    // 상태 관리
    const [currentSpace, setCurrentSpace] = useState({ name: '로딩 중...', department: '' });
    const [mySpaces, setMySpaces] = useState([]);
    const [loginId, setLoginId] = useState('SD');

    // 모달 상태
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // 데이터 상태
    const [selectedFile, setSelectedFile] = useState(null);
    const [latestHandover, setLatestHandover] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [files, setFiles] = useState([]); // 폴더 대신 실제 파일 목록으로 변경

    // 1. 초기 데이터 로드
    useEffect(() => {
        const savedId = localStorage.getItem("loginId");
        if (savedId) setLoginId(savedId.substring(0, 2).toUpperCase());

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
        loadArchiveData(); // 인수인계서 및 파일 목록 로드
    }, [spaceId]);

    // 2. 인수인계서 및 첨부파일 목록 불러오기
    const loadArchiveData = async () => {
        try {
            // (1) 인수인계서 목록 조회
            const handoverRes = await api.get(`/handover/space/${spaceId}`);
            const handovers = handoverRes.data || [];

            if (handovers.length > 0) {
                // ID 기준 내림차순(최신순) 정렬
                handovers.sort((a, b) => b.id - a.id);
                setLatestHandover(handovers[0]); // 가장 최신 데이터
                setHistoryList(handovers.slice(1)); // 나머지는 이전 기록으로
            } else {
                setLatestHandover(null);
                setHistoryList([]);
            }

            // (2) 파일 목록 조회
            const fileRes = await api.get('/file/list', { params: { spaceId: spaceId } });
            setFiles(fileRes.data || []);

        } catch (error) {
            console.error('자료실 데이터 로딩 에러:', error);
        }
    };

    // 3. 실제 파일 업로드 처리 (Multipart Form Data)
    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }

        // 파일 전송을 위한 FormData 객체 생성
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('spaceId', spaceId.toString());

        try {
            // 파일 업로드는 Content-Type을 'multipart/form-data'로 지정해야 함.
            await api.post('/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('자료가 성공적으로 업로드되었습니다!');
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            loadArchiveData(); // 업로드 후 파일 목록 새로고침

        } catch (error) {
            console.error('파일 업로드 에러:', error);
            alert('파일 업로드에 실패했습니다.');
        }
    };

    // 날짜 포맷팅 함수 (2024-01-01T12:00:00 -> 2024.01.01)
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0].replace(/-/g, '.');
    };

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
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
                <h1 style={styles.headerCenterTitle}>자료실</h1>
                <div style={styles.headerRight}>
                    <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>{loginId}</div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <div style={styles.titleSection}>
                    <div><h2 style={styles.pageTitle}>자료실 관리</h2><p style={styles.pageSubTitle}>팀 내 중요 문서와 인수인계 자료를 관리하는 공간입니다.</p></div>
                    <button style={styles.addBtn} onClick={() => setIsUploadModalOpen(true)}>+ 파일 첨부</button>
                </div>

                {/* 최신 인수인계서 섹션 */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>최신 인수인계서</h3>
                        {latestHandover && <span style={styles.lastUpdated}>Last updated: {formatDate(latestHandover.createdAt || latestHandover.modifiedAt)}</span>}
                    </div>

                    {latestHandover ? (
                        <div style={styles.handoverCard}>
                            <div style={styles.handoverContent} onClick={() => navigate(`/handover/edit/${latestHandover.id}`)}>
                                <div style={styles.handoverTitleRow}><h4 style={styles.handoverTitle}>{latestHandover.title}</h4><span style={styles.badge}>LATEST</span></div>
                                <p style={styles.handoverDesc}>{latestHandover.role}</p>
                                <div style={styles.handoverMeta}>
                                    <span>작성자: {latestHandover.userName}</span><span style={styles.dot}>•</span>
                                    <span>{formatDate(latestHandover.createdAt)}</span>
                                </div>
                            </div>
                            <div style={styles.handoverActions}>
                                {historyList.length > 0 && (
                                    <button style={styles.textBtn} onClick={() => setIsHistoryModalOpen(true)}>+ 이전 인수인계서 ({historyList.length})</button>
                                )}
                                <button style={styles.textBtn} onClick={() => navigate('/handover/create')}>+ 새 인수인계서 작성</button>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.emptyCard}>
                            <p style={styles.emptyText}>아직 작성된 인수인계서가 없습니다.</p>
                            <button style={styles.textBtn} onClick={() => navigate('/handover/create')}>+ 첫 인수인계서 작성하기</button>
                        </div>
                    )}
                </div>

                {/* 첨부 파일(자료) 섹션 */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>첨부 파일 목록</h3>
                    </div>

                    {files.length > 0 ? (
                        <div style={styles.folderGrid}>
                            {files.map(file => (
                                <div key={file.id} style={styles.folderCard} onClick={() => alert(`${file.originalFileName} 파일 다운로드(API 구현 필요)`)}>
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

            <footer style={styles.footer}>© 2024 INGYEJEOM. All rights reserved.</footer>

            {/* 파일 업로드 모달 */}
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

            {/* 이전 인수인계서 목록 모달 */}
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
    header: { height: '64px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px', flex: 1 },
    homeIcon: { width: '32px', height: '32px', backgroundColor: '#475569', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    dropdownContainer: { position: 'relative' },
    dropdownToggle: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' },
    dropdownLabel: { fontSize: '10px', color: '#64748B' },
    dropdownTitle: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
    dropdownMenu: { position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', width: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '8px', zIndex: 20 },
    dropdownItem: { padding: '12px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
    headerCenterTitle: { flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', color: '#4F46E5' },
    headerRight: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
    profileAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #60A5FA 0%, #6366F1 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
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