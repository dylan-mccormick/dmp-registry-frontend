import type { RegistryAgent } from "./RegistryAgent";
import type { RegistryType } from "./RegistryType";
import type { RegistryUser } from "./RegistryUser";

export interface Registry {
    id: number,
    name: string,
    type: RegistryType,
    storageLocation: string,
    createdAt: Date,
    createdByUser?: RegistryUser,

    users?: RegistryUser[],
    agents?: RegistryAgent[]
};