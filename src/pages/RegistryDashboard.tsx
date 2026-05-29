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

const RegistryDashboard = () => {
    const { registryId } = useParams();

    const navigate = useNavigate();

    const { registry, setRegistry } = useContext(RegistryContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { setBanner } = useContext(NavContext);

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

    useEffect(() => {
        (async () => {
            try {
                const res = await apiClient.get(
                    `/api/v1/registries/${registryId}/details`,
                );

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
                }

                const data = await res.json();

                const baseRegistryDetails: Registry = {
                    id: data.id,
                    name: data.name,
                    storageLocation: data.storageLocation,
                    type: coerceRegistryTypeFromString(data.type),
                    createdAt: new Date(data.createdAt),
                    createdByUser: data.createdByUserId
                        ? {
                              id: data.createdByUserId,
                              username: data.creatorUsername,
                              registryId: data.id,
                          }
                        : undefined,
                };

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
    }, [registryId, kickbackUser, setRegistry]);

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
                {registry?.name}
            </StandardLayout>
        </>
    );
};

export default RegistryDashboard;
