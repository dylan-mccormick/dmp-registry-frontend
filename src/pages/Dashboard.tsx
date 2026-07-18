import { useContext, useEffect, useState } from "react";
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

const RegistryGridCard = ({ registry }: { registry: RegistryMetadata }) => {
    const navigate = useNavigate();

    const { setRegistry } = useContext(RegistryContext);

    const navigateAway = () => {
        setRegistry(undefined);
        navigate(`/registries/${registry.id}`);
    };

    return (
        <>
            <div
                className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer text-left"
                onClick={navigateAway}
            >
                <h2 className="text-xl font-semibold mb-2">{registry.name}</h2>
                <p className="text-gray-600 mb-1">
                    Owner: {registry.owner ?? "Unassigned"}
                </p>
                <p className="text-gray-600 mb-1">Type: {registry.type}</p>
                <p className="text-gray-500 text-sm">
                    Created: {new Date(registry.createdAt).toLocaleDateString()}
                </p>
            </div>
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
                <div className="p-8">
                    <PageHeader
                        title="Registries Directory"
                        buttonText={
                            createRegistries ? "Create New Registry" : undefined
                        }
                        buttonAction={() => navigate("/registries/new")}
                    />

                    {!processes.has("fetching_registries") && <div className="text-center">
                        {registries.length === 0 && (
                            <span className="text-gray-500">
                                No registries found.
                            </span>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {registries.map((registry) => (
                                <RegistryGridCard
                                    key={registry.id}
                                    registry={registry}
                                />
                            ))}
                        </div>
                    </div>}
                </div>
            </StandardLayout>
        </>
    );
};

export default Dashboard;
