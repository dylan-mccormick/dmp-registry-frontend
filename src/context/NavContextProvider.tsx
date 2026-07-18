import { useState, type ReactNode } from "react";
import { NavContext } from "./NavContext";

const NavContextProvider = ({ children }: { children: ReactNode }) => {
    const [ navOpen, setNavOpen ] = useState(() => window.innerWidth >= 640);

    return <NavContext.Provider value={{ navOpen, setNavOpen }}>
        { children }
    </NavContext.Provider>
};

export default NavContextProvider;