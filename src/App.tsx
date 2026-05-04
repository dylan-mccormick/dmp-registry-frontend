import { BrowserRouter, Route, Routes } from 'react-router';
import './index.css';
import Login from './pages/Login.tsx';
import PageNotFound from './pages/PageNotFound.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Home from './pages/Home.tsx';
import { NavContext } from './context/NavContext.tsx';
import { UserContext, type UserContextInterface } from './context/UserContext.tsx';
import { useEffect, useState } from 'react';
import Register from './pages/Register.tsx';
import type { BannerContext } from './context/BannerContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import apiClient from './apiClient.ts';

const App = () => {
    const [ navOpen, setNavOpen ] = useState(true);
    const [ banner, setBanner ] = useState<BannerContext | null>(null);
    const [ user, setUser ] = useState<UserContextInterface | null>(null);
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        apiClient.get("/api/v1/users/auth/me")
            .then(res => {
                console.log(res);
                if (!res.ok) {
                    if (res.status === 401) {
                        return null; // not logged in, not an error
                    }

                    if (res.status === 403) {
                        setBanner({ message: "You do not have permission to access this resource.", level: "error" });
                        return null;
                    }

                    setBanner({ message: "An error occurred while fetching user data.", level: "error" });
                    return null;
                }
                return res.json();
            })
            .then(setUser)
            .catch((err) => {
                console.log(err);
                setUser(null);
                setBanner({ message: "Failed to fetch user data.", level: "error" });
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">
            <p>Loading...</p>
        </div>
    }

    return <>
        <UserContext.Provider value={{ user, setUser }}>
            <NavContext.Provider value={{ navOpen, setNavOpen, banner, setBanner }} >
                <BrowserRouter>
                    <Routes>
                        <Route path="/home" element={<Home />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Home />} />
                        <Route path="*" element={ <PageNotFound /> } />
                    </Routes>
                </BrowserRouter>
            </NavContext.Provider>
        </UserContext.Provider>
    </>
}

export default App;