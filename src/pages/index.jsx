import Layout from "./Layout.jsx";

import Settings from "./Settings";

import Practice from "./Practice";

import Dashboard from "./Dashboard";

import Achievements from "./Achievements";

import Skills from "./Skills";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Settings: Settings,
    
    Practice: Practice,
    
    Dashboard: Dashboard,
    
    Achievements: Achievements,
    
    Skills: Skills,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Settings />} />
                
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Practice" element={<Practice />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Achievements" element={<Achievements />} />
                
                <Route path="/Skills" element={<Skills />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}