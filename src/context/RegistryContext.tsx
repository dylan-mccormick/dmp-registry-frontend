import { createContext } from "react";
import type { Registry } from "../model/Registry";
import type { RegistryUser } from "../model/RegistryUser";

interface RegistryContext {
    registry: Registry | undefined,
    setRegistry: (registry: Registry | undefined) => void;
    localUser: RegistryUser | undefined,
    setLocalUser: (user: RegistryUser | undefined) => void;
}

export const RegistryContext = createContext<RegistryContext>({
    registry: undefined,
    setRegistry: () => {},
    localUser: undefined,
    setLocalUser: () => {}
});