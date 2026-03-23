import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../api/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const MODULE_TYPES = {
    'BASIC_INFO': { icon: '📋', label: '기본 정보' },
    'ACCOUNT_ACCESS': { icon: '🔐', label: '계정 정보' },
    'TASK': { icon: '📝', label: '업무/과업' },
    'ASSET': { icon: '📦', label: '물리적 자산' },
    'BUDGET': { icon: '💳', label: '예산/비용' },
    'DOCUMENT_CONTACT': { icon: '📁', label: '문서/연락망' },
    'RISK': { icon: '⚠️', label: '리스크' },
    'STAKEHOLDER': { icon: '👥', label: '이해관계자' },
    'DECISION_HISTORY': { icon: '📜', label: '의사결정 히스토리' },
    'FREE_NOTE': { icon: '✏️', label: '자유 기록' }
};

export default function Handover() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    // 💡 URL에서 넘어온 타겟 스페이스 ID 추출
    const searchParams = new URLSearchParams(location.search);
    const targetSpaceId = searchParams.get('spaceId');

    const isViewMode = location.pathname.includes('/view');
    const isEditMode = location.pathname.includes('/edit') || id != null;

    const [title, setTitle] = useState('');
    const [role, setRole] = useState('');
    const [modules, setModules] = useState([]);

    const [metaInfo, setMetaInfo] = useState({ groupName: '그룹', workName: '스페이스', userName: '-', createdAt: null, spaceId: null });
    const [userSpaceId, setUserSpaceId] = useState(null);

    // PDF 생성 관련 상태
    const [isSaved, setIsSaved] = useState(!!id); // 기존 문서는 이미 저장됨
    const [savedHandoverId, setSavedHandoverId] = useState(id ? parseInt(id) : null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        if (id) {
            const fetchHandover = async () => {
                try {
                    const res = await api.get('/handover', { params: { id } });
                    const data = res.data;

                    setTitle(data.title || '');
                    setRole(data.role || '');
                    setMetaInfo({
                        groupName: data.groupName,
                        workName: data.workName,
                        userName: data.userName,
                        createdAt: data.createdAt,
                        spaceId: data.spaceId
                    });

                    if (data.text) {
                        try {
                            const parsed = JSON.parse(data.text);
                            setModules(parsed.modules || []);
                        } catch (e) { console.error('JSON 파싱 오류', e); }
                    }
                } catch (error) {
                    console.error(error);
                    alert('문서를 불러오는데 실패했습니다.');
                }
            };
            fetchHandover();
        } else {
            // 💡 [버그 수정됨] 정확한 userSpaceId 매칭
            const fetchUserSpace = async () => {
                try {
                    const res = await api.get('/userSpace/list', { params: { deleted: false } });

                    // 타겟 스페이스 아이디와 일치하는 내 참여 스페이스 정보를 찾음
                    const matchingSpace = targetSpaceId
                        ? res.data.find(item => item.spaceId === parseInt(targetSpaceId))
                        : null;

                    if (matchingSpace) {
                        setUserSpaceId(matchingSpace.id); // 올바른 ID 세팅!
                        setMetaInfo(prev => ({ ...prev, groupName: matchingSpace.groupName, workName: matchingSpace.workName, spaceId: matchingSpace.spaceId }));
                    } else if (res.data.length > 0) {
                        // 못 찾을 경우 예외처리
                        setUserSpaceId(res.data[0].id);
                        setMetaInfo(prev => ({ ...prev, groupName: res.data[0].groupName, workName: res.data[0].workName, spaceId: res.data[0].spaceId }));
                    }
                } catch (error) { console.error(error); }
            };
            fetchUserSpace();
        }
    }, [id, targetSpaceId]);

    const addModule = (type) => {
        const newModule = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            type: type,
            data: {},
            collapsed: false
        };
        setModules([...modules, newModule]);
    };

    const removeModule = (moduleId) => {
        if (window.confirm('이 모듈을 삭제하시겠습니까?')) {
            setModules(modules.filter(m => m.id !== moduleId));
        }
    };

    const toggleModule = (moduleId) => {
        setModules(modules.map(m => m.id === moduleId ? { ...m, collapsed: !m.collapsed } : m));
    };

    const moveModule = (index, direction) => {
        const newModules = [...modules];
        if (direction === 'UP' && index > 0) {
            [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
        } else if (direction === 'DOWN' && index < newModules.length - 1) {
            [newModules[index + 1], newModules[index]] = [newModules[index], newModules[index + 1]];
        }
        setModules(newModules);
    };

    const updateModuleData = (moduleId, field, value) => {
        setModules(modules.map(m => m.id === moduleId ? { ...m, data: { ...m.data, [field]: value } } : m));
    };

    const handleSave = async () => {
        if (!title.trim()) { alert('인수인계서 제목을 입력해주세요.'); return; }
        const payloadText = JSON.stringify({ modules });

        try {
            if (id || savedHandoverId) {
                // 수정 모드: 기존 문서 업데이트
                const handoverId = savedHandoverId || parseInt(id);
                await api.put('/handover', { id: handoverId, title, role, text: payloadText });
                alert('저장되었습니다. PDF를 생성하려면 "PDF 생성" 버튼을 클릭하세요.');
                setIsSaved(true);
            } else {
                // 생성 모드: spaceId로 새 문서 생성 (새 API 사용)
                if (!targetSpaceId) { alert('스페이스 정보를 찾을 수 없습니다.'); return; }
                const res = await api.post('/handover/bySpace', { title, role, text: payloadText, spaceId: parseInt(targetSpaceId) });
                const newId = res.data?.id;
                if (newId) {
                    setSavedHandoverId(newId);
                }
                setIsSaved(true);
                alert('저장되었습니다. PDF를 생성하려면 "PDF 생성" 버튼을 클릭하세요.');
            }
        } catch (error) {
            console.error(error);
            alert('저장에 실패했습니다.');
        }
    };

    // PDF 생성용 임시 요소 생성
    const createPdfContent = () => {
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;padding:40px;background:#fff;font-family:sans-serif;';

        // 헤더
        const header = document.createElement('div');
        header.style.cssText = 'text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #333;';
        header.innerHTML = `
            <h1 style="font-size:28px;font-weight:700;color:#333;margin:0 0 10px 0;word-wrap:break-word;">${title || '인수인계서'}</h1>
            <p style="font-size:14px;color:#666;margin:0 0 15px 0;">${role || ''} 업무 인수인계서</p>
            <div style="font-size:12px;color:#888;">
                <span>작성일: ${metaInfo.createdAt ? metaInfo.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}</span>
                <span style="margin-left:20px;">작성자: ${metaInfo.userName || '-'}</span>
            </div>
        `;
        container.appendChild(header);

        // 모듈 내용
        modules.forEach(module => {
            const typeInfo = MODULE_TYPES[module.type] || { icon: '📄', label: '모듈' };
            const moduleDiv = document.createElement('div');
            moduleDiv.style.cssText = 'margin-bottom:20px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;';

            const moduleHeader = document.createElement('div');
            moduleHeader.style.cssText = 'background:#f8f9fa;padding:12px 15px;font-weight:700;border-bottom:1px solid #e0e0e0;';
            moduleHeader.textContent = `${typeInfo.icon} ${typeInfo.label}`;
            moduleDiv.appendChild(moduleHeader);

            const moduleBody = document.createElement('div');
            moduleBody.style.cssText = 'padding:15px;';

            const data = module.data || {};
            Object.entries(data).forEach(([key, value]) => {
                if (value && String(value).trim()) {
                    const row = document.createElement('div');
                    row.style.cssText = 'margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #f0f0f0;';
                    row.innerHTML = `<span style="font-size:11px;color:#888;display:block;margin-bottom:3px;">${key}</span><span style="font-size:13px;color:#333;word-wrap:break-word;">${String(value)}</span>`;
                    moduleBody.appendChild(row);
                }
            });

            moduleDiv.appendChild(moduleBody);
            container.appendChild(moduleDiv);
        });

        return container;
    };

    // PDF 생성 및 업로드 함수
    const handleGeneratePdf = async () => {
        if (!isSaved) {
            alert('먼저 인수인계서를 저장해주세요.');
            return;
        }

        setIsGeneratingPdf(true);

        try {
            // PDF용 임시 요소 생성
            const pdfContent = createPdfContent();
            document.body.appendChild(pdfContent);

            // 렌더링 대기
            await new Promise(resolve => setTimeout(resolve, 100));

            // html2canvas로 캡처
            const canvas = await html2canvas(pdfContent, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // 임시 요소 제거
            document.body.removeChild(pdfContent);

            const imgData = canvas.toDataURL('image/png');
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 10;
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const doc = new jsPDF('p', 'mm', 'a4');
            let heightLeft = imgHeight;
            let position = margin;

            doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - margin * 2);

            while (heightLeft > 0) {
                doc.addPage();
                position = margin - (imgHeight - heightLeft);
                doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                heightLeft -= (pageHeight - margin * 2);
            }

            // PDF를 Blob으로 변환
            const pdfBlob = doc.output('blob');
            const fileName = `${title || '인수인계서'}_${new Date().toISOString().split('T')[0]}.pdf`;
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

            // spaceId 확인
            const uploadSpaceId = targetSpaceId || metaInfo.spaceId;
            if (!uploadSpaceId) {
                alert('스페이스 정보를 찾을 수 없어 PDF 업로드가 불가합니다.');
                return;
            }

            // FormData로 파일 업로드
            const formData = new FormData();
            formData.append('file', pdfFile);
            formData.append('spaceId', uploadSpaceId.toString());

            await api.post('/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 0
            });

            alert('PDF가 생성되어 파일탐색기에 업로드되었습니다.');
        } catch (error) {
            console.error('PDF 생성 오류:', error);
            alert('PDF 생성에 실패했습니다.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const getModuleTypeInfo = (type) => MODULE_TYPES[type] || { icon: '📄', label: '모듈' };

    // ==========================================
    // [View Mode] 렌더링 함수
    // ==========================================
    const renderViewField = (label, value, isLink = false) => {
        if (value === undefined || value === null || value === '') return null;
        return (
            <div style={styles.viewRow}>
                <div style={styles.viewLabel}>{label}</div>
                <div style={styles.viewValue}>
                    {isLink ? <a href={value} target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>링크 열기</a> : value}
                </div>
            </div>
        );
    };

    const renderViewModule = (module) => {
        const { data } = module;
        switch (module.type) {
            case 'BASIC_INFO': return <><div style={styles.viewGrid}>{renderViewField('인계자 성명', data.handoverName)}{renderViewField('소속 / 직급', data.affiliation)}</div><div style={styles.viewGrid}>{renderViewField('인계 시작일', data.periodStart)}{renderViewField('인계 종료일', data.periodEnd)}</div><div style={styles.viewGrid}>{renderViewField('비상 연락처', data.emergencyContact)}{renderViewField('인수자 성명', data.receiverName)}</div></>;
            case 'ACCOUNT_ACCESS': return <>{renderViewField('시스템 / 사이트명', data.systemName)}{renderViewField('접속 URL', data.accessUrl, true)}<div style={styles.viewGrid}>{renderViewField('ID / 계정명', data.accountId)}{renderViewField('권한 등급', data.permissionLevel)}</div>{renderViewField('이용 규칙', data.usageRule)}</>;
            case 'TASK': return <>{renderViewField('업무명', <strong style={{ fontSize: '18px' }}>{data.taskName}</strong>)}<div style={styles.viewGrid}>{renderViewField('업무 유형', data.taskType)}{renderViewField('중요도', data.importance)}</div><div style={styles.viewGrid}>{renderViewField('수행 주기/시점', data.schedule)}{renderViewField('소요 시간', data.duration)}</div>{renderViewField('선행 업무', data.prerequisiteTask)}{renderViewField('필요 도구/환경', data.requiredTools)}{renderViewField('상세 절차 (Step)', <pre style={styles.preText}>{data.procedure}</pre>)}{renderViewField('산출물 (Output)', data.output)}{renderViewField('검증 기준', data.verificationCriteria)}{renderViewField('트러블슈팅', data.troubleshooting)}<hr style={styles.divider} />{renderViewField('현재 상태', data.status)}<div style={styles.viewGrid}>{renderViewField('최근 수행일', data.lastExecutionDate)}{renderViewField('차기 수행일', data.nextExecutionDate)}</div>{renderViewField('미결 사항', data.pendingIssues)}<hr style={styles.divider} />{renderViewField('관련 문서 링크', data.relatedDocLinks, true)}<div style={styles.viewGrid}>{renderViewField('사용 계정', data.relatedAccount)}{renderViewField('관련 담당자', data.relatedContact)}</div>{renderViewField('참고 레퍼런스', data.referenceLinks, true)}</>;
            case 'ASSET': return <>{renderViewField('품목명', <strong style={{ fontSize: '18px' }}>{data.itemName}</strong>)}{renderViewField('보관 위치', data.storageLocation)}{renderViewField('수량 / 상태', data.quantityStatus)}{renderViewField('반납 여부', data.isReturned ? '✅ 반납 완료' : '❌ 미반납')}</>;
            case 'BUDGET': return <>{renderViewField('비용 항목', <strong style={{ fontSize: '18px' }}>{data.costItem}</strong>)}<div style={styles.viewGrid}>{renderViewField('결제일 / 주기', data.paymentSchedule)}{renderViewField('금액', data.amount ? `${Number(data.amount).toLocaleString()}원` : '')}</div>{renderViewField('관련 장부', data.ledgerLink, true)}</>;
            case 'DOCUMENT_CONTACT': return <>{renderViewField('문서 제목 / 이름', data.docTitle)}<div style={styles.viewGrid}>{renderViewField('유형 / 소속', data.docType)}{renderViewField('보관 형태 / 연락처', data.storageType)}</div>{renderViewField('위치 / 역할', data.docLocation)}</>;
            case 'RISK': return <>{renderViewField('리스크 제목', <strong style={{ fontSize: '18px' }}>{data.riskTitle}</strong>)}{renderViewField('리스크 설명', data.riskDescription)}<div style={styles.viewGrid}>{renderViewField('영향도', data.impact)}{renderViewField('발생 조건', data.triggerCondition)}</div>{renderViewField('즉각 대응 방법', data.immediateResponse)}{renderViewField('사전 예방 방법', data.prevention)}<hr style={styles.divider} /><div style={styles.viewGrid}>{renderViewField('관련 업무', data.relatedTask)}{renderViewField('참고 문서', data.referenceDoc)}</div>{renderViewField('외부 공유 가능', data.isExternalShareable ? '✅ 예' : '❌ 아니오')}<hr style={styles.divider} /><div style={styles.viewGrid}>{renderViewField('작성자', data.author)}{renderViewField('최종 업데이트일', data.lastUpdatedDate)}</div></>;
            case 'STAKEHOLDER': return <>{renderViewField('이름 / 직함', <strong style={{ fontSize: '18px' }}>{data.personName}</strong>)}{renderViewField('소속 / 관계', data.organization)}{renderViewField('연락처', data.contact)}{renderViewField('담당 역할', data.role)}</>;
            case 'DECISION_HISTORY': return <>{renderViewField('결정 제목', <strong style={{ fontSize: '18px' }}>{data.decisionTitle}</strong>)}{renderViewField('결정 내용', data.decisionContent)}{renderViewField('결정 이유 (Why)', data.decisionReason)}<div style={styles.viewGrid}>{renderViewField('결정 시점', data.decisionDate)}{renderViewField('결정자', data.decisionMaker)}</div><hr style={styles.divider} />{renderViewField('대안 검토 여부', data.hasAlternatives === 'YES' ? '✅ 있음' : (data.hasAlternatives === 'NO' ? '❌ 없음' : ''))}{renderViewField('검토된 대안', data.reviewedAlternatives)}{renderViewField('변경 영향', data.changeImpact)}<hr style={styles.divider} /><div style={styles.viewGrid}>{renderViewField('관련 업무', data.relatedTask)}{renderViewField('참고 자료', data.referenceUrl, true)}</div><div style={styles.viewGrid}>{renderViewField('외부 공유 가능', data.isExternalShareable ? '✅ 예' : '❌ 아니오')}{renderViewField('최종 업데이트일', data.lastUpdatedDate)}</div></>;
            case 'FREE_NOTE': return <>{renderViewField('제목', <strong style={{ fontSize: '18px' }}>{data.noteTitle}</strong>)}<div style={styles.viewGrid}>{renderViewField('분류', data.category)}{renderViewField('중요도', data.importance)}</div>{renderViewField('내용', <pre style={styles.preText}>{data.content}</pre>)}<hr style={styles.divider} />{renderViewField('관련 업무', data.relatedTask)}{renderViewField('첨부/참고 링크', data.attachmentLink, true)}<div style={styles.viewGrid}>{renderViewField('작성자', data.author)}{renderViewField('작성일', data.createdDate)}</div></>;
            default: return <p>알 수 없는 모듈입니다.</p>;
        }
    };

    // ==========================================
    // [Edit Mode] 렌더링 함수
    // ==========================================
    const renderEditModule = (module) => {
        const { data, id: mId } = module;
        const handleChange = (field, e) => updateModuleData(mId, field, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
        const full = { ...styles.formRow, gridColumn: 'span 2' };

        switch (module.type) {
            case 'BASIC_INFO': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>인계자 성명</label><input style={styles.input} value={data.handoverName || ''} onChange={(e) => handleChange('handoverName', e)} /></div>
                    <div style={full}><label style={styles.label}>소속 / 직급</label><input style={styles.input} value={data.affiliation || ''} onChange={(e) => handleChange('affiliation', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>인계 시작일</label><input type="date" style={styles.input} value={data.periodStart || ''} onChange={(e) => handleChange('periodStart', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>인계 종료일</label><input type="date" style={styles.input} value={data.periodEnd || ''} onChange={(e) => handleChange('periodEnd', e)} /></div>
                    <div style={full}><label style={styles.label}>비상 연락처</label><input style={styles.input} value={data.emergencyContact || ''} onChange={(e) => handleChange('emergencyContact', e)} /></div>
                    <div style={full}><label style={styles.label}>인수자 성명</label><input style={styles.input} value={data.receiverName || ''} onChange={(e) => handleChange('receiverName', e)} /></div>
                </div>
            );
            case 'ACCOUNT_ACCESS': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>시스템 / 사이트명</label><input style={styles.input} value={data.systemName || ''} onChange={(e) => handleChange('systemName', e)} /></div>
                    <div style={full}><label style={styles.label}>접속 URL</label><input type="url" style={styles.input} value={data.accessUrl || ''} onChange={(e) => handleChange('accessUrl', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>ID / 계정명</label><input style={styles.input} value={data.accountId || ''} onChange={(e) => handleChange('accountId', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>비밀번호</label><input type="password" style={styles.input} value={data.password || ''} onChange={(e) => handleChange('password', e)} /></div>
                    <div style={full}><label style={styles.label}>권한 등급</label>
                        <select style={styles.input} value={data.permissionLevel || ''} onChange={(e) => handleChange('permissionLevel', e)}>
                            <option value="">선택</option><option value="ADMIN">Admin (최고관리자)</option><option value="MANAGER">Manager (매니저)</option><option value="NORMAL">Normal (일반)</option><option value="VIEWER">Viewer (뷰어)</option>
                        </select>
                    </div>
                    <div style={full}><label style={styles.label}>이용 규칙</label><textarea style={styles.textarea} value={data.usageRule || ''} onChange={(e) => handleChange('usageRule', e)} /></div>
                </div>
            );
            case 'TASK': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>업무명</label><input style={styles.input} value={data.taskName || ''} onChange={(e) => handleChange('taskName', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>업무 유형</label>
                        <select style={styles.input} value={data.taskType || ''} onChange={(e) => handleChange('taskType', e)}><option value="">선택</option><option value="ROUTINE">정기 루틴</option><option value="EVENT">비정기 이벤트</option><option value="PROJECT">일회성 프로젝트</option></select>
                    </div>
                    <div style={styles.formRow}><label style={styles.label}>중요도</label>
                        <select style={styles.input} value={data.importance || ''} onChange={(e) => handleChange('importance', e)}><option value="">선택</option><option value="CRITICAL">🔥 Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select>
                    </div>
                    <div style={styles.formRow}><label style={styles.label}>수행 주기/시점</label><input style={styles.input} value={data.schedule || ''} onChange={(e) => handleChange('schedule', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>소요 시간</label><input style={styles.input} value={data.duration || ''} onChange={(e) => handleChange('duration', e)} /></div>
                    <div style={full}><label style={styles.label}>선행 업무</label><input style={styles.input} value={data.prerequisiteTask || ''} onChange={(e) => handleChange('prerequisiteTask', e)} /></div>
                    <div style={full}><label style={styles.label}>필요 도구/환경</label><input style={styles.input} value={data.requiredTools || ''} onChange={(e) => handleChange('requiredTools', e)} /></div>
                    <div style={full}><label style={styles.label}>상세 절차 (Step)</label><textarea style={styles.textarea} value={data.procedure || ''} onChange={(e) => handleChange('procedure', e)} /></div>
                    <div style={full}><label style={styles.label}>산출물 (Output)</label><input style={styles.input} value={data.output || ''} onChange={(e) => handleChange('output', e)} /></div>
                    <div style={full}><label style={styles.label}>검증 기준</label><textarea style={styles.textarea} value={data.verificationCriteria || ''} onChange={(e) => handleChange('verificationCriteria', e)} /></div>
                    <div style={full}><label style={styles.label}>트러블슈팅</label><textarea style={styles.textarea} value={data.troubleshooting || ''} onChange={(e) => handleChange('troubleshooting', e)} /></div>
                    <hr style={styles.divider} />
                    <div style={full}><label style={styles.label}>현재 상태</label>
                        <select style={styles.input} value={data.status || ''} onChange={(e) => handleChange('status', e)}><option value="">선택</option><option value="NORMAL">✅ 정상 운영</option><option value="ISSUE">⚠️ 이슈 있음</option><option value="PAUSED">⏸️ 일시 중단</option><option value="HANDOVER">🔄 인계 중</option></select>
                    </div>
                    <div style={styles.formRow}><label style={styles.label}>최근 수행일</label><input type="date" style={styles.input} value={data.lastExecutionDate || ''} onChange={(e) => handleChange('lastExecutionDate', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>차기 수행일</label><input type="date" style={styles.input} value={data.nextExecutionDate || ''} onChange={(e) => handleChange('nextExecutionDate', e)} /></div>
                    <div style={full}><label style={styles.label}>미결 사항</label><textarea style={styles.textarea} value={data.pendingIssues || ''} onChange={(e) => handleChange('pendingIssues', e)} /></div>
                    <hr style={styles.divider} />
                    <div style={full}><label style={styles.label}>관련 문서 링크</label><input style={styles.input} value={data.relatedDocLinks || ''} onChange={(e) => handleChange('relatedDocLinks', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>사용 계정</label><input style={styles.input} value={data.relatedAccount || ''} onChange={(e) => handleChange('relatedAccount', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>관련 담당자</label><input style={styles.input} value={data.relatedContact || ''} onChange={(e) => handleChange('relatedContact', e)} /></div>
                    <div style={full}><label style={styles.label}>참고 레퍼런스</label><input style={styles.input} value={data.referenceLinks || ''} onChange={(e) => handleChange('referenceLinks', e)} /></div>
                </div>
            );
            case 'ASSET': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>품목명</label><input style={styles.input} value={data.itemName || ''} onChange={(e) => handleChange('itemName', e)} /></div>
                    <div style={full}><label style={styles.label}>보관 위치</label><input style={styles.input} value={data.storageLocation || ''} onChange={(e) => handleChange('storageLocation', e)} /></div>
                    <div style={full}><label style={styles.label}>수량 / 상태</label><input style={styles.input} value={data.quantityStatus || ''} onChange={(e) => handleChange('quantityStatus', e)} /></div>
                    <div style={{ ...full, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={data.isReturned || false} onChange={(e) => handleChange('isReturned', e)} />
                        <label style={{ fontSize: '14px' }}>반납 여부</label>
                    </div>
                </div>
            );
            case 'BUDGET': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>비용 항목</label><input style={styles.input} value={data.costItem || ''} onChange={(e) => handleChange('costItem', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>결제일 / 주기</label><input style={styles.input} value={data.paymentSchedule || ''} onChange={(e) => handleChange('paymentSchedule', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>금액 (원)</label><input type="number" style={styles.input} value={data.amount || ''} onChange={(e) => handleChange('amount', e)} /></div>
                    <div style={full}><label style={styles.label}>관련 장부 (링크)</label><input style={styles.input} value={data.ledgerLink || ''} onChange={(e) => handleChange('ledgerLink', e)} /></div>
                </div>
            );
            case 'DOCUMENT_CONTACT': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>문서 제목 / 이름</label><input style={styles.input} value={data.docTitle || ''} onChange={(e) => handleChange('docTitle', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>유형 / 소속</label><input style={styles.input} value={data.docType || ''} onChange={(e) => handleChange('docType', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>보관 형태 / 연락처</label><input style={styles.input} value={data.storageType || ''} onChange={(e) => handleChange('storageType', e)} /></div>
                    <div style={full}><label style={styles.label}>위치 / 역할</label><input style={styles.input} value={data.docLocation || ''} onChange={(e) => handleChange('docLocation', e)} /></div>
                </div>
            );
            case 'RISK': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>리스크 제목</label><input style={styles.input} value={data.riskTitle || ''} onChange={(e) => handleChange('riskTitle', e)} /></div>
                    <div style={full}><label style={styles.label}>리스크 설명</label><textarea style={styles.textarea} value={data.riskDescription || ''} onChange={(e) => handleChange('riskDescription', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>영향도</label>
                        <select style={styles.input} value={data.impact || ''} onChange={(e) => handleChange('impact', e)}><option value="">선택</option><option value="HIGH">🔴 High</option><option value="MEDIUM">🟡 Medium</option><option value="LOW">🟢 Low</option></select>
                    </div>
                    <div style={styles.formRow}><label style={styles.label}>발생 조건</label><input style={styles.input} value={data.triggerCondition || ''} onChange={(e) => handleChange('triggerCondition', e)} /></div>
                    <div style={full}><label style={styles.label}>즉각 대응 방법</label><textarea style={styles.textarea} value={data.immediateResponse || ''} onChange={(e) => handleChange('immediateResponse', e)} /></div>
                    <div style={full}><label style={styles.label}>사전 예방 방법</label><textarea style={styles.textarea} value={data.prevention || ''} onChange={(e) => handleChange('prevention', e)} /></div>
                    <hr style={styles.divider} />
                    <div style={styles.formRow}><label style={styles.label}>관련 업무 (Task)</label><input style={styles.input} value={data.relatedTask || ''} onChange={(e) => handleChange('relatedTask', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>참고 문서</label><input style={styles.input} value={data.referenceDoc || ''} onChange={(e) => handleChange('referenceDoc', e)} /></div>
                    <div style={{ ...full, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={data.isExternalShareable || false} onChange={(e) => handleChange('isExternalShareable', e)} />
                        <label style={{ fontSize: '14px' }}>외부 공유 가능 여부</label>
                    </div>
                    <hr style={styles.divider} />
                    <div style={styles.formRow}><label style={styles.label}>작성자</label><input style={styles.input} value={data.author || ''} onChange={(e) => handleChange('author', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>최종 업데이트일</label><input type="date" style={styles.input} value={data.lastUpdatedDate || ''} onChange={(e) => handleChange('lastUpdatedDate', e)} /></div>
                </div>
            );
            case 'STAKEHOLDER': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>이름 / 직함</label><input style={styles.input} value={data.personName || ''} onChange={(e) => handleChange('personName', e)} /></div>
                    <div style={full}><label style={styles.label}>소속 / 관계</label><input style={styles.input} value={data.organization || ''} onChange={(e) => handleChange('organization', e)} /></div>
                    <div style={full}><label style={styles.label}>연락처</label><input style={styles.input} value={data.contact || ''} onChange={(e) => handleChange('contact', e)} /></div>
                    <div style={full}><label style={styles.label}>담당 역할</label><input style={styles.input} value={data.role || ''} onChange={(e) => handleChange('role', e)} /></div>
                </div>
            );
            case 'DECISION_HISTORY': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>결정 제목</label><input style={styles.input} value={data.decisionTitle || ''} onChange={(e) => handleChange('decisionTitle', e)} /></div>
                    <div style={full}><label style={styles.label}>결정 내용</label><textarea style={styles.textarea} value={data.decisionContent || ''} onChange={(e) => handleChange('decisionContent', e)} /></div>
                    <div style={full}><label style={styles.label}>결정 이유 (Why)</label><textarea style={styles.textarea} value={data.decisionReason || ''} onChange={(e) => handleChange('decisionReason', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>결정 시점</label><input type="date" style={styles.input} value={data.decisionDate || ''} onChange={(e) => handleChange('decisionDate', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>결정자</label><input style={styles.input} value={data.decisionMaker || ''} onChange={(e) => handleChange('decisionMaker', e)} /></div>
                    <hr style={styles.divider} />
                    <div style={full}><label style={styles.label}>대안 검토 여부</label>
                        <select style={styles.input} value={data.hasAlternatives || ''} onChange={(e) => handleChange('hasAlternatives', e)}><option value="">선택</option><option value="YES">있음</option><option value="NO">없음</option></select>
                    </div>
                    <div style={full}><label style={styles.label}>검토된 대안</label><textarea style={styles.textarea} value={data.reviewedAlternatives || ''} onChange={(e) => handleChange('reviewedAlternatives', e)} /></div>
                    <div style={full}><label style={styles.label}>변경 영향</label><textarea style={styles.textarea} value={data.changeImpact || ''} onChange={(e) => handleChange('changeImpact', e)} /></div>
                    <hr style={styles.divider} />
                    <div style={styles.formRow}><label style={styles.label}>관련 업무 (Task)</label><input style={styles.input} value={data.relatedTask || ''} onChange={(e) => handleChange('relatedTask', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>참고 자료</label><input style={styles.input} value={data.referenceUrl || ''} onChange={(e) => handleChange('referenceUrl', e)} /></div>
                    <div style={{ ...full, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={data.isExternalShareable || false} onChange={(e) => handleChange('isExternalShareable', e)} />
                        <label style={{ fontSize: '14px' }}>외부 공유 가능 여부</label>
                    </div>
                    <div style={full}><label style={styles.label}>최종 업데이트일</label><input type="date" style={styles.input} value={data.lastUpdatedDate || ''} onChange={(e) => handleChange('lastUpdatedDate', e)} /></div>
                </div>
            );
            case 'FREE_NOTE': return (
                <div style={styles.formGrid}>
                    <div style={full}><label style={styles.label}>제목</label><input style={styles.input} value={data.noteTitle || ''} onChange={(e) => handleChange('noteTitle', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>분류</label>
                        <select style={styles.input} value={data.category || ''} onChange={(e) => handleChange('category', e)}><option value="">선택</option><option value="TIP">💡 팁/노하우</option><option value="CAUTION">⚠️ 주의사항</option><option value="REFERENCE">📎 참고사항</option><option value="TODO">☑️ 해야 할 일</option><option value="ETC">📝 기타</option></select>
                    </div>
                    <div style={styles.formRow}><label style={styles.label}>중요도</label>
                        <select style={styles.input} value={data.importance || ''} onChange={(e) => handleChange('importance', e)}><option value="">선택</option><option value="HIGH">🔴 높음</option><option value="MEDIUM">🟡 보통</option><option value="LOW">🟢 낮음</option></select>
                    </div>
                    <div style={full}><label style={styles.label}>내용</label><textarea style={styles.textarea} value={data.content || ''} onChange={(e) => handleChange('content', e)} /></div>
                    <hr style={styles.divider} />
                    <div style={full}><label style={styles.label}>관련 업무 (Task)</label><input style={styles.input} value={data.relatedTask || ''} onChange={(e) => handleChange('relatedTask', e)} /></div>
                    <div style={full}><label style={styles.label}>첨부/참고 링크</label><input style={styles.input} value={data.attachmentLink || ''} onChange={(e) => handleChange('attachmentLink', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>작성자</label><input style={styles.input} value={data.author || ''} onChange={(e) => handleChange('author', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>작성일</label><input type="date" style={styles.input} value={data.createdDate || ''} onChange={(e) => handleChange('createdDate', e)} /></div>
                </div>
            );
            default: return <div style={full}><label style={styles.label}>지원되지 않는 모듈입니다.</label></div>;
        }
    };

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <nav style={styles.breadcrumb}>
                    <span style={{ cursor: 'pointer', color: '#3B82F6' }} onClick={() => navigate('/')}>🏠 내 스페이스</span>
                    <span>&gt;</span>
                    <span>{metaInfo.groupName}</span>
                    <span>&gt;</span>
                    <span
                        style={{ cursor: 'pointer', color: '#3B82F6' }}
                        onClick={() => {
                            const spaceId = targetSpaceId || metaInfo.spaceId;
                            if (spaceId) {
                                navigate(`/space/${spaceId}/archive`);
                            } else {
                                navigate(-1);
                            }
                        }}
                    >
                        {metaInfo.workName} (자료실)
                    </span>
                </nav>
                <div style={styles.headerButtons}>
                    <button style={styles.btnSecondary} onClick={() => window.print()}>🖨️ 인쇄</button>
                    {!isViewMode && (
                        <>
                            <button style={styles.btnPrimary} onClick={handleSave}>💾 저장하기</button>
                            <button
                                style={isSaved ? styles.btnPdf : styles.btnPdfDisabled}
                                onClick={handleGeneratePdf}
                                disabled={!isSaved || isGeneratingPdf}
                            >
                                {isGeneratingPdf ? '⏳ 생성 중...' : '📄 PDF 생성'}
                            </button>
                        </>
                    )}
                    {isViewMode && (
                        <>
                            <button style={styles.btnPrimary} onClick={() => navigate(`/handover/edit/${id}`)}>✏️ 수정하기</button>
                            <button
                                style={styles.btnPdf}
                                onClick={handleGeneratePdf}
                                disabled={isGeneratingPdf}
                            >
                                {isGeneratingPdf ? '⏳ 생성 중...' : '📄 PDF 생성'}
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div style={styles.mainContainer}>
                {!isViewMode && (
                    <aside style={styles.sidebar}>
                        <div style={styles.sidebarTitle}>📦 모듈 추가 (클릭)</div>
                        {Object.entries(MODULE_TYPES).map(([type, info]) => (
                            <div key={type} style={styles.moduleItem} onClick={() => addModule(type)}>
                                <span>{info.icon}</span>
                                <span>{info.label}</span>
                            </div>
                        ))}
                    </aside>
                )}

                <main style={{ ...styles.content, marginLeft: isViewMode ? 'auto' : '250px', marginRight: isViewMode ? 'auto' : '0' }}>
                    <div style={styles.documentHeader}>
                        {isViewMode ? (
                            <>
                                <h1 style={styles.documentTitle}>{title || '제목 없음'}</h1>
                                <p style={styles.documentSubtitle}>{role} 업무 인수인계서</p>
                                <div style={styles.documentMeta}>
                                    <span>📅 작성일: {metaInfo.createdAt ? metaInfo.createdAt.split('T')[0] : '-'}</span>
                                    <span>👤 작성자: {metaInfo.userName}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <input style={styles.titleInput} placeholder="인수인계서 제목을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} />
                                <input style={styles.roleInput} placeholder="역할명 (예: 총무, 회장)" value={role} onChange={e => setRole(e.target.value)} />
                            </>
                        )}
                    </div>

                    <div style={styles.modulesContainer}>
                        {modules.length === 0 && !isViewMode && (
                            <div style={styles.emptyState}>좌측 팔레트에서 모듈을 클릭하여 추가하세요.</div>
                        )}

                        {modules.map((module, index) => {
                            const typeInfo = getModuleTypeInfo(module.type);
                            return (
                                <div key={module.id} style={styles.moduleCard}>
                                    <div style={styles.moduleHeader}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '20px' }}>{typeInfo.icon}</span>
                                            <span style={{ fontWeight: '700' }}>{typeInfo.label}</span>
                                        </div>
                                        {!isViewMode && (
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button style={styles.iconBtn} onClick={() => moveModule(index, 'UP')}>▲</button>
                                                <button style={styles.iconBtn} onClick={() => moveModule(index, 'DOWN')}>▼</button>
                                                <button style={styles.iconBtn} onClick={() => toggleModule(module.id)}>{module.collapsed ? '펼치기' : '접기'}</button>
                                                <button style={{ ...styles.iconBtn, color: 'red' }} onClick={() => removeModule(module.id)}>✕</button>
                                            </div>
                                        )}
                                    </div>

                                    {!module.collapsed && (
                                        <div style={styles.moduleBody}>
                                            {isViewMode ? renderViewModule(module) : renderEditModule(module)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh' },
    header: { background: 'white', padding: '15px 30px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px', fontWeight: '500' },
    headerButtons: { display: 'flex', gap: '10px' },
    btnPrimary: { background: '#3B82F6', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    btnSecondary: { background: '#6c757d', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    btnPdf: { background: '#10B981', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    btnPdfDisabled: { background: '#9CA3AF', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '600', opacity: 0.6 },
    mainContainer: { display: 'flex', marginTop: '60px', minHeight: 'calc(100vh - 60px)' },
    sidebar: { width: '250px', background: 'white', borderRight: '1px solid #e0e0e0', padding: '20px', position: 'fixed', top: '60px', left: 0, bottom: 0, overflowY: 'auto' },
    sidebarTitle: { fontSize: '14px', fontWeight: '700', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e0e0e0' },
    moduleItem: { padding: '12px 15px', background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
    content: { flex: 1, padding: '30px', maxWidth: '900px' },
    documentHeader: { background: 'white', padding: '40px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' },
    documentTitle: { fontSize: '32px', fontWeight: '700', color: '#333', marginBottom: '10px', wordWrap: 'break-word', overflowWrap: 'break-word' },
    documentSubtitle: { fontSize: '16px', color: '#666', marginBottom: '20px' },
    documentMeta: { display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '13px', color: '#888' },
    titleInput: { fontSize: '28px', fontWeight: '700', color: '#333', border: 'none', borderBottom: '2px solid transparent', background: 'transparent', textAlign: 'center', width: '100%', padding: '5px', marginBottom: '8px', outline: 'none' },
    roleInput: { fontSize: '14px', color: '#666', border: 'none', borderBottom: '1px solid transparent', background: 'transparent', textAlign: 'center', width: '100%', padding: '5px', outline: 'none' },
    modulesContainer: { minHeight: '200px', paddingBottom: '100px' },
    emptyState: { border: '2px dashed #ccc', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#999', marginTop: '15px' },
    moduleCard: { background: 'white', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' },
    moduleHeader: { padding: '15px 20px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    iconBtn: { background: 'none', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', backgroundColor: '#fff' },
    moduleBody: { padding: '20px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    formRow: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', fontWeight: '600', color: '#666' },
    input: { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: '#fff' },
    textarea: { padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical' },
    divider: { border: 'none', borderTop: '1px dashed #ccc', margin: '15px 0', gridColumn: 'span 2' },

    viewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
    viewRow: { marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' },
    viewLabel: { fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '5px' },
    viewValue: { fontSize: '15px', color: '#333' },
    preText: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, padding: '10px', background: '#f8f9fa', borderRadius: '6px', fontSize: '14px', lineHeight: '1.6' }
};