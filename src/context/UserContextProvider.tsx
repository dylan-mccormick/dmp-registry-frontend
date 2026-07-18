import { useContext, useEffect, useState, type ReactNode } from "react";
import apiClient from "../apiClient";
import { BannerContext } from "./BannerContext";
import { LoadingBannerContext } from "./LoadingBannerContext";
import { UserContext, UserPermission, type UserInterface } from "./UserContext";

const UserContextProvider = ({ children }: { children: ReactNode }) => {

    // Loading Context Dependencies
    const { addProcess, removeProcess } = useContext(LoadingBannerContext);
    const { setBanner } = useContext(BannerContext);

    // State Mgmt
    const [ user, setUser ] = useState<UserInterface | undefined>(undefined);
    const [ loading, setLoading ] = useState(true);
    const [ resetUser, setResetUser ] = useState(0);

    // Reset the user when requested
    useEffect(() => {
        addProcess("user_context_loading");
        const fetchUser = async () => {
            try {
                const res = await apiClient.get("/api/v1/users/auth/me");

                if (!res.ok) {
                    if (res.status === 401) {
                        setUser(undefined);
                        removeProcess("user_context_loading");
                        setLoading(false);
                        return;
                    }
                    setBanner({ message: "An error occurred while fetching user data.", level: "error" });
                    removeProcess("user_context_loading");
                    setLoading(false);
                    return;
                }

                const userData = await res.json();

                // fetch permissions
                const permRes = await apiClient.get("/api/v1/users/permissions");
                if (!permRes.ok) {
                    setBanner({ message: "Failed to fetch user permissions.", level: "error" });
                    setUser(userData);
                    removeProcess("user_context_loading");
                    setLoading(false);
                    return;
                }

                const permissions: string[] = await permRes.json();
                setUser({
                    ...userData,
                    permissions: permissions.map(p => UserPermission[p as keyof typeof UserPermission])
                });

            } catch (err) {
                console.error(err);
                setUser(undefined);
                setBanner({ message: "Failed to fetch user data.", level: "error" });
            } finally {
                removeProcess("user_context_loading");
                setLoading(false);
            }
        };

        fetchUser();
    }, [addProcess, removeProcess, resetUser, setBanner]);

    // Return the provider
    return <UserContext.Provider value={{ user, setUser, setResetUser, loading }}>
        { children }
    </UserContext.Provider>

};

export default UserContextProvider;