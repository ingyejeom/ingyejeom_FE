import React, { createContext, useContext } from 'react';
import demoApi from './demoApi';
import realApi from '../api/api';

const DemoContext = createContext({
    isDemoMode: false,
    api: realApi
});

export const DemoProvider = ({ children }) => {
    return (
        <DemoContext.Provider value={{ isDemoMode: true, api: demoApi }}>
            {children}
        </DemoContext.Provider>
    );
};

export const useDemo = () => useContext(DemoContext);

export default DemoContext;
