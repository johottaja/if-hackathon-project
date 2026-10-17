import React from 'react';
import {createRoot} from 'react-dom/client';
import LiveDemo from './LiveDemo.tsx';
import './demo.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><LiveDemo/></React.StrictMode>);
