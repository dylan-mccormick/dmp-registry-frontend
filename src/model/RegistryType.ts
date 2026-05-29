export const RegistryType = {
    Files: "files",
    MongoDB: "mongodb"
} as const;

export type RegistryType = typeof RegistryType[keyof typeof RegistryType];