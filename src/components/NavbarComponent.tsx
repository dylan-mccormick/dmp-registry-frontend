import { useContext } from "react";
import { NavLink } from "react-router";
import { NavContext } from "../context/NavContext";

export interface NavbarComponentProps {
    text: string;
    icon: React.ReactNode | string;
    to: string;
    disabled?: boolean;
}

const NavbarComponent = ({ text, icon, to, disabled }: NavbarComponentProps) => {
    const { setNavOpen } = useContext(NavContext);

    return <>
    <NavLink end className={({ isActive }) => `group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-meta transition-colors ${isActive ? 'bg-bg font-medium text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)]' : 'text-ink/80 hover:bg-rule/40 hover:text-ink'} ${disabled ? 'pointer-events-none opacity-40' : ''}`} to={to} onClick={() => {
    if (window.innerWidth < 640) setNavOpen(false);
}}>
        {({ isActive }) => <>
            <span className={`flex size-5 items-center justify-center [&>svg]:size-4.5 ${isActive ? 'text-blue' : 'text-legend group-hover:text-ink'}`}>
                { typeof icon === "string" ? <img alt="" src={icon} className="h-full w-full" /> : icon }
            </span>
            <span className="truncate">{text}</span>
        </>}
    </NavLink>
    </>
}

export default NavbarComponent;
