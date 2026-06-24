import { useNavigate, useParams } from "react-router";
import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"
import useRegistryBootstrap, { RegistryLoadingState } from "../hooks/useRegistryBootstrap";
import { useContext, useEffect, useState } from "react";
import apiClient from "../apiClient";
import { ModalContext } from "../context/ModalContext";
import { NavContext } from "../context/NavContext";

const EditRegistryAgent = () => {

    const navigate = useNavigate();
    const { registryId, agentId } = useParams();

    const { registryLoading } = useRegistryBootstrap(registryId);

    const { showModal } = useContext(ModalContext);
    const { setBanner } = useContext(NavContext);

    const [ updating, setUpdating ] = useState(false);
    const [ loading, setLoading ] = useState(true);
    const [ hasWritePermission, setHasWritePermission ] = useState(false);
    const [ hasReadPermission, setHasReadPermission ] = useState(false);
    const [ agentName, setAgentName ] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUpdating(true);

        const formData = new FormData(e.currentTarget);
        const agentName = formData.get("agentName") as string;
        const readRegistry = formData.get("readRegistry") === "on";
        const writeRegistry = formData.get("writeRegistry") === "on";

        const permissions: string[] = [];
        const removedPermissions: string[] = [];
        if (readRegistry) permissions.push("READ_REGISTRY")
            else removedPermissions.push("READ_REGISTRY");
        if (writeRegistry) permissions.push("WRITE_REGISTRY")
            else removedPermissions.push("WRITE_REGISTRY");

        if (agentName.trim().length === 0 || agentName.trim().length > 255) {
            setBanner({ message: "Agent name must be between 1 and 255 characters.", level: "error" });
            setUpdating(false);
            return;
        }

        if (!(/^\w+$/.test(agentName))) {
            setBanner({ message: "Agent name must only contain alphanumeric characters and underscores.", level: "error" });
            setUpdating(false);
            return;
        }

        apiClient.put(`/api/v1/registries/${registryId}/agents/${agentId}`, { name: agentName }).then(async res => {
            if (!res.ok) {
                if (res.status === 409) {
                    setBanner({ message: "An agent with that name already exists. Please choose a different name.", level: "error" });
                    setUpdating(false);
                    return;
                }

                throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
            }

            // assign permissions
            apiClient.post(`/api/v1/registries/${registryId}/agents/${agentId}/permissions`, { permissions }).then(async res => {
                if (!res.ok) {
                    throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
                }

                // remove permissions
                apiClient.delete(`/api/v1/registries/${registryId}/agents/${agentId}/permissions`, { permissions: removedPermissions }).then(async res => {
                    if (!res.ok) {
                        throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
                    }

                    showModal({
                        title: "Agent Updated",
                        message: `The agent has been updated successfully.`,
                        type: "alert",
                        onConfirm: () => {
                            navigate(`/registries/${registryId}/agents`);
                        }
                    })
                }).catch(err => {
                    console.error("Failed to remove permissions from the agent:", err);
                    showModal({
                        title: "Agent Updated",
                        message: `The agent has been updated successfully, but there was an error removing permissions. Please check the registry settings.`,
                        type: "alert",
                        onConfirm: () => {
                            navigate(`/registries/${registryId}/agents`);
                        }
                    })
                });
            }).catch(err => {
                console.error("Failed to assign permissions to the agent:", err);
                showModal({
                    title: "Agent Updated",
                    message: `The agent has been updated successfully, but there was an error assigning permissions. Please check the registry settings.`,
                    type: "alert",
                    onConfirm: () => {
                        navigate(`/registries/${registryId}/agents`);
                    }
                })
            })

        }).catch(err => {
            console.error("Failed to update registry agent:", err);
            setBanner({ message: "Failed to update registry agent. Please try again.", level: "error" });
        }).finally(() => setUpdating(false));
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        apiClient.get(`/api/v1/registries/${registryId}/agents/${agentId}`).then(async res => {
            if (!res.ok) {
                throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
            }

            const { name } = await res.json();
            setAgentName(name);

            apiClient.get(`/api/v1/registries/${registryId}/agents/${agentId}/permissions`).then(async res => {
                if (!res.ok) {
                    throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
                }

                const { roles } = await res.json();
                console.log(roles);
                setHasWritePermission(roles.includes("WRITE_REGISTRY"));
                setHasReadPermission(roles.includes("READ_REGISTRY"));
            }).catch(err => {
                console.error("Failed to fetch registry agent permissions:", err);
                setBanner({ message: "Failed to fetch registry agent permissions. Please try again.", level: "error" });
            }).finally(() => setLoading(false));
        }).catch(err => {
            console.error("Failed to fetch registry agent:", err);
            setBanner({ message: "Failed to fetch registry agent. Please try again.", level: "error" });
        }).finally(() => setLoading(false));
    }, [ agentId, registryId, setBanner ]);

    return <>
        <StandardLayout title="Edit Registry Agent" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="p-8">
                <div className="flex flex-row justify-between items-center mb-6" >
                    <span className="text-3xl font-bold">Edit Registry Agent</span>
                </div>

                { registryLoading != RegistryLoadingState.LOADED && <p className="text-center">{registryLoading == RegistryLoadingState.LOADING ? "Loading registry..." : "Failed to load registry."}</p> ||
                    <div className="border border-gray-300 rounded mt-16 p-8 w-1/2 items-center justify-center mx-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col w-full">
                            <label htmlFor="agentName" className="block mb-2 font-semibold">Agent Name</label>
                            <input type="text" name="agentName" placeholder="Agent Name" className="w-full px-3 py-2 border rounded mb-4 disabled:bg-gray-100" required value={agentName} onChange={e => setAgentName(e.target.value)} disabled={loading} />
                            <label htmlFor="permissions" className="block mb-2 font-semibold">Permissions</label>
                            <div className="flex flex-col m-4">
                                <div className="flex flex-row gap-4">
                                    <input type="checkbox" name="readRegistry" id="readRegistry" className="mb-4" checked={hasReadPermission} onChange={e => setHasReadPermission(e.target.checked)} disabled={loading} />
                                    <label htmlFor="readRegistry" className="mb-4">Read Registry</label>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Allows the agent to perform read operations from data on the registry.</p>
                                <div className="flex flex-row gap-4 items-center">
                                    <input type="checkbox" name="writeRegistry" id="writeRegistry" className="mb-4" checked={hasWritePermission} onChange={e => setHasWritePermission(e.target.checked)} disabled={loading} />
                                    <label htmlFor="writeRegistry" className="mb-4">Write Registry</label>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Allows the agent to perform write operations on the registry.</p>
                            </div>
                            <button className="button button-primary" type="submit" disabled={updating || loading}>
                                {updating ? "Updating..." : "Update Agent"}
                            </button>
                        </form>
                    </div>
                }
            </div>
        </StandardLayout>
    </>
}

export default EditRegistryAgent;