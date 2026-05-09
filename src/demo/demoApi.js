/**
 * Demo API - Mimics real API using localStorage
 * Includes persistent default dummy data for "인사이트 랩"
 */

const STORAGE_KEYS = {
    FILES: 'demo_files',
    FOLDERS: 'demo_folders',
    HANDOVERS: 'demo_handovers',
    FILE_CONTENTS: 'demo_file_contents',
    INITIALIZED: 'demo_initialized'
};

// Default dummy data IDs (these are protected from deletion)
const DEFAULT_IDS = {
    HANDOVERS: [1001, 1002, 1003],
    FILES: [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015],
    FOLDERS: [3001]
};

// Demo space info - "인사이트 랩" 개발자 동아리
const DEMO_SPACE = {
    id: 1,
    groupName: '인사이트 랩',
    workName: '개발팀 인수인계',
    spaceCode: 'insight-lab-001'
};

// Default handover data
const getDefaultHandovers = () => [
    {
        id: 1001,
        title: '인사이트 랩 백엔드 개발자 인수인계서',
        text: JSON.stringify({
            modules: [
                {
                    id: 'mod-1',
                    type: 'BASIC_INFO',
                    data: {
                        handoverName: '김개발',
                        affiliation: '인사이트 랩 / 백엔드 개발자',
                        periodStart: '2024-01-15',
                        periodEnd: '2024-02-15',
                        emergencyContact: '010-1234-5678',
                        receiverName: '이신입'
                    }
                },
                {
                    id: 'mod-2',
                    type: 'ACCOUNT_ACCESS',
                    data: {
                        systemName: 'AWS 콘솔',
                        accessUrl: 'https://console.aws.amazon.com',
                        accountId: 'insight-lab-dev',
                        password: '(보안팀 문의)',
                        permissionLevel: 'ADMIN',
                        usageRule: '프로덕션 환경 변경 시 반드시 팀장 승인 필요'
                    }
                },
                {
                    id: 'mod-3',
                    type: 'TASK',
                    data: {
                        taskName: '주간 서버 모니터링',
                        taskType: 'ROUTINE',
                        importance: 'HIGH',
                        schedule: '매주 월요일 오전 9시',
                        duration: '약 1시간',
                        requiredTools: 'Grafana, AWS CloudWatch',
                        procedure: '1. Grafana 대시보드 확인\n2. CPU/메모리 사용량 체크\n3. 에러 로그 분석\n4. 슬랙 채널에 결과 공유',
                        output: '주간 모니터링 리포트',
                        status: 'NORMAL'
                    }
                },
                {
                    id: 'mod-4',
                    type: 'RISK',
                    data: {
                        riskTitle: '서버 과부하 시 대응',
                        riskDescription: '트래픽 급증으로 인한 서버 다운 가능성',
                        impact: 'HIGH',
                        triggerCondition: 'CPU 사용률 90% 이상 지속',
                        immediateResponse: '1. 오토스케일링 확인\n2. 불필요한 배치 작업 중단\n3. CDN 캐시 확인',
                        prevention: '정기적인 부하 테스트 및 모니터링 알림 설정',
                        externalShareStatus: 'INTERNAL_ONLY'
                    }
                },
                {
                    id: 'mod-5',
                    type: 'STAKEHOLDER',
                    data: {
                        personName: '박팀장',
                        organization: '인사이트 랩 / 개발팀장',
                        contact: '010-9876-5432',
                        role: '기술 의사결정, 코드 리뷰 승인'
                    }
                }
            ]
        }),
        spaceId: 1,
        userId: 1,
        userName: '김개발',
        groupName: '인사이트 랩',
        workName: '개발팀 인수인계',
        createdAt: '2024-01-15T09:00:00.000Z',
        modifiedAt: '2024-01-20T14:30:00.000Z',
        isDefault: true
    },
    {
        id: 1002,
        title: '인사이트 랩 프론트엔드 개발자 인수인계서',
        text: JSON.stringify({
            modules: [
                {
                    id: 'mod-fe-1',
                    type: 'BASIC_INFO',
                    data: {
                        handoverName: '최프론트',
                        affiliation: '인사이트 랩 / 프론트엔드 개발자',
                        periodStart: '2023-11-01',
                        periodEnd: '2023-12-01',
                        emergencyContact: '010-2222-3333',
                        receiverName: '정리액트'
                    }
                },
                {
                    id: 'mod-fe-2',
                    type: 'ACCOUNT_ACCESS',
                    data: {
                        systemName: 'Figma',
                        accessUrl: 'https://figma.com',
                        accountId: 'insight-lab-design',
                        password: '(디자인팀 문의)',
                        permissionLevel: 'MANAGER',
                        usageRule: '디자인 파일 수정 시 디자이너와 협의 필요'
                    }
                },
                {
                    id: 'mod-fe-3',
                    type: 'TASK',
                    data: {
                        taskName: '컴포넌트 라이브러리 관리',
                        taskType: 'ROUTINE',
                        importance: 'MEDIUM',
                        schedule: '매월 첫째 주',
                        duration: '약 2시간',
                        requiredTools: 'Storybook, npm',
                        procedure: '1. 신규 컴포넌트 문서화\n2. 스토리북 업데이트\n3. npm 패키지 버전 관리',
                        output: '컴포넌트 문서, 스토리북 배포',
                        status: 'NORMAL'
                    }
                },
                {
                    id: 'mod-fe-4',
                    type: 'DOCUMENT_CONTACT',
                    data: {
                        docTitle: '프론트엔드 코딩 컨벤션',
                        docType: '개발 가이드',
                        storageType: 'Notion',
                        docLocation: 'https://notion.so/insight-lab/fe-convention'
                    }
                }
            ]
        }),
        spaceId: 1,
        userId: 2,
        userName: '최프론트',
        groupName: '인사이트 랩',
        workName: '개발팀 인수인계',
        createdAt: '2023-11-01T10:00:00.000Z',
        modifiedAt: '2023-11-15T16:00:00.000Z',
        isDefault: true
    },
    {
        id: 1003,
        title: '인사이트 랩 DevOps 엔지니어 인수인계서',
        text: JSON.stringify({
            modules: [
                {
                    id: 'mod-ops-1',
                    type: 'BASIC_INFO',
                    data: {
                        handoverName: '이데브옵스',
                        affiliation: '인사이트 랩 / DevOps 엔지니어',
                        periodStart: '2023-08-01',
                        periodEnd: '2023-09-01',
                        emergencyContact: '010-4444-5555',
                        receiverName: '강클라우드'
                    }
                },
                {
                    id: 'mod-ops-2',
                    type: 'ACCOUNT_ACCESS',
                    data: {
                        systemName: 'Jenkins CI/CD',
                        accessUrl: 'https://jenkins.insight-lab.io',
                        accountId: 'admin',
                        password: '(인프라팀 Vault 참조)',
                        permissionLevel: 'ADMIN',
                        usageRule: '프로덕션 배포는 반드시 두 명 이상 확인'
                    }
                },
                {
                    id: 'mod-ops-3',
                    type: 'TASK',
                    data: {
                        taskName: 'CI/CD 파이프라인 유지보수',
                        taskType: 'ROUTINE',
                        importance: 'CRITICAL',
                        schedule: '장애 발생 시 즉시, 정기점검 매주 금요일',
                        duration: '상황에 따라 다름',
                        requiredTools: 'Jenkins, Docker, Kubernetes',
                        procedure: '1. 빌드 로그 확인\n2. 컨테이너 상태 점검\n3. 쿠버네티스 파드 모니터링\n4. 롤백 준비 확인',
                        output: '배포 완료 보고서',
                        status: 'NORMAL'
                    }
                },
                {
                    id: 'mod-ops-4',
                    type: 'ASSET',
                    data: {
                        itemName: '개발용 맥북 프로 16인치',
                        storageLocation: '개발팀 자리 A-12',
                        quantityStatus: '1대 / 양호',
                        lendingStatus: 'NOT_LOANED',
                        ownershipStatus: 'TEAM_OWNED',
                        assetManager: '총무팀 홍길동'
                    }
                },
                {
                    id: 'mod-ops-5',
                    type: 'DECISION_HISTORY',
                    data: {
                        decisionTitle: 'Kubernetes 도입 결정',
                        decisionContent: '기존 Docker Swarm에서 Kubernetes로 전환',
                        decisionReason: '확장성과 커뮤니티 지원 고려',
                        decisionDate: '2023-06-15',
                        decisionMaker: '박팀장',
                        hasAlternatives: 'YES',
                        changeImpact: '초기 러닝커브 있으나 장기적 이점 큼',
                        externalShareStatus: 'INTERNAL_ONLY'
                    }
                }
            ]
        }),
        spaceId: 1,
        userId: 3,
        userName: '이데브옵스',
        groupName: '인사이트 랩',
        workName: '개발팀 인수인계',
        createdAt: '2023-08-01T09:00:00.000Z',
        modifiedAt: '2023-08-20T11:00:00.000Z',
        isDefault: true
    }
];

// Default folders
const getDefaultFolders = () => [
    {
        id: 3001,
        name: '인수인계서',
        parentId: null,
        spaceId: 1,
        createdAt: '2023-08-01T09:00:00.000Z',
        type: 'FOLDER',
        isDefault: true
    }
];

// Default files (example attachments)
const getDefaultFiles = () => [
    {
        id: 2001,
        name: '서버_아키텍처_다이어그램.pdf',
        originalFileName: '서버_아키텍처_다이어그램.pdf',
        size: 245760,
        folderId: null,
        spaceId: 1,
        createdAt: '2024-01-15T10:00:00.000Z',
        type: 'FILE',
        uploaderName: '김개발',
        isDefault: true
    },
    {
        id: 2002,
        name: 'API_명세서_v2.1.pdf',
        originalFileName: 'API_명세서_v2.1.pdf',
        size: 512000,
        folderId: null,
        spaceId: 1,
        createdAt: '2024-01-16T11:00:00.000Z',
        type: 'FILE',
        uploaderName: '김개발',
        isDefault: true
    },
    {
        id: 2003,
        name: '프론트엔드_스타일가이드.pdf',
        originalFileName: '프론트엔드_스타일가이드.pdf',
        size: 184320,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-11-02T14:00:00.000Z',
        type: 'FILE',
        uploaderName: '최프론트',
        isDefault: true
    },
    {
        id: 2004,
        name: 'CI_CD_파이프라인_설정.pdf',
        originalFileName: 'CI_CD_파이프라인_설정.pdf',
        size: 327680,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-08-05T09:30:00.000Z',
        type: 'FILE',
        uploaderName: '이데브옵스',
        isDefault: true
    },
    {
        id: 2005,
        name: 'DB_스키마_설계서.pdf',
        originalFileName: 'DB_스키마_설계서.pdf',
        size: 398000,
        folderId: null,
        spaceId: 1,
        createdAt: '2024-01-10T09:00:00.000Z',
        type: 'FILE',
        uploaderName: '김개발',
        isDefault: true
    },
    {
        id: 2006,
        name: '보안_가이드라인_v1.0.pdf',
        originalFileName: '보안_가이드라인_v1.0.pdf',
        size: 276000,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-12-20T14:30:00.000Z',
        type: 'FILE',
        uploaderName: '이데브옵스',
        isDefault: true
    },
    {
        id: 2007,
        name: 'React_컴포넌트_문서.pdf',
        originalFileName: 'React_컴포넌트_문서.pdf',
        size: 456000,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-11-15T11:00:00.000Z',
        type: 'FILE',
        uploaderName: '최프론트',
        isDefault: true
    },
    {
        id: 2008,
        name: 'AWS_인프라_구성도.pdf',
        originalFileName: 'AWS_인프라_구성도.pdf',
        size: 892000,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-09-01T10:00:00.000Z',
        type: 'FILE',
        uploaderName: '이데브옵스',
        isDefault: true
    },
    {
        id: 2009,
        name: '코드_리뷰_체크리스트.pdf',
        originalFileName: '코드_리뷰_체크리스트.pdf',
        size: 125000,
        folderId: null,
        spaceId: 1,
        createdAt: '2024-01-05T16:00:00.000Z',
        type: 'FILE',
        uploaderName: '박팀장',
        isDefault: true
    },
    {
        id: 2010,
        name: '테스트_케이스_템플릿.pdf',
        originalFileName: '테스트_케이스_템플릿.pdf',
        size: 198000,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-10-15T09:30:00.000Z',
        type: 'FILE',
        uploaderName: '김개발',
        isDefault: true
    },
    {
        id: 2011,
        name: 'Git_브랜치_전략.pdf',
        originalFileName: 'Git_브랜치_전략.pdf',
        size: 167000,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-08-20T13:00:00.000Z',
        type: 'FILE',
        uploaderName: '이데브옵스',
        isDefault: true
    },
    {
        id: 2012,
        name: '디자인_시스템_가이드.pdf',
        originalFileName: '디자인_시스템_가이드.pdf',
        size: 723000,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-11-25T10:30:00.000Z',
        type: 'FILE',
        uploaderName: '최프론트',
        isDefault: true
    },
    {
        id: 2013,
        name: '장애_대응_매뉴얼.pdf',
        originalFileName: '장애_대응_매뉴얼.pdf',
        size: 345000,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-07-10T08:00:00.000Z',
        type: 'FILE',
        uploaderName: '이데브옵스',
        isDefault: true
    },
    {
        id: 2014,
        name: '성능_최적화_보고서.pdf',
        originalFileName: '성능_최적화_보고서.pdf',
        size: 567000,
        folderId: null,
        spaceId: 1,
        createdAt: '2024-01-08T15:00:00.000Z',
        type: 'FILE',
        uploaderName: '김개발',
        isDefault: true
    },
    {
        id: 2015,
        name: '외부_API_연동_가이드.pdf',
        originalFileName: '외부_API_연동_가이드.pdf',
        size: 412000,
        folderId: null,
        spaceId: 1,
        createdAt: '2023-12-01T11:30:00.000Z',
        type: 'FILE',
        uploaderName: '김개발',
        isDefault: true
    }
];

// Generate sample PDF content (simple text-based placeholder)
const generateSamplePdfContent = (title) => {
    // Create a simple text content that can be displayed
    const text = `[데모 파일]\n\n제목: ${title}\n\n이 파일은 데모용 샘플 파일입니다.\n실제 프로젝트에서는 진짜 파일이 업로드됩니다.\n\n인사이트 랩 - 개발자 동아리`;
    const blob = new Blob([text], { type: 'text/plain' });
    return blob;
};

// Initialize demo data with defaults
const initDemoData = () => {
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    // Always ensure default data exists
    const existingHandovers = JSON.parse(localStorage.getItem(STORAGE_KEYS.HANDOVERS) || '[]');
    const existingFiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
    const existingFolders = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS) || '[]');

    // Merge default handovers with existing (excluding duplicates)
    const defaultHandovers = getDefaultHandovers();
    const userHandovers = existingHandovers.filter(h => !h.isDefault && !DEFAULT_IDS.HANDOVERS.includes(h.id));
    const mergedHandovers = [...defaultHandovers, ...userHandovers];
    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(mergedHandovers));

    // Merge default files
    const defaultFiles = getDefaultFiles();
    const userFiles = existingFiles.filter(f => !f.isDefault && !DEFAULT_IDS.FILES.includes(f.id));
    const mergedFiles = [...defaultFiles, ...userFiles];
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(mergedFiles));

    // Merge default folders
    const defaultFolders = getDefaultFolders();
    const userFolders = existingFolders.filter(f => !f.isDefault && !DEFAULT_IDS.FOLDERS.includes(f.id));
    const mergedFolders = [...defaultFolders, ...userFolders];
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(mergedFolders));

    // Initialize file contents if needed
    if (!localStorage.getItem(STORAGE_KEYS.FILE_CONTENTS)) {
        localStorage.setItem(STORAGE_KEYS.FILE_CONTENTS, JSON.stringify({}));
    }

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
};

initDemoData();

// Helper functions
const getFiles = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.FILES) || '[]');
const setFiles = (files) => localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
const getFolders = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS) || '[]');
const setFolders = (folders) => localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
const getHandovers = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.HANDOVERS) || '[]');
const setHandovers = (handovers) => localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(handovers));
const getFileContents = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.FILE_CONTENTS) || '{}');
const setFileContents = (contents) => localStorage.setItem(STORAGE_KEYS.FILE_CONTENTS, JSON.stringify(contents));

let nextId = Date.now();
const generateId = () => nextId++;

// Mock API methods
const demoApi = {
    get: async (url, config = {}) => {
        const params = config.params || {};

        // Space info
        if (url === '/space') {
            return { data: DEMO_SPACE };
        }

        // User info
        if (url === '/user') {
            return { data: { id: 1, username: 'demo', name: '데모 사용자' } };
        }

        // User spaces
        if (url === '/userSpace/list' || url === '/userSpace/getAdminSpaces' || url === '/userSpace/getProfileSpaces') {
            return {
                data: [{
                    spaceId: 1,
                    groupName: '인사이트 랩',
                    workName: '개발팀 인수인계',
                    role: 'ADMIN',
                    status: 'ACTIVE'
                }]
            };
        }

        // Handover policy - always allow everything
        if (url === '/handover/policy') {
            return {
                data: {
                    canEdit: true,
                    canGeneratePdf: true,
                    pdfGeneratedAt: null,
                    lockReason: null,
                    spaceId: 1,
                    assignorId: 1,
                    assigneeId: 2
                }
            };
        }

        // Get single handover
        if (url === '/handover') {
            const handovers = getHandovers();
            const handover = handovers.find(h => h.id === parseInt(params.id));
            if (handover) {
                return { data: { ...handover, ...DEMO_SPACE } };
            }
            return { data: null };
        }

        // Get handovers by space
        if (url.startsWith('/handover/space/')) {
            const handovers = getHandovers();
            return { data: handovers };
        }

        // File list
        if (url === '/file/list') {
            const files = getFiles();
            const folders = getFolders();
            const folderId = params.folderId;

            const filteredFolders = folders
                .filter(f => f.parentId === folderId)
                .map(f => ({ ...f, type: 'FOLDER' }));

            const filteredFiles = files
                .filter(f => f.folderId === folderId)
                .map(f => ({ ...f, type: 'FILE' }));

            return { data: [...filteredFolders, ...filteredFiles] };
        }

        // File download/view
        if (url.match(/\/file\/\d+/)) {
            const fileId = parseInt(url.match(/\/file\/(\d+)/)[1]);
            const contents = getFileContents();
            const content = contents[fileId];
            const files = getFiles();
            const file = files.find(f => f.id === fileId);

            // For default files, generate sample content
            if (file && file.isDefault) {
                const sampleBlob = generateSamplePdfContent(file.name);
                return {
                    data: sampleBlob,
                    headers: { 'content-type': 'text/plain' }
                };
            }

            if (content) {
                // Convert base64 back to blob
                const byteCharacters = atob(content.data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: content.type });

                return {
                    data: blob,
                    headers: { 'content-type': content.type }
                };
            }

            throw new Error('File not found');
        }

        console.log('Demo API GET not handled:', url, params);
        return { data: null };
    },

    post: async (url, data, config = {}) => {
        // File upload
        if (url === '/file') {
            const formData = data;
            const files = getFiles();
            const contents = getFileContents();

            // Handle multiple files
            const uploadedFiles = [];
            const fileEntries = formData.getAll('files');
            const folderId = formData.get('folderId');
            const spaceId = formData.get('spaceId');

            for (const file of fileEntries) {
                const newFile = {
                    id: generateId(),
                    name: file.name,
                    originalFileName: file.name,
                    size: file.size,
                    folderId: folderId ? parseInt(folderId) : null,
                    spaceId: parseInt(spaceId),
                    createdAt: new Date().toISOString(),
                    type: 'FILE',
                    uploaderName: '데모 사용자',
                    isDefault: false
                };

                // Store file content as base64
                const reader = new FileReader();
                const contentPromise = new Promise((resolve) => {
                    reader.onload = () => {
                        const base64 = reader.result.split(',')[1];
                        contents[newFile.id] = {
                            data: base64,
                            type: file.type
                        };
                        setFileContents(contents);
                        resolve();
                    };
                    reader.readAsDataURL(file);
                });
                await contentPromise;

                files.push(newFile);
                uploadedFiles.push(newFile);
            }

            setFiles(files);
            return { data: uploadedFiles };
        }

        // Create folder
        if (url === '/file/folder') {
            const folders = getFolders();
            const newFolder = {
                id: generateId(),
                name: data.name,
                parentId: data.parentId || null,
                spaceId: data.spaceId,
                createdAt: new Date().toISOString(),
                type: 'FOLDER',
                isDefault: false
            };
            folders.push(newFolder);
            setFolders(folders);
            return { data: newFolder };
        }

        // Create handover
        if (url === '/handover/bySpace') {
            const handovers = getHandovers();
            const newHandover = {
                id: generateId(),
                title: data.title,
                text: data.text,
                spaceId: data.spaceId,
                userName: '데모 사용자',
                groupName: '인사이트 랩',
                workName: '개발팀 인수인계',
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                isDefault: false
            };
            handovers.unshift(newHandover);
            setHandovers(handovers);
            return { data: { id: newHandover.id } };
        }

        // Save handover PDF (no-op in demo)
        if (url === '/handover/save') {
            return { data: { success: true } };
        }

        console.log('Demo API POST not handled:', url, data);
        return { data: null };
    },

    put: async (url, data) => {
        // Update handover
        if (url === '/handover') {
            const handovers = getHandovers();
            const index = handovers.findIndex(h => h.id === data.id);
            if (index !== -1) {
                handovers[index] = {
                    ...handovers[index],
                    title: data.title,
                    text: data.text,
                    modifiedAt: new Date().toISOString()
                };
                setHandovers(handovers);
            }
            return { data: { success: true } };
        }

        // Rename folder
        if (url === '/file/folder') {
            const folders = getFolders();
            const index = folders.findIndex(f => f.id === data.id);
            if (index !== -1 && !folders[index].isDefault) {
                folders[index].name = data.name;
                setFolders(folders);
            }
            return { data: { success: true } };
        }

        // Rename file
        if (url === '/file') {
            const files = getFiles();
            const index = files.findIndex(f => f.id === data.id);
            if (index !== -1 && !files[index].isDefault) {
                files[index].name = data.originalFileName;
                files[index].originalFileName = data.originalFileName;
                setFiles(files);
            }
            return { data: { success: true } };
        }

        // Move file
        if (url === '/file/move') {
            const files = getFiles();
            const folders = getFolders();

            if (data.fileIds) {
                data.fileIds.forEach(id => {
                    const index = files.findIndex(f => f.id === id);
                    if (index !== -1) {
                        files[index].folderId = data.targetFolderId;
                    }
                });
                setFiles(files);
            }

            if (data.folderIds) {
                data.folderIds.forEach(id => {
                    const index = folders.findIndex(f => f.id === id);
                    if (index !== -1) {
                        folders[index].parentId = data.targetFolderId;
                    }
                });
                setFolders(folders);
            }

            return { data: { success: true } };
        }

        console.log('Demo API PUT not handled:', url, data);
        return { data: null };
    },

    delete: async (url, config = {}) => {
        const data = config.data || {};

        // Delete file (but not default files)
        if (url === '/file') {
            const files = getFiles();
            const file = files.find(f => f.id === data.id);
            if (file && file.isDefault) {
                return { data: { success: false, message: '기본 데모 파일은 삭제할 수 없습니다.' } };
            }
            const filtered = files.filter(f => f.id !== data.id);
            setFiles(filtered);

            // Also delete content
            const contents = getFileContents();
            delete contents[data.id];
            setFileContents(contents);

            return { data: { success: true } };
        }

        // Delete folder (but not default folders)
        if (url === '/file/folder') {
            const folders = getFolders();
            const folder = folders.find(f => f.id === data.id);
            if (folder && folder.isDefault) {
                return { data: { success: false, message: '기본 데모 폴더는 삭제할 수 없습니다.' } };
            }
            const filtered = folders.filter(f => f.id !== data.id);
            setFolders(filtered);
            return { data: { success: true } };
        }

        // Delete handover (but not default handovers)
        if (url === '/handover') {
            const handovers = getHandovers();
            const handover = handovers.find(h => h.id === data.id);
            if (handover && handover.isDefault) {
                return { data: { success: false, message: '기본 데모 인수인계서는 삭제할 수 없습니다.' } };
            }
            const filtered = handovers.filter(h => h.id !== data.id);
            setHandovers(filtered);
            return { data: { success: true } };
        }

        console.log('Demo API DELETE not handled:', url, data);
        return { data: null };
    }
};

// Export function to clear demo data (keeps default data)
export const clearDemoData = () => {
    // Only remove user-created data, keep defaults
    const handovers = getHandovers().filter(h => h.isDefault);
    const files = getFiles().filter(f => f.isDefault);
    const folders = getFolders().filter(f => f.isDefault);

    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(handovers));
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    localStorage.setItem(STORAGE_KEYS.FILE_CONTENTS, JSON.stringify({}));

    // Re-initialize to ensure defaults are in place
    initDemoData();
};

export default demoApi;
