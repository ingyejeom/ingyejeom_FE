import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Header from '../components/Header'; // 공통 헤더 가져오기

export default function Archive() {
    const { spaceId } = useParams();
    const navigate = useNavigate();

    // --- 기본 상태 관리 ---
    const [currentSpace, setCurrentSpace] = useState({ name: '로딩 중...', department: '' });
    const [mySpaces, setMySpaces] = useState([]);

    // --- 모달 상태 ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // --- 데이터 및 탐색기 상태 ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [latestHandover, setLatestHandover] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [files, setFiles] = useState([]);

    // --- 탐색기 경로 상태 ---
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folderStack, setFolderStack] = useState([{ id: null, name: 'Home' }]);

    // --- [추가] 드래그 앤 드롭 및 뷰어 상태 ---
    const [dragOverTarget, setDragOverTarget] = useState(null); // 현재 드래그가 머물고 있는 타겟 ID
    const [previewData, setPreviewData] = useState(null); // 뷰어에 표시할 데이터 객체

    // --- 인수인계서 PDF 상태 ---
    const [handoverPdfs, setHandoverPdfs] = useState([]);
    const [handoverFolderId, setHandoverFolderId] = useState(null);

    // 1. 초기 데이터 로드 (스페이스 정보 및 인수인계서)
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

        const loadHandovers = async () => {
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
            } catch (error) {
                console.error('인수인계서 데이터 로딩 에러:', error);
            }
        };

        // 인수인계서 PDF 폴더 및 파일 로드
        const loadHandoverPdfs = async () => {
            try {
                const rootRes = await api.get('/file/list', { params: { spaceId, folderId: null } });
                const folder = rootRes.data.find(item => item.type === 'FOLDER' && item.name === '인수인계서');
                if (folder) {
                    setHandoverFolderId(folder.id);
                    const pdfRes = await api.get('/file/list', { params: { spaceId, folderId: folder.id } });
                    setHandoverPdfs(pdfRes.data.filter(item => item.type === 'FILE') || []);
                }
            } catch (error) {
                console.error('인수인계서 PDF 로딩 에러:', error);
            }
        };

        fetchSpaceInfo();
        fetchMySpaces();
        loadHandovers();
        loadHandoverPdfs();
    }, [spaceId]);

    // 2. 파일 목록 별도 로드 (폴더 위치가 바뀔 때마다 실행)
    const fetchFiles = async () => {
        if (!spaceId) return;
        try {
            const fileRes = await api.get('/file/list', {
                params: { spaceId: spaceId, folderId: currentFolderId }
            });
            setFiles(fileRes.data || []);
        } catch (error) {
            console.error('파일 로딩 에러:', error);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            if (!spaceId) return;
            try {
                const fileRes = await api.get('/file/list', {
                    params: { spaceId: spaceId, folderId: currentFolderId }
                });
                if (isMounted) setFiles(fileRes.data || []);
            } catch (error) { console.error('파일 로딩 에러:', error); }
        };
        load();
        return () => { isMounted = false; };
    }, [spaceId, currentFolderId]);

    // 3. 실제 파일 업로드 처리
    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('spaceId', spaceId.toString());
        if (currentFolderId) {
            formData.append('folderId', currentFolderId.toString());
        }

        try {
            // 415 에러 방지용 헤더 & timeout: 0
            await api.post('/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 0
            });
            alert('자료가 성공적으로 업로드되었습니다!');
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            fetchFiles();
        } catch (error) {
            console.error('파일 업로드 에러:', error);
            alert('파일 업로드에 실패했습니다.');
        }
    };

    // --- [탐색기 핵심 기능] ---
    const enterFolder = (folderId, folderName) => {
        setFolderStack(prev => {
            if (prev[prev.length - 1].id === folderId) return prev;
            setCurrentFolderId(folderId);
            return [...prev, { id: folderId, name: folderName }];
        });
    };

    const formatFileName = (name) => {
        if (!name) return "이름 없음";
        return name.length > 17 ? name.substring(0, 17) + "..." : name;
    };

    const goToFolder = (index) => {
        setFolderStack(prev => {
            if (index === prev.length - 1) return prev;
            const newStack = prev.slice(0, index + 1);
            setCurrentFolderId(newStack[newStack.length - 1].id);
            return newStack;
        });
    };

    const createNewFolder = async () => {
        const name = prompt("새 폴더 이름을 입력하세요:");
        if (!name || name.trim() === "") return;
        try {
            await api.post('/file/folder', { spaceId, parentId: currentFolderId, name: name.trim() });
            fetchFiles();
        } catch (e) { alert("폴더 생성 실패"); }
    };

    const deleteItem = async (id, type) => {
        if (!window.confirm(type === 'FOLDER' ? "폴더를 삭제하시겠습니까?" : "파일을 삭제하시겠습니까?")) return;
        try {
            const url = type === 'FOLDER' ? '/file/folder' : '/file';
            await api.delete(url, { data: { id: id } });
            fetchFiles();
        } catch (e) { alert("삭제 실패"); }
    };

    const handleDownload = async (file) => {
        try {
            const res = await api.get(`/file/${file.id}?mode=download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = file.name || file.originalFileName || 'download';
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) { alert("다운로드 실패"); }
    };

    // --- [텍스트/이미지/PDF 뷰어 기능] ---
    const handlePreview = async (file) => {
        try {
            const res = await api.get(`/file/${file.id}?mode=view`, { responseType: 'blob' });
            const contentType = res.headers['content-type'] || '';
            const fileBlob = new Blob([res.data], { type: contentType });
            const filename = file.name || file.originalFileName || "";
            const ext = filename.split('.').pop().toLowerCase();

            if (contentType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                setPreviewData({ type: 'image', url: window.URL.createObjectURL(fileBlob), name: filename });
            } else if (contentType === 'application/pdf' || ext === 'pdf') {
                setPreviewData({ type: 'pdf', url: window.URL.createObjectURL(fileBlob), name: filename });
            } else if (contentType.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'java', 'js', 'html'].includes(ext)) {
                const text = await fileBlob.text();
                setPreviewData({ type: 'text', content: text, name: filename });
            } else {
                alert("미리보기를 지원하지 않는 형식입니다.");
            }
        } catch (e) { alert("미리보기를 불러오지 못했습니다."); }
    };

    // --- [드래그 앤 드롭 이벤트 제어] ---
    const handleDragStart = (e, id, type) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ id, type }));
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, targetId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverTarget(targetId);
    };

    const handleDragLeave = () => {
        setDragOverTarget(null);
    };

    const handleDrop = async (e, targetFolderId) => {
        e.preventDefault();
        setDragOverTarget(null);
        const data = e.dataTransfer.getData("text/plain");
        if (!data) return;
        const draggedItem = JSON.parse(data);

        if (draggedItem.type === 'FOLDER' && draggedItem.id === targetFolderId) return;
        if (currentFolderId === targetFolderId) return;

        try {
            await api.put('/file/move', {
                id: draggedItem.id,
                type: draggedItem.type,
                targetFolderId: targetFolderId
            });
            fetchFiles();
        } catch (err) {
            alert("이동에 실패했습니다.");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0].replace(/-/g, '.');
    };

    // 💡 공통 헤더에 넘겨줄 커스텀 왼쪽 요소
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
            {/* 💡 공통 Header 적용 */}
            <Header leftContent={customHeaderLeft} title="자료실" />

            <main style={styles.mainContainer}>
                <div style={styles.titleSection}>
                    <div><h2 style={styles.pageTitle}>자료실 관리</h2><p style={styles.pageSubTitle}>팀 내 중요 문서와 인수인계 자료를 관리하는 공간입니다.</p></div>
                </div>

                {/* 최신 인수인계서 섹션 */}
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
                                {historyList.length > 0 && (
                                    <button style={styles.textBtn} onClick={() => setIsHistoryModalOpen(true)}>+ 이전 인수인계서 ({historyList.length})</button>
                                )}
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

                {/* 인수인계서 PDF 섹션 */}
                {handoverPdfs.length > 0 && (
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h3 style={styles.sectionTitle}>📄 인수인계서 </h3>
                            <span style={styles.pdfCount}>{handoverPdfs.length}개 파일</span>
                        </div>
                        <div style={styles.pdfGrid}>
                            {handoverPdfs.map(pdf => (
                                <div key={pdf.id} style={styles.pdfCard}>
                                    <div style={styles.pdfIcon}>📑</div>
                                    <div style={styles.pdfInfo}>
                                        <h4 style={styles.pdfName} title={pdf.name || pdf.originalFileName}>
                                            {formatFileName(pdf.name || pdf.originalFileName)}
                                        </h4>
                                        <p style={styles.pdfMeta}>
                                            {(pdf.size / 1024).toFixed(1)} KB • {formatDate(pdf.createdAt)}
                                        </p>
                                    </div>
                                    <div style={styles.pdfActions}>
                                        <button style={styles.pdfBtn} onClick={() => handlePreview(pdf)}>보기</button>
                                        <button style={styles.pdfBtn} onClick={() => handleDownload(pdf)}>다운</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 파일 탐색기 섹션 */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h3 style={styles.sectionTitle}>파일 탐색기</h3>
                            {/* 상위 경로(Breadcrumb) 영역 - 드롭 존으로 활용 */}
                            <div style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#64748B' }}>
                                {folderStack.map((folder, idx) => (
                                    <span key={idx}>
                                        <span
                                            style={{
                                                cursor: idx === folderStack.length - 1 ? 'default' : 'pointer',
                                                color: idx === folderStack.length - 1 ? '#0F172A' : '#4F46E5',
                                                fontWeight: idx === folderStack.length - 1 ? 'bold' : 'normal',
                                                ...(dragOverTarget === folder.id ? styles.dragOverText : {})
                                            }}
                                            onClick={() => idx !== folderStack.length - 1 && goToFolder(idx)}
                                            onDragOver={(e) => handleDragOver(e, folder.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, folder.id)}
                                        >
                                            {folder.name}
                                        </span>
                                        {idx < folderStack.length - 1 && <span style={{ marginLeft: '8px' }}>&gt;</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button style={styles.secondaryBtn} onClick={createNewFolder}>+ 새 폴더</button>
                            <button style={styles.addBtn} onClick={() => setIsUploadModalOpen(true)}>+ 파일 첨부</button>
                        </div>
                    </div>

                    {files.filter(f => !(currentFolderId === null && f.type === 'FOLDER' && f.name === '인수인계서')).length > 0 ? (
                        <div style={styles.folderGrid}>
                            {/* 💡 중복 map, 닫히지 않은 div 에러 완벽 해결 */}
                            {files.filter(f => !(currentFolderId === null && f.type === 'FOLDER' && f.name === '인수인계서')).map(file => (
                                <div
                                    key={`${file.type}-${file.id}`}
                                    style={{
                                        ...styles.fileCard,
                                        ...(dragOverTarget === file.id && file.type === 'FOLDER' ? styles.dragOverCard : {})
                                    }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, file.id, file.type)}
                                    onDragOver={file.type === 'FOLDER' ? (e) => handleDragOver(e, file.id) : undefined}
                                    onDragLeave={file.type === 'FOLDER' ? handleDragLeave : undefined}
                                    onDrop={file.type === 'FOLDER' ? (e) => handleDrop(e, file.id) : undefined}
                                >
                                    {file.type === 'FOLDER' ? (
                                        <>
                                            <span className="material-icons" style={styles.folderIcon}>folder</span>
                                            <div style={{ overflow: 'hidden', flex: 1, width: '100%', textAlign: 'center' }}>
                                                <h4 style={styles.fileName} title={file.name}>{formatFileName(file.name)}</h4>
                                                <p style={styles.fileSize}>폴더</p>
                                            </div>
                                            <div style={styles.actionButtons}>
                                                <button style={styles.actionBtn} onClick={() => enterFolder(file.id, file.name)}>열기</button>
                                                <button style={styles.actionBtnDel} onClick={() => deleteItem(file.id, 'FOLDER')}>삭제</button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons" style={styles.fileIcon}>description</span>
                                            <div style={{ overflow: 'hidden', flex: 1, width: '100%', textAlign: 'center' }}>
                                                <h4 style={styles.fileName} title={file.name || file.originalFileName}>{formatFileName(file.name || file.originalFileName)}</h4>
                                                <p style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB • {file.uploaderName}</p>
                                            </div>
                                            <div style={styles.actionButtons}>
                                                <button style={styles.actionBtn} onClick={() => handlePreview(file)}>보기</button>
                                                <button style={styles.actionBtn} onClick={() => handleDownload(file)}>다운</button>
                                                <button style={styles.actionBtnDel} onClick={() => deleteItem(file.id, 'FILE')}>삭제</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={styles.emptyCard}>
                            <p style={styles.emptyText}>현재 폴더에 자료가 없습니다.</p>
                        </div>
                    )}
                </div>
            </main>

            <footer style={styles.footer}>© 2026 INGYEJEOM. All rights reserved.</footer>

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

            {/* 텍스트 / 이미지 / PDF 뷰어 모달 */}
            {previewData && (
                <div style={styles.modalOverlay} onClick={() => setPreviewData(null)}>
                    <div style={styles.previewContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>{previewData.name}</h3>
                            <button style={styles.closeBtn} onClick={() => setPreviewData(null)}>✕</button>
                        </div>
                        <div style={styles.previewBody}>
                            {previewData.type === 'image' && <img src={previewData.url} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
                            {previewData.type === 'pdf' && <iframe src={`${previewData.url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} style={{ width: '100%', height: '70vh', border: 'none', backgroundColor: '#fff' }} title="pdf-viewer" />}
                            {previewData.type === 'text' && <div style={styles.textBox}>{previewData.content}</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
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
    pdfCount: { fontSize: '12px', color: '#64748B', backgroundColor: '#EEF2FF', padding: '4px 12px', borderRadius: '12px' },
    pdfGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    pdfCard: { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'box-shadow 0.2s' },
    pdfIcon: { fontSize: '32px', width: '48px', height: '48px', backgroundColor: '#EEF2FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    pdfInfo: { flex: 1, minWidth: 0 },
    pdfName: { fontSize: '14px', fontWeight: '600', color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    pdfMeta: { fontSize: '12px', color: '#64748B', margin: '4px 0 0 0' },
    pdfActions: { display: 'flex', gap: '8px' },
    pdfBtn: { padding: '8px 16px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
    folderGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
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
    historyMeta: { fontSize: '12px', color: '#64748B' },
    secondaryBtn: { padding: '12px 16px', backgroundColor: '#fff', color: '#4F46E5', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', border: '1px solid #4F46E5' },
    fileCard: { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'box-shadow 0.2s' },
    folderIcon: { color: '#FBBF24', fontSize: '48px' },
    fileIcon: { color: '#6366F1', fontSize: '48px' },
    fileName: { fontSize: '14px', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '4px 0', width: '100%' },
    fileSize: { fontSize: '12px', color: '#64748B', margin: 0 },
    actionButtons: { display: 'flex', gap: '6px', width: '100%', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #F1F5F9' },
    actionBtn: { flex: 1, padding: '8px 0', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
    actionBtnDel: { flex: 1, padding: '8px 0', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' },
    dragOverCard: { border: '2px dashed #4F46E5', backgroundColor: '#EEF2FF', transform: 'scale(1.05)', zIndex: 5 },
    dragOverText: { outline: '2px dashed #4F46E5', backgroundColor: '#EEF2FF', padding: '2px 4px', borderRadius: '4px' },
    previewContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '80%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    previewBody: { flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222', borderRadius: '8px', padding: '20px' },
    textBox: { backgroundColor: '#fff', padding: '40px', width: '100%', minHeight: '100%', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', color: '#333', lineHeight: '1.6', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.3)' }
};