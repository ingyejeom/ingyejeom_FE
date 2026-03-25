import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Space() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    
    // 화면 제어를 위한 Ref 모음
    const chatEndRef = useRef(null);
    const messageContainerRef = useRef(null);
    const prevScrollHeightRef = useRef(0); // 스크롤 보정용: 이전 높이 기억
    const isPaginatingRef = useRef(false); // 스크롤 보정용: 페이징 중인지 확인

    // 상태 관리
    const [currentSpace, setCurrentSpace] = useState({ name: '로딩 중...', department: '' });
    const [mySpaces, setMySpaces] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);

    // 페이징 상태 관리
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingHistory, setIsFetchingHistory] = useState(false);

    // 뷰어 및 파일 매칭을 위한 상태
    const [previewData, setPreviewData] = useState(null);
    const [spaceFiles, setSpaceFiles] = useState([]);

    // 스페이스 변경 시 초기화 및 최초 로딩
    useEffect(() => {
        setMessages([
            { id: 1, sender: 'bot', text: `안녕하세요, 이 스페이스의 AI 어시스턴트입니다.\n현재 업로드된 문서와 인수인계 내역을 바탕으로 답변해 드립니다.\n궁금한 점을 물어보세요.`, time: '시스템' }
        ]);
        setCursor(null);
        setHasMore(true);

        const fetchCurrentSpace = async () => {
            try {
                const res = await api.get('/space', { params: { id: spaceId } });
                setCurrentSpace({
                    name: res.data.workName || '스페이스',
                    department: res.data.groupName || '그룹'
                });
            } catch (error) {
                setCurrentSpace({ name: '정보를 불러올 수 없습니다.', department: 'Error' });
            }
        };

        const fetchMySpaces = async () => {
            try {
                const res = await api.get('/userSpace/getDashboardSpaces', { params: { deleted: false } });
                const spaces = res.data.map(item => ({
                    id: item.spaceId,
                    name: item.workName || item.groupName || '이름 없음'
                })).filter(space => space.id != null);

                const uniqueSpaces = Array.from(new Set(spaces.map(s => s.id))).map(id => spaces.find(s => s.id === id));
                setMySpaces(uniqueSpaces);
            } catch (error) {
                console.error("스페이스 목록 로딩 실패:", error);
            }
        };

        const fetchFiles = async () => {
            try {
                const res = await api.get('/file/list', { params: { spaceId: spaceId } });
                setSpaceFiles(res.data || []);
            } catch (error) { console.error("파일 목록 로딩 실패:", error); }
        };
        fetchFiles();

        fetchCurrentSpace();
        fetchMySpaces();
        loadChatHistory(null); // 최초 로딩
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spaceId]); 

    // 과거 대화 내역 불러오기
    const loadChatHistory = async (currentCursor) => {
        if (!hasMore || isFetchingHistory) return;
        setIsFetchingHistory(true);

        try {
            const res = await api.get(`/chatbot/history`, {
                params: {
                    spaceId: spaceId,
                    cursor: currentCursor,
                    size: 4 // 1회 로딩 시 4개의 대화
                }
            });

            if (res.data && res.data.length > 0) {
                const newCursor = res.data[0].id;
                const historyMessages = res.data.flatMap(chat => {
                    const formattedTime = chat.createdAt 
                        ? new Date(chat.createdAt).toLocaleString('ko-KR', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })
                    : '이전 기록';
                    return [
                        { id: `user-${chat.id}`, sender: 'user', text: chat.question, time: formattedTime },
                        { id: `bot-${chat.id}`, sender: 'bot', text: chat.answer, time: formattedTime, sources: chat.sources }
                    ];
                });

                if (!currentCursor) {
                    // 최초 로딩 시
                    setMessages(prev => [prev[0], ...historyMessages]);
                    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
                } else {
                    // 스크롤 페이징 시: 화면에 붙이기 전에 현재 높이를 기억해둡니다.
                    if (messageContainerRef.current) {
                        prevScrollHeightRef.current = messageContainerRef.current.scrollHeight;
                        isPaginatingRef.current = true;
                    }
                    setMessages(prev => [prev[0], ...historyMessages, ...prev.slice(1)]);
                }

                setCursor(newCursor);
                if (res.data.length < 4) setHasMore(false);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("채팅 내역 로딩 실패:", error);
        } finally {
            setIsFetchingHistory(false);
        }
    };

    // 화면에 그려지기 직전에 스크롤 위치를 완벽하게 보정!
    useLayoutEffect(() => {
        const container = messageContainerRef.current;
        if (!container) return;

        if (isPaginatingRef.current) {
            container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
            isPaginatingRef.current = false;
        }
    }, [messages]);

    // 스크롤 이벤트 핸들러
    const handleScroll = (e) => {
        if (e.target.scrollTop <= 5 && hasMore && !isFetchingHistory) {
            loadChatHistory(cursor);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userText = inputText;
        const currentTime = new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText, time: currentTime }]);
        setInputText('');
        setIsLoading(true);

        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        try {
            const response = await api.post('/chatbot', {
                spaceId: parseInt(spaceId),
                question: userText
            });

            const botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: response.data.answer || response.data.message || response.data || '답변이 완료되었습니다.',
                time: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
                sources: response.data.sources
            };
            setMessages(prev => [...prev, botMsg]);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: `⚠️ 챗봇 서버와 연결할 수 없습니다.\n[전송한 질문: ${userText}]`,
                time: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
            }]);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSendMessage();
    };

    // 출처 뱃지 클릭 시 뷰어를 띄우는 함수
    const handleSourceClick = async (sourceInfo) => {
        const matchedFile = spaceFiles.find(f => 
            f.name === sourceInfo.source || 
            f.originalFileName === sourceInfo.source ||
            sourceInfo.source.includes(f.name)
        );

        if (!matchedFile) {
            alert("해당 파일을 찾을 수 없습니다. (삭제되었거나 폴더 내부에 있을 수 있습니다.)");
            return;
        }

        try {
            const res = await api.get(`/file/${matchedFile.id}?mode=view`, { responseType: 'blob' });
            const contentType = res.headers['content-type'] || '';
            const fileBlob = new Blob([res.data], { type: contentType });
            
            const filename = matchedFile.name || matchedFile.originalFileName || "";
            const ext = filename.split('.').pop().toLowerCase();

            if (contentType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                setPreviewData({ type: 'image', url: window.URL.createObjectURL(fileBlob), name: filename });
            } else if (contentType === 'application/pdf' || ext === 'pdf') {
                setPreviewData({ type: 'pdf', url: window.URL.createObjectURL(fileBlob), name: filename, page: sourceInfo.page });
            } else if (contentType.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'java', 'js', 'html'].includes(ext)) {
                const text = await fileBlob.text();
                setPreviewData({ type: 'text', content: text, name: filename });
            } else {
                alert("미리보기를 지원하지 않는 형식입니다.");
            }
        } catch (e) { alert("미리보기를 불러오지 못했습니다."); }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.homeIcon} onClick={() => navigate('/')}>
                        <span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>home</span>
                    </div>
                    <div style={styles.dropdownContainer}>
                        <div style={styles.dropdownToggle} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <div>
                                <p style={styles.dropdownLabel}>현재 공간</p>
                                <p style={styles.dropdownTitle}>{currentSpace.name} - {currentSpace.department}</p>
                            </div>
                            <span className="material-icons" style={{ color: '#94A3B8' }}>expand_more</span>
                        </div>
                        {isDropdownOpen && (
                            <div style={styles.dropdownMenu}>
                                {mySpaces.map(space => (
                                    <div key={space.id} style={styles.dropdownItem} onClick={() => { setIsDropdownOpen(false); navigate(`/space/${space.id}`); }}>
                                        {space.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.headerRight}>
                    <button style={styles.archiveBtn} onClick={() => navigate(`/space/${spaceId}/archive`)}>
                        <span className="material-icons" style={{ fontSize: '18px' }}>folder</span>자료실
                    </button>
                    <div style={styles.profileIcon} onClick={() => navigate('/profile')}>
                        <span className="material-icons" style={{ fontSize: '18px', color: 'white' }}>person</span>
                    </div>
                </div>
            </header>

            <main style={styles.chatArea}>
                <div style={styles.chatTitleBox}>
                    <div style={styles.aiIconBox}><span className="material-icons" style={{ color: '#fff' }}>smart_toy</span></div>
                    <span style={styles.chatTitle}>계미나이</span>
                    <span style={styles.badge}>Space Intelligence</span>
                </div>
                
                {/* 스크롤 컨테이너에 onScroll 이벤트 및 Ref 연결 */}
                <div style={styles.messageContainer} ref={messageContainerRef} onScroll={handleScroll}>
                    {isFetchingHistory && <div style={{textAlign: 'center', fontSize: '12px', color: '#94A3B8', padding: '10px 0'}}>과거 대화 불러오는 중...</div>}
                    
                    {messages.map((msg) => (
                        <div key={msg.id} style={msg.sender === 'user' ? styles.userMessageRow : styles.botMessageRow}>
                            {msg.sender === 'bot' && <div style={styles.botAvatar}><span className="material-icons" style={{ color: '#8B5CF6', fontSize: '16px' }}>smart_toy</span></div>}
                            <div style={msg.sender === 'user' ? styles.userBubble : styles.botBubble}>
                                {msg.sender === 'bot' && <div style={styles.botName}>계미나이</div>}
                                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                                {msg.sources && msg.sources.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                        {msg.sources.slice(0, 3).map((src, index) => (
                                            <div key={index} style={{ ...styles.referenceBox, marginTop: 0, padding: '8px 12px', cursor: 'pointer' }} onClick={() => handleSourceClick(src)} title="클릭하여 원본 문서 보기">
                                                <div style={styles.refIcon}>
                                                    <span className="material-icons" style={{ color: '#fff', fontSize: '14px' }}>picture_as_pdf</span>
                                                </div>
                                                <div>
                                                    <p style={styles.refName}>{src.source}</p>
                                                    {src.page != null && <p style={styles.refPage}>{src.page}쪽</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={styles.timeText}>{msg.time}</div>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={styles.botMessageRow}>
                            <div style={styles.botAvatar}><span className="material-icons" style={{ color: '#8B5CF6', fontSize: '16px' }}>more_horiz</span></div>
                            <div style={{ ...styles.botBubble, color: '#94A3B8' }}>답변을 생성하고 있습니다...</div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </main>

            <footer style={styles.inputArea}>
                <div style={styles.inputWrapper}>
                    <input style={styles.input} placeholder="스페이스 내 파일에 대해 무엇이든 물어보세요..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} />
                    <button style={styles.sendBtn} onClick={handleSendMessage}><span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>arrow_upward</span></button>
                </div>
                <p style={styles.inputHelp}>계미나이는 실수를 할 수 있습니다. 중요한 정보는 파일 원본을 확인해주세요.</p>
            </footer>
            {previewData && (
                <div style={styles.modalOverlay} onClick={() => setPreviewData(null)}>
                    <div style={styles.previewContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>
                                {previewData.name} {previewData.page ? ` (해당 내용: ${previewData.page}쪽)` : ''}
                            </h3>
                            <button style={styles.closeBtn} onClick={() => setPreviewData(null)}>✕</button>
                        </div>
                        <div style={styles.previewBody}>
                            {previewData.type === 'image' && <img src={previewData.url} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />}
                            {previewData.type === 'pdf' && (
                                <iframe 
                                    src={`${previewData.url}${previewData.page ? `#page=${previewData.page}` : ''}`} 
                                    style={{ width: '100%', height: '60vh', border: 'none' }} 
                                    title="pdf-viewer" 
                                />
                            )}
                            {previewData.type === 'text' && <div style={styles.textBox}>{previewData.content}</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#F8FAFC' },
    header: { height: '64px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    homeIcon: { width: '32px', height: '32px', backgroundColor: '#475569', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    dropdownContainer: { position: 'relative' },
    dropdownToggle: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' },
    dropdownLabel: { fontSize: '10px', color: '#64748B' },
    dropdownTitle: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
    dropdownMenu: { position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', width: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '8px', zIndex: 20, maxHeight: '300px', overflowY: 'auto' },
    dropdownItem: { padding: '12px 16px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
    archiveBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #E0E7FF', borderRadius: '8px', color: '#4F46E5', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
    profileIcon: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' },
    statusDot: { position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', backgroundColor: '#22C55E', border: '2px solid #fff', borderRadius: '50%' },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column', margin: '24px 32px 0', backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px 12px 0 0', overflow: 'hidden' },
    chatTitleBox: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' },
    aiIconBox: { width: '32px', height: '32px', backgroundColor: '#8B5CF6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    chatTitle: { fontSize: '18px', fontWeight: '700', color: '#1E293B' },
    badge: { backgroundColor: '#E0E7FF', color: '#4338CA', fontSize: '12px', padding: '4px 8px', borderRadius: '12px' },
    messageContainer: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
    botMessageRow: { display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '80%' },
    botAvatar: { width: '28px', height: '28px', backgroundColor: '#F3E8FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E9D5FF' },
    botBubble: { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '0 12px 12px 12px', padding: '16px', fontSize: '14px', color: '#334155', lineHeight: '1.5' },
    botName: { fontSize: '12px', fontWeight: '700', color: '#8B5CF6', marginBottom: '8px' },
    userMessageRow: { display: 'flex', alignItems: 'flex-end', gap: '8px', alignSelf: 'flex-end', maxWidth: '80%', flexDirection: 'row-reverse' },
    userBubble: { backgroundColor: '#4F46E5', color: '#fff', borderRadius: '12px 0 12px 12px', padding: '16px', fontSize: '14px', lineHeight: '1.5' },
    timeText: { fontSize: '11px', color: '#94A3B8', marginBottom: '4px' },
    referenceBox: { marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' },
    refIcon: { width: '32px', height: '32px', backgroundColor: '#EF4444', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    refName: { fontSize: '13px', fontWeight: '700', color: '#334155' },
    refPage: { fontSize: '11px', color: '#94A3B8' },
    inputArea: { backgroundColor: '#fff', padding: '20px 32px 32px', borderTop: '1px solid #E2E8F0' },
    inputWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: '24px', padding: '8px 24px', gap: '12px' },
    input: { flex: 1, backgroundColor: 'transparent', border: 'none', fontSize: '14px', outline: 'none', padding: '8px 0' },
    sendBtn: { width: '32px', height: '32px', backgroundColor: '#8B5CF6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    inputHelp: { textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '12px' },

    // 뷰어 전용 스타일
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    previewContent: { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', width: '80%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: 0 },
    closeBtn: { background: 'none', border: 'none', fontSize: '20px', color: '#64748B', cursor: 'pointer' },
    previewBody: { flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222', borderRadius: '8px', padding: '20px' },
    textBox: { backgroundColor: '#fff', padding: '40px', width: '100%', minHeight: '100%', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px', color: '#333', lineHeight: '1.6', borderRadius: '4px', boxShadow: '0 0 10px rgba(0,0,0,0.3)' }
};