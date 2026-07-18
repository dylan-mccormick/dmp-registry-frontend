import { useCallback, useContext, useEffect, useState } from "react";
import { RegistryContext } from "../context/RegistryContext";
import { coerceRegistryTypeFromString } from "../model/RegistryType";
import { coerceRegistryUserPermissionFromString } from "../model/RegistryUser";
import { UserContext } from "../context/UserContext";
import apiClient from "../apiClient";
import type { Registry } from "../model/Registry";
import { LoadingBannerContext } from "../context/LoadingBannerContext";

type UseRegistryBootstrapResult = {
    registryLoading: RegistryLoadingState;
    registryLoadingError: string | null;
    reload: () => void;
}

export const RegistryLoadingState = {
    NOT_STARTED: "Not Started",
    LOADING: "Loading",
    LOADED: "Loaded"
} as const;

export type RegistryLoadingState = typeof RegistryLoadingState[keyof typeof RegistryLoadingState];

const useRegistryBootstrap = (registryId: string | undefined): UseRegistryBootstrapResult => {
    const [ registryLoading, setRegistryLoading ] = useState<RegistryLoadingState>(RegistryLoadingState.NOT_STARTED);
    const [ registryLoadingError, setRegistryLoadingError ] = useState<string | null>(null);

    const { addProcess, removeProcess } = useContext(LoadingBannerContext);
    const { registry, setRegistry, setLocalUser } = useContext(RegistryContext);
    const { user } = useContext(UserContext);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleHttp = async (res: Response): Promise<any> => {
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }

        return res.json();
    }

    const handleError = useCallback(async (reason: string, cause?: unknown) => {
        console.error(reason, cause);
        setRegistryLoadingError(reason);
        setRegistryLoading(RegistryLoadingState.LOADED);
        removeProcess("loading_registry");
    }, [removeProcess]);

    const reload = useCallback(async () => {
        setRegistryLoading(RegistryLoadingState.LOADING);
        addProcess("loading_registry");
        setRegistry(undefined);

        try {
            const detailsRes = await apiClient.get(
                `/api/v1/registries/${registryId}/details`,
            );
            const detailsData = await handleHttp(detailsRes);

            const baseRegistryDetails: Registry = {
                id: detailsData.id,
                name: detailsData.name,
                storageLocation: detailsData.storageLocation,
                type: coerceRegistryTypeFromString(detailsData.type),
                createdAt: new Date(detailsData.createdAt),
                createdByUser: detailsData.createdByUserId
                    ? {
                        id: detailsData.createdByUserId,
                        username: detailsData.creatorUsername,
                        isOwner: true,
                        registryId: detailsData.id,
                    }
                    : undefined,
            };

            // Load details about the user
            const registryUserRes = await apiClient.get(`/api/v1/registries/${registryId}/permissions/me`);
            const registryUserData = await handleHttp(registryUserRes);

            if (user == null) handleError("No user selected.");

            setLocalUser({
                id: user!.id,
                username: user!.username,
                registryId: detailsData.id,
                isOwner: detailsData.createdByUserId == user!.id,
                permissions: registryUserData.map(coerceRegistryUserPermissionFromString)
            });

            setRegistry(baseRegistryDetails);
            setRegistryLoading(RegistryLoadingState.LOADED);
        } catch (err) {
            handleError("Error gathering details about the registry.", err);
        } finally {
            setRegistryLoading(RegistryLoadingState.LOADED);
            removeProcess("loading_registry");
            removeProcess("loading_local_user");
        }
    }, [addProcess, handleError, registryId, removeProcess, setLocalUser, setRegistry, user]);

    useEffect(() => {
        if (!registryId) return;

        const activeRegistryId = registry?.id.toString();

        if (registryId == activeRegistryId) {
            if (registryLoading != RegistryLoadingState.LOADED) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setRegistryLoading(RegistryLoadingState.LOADED);
                removeProcess("loading_registry");
            }

            return;
        }

        if (registryLoading != RegistryLoadingState.LOADING) {
            reload();
        }
    }, [registryId, registry?.id, reload, registryLoading, removeProcess])

    return { registryLoading, registryLoadingError, reload }
}

export default useRegistryBootstrap;