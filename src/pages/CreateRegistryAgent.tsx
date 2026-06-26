import { useNavigate, useParams } from "react-router";
import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"
import useRegistryBootstrap, { RegistryLoadingState } from "../hooks/useRegistryBootstrap";
import { useContext, useState } from "react";
import apiClient from "../apiClient";
import { ModalContext } from "../context/ModalContext";
import { NavContext } from "../context/NavContext";
import CreationForm, { FormField } from "../components/CreationForm";

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

    const formFields: FormField[] = [
        { name: "agentName", label: "Agent Name", type: "text", placeholder: "Agent Name", required: true },
        { name: "readRegistry", label: "Permissions", labelText: "Read Registry", type: "checkbox", defaultChecked: true },
        { name: "writeRegistry", labelText: "Write Registry", type: "checkbox" }
    ];

    return <>
        <StandardLayout title="Create Registry Agent" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="p-8">

                { registryLoading != RegistryLoadingState.LOADED && <p className="text-center">{registryLoading == RegistryLoadingState.LOADING ? "Loading registry..." : "Failed to load registry."}</p> || <>
                    <CreationForm
                        title="Create Registry Agent"
                        onSubmit={handleSubmit}
                        loading={loading}
                        fields={formFields}
                        buttonText="Create Agent"
                        buttonLoadingText="Creating..."
                        disclaimer="Note: The agent key will be generated after creation and will only be shown once. Please save it securely."
                    />
                </>}
            </div>
        </StandardLayout>
    </>
}

export default CreateRegistryAgent;