export const RegistryUserPermissions = {
    MANAGE_USERS: "MANAGE_USERS",
    READ_AGENTS: "READ_AGENTS",
    READ_REGISTRY: "READ_REGISTRY",
    WRITE_AGENTS: "WRITE_AGENTS",
    WRITE_REGISTRY: "WRITE_REGISTRY"
} as const;

export type RegistryUserPermissions = typeof RegistryUserPermissions[keyof typeof RegistryUserPermissions];

export const coerceRegistryUserPermissionFromString = (text: string): RegistryUserPermissions => {
    if (Object.values(RegistryUserPermissions).includes(text as RegistryUserPermissions)) {
        return text as RegistryUserPermissions;
    }
    throw new Error(`Text ${text} does not exist as a RegistryUserPermission.`);
}

export interface RegistryUser {
    id: string,
    username: string,
    registryId: number,
    isOwner: boolean,
    permissions?: RegistryUserPermissions[]
}