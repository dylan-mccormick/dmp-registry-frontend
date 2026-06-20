/* eslint-disable @typescript-eslint/no-unused-vars */

import { createContext, type SetStateAction } from "react";
import type { Registry } from "../model/Registry";
import type { RegistryUser } from "../model/RegistryUser";

export const RegistryContext = createContext({
    registry: null as Registry | null,
    setRegistry: (_: SetStateAction<Registry | null>) => {},
    localUser: null as RegistryUser | null,
    setLocalUser: (_: SetStateAction<RegistryUser | null>) => {}
});