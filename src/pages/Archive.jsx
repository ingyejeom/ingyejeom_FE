import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockGroups } from '../data/mockData';

// 자료실
export default function Archive() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const currentSpace = mockGroups.find(g => g.id === parseInt(spaceId)) || mockGroups[0];

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const [latestHandover, setLatestHandover] = useState(null);
    const [folders, setFolders] = useState([]);
    const [historyList, setHistoryList] = useState([]);

    useEffect(() => {
        setLatestHandover({ id: 1, title: '인수인계서 (2023-10-25)', description: '2023년도 3분기 마케팅팀 업무 및 프로젝트 현황 정리 문서입니다.', author: '김민수', views: 12, date: '2023-10-25' });
        setFolders([{ id: 1, name: '업무 매뉴얼', count: 3 }, { id: 2, name: '프로젝트 히스토리', count: 12 }, { id: 3, name: '계정 및 비밀번호', count: 1 }]);
        setHistoryList([{ id: 2, title: '인수인계서 (2023-09-01)', author: '박지연', date: '2023-09-01' }, { id: 3, title: '인수인계서 (2023-06-15)', author: '이태용', date: '2023-06-15' }]);
    }, [spaceId]);

    const handleFileUpload = () => {
        if (!selectedFile) { alert('업로드할 파일을 선택해주세요.'); return; }
        alert('자료가 성공적으로 업로드되었습니다!');
        setIsUploadModalOpen(false); setSelectedFile(null);
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
                                {mockGroups.map(group => <div key={group.id} style={styles.dropdownItem} onClick={() => { setIsDropdownOpen(false); navigate(`/space/${group.id}/archive`); }}>{group.name}</div>)}
                            </div>
                        )}
                    </div>
                </div>
                <h1 style={styles.headerCenterTitle}>자료실</h1>
                <div style={styles.headerRight}>
                    <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>SD</div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <div style={styles.titleSection}>
                    <div><h2 style={styles.pageTitle}>자료실 관리</h2><p style={styles.pageSubTitle}>팀 내 중요 문서와 인수인계 자료를 관리하는 공간입니다.</p></div>
                    <button style={styles.addBtn} onClick={() => setIsUploadModalOpen(true)}>+ 자료 추가</button>
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionHeader}><h3 style={styles.sectionTitle}>최신 인수인계서</h3><span style={styles.lastUpdated}>Last updated: {latestHandover?.date}</span></div>
                    {latestHandover && (
                        <div style={styles.handoverCard}>
                            <div style={styles.handoverContent} onClick={() => navigate(`/handover/edit`)}>
                                <div style={styles.handoverTitleRow}><h4 style={styles.handoverTitle}>{latestHandover.title}</h4><span style={styles.badge}>LATEST</span></div>
                                <p style={styles.handoverDesc}>{latestHandover.description}</p>
                                <div style={styles.handoverMeta}><span>작성자: {latestHandover.author}</span><span style={styles.dot}>•</span><span>조회수: {latestHandover.views}</span></div>
                            </div>
                            <div style={styles.handoverActions}>
                                <button style={styles.textBtn} onClick={() => setIsHistoryModalOpen(true)}>+ 이전 인수인계서 확인하기</button>
                                <button style={styles.textBtn} onClick={() => navigate('/handover/create')}>+ 새 인수인계서 생성하기</button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>첨부 자료 폴더</h3>
                        <div style={styles.sortIcons}><span className="material-icons" style={{ color: '#1E293B', fontSize: '20px' }}>grid_view</span><span className="material-icons" style={{ color: '#94A3B8', fontSize: '20px' }}>view_list</span></div>
                    </div>
                    <div style={styles.folderGrid}>
                        {folders.map(folder => (
                            <div key={folder.id} style={styles.folderCard} onClick={() => alert(`${folder.name} 폴더를 엽니다.`)}>
                                <span className="material-icons" style={styles.folderIcon}>folder</span>
                                <div><h4 style={styles.folderName}>{folder.name}</h4><p style={styles.folderCount}>{folder.count} files</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer style={styles.footer}>© 2024 INGYEJEOM. All rights reserved.</footer>

            {isUploadModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>자료 추가</h3><p style={styles.modalSub}>업로드할 파일을 선택해주세요.</p>
                        <input type="file" style={styles.fileInput} onChange={(e) => setSelectedFile(e.target.files[0])} />
                        <div style={styles.modalActions}><button style={styles.cancelBtn} onClick={() => setIsUploadModalOpen(false)}>취소</button><button style={styles.confirmBtn} onClick={handleFileUpload}>업로드</button></div>
                    </div>
                </div>
            )}

            {isHistoryModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContentWide}>
                        <div style={styles.modalHeader}><h3 style={styles.modalTitle}>이전 인수인계서 기록</h3><button style={styles.closeBtn} onClick={() => setIsHistoryModalOpen(false)}>✕</button></div>
                        <div style={styles.historyList}>
                            {historyList.map(item => (
                                <div key={item.id} style={styles.historyItem} onClick={() => alert(`${item.title} 조회 페이지로 이동합니다.`)}>
                                    <div><h4 style={styles.historyTitle}>{item.title}</h4><p style={styles.historyMeta}>작성자: {item.author} | 작성일: {item.date}</p></div>
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
    sortIcons: { display: 'flex', gap: '8px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '8px' },
    folderGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
    folderCard: { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' },
    folderIcon: { color: '#FBBF24', fontSize: '40px' },
    folderName: { fontSize: '15px', fontWeight: '700', color: '#1E293B', marginBottom: '4px' },
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