import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 인수인계서 페이지
export default function Handover() {
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = location.pathname.includes('edit');

    const [formData, setFormData] = useState({ title: '', role: '', deadline: '', responsibilities: '', links: [''], notes: '' });
    const [attachedFile, setAttachedFile] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            setFormData({ title: '2023 Q4 마케팅 전략 기획 인계', role: 'Marketing Lead', deadline: '2023-11-15', responsibilities: '1. 2024년 1분기 캠페인 기획안 초안 작성 완료\n2. 현재 진행 중인 소셜 미디어 광고 성과 분석', links: ['https://drive.google.com/drive/u/0/folders/...'], notes: '전임자(김철수 대리)가 작성해둔 가이드 문서를 참고하시면 됩니다.' });
            setAttachedFile({ name: '2023_Guide_v2.pdf' });
        }
    }, [isEditMode]);

    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleLinkChange = (index, value) => { const newLinks = [...formData.links]; newLinks[index] = value; setFormData(prev => ({ ...prev, links: newLinks })); };
    const handleAddLink = () => setFormData(prev => ({ ...prev, links: [...prev.links, ''] }));
    const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]); };
    const handleRemoveFile = () => setAttachedFile(null);

    const handleSubmit = () => {
        if (!formData.title || !formData.role || !formData.deadline || !formData.responsibilities) { alert('필수 요소(*)를 모두 입력해주세요.'); return; }
        alert(isEditMode ? '인수인계서가 성공적으로 수정되었습니다.' : '인수인계서가 생성되었습니다.'); navigate(-1);
    };

    return (
        <div style={styles.pageBackground}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <div style={styles.homeIcon} onClick={() => navigate('/')}><span className="material-icons" style={{ color: '#fff', fontSize: '18px' }}>home</span></div>
                    <div style={styles.headerTitleBox}>
                        <h1 style={styles.headerTitle}>{isEditMode ? '인수인계서 수정' : '인수인계서 작성'}</h1>
                        {isEditMode && <p style={styles.headerSubTitle}>Project Alpha Marketing H/O (2023-10-25)</p>}
                    </div>
                </div>
                <div style={styles.headerRight}>
                    {isEditMode && <span style={styles.autoSaveText}>자동 저장됨</span>}
                    <div style={styles.profileAvatar} onClick={() => navigate('/profile')}>SD</div>
                </div>
            </header>

            <main style={styles.mainContainer}>
                <section style={styles.panel}>
                    <div style={{ ...styles.panelHeader, backgroundColor: '#2563EB' }}></div>
                    <div style={styles.panelTitleRow}><h2 style={styles.panelTitle}>필수 요소 (Required)</h2><span style={styles.requiredBadge}>필수 입력</span></div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>인수인계명 (Title) *</label>
                        <input name="title" style={styles.input} placeholder="예: 2023 Q4 마케팅 전략 기획 인계" value={formData.title} onChange={handleChange} />
                    </div>
                    <div style={styles.rowGrid}>
                        <div style={styles.formGroup}><label style={styles.label}>직책/역할 (Role) *</label><input name="role" style={styles.input} placeholder="예: Marketing Lead" value={formData.role} onChange={handleChange} /></div>
                        <div style={styles.formGroup}><label style={styles.label}>마감 기한 (Deadline) *</label><div style={styles.dateInputWrapper}><span className="material-icons" style={styles.dateIcon}>calendar_today</span><input type="date" name="deadline" style={styles.dateInput} value={formData.deadline} onChange={handleChange} /></div></div>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '32px' }}>
                        <label style={styles.label}>주요 업무 및 책임 (Key Responsibilities) *</label><p style={styles.helpText}>인계받는 사람이 수행해야 할 핵심 업무를 상세히 기술해주세요.</p>
                        <textarea name="responsibilities" style={styles.textarea} placeholder="업무 내용을 입력하세요..." value={formData.responsibilities} onChange={handleChange} />
                    </div>
                </section>

                <section style={styles.panel}>
                    <div style={{ ...styles.panelHeader, backgroundColor: '#64748B' }}></div>
                    <div style={styles.panelTitleRow}><h2 style={styles.panelTitle}>선택 요소 (Optional)</h2><span style={styles.optionalBadge}>추가 정보</span></div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>관련 링크 및 자료 (Resources)</label>
                        {formData.links.map((link, index) => (
                            <div key={index} style={{ ...styles.linkInputWrapper, marginBottom: '8px' }}><span className="material-icons" style={styles.linkIcon}>link</span><input style={styles.inputLink} placeholder="https://drive.google.com/..." value={link} onChange={(e) => handleLinkChange(index, e.target.value)} /></div>
                        ))}
                        <button style={styles.addLinkBtn} onClick={handleAddLink}><span className="material-icons" style={{ fontSize: '16px' }}>add</span> 링크 추가하기</button>
                    </div>
                    <div style={styles.formGroup}><label style={styles.label}>추가 메모 (Notes)</label><textarea name="notes" style={{ ...styles.textarea, minHeight: '120px' }} placeholder="전임자가 남기는 추가 팁이나 메모를 작성하세요." value={formData.notes} onChange={handleChange} /></div>
                    <div style={{ ...styles.formGroup, paddingBottom: '32px' }}>
                        <label style={styles.label}>파일 첨부 (Attachments)</label>
                        {!attachedFile ? (
                            <label style={styles.uploadBox}><input type="file" style={{ display: 'none' }} onChange={handleFileChange} /><span className="material-icons" style={styles.uploadIcon}>cloud_upload</span><p style={styles.uploadText}>파일 업로드</p><p style={styles.uploadHelpText}>PDF, DOCX up to 10MB</p></label>
                        ) : (
                            <div style={styles.attachedFileBox}><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={styles.pdfIconBox}><span className="material-icons" style={{ color: '#fff', fontSize: '16px' }}>picture_as_pdf</span></div><span style={styles.attachedFileName}>{attachedFile.name}</span></div><button style={styles.removeFileBtn} onClick={handleRemoveFile}>✕</button></div>
                        )}
                    </div>
                </section>
            </main>

            <footer style={styles.footerBar}>
                <div style={styles.footerInner}>
                    <button style={styles.cancelBtn} onClick={() => navigate(-1)}>취소</button><button style={styles.saveBtn} onClick={handleSubmit}><span className="material-icons" style={{ fontSize: '18px', marginRight: '6px' }}>save</span>저장하기</button>
                </div>
            </footer>
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { height: '64px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', zIndex: 10 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    homeIcon: { width: '32px', height: '32px', backgroundColor: '#64748B', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    headerTitleBox: { display: 'flex', flexDirection: 'column' },
    headerTitle: { fontSize: '18px', fontWeight: '700', color: '#111827' },
    headerSubTitle: { fontSize: '12px', color: '#6B7280', marginTop: '4px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '24px' },
    autoSaveText: { fontSize: '13px', color: '#6B7280' },
    profileAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4B5563', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
    mainContainer: { flex: 1, padding: '32px 40px 100px', display: 'flex', gap: '32px', maxWidth: '1440px', margin: '0 auto', width: '100%' },
    panel: { flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', position: 'relative' },
    panelHeader: { height: '6px', width: '100%', position: 'absolute', top: 0, left: 0 },
    panelTitleRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 32px 16px', borderBottom: '1px solid #F3F4F6' },
    panelTitle: { fontSize: '18px', fontWeight: '700', color: '#111827' },
    requiredBadge: { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' },
    optionalBadge: { backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' },
    formGroup: { padding: '24px 32px 0', display: 'flex', flexDirection: 'column' },
    rowGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    label: { fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: '600' },
    helpText: { fontSize: '12px', color: '#6B7280', marginBottom: '12px' },
    input: { padding: '12px 16px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '14px', color: '#111827', outline: 'none' },
    dateInputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    dateIcon: { position: 'absolute', left: '12px', color: '#9CA3AF', fontSize: '18px' },
    dateInput: { width: '100%', padding: '12px 16px 12px 40px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '14px', color: '#111827', outline: 'none' },
    textarea: { flex: 1, padding: '16px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '4px', fontSize: '14px', color: '#111827', outline: 'none', resize: 'vertical', minHeight: '200px', lineHeight: '1.6' },
    linkInputWrapper: { display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' },
    linkIcon: { padding: '12px', backgroundColor: '#F9FAFB', color: '#9CA3AF', borderRight: '1px solid #D1D5DB' },
    inputLink: { flex: 1, padding: '12px 16px', border: 'none', fontSize: '14px', color: '#111827', outline: 'none' },
    addLinkBtn: { alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px', color: '#2563EB', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', padding: 0 },
    uploadBox: { border: '1px dashed #D1D5DB', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#FAFAFA' },
    uploadIcon: { fontSize: '32px', color: '#9CA3AF', marginBottom: '12px' },
    uploadText: { fontSize: '14px', color: '#2563EB', marginBottom: '4px' },
    uploadHelpText: { fontSize: '11px', color: '#9CA3AF' },
    attachedFileBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '4px' },
    pdfIconBox: { width: '28px', height: '28px', backgroundColor: '#EF4444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    attachedFileName: { fontSize: '13px', color: '#374151', fontWeight: '500' },
    removeFileBtn: { background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '16px' },
    footerBar: { position: 'fixed', bottom: 0, left: 0, width: '100%', height: '80px', backgroundColor: '#F3F4F6', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
    footerInner: { display: 'flex', justifyContent: 'flex-end', gap: '16px', width: '100%', maxWidth: '1440px', padding: '0 40px' },
    cancelBtn: { padding: '12px 32px', backgroundColor: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '14px', color: '#374151', cursor: 'pointer', fontWeight: '600' },
    saveBtn: { padding: '12px 32px', backgroundColor: '#2563EB', border: 'none', borderRadius: '6px', fontSize: '14px', color: '#FFFFFF', display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '600' }
};