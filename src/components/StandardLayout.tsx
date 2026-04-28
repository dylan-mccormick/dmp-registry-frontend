import { useContext, type ReactNode } from "react";
import Header from "./Header";
import Navbar from "./Navbar";
import type { NavbarComponentProps } from "./NavbarComponent";
import { NavContext } from "./NavContext";

interface StandardLayoutProps {
    children: ReactNode;
    navItems?: NavbarComponentProps[];
}

const StandardLayout = ({ children, navItems }: StandardLayoutProps) => {

    const { navOpen, setNavOpen } = useContext(NavContext);


    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header hideNavbar={(navItems || []).length == 0} />
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
                    {children}
                </div>
            </div>
        </div>
    )}

export default StandardLayout;