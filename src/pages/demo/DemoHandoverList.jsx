import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../demo/demoApi';
import DemoHandoverDocumentView from './DemoHandoverDocumentView';

export default function DemoHandoverList() {
    const navigate = useNavigate();
    const spaceId = '1'; // Fixed demo space

    const [isLoading, setIsLoading] = useState(true);
    const [spaceInfo, setSpaceInfo] = useState({ workName: '', groupName: '' });
    const [handovers, setHandovers] = useState([]);
    const [handoverPdfs, setHandoverPdfs] = useState([]);
    const [viewingHandoverId, setViewingHandoverId] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Load space info
                const spaceRes = await api.get('/space', { params: { id: spaceId } });
                setSpaceInfo({
                    workName: spaceRes.data.workName || '',
                    groupName: spaceRes.data.groupName || ''
                });

                // Load handovers for this space
                const handoverRes = await api.get(`/handover/space/${spaceId}`);
                const handoverList = handoverRes.data || [];
                // Sort by createdAt descending (latest first)
                handoverList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setHandovers(handoverList);

                // Load PDFs from 인수인계서 folder
                const rootRes = await api.get('/file/list', { params: { spaceId, folderId: null } });
                const folder = rootRes.data.find(item => item.type === 'FOLDER' && item.name === '인수인계서');
                if (folder) {
                    const pdfRes = await api.get('/file/list', { params: { spaceId, folderId: folder.id } });
                    const pdfFiles = pdfRes.data.filter(item =>
                        item.type === 'FILE' && (item.name?.endsWith('.pdf') || item.originalFileName?.endsWith('.pdf'))
                    ) || [];
                    setHandoverPdfs(pdfFiles);
                }
            } catch (error) {
                console.error('Failed to load handovers:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [spaceId]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return dateStr.split('T')[0];
    };

    const findMatchingPdf = (handover) => {
        if (!handoverPdfs.length || !handover) return null;
        const handoverTitle = handover.title;
        const handoverDate = handover.createdAt?.split('T')[0];

        return handoverPdfs.find(pdf => {
            const pdfName = (pdf.name || pdf.originalFileName || '').toLowerCase();
            return (handoverTitle && pdfName.includes(handoverTitle.substring(0, Math.min(10, handoverTitle.length)).toLowerCase())) ||
                (handoverDate && pdfName.includes(handoverDate));
        }) || null;
    };

    const findMatchingHandover = (pdf) => {
        if (!handovers.length || !pdf) return null;
        const pdfName = (pdf.name || pdf.originalFileName || '').toLowerCase();

        return handovers.find(handover => {
            const handoverTitle = handover.title;
            const handoverDate = handover.createdAt?.split('T')[0];
            return (handoverTitle && pdfName.includes(handoverTitle.substring(0, Math.min(10, handoverTitle.length)).toLowerCase())) ||
                (handoverDate && pdfName.includes(handoverDate));
        }) || null;
    };

    if (isLoading) {
        return (
            <div style={styles.pageBackground}>
                <div style={styles.loading}>로딩 중...</div>
            </div>
        );
    }

    const latestHandover = handovers[0];
    const previousHandovers = handovers.slice(1);
    const hasPdf = latestHandover ? findMatchingPdf(latestHandover) !== null : false;

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate('/demo/archive')}>
                    <span style={styles.backIcon}>←</span> 이전
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={styles.demoBadge}>DEMO</span>
                    <h1 style={styles.headerTitle}>인수인계서</h1>
                </div>
                <div style={styles.headerSpacer}></div>
            </header>

            <main style={styles.main}>
                <div style={styles.titleSection}>
                    <h1 style={styles.pageTitle}>인수인계서 목록</h1>
                    <p style={styles.pageSubtitle}>{spaceInfo.groupName} - {spaceInfo.workName}</p>
                </div>

                {/* Latest Handover Section */}
                <div style={styles.listContainer}>
                    {!latestHandover ? (
                        <div style={styles.emptyState}>
                            <span style={styles.emptyIcon}>📄</span>
                            <p style={styles.emptyText}>아직 작성된 인수인계서가 없습니다.</p>
                        </div>
                    ) : (
                        <div
                            style={styles.handoverCard}
                            onClick={() => setViewingHandoverId(latestHandover.id)}
                        >
                            <div style={styles.cardLeft}>
                                <div style={styles.cardIcon}>
                                    {hasPdf ? '📄' : '📝'}
                                </div>
                                <div style={styles.cardInfo}>
                                    <div style={styles.cardTitleRow}>
                                        <h3 style={styles.cardTitle}>{latestHandover.title}</h3>
                                        <span style={styles.latestBadge}>LATEST</span>
                                        {hasPdf && <span style={styles.pdfBadge}>PDF</span>}
                                    </div>
                                    <p style={styles.cardMeta}>
                                        작성자: {latestHandover.userName} | 작성일: {formatDate(latestHandover.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <span className="material-icons" style={styles.cardArrow}>chevron_right</span>
                        </div>
                    )}
                </div>

                {/* PDF Files Section */}
                {handoverPdfs.length > 0 && (
                    <div style={styles.pdfSection}>
                        <h2 style={styles.sectionTitle}>생성된 PDF 파일 ({handoverPdfs.length})</h2>
                        <div style={styles.pdfGrid}>
                            {handoverPdfs.map(pdf => {
                                const matchingHandover = findMatchingHandover(pdf);
                                return (
                                    <div
                                        key={pdf.id}
                                        style={styles.pdfCard}
                                        onClick={() => {
                                            if (matchingHandover) {
                                                setViewingHandoverId(matchingHandover.id);
                                            } else {
                                                alert('해당 PDF와 연결된 인수인계서를 찾을 수 없습니다.');
                                            }
                                        }}
                                    >
                                        <span style={styles.pdfIcon}>📄</span>
                                        <div style={styles.pdfInfo}>
                                            <span style={styles.pdfName}>{pdf.name || pdf.originalFileName}</span>
                                            <span style={styles.pdfDate}>{formatDate(pdf.createdAt)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Previous Handovers Section (Demo-only: to show sample data) */}
                {previousHandovers.length > 0 && (
                    <div style={styles.previousSection}>
                        <h2 style={styles.sectionTitle}>이전 인수인계서 ({previousHandovers.length})</h2>
                        <div style={styles.previousList}>
                            {previousHandovers.map(handover => {
                                const handoverHasPdf = findMatchingPdf(handover) !== null;
                                return (
                                    <div
                                        key={handover.id}
                                        style={styles.previousCard}
                                        onClick={() => setViewingHandoverId(handover.id)}
                                    >
                                        <div style={styles.cardLeft}>
                                            <div style={styles.previousIcon}>
                                                {handoverHasPdf ? '📄' : '📝'}
                                            </div>
                                            <div style={styles.cardInfo}>
                                                <div style={styles.cardTitleRow}>
                                                    <h3 style={styles.previousTitle}>{handover.title}</h3>
                                                    {handoverHasPdf && <span style={styles.pdfBadge}>PDF</span>}
                                                    {handover.isDefault && <span style={styles.defaultBadge}>샘플</span>}
                                                </div>
                                                <p style={styles.cardMeta}>
                                                    작성자: {handover.userName} | 작성일: {formatDate(handover.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="material-icons" style={styles.cardArrow}>chevron_right</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* Document View Modal */}
            {viewingHandoverId && (
                <DemoHandoverDocumentView
                    handoverId={viewingHandoverId}
                    onClose={() => setViewingHandoverId(null)}
                />
            )}
        </div>
    );
}

const styles = {
    pageBackground: {
        backgroundColor: '#f3f4f6',
        minHeight: '100vh'
    },
    loading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#6b7280'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb'
    },
    backBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        backgroundColor: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        cursor: 'pointer'
    },
    backIcon: {
        fontSize: '16px'
    },
    headerTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        margin: 0
    },
    demoBadge: {
        padding: '2px 8px',
        backgroundColor: '#FEF3C7',
        color: '#92400E',
        fontSize: '11px',
        fontWeight: '600',
        borderRadius: '4px'
    },
    headerSpacer: {
        width: '80px'
    },
    main: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '32px 24px'
    },
    titleSection: {
        marginBottom: '32px'
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#111827',
        marginBottom: '8px'
    },
    pageSubtitle: {
        fontSize: '14px',
        color: '#6b7280'
    },
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: '16px',
        display: 'block'
    },
    emptyText: {
        fontSize: '14px',
        color: '#6b7280'
    },
    handoverCard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    cardLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
    },
    cardIcon: {
        fontSize: '32px'
    },
    cardInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    cardTitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    cardTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827',
        margin: 0
    },
    latestBadge: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#059669',
        backgroundColor: '#d1fae5',
        padding: '2px 8px',
        borderRadius: '4px'
    },
    pdfBadge: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#dc2626',
        backgroundColor: '#fee2e2',
        padding: '2px 8px',
        borderRadius: '4px'
    },
    defaultBadge: {
        fontSize: '10px',
        fontWeight: '700',
        color: '#7c3aed',
        backgroundColor: '#ede9fe',
        padding: '2px 8px',
        borderRadius: '4px'
    },
    cardMeta: {
        fontSize: '13px',
        color: '#6b7280',
        margin: 0
    },
    cardArrow: {
        color: '#9ca3af',
        fontSize: '20px'
    },
    pdfSection: {
        marginTop: '40px'
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '16px'
    },
    pdfGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '12px'
    },
    pdfCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer'
    },
    pdfIcon: {
        fontSize: '24px'
    },
    pdfInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: 1,
        minWidth: 0
    },
    pdfName: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    pdfDate: {
        fontSize: '12px',
        color: '#9ca3af'
    },
    previousSection: {
        marginTop: '40px'
    },
    previousList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    previousCard: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    previousIcon: {
        fontSize: '24px'
    },
    previousTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        margin: 0
    }
};
