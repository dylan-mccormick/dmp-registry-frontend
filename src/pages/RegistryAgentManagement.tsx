import { useNavigate, useParams } from "react-router";
import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"
import useRegistryBootstrap, { RegistryLoadingState } from "../hooks/useRegistryBootstrap";
import { useCallback, useContext, useEffect, useState, type JSX } from "react";
import { NavContext } from "../context/NavContext";
import HTMLTable from "../components/HTMLTable";
import { RegistryContext } from "../context/RegistryContext";
import { RegistryUserPermissions } from "../model/RegistryUser";
import apiClient from "../apiClient";
import { ModalContext } from "../context/ModalContext";
import PageHeader from "../components/PageHeader";

interface AgentSchema {
    id: number;
    name: string;
    createdAt: string;
    createdBy: string;
    actions: JSX.Element
}

const AgentActions = ({ agent }: { agent: Omit<AgentSchema, "actions"> }) => {
    const navigate = useNavigate();
    const { registryId } = useParams();
    const { reload } = useRegistryBootstrap(registryId);
    const { localUser } = useContext(RegistryContext);
    const { setBanner } = useContext(NavContext);
    const { showModal, closeModal } = useContext(ModalContext);

    const handleEditRoles = useCallback(() => {
        navigate(`/registries/${registryId}/agents/${agent.id}/edit`);
    }, [ navigate, registryId, agent.id ]);

    const handleRefreshKey = useCallback(() => {
        showModal({
            title: "Confirm Refresh Key",
            message: "Are you sure you want to refresh the key for this agent? Any previously generated key will immediately stop working.",
            type: "confirm",
            onConfirm: () => {
                showModal({
                    title: "Please Wait",
                    message: "Generating a new key...",
                    type: "buttonless"
                });

                apiClient.put(`/api/v1/registries/${registryId}/agents/${agent.id}/key`, {}).then(async res => {
                    if (!res.ok) {
                        throw new Error(`HTTP request failed with status ${res.status}: ${await res.text()}`);
                    }

                    const data = await res.json();
                    const newKey = data.keyHash;

                    closeModal();
                    showModal({
                        title: "Ephemeral API Key View",
                        message: `Copy this API key now, as it will not be shown again.`,
                        type: "alert",
                        monoContent: newKey
                    })
                }).catch(err => {
                    console.error("Failed to refresh the agent API key", err);
                    setBanner({ level: "error", message: "Unable to refresh the API key" });
                    closeModal();
                })
            }
        });
    }, [ agent.id, closeModal, registryId, setBanner, showModal ]);

    const handleDelete = useCallback(() => {
        showModal({
            title: "Confirm Delete Agent",
            message: "Are you sure you want to delete this agent? This action cannot be undone.",
            type: "confirm",
            onConfirm: () => {
                showModal({
                    title: "Please Wait",
                    message: "Deleting the agent...",
                    type: "buttonless"
                });

                apiClient.delete(`/api/v1/registries/${registryId}/agents/${agent.id}`).then(async res => {
                    if (!res.ok) {
                        throw new Error(`HTTP request failed with status ${res.status}: ${await res.text()}`);
                    }

                    closeModal();
                    setBanner({ level: "success", message: `Successfully deleted agent "${agent.name}"` });
                    reload();
                }).catch(err => {
                    console.error("Failed to delete the agent", err);
                    setBanner({ level: "error", message: "Unable to delete the agent" });
                    closeModal();
                })
            }
        });
    }, [ showModal, registryId, agent.id, agent.name, closeModal, setBanner, reload ]);

    if (!localUser?.permissions?.includes(RegistryUserPermissions.WRITE_AGENTS)) {
        return <div className="flex flex-row gap-2 items-center" >
            <button className="button button-secondary" disabled>Edit</button>
            <button className="button button-secondary" disabled>Refresh Key</button>
            <button className="button button-secondary border-red-500" disabled>Delete</button>
        </div>
    }

    return <div className="flex flex-row gap-2 items-center" >
        <button className="button button-secondary" onClick={handleEditRoles} >Edit</button>
        <button className="button button-secondary" onClick={handleRefreshKey} >Refresh Key</button>
        <button className="button button-secondary border-red-500" onClick={handleDelete}>Delete</button>
    </div>
}

const RegistryAgentManagement = () => {

    const navigate = useNavigate();
    const { registryId } = useParams();

    const { registryLoading } = useRegistryBootstrap(registryId);
    const { setBanner } = useContext(NavContext);
    const { localUser } = useContext(RegistryContext);

    const [ loading, setLoading ] = useState(true);
    const [ agents, setAgents ] = useState<AgentSchema[]>([]);

    const columns: { text: string; dataKey: keyof AgentSchema; queryable?: boolean; fixedPixelSize?: number }[] = [
        { text: "ID", dataKey: "id", queryable: false, fixedPixelSize: 150 },
        { text: "Name", dataKey: "name" },
        { text: "Created At", dataKey: "createdAt" },
        { text: "Created By", dataKey: "createdBy" },
        { text: "Actions", dataKey: "actions", queryable: false }
    ];

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (registryLoading !== RegistryLoadingState.LOADED) return setLoading(true);

        // get a list of agents for the registry
        apiClient.get(`/api/v1/registries/${registryId}/agents`).then(async res => {
            if (!res.ok) {
                throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
            }

            const data = await res.json();
            setAgents(data.map(( agent: { id: number; name: string; createdAt: string; createdBy: string } ) => {
                return { ...agent, actions: <AgentActions agent={agent} />, createdAt: new Date(agent.createdAt).toLocaleString() };
            }));
        }).catch(err => {
            console.error(`Failed to get a list of agents for the registry: `, err);
            setBanner({ level: "error", message: `Failed to load registry agents.`});
        }).finally(() => setLoading(false));
    }, [ registryId, registryLoading, setBanner ]);

    return <>
        <StandardLayout title="Agent Management" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="p-8">
                <PageHeader title="Registry Agent Management" buttonText={localUser?.permissions?.includes(RegistryUserPermissions.WRITE_AGENTS) ? "Create New Agent" : undefined} buttonAction={() => navigate(`/registries/${registryId}/agents/new`)} />

                { loading && <p className="text-center">{registryLoading == RegistryLoadingState.LOADING ? "Loading registry..." : "Loading agents..."}</p> || (agents.length === 0 && <p className="text-center">No agents found.</p> ||
                    <div className="mt-4 mb-8" >
                        <HTMLTable<AgentSchema> columns={columns} data={agents} />
                    </div>
                ) }
            </div>
        </StandardLayout>
    </>
}

export default RegistryAgentManagement;