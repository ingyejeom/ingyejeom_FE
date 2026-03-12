import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Home() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 💡 1. 유저 이름을 담을 상태(State) 추가
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // 💡 2. 서버에서 유저 정보 가져오는 함수
        const fetchUserInfo = async () => {
            try {
                const res = await api.get('/user');
                // 백엔드 데이터에 name(실명)이 있으면 name, 없으면 username(아이디)를 사용
                setUserName(res.data.username || res.data.name || '사용자');
            } catch (error) {
                console.error("유저 정보를 불러오는데 실패했습니다:", error);
                setUserName('사용자'); // 에러 시 기본값
            }
        };

        // 스페이스 목록 가져오는 함수
        const fetchGroups = async () => {
            try {
                // 백엔드의 실제 스페이스 목록 API 주소가 다를 경우 아래 '/spaces'를 수정하세요.
                // 예: const response = await api.get('/userSpace/list', { params: { deleted: false } });
                const response = await api.get('/userSpace/list', );
                setGroups(response.data);
            } catch (error) {
                console.error("스페이스 목록을 불러오는데 실패했습니다:", error);
                setGroups([
                    { id: 1, name: "백엔드 연결 실패", subName: "서버가 켜져있는지 확인해주세요", department: "Error", status: "연결 대기", statusColor: "#EF4444", icon: "⚠️", iconBg: "#FEE2E2" }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        // 두 함수 모두 실행
        fetchUserInfo();
        fetchGroups();
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.headerSection}>
                {/* 💡 3. 하드코딩된 'SD' 대신 상태값 {userName} 렌더링 */}
                <h1 style={styles.title}>환영합니다, {userName}님!</h1>
                <p style={styles.subtitle}>인수인계 작업을 관리할 그룹을 선택하세요.</p>
            </div>

            {isLoading ? (
                <p style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>목록을 불러오는 중입니다...</p>
            ) : (
                <div style={styles.gridContainer}>
                    {groups.map((group) => (
                        <div key={group.id} style={styles.card} onClick={() => navigate(`/space/${group.id}`)}>
                            <div style={{ ...styles.iconWrapper, backgroundColor: group.iconBg || '#EFF6FF' }}>
                                <span style={styles.icon}>{group.icon || '🏢'}</span>
                            </div>
                            <h3 style={styles.cardTitle}>{group.name}</h3>
                            <p style={styles.cardSubName}>{group.subName}</p>

                            <div style={styles.divider}></div>

                            <div style={styles.cardFooter}>
                                <span style={styles.department}>{group.department}</span>
                                <span style={{ ...styles.statusBadge, color: group.statusColor || '#22C55E', backgroundColor: `${group.statusColor || '#22C55E'}20` }}>
                                    ● {group.status || '활성'}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* 새 그룹 생성 카드 */}
                    <div style={styles.addCard} onClick={() => navigate('/group/create')}>
                        <div style={styles.addIconWrapper}>
                            <span style={styles.addIcon}>+</span>
                        </div>
                        <p style={styles.addText}>새 그룹 생성</p>
                    </div>
                </div>
            )}

            <div style={styles.bottomHelp}>
                <p style={styles.helpText}>찾으시는 그룹이 없으신가요?</p>
                <p style={styles.helpLinks}>
                    <span style={styles.link} onClick={() => navigate('/space/join')}>기존 워크스페이스 참여</span>
                    {' 또는 '}
                    <span style={styles.link} onClick={() => navigate('/group/create')}>새 그룹 만들기</span>
                </p>
            </div>
        </div>
    );
}

// --- 인라인 스타일 ---
const styles = {
    container: { maxWidth: '1280px', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' },
    headerSection: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: 'var(--text-sub)' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '60px' },
    card: { backgroundColor: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s' },
    iconWrapper: { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
    icon: { fontSize: '32px' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', textAlign: 'center', marginBottom: '4px' },
    cardSubName: { fontSize: '14px', color: '#4B5563', marginBottom: '16px' },
    divider: { width: '100%', height: '1px', backgroundColor: '#F3F4F6', margin: '16px 0' },
    cardFooter: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    department: { fontSize: '12px', color: '#9CA3AF' },
    statusBadge: { fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' },
    addCard: { backgroundColor: '#F9FAFB', border: '2px dashed #D1D5DB', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'pointer', minHeight: '260px' },
    addIconWrapper: { width: '48px', height: '48px', backgroundColor: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' },
    addIcon: { fontSize: '30px', color: '#9CA3AF', lineHeight: '1' },
    addText: { fontSize: '16px', color: '#6B7280' },
    bottomHelp: { marginTop: 'auto', textAlign: 'center' },
    helpText: { fontSize: '14px', color: '#6B7280', marginBottom: '8px' },
    helpLinks: { fontSize: '14px', color: 'var(--text-main)' },
    link: { color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }
};