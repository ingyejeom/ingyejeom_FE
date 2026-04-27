import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Approval() {
    const { approvalId } = useParams();
    const navigate = useNavigate();

    // 상태 관리
    const [myUserId, setMyUserId] = useState(null);
    const [approvalData, setApprovalData] = useState(null);
    
    // 모달 관리
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [signatureInput, setSignatureInput] = useState('');
    const exactMatchText = "본인은 위 인수인계 조항을 모두 이해하였으며, 이에 동의합니다.";

    // 1. 초기 데이터 로드 (내 정보 -> 결재 정보)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 내 정보 획득
                const userRes = await api.get('/user'); // 백엔드 엔드포인트 맞게 수정 (기존 /api/user)
                const userId = userRes.data.id;
                setMyUserId(userId);

                // 결재 정보 획득
                const appRes = await api.get(`/approval`, { params: { id: approvalId } });
                setApprovalData(appRes.data);
            } catch (err) {
                console.error(err);
                alert("정보를 불러오는데 실패했습니다.");
                navigate('/space/list');
            }
        };
        fetchInitialData();
    }, [approvalId, navigate]);

    // 2. 날짜 포맷 함수
    const formatDateTime = (timeData) => {
        if (!timeData) return "";
        let dateObj;
        if (Array.isArray(timeData)) {
            dateObj = new Date(timeData[0], timeData[1] - 1, timeData[2], timeData[3], timeData[4], timeData[5] || 0);
        } else {
            dateObj = new Date(timeData);
        }
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const min = String(dateObj.getMinutes()).padStart(2, '0');
        return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
    };

    // 3. 액션 함수 (서명 완료 & 반려)
    const handleSignSubmit = async () => {
        try {
            await api.post('/approval/sign', { id: approvalId });
            alert("서명이 정상적으로 완료되었습니다.");
            setIsModalOpen(false);
            setSignatureInput('');
            
            // 데이터 새로고침
            const appRes = await api.get(`/approval`, { params: { id: approvalId } });
            setApprovalData(appRes.data);
        } catch (err) {
            alert(err.response?.data?.message || "서명 처리 중 오류가 발생했습니다.");
        }
    };

    const handleReject = async () => {
        if (!window.confirm("정말 인수인계를 반려(취소)하시겠습니까?\n모든 서명이 초기화되며 스페이스는 수정 가능한 상태로 돌아갑니다.")) return;

        try {
            await api.post('/approval/cancel', { id: approvalId });
            alert("인수인계가 반려되었습니다.");
            navigate('/space/list'); // 반려 시 목록으로 추방
        } catch (err) {
            alert(err.response?.data?.message || "반려 처리 중 오류가 발생했습니다.");
        }
    };

    // 4. 결재 박스 렌더링 헬퍼 함수
    const renderSignBox = (roleLabel, roleType, targetUserId, signedAt) => {
        if (!approvalData) return null;

        const currentStatus = approvalData.stepStatus;
        let isSigned = false;
        let isCurrentTurn = false;

        if (roleType === 'ASSIGNOR') {
            isSigned = ['ASSIGNEE_TURN', 'ADMIN_TURN', 'COMPLETED'].includes(currentStatus);
            isCurrentTurn = currentStatus === 'ASSIGNOR_TURN';
        } else if (roleType === 'ASSIGNEE') {
            isSigned = ['ADMIN_TURN', 'COMPLETED'].includes(currentStatus);
            isCurrentTurn = currentStatus === 'ASSIGNEE_TURN';
        } else if (roleType === 'ADMIN') {
            isSigned = currentStatus === 'COMPLETED';
            isCurrentTurn = currentStatus === 'ADMIN_TURN';
        }

        const isMyRole = myUserId === Number(targetUserId);

        return (
            <div style={isCurrentTurn && isMyRole ? { ...styles.signBox, ...styles.myTurnGlow } : styles.signBox}>
                <div style={styles.signHeader}>
                    <div style={isCurrentTurn && isMyRole ? { ...styles.signTitle, color: '#4F46E5' } : styles.signTitle}>{roleLabel}</div>
                    {isCurrentTurn && isMyRole && <div style={styles.turnBadge}>내 차례</div>}
                </div>
                <div style={styles.signContent}>
                    {isSigned ? (
                        <div style={styles.signedState}>
                            <div style={styles.stampBadge}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><polyline points="20 6 9 17 4 12"></polyline></svg>
                                서명 완료
                            </div>
                            <div style={styles.signTime}>{formatDateTime(signedAt)}</div>
                        </div>
                    ) : isCurrentTurn ? (
                        isMyRole ? (
                            <div style={styles.actionButtons}>
                                <button style={styles.btnReject} onClick={handleReject}>반려</button>
                                <button style={styles.btnSign} onClick={() => setIsModalOpen(true)}>서명하기</button>
                            </div>
                        ) : (
                            <div style={styles.statusText}>서명 대기 중</div>
                        )
                    ) : (
                        <div style={styles.statusTextPending}>대기 중</div>
                    )}
                </div>
            </div>
        );
    };

    if (!approvalData) return <div style={styles.loading}>정보를 불러오는 중입니다...</div>;

    return (
        <div style={styles.pageBackground}>
            <div style={styles.layoutContainer}>
                {/* 🌟 좌측 서약서 영역 */}
                <div style={styles.pledgeSection}>
                    <button style={styles.backBtn} onClick={() => navigate(-1)}>
                        <span style={{marginRight: '6px'}}>←</span> 돌아가기
                    </button>
                    <h1 style={styles.docTitle}>업무 인수인계 서약서</h1>

                    <h3 style={styles.articleTitle}>제 1 조 [인계자(전임자) 서약 사항]</h3>
                    <p style={styles.clause}><strong>[정보의 완전성]</strong> 본인은 해당 업무와 관련된 모든 데이터, 산출물, 진행 이력 및 참고 문헌을 고의적인 누락 없이 본 스페이스에 온전히 이관하였습니다.</p>
                    <p style={styles.clause}><strong>[정보의 무결성]</strong> 제공된 자료와 인수인계서에는 허위 사실, 왜곡된 내용, 악의적인 정보 및 잘못된 정보가 포함되어 있지 않음을 보증합니다.</p>
                    <p style={styles.clause}><strong>[책임 소재]</strong> 본 서약 이후, 고의적인 정보 은폐나 허위 자료 제공으로 인해 발생한 업무상 중대한 손실에 대한 귀책사유는 본인에게 있음을 인지하고 동의합니다.</p>

                    <h3 style={styles.articleTitle}>제 2 조 [인수자(후임자) 서약 사항]</h3>
                    <p style={styles.clause}><strong>[자료 검증 및 수령]</strong> 본인은 인계자가 구성한 스페이스 내의 모든 업로드 문서와 인수인계서를 충분한 시간을 들여 열람하고 검증하였습니다.</p>
                    <p style={styles.clause}><strong>[이의 없음]</strong> 업무 수행에 필요한 모든 자료를 빠짐없이 정상적으로 인수하였으며, 제공된 자료의 내용 및 현재 스페이스 상태에 어떠한 이의도 없음을 확인합니다.</p>
                    <p style={styles.clause}><strong>[권한 및 책임 이관]</strong> 본 서약이 완료된 시점부터 해당 업무(스페이스)의 운영, 관리 및 후속 조치에 대한 모든 실무적 권한과 책임은 본인에게 귀속됨을 동의합니다.</p>

                    <h3 style={styles.articleTitle}>제 3 조 [그룹 관리자 승인 사항]</h3>
                    <p style={styles.clause}><strong>[절차의 정당성]</strong> 본인은 본 스페이스의 인수인계 절차가 관리 감독하에 정상적이고 적법하게 진행되었음을 확인합니다.</p>
                    <p style={styles.clause}><strong>[상호 합의 확인]</strong> 인계자와 인수자 양측이 충분한 검토를 거쳐 상호 이견 없이 데이터 이관에 합의하였음을 보증합니다.</p>
                    <p style={styles.clause}><strong>[최종 승인]</strong> 본 서약을 기점으로 해당 업무 스페이스의 책임 소재 변경 및 권한 이전을 최종 승인합니다.</p>

                    <div style={styles.finalConsent}>
                        <strong style={{color: '#0F172A'}}>[최종 동의 및 전자 서명]</strong><br /><br />
                        위 내용을 모두 숙지하였으며, 본인의 역할에 따른 책임과 의무를 다할 것을 서약합니다.<br />
                        동의하실 경우, 우측 하단의 패널에서 전자 서명을 진행하여 주십시오.
                    </div>
                </div>

                {/* 🌟 우측 결재란 영역 */}
                <div style={styles.signatureSection}>
                    <div style={styles.approvalHeader}>결재 현황</div>
                    <div style={styles.signatureTable}>
                        {renderSignBox('전임자 (인계)', 'ASSIGNOR', approvalData.assignorId, approvalData.assignorSignedAt)}
                        {renderSignBox('후임자 (인수)', 'ASSIGNEE', approvalData.assigneeId, approvalData.assigneeSignedAt)}
                        {renderSignBox('관리자 (승인)', 'ADMIN', approvalData.adminId, approvalData.adminSignedAt)}
                    </div>
                </div>
            </div>

            {/* 🌟 서명 모달 */}
            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>전자 서명 진행</h2>
                        <p style={styles.modalDesc}>서명을 완료하려면 아래 문구를 정확히 입력해주세요.</p>
                        
                        <div style={styles.targetSentence}>{exactMatchText}</div>
                        
                        <input 
                            type="text" 
                            style={styles.signInput} 
                            placeholder="여기에 문구를 입력하세요" 
                            value={signatureInput}
                            onChange={(e) => setSignatureInput(e.target.value)}
                            autoComplete="off"
                            autoFocus
                        />

                        <div style={styles.modalActions}>
                            <button style={styles.btnCancel} onClick={() => setIsModalOpen(false)}>취소</button>
                            <button 
                                style={signatureInput === exactMatchText ? styles.btnSubmit : styles.btnSubmitDisabled} 
                                disabled={signatureInput !== exactMatchText} 
                                onClick={handleSignSubmit}
                            >
                                전자 서명 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 스타일 객체
const styles = {
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '16px', color: '#64748B' },
    pageBackground: { backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '40px 20px', boxSizing: 'border-box', fontFamily: '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif', color: '#334155' },
    layoutContainer: { display: 'flex', width: '100%', maxWidth: '1100px', margin: '0 auto', gap: '32px', alignItems: 'flex-start' },
    
    // 서약서 영역
    pledgeSection: { flex: 1, backgroundColor: '#fff', padding: '60px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', lineHeight: 1.8 },
    backBtn: { background: '#F1F5F9', border: 'none', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', color: '#475569', marginBottom: '30px', fontWeight: '500' },
    docTitle: { textAlign: 'center', fontSize: '28px', fontWeight: '800', color: '#0F172A', paddingBottom: '20px', marginBottom: '40px', borderBottom: '2px solid #F1F5F9', letterSpacing: '-0.5px' },
    articleTitle: { fontSize: '18px', fontWeight: '700', color: '#1E293B', marginTop: '40px', marginBottom: '16px', letterSpacing: '-0.3px' },
    clause: { marginBottom: '16px', fontSize: '15px', color: '#475569', textAlign: 'justify', wordBreak: 'keep-all' },
    finalConsent: { marginTop: '50px', backgroundColor: '#F8FAFC', padding: '24px 30px', borderRadius: '12px', fontSize: '15px', color: '#334155', fontWeight: '500', border: '1px solid #E2E8F0' },

    // 결재란 영역
    signatureSection: { width: '320px', backgroundColor: '#fff', padding: '30px', border: '1px solid #E2E8F0', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', position: 'sticky', top: '40px' },
    approvalHeader: { fontWeight: '800', fontSize: '18px', color: '#0F172A', marginBottom: '24px', letterSpacing: '-0.5px' },
    signatureTable: { display: 'flex', flexDirection: 'column', gap: '16px' },
    
    // 개별 결재 박스
    signBox: { display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', backgroundColor: '#fff', transition: 'all 0.2s' },
    myTurnGlow: { borderColor: '#6366F1', backgroundColor: '#EEF2FF', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)' },
    signHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    signTitle: { color: '#475569', fontSize: '14px', fontWeight: '700' },
    turnBadge: { backgroundColor: '#6366F1', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '20px' },
    signContent: { display: 'flex', flexDirection: 'column', gap: '8px' },
    
    statusText: { fontSize: '14px', color: '#3B82F6', fontWeight: '600' },
    statusTextPending: { fontSize: '14px', color: '#94A3B8' },
    
    signedState: { display: 'flex', flexDirection: 'column', gap: '6px' },
    stampBadge: { display: 'inline-flex', alignItems: 'center', backgroundColor: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', width: 'fit-content' },
    signTime: { fontSize: '13px', color: '#64748B', fontFamily: '"Courier New", Courier, monospace', marginLeft: '2px' },
    
    actionButtons: { display: 'flex', gap: '8px', marginTop: '4px' },
    btnSign: { flex: 1, backgroundColor: '#4F46E5', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
    btnReject: { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },

    // 모달 스타일
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', padding: '40px', borderRadius: '20px', width: '480px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #E2E8F0' },
    modalTitle: { margin: '0 0 12px 0', fontSize: '22px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.5px' },
    modalDesc: { color: '#64748B', fontSize: '15px', marginBottom: '24px' },
    targetSentence: { fontSize: '16px', fontWeight: '700', color: '#1E293B', backgroundColor: '#F8FAFC', padding: '20px', margin: '0 0 24px 0', border: '1px solid #E2E8F0', borderRadius: '12px', wordBreak: 'keep-all' },
    signInput: { width: '100%', padding: '16px', fontSize: '15px', border: '1px solid #CBD5E1', borderRadius: '10px', textAlign: 'center', marginBottom: '30px', boxSizing: 'border-box', outline: 'none', fontWeight: '500' },
    modalActions: { display: 'flex', justifyContent: 'center', gap: '12px' },
    btnCancel: { flex: 1, padding: '14px', fontSize: '15px', cursor: 'pointer', border: 'none', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '10px', fontWeight: '600' },
    btnSubmit: { flex: 2, padding: '14px', fontSize: '15px', cursor: 'pointer', border: 'none', backgroundColor: '#4F46E5', color: '#fff', borderRadius: '10px', fontWeight: '600' },
    btnSubmitDisabled: { flex: 2, padding: '14px', fontSize: '15px', cursor: 'not-allowed', border: 'none', backgroundColor: '#C7D2FE', color: '#fff', borderRadius: '10px', fontWeight: '600' }
};
