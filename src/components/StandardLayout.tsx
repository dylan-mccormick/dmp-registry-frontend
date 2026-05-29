import { useContext, useEffect, type ReactNode } from "react";
import Header from "./Header";
import Navbar from "./Navbar";
import type { NavbarComponentProps } from "./NavbarComponent";
import { NavContext } from "../context/NavContext";
import Banner from "./Banner";
import { UserContext } from "../context/UserContext";
import { NavbarLevel } from "../context/NavbarLevel";
import { Database, Gauge, Link, Settings, SlidersHorizontal, Undo2, UserKey, Users } from "lucide-react";
import { useParams } from "react-router";

interface StandardLayoutProps {
    children: ReactNode;
    title?: string;
    autoGenerateUsersNav?: boolean;
    navItems?: NavbarComponentProps[];
    navbarLevel?: NavbarLevel;
}

const StandardLayout = ({ children, title, navItems, navbarLevel }: StandardLayoutProps) => {

    const { navOpen, setNavOpen } = useContext(NavContext);
    const { user } = useContext(UserContext);

    const { registryId } = useParams();

    useEffect(() => {
        if (title) document.title = `${title} | DMP Registry`;
        else document.title = 'DMP Registry';
    }, [title]);

    const renderedNavItems = (() => {
        const items: NavbarComponentProps[] = [];

        if (navbarLevel === NavbarLevel.TOP) {
            items.push({ text: "Dashboard", to: "/dashboard", icon: <Gauge /> });

            if (user?.permissions.includes("MANAGE_USERS")) {
                items.push({ text: "User Management", to: "/users", icon: <Users /> });
            }

            items.push({ text: "Account", to: "/profile", icon: <Settings /> });
        }

        if (navbarLevel === NavbarLevel.REGISTRY) {
            items.push({ text: "Return to Dashboard", icon: <Undo2 />, to: "/dashboard" });
            items.push({ text: "Registry Dashboard", icon: <Database />, to: `/registries/${registryId}` });
            items.push({ text: "Manage Users", icon: <UserKey />, to: `/registries/${registryId}/users` });
            items.push({ text: "Manage Agents", icon: <Link />, to: `/registries/${registryId}/agents` });
            items.push({ text: "Registry Settings", icon: <SlidersHorizontal />, to: `/registries/${registryId}/settings` });
        }

        return [...(navItems || []), ...items];
    })();

    return (
        <>
            <div className="flex flex-col h-screen overflow-hidden">
                <Header loggedInUser={user?.username || ""} hideNavbar={(renderedNavItems || []).length == 0} />
                <div className="flex flex-1 overflow-hidden">
                    {(renderedNavItems || []).length > 0 && <Navbar navItems={renderedNavItems || []} />}

                    {/* Backdrop */}
                    {navOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 sm:hidden z-10"
                            onClick={() => setNavOpen(false)}
                        />
                    )}

                    <div className={`flex-1 overflow-y-auto ${navOpen ? 'hidden sm:block' : ''}`}>
                        {<Banner></Banner>}

                        {children}
                    </div>
                </div>
            </div>
        </>
    )}

export default StandardLayout;