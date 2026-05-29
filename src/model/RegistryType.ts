export const RegistryType = {
    Files: "files",
    MongoDB: "mongodb"
} as const;

export const coerceRegistryTypeFromString = (text: string): RegistryType => {
    if (Object.values(RegistryType).includes(text as RegistryType)) {
        return text as RegistryType;
    }
    throw new Error(`Text '${text}' does not exist as a RegistryType.`);
}

export type RegistryType = typeof RegistryType[keyof typeof RegistryType];