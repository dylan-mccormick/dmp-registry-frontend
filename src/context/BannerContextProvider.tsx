import { useState, type ReactNode } from "react";
import { BannerContext, type SetBannerArgs } from "./BannerContext";

const BannerContextProvider = ({ children }: { children: ReactNode }) => {
    const [ banner, setBanner ] = useState<SetBannerArgs | undefined>(undefined);

    return <BannerContext.Provider value={{ banner, setBanner }}>
        { children }
    </BannerContext.Provider>
};

export default BannerContextProvider;