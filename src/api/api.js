import axios from 'axios';

// axios.get(`http://172.18.156.162:8080/api/user`);

const api = axios.create({
    // 로컬 테스트용 주소
    // baseURL: 'http://localhost:8080/api',
    baseURL: 'http://172.18.147.255:8080/api',

    // 💡 5초(5000ms) 동안 응답이 없으면 무한 대기하지 않고 에러를 발생시킵니다.
    timeout: 5000,

    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// 요청(Request) 인터셉터: API 요청을 보내기 직전에 가로채서 토큰을 넣음
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;