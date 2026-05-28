import { useContext, useEffect, type ReactNode } from "react";
import Header from "./Header";
import Navbar from "./Navbar";
import type { NavbarComponentProps } from "./NavbarComponent";
import { NavContext } from "../context/NavContext";
import Banner from "./Banner";
import { UserContext } from "../context/UserContext";
import { NavbarLevel } from "../context/NavbarLevel";
import { Gauge, Settings, UsersRound } from "lucide-react";

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

    useEffect(() => {
        if (title) document.title = `${title} | DMP Registry`;
        else document.title = 'DMP Registry';
    }, [title]);

    const renderedNavItems = (() => {
        const items: NavbarComponentProps[] = [];

        if (navbarLevel === NavbarLevel.TOP) {
            items.push({ text: "Dashboard", to: "/dashboard", icon: <Gauge /> });

            if (user?.permissions.includes("MANAGE_USERS")) {
                items.push({ text: "User Management", to: "/users", icon: <UsersRound /> });
            }

            items.push({ text: "Account", to: "/profile", icon: <Settings /> });
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