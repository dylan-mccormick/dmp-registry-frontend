import { useContext } from "react";
import type { NavbarComponentProps } from "./NavbarComponent";
import NavbarComponent from "./NavbarComponent";
import { NavContext } from "./NavContext";

interface NavbarProps {
    navItems: NavbarComponentProps[];
}

const Navbar = ({ navItems }: NavbarProps) => {
    const { navOpen } = useContext(NavContext);

    return (
        <>
            {navOpen && (
                <div className="h-full z-20 bg-white relative p-16 sm:p-4 overflow-y-auto w-full sm:w-64 sm:border-r border-gray-300">
                    {navItems.map(item => (
                        <NavbarComponent key={item.to} text={item.text} icon={item.icon} to={item.to} disabled={item.disabled} />
                    ))}
                </div>
            )}
        </>
    );
}

export default Navbar;