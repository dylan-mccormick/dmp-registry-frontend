import { useCallback, useState, type ReactNode } from "react";
import { LoadingBannerContext } from "./LoadingBannerContext";

export const LoadingBannerProvider = ({ children }: { children: ReactNode }) => {
    const [ processes, setProcesses ] = useState<Map<string, string | undefined>>(new Map());

    const addProcess = useCallback((id: string, message?: string) => {
        // if (processes.has(id)) throw new Error(`Cannot add Loading Banner process '${id}': ID is already in use`);
        setProcesses(proc => new Map(proc).set(id, message));
    }, [ ]);

    const removeProcess = useCallback((id: string) => {
        setProcesses(proc => {
            const next = new Map(proc);
            next.delete(id);
            return next;
        });
    }, [ ]);

    return <LoadingBannerContext.Provider value={{ addProcess, processes, removeProcess }}>
        {children}
    </LoadingBannerContext.Provider>
}