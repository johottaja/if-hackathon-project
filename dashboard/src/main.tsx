import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import SiteNav from './components/SiteNav';
import './styles.css';
if (new URLSearchParams(window.location.search).get('view') !== 'dashboard') {
  window.location.replace(`demo.html${window.location.search}${window.location.hash || '#heatmap'}`);
} else createRoot(document.getElementById('root')!).render(<React.StrictMode><SiteNav active="dashboard"/><App/></React.StrictMode>);
