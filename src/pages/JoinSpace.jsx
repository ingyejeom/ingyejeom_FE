import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function JoinSpace() {
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [inviteCode, setInviteCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    // 서버에서 받아올 정보들
    const [spaceInfo, setSpaceInfo] = useState(null);
    const [userName, setUserName] = useState('');

    // 사용자가 입력할 폼 데이터 (현재 백엔드 DTO에는 없지만 UI 유지를 위해 남겨둠)
    const [message, setMessage] = useState('');
    const [task, setTask] = useState('업무 확인');

    // 1. 컴포넌트 마운트 시 내 프로필(이름) 정보 가져오기
    useEffect(() => {
        const fetchMyInfo = async () => {
            try {
                const res = await api.get('/user', { params: { deleted: false } });
                setUserName(res.data.name || res.data.username || '사용자');
            } catch (error) {
                console.error('사용자 정보 로딩 실패:', error);
            }
        };
        fetchMyInfo();
    }, []);

    // 2. 초대 코드 확인 핸들러 (스페이스 정보 조회)
    const handleVerifyCode = async () => {
        if (!inviteCode.trim()) {
            alert('스페이스 코드를 입력해주세요.');
            return;
        }

        try {
            // 현재 백엔드(SpaceRestController)에 코드로 스페이스를 단건 조회하는 API가 없어 임시로 통과하도록 처리. 
            // 백엔드에서 GET /api/space/code/{spaceCode} 생성 후 아래 주석 해제 예쩡
            /*
            const response = await api.get(`/space/code/${inviteCode.trim()}`);
            setSpaceInfo({
              name: response.data.workName || '불러온 스페이스', 
            });
            */

            // 임시 가짜 데이터 세팅 (백엔드 API 추가 전까지 UI 흐름 확인용)
            setSpaceInfo({ name: '확인된 스페이스 (API 연결 시 변경됨)' });
            setIsVerified(true);

        } catch (error) {
            console.error('코드 확인 에러:', error);
            alert('유효하지 않은 코드입니다. 다시 확인해주세요.');
        }
    };

    const handleNextStep = () => {
        if (!isVerified) return;
        setStep(2);
    };

    // 3. 최종 참여 신청하기 핸들러
    const handleSubmit = async () => {
        try {
            // 백엔드 UserSpaceDto.JoinReqDto 형식에 맞춰 spaceCode만 전송
            await api.post('/userSpace/join', {
                spaceCode: inviteCode.trim()
            });

            alert('신청이 완료되었습니다. 관리자 승인 후 스페이스에 입장할 수 있습니다.');
            navigate('/');

        } catch (error) {
            console.error('참여 신청 에러:', error);
            alert('참여 신청에 실패했습니다: ' + (error.response?.data?.message || '알 수 없는 오류'));
        }
    };

    // 화면 1: 코드 입력 및 확인
    if (step === 1) {
        return (
            <div style={styles.pageBackground}>
                <header style={styles.header}>
                    <button style={styles.backBtn} onClick={() => navigate(-1)}>✕</button>
                    <h1 style={styles.headerTitle}>스페이스 참여하기</h1>
                    <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>SD</div>
                </header>

                <main style={styles.mainContainer}>
                    <div style={styles.iconWrapper}><span className="material-icons" style={{ color: '#fff', fontSize: '28px' }}>group_add</span></div>
                    <h2 style={styles.mainTitle}>새로운 스페이스에 참여하세요</h2>
                    <p style={styles.subTitle}>전임자로부터 받은 스페이스 코드를 입력하여 접속하세요.</p>
                    <div style={styles.card}>
                        <label style={styles.label}>스페이스 코드 (Space Code)</label>
                        <div style={styles.inputRow}>
                            <input style={styles.codeInput} placeholder="예: A8F-92K-X01" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} disabled={isVerified} />
                            <button style={isVerified ? styles.verifyBtnDisabled : styles.verifyBtn} onClick={handleVerifyCode} disabled={isVerified}>{isVerified ? '확인 완료' : '확인'}</button>
                        </div>
                        {!isVerified && <p style={styles.helpText}><span className="material-icons" style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '4px' }}>info</span>코드가 없으신가요? 스페이스 인계자에게 문의하세요.</p>}
                        {!isVerified && <div style={styles.placeholderBox}><p style={styles.placeholderText}>확인 후 입력 정보</p></div>}

                        {isVerified && (
                            <div style={styles.verifiedArea}>
                                <div style={styles.spaceInfoBox}><p style={styles.spaceInfoLabel}>참여할 스페이스</p><p style={styles.spaceInfoName}>{spaceInfo.name}</p></div>
                                <div style={styles.inputGroup}><label style={styles.label}>이름</label><input style={styles.input} value={userName} readOnly /></div>
                                <div style={styles.inputGroup}><label style={styles.label}>신청 메시지 (선택)</label><input style={styles.input} placeholder="간단한 인사말을 남겨주세요." value={message} onChange={(e) => setMessage(e.target.value)} /></div>
                                <button style={styles.submitBtnActive} onClick={handleNextStep}>참여 신청하기</button>
                            </div>
                        )}
                        {!isVerified && <button style={styles.submitBtnDisabled} disabled>참여 신청하기</button>}
                    </div>
                </main>
            </div>
        );
    }

    // 화면 2: 최종 신청서 확인 및 제출
    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <button style={styles.backBtn} onClick={() => setStep(1)}>←</button>
                <h1 style={styles.headerTitle}>참여 신청</h1>
                <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>SD</div>
            </header>

            <main style={styles.mainContainer}>
                <div style={styles.card}>
                    <div style={styles.stepTitleBox}><h2 style={styles.stepTitle}>스페이스 참여 신청</h2><p style={styles.stepSubTitle}>아래 정보를 확인하고 신청서를 작성해주세요.</p></div>
                    <div style={styles.formSection}><p style={styles.groupLabel}>스페이스명</p><p style={styles.groupName}>{spaceInfo?.name}</p></div>
                    <div style={styles.formSection}><label style={styles.label}>이름</label><input style={styles.inputReadonly} value={userName} readOnly /><p style={styles.noteText}>* 로그인된 계정 정보가 자동으로 입력됩니다.</p></div>
                    <div style={styles.formSection}>
                        <label style={styles.label}>인계 업무</label>
                        <div style={styles.selectWrapper}>
                            <select style={styles.select} value={task} onChange={(e) => setTask(e.target.value)}>
                                <option value="업무 확인">업무 확인</option>
                                <option value="디자인 파트">디자인 파트</option>
                                <option value="개발 파트">개발 파트</option>
                            </select>
                        </div>
                    </div>
                    <div style={styles.formSection}><label style={styles.label}>신청 문구 (선택사항)</label><input style={styles.input} placeholder="전달할 간단한 메시지를 입력하세요." value={message} onChange={(e) => setMessage(e.target.value)} /></div>
                    <button style={styles.finalSubmitBtn} onClick={handleSubmit}>신청하기</button>
                </div>
                <div style={styles.bottomAlertBox}><p style={styles.bottomAlertText}>신청이 완료되면 승인 대기 상태로 전환되며, 홈 화면으로 이동합니다.</p></div>
            </main>
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh', paddingBottom: '60px' },
    header: { position: 'relative', height: '64px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 },
    backBtn: { fontSize: '20px', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', flex: 1, textAlign: 'left' },
    headerTitle: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '18px', fontWeight: '700', color: '#1F2937' },
    profileAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    mainContainer: { maxWidth: '560px', margin: '40px auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    iconWrapper: { width: '56px', height: '56px', backgroundColor: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)' },
    mainTitle: { fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '12px' },
    subTitle: { fontSize: '15px', color: '#6B7280', marginBottom: '32px', textAlign: 'center' },
    card: { width: '100%', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
    label: { display: 'block', fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: '500' },
    inputRow: { display: 'flex', gap: '12px', marginBottom: '12px' },
    codeInput: { flex: 1, padding: '12px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '15px', color: '#111827', outline: 'none' },
    verifyBtn: { padding: '0 24px', backgroundColor: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    verifyBtnDisabled: { padding: '0 24px', backgroundColor: '#9CA3AF', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'not-allowed' },
    helpText: { fontSize: '12px', color: '#6B7280', marginBottom: '24px' },
    placeholderBox: { border: '1px dashed #D1D5DB', backgroundColor: '#F9FAFB', borderRadius: '8px', padding: '40px 0', textAlign: 'center', marginBottom: '24px' },
    placeholderText: { fontSize: '13px', color: '#9CA3AF' },
    verifiedArea: { marginTop: '24px', animation: 'fadeIn 0.3s ease-in-out' },
    spaceInfoBox: { backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '16px', marginBottom: '24px' },
    spaceInfoLabel: { fontSize: '12px', color: '#3B82F6', fontWeight: '700', marginBottom: '4px' },
    spaceInfoName: { fontSize: '15px', color: '#1E3A8A', fontWeight: '700' },
    inputGroup: { marginBottom: '24px' },
    input: { width: '100%', padding: '12px 16px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#111827' },
    inputReadonly: { width: '100%', padding: '12px 16px', backgroundColor: '#F9FAFB', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#6B7280', outline: 'none' },
    submitBtnDisabled: { width: '100%', padding: '16px', backgroundColor: '#E5E7EB', color: '#9CA3AF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'not-allowed' },
    submitBtnActive: { width: '100%', padding: '16px', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)' },
    stepTitleBox: { marginBottom: '32px', textAlign: 'center' },
    stepTitle: { fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '8px' },
    stepSubTitle: { fontSize: '14px', color: '#4B5563' },
    formSection: { marginBottom: '24px' },
    groupLabel: { fontSize: '12px', color: '#4F46E5', fontWeight: '700', marginBottom: '4px' },
    groupName: { fontSize: '16px', color: '#111827', fontWeight: '700' },
    noteText: { fontSize: '12px', color: '#6B7280', marginTop: '8px' },
    selectWrapper: { position: 'relative' },
    select: { width: '100%', padding: '12px 16px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', color: '#111827', appearance: 'none', outline: 'none', cursor: 'pointer' },
    finalSubmitBtn: { width: '100%', padding: '16px', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' },
    bottomAlertBox: { marginTop: '24px', backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: '8px', padding: '16px', width: '100%' },
    bottomAlertText: { fontSize: '12px', color: '#6B7280', textAlign: 'center' }
};