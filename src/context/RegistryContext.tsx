import { createContext } from "react";
import type { Registry } from "../model/Registry";

export const RegistryContext = createContext({
    registry: null as Registry | null
});