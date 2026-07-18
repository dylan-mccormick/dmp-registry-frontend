import { BrowserRouter, Route, Routes } from 'react-router';
import Modal from './components/Modal.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import './index.css';
import Account from './pages/Account.tsx';
import CreateRegistry from './pages/CreateRegistry.tsx';
import CreateRegistryAgent from './pages/CreateRegistryAgent.tsx';
import Dashboard from './pages/Dashboard.tsx';
import EditRegistryAgent from './pages/EditRegistryAgentRoles.tsx';
import EditUser from './pages/EditUser.tsx';
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import PageNotFound from './pages/PageNotFound.tsx';
import Register from './pages/Register.tsx';
import RegistryAgentManagement from './pages/RegistryAgentManagement.tsx';
import RegistryAuditLog from './pages/RegistryAuditLog.tsx';
import RegistryDashboard from './pages/RegistryDashboard.tsx';
import RegistrySettings from './pages/RegistrySettings.tsx';
import RegistryUserManagement from './pages/RegistryUserManagement.tsx';
import Users from './pages/Users.tsx';
import ComposeProviders from './context/ComposeProviders.tsx';
import { LoadingBannerProvider } from './context/LoadingBannerProvider.tsx';
import ModalContextProvider from './context/ModalContextProvider.tsx';
import NavContextProvider from './context/NavContextProvider.tsx';
import BannerContextProvider from './context/BannerContextProvider.tsx';
import UserContextProvider from './context/UserContextProvider.tsx';
import RegistryContextProvider from './context/RegistryContextProvider.tsx';
import LoadingBanner from './components/LoadingBanner.tsx';

const App = () => {

    return <>
        <ComposeProviders providers={[
            LoadingBannerProvider,
            ModalContextProvider,
            BannerContextProvider,
            UserContextProvider,
            RegistryContextProvider,
            NavContextProvider
        ]}>
            <div className="scrollbar-gutter-stable h-screen w-screen overflow-auto">
                <LoadingBanner />
                <Modal />
                <BrowserRouter>
                        <Routes>
                            <Route path="/home" element={<Home />} />
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                        <Route path="/user/:id/edit" element={<ProtectedRoute><EditUser /></ProtectedRoute>} />
                        <Route path="/registries/new" element={<ProtectedRoute><CreateRegistry /></ProtectedRoute>} />
                        <Route path="/registries/:registryId" element={<ProtectedRoute><RegistryDashboard /></ProtectedRoute>} />
                        <Route path="/registries/:registryId/users" element={<ProtectedRoute><RegistryUserManagement /></ProtectedRoute>} />
                        <Route path="/registries/:registryId/agents" element ={<ProtectedRoute><RegistryAgentManagement /></ProtectedRoute>} />
                        <Route path="/registries/:registryId/agents/new" element={<ProtectedRoute><CreateRegistryAgent /></ProtectedRoute>} />
                        <Route path="/registries/:registryId/agents/:agentId/edit" element={<ProtectedRoute><EditRegistryAgent /></ProtectedRoute>} />
                        <Route path="/registries/:registryId/logs" element={<ProtectedRoute><RegistryAuditLog /></ProtectedRoute>} />
                        <Route path="/registries/:registryId/settings" element={<ProtectedRoute><RegistrySettings /></ProtectedRoute>} />
                        <Route path="/login" element={<Login />}  />
                        <Route path="/register" element={<Register />} />
                        <Route path="/" element={<Home />} />
                        <Route path="*" element={ <PageNotFound /> } />
                    </Routes>
                </BrowserRouter>
            </div>
        </ComposeProviders>
    </>
}

export default App;