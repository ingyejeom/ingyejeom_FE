import axios from 'axios';

// axios.get(`http://172.18.156.162:8080/api/user`);

const api = axios.create({
    // 로컬 테스트용 주소
    // baseURL: 'http://localhost:8080/api',
    baseURL: 'http://172.18.147.31:8080/api',

    // 💡 5초(5000ms) 동안 응답이 없으면 무한 대기하지 않고 에러를 발생시킵니다.
    timeout: 5000,

    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// 요청(Request) 인터셉터
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 응답(Response) 인터셉터 추가
api.interceptors.response.use(
    (response) => {
        return response; // 정상 응답은 그대로 통과
    },
    (error) => {
        // 백엔드에서 401(인증 실패/만료) 에러가 오면 자동 로그아웃 처리
        if (error.response && error.response.status === 401) {
            alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
            localStorage.clear(); // 로컬 스토리지 비우기
            window.location.href = '/auth'; // 로그인 창으로 강제 이동
        }
        return Promise.reject(error);
    }
);

export default api;