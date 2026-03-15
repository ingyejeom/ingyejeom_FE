import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api'; 

export default function CreateGroup() {
    const navigate = useNavigate();
    const [groupName, setGroupName] = useState('');
    const [tasks, setTasks] = useState([{ id: 1, name: '', email: '' }, { id: 2, name: '', email: '' }]);
    const [openImmediately, setOpenImmediately] = useState(true);

    const handleAddTask = () => setTasks([...tasks, { id: Date.now(), name: '', email: '' }]);
    const handleTaskNameChange = (id, newName) => setTasks(tasks.map(task => task.id === id ? { ...task, name: newName } : task));
    const handleEmailChange = (id, newEmail) => setTasks(tasks.map(task => task.id === id ? { ...task, email: newEmail } : task));

    const handleSubmit = async () => {
        if (!groupName.trim()) {
            alert('그룹명을 입력해주세요!');
            return;
        }

        // GroupDto.CreateReqDto 형식에 맞게 데이터 가공
        const requestData = {
            groupName: groupName,
            spaces: tasks
                .filter(task => task.name.trim() !== '') // 업무명이 비어있지 않은 것만 필터링
                .map(task => ({
                    workName: task.name,
                    userEmail: task.email
                }))
        };

        try {
            // 백엔드로 POST 요청 전송
            const response = await api.post('/group', requestData);

            alert('그룹이 성공적으로 생성되었습니다!');

            if (openImmediately) {
                // 성공 시 응답(DefaultDto.CreateResDto)으로 생성된 id가 넘어온다고 가정
                const newGroupId = response.data.id || '';
                navigate(`/group/manage/${newGroupId}`); // 생성된 그룹의 스페이스 목록(관리)으로 이동
            } else {
                navigate('/'); // 홈으로 이동
            }

        } catch (error) {
            console.error('그룹 생성 에러:', error);
            alert('그룹 생성에 실패했습니다: ' + (error.response?.data?.message || '알 수 없는 오류'));
        }
    };

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <button style={styles.backBtn} onClick={() => navigate(-1)}>✕</button>
                </div>
                <h1 style={styles.headerTitle}>새로운 그룹 (New Group)</h1>
                <div style={styles.headerRight}>
                    <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>SD</div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <section style={styles.section}>
                    <div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>그룹 정보 설정</h2><p style={styles.sectionSubtitle}>기본적인 그룹 정보를 입력해주세요.</p></div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>그룹명 (Group Name)</label>
                        <input style={styles.input} placeholder="예: 공식 그룹명" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>업무 내용 (Task Details)</label>
                        {tasks.map((task) => (
                            <input key={task.id} style={{ ...styles.input, marginBottom: '12px' }} placeholder="업무 이름을 입력하세요" value={task.name} onChange={(e) => handleTaskNameChange(task.id, e.target.value)} />
                        ))}
                        <button style={styles.addTaskBtn} onClick={handleAddTask}>+ 업무 추가하기</button>
                    </div>
                </section>

                <section style={{ ...styles.section, marginTop: '24px' }}>
                    <div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>멤버 초대 및 완료</h2><p style={styles.sectionSubtitle}>함께 인계 과정을 진행할 멤버들을 초대하세요.</p></div>
                    {tasks.map((task) => (
                        <div key={`email-${task.id}`} style={styles.inputGroup}>
                            <label style={styles.emailLabel}>{task.name || '새 업무'} 참여자 이메일</label>
                            <div style={styles.emailInputWrapper}>
                                <span className="material-icons" style={styles.emailIcon}>person_add</span>
                                <input style={styles.emailInput} placeholder="participant@example.com" value={task.email} onChange={(e) => handleEmailChange(task.id, e.target.value)} />
                            </div>
                            <p style={styles.emailHelpText}>'{task.name || '새 업무'}' 업무를 담당할 분의 이메일 주소를 입력해주세요.</p>
                        </div>
                    ))}
                    <div style={styles.divider}></div>
                    <div style={styles.submitArea}>
                        <button style={styles.submitBtn} onClick={handleSubmit}><span className="material-icons" style={{ fontSize: '20px' }}>rocket_launch</span>인계 그룹 생성하기</button>
                        <label style={styles.checkboxLabel}>
                            <input type="checkbox" style={styles.checkbox} checked={openImmediately} onChange={(e) => setOpenImmediately(e.target.checked)} />
                            생성 후 바로 그룹 열기 (Open immediately)
                        </label>
                    </div>
                </section>
                <div style={styles.footerGuide}><span style={styles.guideText}>도움이 필요하신가요? 가이드 보기</span></div>
            </main>
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh', paddingBottom: '60px' },
    header: { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #E5E7EB', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
    headerLeft: { flex: 1 },
    backBtn: { fontSize: '24px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' },
    headerTitle: { flex: 2, textAlign: 'center', fontSize: '18px', fontWeight: '700', fontStyle: 'italic', color: '#111827' },
    headerRight: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
    profileAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
    mainContainer: { maxWidth: '800px', margin: '40px auto 0' },
    section: { backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '40px' },
    sectionHeader: { borderBottom: '2px solid #4F46E5', paddingBottom: '16px', marginBottom: '32px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', fontStyle: 'italic', color: '#4F46E5', marginBottom: '8px' },
    sectionSubtitle: { fontSize: '14px', color: '#6B7280' },
    inputGroup: { marginBottom: '24px' },
    label: { display: 'block', fontSize: '14px', fontWeight: '700', fontStyle: 'italic', color: '#1F2937', marginBottom: '12px' },
    input: { width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '15px', backgroundColor: '#FFFFFF', outline: 'none' },
    addTaskBtn: { width: '100%', padding: '16px', borderRadius: '8px', border: '2px dashed #D1D5DB', backgroundColor: '#FFFFFF', color: '#4F46E5', fontSize: '15px', cursor: 'pointer', textAlign: 'center', marginTop: '4px' },
    emailLabel: { display: 'block', fontSize: '14px', fontWeight: '700', fontStyle: 'italic', color: '#4F46E5', marginBottom: '12px' },
    emailInputWrapper: { display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '0 16px' },
    emailIcon: { color: '#9CA3AF', marginRight: '12px' },
    emailInput: { flex: 1, border: 'none', padding: '16px 0', fontSize: '15px', outline: 'none' },
    emailHelpText: { fontSize: '12px', color: '#6B7280', marginTop: '8px' },
    divider: { height: '1px', backgroundColor: '#E5E7EB', margin: '40px 0' },
    submitArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
    submitBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 40px', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: '8px', fontSize: '18px', fontWeight: '700', fontStyle: 'italic', cursor: 'pointer', border: 'none' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1F2937', cursor: 'pointer' },
    checkbox: { width: '18px', height: '18px', accentColor: '#4F46E5', cursor: 'pointer' },
    footerGuide: { textAlign: 'center', marginTop: '32px' },
    guideText: { fontSize: '14px', color: '#6B7280', textDecoration: 'underline', cursor: 'pointer' }
};