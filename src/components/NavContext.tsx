import { createContext } from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const NavContext = createContext({ navOpen: false, setNavOpen: (_: boolean) => { } });