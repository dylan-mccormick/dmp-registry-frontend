import { useCallback, useContext, useEffect, useState } from "react";
import StandardLayout from "../components/StandardLayout";
import { NavbarLevel } from "../context/NavbarLevel";
import { RegistryContext } from "../context/RegistryContext";
import { useNavigate, useParams } from "react-router";
import { ModalContext } from "../context/ModalContext";
import { NavContext } from "../context/NavContext";
import apiClient from "../apiClient";
import { coerceRegistryTypeFromString } from "../model/RegistryType";
import type { Registry } from "../model/Registry";
import { UserContext } from "../context/UserContext";
import { coerceRegistryUserPermissionFromString } from "../model/RegistryUser";

const RegistryDashboard = () => {
    const { registryId } = useParams();

    const navigate = useNavigate();

    const { registry, setRegistry, setLocalUser } = useContext(RegistryContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { setBanner } = useContext(NavContext);
    const { user } = useContext(UserContext);

    const [loading, setLoading] = useState(true);

    const kickbackUser = useCallback(() => {
        setLoading(false);

        // Show error modal
        setBanner({
            level: "error",
            message:
                "An error occured and we were unable to load details about the requested registry.",
        });
        navigate("/dashboard");
    }, [navigate, setBanner]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleHttp = async (res: Response): Promise<any> => {
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }

        return res.json();
    }

    useEffect(() => {
        setLocalUser(null);

        (async () => {
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

                if (user == null) kickbackUser();

                setLocalUser({
                    id: user!.id,
                    username: user!.username,
                    registryId: detailsData.id,
                    isOwner: detailsData.createdByUserId == user!.id,
                    permissions: registryUserData.map(coerceRegistryUserPermissionFromString)
                });

                setRegistry(baseRegistryDetails);
                setLoading(false);
            } catch (err) {
                console.error(
                    "Error gathering details about the registry",
                    err,
                );
                kickbackUser();
            }
        })();
    }, [registryId, kickbackUser, setRegistry, setLocalUser, user]);

    useEffect(() => {
        if (loading) {
            showModal({
                title: "Please Wait",
                message: "Loading registry...",
                type: "buttonless",
            });
        } else {
            closeModal();
        }
    }, [loading, showModal, closeModal]);

    return (
        <>
            <StandardLayout navbarLevel={NavbarLevel.REGISTRY}>
                <div className="p-8">
                    <span className="text-3xl font-bold mb-16">{registry?.name}</span>

                    <div className="mt-4">
                        {(() => {
                            switch (registry?.type) {
                                default: return <div className="border-red-500 bg-red-200 border br rounded p-4 text-red-900" >Sorry, the controller for this registry type has not yet been implemented.</div>
                            }
                        })()}
                    </div>
                </div>
            </StandardLayout>
        </>
    );
};

export default RegistryDashboard;
