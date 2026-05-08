import { useState, useEffect, useRef } from 'react';
import api from '../../api/api';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const MODULE_TYPES = {
    'HEADING': { icon: '📌', label: '섹션 제목' },
    'BASIC_INFO': { icon: '📋', label: '기본 정보' },
    'ACCOUNT_ACCESS': { icon: '🔐', label: '계정 정보' },
    'TASK': { icon: '📝', label: '업무/과업' },
    'RELATED_INFO': { icon: '🔗', label: '관련 정보 링크' },
    'ASSET': { icon: '📦', label: '물리적 자산' },
    'BUDGET': { icon: '💰', label: '예산' },
    'EXPENSE': { icon: '💳', label: '비용' },
    'DOCUMENT_CONTACT': { icon: '📁', label: '문서/연락망' },
    'RISK': { icon: '⚠️', label: '리스크' },
    'STAKEHOLDER': { icon: '👥', label: '이해관계자' },
    'DECISION_HISTORY': { icon: '📜', label: '의사결정 히스토리' },
    'FREE_NOTE': { icon: '✏️', label: '자유 기록' }
};

const MODULE_COLORS = {
    'HEADING': '#6366F1',
    'BASIC_INFO': '#F59E0B',
    'ACCOUNT_ACCESS': '#EF4444',
    'TASK': '#3B82F6',
    'RELATED_INFO': '#8B5CF6',
    'ASSET': '#10B981',
    'BUDGET': '#F59E0B',
    'EXPENSE': '#EC4899',
    'DOCUMENT_CONTACT': '#6366F1',
    'RISK': '#EF4444',
    'STAKEHOLDER': '#06B6D4',
    'DECISION_HISTORY': '#8B5CF6',
    'FREE_NOTE': '#6B7280'
};

export default function HandoverDocumentView({ handoverId, onClose }) {
    const [isLoading, setIsLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [modules, setModules] = useState([]);
    const [metaInfo, setMetaInfo] = useState({});
    const [policy, setPolicy] = useState(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const contentRef = useRef(null);

    const pdfAlreadyGenerated = policy?.pdfGeneratedAt != null;
    const canDownloadPdf = policy?.canGeneratePdf === true || pdfAlreadyGenerated;

    useEffect(() => {
        const loadHandover = async () => {
            if (!handoverId) return;
            setIsLoading(true);
            try {
                const [docRes, policyRes] = await Promise.all([
                    api.get('/handover', { params: { id: handoverId } }),
                    api.get('/handover/policy', { params: { handoverId } })
                ]);

                const data = docRes.data;
                setTitle(data.title || '');
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
                    } catch (e) {
                        console.error('JSON parsing error', e);
                    }
                }

                setPolicy(policyRes.data);
            } catch (error) {
                console.error('Failed to load handover:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadHandover();
    }, [handoverId]);

    const handleGeneratePdf = async () => {
        if (!contentRef.current || isGeneratingPdf) return;
        setIsGeneratingPdf(true);

        try {
            // Hide attachment sections before capturing
            const attachmentSections = contentRef.current.querySelectorAll('[data-exclude-pdf="true"]');
            attachmentSections.forEach(el => el.style.display = 'none');

            // Temporarily adjust styles for better PDF output
            const element = contentRef.current;
            const originalPadding = element.style.padding;
            element.style.padding = '20px';

            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: 800
            });

            // Restore original styles
            element.style.padding = originalPadding;

            // Restore attachment sections
            attachmentSections.forEach(el => el.style.display = '');

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const marginX = 15;
            const marginY = 15;
            const usableWidth = pdfWidth - (marginX * 2);
            const usableHeight = pdfHeight - (marginY * 2);

            // Scale image to fit page width with margins
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const scaledWidth = usableWidth;
            const scaledHeight = (imgHeight * scaledWidth) / imgWidth;

            // Calculate total pages needed
            const totalPages = Math.ceil(scaledHeight / usableHeight);

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) {
                    pdf.addPage();
                }

                // Calculate the y position for this page slice
                const srcY = (page * usableHeight * imgWidth) / scaledWidth;
                const srcHeight = Math.min(
                    (usableHeight * imgWidth) / scaledWidth,
                    imgHeight - srcY
                );

                // Create a canvas for this page slice
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = imgWidth;
                pageCanvas.height = srcHeight;
                const ctx = pageCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, srcY, imgWidth, srcHeight, 0, 0, imgWidth, srcHeight);

                const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
                const pageScaledHeight = (srcHeight * scaledWidth) / imgWidth;

                pdf.addImage(pageImgData, 'JPEG', marginX, marginY, scaledWidth, pageScaledHeight);

                // Add page number
                pdf.setFontSize(9);
                pdf.setTextColor(150);
                pdf.text(`${page + 1} / ${totalPages}`, pdfWidth / 2, pdfHeight - 8, { align: 'center' });
            }

            const dateStr = metaInfo.createdAt ? metaInfo.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
            const fileName = `${title || '인수인계서'}_${dateStr}.pdf`;

            // If PDF not already generated, save to server first
            if (!pdfAlreadyGenerated) {
                const pdfBlob = pdf.output('blob');
                const formData = new FormData();
                formData.append('pdfFile', pdfBlob, fileName);
                formData.append('handoverId', handoverId);
                formData.append('spaceId', metaInfo.spaceId);

                await api.post('/handover/save', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                // Refresh policy to reflect pdfGeneratedAt
                const policyRes = await api.get('/handover/policy', { params: { handoverId } });
                setPolicy(policyRes.data);

                alert('PDF가 생성되어 저장되었습니다.');
            }

            // Download the PDF locally
            pdf.save(fileName);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('PDF 생성에 실패했습니다: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const getFileIcon = (fileType) => {
        const icons = { 'pdf': '📄', 'image': '🖼️', 'doc': '📝', 'spreadsheet': '📊', 'presentation': '📽️', 'archive': '📦' };
        return icons[fileType] || '📎';
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleFilePreview = async (fileId) => {
        try {
            const response = await api.get(`/file/${fileId}?mode=view`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('File preview error:', error);
            alert('파일을 열 수 없습니다.');
        }
    };

    const renderModuleContent = (module) => {
        const data = module.data || {};
        const type = module.type;

        if (type === 'HEADING') {
            return <h2 style={styles.headingText}>{data.headingText || '섹션 제목'}</h2>;
        }

        // Render field-based modules
        const fields = [];

        if (type === 'BASIC_INFO') {
            if (data.handoverName) fields.push({ label: '인계자 성명', value: data.handoverName });
            if (data.affiliation) fields.push({ label: '소속 / 직급', value: data.affiliation });
            if (data.startDate) fields.push({ label: '인계 시작일', value: data.startDate });
            if (data.endDate) fields.push({ label: '인계 종료일', value: data.endDate });
            if (data.emergencyContact) fields.push({ label: '비상 연락처', value: data.emergencyContact });
            if (data.receiverName) fields.push({ label: '인수자 성명', value: data.receiverName });
        } else if (type === 'ACCOUNT_ACCESS') {
            if (data.systemName) fields.push({ label: '시스템명', value: data.systemName });
            if (data.systemUrl) fields.push({ label: '접속 URL', value: data.systemUrl });
            if (data.accountId) fields.push({ label: '계정 ID', value: data.accountId });
            if (data.accountPassword) fields.push({ label: '비밀번호', value: '••••••••' });
            if (data.accountNotes) fields.push({ label: '비고', value: data.accountNotes });
        } else if (type === 'TASK') {
            // Basic info
            if (data.taskName) fields.push({ label: '업무명', value: data.taskName, fullWidth: true });
            if (data.taskType) fields.push({ label: '업무 유형', value: data.taskType });
            if (data.importance) fields.push({ label: '중요도', value: data.importance });
            if (data.schedule) fields.push({ label: '수행 주기/시점', value: data.schedule });
            if (data.duration) fields.push({ label: '소요 시간', value: data.duration });
            // Task detail
            if (data.prerequisiteTask) fields.push({ label: '선행 업무', value: data.prerequisiteTask, fullWidth: true });
            if (data.requiredTools) fields.push({ label: '필요 도구/환경', value: data.requiredTools, fullWidth: true });
            if (data.procedure) fields.push({ label: '상세 절차', value: data.procedure, fullWidth: true });
            if (data.output) fields.push({ label: '산출물', value: data.output, fullWidth: true });
            if (data.verificationCriteria) fields.push({ label: '검증 기준', value: data.verificationCriteria, fullWidth: true });
            if (data.troubleshooting) fields.push({ label: '트러블슈팅', value: data.troubleshooting, fullWidth: true });
            // Current status
            if (data.status) fields.push({ label: '상태', value: data.status });
            if (data.lastExecutionDate) fields.push({ label: '최근 수행일', value: data.lastExecutionDate });
            if (data.nextExecutionDate) fields.push({ label: '차기 수행일', value: data.nextExecutionDate });
            if (data.pendingIssues) fields.push({ label: '미결 사항', value: data.pendingIssues, fullWidth: true });
        } else if (type === 'RELATED_INFO') {
            if (data.relatedDocLinks) fields.push({ label: '문서 링크', value: data.relatedDocLinks, fullWidth: true });
            if (data.relatedAccount) fields.push({ label: '사용 계정', value: data.relatedAccount });
            if (data.relatedContact) fields.push({ label: '관련 담당자', value: data.relatedContact });
            if (data.referenceLinks) fields.push({ label: '참고 레퍼런스', value: data.referenceLinks, fullWidth: true });
        } else if (type === 'ASSET') {
            if (data.itemName) fields.push({ label: '품목명', value: data.itemName, fullWidth: true });
            if (data.storageLocation) fields.push({ label: '보관 위치', value: data.storageLocation, fullWidth: true });
            if (data.quantityStatus) fields.push({ label: '수량 / 상태', value: data.quantityStatus, fullWidth: true });
            if (data.lendingStatus) fields.push({ label: '대여 여부', value: data.lendingStatus });
            if (data.ownershipStatus) fields.push({ label: '관리/소유 구분', value: data.ownershipStatus });
            if (data.assetManager) fields.push({ label: '담당자 / 반납처', value: data.assetManager, fullWidth: true });
        } else if (type === 'BUDGET') {
            if (data.budgetName) fields.push({ label: '예산명', value: data.budgetName, fullWidth: true });
            if (data.budgetPeriod) fields.push({ label: '예산 기간', value: data.budgetPeriod });
            if (data.totalBudget) fields.push({ label: '총 예산', value: data.totalBudget + '원' });
            if (data.usedBudget) fields.push({ label: '사용 금액', value: data.usedBudget + '원' });
            if (data.remainingBudget) fields.push({ label: '잔여 예산', value: data.remainingBudget + '원' });
            if (data.ledgerLink) fields.push({ label: '관련 장부', value: data.ledgerLink, fullWidth: true });
            if (data.budgetNotes) fields.push({ label: '예산 관리 메모', value: data.budgetNotes, fullWidth: true });
        } else if (type === 'EXPENSE') {
            if (data.costItem) fields.push({ label: '비용 항목', value: data.costItem, fullWidth: true });
            if (data.paymentSchedule) fields.push({ label: '결제일 / 주기', value: data.paymentSchedule });
            if (data.amount) fields.push({ label: '금액', value: data.amount + '원' });
            if (data.paymentMethod) fields.push({ label: '결제 수단', value: data.paymentMethod });
            if (data.expenseStatus) fields.push({ label: '승인/정산 상태', value: data.expenseStatus });
            if (data.receiptLink) fields.push({ label: '증빙 자료 링크', value: data.receiptLink, fullWidth: true });
            if (data.ledgerLink) fields.push({ label: '관련 장부', value: data.ledgerLink, fullWidth: true });
        } else if (type === 'DOCUMENT_CONTACT') {
            if (data.docTitle) fields.push({ label: '문서 제목 / 이름', value: data.docTitle, fullWidth: true });
            if (data.docType) fields.push({ label: '유형 / 소속', value: data.docType });
            if (data.storageType) fields.push({ label: '보관 형태 / 연락처', value: data.storageType });
            if (data.docLocation) fields.push({ label: '위치 / 역할', value: data.docLocation, fullWidth: true });
        } else if (type === 'RISK') {
            if (data.riskTitle) fields.push({ label: '리스크 제목', value: data.riskTitle, fullWidth: true });
            if (data.riskDescription) fields.push({ label: '리스크 설명', value: data.riskDescription, fullWidth: true });
            if (data.impact) fields.push({ label: '영향도', value: data.impact });
            if (data.triggerCondition) fields.push({ label: '발생 조건', value: data.triggerCondition });
            if (data.immediateResponse) fields.push({ label: '즉각 대응 방법', value: data.immediateResponse, fullWidth: true });
            if (data.prevention) fields.push({ label: '사전 예방 방법', value: data.prevention, fullWidth: true });
            if (data.relatedTask) fields.push({ label: '관련 업무', value: data.relatedTask });
            if (data.referenceDoc) fields.push({ label: '참고 문서', value: data.referenceDoc });
            if (data.externalShareStatus) fields.push({ label: '공유 범위', value: data.externalShareStatus });
            if (data.author) fields.push({ label: '작성자', value: data.author });
            if (data.lastUpdatedDate) fields.push({ label: '최종 업데이트일', value: data.lastUpdatedDate });
        } else if (type === 'STAKEHOLDER') {
            if (data.personName) fields.push({ label: '이름 / 직함', value: data.personName, fullWidth: true });
            if (data.organization) fields.push({ label: '소속 / 관계', value: data.organization, fullWidth: true });
            if (data.contact) fields.push({ label: '연락처', value: data.contact, fullWidth: true });
            if (data.role) fields.push({ label: '담당 역할', value: data.role, fullWidth: true });
        } else if (type === 'DECISION_HISTORY') {
            if (data.decisionTitle) fields.push({ label: '결정 제목', value: data.decisionTitle, fullWidth: true });
            if (data.decisionContent) fields.push({ label: '결정 내용', value: data.decisionContent, fullWidth: true });
            if (data.decisionReason) fields.push({ label: '결정 이유', value: data.decisionReason, fullWidth: true });
            if (data.decisionDate) fields.push({ label: '결정 시점', value: data.decisionDate });
            if (data.decisionMaker) fields.push({ label: '결정자', value: data.decisionMaker });
            if (data.hasAlternatives) fields.push({ label: '대안 검토 여부', value: data.hasAlternatives });
            if (data.reviewedAlternatives) fields.push({ label: '검토된 대안', value: data.reviewedAlternatives, fullWidth: true });
            if (data.changeImpact) fields.push({ label: '변경 영향', value: data.changeImpact, fullWidth: true });
            if (data.relatedTask) fields.push({ label: '관련 업무', value: data.relatedTask });
            if (data.referenceUrl) fields.push({ label: '참고 자료', value: data.referenceUrl });
            if (data.externalShareStatus) fields.push({ label: '공유 범위', value: data.externalShareStatus });
            if (data.lastUpdatedDate) fields.push({ label: '최종 업데이트일', value: data.lastUpdatedDate });
        } else if (type === 'FREE_NOTE') {
            if (data.noteTitle) fields.push({ label: '제목', value: data.noteTitle, fullWidth: true });
            if (data.category) fields.push({ label: '분류', value: data.category });
            if (data.importance) fields.push({ label: '중요도', value: data.importance });
            if (data.content) fields.push({ label: '내용', value: data.content, fullWidth: true });
            if (data.relatedTask) fields.push({ label: '관련 업무', value: data.relatedTask, fullWidth: true });
            if (data.attachmentLink) fields.push({ label: '첨부/참고 링크', value: data.attachmentLink, fullWidth: true });
            if (data.author) fields.push({ label: '작성자', value: data.author });
            if (data.createdDate) fields.push({ label: '작성일', value: data.createdDate });
        }

        if (fields.length === 0) {
            return <div style={styles.emptyModule}>내용 없음</div>;
        }

        return (
            <div style={styles.fieldsGrid}>
                {fields.map((field, idx) => (
                    <div key={idx} style={field.fullWidth ? styles.fieldRowFull : styles.fieldRow}>
                        <div style={styles.fieldLabel}>{field.label}</div>
                        <div style={styles.fieldValue}>{field.value || '-'}</div>
                    </div>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <div style={styles.loading}>로딩 중...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <span style={styles.pdfIcon}>📄</span>
                        <div>
                            <h2 style={styles.headerTitle}>{title || '인수인계서'}</h2>
                            <p style={styles.headerSub}>작성일: {metaInfo.createdAt?.split('T')[0] || '-'}</p>
                        </div>
                    </div>
                    <div style={styles.headerRight}>
                        <button
                            style={canDownloadPdf ? styles.downloadBtn : styles.downloadBtnDisabled}
                            onClick={handleGeneratePdf}
                            disabled={!canDownloadPdf || isGeneratingPdf}
                        >
                            {isGeneratingPdf ? '생성 중...' : '⬇ 다운로드'}
                        </button>
                        <button style={styles.closeBtn} onClick={onClose}>✕</button>
                    </div>
                </div>

                <div style={styles.content}>
                    <div ref={contentRef} style={styles.documentArea}>
                        <div style={styles.documentHeader}>
                            <h1 style={styles.documentTitle}>{title || '인수인계서'}</h1>
                            <div style={styles.documentMeta}>
                                <span>작성일: {metaInfo.createdAt?.split('T')[0] || '-'}</span>
                                <span>작성자: {metaInfo.userName || '-'}</span>
                            </div>
                        </div>

                        <div style={styles.modulesArea}>
                            {modules.map((module, idx) => {
                                const typeInfo = MODULE_TYPES[module.type] || { icon: '📋', label: module.type };
                                const color = MODULE_COLORS[module.type] || '#6B7280';

                                if (module.type === 'HEADING') {
                                    return (
                                        <div key={module.id || idx} style={styles.headingModule}>
                                            {renderModuleContent(module)}
                                        </div>
                                    );
                                }

                                return (
                                    <div key={module.id || idx} style={styles.moduleWrapper}>
                                        <div style={{ ...styles.moduleCard, borderLeft: `4px solid ${color}` }}>
                                            <div style={styles.moduleHeader}>
                                                <span style={styles.moduleIcon}>{typeInfo.icon}</span>
                                                <span style={styles.moduleLabel}>{typeInfo.label}</span>
                                            </div>
                                            <div style={styles.moduleContentRow}>
                                                <div style={styles.moduleBody}>
                                                    {renderModuleContent(module)}
                                                </div>

                                                {/* Attachments - visible when viewing, hidden in PDF */}
                                                {module.attachedFiles && module.attachedFiles.length > 0 && (
                                                    <div style={styles.attachmentSidebar} data-exclude-pdf="true">
                                                        <div style={styles.attachmentHeader}>
                                                            <span>📎 첨부 파일</span>
                                                            <span style={styles.attachmentCount}>{module.attachedFiles.length}</span>
                                                        </div>
                                                        <div style={styles.attachmentList}>
                                                            {module.attachedFiles.map(file => (
                                                                <div
                                                                    key={file.fileId}
                                                                    style={styles.attachmentItem}
                                                                    onClick={() => handleFilePreview(file.fileId)}
                                                                    title="클릭하여 미리보기"
                                                                >
                                                                    <span style={styles.fileIcon}>📄</span>
                                                                    <div style={styles.fileInfo}>
                                                                        <span style={styles.fileName}>{file.fileName}</span>
                                                                        <span style={styles.fileSize}>{formatFileSize(file.size)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    pdfIcon: {
        fontSize: '24px'
    },
    headerTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        margin: 0
    },
    headerSub: {
        fontSize: '13px',
        color: '#6b7280',
        margin: '4px 0 0 0'
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    downloadBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 20px',
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    downloadBtnDisabled: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 20px',
        backgroundColor: '#9ca3af',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'not-allowed',
        opacity: 0.7
    },
    closeBtn: {
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '18px',
        color: '#6b7280',
        cursor: 'pointer'
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#f3f4f6'
    },
    loading: {
        padding: '60px',
        textAlign: 'center',
        color: '#6b7280'
    },
    documentArea: {
        padding: '30px',
        maxWidth: '750px',
        margin: '0 auto',
        backgroundColor: '#ffffff'
    },
    documentHeader: {
        backgroundColor: '#fff',
        padding: '40px 32px',
        borderRadius: '0',
        textAlign: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb'
    },
    documentTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#111827',
        margin: '0 0 12px 0'
    },
    documentMeta: {
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        fontSize: '14px',
        color: '#6b7280'
    },
    modulesArea: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    headingModule: {
        backgroundColor: '#f3f0ff',
        padding: '18px 24px',
        borderRadius: '4px',
        borderLeft: '4px solid #6366f1',
        marginTop: '10px'
    },
    headingText: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#4338ca',
        margin: 0
    },
    moduleWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0'
    },
    moduleCard: {
        backgroundColor: '#fff',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
    },
    moduleHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 18px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
    },
    moduleIcon: {
        fontSize: '16px'
    },
    moduleLabel: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151'
    },
    moduleContentRow: {
        display: 'flex',
        gap: '16px'
    },
    moduleBody: {
        flex: 1,
        padding: '20px'
    },
    fieldsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px 24px'
    },
    fieldRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f3f4f6'
    },
    fieldRowFull: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        gridColumn: 'span 2',
        paddingBottom: '12px',
        borderBottom: '1px solid #f3f4f6'
    },
    fieldLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    fieldValue: {
        fontSize: '14px',
        color: '#111827',
        whiteSpace: 'pre-wrap',
        lineHeight: '1.5'
    },
    emptyModule: {
        color: '#9ca3af',
        fontStyle: 'italic'
    },
    attachmentSidebar: {
        width: '180px',
        flexShrink: 0,
        padding: '12px',
        borderLeft: '1px solid #e5e7eb',
        backgroundColor: '#fafafa'
    },
    attachmentHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '12px'
    },
    attachmentCount: {
        backgroundColor: '#e5e7eb',
        color: '#374151',
        fontSize: '11px',
        fontWeight: '600',
        padding: '2px 8px',
        borderRadius: '10px'
    },
    attachmentList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    attachmentItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    fileIcon: {
        fontSize: '20px',
        marginTop: '2px'
    },
    fileInfo: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    fileName: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    fileSize: {
        fontSize: '11px',
        color: '#9ca3af'
    }
};
