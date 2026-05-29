import type { Registry } from "./Registry";
import type { RegistryUser, RegistryUserPermissions } from "./RegistryUser";

export interface RegistryAgent {
    id: number,
    registry: Registry,
    name: string,
    createdAt: Date,
    createdByUser: RegistryUser,

    permissions: RegistryUserPermissions
}