import { Database, FolderClosed, KeyRound, Leaf } from "lucide-react";
import type { ReactNode } from "react";
import { RegistryUserPermissions } from "../model/RegistryUser";

export const registryTypeDisplay: Record<string, { label: string; icon: ReactNode }> = {
    files: { label: "Files", icon: <FolderClosed /> },
    mongodb: { label: "MongoDB", icon: <Leaf /> },
    sqlite: { label: "SQLite", icon: <Database /> },
    keyvalue: { label: "Key-Value", icon: <KeyRound /> },
};

export const registryTypeLabel = (type: string) => registryTypeDisplay[type]?.label ?? type;
export const registryTypeIcon = (type: string) => registryTypeDisplay[type]?.icon ?? <Database />;

export const registryPermissionLabels: Record<RegistryUserPermissions, string> = {
    [RegistryUserPermissions.READ_REGISTRY]: "Read",
    [RegistryUserPermissions.WRITE_REGISTRY]: "Write",
    [RegistryUserPermissions.READ_AGENTS]: "Read agents",
    [RegistryUserPermissions.WRITE_AGENTS]: "Write agents",
    [RegistryUserPermissions.MANAGE_USERS]: "Manage users",
};

// Short human-readable date, e.g. "Mar 2, 2026"
export const formatDateShort = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
