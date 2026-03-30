import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Header from '../components/Header';

export default function Home() {
    const navigate = useNavigate();

    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');

    // 페이징을 위한 상태 추가
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 1. 유저 실명 정보 가져오기
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const res = await api.get('/user');
                setUserName(res.data.name);
            } catch (error) {
                const savedId = localStorage.getItem("loginId");
                setUserName(savedId || '사용자');
            }
        };
        fetchUserInfo();
    }, []);

    // 2. 현재 페이지에 맞는 스페이스 목록 가져오기
    const fetchGroups = async (page) => {
        setIsLoading(true);
        try {
            // callpage(현재 페이지) 파라미터 전달
            const response = await api.get('/userSpace/getDashboardSpaces', {
                params: { callPage: page }
            });

            const dataList = response.data.list || [];
            setTotalPages(response.data.totalPage || 1);

            const processedGroups = dataList.map(item => ({
                id: item.id || Math.random(),
                spaceId: item.spaceId,
                groupId: item.groupId,
                name: item.groupName || '이름 없음',
                subName: item.workName || '지정된 업무 없음',
                role: item.role,
                department: '스페이스 멤버',
                status: '참여 중',
                statusColor: '#22C55E',
                iconBg: '#ECFDF5',
                icon: '🏢'
            }));

            setGroups(processedGroups);
        } catch (error) {
            console.error('스페이스 목록 로딩 실패:', error);
            setGroups([
                { id: 1, name: "백엔드 연결 실패", subName: "서버가 켜져있는지 확인해주세요", department: "Error", status: "연결 대기", statusColor: "#EF4444", icon: "⚠️", iconBg: "#FEE2E2" }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups(currentPage);
    }, [currentPage]);

    // 카드 클릭 시 스페이스 입장
    const handleCardClick = (group) => {
        if (group.spaceId) {
            navigate(`/space/${group.spaceId}`);
        } else {
            alert('이동할 스페이스 ID가 없습니다.');
        }
    };

    // 페이지 변경 함수
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div style={styles.pageWrapper}>
            <Header
                rightElement={
                    <button style={styles.createBtn} onClick={() => navigate('/group/create')}>
                        + 그룹 생성
                    </button>
                }
            />

            <div style={styles.container}>
                <div style={styles.headerSection}>
                    <h1 style={styles.title}>환영합니다, {userName}님!</h1>
                    <p style={styles.subtitle}>인수인계 작업을 관리할 스페이스를 선택하세요.</p>
                </div>

                {isLoading ? (
                    <p style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>목록을 불러오는 중입니다...</p>
                ) : (
                    <div style={styles.contentWrapper}>
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

                        {/* 페이지네이션 UI 컨트롤 추가 */}
                        {totalPages > 1 && (
                            <div style={styles.paginationContainer}>
                                <button
                                    style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <span className="material-icons" style={{ fontSize: '20px' }}>chevron_left</span>
                                </button>
                                <span style={styles.pageText}>{currentPage} / {totalPages}</span>
                                <button
                                    style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <span className="material-icons" style={{ fontSize: '20px' }}>chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    pageWrapper: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#F8FAFC' },
    container: { maxWidth: '1280px', margin: '0 auto', padding: '40px', display: 'flex', flexDirection: 'column', flex: 1, width: '100%' },
    createBtn: { padding: '8px 16px', backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', border: 'none' },
    headerSection: { marginBottom: '32px' },
    title: { fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: '#6B7280' },
    contentWrapper: { flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '8px' },
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', paddingBottom: '32px' },
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

    // 페이지네이션 관련 스타일
    paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: 'auto', paddingBottom: '20px' },
    pageBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', color: '#4B5563' },
    pageText: { fontSize: '14px', fontWeight: '600', color: '#374151' }
};