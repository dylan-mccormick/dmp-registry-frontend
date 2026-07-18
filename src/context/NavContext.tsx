import { createContext } from "react";

interface NavContextProps {
    navOpen: boolean,
    setNavOpen: (navOpen: boolean) => void;
}

export const NavContext = createContext<NavContextProps>({
    navOpen: false,
    setNavOpen: ( ) => { }
});