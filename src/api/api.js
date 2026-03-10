// src/api/api.js 예시
import { mockSpaces } from '../data/mockData';

export const getSpaces = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockSpaces);
        }, 500);
    });
};