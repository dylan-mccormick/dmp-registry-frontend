// NavbarLevel.ts
// Enum describing different degrees of information for Navbar

export const NavbarLevel = {
    HIDDEN: 0,
    TOP: 1,
    REGISTRY: 2
} as const;

export type NavbarLevel = typeof NavbarLevel[keyof typeof NavbarLevel];