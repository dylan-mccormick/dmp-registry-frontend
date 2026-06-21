import { useContext, useEffect, useState } from "react";
import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"
import { RegistryContext } from "../context/RegistryContext";
import useRegistryBootstrap, { RegistryLoadingState } from "../hooks/useRegistryBootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { NavContext } from "../context/NavContext";
import { ModalContext } from "../context/ModalContext";
import apiClient from "../apiClient";

const RegistrySettings = () => {

    const { registryId } = useParams();

    const navigate = useNavigate();
    const { reload, registryLoading, registryLoadingError } = useRegistryBootstrap(registryId);

    const { registry, localUser } = useContext(RegistryContext);
    const { showModal, closeModal } = useContext(ModalContext);
    const { setBanner } = useContext(NavContext);

    const [ loading, setLoading ] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const name = formData.get("name") as string;
        if (!name.match(/[a-zA-Z0-9]/) || name.length > 255 || name.length === 0) {
            setBanner({ level: "error", message: "Invalid registry name." });
            return;
        }

        setLoading(true);
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
        }).finally(() => setLoading(false));
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
                                        setLoading(true);
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
                                            setLoading(false);
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
        <StandardLayout title="Agent Management" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="p-8">
                <span className="text-3xl font-bold">Registry Settings</span>
                <div className="flex flex-col items-center" >
                <form onSubmit={handleSubmit} className="mt-4 w-full sm:w-lg">
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 items-center">
                        <label htmlFor="registryId" className="text-right">ID</label>
                        <input type="text" id="registryId" name="registryId" maxLength={255} className="px-3 py-2 border rounded bg-gray-100" defaultValue={registry?.id} disabled />

                        <label htmlFor="name" className="text-right">Name</label>
                        <input type="text" id="name" name="name" maxLength={255} className="px-3 py-2 border rounded" defaultValue={registry?.name} required />

                        <label htmlFor="type" className="text-right">Type</label>
                        <input type="text" id="type" name="type" className="px-3 py-2 border rounded bg-gray-100" defaultValue={registry?.type} disabled />

                        <label htmlFor="createdAt" className="text-right">Created At</label>
                        <input type="text" id="createdAt" name="createdAt" className="px-3 py-2 border rounded bg-gray-100" defaultValue={registry ? registry.createdAt.toLocaleString() : ""} disabled />

                        <div /> {/* empty cell */}<div /> {/* empty cell */}
                        <div /> {/* empty cell */}
                        <button type="submit" className="button-primary" disabled={loading}>Save Changes</button>
                        <div /> {/* empty cell */}
                        <button type="button" className="button-secondary border-red-500" disabled={loading} onClick={handleDelete}>
                            Delete Registry
                        </button>
                    </div>
                </form>

            </div>
            </div>
        </StandardLayout>
    </>
}

export default RegistrySettings;