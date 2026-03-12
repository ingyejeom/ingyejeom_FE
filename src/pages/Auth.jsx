import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function Auth() {
    const navigate = useNavigate();
    const [isLoginMode, setIsLoginMode] = useState(true);

    const [formData, setFormData] = useState({
        username: '', password: '', name: '', email: '',
    });

    // 페이지 진입 시 기존 토큰 제거 (login.html 로직 동일)
    useEffect(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoginMode) {
            // 1. 로그인 (토큰 2단계 발급)
            if (!formData.username || !formData.password) {
                alert('아이디와 비밀번호를 모두 입력해주세요.'); return;
            }

            try {
                // [Step 1] 로그인 요청 -> RefreshToken 발급
                const loginRes = await api.post('/login', {
                    username: formData.username,
                    password: formData.password
                });

                // axios는 헤더 키를 소문자로 반환함
                const refreshToken = loginRes.headers['refreshtoken'] || loginRes.headers['refresh-token'];
                if (!refreshToken) throw new Error("리프레시 토큰이 없습니다.");
                localStorage.setItem("refreshToken", refreshToken);

                // [Step 2] RefreshToken으로 AccessToken(Authorization) 발급 요청
                const authRes = await api.post('/auth', {}, {
                    headers: { 'RefreshToken': refreshToken }
                });

                const accessToken = authRes.headers['authorization'] || authRes.headers['Authorization'];
                if (accessToken) {
                    localStorage.setItem("accessToken", accessToken);
                    alert('로그인에 성공했습니다!');
                    navigate('/'); // 스페이스 목록(홈)으로 이동
                }
            } catch (error) {
                console.error('로그인 에러:', error);
                alert('로그인 실패: 아이디나 비밀번호를 확인해주세요.');
            }

        } else {
            // 2. 회원가입
            if (!formData.username || !formData.password || !formData.name || !formData.email) {
                alert('모든 항목을 입력해주세요.'); return;
            }

            try {
                await api.post('/user', formData);
                alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
                setIsLoginMode(true);
                setFormData({ ...formData, password: '' });
            } catch (error) {
                console.error('회원가입 에러:', error);
                alert('회원가입 실패: ' + (error.response?.data?.message || '오류가 발생했습니다.'));
            }
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setFormData({ username: '', password: '', name: '', email: '' });
    };

    return (
        <div style={styles.pageBackground}>
            <div style={styles.card}>
                <div style={styles.logoContainer}>
                    <div style={styles.logoIcon}></div><h1 style={styles.logoText}>INGYEJEOM</h1>
                </div>
                <div style={styles.titleSection}>
                    <h2 style={styles.title}>{isLoginMode ? '다시 오신 것을 환영합니다!' : '새로운 계정을 만들어보세요'}</h2>
                    <p style={styles.subtitle}>{isLoginMode ? '원활한 인수인계를 위해 로그인해주세요.' : '인수인계의 모든 것, INGYEJEOM과 함께 시작하세요.'}</p>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>아이디 (Username)</label>
                        <input name="username" type="text" style={styles.input} placeholder="로그인 아이디를 입력하세요" value={formData.username} onChange={handleChange} />
                    </div>
                    {!isLoginMode && (
                        <>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>이름 (Name)</label>
                                <input name="name" type="text" style={styles.input} placeholder="실명을 입력하세요 (예: 김철수)" value={formData.name} onChange={handleChange} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>이메일 (Email)</label>
                                <input name="email" type="email" style={styles.input} placeholder="example@company.com" value={formData.email} onChange={handleChange} />
                            </div>
                        </>
                    )}
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>비밀번호 (Password)</label>
                        <input name="password" type="password" style={styles.input} placeholder="비밀번호를 입력하세요" value={formData.password} onChange={handleChange} />
                    </div>
                    <button type="submit" style={styles.submitBtn}>{isLoginMode ? '로그인' : '회원가입 완료'}</button>
                </form>

                <div style={styles.toggleSection}>
                    <span style={styles.toggleText}>{isLoginMode ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}</span>
                    <button style={styles.toggleBtn} onClick={toggleMode} type="button">{isLoginMode ? '회원가입 하기' : '로그인 하기'}</button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#F3F4F6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    card: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', border: '1px solid #E5E7EB' },
    logoContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' },
    logoIcon: { width: '32px', height: '32px', backgroundColor: '#4F46E5', borderRadius: '8px' },
    logoText: { fontSize: '24px', fontWeight: '800', fontStyle: 'italic', color: '#111827', margin: 0 },
    titleSection: { textAlign: 'center', marginBottom: '32px' },
    title: { fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: '#6B7280' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
    input: { width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', color: '#111827', outline: 'none', backgroundColor: '#F9FAFB' },
    submitBtn: { width: '100%', padding: '16px', backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' },
    toggleSection: { marginTop: '32px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    toggleText: { fontSize: '14px', color: '#6B7280' },
    toggleBtn: { background: 'none', border: 'none', color: '#4F46E5', fontSize: '14px', fontWeight: '700', cursor: 'pointer', padding: 0 }
};