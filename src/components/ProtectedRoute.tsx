import { useContext } from "react";
import { Navigate } from "react-router";
import { UserContext } from "../context/UserContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useContext(UserContext);
    return user ? <>{children}</> : <Navigate to="/home" />;
}

export default ProtectedRoute;