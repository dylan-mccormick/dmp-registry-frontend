import { useContext, useEffect, type ReactNode } from "react";
import Header from "./Header";
import Navbar from "./Navbar";
import type { NavbarComponentProps } from "./NavbarComponent";
import { NavContext } from "../context/NavContext";
import Banner from "./Banner";
import { UserContext } from "../context/UserContext";

interface StandardLayoutProps {
    children: ReactNode;
    title?: string;
    autoGenerateUsersNav?: boolean;
    navItems?: NavbarComponentProps[];
}

const StandardLayout = ({ children, title, navItems }: StandardLayoutProps) => {

    const { navOpen, setNavOpen } = useContext(NavContext);
    const { user } = useContext(UserContext);

    useEffect(() => {
        if (title) document.title = `${title} | DMP Registry`;
        else document.title = 'DMP Registry';
    }, [title]);

    return (
        <>
            <div className="flex flex-col h-screen overflow-hidden">
                <Header loggedInUser={user?.username || ""} hideNavbar={(navItems || []).length == 0} />
                <div className="flex flex-1 overflow-hidden">
                    {(navItems || []).length > 0 && <Navbar navItems={navItems || []} />}

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