import { useNavigate, useParams } from "react-router";
import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"
import useRegistryBootstrap, { RegistryLoadingState } from "../hooks/useRegistryBootstrap";
import { useContext, useState } from "react";
import apiClient from "../apiClient";
import { ModalContext } from "../context/ModalContext";
import { NavContext } from "../context/NavContext";

const CreateRegistryAgent = () => {

    const navigate = useNavigate();
    const { registryId } = useParams();

    const { registryLoading } = useRegistryBootstrap(registryId);

    const { showModal } = useContext(ModalContext);
    const { setBanner } = useContext(NavContext);

    const [ loading, setLoading ] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const agentName = formData.get("agentName") as string;
        const readRegistry = formData.get("readRegistry") === "on";
        const writeRegistry = formData.get("writeRegistry") === "on";

        const permissions: string[] = [];
        if (readRegistry) permissions.push("READ_REGISTRY");
        if (writeRegistry) permissions.push("WRITE_REGISTRY");

        if (agentName.trim().length === 0 || agentName.trim().length > 255) {
            setBanner({ message: "Agent name must be between 1 and 255 characters.", level: "error" });
            setLoading(false);
            return;
        }

        if (!(/^\w+$/.test(agentName))) {
            setBanner({ message: "Agent name must only contain alphanumeric characters and underscores.", level: "error" });
            setLoading(false);
            return;
        }

        apiClient.post(`/api/v1/registries/${registryId}/agents`, { name: agentName }).then(async res => {
            if (!res.ok) {
                if (res.status === 409) {
                    setBanner({ message: "An agent with that name already exists. Please choose a different name.", level: "error" });
                    setLoading(false);
                    return;
                }

                throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
            }

            const { id, keyHash } = await res.json();
            // assign permissions
            apiClient.post(`/api/v1/registries/${registryId}/agents/${id}/permissions`, { permissions }).then(async res => {
                if (!res.ok) {
                    throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
                }

                showModal({
                    title: "Agent Created",
                    message: `The agent has been created successfully. Please save the following key securely, as it will not be shown again.`,
                    type: "alert",
                    monoContent: keyHash,
                    onConfirm: () => {
                        navigate(`/registries/${registryId}/agents`);
                    }
                })
            }).catch(err => {
                console.error("Failed to assign permissions to the agent:", err);
                showModal({
                    title: "Agent Created",
                    message: `The agent has been created successfully, but there was an error assigning permissions. Please check the registry settings. The following key has been generated for the agent. Please save it securely, as it will not be shown again.`,
                    monoContent: keyHash,
                    type: "alert",
                    onConfirm: () => {
                        navigate(`/registries/${registryId}/agents`);
                    }
                })
            })

        }).catch(err => {
            console.error("Failed to create registry agent:", err);
            setBanner({ message: "Failed to create registry agent. Please try again.", level: "error" });
        }).finally(() => setLoading(false));
    };

    return <>
        <StandardLayout title="Create Registry Agent" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="p-8">
                <div className="flex flex-row justify-between items-center mb-6" >
                    <span className="text-3xl font-bold">Create Registry Agent</span>
                </div>

                { registryLoading != RegistryLoadingState.LOADED && <p className="text-center">{registryLoading == RegistryLoadingState.LOADING ? "Loading registry..." : "Failed to load registry."}</p> ||
                    <div className="border border-gray-300 rounded mt-16 p-8 w-1/2 items-center justify-center mx-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col w-full">
                            <label htmlFor="agentName" className="block mb-2 font-semibold">Agent Name</label>
                            <input type="text" name="agentName" placeholder="Agent Name" className="w-full px-3 py-2 border rounded mb-4" required />
                            <label htmlFor="permissions" className="block mb-2 font-semibold">Permissions</label>
                            <div className="flex flex-col m-4">
                                <div className="flex flex-row gap-4">
                                    <input type="checkbox" name="readRegistry" id="readRegistry" className="mb-4" defaultChecked />
                                    <label htmlFor="readRegistry" className="mb-4">Read Registry</label>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Allows the agent to perform read operations from data on the registry.</p>
                                <div className="flex flex-row gap-4 items-center">
                                    <input type="checkbox" name="writeRegistry" id="writeRegistry" className="mb-4" />
                                    <label htmlFor="writeRegistry" className="mb-4">Write Registry</label>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Allows the agent to perform write operations on the registry.</p>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Note: The agent key will be generated after creation and will only be shown once. Please save it securely.</p>
                            <button className="button button-primary" type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Create Agent"}
                            </button>
                        </form>
                    </div>
                }
            </div>
        </StandardLayout>
    </>
}

export default CreateRegistryAgent;