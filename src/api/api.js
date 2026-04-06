import axios from 'axios';

const api = axios.create({
    baseURL: 'https://ingyejeom.cloud/api',
    timeout: 300000,
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
    async (error) => {
        const originalRequest = error.config;

        // 백엔드에서 401(인증 실패/만료) 에러가 오고, 토큰 재시도를 아직 하지 않은 경우 (리프레시 로직)
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // 로컬 스토리지에서 리프레시 토큰 가져오기 (로그인 시 저장해둔 키값으로 맞춤 필요, 통상 refreshToken)
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                // 백엔드 AuthRestController 스펙에 맞춘 POST /api/auth 호출
                const res = await axios.post('https://ingyejeom.cloud/api/auth', {}, {
                    headers: {
                        'RefreshToken': refreshToken.startsWith('Bearer ') ? refreshToken : `Bearer ${refreshToken}`
                    },
                    withCredentials: true
                });

                // 백엔드 헤더에서 새 엑세스 토큰 추출 (보통 Authorization 등으로 넘어옴)
                const newAccessToken = res.headers['authorization'] || res.headers['accesstoken'];

                if (newAccessToken) {
                    localStorage.setItem('accessToken', newAccessToken);
                    originalRequest.headers.Authorization = newAccessToken.startsWith('Bearer ') ? newAccessToken : `Bearer ${newAccessToken}`;
                    // 새 토큰으로 기존 요청 재시도
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // 리프레시 토큰마저 만료되었거나 에러가 나면 로그아웃 처리
                localStorage.clear();
                window.location.href = '/auth';
                return Promise.reject(refreshError);
            }
        }

        // 재시도 후에도 401이거나 다른 일반 401 에러일 경우 팝업 없이 처리
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.href = '/auth';
        }

        return Promise.reject(error);
    }
);

export default api;