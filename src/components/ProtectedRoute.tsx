import { useContext } from "react";
import { Navigate } from "react-router";
import { UserContext } from "../context/UserContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useContext(UserContext);

    if (loading) return null; // or a spinner
    return user ? <>{children}</> : <Navigate to="/home" />;
}

export default ProtectedRoute;