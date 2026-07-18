import { createContext } from "react";

interface LoadingBannerInterface {
    addProcess: (id: string, message?: string) => void;
    processes: Map<string, string | undefined>;
    removeProcess: (id: string) => void;
};

export const LoadingBannerContext = createContext<LoadingBannerInterface>({
    addProcess: () => {},
    processes: new Map<string, string | undefined>(),
    removeProcess: () => {}
});