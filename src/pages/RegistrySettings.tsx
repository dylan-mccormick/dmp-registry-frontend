import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../apiClient";
import PageHeader from "../components/PageHeader";
import { SettingsActions, SettingsGroup, SettingsRow } from "../components/SettingsGroup";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { ModalContext } from "../context/ModalContext";
import { NavbarLevel } from "../context/NavbarLevel";
import { RegistryContext } from "../context/RegistryContext";
import useRegistryBootstrap, { RegistryLoadingState } from "../hooks/useRegistryBootstrap";

const RegistrySettings = () => {

    const { registryId } = useParams();

    const navigate = useNavigate();
    const { reload, registryLoading, registryLoadingError } = useRegistryBootstrap(registryId);

    const { registry, localUser } = useContext(RegistryContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { setBanner } = useContext(BannerContext);
    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const name = formData.get("name") as string;
        if (!name.match(/[a-zA-Z0-9]/) || name.length > 255 || name.length === 0) {
            setBanner({ level: "error", message: "Invalid registry name." });
            return;
        }

        addProcess("updating_registry");
        apiClient.put(`/api/v1/registries/${registryId}`, { name }).then(async res => {
            if (!res.ok) {
                if (res.status === 409) {
                    setBanner({ level: "error", message: "Registry name already exists." });
                    return;
                }

                throw new Error(`HTTP request failed with status ${res.status}: ${await res.text()}`);
            } else {
                setBanner({ level: "success", message: "Registry updated successfully." });
                reload();
                navigate(`/registries/${registryId}`);
            }
        }).catch(err => {
            console.error("Failed to update registry", err);
            setBanner({ level: "error", message: "Failed to update registry." });
        }).finally(() => removeProcess("updating_registry"));
    };

    const handleDelete = () => {
        showModal({
            title: "Confirm Registry Deletion",
            message: "Are you sure you want to delete this registry? This action cannot be undone.",
            type: "confirm",
            onConfirm: () => {
                showModal({
                    title: "Confirm Registry Deletion",
                    message: "Upon deletion of this registry, the data will be permanently lost. THERE IS NO WAY TO RECOVER FROM THIS. Please type the full registry name to confirm you understand that all registry data will be gone forever.",
                    type: "input",
                    placeholder: "Enter registry name...",
                    onConfirm: v => {
                        if (v != registry?.name) {
                            setBanner({ level: "error", message: "Registry name does not match." });
                            return;
                        }

                        showModal({
                            title: "Confirm Registry Deletion",
                            message: "Please enter your password to confirm deletion.",
                            type: "password",
                            placeholder: "Enter your password...",
                            onConfirm: password => {
                                // Final warning
                                showModal({
                                    title: "FINAL CONFIRMATION - REGISTRY DELETION",
                                    message: "THIS IS YOUR LAST CHANCE TO BACK OUT. THIS ACTION IS IRREVERSIBLE AND WILL DELETE ALL DATA IN THIS REGISTRY. UPON CLICKING CONFIRM, YOU WILL BE REDIRECTED TO THE DASHBOARD AND ALL DATA WILL BE LOST. ARE YOU ABSOLUTELY SURE YOU WANT TO PROCEED?",
                                    type: "confirm",
                                    onConfirm: async () => {
                                        addProcess("deleting_registry");
                                        try {
                                            apiClient.delete(`/api/v1/registries/${registryId}`, { password }).then(async res => {
                                                if (!res.ok) {
                                                    if (res.status === 403) {
                                                        setBanner({ level: "error", message: "Incorrect password." });
                                                        return;
                                                    }

                                                    throw new Error(`HTTP request failed with status ${res.status}: ${await res.text()}`);
                                                } else {
                                                    setBanner({ level: "success", message: "Registry deleted successfully." });
                                                    navigate("/dashboard");
                                                }
                                            }).catch(err => {
                                                console.error("Failed to delete registry", err);
                                                setBanner({ level: "error", message: "Failed to delete registry." });
                                            });
                                        } catch (err) {
                                            console.error("Failed to delete registry", err);
                                            setBanner({ level: "error", message: "Failed to delete registry." });
                                        } finally {
                                            removeProcess("deleting_registry");
                                            closeModal();
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    };

    useEffect(() => {
        if (registryLoadingError) {
            setBanner({ level: "error", message: "Failed to load the selected registry." });
            navigate("/dashboard");
        }
    }, [ registryLoadingError, setBanner, navigate ])

    useEffect(() => {
        if (registryLoading == RegistryLoadingState.LOADED && !localUser?.isOwner) {
            navigate("/dashboard");
        }
    }, [ registryLoading, localUser, navigate ])

    return <>
        <StandardLayout title="Registry Settings" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="page">
                <PageHeader eyebrow={registry?.name} title="Settings" />
                <form onSubmit={handleSubmit} className="max-w-3xl">
                    <SettingsGroup title="General">
                        <SettingsRow label="Name" htmlFor="name">
                            <input type="text" id="name" name="name" maxLength={255} className="field" defaultValue={registry?.name} required />
                        </SettingsRow>
                        <SettingsRow label="Type">
                            <span className="field-static">{registry?.type}</span>
                        </SettingsRow>
                        <SettingsRow label="ID">
                            <span className="field-static font-mono text-meta">{registry?.id}</span>
                        </SettingsRow>
                        <SettingsRow label="Created">
                            <span className="field-static">{registry ? registry.createdAt.toLocaleString() : ""}</span>
                        </SettingsRow>
                    </SettingsGroup>
                    <SettingsActions destructive={
                        <button type="button" className="button-destructive" disabled={processes.has("deleting_registry")} onClick={handleDelete}>
                            Delete Registry
                        </button>
                    }>
                        <button type="submit" className="button-primary" disabled={processes.has("updating_registry")}>Save Changes</button>
                    </SettingsActions>
                </form>
            </div>
        </StandardLayout>
    </>
}

export default RegistrySettings;