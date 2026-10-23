import { ChevronRight, Database, FolderClosed, KeyRound, Leaf, Plus } from "lucide-react";
import { useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import apiClient from "../apiClient";
import PageHeader from "../components/PageHeader";
import StandardLayout from "../components/StandardLayout";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { NavbarLevel } from "../context/NavbarLevel";
import { RegistryContext } from "../context/RegistryContext";
import { UserContext } from "../context/UserContext";

interface RegistryMetadata {
    id: string;
    name: string;
    owner?: string;
    type: string;
    createdAt: string;
}

const fetchRegistries = async () => {
    return apiClient.get("/api/v1/registries/list/me").then((res) => {
        if (res.ok) {
            return res.json();
        }

        throw new Error("Failed to fetch registries", { cause: res.status });
    });
};

const registryTypeDisplay: Record<string, { label: string; icon: ReactNode }> = {
    files: { label: "Files", icon: <FolderClosed /> },
    mongodb: { label: "MongoDB", icon: <Leaf /> },
    sqlite: { label: "SQLite", icon: <Database /> },
    keyvalue: { label: "Key-Value", icon: <KeyRound /> },
};

const RegistryGridCard = ({ registry }: { registry: RegistryMetadata }) => {
    const navigate = useNavigate();

    const { setRegistry } = useContext(RegistryContext);

    const navigateAway = () => {
        setRegistry(undefined);
        navigate(`/registries/${registry.id}`);
    };

    return (
        <>
            <button
                className="group relative flex h-full w-full cursor-pointer flex-col rounded-3xl bg-surface p-6 text-left transition-colors duration-200 hover:bg-rule/40 sm:p-7"
                onClick={navigateAway}
            >
                <div className="mb-10 flex items-start justify-between gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg text-ink [&>svg]:size-5">
                        {registryTypeDisplay[registry.type]?.icon ?? <Database />}
                    </span>
                    <span className="chip">{registryTypeDisplay[registry.type]?.label ?? registry.type}</span>
                </div>
                <h2 className="mb-2 flex items-center gap-1 text-h3 font-semibold break-words">
                    <span className="min-w-0">{registry.name}</span>
                    <ChevronRight className="size-5 shrink-0 text-legend transition-transform duration-200 group-hover:translate-x-0.5" />
                </h2>
                <p className="text-meta text-legend">
                    {registry.owner ?? "Unassigned"} · Created {new Date(registry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
            </button>
        </>
    );
};

const Dashboard = () => {
    const { user } = useContext(UserContext);

    const createRegistries =
        user?.permissions.includes("CREATE_REGISTRY") ?? false;
    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);

    const navigate = useNavigate();

    const [registries, setRegistries] = useState<RegistryMetadata[]>([]);

    useEffect(() => {
        addProcess("fetching_registries");
        fetchRegistries()
            .then((data) => {
                setRegistries(data);
                removeProcess("fetching_registries");
            })
            .catch((error) => {
                console.error("Error fetching registries:", error);
                removeProcess("fetching_registries");
            });
    }, [addProcess, removeProcess]);

    return (
        <>
            <StandardLayout
                navbarLevel={NavbarLevel.TOP}
                title="Registries Directory"
            >
                <div className="page">
                    <PageHeader
                        eyebrow="Dashboard"
                        title="Registries"
                        subtitle="Every registry you own or have been given access to."
                        actions={createRegistries && (
                            <button className="button-primary" onClick={() => navigate("/registries/new")}>
                                <Plus className="size-4" /> New Registry
                            </button>
                        )}
                    />

                    {!processes.has("fetching_registries") && <>
                        {registries.length === 0 && (
                            <div className="card flex flex-col items-center py-16 text-center">
                                <span className="mb-4 grid size-12 place-items-center rounded-xl bg-bg text-legend"><Database className="size-5" /></span>
                                <p className="text-body font-medium">No registries yet</p>
                                <p className="mt-1 text-meta text-legend">
                                    {createRegistries ? "Create your first registry to get started." : "Registries shared with you will appear here."}
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {registries.map((registry) => (
                                <RegistryGridCard
                                    key={registry.id}
                                    registry={registry}
                                />
                            ))}
                        </div>
                    </>}
                </div>
            </StandardLayout>
        </>
    );
};

export default Dashboard;
