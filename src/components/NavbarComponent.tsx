
import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { NavContext } from "./NavContext";

export interface NavbarComponentProps {
    text: string;
    icon: React.ReactNode | string;
    to: string;
    disabled?: boolean;
}

const NavbarComponent = ({ text, icon, to, disabled }: NavbarComponentProps) => {
    const { setNavOpen } = useContext(NavContext);

    return <>
    <NavLink className={({ isActive }) => `flex rounded w-full hover:bg-gray-200 active:bg-gray-300 hover:cursor-pointer ${isActive ? 'font-bold' : ''} p-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} to={to} onClick={() => {
    if (window.innerWidth < 640) setNavOpen(false);
}}>
        <div className="h-6 w-6 mr-2 flex items-center justify-center">
            { typeof icon === "string" ? <img alt={`${text} Icon`} src={icon} className="h-full w-full" /> : icon }
        </div>
        <span className="px-1">{text}</span>
    </NavLink>
    </>
}

export default NavbarComponent;