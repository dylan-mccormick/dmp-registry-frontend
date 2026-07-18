import { useState, type ReactNode } from "react";
import type { Registry } from "../model/Registry";
import type { RegistryUser } from "../model/RegistryUser";
import { RegistryContext } from "./RegistryContext";

const RegistryContextProvider = ({ children }: { children: ReactNode }) => {
    const [ registry, setRegistry ] = useState<Registry | undefined>(undefined);
    const [ localUser, setLocalUser ] = useState<RegistryUser | undefined>(undefined);

    return <RegistryContext.Provider value={{ registry, setRegistry, localUser, setLocalUser }}>
        { children }
    </RegistryContext.Provider>
};

export default RegistryContextProvider;