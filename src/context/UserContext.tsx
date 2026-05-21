/* eslint-disable @typescript-eslint/no-unused-vars */
import { createContext } from "react";

export const UserPermission = {
    CREATE_REGISTRY: "CREATE_REGISTRY",
    MANAGE_USERS: "MANAGE_USERS"
} as const;

export type UserPermission = typeof UserPermission[keyof typeof UserPermission];
export interface UserContextInterface {
    id: string;
    email: string;
    username: string;
    permissions: UserPermission[]
}

export const UserContext = createContext({
    user: null as UserContextInterface | null,
    setUser: (_: UserContextInterface | null) => { },
});