import axios from 'axios';
import React from 'react';

// axios.get(`http://172.18.156.162:8080/api/user`);

const api = axios.create({
    baseURL: 'http://172.18.147.255:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// ✨ 요청(Request) 인터셉터: API 요청을 보내기 직전에 가로채서 토큰을 넣음
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        // 토큰에 Bearer가 포함되어 있지 않다면 붙여서 전송
        config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;