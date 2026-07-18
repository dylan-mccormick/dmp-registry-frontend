import { createContext } from "react";

export interface SetBannerArgs {
    message: string;
    level: "success" | "error" | "info";
}

interface BannerContextProps {
    banner: SetBannerArgs | undefined;
    setBanner: ( args: SetBannerArgs | undefined ) => void;
}

export const BannerContext = createContext<BannerContextProps>({
    banner: undefined,
    setBanner: () => {}
})