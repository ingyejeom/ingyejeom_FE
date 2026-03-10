import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockGroups } from '../data/mockData';

// 스페이스 메인 페이지 (챗봇 인터페이스)
export default function Space() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const currentSpace = mockGroups.find(g => g.id === parseInt(spaceId)) || mockGroups[0];

    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: `안녕하세요, 이 스페이스의 AI 어시스턴트입니다.\n현재 업로드된 12개의 문서와 인수인계 내역을 학습했습니다.\n궁금한 점을 물어보세요.`, time: '오전 11:00' },
        { id: 2, sender: 'user', text: "Q1 리스크 리포트에서 언급된 주요 이슈가 뭐야? 요약해줘.", time: '오전 11:05' },
        { id: 3, sender: 'bot', text: "Q1 프로젝트의 주요 리스크 요인은 '공급망 지연'과 '환율 변동'으로 파악됩니다. 관련된 상세 내용은 아래 문서에서 확인하세요.", time: '방금 전', referenceFile: { name: '2024_Q1_Risk_Report.pdf', page: 'pg. 12-15 • 공급망 이슈 섹션' } }
    ]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        const newUserMsg = { id: Date.now(), sender: 'user', text: inputText, time: '방금 전' };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: `'${newUserMsg.text}'에 대한 인수인계 문서 검색 결과입니다. 추가로 궁금한 점이 있으신가요?`, time: '방금 전' }]);
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSendMessage(); };

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
                                {mockGroups.map(group => (
                                    <div key={group.id} style={styles.dropdownItem} onClick={() => { setIsDropdownOpen(false); navigate(`/space/${group.id}`); }}>
                                        {group.name}
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
                        <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>SD</span>
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
                                {msg.referenceFile && (
                                    <div style={styles.referenceBox}>
                                        <div style={styles.refIcon}><span className="material-icons" style={{ color: '#fff', fontSize: '14px' }}>picture_as_pdf</span></div>
                                        <div><p style={styles.refName}>{msg.referenceFile.name}</p><p style={styles.refPage}>{msg.referenceFile.page}</p></div>
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
                    <span className="material-icons" style={styles.inputIcon}>attach_file</span>
                    <input style={styles.input} placeholder="스페이스 내 파일에 대해 무엇이든 물어보세요..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown} />
                    <button style={styles.sendBtn} onClick={handleSendMessage}><span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>arrow_upward</span></button>
                </div>
                <p style={styles.inputHelp}>AI는 스페이스 내의 권한이 있는 문서만 참조하여 답변합니다.</p>
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
    dropdownMenu: { position: 'absolute', top: '100%', left: 0, backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', width: '200px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '8px', zIndex: 20 },
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