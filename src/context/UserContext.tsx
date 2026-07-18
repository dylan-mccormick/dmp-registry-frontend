import { createContext } from "react";

export const UserPermission = {
    CREATE_REGISTRY: "CREATE_REGISTRY",
    MANAGE_USERS: "MANAGE_USERS"
} as const;

export type UserPermission = typeof UserPermission[keyof typeof UserPermission];

export interface UserInterface {
    id: string;
    email: string;
    username: string;
    permissions: UserPermission[]
}

interface UserContextInterface {
    user: UserInterface | undefined,
    loading: boolean;
    setUser: ( user: UserInterface | undefined ) => void;
    setResetUser: ( f: (( n: number ) => number) ) => void;
}

export const UserContext = createContext<UserContextInterface>({
    user: undefined,
    loading: true,
    setUser: () => { },
    setResetUser: () => { }
});