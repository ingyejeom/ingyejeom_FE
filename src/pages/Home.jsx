import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Header from '../components/Header';

export default function Home() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        // 1. 유저 실명 정보 가져오기 (안전망 강화)
        const fetchUserInfo = async () => {
            try {
                const res = await api.get('/user');
                // 백엔드에서 name이 누락되었을 경우 아이디(username)라도 띄우도록 처리
                // const validName = res.data.name || res.data.username || localStorage.getItem("loginId") || '사용자';
                // setUserName(validName);
                setUserName(res.data.name);
            } catch (error) {
                console.error('❌ 유저 정보 로딩 에러 (토큰 만료 혹은 DB 초기화 때문일 수 있습니다):', error);
                const savedId = localStorage.getItem("loginId");
                setUserName(savedId || '사용자');
            }
        };

        // 2. 내 그룹/스페이스 목록 가져오기
        const fetchGroups = async () => {
            try {
                const response = await api.get('/userSpace/getDashboardSpaces', { params: { deleted: false } });

                const adminGroupSet = new Set();
                const processedGroups = [];

                response.data.forEach(item => {
                    const groupData = {
                        id: item.id || Math.random(),
                        spaceId: item.spaceId,
                        groupId: item.groupId,
                        name: item.groupName || '이름 없음',
                        subName: item.workName || '지정된 업무 없음',
                        role: item.role,
                        department: item.role === 'ADMIN' ? '그룹 관리자' : '스페이스 멤버',
                        status: item.role === 'ADMIN' ? '관리 중' : '참여 중',
                        statusColor: item.role === 'ADMIN' ? '#3B82F6' : '#22C55E',
                        iconBg: item.role === 'ADMIN' ? '#EFF6FF' : '#ECFDF5',
                        icon: item.role === 'ADMIN' ? '👑' : '🏢'
                    };

                    if (item.role === 'ADMIN') {
                        if (!adminGroupSet.has(item.groupName)) {
                            adminGroupSet.add(item.groupName);
                            processedGroups.push(groupData);
                        }
                    } else {
                        processedGroups.push(groupData);
                    }
                });

                setGroups(processedGroups);
            } catch (error) {
                setGroups([
                    { id: 1, name: "백엔드 연결 실패", subName: "서버가 켜져있는지 확인해주세요", department: "Error", status: "연결 대기", statusColor: "#EF4444", icon: "⚠️", iconBg: "#FEE2E2" }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserInfo();
        fetchGroups();
    }, []);

    const handleCardClick = (group) => {
        if (group.role === 'ADMIN') {
            navigate(`/group/manage/${group.groupId}`);
        } else {
            if (group.spaceId) {
                navigate(`/space/${group.spaceId}`);
            } else {
                alert('이동할 스페이스 ID가 없습니다.');
            }
        }
    };

    return (
        <div style={styles.pageWrapper}>
            <Header />

            <div style={styles.container}>
                <div style={styles.headerSection}>
                    <h1 style={styles.title}>환영합니다, {userName}님!</h1>
                    <p style={styles.subtitle}>인수인계 작업을 관리할 그룹과 스페이스를 선택하세요.</p>
                </div>

                {isLoading ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>목록을 불러오는 중입니다...</p>
                ) : (
                    <div style={styles.gridWrapper}>
                        <div style={styles.gridContainer}>
                            {groups.map((group) => (
                                <div key={group.id} style={styles.card} onClick={() => handleCardClick(group)}>
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

                            <div style={styles.addCard} onClick={() => navigate('/group/create')}>
                                <div style={styles.addIconWrapper}>
                                    <span style={styles.addIcon}>+</span>
                                </div>
                                <p style={styles.addText}>새 그룹 생성</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    pageWrapper: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#F8FAFC' },
    container: { maxWidth: '1280px', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column', flex: 1, width: '100%' },
    headerSection: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: '#6B7280' },
    gridWrapper: { flex: 1, overflowY: 'auto', paddingRight: '8px' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', paddingBottom: '40px' },
    card: { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s, boxShadow 0.2s' },
    iconWrapper: { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' },
    icon: { fontSize: '32px' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: '4px' },
    cardSubName: { fontSize: '14px', color: '#4B5563', marginBottom: '16px', textAlign: 'center', wordBreak: 'keep-all' },
    divider: { width: '100%', height: '1px', backgroundColor: '#F3F4F6', margin: '16px 0' },
    cardFooter: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    department: { fontSize: '12px', color: '#9CA3AF', fontWeight: '600' },
    statusBadge: { fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' },
    addCard: { backgroundColor: '#F9FAFB', border: '2px dashed #D1D5DB', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'pointer', minHeight: '260px' },
    addIconWrapper: { width: '48px', height: '48px', backgroundColor: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' },
    addIcon: { fontSize: '30px', color: '#9CA3AF', lineHeight: '1' },
    addText: { fontSize: '16px', color: '#6B7280', fontWeight: '600' },
};