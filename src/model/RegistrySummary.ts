import type { RegistryUserPermissions } from "./RegistryUser";

// A registry as returned by the /api/v1/registries/list/* endpoints
export interface RegistrySummary {
    id: number;
    name: string;
    type: string;
    ownerId?: number | null;
    owner?: string | null;
    createdAt: string;
}

// A registry from /list/user/:userId, with that user's permissions in it
export interface UserRegistrySummary extends RegistrySummary {
    permissions: RegistryUserPermissions[];
}
