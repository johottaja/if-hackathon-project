import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import SiteNav from './components/SiteNav';
import './styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><SiteNav active="dashboard"/><App/></React.StrictMode>);
