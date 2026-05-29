export const RegistryUserPermissions = {
    MANAGE_USERS: "MANAGE_USERS",
    READ_AGENTS: "READ_AGENTS",
    READ_USERS: "READ_REGISTRY",
    WRITE_AGENTS: "WRITE_AGENTS",
    WRITE_REGISTRY: "WRITE_REGISTRY"
} as const;

export type RegistryUserPermissions = typeof RegistryUserPermissions[keyof typeof RegistryUserPermissions];

export interface RegistryUser {
    id: number,
    username: string,
    registryId: number,
    permissions?: RegistryUserPermissions[]
}