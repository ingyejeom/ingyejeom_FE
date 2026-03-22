import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Space() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    // 상태 관리
    const [currentSpace, setCurrentSpace] = useState({ name: '로딩 중...', department: '' });
    const [mySpaces, setMySpaces] = useState([]); // 드롭다운용 스페이스 목록
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginId, setLoginId] = useState('SD'); // 프로필 아이콘용

    // 챗봇 메시지 내역
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: `안녕하세요, 이 스페이스의 AI 어시스턴트입니다.\n현재 업로드된 문서와 인수인계 내역을 바탕으로 답변해 드립니다.\n궁금한 점을 물어보세요.`, time: '시스템' }
    ]);

    // 스크롤 자동 이동
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 초기 데이터 로딩
    useEffect(() => {
        // 1. 프로필 이니셜 가져오기
        const savedId = localStorage.getItem("loginId");
        if (savedId) setLoginId(savedId.substring(0, 2).toUpperCase());

        // 2. 현재 스페이스 상세 정보 가져오기
        const fetchCurrentSpace = async () => {
            try {
                const res = await api.get('/space', { params: { id: spaceId } });
                setCurrentSpace({
                    name: res.data.workName || '스페이스',
                    department: res.data.groupName || '그룹'
                });
            } catch (error) {
                console.error("스페이스 정보 로딩 실패:", error);
                setCurrentSpace({ name: '스페이스 정보를 불러올 수 없습니다.', department: 'Error' });
            }
        };

        // 3. 드롭다운 메뉴용 스페이스 목록 가져오기
        const fetchMySpaces = async () => {
            try {
                const res = await api.get('/userSpace/getDashboardSpaces', { params: { deleted: false } });
                // 드롭다운에는 내가 참여/관리 중인 목록을 보여줌
                const spaces = res.data.map(item => ({
                    id: item.spaceId, // 이동할 spaceId
                    name: item.workName || item.groupName || '이름 없음'
                })).filter(space => space.id != null); // spaceId가 있는 것만 필터링

                // 중복 제거
                const uniqueSpaces = Array.from(new Set(spaces.map(s => s.id))).map(id => spaces.find(s => s.id === id));
                setMySpaces(uniqueSpaces);
            } catch (error) {
                console.error("스페이스 목록 로딩 실패:", error);
            }
        };

        fetchCurrentSpace();
        fetchMySpaces();
        fetchChatHistory();
    }, [spaceId]);

    // 챗봇 히스토리 불러오기 함수
    const fetchChatHistory = async () => {
        try {
            const res = await api.get(`/chatbot/history/${spaceId}`);
            if (res.data && res.data.length > 0) {
                // 백엔드 데이터를 리액트 메시지 형식으로 변환
                const historyMessages = res.data.flatMap(chat => [
                    {
                        id: `user-${chat.id || Date.now() + Math.random()}`,
                        sender: 'user',
                        text: chat.question,
                        time: '이전 기록' // 혹은 실제 시간 데이터가 있다면 연결
                    },
                    {
                        id: `bot-${chat.id || Date.now() + Math.random()}`,
                        sender: 'bot',
                        text: chat.answer,
                        time: '이전 기록',
                        sources: chat.sources
                    }
                ]);

                // 기존 환영 메시지 유지하면서 히스토리 추가
                setMessages(prev => [prev[0], ...historyMessages]);
            }
        } catch (error) {
            console.error("채팅 내역 로딩 실패:", error);
        }
    };

    // 챗봇 메시지 전송 핸들러
    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userText = inputText;
        const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

        // 유저 메시지 화면에 먼저 추가
        const newUserMsg = { id: Date.now(), sender: 'user', text: userText, time: currentTime };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await api.post('/chatbot', {
                spaceId: parseInt(spaceId),
                question: userText 
            });

            const botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: response.data.answer || response.data.message || response.data || '답변이 완료되었습니다.',
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
                // referenceFile: response.data.referenceFile // 백엔드에서 출처를 준다면 연결 가능
                sources: response.data.sources // 근거 자료 출처
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error('챗봇 응답 에러:', error);

            // 서버 에러 시 표시할 임시 안내 메시지
            const errorMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: `⚠️ 챗봇 서버와 연결할 수 없습니다.\n[전송한 질문: ${userText}]`,
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSendMessage();
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
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>{loginId}</span>
                        <div style={styles.statusDot}></div>
                    </div>
                </div>
            </header>

            <main style={styles.chatArea}>
                <div style={styles.chatTitleBox}>
                    <div style={styles.aiIconBox}><span className="material-icons" style={{ color: '#fff' }}>smart_toy</span></div>
                    <span style={styles.chatTitle}>AI 파일 어시스턴트</span>
                    <span style={styles.badge}>Space Intelligence</span>
                </div>
                <div style={styles.messageContainer}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={msg.sender === 'user' ? styles.userMessageRow : styles.botMessageRow}>
                            {msg.sender === 'bot' && <div style={styles.botAvatar}><span className="material-icons" style={{ color: '#8B5CF6', fontSize: '16px' }}>smart_toy</span></div>}
                            <div style={msg.sender === 'user' ? styles.userBubble : styles.botBubble}>
                                {msg.sender === 'bot' && <div style={styles.botName}>AI 어시스턴트</div>}
                                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                                {/* {msg.referenceFile && (
                                    <div style={styles.referenceBox}>
                                        <div style={styles.refIcon}><span className="material-icons" style={{ color: '#fff', fontSize: '14px' }}>picture_as_pdf</span></div>
                                        <div><p style={styles.refName}>{msg.referenceFile.name}</p><p style={styles.refPage}>{msg.referenceFile.page}</p></div>
                                    </div>
                                )} */
                                msg.sources && msg.sources.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                        {msg.sources.slice(0, 3).map((src, index) => (
                                            <div key={index} style={{ ...styles.referenceBox, marginTop: 0, padding: '8px 12px' }}>
                                                <div style={styles.refIcon}>
                                                    <span className="material-icons" style={{ color: '#fff', fontSize: '14px' }}>picture_as_pdf</span>
                                                </div>
                                                <div>
                                                    <p style={styles.refName}>{src.source}</p>
                                                    {/* page가 null이 아닐 때만 렌더링 */}
                                                    {src.page != null && <p style={styles.refPage}>{src.page}쪽</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                                } 
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
                    <span className="material-icons" style={styles.inputIcon}>attach_file</span>
                    <input style={styles.input} placeholder="스페이스 내 파일에 대해 무엇이든 물어보세요..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} />
                    <button style={styles.sendBtn} onClick={handleSendMessage}><span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>arrow_upward</span></button>
                </div>
                <p style={styles.inputHelp}>AI는 스페이스 내의 권한이 있는 문서만 참조하여 답변합니다.</p>
            </footer>
        </div>
    );
}

// --- 인라인 스타일 (기존과 동일하게 유지) ---
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
    inputWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: '24px', padding: '8px 16px', gap: '12px' },
    inputIcon: { color: '#94A3B8', cursor: 'pointer' },
    input: { flex: 1, backgroundColor: 'transparent', border: 'none', fontSize: '14px', outline: 'none', padding: '8px 0' },
    sendBtn: { width: '32px', height: '32px', backgroundColor: '#8B5CF6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    inputHelp: { textAlign: 'center', fontSize: '10px', color: '#94A3B8', marginTop: '12px' }
};