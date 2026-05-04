/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext, type SetStateAction } from "react";
import type { BannerContext } from "./BannerContext";

export const NavContext = createContext({
    navOpen: false,
    setNavOpen: (_: SetStateAction<boolean>) => { },
    banner: null as BannerContext | null,
    setBanner: (_: SetStateAction<BannerContext | null>) => { },
});