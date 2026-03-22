import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Space() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    const [currentSpace, setCurrentSpace] = useState({ name: '로딩 중...', department: '' });
    const [mySpaces, setMySpaces] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 스페이스가 바뀔 때마다 실행
    useEffect(() => {
        // 다른 스페이스로 넘어갔을 때 이전 채팅 기록 싹 비우고 인사말만 남기기
        setMessages([
            { id: 1, sender: 'bot', text: `안녕하세요, 이 스페이스의 AI 어시스턴트입니다.\n현재 업로드된 문서와 인수인계 내역을 바탕으로 답변해 드립니다.\n궁금한 점을 물어보세요.`, time: '시스템' }
        ]);

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

        // 히스토리 불러오기
        const fetchChatHistory = async () => {
            try {
                const res = await api.get(`/chatbot/history/${spaceId}`);
                if (res.data && res.data.length > 0) {
                    const historyMessages = res.data.flatMap(chat => [
                        { id: `user-${chat.id}`, sender: 'user', text: chat.question, time: '이전 기록' },
                        { id: `bot-${chat.id}`, sender: 'bot', text: chat.answer, time: '이전 기록', sources: chat.sources }
                    ]);
                    setMessages(prev => [prev[0], ...historyMessages]);
                }
            } catch (error) {
                console.error("채팅 내역 로딩 실패:", error);
            }
        };

        fetchCurrentSpace();
        fetchMySpaces();
        fetchChatHistory();
    }, [spaceId]); // spaceId가 바뀔 때마다 무조건 재실행!

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userText = inputText;
        const currentTime = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText, time: currentTime }]);
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
                sources: response.data.sources
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bot',
                text: `⚠️ 챗봇 서버와 연결할 수 없습니다.\n[전송한 질문: ${userText}]`,
                time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            }]);
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
                                    // 클릭 시 드롭다운 닫고 해당 스페이스로 이동
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
                    {/*  타이틀 '계미나이'로 변경 */}
                    <span style={styles.chatTitle}>계미나이</span>
                    <span style={styles.badge}>Space Intelligence</span>
                </div>
                <div style={styles.messageContainer}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={msg.sender === 'user' ? styles.userMessageRow : styles.botMessageRow}>
                            {msg.sender === 'bot' && <div style={styles.botAvatar}><span className="material-icons" style={{ color: '#8B5CF6', fontSize: '16px' }}>smart_toy</span></div>}
                            <div style={msg.sender === 'user' ? styles.userBubble : styles.botBubble}>
                                {msg.sender === 'bot' && <div style={styles.botName}>계미나이</div>}
                                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                                {/* 출처 자료가 있으면 3개까지 노출 */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                        {msg.sources.slice(0, 3).map((src, index) => (
                                            <div key={index} style={{ ...styles.referenceBox, marginTop: 0, padding: '8px 12px' }}>
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
                    {/* 첨부파일(클립) 아이콘 삭제 완료 */}
                    <input style={styles.input} placeholder="스페이스 내 파일에 대해 무엇이든 물어보세요..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} />
                    <button style={styles.sendBtn} onClick={handleSendMessage}><span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>arrow_upward</span></button>
                </div>
                {/* 멘트 변경 완료 */}
                <p style={styles.inputHelp}>계미나이는 실수를 할 수 있습니다. 중요한 정보는 파일 원본을 확인해주세요.</p>
            </footer>
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
    inputHelp: { textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '12px' }
};