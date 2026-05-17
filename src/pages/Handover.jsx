import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../api/api';
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

const REQUIRED_FIELDS = {
    BASIC_INFO: [['handoverName', '인계자 성명'], ['affiliation', '소속 / 직급'], ['periodStart', '인계 시작일'], ['periodEnd', '인계 종료일'], ['emergencyContact', '비상 연락처'], ['receiverName', '인수자 성명']],
    ACCOUNT_ACCESS: [['systemName', '시스템 / 사이트명'], ['accessUrl', '접속 URL'], ['accountId', 'ID / 계정명'], ['password', '비밀번호'], ['permissionLevel', '권한 등급']],
    TASK: [['taskName', '업무명'], ['taskType', '업무 유형'], ['importance', '중요도'], ['schedule', '수행 주기/시점'], ['duration', '소요 시간'], ['requiredTools', '필요 도구/환경'], ['procedure', '상세 절차'], ['output', '산출물'], ['status', '상태']],
    RELATED_INFO: [['relatedDocLinks', '문서 링크'], ['relatedAccount', '사용 계정'], ['relatedContact', '관련 담당자']],
    ASSET: [['itemName', '품목명'], ['storageLocation', '보관 위치'], ['quantityStatus', '수량 / 상태'], ['lendingStatus', '대여 여부'], ['ownershipStatus', '관리/소유 구분']],
    BUDGET: [['budgetName', '예산명'], ['budgetPeriod', '예산 기간'], ['totalBudget', '총 예산'], ['usedBudget', '사용 금액'], ['remainingBudget', '잔여 예산']],
    EXPENSE: [['costItem', '비용 항목'], ['paymentSchedule', '결제일 / 주기'], ['amount', '금액'], ['paymentMethod', '결제 수단'], ['expenseStatus', '승인/정산 상태']],
    DOCUMENT_CONTACT: [['docTitle', '문서 제목 / 이름'], ['docType', '유형 / 소속'], ['storageType', '보관 형태 / 연락처'], ['docLocation', '위치 / 역할']],
    RISK: [['riskTitle', '리스크 제목'], ['riskDescription', '리스크 설명'], ['impact', '영향도'], ['triggerCondition', '발생 조건'], ['immediateResponse', '즉각 대응 방법'], ['prevention', '사전 예방 방법'], ['externalShareStatus', '공유 범위']],
    STAKEHOLDER: [['personName', '이름 / 직함'], ['organization', '소속 / 관계'], ['contact', '연락처'], ['role', '담당 역할']],
    DECISION_HISTORY: [['decisionTitle', '결정 제목'], ['decisionContent', '결정 내용'], ['decisionReason', '결정 이유'], ['decisionDate', '결정 시점'], ['decisionMaker', '결정자'], ['hasAlternatives', '대안 검토 여부'], ['changeImpact', '변경 영향'], ['externalShareStatus', '공유 범위']],
    FREE_NOTE: [['noteTitle', '제목'], ['category', '분류'], ['importance', '중요도'], ['content', '내용'], ['author', '작성자'], ['createdDate', '작성일']]
};

export default function Handover() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    // Extract target space ID from URL query params
    const searchParams = new URLSearchParams(location.search);
    const targetSpaceId = searchParams.get('spaceId');

    const [handoverPolicy, setHandoverPolicy] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Create mode: no id and on create path
    const isCreateMode = !id && location.pathname.includes('/create');
    const canEdit = isCreateMode ? (handoverPolicy?.canEdit ?? true) : Boolean(handoverPolicy?.canEdit);

    const [title, setTitle] = useState('');
    const [modules, setModules] = useState([]);

    const [metaInfo, setMetaInfo] = useState({ groupId: null, groupName: '그룹', workName: '스페이스', userName: '-', createdAt: null, spaceId: null });
    const [userSpaceId, setUserSpaceId] = useState(null);

    // PDF generation related state
    const [isSaved, setIsSaved] = useState(!!id);
    const [savedHandoverId, setSavedHandoverId] = useState(id ? parseInt(id) : null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const canGeneratePdf = Boolean((savedHandoverId || id) && handoverPolicy?.canGeneratePdf);

    // Drag and drop state
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [draggedNewType, setDraggedNewType] = useState(null);
    const [isDraggingOverContainer, setIsDraggingOverContainer] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // File attachment state
    const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);
    const [activeModuleIdForFiles, setActiveModuleIdForFiles] = useState(null);
    const [archiveFiles, setArchiveFiles] = useState([]);
    const [archiveFolders, setArchiveFolders] = useState([]);
    const [currentArchiveFolderId, setCurrentArchiveFolderId] = useState(null);
    const [archiveFolderStack, setArchiveFolderStack] = useState([{ id: null, name: 'Home' }]);
    const [selectedArchiveFiles, setSelectedArchiveFiles] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                if (id) {
                    // Load existing document
                    const res = await api.get('/handover', { params: { id } });
                    const data = res.data;

                    setSavedHandoverId(parseInt(id));
                    setTitle(data.title || '');
                    setMetaInfo({
                        groupId: data.groupId,
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
                        } catch (e) { console.error('JSON parsing error', e); }
                    }

                    const policyRes = await api.get('/handover/policy', { params: { handoverId: id } });
                    setHandoverPolicy(policyRes.data);
                } else {
                    // Create mode: fetch user space info
                    const res = await api.get('/userSpace/list', { params: { deleted: false } });

                    const matchingSpace = targetSpaceId
                        ? res.data.find(item => item.spaceId === parseInt(targetSpaceId))
                        : null;

                    if (matchingSpace) {
                        setUserSpaceId(matchingSpace.id);
                        setMetaInfo(prev => ({ ...prev, groupId: matchingSpace.groupId, groupName: matchingSpace.groupName, workName: matchingSpace.workName, spaceId: matchingSpace.spaceId }));
                        const policyRes = await api.get('/handover/policy', { params: { spaceId: matchingSpace.spaceId } });
                        setHandoverPolicy(policyRes.data);
                    } else if (res.data.length > 0) {
                        setUserSpaceId(res.data[0].id);
                        setMetaInfo(prev => ({ ...prev, groupId: res.data[0].groupId, groupName: res.data[0].groupName, workName: res.data[0].workName, spaceId: res.data[0].spaceId }));
                        const policyRes = await api.get('/handover/policy', { params: { spaceId: res.data[0].spaceId } });
                        setHandoverPolicy(policyRes.data);
                    }
                }
            } catch (error) {
                console.error(error);
                alert('Failed to load the document.');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id, targetSpaceId]);

    // Auto-generate default title for new documents
    useEffect(() => {
        if (!id && metaInfo.groupName !== '그룹' && metaInfo.workName !== '스페이스' && !title) {
            const today = new Date().toISOString().split('T')[0];
            const defaultTitle = `${metaInfo.groupName}_${metaInfo.workName}_인수인계서_${today}`;
            setTitle(defaultTitle);
        }
    }, [id, metaInfo.groupName, metaInfo.workName]);

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

    // File attachment helpers
    const getFileIcon = (fileType) => {
        const icons = {
            'PDF': '📄',
            'IMAGE': '🖼️',
            'DOCUMENT': '📝',
            'SPREADSHEET': '📊',
            'ARCHIVE': '📦',
            'DEFAULT': '📎'
        };
        return icons[fileType] || icons.DEFAULT;
    };

    const getFileTypeFromName = (fileName) => {
        if (!fileName) return 'DEFAULT';
        const ext = fileName.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return 'PDF';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'IMAGE';
        if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'DOCUMENT';
        if (['xls', 'xlsx', 'csv'].includes(ext)) return 'SPREADSHEET';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'ARCHIVE';
        return 'DEFAULT';
    };

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleOpenFileSelector = (moduleId) => {
        setActiveModuleIdForFiles(moduleId);
        setSelectedArchiveFiles([]);
        setCurrentArchiveFolderId(null);
        setArchiveFolderStack([{ id: null, name: 'Home' }]);
        setIsFileSelectorOpen(true);
        fetchArchiveFiles(null);
    };

    const fetchArchiveFiles = async (folderId) => {
        try {
            const spaceId = targetSpaceId || metaInfo.spaceId;
            if (!spaceId) return;
            const res = await api.get('/file/list', { params: { spaceId, folderId } });
            const items = res.data || [];
            setArchiveFolders(items.filter(f => f.type === 'FOLDER'));
            setArchiveFiles(items.filter(f => f.type === 'FILE'));
        } catch (error) {
            console.error('Archive files fetch error:', error);
        }
    };

    const enterArchiveFolder = (folderId, folderName) => {
        setCurrentArchiveFolderId(folderId);
        setArchiveFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
        fetchArchiveFiles(folderId);
    };

    const goToArchiveFolder = (index) => {
        const newStack = archiveFolderStack.slice(0, index + 1);
        setArchiveFolderStack(newStack);
        const folderId = newStack[newStack.length - 1].id;
        setCurrentArchiveFolderId(folderId);
        fetchArchiveFiles(folderId);
    };

    const toggleArchiveFileSelection = (file) => {
        const module = modules.find(m => m.id === activeModuleIdForFiles);
        const existingIds = (module?.attachedFiles || []).map(f => f.fileId);
        if (existingIds.includes(file.id)) return;

        setSelectedArchiveFiles(prev =>
            prev.find(f => f.id === file.id)
                ? prev.filter(f => f.id !== file.id)
                : [...prev, file]
        );
    };

    const handleConfirmFileSelection = () => {
        const filesToAttach = selectedArchiveFiles.map(f => ({
            fileId: f.id,
            fileName: f.name || f.originalFileName,
            fileType: getFileTypeFromName(f.name || f.originalFileName),
            size: f.size
        }));

        setModules(modules.map(m => {
            if (m.id === activeModuleIdForFiles) {
                const existingFiles = m.attachedFiles || [];
                return {
                    ...m,
                    attachedFiles: [...existingFiles, ...filesToAttach]
                };
            }
            return m;
        }));

        setIsFileSelectorOpen(false);
        setActiveModuleIdForFiles(null);
        setSelectedArchiveFiles([]);
    };

    const handleRemoveFile = (moduleId, fileId) => {
        setModules(modules.map(m => {
            if (m.id === moduleId) {
                return {
                    ...m,
                    attachedFiles: (m.attachedFiles || []).filter(f => f.fileId !== fileId)
                };
            }
            return m;
        }));
    };

    const handleFileClick = async (fileId) => {
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

    // Drag and drop handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Sidebar drag handlers for creating new modules
    const handleSidebarDragStart = (e, type) => {
        setDraggedNewType(type);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', type);
    };

    const handleSidebarDragEnd = () => {
        setDraggedNewType(null);
        setIsDraggingOverContainer(false);
        setDragOverIndex(null);
    };

    const handleContainerDragOver = (e) => {
        e.preventDefault();
        if (draggedNewType) {
            e.dataTransfer.dropEffect = 'copy';
            setIsDraggingOverContainer(true);
        }
    };

    const handleContainerDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDraggingOverContainer(false);
        }
    };

    const handleContainerDrop = (e) => {
        e.preventDefault();
        if (draggedNewType) {
            addModule(draggedNewType);
            setDraggedNewType(null);
            setIsDraggingOverContainer(false);
        }
    };

    const handleDropOnModule = (e, dropIndex) => {
        e.preventDefault();
        if (draggedNewType) {
            // Insert new module at specific position
            const newModule = {
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                type: draggedNewType,
                data: {},
                collapsed: false
            };
            const newModules = [...modules];
            newModules.splice(dropIndex, 0, newModule);
            setModules(newModules);
            setDraggedNewType(null);
            setDragOverIndex(null);
        } else if (draggedIndex !== null && draggedIndex !== dropIndex) {
            // Reorder existing modules
            const newModules = [...modules];
            const [draggedModule] = newModules.splice(draggedIndex, 1);
            newModules.splice(dropIndex, 0, draggedModule);
            setModules(newModules);
            setDraggedIndex(null);
            setDragOverIndex(null);
        }
    };

    const getValidationKey = (moduleId, field) => `${moduleId}.${field}`;

    const getRequiredFieldValue = (module, field) => {
        if (module.type === 'ASSET' && field === 'lendingStatus' && module.data?.isReturned) {
            return 'RETURNED';
        }
        if (module.type === 'BUDGET' && field === 'budgetName') {
            return module.data?.budgetName || module.data?.costItem;
        }
        if (module.type === 'BUDGET' && field === 'budgetPeriod') {
            return module.data?.budgetPeriod || module.data?.paymentSchedule;
        }
        if ((module.type === 'RISK' || module.type === 'DECISION_HISTORY') && field === 'externalShareStatus' && module.data?.isExternalShareable) {
            return 'PUBLIC';
        }
        return module.data?.[field];
    };

    const updateModuleData = (moduleId, field, value) => {
        setModules(modules.map(m => m.id === moduleId ? { ...m, data: { ...m.data, [field]: value } } : m));
        const key = getValidationKey(moduleId, field);
        if (validationErrors[key] && String(value ?? '').trim()) {
            setValidationErrors(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const getModuleValidationResult = () => {
        const contentModules = modules.filter(module => module.type !== 'HEADING');
        if (contentModules.length === 0) {
            return {
                errors: { modules: '최소 1개 이상의 모듈을 추가해주세요.' },
                firstError: { message: '최소 1개 이상의 모듈을 추가해주세요.' }
            };
        }

        const errors = {};
        let firstError = null;

        for (const module of modules) {
            const fields = REQUIRED_FIELDS[module.type] || [];
            const typeLabel = getModuleTypeInfo(module.type).label;
            for (const [field, label] of fields) {
                const value = getRequiredFieldValue(module, field);
                if (value === undefined || value === null || String(value).trim() === '') {
                    const key = getValidationKey(module.id, field);
                    const message = `${typeLabel} 모듈의 ${label}을(를) 입력해주세요.`;
                    errors[key] = message;
                    if (!firstError) {
                        firstError = { key, moduleId: module.id, field, message };
                    }
                }
            }
        }

        return { errors, firstError };
    };

    const handleSave = async () => {
        if (!canEdit) {
            alert(handoverPolicy?.lockReason || '현재 상태에서는 인수인계서를 수정할 수 없습니다.');
            return;
        }
        if (!title.trim()) { alert('인수인계서 제목을 입력해주세요.'); return; }
        const validationResult = getModuleValidationResult();
        setValidationErrors(validationResult.errors);
        if (validationResult.firstError) {
            if (validationResult.firstError.moduleId) {
                setModules(prev => prev.map(module => module.id === validationResult.firstError.moduleId ? { ...module, collapsed: false } : module));
            }
            alert(validationResult.firstError.message);
            setTimeout(() => {
                const target = validationResult.firstError.key
                    ? document.querySelector(`[data-validation-key="${validationResult.firstError.key}"]`)
                    : document.querySelector('[data-module-drop-zone="true"]');
                target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const field = target?.querySelector('input, textarea, select');
                field?.focus?.();
            }, 0);
            return;
        }
        const payloadText = JSON.stringify({ modules });

        const referencedFileIds = [...new Set(
            modules.flatMap(module => 
                (module.attachedFiles || []).map(file => file.fileId)
            )
        )];

        try {
            if (id || savedHandoverId) {
                // Update mode: update existing document
                const handoverId = savedHandoverId || parseInt(id);
                await api.put('/handover', { id: handoverId, title, text: payloadTex, referencedFileIds });
                alert('저장되었습니다.');
                setIsSaved(true);
                const policyRes = await api.get('/handover/policy', { params: { handoverId } });
                setHandoverPolicy(policyRes.data);
            } else {
                // Create mode: create new document using spaceId
                if (!targetSpaceId) { alert('스페이스 정보를 찾을 수 없습니다.'); return; }
                const res = await api.post('/handover/bySpace', { title, text: payloadText, spaceId: parseInt(targetSpaceId), referencedFileIds });
                const newId = res.data?.id;
                if (newId) {
                    setSavedHandoverId(newId);
                    const policyRes = await api.get('/handover/policy', { params: { handoverId: newId } });
                    setHandoverPolicy(policyRes.data);
                }
                setIsSaved(true);
                alert('저장되었습니다.');
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || '저장에 실패했습니다.';
            alert(errorMessage);
        }
    };

    // Create temporary DOM element for PDF generation
    const createPdfContent = () => {
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;padding:40px;background:#fff;font-family:sans-serif;';

        // Header section
        const header = document.createElement('div');
        header.style.cssText = 'text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #333;';
        header.innerHTML = `
            <h1 style="font-size:28px;font-weight:700;color:#333;margin:0 0 15px 0;word-wrap:break-word;">${title || '인수인계서'}</h1>
            <div style="font-size:12px;color:#888;">
                <span>작성일: ${metaInfo.createdAt ? metaInfo.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]}</span>
                <span style="margin-left:20px;">작성자: ${metaInfo.userName || '-'}</span>
            </div>
        `;
        container.appendChild(header);

        // Module content
        modules.forEach(module => {
            // Handle HEADING module specially
            if (module.type === 'HEADING') {
                const headingDiv = document.createElement('div');
                headingDiv.style.cssText = 'margin:30px 0 15px 0;padding:14px 20px;background:#fff;border-radius:8px;border-left:4px solid #6366F1;border:1px solid #e0e0e0;border-left:4px solid #6366F1;';
                headingDiv.innerHTML = `<h2 style="font-size:18px;font-weight:700;color:#1F2937;margin:0;">${module.data.headingText || '섹션 제목'}</h2>`;
                container.appendChild(headingDiv);
                return;
            }

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

    // PDF generation and upload handler
    const handleGeneratePdf = async () => {
        console.log('PDF Generation - Policy:', handoverPolicy);
        console.log('PDF Generation - canGeneratePdf:', canGeneratePdf);
        console.log('PDF Generation - isSaved:', isSaved);
        console.log('PDF Generation - savedHandoverId:', savedHandoverId, 'id:', id);

        if (!isSaved) {
            alert('먼저 인수인계서를 저장해주세요.');
            return;
        }
        if (!canGeneratePdf) {
            alert(handoverPolicy?.lockReason || 'PDF는 전임자 서명 완료 상태에서 한 번만 생성할 수 있습니다.');
            return;
        }

        setIsGeneratingPdf(true);

        try {
            // Create temporary element for PDF
            const pdfContent = createPdfContent();
            document.body.appendChild(pdfContent);

            const rawText = pdfContent.innerText;

            // Wait for rendering
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture with html2canvas
            const canvas = await html2canvas(pdfContent, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Remove temporary element
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

            // Convert PDF to Blob
            const pdfBlob = doc.output('blob');
            const fileName = `${title || '인수인계서'}_${new Date().toISOString().split('T')[0]}.pdf`;
            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

            // Create markdown file for chatbot learning
            const textBlob = new Blob([rawText], { type: 'text/markdown' });
            const mdFile = new File([textBlob], `${title || '인수인계서'}_챗봇학습용.md`, { type: 'text/markdown' });

            // Verify spaceId
            const uploadSpaceId = targetSpaceId || metaInfo.spaceId;
            if (!uploadSpaceId) {
                alert('스페이스 정보를 찾을 수 없어 PDF 업로드가 불가합니다.');
                return;
            }

            // Reuse the handover folder when it already exists. If not, the backend creates it as part of the allowed PDF action.
            let handoverFolderId = null;
            try {
                const folderRes = await api.get('/file/list', { params: { spaceId: uploadSpaceId, folderId: null } });
                const existingFolder = folderRes.data.find(item => item.type === 'FOLDER' && item.name === '인수인계서');

                if (existingFolder) {
                    handoverFolderId = existingFolder.id;
                }
            } catch (folderError) {
                console.error('Folder processing error:', folderError);
            }

            const handoverFormData = new FormData();
            handoverFormData.append('pdfFile', pdfFile);
            handoverFormData.append('mdFile', mdFile);
            handoverFormData.append('handoverId', (savedHandoverId || parseInt(id)).toString());
            handoverFormData.append('spaceId', uploadSpaceId.toString());
            if (handoverFolderId) {
                handoverFormData.append('folderId', handoverFolderId.toString());
            }

            // Upload files to handover folder
            console.log('Uploading PDF - handoverId:', savedHandoverId || parseInt(id), 'spaceId:', uploadSpaceId);
            await api.post('/handover/save', handoverFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 0
            });
            console.log('PDF upload successful');

            const policyRes = await api.get('/handover/policy', { params: { handoverId: savedHandoverId || parseInt(id) } });
            setHandoverPolicy(policyRes.data);
            alert('PDF가 생성되어 인수인계서 폴더에 저장되었습니다.');
        } catch (error) {
            console.error('PDF generation error:', error);
            console.error('Error response:', error.response);
            console.error('Error response data:', error.response?.data);
            const errorMsg = error.response?.data?.message || error.response?.data || error.message || '알 수 없는 오류';
            alert('PDF 생성에 실패했습니다: ' + errorMsg);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const getModuleTypeInfo = (type) => MODULE_TYPES[type] || { icon: '📄', label: '모듈' };

    // Module color mapping for visual distinction
    const getModuleColor = (type) => {
        const colors = {
            'HEADING': '#1F2937',
            'BASIC_INFO': '#3B82F6',
            'ACCOUNT_ACCESS': '#8B5CF6',
            'TASK': '#10B981',
            'RELATED_INFO': '#0EA5E9',
            'ASSET': '#F59E0B',
            'BUDGET': '#22C55E',
            'EXPENSE': '#EC4899',
            'DOCUMENT_CONTACT': '#6366F1',
            'RISK': '#EF4444',
            'STAKEHOLDER': '#14B8A6',
            'DECISION_HISTORY': '#F97316',
            'FREE_NOTE': '#6B7280'
        };
        return colors[type] || '#6B7280';
    };

    // View mode rendering function
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

    const formatYesNo = (value) => {
        if (value === true || value === 'YES' || value === 'PUBLIC') return '예';
        if (value === false || value === 'NO' || value === 'PRIVATE') return '아니오';
        if (value === 'INTERNAL_ONLY') return '내부 공유만';
        return value;
    };

    const formatAssetLending = (value, isReturned) => {
        if (value) {
            const labels = {
                NOT_LOANED: '대여 아님',
                BORROWED: '대여 중',
                LOANED_OUT: '타인에게 대여',
                RETURNED: '반납 완료'
            };
            return labels[value] || value;
        }
        if (isReturned === true) return '반납 완료';
        if (isReturned === false) return '미반납';
        return '';
    };

    const renderViewModule = (module) => {
        const { data } = module;
        switch (module.type) {
            case 'HEADING': return null;
            case 'BASIC_INFO': return <><div style={styles.viewGrid}>{renderViewField('인계자 성명', data.handoverName)}{renderViewField('소속 / 직급', data.affiliation)}</div><div style={styles.viewGrid}>{renderViewField('인계 시작일', data.periodStart)}{renderViewField('인계 종료일', data.periodEnd)}</div><div style={styles.viewGrid}>{renderViewField('비상 연락처', data.emergencyContact)}{renderViewField('인수자 성명', data.receiverName)}</div></>;
            case 'ACCOUNT_ACCESS': return <>{renderViewField('시스템 / 사이트명', data.systemName)}{renderViewField('접속 URL', data.accessUrl, true)}<div style={styles.viewGrid}>{renderViewField('ID / 계정명', data.accountId)}{renderViewField('비밀번호', data.password)}</div>{renderViewField('권한 등급', data.permissionLevel)}{renderViewField('이용 규칙', data.usageRule)}</>;
            case 'TASK': return <>{renderViewField('업무명', <strong style={{ fontSize: '18px' }}>{data.taskName}</strong>)}<div style={styles.viewGrid}>{renderViewField('업무 유형', data.taskType)}{renderViewField('중요도', data.importance)}</div><div style={styles.viewGrid}>{renderViewField('수행 주기/시점', data.schedule)}{renderViewField('소요 시간', data.duration)}</div>{renderViewField('선행 업무', data.prerequisiteTask)}{renderViewField('필요 도구/환경', data.requiredTools)}{renderViewField('상세 절차 (Step)', <pre style={styles.preText}>{data.procedure}</pre>)}{renderViewField('산출물 (Output)', data.output)}{renderViewField('검증 기준', data.verificationCriteria)}{renderViewField('트러블슈팅', data.troubleshooting)}<hr style={styles.divider} />{renderViewField('현재 상태', data.status)}<div style={styles.viewGrid}>{renderViewField('최근 수행일', data.lastExecutionDate)}{renderViewField('차기 수행일', data.nextExecutionDate)}</div>{renderViewField('미결 사항', data.pendingIssues)}</>;
            case 'RELATED_INFO': return <>{renderViewField('문서 링크', data.relatedDocLinks, true)}<div style={styles.viewGrid}>{renderViewField('사용 계정', data.relatedAccount)}{renderViewField('관련 담당자', data.relatedContact)}</div>{renderViewField('참고 레퍼런스', <pre style={styles.preText}>{data.referenceLinks}</pre>)}</>;
            case 'ASSET': return <>{renderViewField('품목명', <strong style={{ fontSize: '18px' }}>{data.itemName}</strong>)}{renderViewField('보관 위치', data.storageLocation)}{renderViewField('수량 / 상태', data.quantityStatus)}<div style={styles.viewGrid}>{renderViewField('대여 여부', formatAssetLending(data.lendingStatus, data.isReturned))}{renderViewField('관리/소유 구분', data.ownershipStatus)}</div>{renderViewField('담당자 / 반납처', data.assetManager)}</>;
            case 'BUDGET': return <>{renderViewField('예산명', <strong style={{ fontSize: '18px' }}>{data.budgetName || data.costItem}</strong>)}<div style={styles.viewGrid}>{renderViewField('예산 기간', data.budgetPeriod || data.paymentSchedule)}{renderViewField('총 예산', data.totalBudget ? `${Number(data.totalBudget).toLocaleString()}원` : (data.amount ? `${Number(data.amount).toLocaleString()}원` : ''))}</div><div style={styles.viewGrid}>{renderViewField('사용 금액', data.usedBudget ? `${Number(data.usedBudget).toLocaleString()}원` : '')}{renderViewField('잔여 예산', data.remainingBudget ? `${Number(data.remainingBudget).toLocaleString()}원` : '')}</div>{renderViewField('예산 관리 메모', data.budgetNotes)}{renderViewField('관련 장부', data.ledgerLink, true)}</>;
            case 'EXPENSE': return <>{renderViewField('비용 항목', <strong style={{ fontSize: '18px' }}>{data.costItem}</strong>)}<div style={styles.viewGrid}>{renderViewField('결제일 / 주기', data.paymentSchedule)}{renderViewField('금액', data.amount ? `${Number(data.amount).toLocaleString()}원` : '')}</div><div style={styles.viewGrid}>{renderViewField('결제 수단', data.paymentMethod)}{renderViewField('승인/정산 상태', data.expenseStatus)}</div>{renderViewField('증빙 자료 링크', data.receiptLink, true)}{renderViewField('관련 장부', data.ledgerLink, true)}</>;
            case 'DOCUMENT_CONTACT': return <>{renderViewField('문서 제목 / 이름', data.docTitle)}<div style={styles.viewGrid}>{renderViewField('유형 / 소속', data.docType)}{renderViewField('보관 형태 / 연락처', data.storageType)}</div>{renderViewField('위치 / 역할', data.docLocation)}</>;
            case 'RISK': return <>{renderViewField('리스크 제목', <strong style={{ fontSize: '18px' }}>{data.riskTitle}</strong>)}{renderViewField('리스크 설명', data.riskDescription)}<div style={styles.viewGrid}>{renderViewField('영향도', data.impact)}{renderViewField('발생 조건', data.triggerCondition)}</div>{renderViewField('즉각 대응 방법', data.immediateResponse)}{renderViewField('사전 예방 방법', data.prevention)}<hr style={styles.divider} /><div style={styles.viewGrid}>{renderViewField('관련 업무', data.relatedTask)}{renderViewField('참고 문서', data.referenceDoc)}</div>{renderViewField('공유 범위', formatYesNo(data.externalShareStatus ?? data.isExternalShareable))}<hr style={styles.divider} /><div style={styles.viewGrid}>{renderViewField('작성자', data.author)}{renderViewField('최종 업데이트일', data.lastUpdatedDate)}</div></>;
            case 'STAKEHOLDER': return <>{renderViewField('이름 / 직함', <strong style={{ fontSize: '18px' }}>{data.personName}</strong>)}{renderViewField('소속 / 관계', data.organization)}{renderViewField('연락처', data.contact)}{renderViewField('담당 역할', data.role)}</>;
            case 'DECISION_HISTORY': return <>{renderViewField('결정 제목', <strong style={{ fontSize: '18px' }}>{data.decisionTitle}</strong>)}{renderViewField('결정 내용', data.decisionContent)}{renderViewField('결정 이유 (Why)', data.decisionReason)}<div style={styles.viewGrid}>{renderViewField('결정 시점', data.decisionDate)}{renderViewField('결정자', data.decisionMaker)}</div><hr style={styles.divider} />{renderViewField('대안 검토 여부', data.hasAlternatives === 'YES' ? '있음' : (data.hasAlternatives === 'NO' ? '없음' : ''))}{renderViewField('검토된 대안', data.reviewedAlternatives)}{renderViewField('변경 영향', data.changeImpact)}<hr style={styles.divider} /><div style={styles.viewGrid}>{renderViewField('관련 업무', data.relatedTask)}{renderViewField('참고 자료', data.referenceUrl, true)}</div><div style={styles.viewGrid}>{renderViewField('공유 범위', formatYesNo(data.externalShareStatus ?? data.isExternalShareable))}{renderViewField('최종 업데이트일', data.lastUpdatedDate)}</div></>;
            case 'FREE_NOTE': return <>{renderViewField('제목', <strong style={{ fontSize: '18px' }}>{data.noteTitle}</strong>)}<div style={styles.viewGrid}>{renderViewField('분류', data.category)}{renderViewField('중요도', data.importance)}</div>{renderViewField('내용', <pre style={styles.preText}>{data.content}</pre>)}<hr style={styles.divider} />{renderViewField('관련 업무', data.relatedTask)}{renderViewField('첨부/참고 링크', data.attachmentLink, true)}<div style={styles.viewGrid}>{renderViewField('작성자', data.author)}{renderViewField('작성일', data.createdDate)}</div></>;
            default: return <p>알 수 없는 모듈입니다.</p>;
        }
    };

    // Edit mode rendering function
    const renderEditModule = (module) => {
        const { data, id: mId } = module;
        const handleChange = (field, e) => updateModuleData(mId, field, e.target.value);
        const full = { ...styles.formRow, gridColumn: 'span 2' };
        const fieldKey = (field) => getValidationKey(mId, field);
        const fieldError = (field) => validationErrors[fieldKey(field)];
        const requiredHint = (field) => fieldError(field) ? (
            <div style={styles.requiredTextActive}>
                필수 입력 항목입니다.
            </div>
        ) : null;
        const fieldContainerProps = (field) => ({ 'data-validation-key': fieldKey(field) });
        const inputStyle = (field, baseStyle = styles.input) => ({
            ...baseStyle,
            ...(fieldError(field) ? styles.inputError : {})
        });
        const requiredInput = (field, label, options = {}) => {
            const {
                type = 'text',
                rowStyle = styles.formRow,
                value = data[field] || '',
                inputProps = {}
            } = options;
            return (
                <div style={rowStyle} {...fieldContainerProps(field)}>
                    <label style={styles.label}>{label}<span style={styles.requiredAsterisk}> *</span></label>
                    <input
                        type={type}
                        style={inputStyle(field)}
                        value={value}
                        onChange={(e) => handleChange(field, e)}
                        {...inputProps}
                    />
                    {requiredHint(field)}
                </div>
            );
        };
        const requiredTextarea = (field, label, rowStyle = full) => (
            <div style={rowStyle} {...fieldContainerProps(field)}>
                <label style={styles.label}>{label}<span style={styles.requiredAsterisk}> *</span></label>
                <textarea style={inputStyle(field, styles.textarea)} value={data[field] || ''} onChange={(e) => handleChange(field, e)} />
                {requiredHint(field)}
            </div>
        );
        const requiredSelect = (field, label, children, rowStyle = styles.formRow, value = data[field] || '') => (
            <div style={rowStyle} {...fieldContainerProps(field)}>
                <label style={styles.label}>{label}<span style={styles.requiredAsterisk}> *</span></label>
                <select style={inputStyle(field)} value={value} onChange={(e) => handleChange(field, e)}>
                    {children}
                </select>
                {requiredHint(field)}
            </div>
        );

        switch (module.type) {
            case 'HEADING': return (
                <div style={full}>
                    <label style={styles.label}>섹션 제목</label>
                    <input
                        style={{ ...styles.input, fontSize: '18px', fontWeight: '700' }}
                        placeholder="섹션 제목을 입력하세요"
                        value={data.headingText || ''}
                        onChange={(e) => handleChange('headingText', e)}
                    />
                </div>
            );
            case 'BASIC_INFO': return (
                <div style={styles.formGrid}>
                    {requiredInput('handoverName', '인계자 성명', { rowStyle: full })}
                    {requiredInput('affiliation', '소속 / 직급', { rowStyle: full })}
                    {requiredInput('periodStart', '인계 시작일', { type: 'date' })}
                    {requiredInput('periodEnd', '인계 종료일', { type: 'date' })}
                    {requiredInput('emergencyContact', '비상 연락처', { rowStyle: full })}
                    {requiredInput('receiverName', '인수자 성명', { rowStyle: full })}
                </div>
            );
            case 'ACCOUNT_ACCESS': return (
                <div style={styles.formGrid}>
                    {requiredInput('systemName', '시스템 / 사이트명', { rowStyle: full })}
                    {requiredInput('accessUrl', '접속 URL', { type: 'url', rowStyle: full })}
                    {requiredInput('accountId', 'ID / 계정명')}
                    {requiredInput('password', '비밀번호')}
                    {requiredSelect('permissionLevel', '권한 등급', <>
                            <option value="">선택</option><option value="ADMIN">Admin (최고관리자)</option><option value="MANAGER">Editor (편집자)</option><option value="NORMAL">Normal (일반)</option><option value="VIEWER">Viewer (뷰어)</option>
                        </>, full)}
                    <div style={full}><label style={styles.label}>이용 규칙</label><textarea style={styles.textarea} value={data.usageRule || ''} onChange={(e) => handleChange('usageRule', e)} /></div>
                </div>
            );
            case 'TASK': return (
                <>
                    {/* Basic info section */}
                    <div style={styles.sectionGroup}>
                        <div style={styles.sectionTitle}>기본 정보</div>
                        <div style={styles.formGrid}>
                            {requiredInput('taskName', '업무명', { rowStyle: full })}
                            {requiredSelect('taskType', '업무 유형', <><option value="">선택</option><option value="ROUTINE">정기 루틴</option><option value="EVENT">비정기 이벤트</option><option value="PROJECT">일회성 프로젝트</option></>)}
                            {requiredSelect('importance', '중요도', <><option value="">선택</option><option value="CRITICAL">🔥 Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></>)}
                            {requiredInput('schedule', '수행 주기/시점')}
                            {requiredInput('duration', '소요 시간')}
                        </div>
                    </div>

                    {/* Task detail section */}
                    <div style={styles.sectionGroup}>
                        <div style={styles.sectionTitle}>업무 상세</div>
                        <div style={styles.formGrid}>
                            <div style={full}><label style={styles.label}>선행 업무</label><input style={styles.input} value={data.prerequisiteTask || ''} onChange={(e) => handleChange('prerequisiteTask', e)} /></div>
                            {requiredInput('requiredTools', '필요 도구/환경', { rowStyle: full })}
                            {requiredTextarea('procedure', '상세 절차 (Step)')}
                            {requiredInput('output', '산출물 (Output)', { rowStyle: full })}
                            <div style={full}><label style={styles.label}>검증 기준</label><textarea style={styles.textarea} value={data.verificationCriteria || ''} onChange={(e) => handleChange('verificationCriteria', e)} /></div>
                            <div style={full}><label style={styles.label}>트러블슈팅</label><textarea style={styles.textarea} value={data.troubleshooting || ''} onChange={(e) => handleChange('troubleshooting', e)} /></div>
                        </div>
                    </div>

                    {/* Current status section */}
                    <div style={styles.sectionGroup}>
                        <div style={styles.sectionTitle}>현재 상태</div>
                        <div style={styles.formGrid}>
                            {requiredSelect('status', '상태', <><option value="">선택</option><option value="NORMAL">✅ 정상 운영</option><option value="ISSUE">⚠️ 이슈 있음</option><option value="PAUSED">⏸️ 일시 중단</option><option value="HANDOVER">🔄 인계 중</option></>, full)}
                            <div style={styles.formRow}><label style={styles.label}>최근 수행일</label><input type="date" style={styles.input} value={data.lastExecutionDate || ''} onChange={(e) => handleChange('lastExecutionDate', e)} /></div>
                            <div style={styles.formRow}><label style={styles.label}>차기 수행일</label><input type="date" style={styles.input} value={data.nextExecutionDate || ''} onChange={(e) => handleChange('nextExecutionDate', e)} /></div>
                            <div style={full}><label style={styles.label}>미결 사항</label><textarea style={styles.textarea} value={data.pendingIssues || ''} onChange={(e) => handleChange('pendingIssues', e)} /></div>
                        </div>
                    </div>
                </>
            );
            case 'RELATED_INFO': return (
                <div style={styles.formGrid}>
                    {requiredInput('relatedDocLinks', '문서 링크', { rowStyle: full })}
                    {requiredInput('relatedAccount', '사용 계정')}
                    {requiredInput('relatedContact', '관련 담당자')}
                    <div style={full}><label style={styles.label}>참고 레퍼런스</label><textarea style={styles.textarea} value={data.referenceLinks || ''} onChange={(e) => handleChange('referenceLinks', e)} /></div>
                </div>
            );
            case 'ASSET': return (
                <div style={styles.formGrid}>
                    {requiredInput('itemName', '품목명', { rowStyle: full })}
                    {requiredInput('storageLocation', '보관 위치', { rowStyle: full })}
                    {requiredInput('quantityStatus', '수량 / 상태', { rowStyle: full })}
                    {requiredSelect('lendingStatus', '대여 여부', <>
                            <option value="">선택</option>
                            <option value="NOT_LOANED">대여 아님</option>
                            <option value="BORROWED">대여 중</option>
                            <option value="LOANED_OUT">타인에게 대여</option>
                            <option value="RETURNED">반납 완료</option>
                        </>, styles.formRow, data.lendingStatus || (data.isReturned ? 'RETURNED' : ''))}
                    {requiredSelect('ownershipStatus', '관리/소유 구분', <>
                            <option value="">선택</option>
                            <option value="TEAM_OWNED">팀 소유</option>
                            <option value="PERSONAL_OWNED">개인 소유</option>
                            <option value="RENTED">외부 대여/렌탈</option>
                            <option value="UNKNOWN">확인 필요</option>
                        </>)}
                    <div style={full}><label style={styles.label}>담당자 / 반납처</label><input style={styles.input} value={data.assetManager || ''} onChange={(e) => handleChange('assetManager', e)} /></div>
                </div>
            );
            case 'BUDGET': return (
                <div style={styles.formGrid}>
                    {requiredInput('budgetName', '예산명', { rowStyle: full, value: data.budgetName || data.costItem || '' })}
                    {requiredInput('budgetPeriod', '예산 기간', { value: data.budgetPeriod || data.paymentSchedule || '' })}
                    {requiredInput('totalBudget', '총 예산 (원)', { type: 'number' })}
                    {requiredInput('usedBudget', '사용 금액 (원)', { type: 'number' })}
                    {requiredInput('remainingBudget', '잔여 예산 (원)', { type: 'number' })}
                    <div style={full}><label style={styles.label}>관련 장부 (링크)</label><input style={styles.input} value={data.ledgerLink || ''} onChange={(e) => handleChange('ledgerLink', e)} /></div>
                    <div style={full}><label style={styles.label}>예산 관리 메모</label><textarea style={styles.textarea} value={data.budgetNotes || ''} onChange={(e) => handleChange('budgetNotes', e)} /></div>
                </div>
            );
            case 'EXPENSE': return (
                <div style={styles.formGrid}>
                    {requiredInput('costItem', '비용 항목', { rowStyle: full })}
                    {requiredInput('paymentSchedule', '결제일 / 주기')}
                    {requiredInput('amount', '금액 (원)', { type: 'number' })}
                    {requiredSelect('paymentMethod', '결제 수단', <>
                            <option value="">선택</option>
                            <option value="CARD">카드</option>
                            <option value="TRANSFER">계좌이체</option>
                            <option value="CASH">현금</option>
                            <option value="AUTO_PAYMENT">자동 결제</option>
                            <option value="OTHER">기타</option>
                        </>)}
                    {requiredSelect('expenseStatus', '승인/정산 상태', <>
                            <option value="">선택</option>
                            <option value="PLANNED">예정</option>
                            <option value="PAID">결제 완료</option>
                            <option value="REIMBURSED">정산 완료</option>
                            <option value="NEEDS_REVIEW">확인 필요</option>
                        </>)}
                    <div style={full}><label style={styles.label}>증빙 자료 링크</label><input style={styles.input} value={data.receiptLink || ''} onChange={(e) => handleChange('receiptLink', e)} /></div>
                    <div style={full}><label style={styles.label}>관련 장부 (링크)</label><input style={styles.input} value={data.ledgerLink || ''} onChange={(e) => handleChange('ledgerLink', e)} /></div>
                </div>
            );
            case 'DOCUMENT_CONTACT': return (
                <div style={styles.formGrid}>
                    {requiredInput('docTitle', '문서 제목 / 이름', { rowStyle: full })}
                    {requiredInput('docType', '유형 / 소속')}
                    {requiredInput('storageType', '보관 형태 / 연락처')}
                    {requiredInput('docLocation', '위치 / 역할', { rowStyle: full })}
                </div>
            );
            case 'RISK': return (
                <div style={styles.formGrid}>
                    {requiredInput('riskTitle', '리스크 제목', { rowStyle: full })}
                    {requiredTextarea('riskDescription', '리스크 설명')}
                    {requiredSelect('impact', '영향도', <><option value="">선택</option><option value="HIGH">🔴 High</option><option value="MEDIUM">🟡 Medium</option><option value="LOW">🟢 Low</option></>)}
                    {requiredInput('triggerCondition', '발생 조건')}
                    {requiredTextarea('immediateResponse', '즉각 대응 방법')}
                    {requiredTextarea('prevention', '사전 예방 방법')}
                    <hr style={styles.divider} />
                    <div style={styles.formRow}><label style={styles.label}>관련 업무 (Task)</label><input style={styles.input} value={data.relatedTask || ''} onChange={(e) => handleChange('relatedTask', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>참고 문서</label><input style={styles.input} value={data.referenceDoc || ''} onChange={(e) => handleChange('referenceDoc', e)} /></div>
                    {requiredSelect('externalShareStatus', '공유 범위', <>
                            <option value="">선택</option>
                            <option value="PRIVATE">공유 안 함</option>
                            <option value="INTERNAL_ONLY">내부 공유만</option>
                            <option value="PUBLIC">외부 공유 가능</option>
                        </>, full, data.externalShareStatus || (data.isExternalShareable ? 'PUBLIC' : ''))}
                    <hr style={styles.divider} />
                    <div style={styles.formRow}><label style={styles.label}>작성자</label><input style={styles.input} value={data.author || ''} onChange={(e) => handleChange('author', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>최종 업데이트일</label><input type="date" style={styles.input} value={data.lastUpdatedDate || ''} onChange={(e) => handleChange('lastUpdatedDate', e)} /></div>
                </div>
            );
            case 'STAKEHOLDER': return (
                <div style={styles.formGrid}>
                    {requiredInput('personName', '이름 / 직함', { rowStyle: full })}
                    {requiredInput('organization', '소속 / 관계', { rowStyle: full })}
                    {requiredInput('contact', '연락처', { rowStyle: full })}
                    {requiredInput('role', '담당 역할', { rowStyle: full })}
                </div>
            );
            case 'DECISION_HISTORY': return (
                <div style={styles.formGrid}>
                    {requiredInput('decisionTitle', '결정 제목', { rowStyle: full })}
                    {requiredTextarea('decisionContent', '결정 내용')}
                    {requiredTextarea('decisionReason', '결정 이유 (Why)')}
                    {requiredInput('decisionDate', '결정 시점', { type: 'date' })}
                    {requiredInput('decisionMaker', '결정자')}
                    <hr style={styles.divider} />
                    {requiredSelect('hasAlternatives', '대안 검토 여부', <><option value="">선택</option><option value="YES">있음</option><option value="NO">없음</option></>, full)}
                    <div style={full}><label style={styles.label}>검토된 대안</label><textarea style={styles.textarea} value={data.reviewedAlternatives || ''} onChange={(e) => handleChange('reviewedAlternatives', e)} /></div>
                    {requiredTextarea('changeImpact', '변경 영향')}
                    <hr style={styles.divider} />
                    <div style={styles.formRow}><label style={styles.label}>관련 업무 (Task)</label><input style={styles.input} value={data.relatedTask || ''} onChange={(e) => handleChange('relatedTask', e)} /></div>
                    <div style={styles.formRow}><label style={styles.label}>참고 자료</label><input style={styles.input} value={data.referenceUrl || ''} onChange={(e) => handleChange('referenceUrl', e)} /></div>
                    {requiredSelect('externalShareStatus', '공유 범위', <>
                            <option value="">선택</option>
                            <option value="PRIVATE">공유 안 함</option>
                            <option value="INTERNAL_ONLY">내부 공유만</option>
                            <option value="PUBLIC">외부 공유 가능</option>
                        </>, full, data.externalShareStatus || (data.isExternalShareable ? 'PUBLIC' : ''))}
                    <div style={full}><label style={styles.label}>최종 업데이트일</label><input type="date" style={styles.input} value={data.lastUpdatedDate || ''} onChange={(e) => handleChange('lastUpdatedDate', e)} /></div>
                </div>
            );
            case 'FREE_NOTE': return (
                <div style={styles.formGrid}>
                    {requiredInput('noteTitle', '제목', { rowStyle: full })}
                    {requiredSelect('category', '분류', <><option value="">선택</option><option value="TIP">💡 팁/노하우</option><option value="CAUTION">⚠️ 주의사항</option><option value="REFERENCE">📎 참고사항</option><option value="TODO">☑️ 해야 할 일</option><option value="ETC">📝 기타</option></>)}
                    {requiredSelect('importance', '중요도', <><option value="">선택</option><option value="HIGH">🔴 높음</option><option value="MEDIUM">🟡 보통</option><option value="LOW">🟢 낮음</option></>)}
                    {requiredTextarea('content', '내용')}
                    <hr style={styles.divider} />
                    <div style={full}><label style={styles.label}>관련 업무 (Task)</label><input style={styles.input} value={data.relatedTask || ''} onChange={(e) => handleChange('relatedTask', e)} /></div>
                    <div style={full}><label style={styles.label}>첨부/참고 링크</label><input style={styles.input} value={data.attachmentLink || ''} onChange={(e) => handleChange('attachmentLink', e)} /></div>
                    {requiredInput('author', '작성자')}
                    {requiredInput('createdDate', '작성일', { type: 'date' })}
                </div>
            );
            default: return <div style={full}><label style={styles.label}>지원되지 않는 모듈입니다.</label></div>;
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div style={{ ...styles.pageBackground, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p>로딩 중...</p>
            </div>
        );
    }

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <nav style={styles.breadcrumb}>
                    <span style={{ cursor: 'pointer', color: '#3B82F6' }} onClick={() => navigate('/')}>내 스페이스</span>
                    <span>&gt;</span>
                    <span
                        style={{ cursor: 'pointer', color: '#3B82F6' }}
                        onClick={() => {
                            if (metaInfo.groupId) {
                                navigate(`/group/manage/${metaInfo.groupId}`);
                            }
                        }}
                    >
                        {metaInfo.groupName}
                    </span>
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
                    {canEdit ? (
                        <>
                            <button style={styles.btnPrimary} onClick={handleSave}>저장하기</button>
                            <button
                                style={canGeneratePdf ? styles.btnPdf : styles.btnPdfDisabled}
                                onClick={handleGeneratePdf}
                                disabled={!canGeneratePdf || isGeneratingPdf}
                                title={handoverPolicy?.lockReason || ''}
                            >
                                {isGeneratingPdf ? '생성 중...' : 'PDF 생성'}
                            </button>
                        </>
                    ) : (
                        <button
                            style={canGeneratePdf ? styles.btnPdf : styles.btnPdfDisabled}
                            onClick={handleGeneratePdf}
                            disabled={!canGeneratePdf || isGeneratingPdf}
                            title={handoverPolicy?.lockReason || ''}
                        >
                            {isGeneratingPdf ? '생성 중...' : 'PDF 생성'}
                        </button>
                    )}
                </div>
            </header>

            <div style={styles.mainContainer}>
                {canEdit && (
                    <aside style={styles.sidebar}>
                        <div style={styles.sidebarTitle}>모듈 추가</div>
                        {Object.entries(MODULE_TYPES).map(([type, info]) => (
                            <div
                                key={type}
                                style={{
                                    ...styles.moduleItem,
                                    opacity: draggedNewType === type ? 0.5 : 1,
                                    cursor: 'grab'
                                }}
                                draggable
                                onDragStart={(e) => handleSidebarDragStart(e, type)}
                                onDragEnd={handleSidebarDragEnd}
                                onClick={() => addModule(type)}
                            >
                                <span>{info.icon}</span>
                                <span>{info.label}</span>
                            </div>
                        ))}
                    </aside>
                )}

                <main style={{ ...styles.content, marginLeft: canEdit ? '250px' : 'auto', marginRight: canEdit ? '0' : 'auto' }}>
                    <div style={styles.documentHeader}>
                        {canEdit ? (
                            <input style={styles.titleInput} placeholder="인수인계서 제목을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} />
                        ) : (
                            <>
                                <h1 style={styles.documentTitle}>{title || '제목 없음'}</h1>
                                <div style={styles.documentMeta}>
                                    <span>작성일: {metaInfo.createdAt ? metaInfo.createdAt.split('T')[0] : '-'}</span>
                                    <span>작성자: {metaInfo.userName}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div
                        data-module-drop-zone="true"
                        style={{
                            ...styles.modulesContainer,
                            ...(isDraggingOverContainer && modules.length === 0 ? styles.containerDragOver : {})
                        }}
                        onDragOver={handleContainerDragOver}
                        onDragLeave={handleContainerDragLeave}
                        onDrop={handleContainerDrop}
                    >
                        {modules.length === 0 && canEdit && (
                            <div style={{
                                ...styles.emptyState,
                                ...(isDraggingOverContainer ? styles.emptyStateDragOver : {})
                            }}>
                                {isDraggingOverContainer ? '여기에 모듈을 놓으세요' : '좌측 팔레트에서 모듈을 드래그하거나 클릭하여 추가하세요.'}
                            </div>
                        )}

                        {modules.map((module, index) => {
                            const typeInfo = getModuleTypeInfo(module.type);
                            const moduleColor = getModuleColor(module.type);
                            const isHeading = module.type === 'HEADING';
                            const isDragging = draggedIndex === index;
                            const isDragOver = dragOverIndex === index;

                            // Render HEADING module as a section separator
                            if (isHeading) {
                                return (
                                    <div
                                        key={module.id}
                                        style={{
                                            marginTop: index === 0 ? '0' : '32px',
                                            marginBottom: '16px',
                                            opacity: isDragging ? 0.5 : 1,
                                            transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                                            transition: 'transform 0.2s, opacity 0.2s'
                                        }}
                                        draggable={canEdit}
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (dragOverIndex !== index) setDragOverIndex(index);
                                        }}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => {
                                            e.stopPropagation();
                                            handleDropOnModule(e, index);
                                        }}
                                        onDragEnd={handleDragEnd}
                                    >
                                        {isDragOver && (draggedIndex !== index || draggedNewType) && (
                                            <div style={styles.dropIndicator}></div>
                                        )}
                                        <div style={{
                                            ...styles.headingModule,
                                            cursor: canEdit ? 'grab' : 'default'
                                        }}>
                                            {canEdit && (
                                                <span style={styles.dragHandle}>⋮⋮</span>
                                            )}
                                            <div style={styles.headingContent}>
                                                {canEdit ? (
                                                    <input
                                                        style={styles.headingInput}
                                                        placeholder="섹션 제목을 입력하세요"
                                                        value={module.data.headingText || ''}
                                                        onChange={(e) => updateModuleData(module.id, 'headingText', e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <h2 style={styles.headingText}>{module.data.headingText || '섹션 제목'}</h2>
                                                )}
                                            </div>
                                            {canEdit && (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button style={{ ...styles.iconBtn, color: '#EF4444', borderColor: '#FCA5A5' }} onClick={() => removeModule(module.id)}>✕</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            // Render regular modules
                            return (
                                <div
                                    key={module.id}
                                    style={{
                                        marginTop: index === 0 ? '0' : '20px',
                                        opacity: isDragging ? 0.5 : 1,
                                        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                                        transition: 'transform 0.2s, opacity 0.2s'
                                    }}
                                    draggable={canEdit}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (dragOverIndex !== index) setDragOverIndex(index);
                                    }}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => {
                                        e.stopPropagation();
                                        handleDropOnModule(e, index);
                                    }}
                                    onDragEnd={handleDragEnd}
                                >
                                    {isDragOver && (draggedIndex !== index || draggedNewType) && (
                                        <div style={styles.dropIndicator}></div>
                                    )}
                                    <div style={{
                                        ...styles.moduleCard,
                                        borderTop: `3px solid ${moduleColor}`
                                    }}>
                                        <div style={{
                                            ...styles.moduleHeader,
                                            background: `linear-gradient(to right, ${moduleColor}08, #ffffff)`,
                                            cursor: canEdit ? 'grab' : 'default'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {canEdit && (
                                                    <span style={styles.dragHandle}>⋮⋮</span>
                                                )}
                                                <span style={{
                                                    ...styles.moduleIcon,
                                                    background: `${moduleColor}15`,
                                                    border: `1px solid ${moduleColor}30`
                                                }}>{typeInfo.icon}</span>
                                                <span style={styles.moduleLabel}>{typeInfo.label}</span>
                                            </div>
                                            {canEdit && (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button style={styles.iconBtn} onClick={() => toggleModule(module.id)}>{module.collapsed ? '펼치기' : '접기'}</button>
                                                    <button style={{ ...styles.iconBtn, color: '#EF4444', borderColor: '#FCA5A5' }} onClick={() => removeModule(module.id)}>✕</button>
                                                </div>
                                            )}
                                        </div>

                                        {!module.collapsed && (
                                            <div style={styles.moduleBodyWrapper}>
                                                <div style={styles.moduleBodyContent}>
                                                    {canEdit ? renderEditModule(module) : renderViewModule(module)}
                                                </div>
                                                <div style={styles.moduleAttachmentPanel} data-attachment-panel="true">
                                                    <div style={styles.attachmentPanelHeader}>
                                                        <span style={styles.attachmentPanelTitle}>📎 첨부 파일</span>
                                                        <span style={styles.attachmentCount}>{module.attachedFiles?.length || 0}</span>
                                                    </div>
                                                    {canEdit && (
                                                        <button
                                                            style={styles.addFileBtn}
                                                            onClick={() => handleOpenFileSelector(module.id)}
                                                        >
                                                            + 자료실에서 추가
                                                        </button>
                                                    )}
                                                    <div style={styles.attachedFilesScroll}>
                                                        {(module.attachedFiles || []).map(file => (
                                                            <div key={file.fileId} style={styles.attachedFileItem}>
                                                                <div
                                                                    style={styles.fileClickArea}
                                                                    onClick={() => handleFileClick(file.fileId)}
                                                                    title="클릭하여 미리보기"
                                                                >
                                                                    <span style={styles.fileIcon}>{getFileIcon(file.fileType)}</span>
                                                                    <div style={styles.fileInfo}>
                                                                        <span style={styles.fileName}>{file.fileName}</span>
                                                                        <span style={styles.fileSize}>{formatFileSize(file.size)}</span>
                                                                    </div>
                                                                </div>
                                                                {canEdit && (
                                                                    <button
                                                                        style={styles.removeFileBtn}
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(module.id, file.fileId); }}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {(!module.attachedFiles || module.attachedFiles.length === 0) && (
                                                            <div style={styles.noFilesText}>
                                                                첨부된 파일이 없습니다
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>

            {/* File Selector Modal */}
            {isFileSelectorOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.fileSelectorModal}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>📁 자료실에서 파일 선택</h3>
                            <button
                                style={styles.modalCloseBtn}
                                onClick={() => setIsFileSelectorOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={styles.folderBreadcrumb}>
                            {archiveFolderStack.map((folder, idx) => (
                                <span key={idx}>
                                    <span
                                        style={{
                                            cursor: idx === archiveFolderStack.length - 1 ? 'default' : 'pointer',
                                            color: idx === archiveFolderStack.length - 1 ? '#1f2937' : '#4F46E5',
                                            fontWeight: idx === archiveFolderStack.length - 1 ? '600' : '400'
                                        }}
                                        onClick={() => idx !== archiveFolderStack.length - 1 && goToArchiveFolder(idx)}
                                    >
                                        {folder.name}
                                    </span>
                                    {idx < archiveFolderStack.length - 1 && <span style={{ margin: '0 8px', color: '#9ca3af' }}>/</span>}
                                </span>
                            ))}
                        </div>

                        <div style={styles.fileListContainer}>
                            {archiveFolders.map(folder => (
                                <div
                                    key={`folder-${folder.id}`}
                                    style={styles.folderItem}
                                    onClick={() => enterArchiveFolder(folder.id, folder.name)}
                                >
                                    <span style={{ fontSize: '20px' }}>📁</span>
                                    <span style={styles.folderName}>{folder.name}</span>
                                </div>
                            ))}
                            {archiveFiles.map(file => {
                                const module = modules.find(m => m.id === activeModuleIdForFiles);
                                const existingIds = (module?.attachedFiles || []).map(f => f.fileId);
                                const isAlreadyAttached = existingIds.includes(file.id);
                                const isSelected = selectedArchiveFiles.find(f => f.id === file.id);

                                return (
                                    <div
                                        key={`file-${file.id}`}
                                        style={{
                                            ...styles.selectableFileItem,
                                            background: isSelected ? '#EEF2FF' : (isAlreadyAttached ? '#f3f4f6' : '#fff'),
                                            border: isSelected ? '2px solid #4F46E5' : '1px solid #e5e7eb',
                                            opacity: isAlreadyAttached ? 0.5 : 1,
                                            cursor: isAlreadyAttached ? 'not-allowed' : 'pointer'
                                        }}
                                        onClick={() => !isAlreadyAttached && toggleArchiveFileSelection(file)}
                                    >
                                        <span style={{ fontSize: '18px' }}>{getFileIcon(getFileTypeFromName(file.name || file.originalFileName))}</span>
                                        <div style={styles.selectableFileInfo}>
                                            <span style={styles.selectableFileName}>{file.name || file.originalFileName}</span>
                                            <span style={styles.selectableFileSize}>{formatFileSize(file.size)}</span>
                                        </div>
                                        {isSelected && <span style={styles.checkMark}>✓</span>}
                                        {isAlreadyAttached && <span style={styles.alreadyAttachedLabel}>첨부됨</span>}
                                    </div>
                                );
                            })}
                            {archiveFolders.length === 0 && archiveFiles.length === 0 && (
                                <div style={styles.emptyArchive}>
                                    이 폴더에 파일이 없습니다
                                </div>
                            )}
                        </div>

                        <div style={styles.modalFooter}>
                            <span style={styles.selectedCount}>
                                {selectedArchiveFiles.length}개 선택됨
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    style={styles.cancelBtn}
                                    onClick={() => setIsFileSelectorOpen(false)}
                                >
                                    취소
                                </button>
                                <button
                                    style={{
                                        ...styles.confirmBtn,
                                        opacity: selectedArchiveFiles.length === 0 ? 0.5 : 1,
                                        cursor: selectedArchiveFiles.length === 0 ? 'not-allowed' : 'pointer'
                                    }}
                                    onClick={handleConfirmFileSelection}
                                    disabled={selectedArchiveFiles.length === 0}
                                >
                                    첨부하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh' },
    header: { background: 'white', padding: '15px 30px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px', fontWeight: '500' },
    headerButtons: { display: 'flex', gap: '10px' },
    btnPrimary: { background: '#3B82F6', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    btnPdf: { background: '#10B981', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
    btnPdfDisabled: { background: '#9CA3AF', color: 'white', padding: '8px 20px', border: 'none', borderRadius: '6px', cursor: 'not-allowed', fontWeight: '600', opacity: 0.6 },
    mainContainer: { display: 'flex', marginTop: '60px', minHeight: 'calc(100vh - 60px)' },
    sidebar: { width: '250px', background: 'white', borderRight: '1px solid #e0e0e0', padding: '20px', position: 'fixed', top: '60px', left: 0, bottom: 0, overflowY: 'auto' },
    sidebarTitle: { fontSize: '14px', fontWeight: '700', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #e0e0e0' },
    moduleItem: { padding: '12px 15px', background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
    content: { flex: 1, padding: '30px', maxWidth: '900px' },
    documentHeader: { background: 'white', padding: '40px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', textAlign: 'center' },
    documentTitle: { fontSize: '32px', fontWeight: '700', color: '#333', marginBottom: '10px', wordWrap: 'break-word', overflowWrap: 'break-word' },
    documentMeta: { display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '13px', color: '#888' },
    titleInput: { fontSize: '28px', fontWeight: '700', color: '#333', border: 'none', borderBottom: '2px solid transparent', background: 'transparent', textAlign: 'center', width: '100%', padding: '5px', marginBottom: '8px', outline: 'none' },
    modulesContainer: { minHeight: '200px', paddingBottom: '100px' },
    containerDragOver: { background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px' },
    emptyState: { border: '2px dashed #ccc', borderRadius: '12px', padding: '40px', textAlign: 'center', color: '#999', marginTop: '15px', transition: 'all 0.2s' },
    emptyStateDragOver: { border: '2px dashed #6366F1', background: 'rgba(99, 102, 241, 0.1)', color: '#6366F1' },

    // Heading module styles
    headingModule: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb',
        borderLeft: '4px solid #6366F1'
    },
    headingContent: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headingText: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1F2937',
        margin: 0,
        textAlign: 'center'
    },
    headingInput: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1F2937',
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid #e5e7eb',
        outline: 'none',
        flex: 1,
        padding: '4px 0',
        textAlign: 'center'
    },

    // Module card styles
    moduleCard: {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: '1px solid #e5e7eb'
    },
    moduleHeader: {
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    moduleIcon: {
        fontSize: '24px',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        borderRadius: '12px'
    },
    moduleLabel: { fontWeight: '700', fontSize: '16px', color: '#111827' },
    iconBtn: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', fontSize: '12px', transition: 'all 0.2s' },
    moduleBody: { padding: '28px', background: '#fafbfc' },
    moduleBodyWrapper: { display: 'flex', background: '#fafbfc' },
    moduleBodyContent: { flex: 1, padding: '28px', minWidth: 0 },
    moduleAttachmentPanel: {
        width: '200px',
        minWidth: '200px',
        padding: '20px',
        background: '#f8fafc',
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    attachmentPanelHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    attachmentPanelTitle: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#374151'
    },
    attachmentCount: {
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        background: '#e5e7eb',
        padding: '2px 8px',
        borderRadius: '10px'
    },
    addFileBtn: {
        padding: '10px 12px',
        background: '#fff',
        border: '1px dashed #d1d5db',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#4F46E5',
        fontWeight: '600',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s'
    },
    attachedFilesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
        overflowY: 'auto'
    },
    attachedFilesScroll: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
        overflowY: 'auto',
        maxHeight: '300px',
        paddingRight: '4px'
    },
    attachedFileItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '12px'
    },
    fileIcon: { fontSize: '16px' },
    fileClickArea: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flex: 1,
        minWidth: 0,
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '4px',
        transition: 'background 0.2s'
    },
    fileInfo: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflow: 'hidden'
    },
    fileName: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    fileSize: {
        fontSize: '10px',
        color: '#9ca3af'
    },
    removeFileBtn: {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        fontSize: '12px',
        padding: '2px 4px'
    },
    noFilesText: {
        fontSize: '12px',
        color: '#9ca3af',
        textAlign: 'center',
        padding: '20px 0'
    },

    // Drag and drop styles
    dragHandle: {
        cursor: 'grab',
        color: '#9CA3AF',
        fontSize: '16px',
        padding: '4px 8px',
        userSelect: 'none',
        letterSpacing: '2px'
    },
    dropIndicator: {
        height: '4px',
        background: 'linear-gradient(90deg, #3B82F6, #6366F1)',
        borderRadius: '2px',
        marginBottom: '8px'
    },

    // Section group styles
    sectionGroup: { marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' },
    sectionTitle: { fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.5px' },

    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    formRow: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '12px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' },
    requiredAsterisk: { color: '#DC2626', fontWeight: '700' },
    input: { padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#fff', transition: 'border-color 0.2s' },
    inputError: { borderColor: '#EF4444', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)' },
    requiredTextActive: { color: '#DC2626', fontSize: '11px', fontWeight: '700', marginTop: '2px' },
    textarea: { padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', minHeight: '100px', resize: 'vertical', lineHeight: '1.6' },
    divider: { border: 'none', borderTop: '2px solid #e5e7eb', margin: '24px 0', gridColumn: 'span 2' },

    viewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    viewRow: { marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' },
    viewLabel: { fontSize: '11px', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    viewValue: { fontSize: '15px', color: '#111827', lineHeight: '1.5' },
    viewCard: { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #e5e7eb' },
    preText: { whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, padding: '16px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px', lineHeight: '1.7', border: '1px solid #e5e7eb' },

    // File Selector Modal styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
    },
    fileSelectorModal: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '600px',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb'
    },
    modalTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827'
    },
    modalCloseBtn: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        color: '#6b7280',
        cursor: 'pointer',
        padding: '4px'
    },
    folderBreadcrumb: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 20px',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        flexWrap: 'wrap'
    },
    breadcrumbItem: {
        fontSize: '13px',
        color: '#3b82f6',
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: '4px',
        transition: 'background 0.2s'
    },
    breadcrumbSeparator: {
        color: '#9ca3af',
        fontSize: '12px'
    },
    fileListContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '12px 20px',
        minHeight: '300px'
    },
    folderItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        marginBottom: '4px'
    },
    selectableFileItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '4px',
        border: '2px solid transparent'
    },
    selectedFileItem: {
        backgroundColor: '#eff6ff',
        border: '2px solid #3b82f6'
    },
    folderIcon: {
        fontSize: '20px'
    },
    fileItemInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    fileItemName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151'
    },
    fileItemMeta: {
        fontSize: '12px',
        color: '#9ca3af'
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
    },
    selectedCount: {
        fontSize: '13px',
        color: '#6b7280'
    },
    modalActions: {
        display: 'flex',
        gap: '8px'
    },
    cancelBtn: {
        padding: '8px 16px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: '#fff',
        color: '#374151',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    confirmBtn: {
        padding: '8px 16px',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#3b82f6',
        color: '#fff',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    emptyArchive: {
        textAlign: 'center',
        padding: '40px 20px',
        color: '#9ca3af'
    },
    emptyArchiveIcon: {
        fontSize: '40px',
        marginBottom: '12px'
    },
    emptyArchiveText: {
        fontSize: '14px'
    },
    folderName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151'
    },
    selectableFileInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    selectableFileName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151'
    },
    selectableFileSize: {
        fontSize: '12px',
        color: '#9ca3af'
    },
    checkMark: {
        color: '#4F46E5',
        fontWeight: '700',
        fontSize: '16px'
    },
    alreadyAttachedLabel: {
        fontSize: '11px',
        color: '#6b7280',
        backgroundColor: '#e5e7eb',
        padding: '2px 6px',
        borderRadius: '4px'
    }
};
