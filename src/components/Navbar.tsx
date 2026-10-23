import { useContext } from "react";
import type { NavbarComponentProps } from "./NavbarComponent";
import NavbarComponent from "./NavbarComponent";
import { NavContext } from "../context/NavContext";

interface NavbarProps {
    navItems: NavbarComponentProps[];
}

const Navbar = ({ navItems }: NavbarProps) => {
    const { navOpen } = useContext(NavContext);

    return (
        <>
            {navOpen && (
                <nav className="fixed inset-y-0 left-0 top-14 z-20 w-72 max-w-[85vw] overflow-y-auto border-r border-rule/60 bg-surface/95 p-3 backdrop-blur-xl animate-fade-in sm:static sm:w-64 sm:shrink-0 sm:bg-surface/60 sm:animate-none">
                    <ul className="flex flex-col gap-0.5">
                        {navItems.map(item => (
                            <li key={item.to}>
                                <NavbarComponent text={item.text} icon={item.icon} to={item.to} disabled={item.disabled} />
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </>
    );
}

export default Navbar;
