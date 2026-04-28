import { BrowserRouter, Route, Routes } from 'react-router';
import './index.css';
import Login from './Login.tsx';
import PageNotFound from './PageNotFound.tsx';
import Dashboard from './Dashboard.tsx';
import Home from './Home.tsx';
import { NavContext } from './components/NavContext.tsx';
import { useState } from 'react';

const App = () => {
    const [ navOpen, setNavOpen ] = useState(true);
    // const [ user, setUser ] = useState<{ username: string } | null>(null);

    return <>
        <NavContext.Provider value={{ navOpen, setNavOpen }} >
            <BrowserRouter>
                <Routes>
                    <Route path="/home" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Home />} />
                    <Route path="*" element={ <PageNotFound /> } />
                </Routes>
            </BrowserRouter>
        </NavContext.Provider>
    </>
}

export default App;