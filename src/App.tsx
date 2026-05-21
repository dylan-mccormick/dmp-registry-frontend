import { BrowserRouter, Route, Routes } from 'react-router';
import './index.css';
import Login from './pages/Login.tsx';
import PageNotFound from './pages/PageNotFound.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Home from './pages/Home.tsx';
import { NavContext } from './context/NavContext.tsx';
import { UserContext, UserPermission, type UserContextInterface } from './context/UserContext.tsx';
import { useEffect, useState } from 'react';
import Register from './pages/Register.tsx';
import Users from './pages/Users.tsx';
import type { BannerContext } from './context/BannerContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import apiClient from './apiClient.ts';
import Account from './pages/Account.tsx';
import EditUser from './pages/EditUser.tsx';
import { ModalContext, type ModalConfig } from './context/ModalContext.tsx';
import Modal from './components/Modal.tsx';

const App = () => {
    const [ navOpen, setNavOpen ] = useState(() => window.innerWidth >= 640);
    const [ banner, setBanner ] = useState<BannerContext | null>(null);
    const [ modal, setModal ] = useState<ModalConfig | null>(null);
    const [ user, setUser ] = useState<UserContextInterface | null>(null);
    const [ loading, setLoading ] = useState(true);

    const showModal = (config: ModalConfig) => setModal(config);
    const closeModal = () => setModal(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await apiClient.get("/api/v1/users/auth/me");

                if (!res.ok) {
                    if (res.status === 401) {
                        setUser(null);
                        return;
                    }
                    setBanner({ message: "An error occurred while fetching user data.", level: "error" });
                    return;
                }

                const userData = await res.json();

                // fetch permissions
                const permRes = await apiClient.get("/api/v1/users/permissions");
                if (!permRes.ok) {
                    setBanner({ message: "Failed to fetch user permissions.", level: "error" });
                    setUser(userData);
                    return;
                }

                const permissions: string[] = await permRes.json();
                setUser({
                    ...userData,
                    permissions: permissions.map(p => UserPermission[p as keyof typeof UserPermission])
                });

            } catch (err) {
                console.error(err);
                setUser(null);
                setBanner({ message: "Failed to fetch user data.", level: "error" });
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">
            <p>Loading...</p>
        </div>
    }

    return <>
        <UserContext.Provider value={{ user, setUser }}>
            <NavContext.Provider value={{ navOpen, setNavOpen, banner, setBanner }} >
                <ModalContext.Provider value={{ showModal, closeModal }} >
                    {modal && <Modal config={modal} onClose={closeModal} />}
                    <BrowserRouter>
                        <Routes>
                            <Route path="/home" element={<Home />} />
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                            <Route path="/user/:id/edit" element={<ProtectedRoute><EditUser /></ProtectedRoute>} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/" element={<Home />} />
                            <Route path="*" element={ <PageNotFound /> } />
                        </Routes>
                    </BrowserRouter>
                </ModalContext.Provider>
            </NavContext.Provider>
        </UserContext.Provider>
    </>
}

export default App;