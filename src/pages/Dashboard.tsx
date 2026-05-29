import { useContext, useEffect, useState } from "react";
import StandardLayout from "../components/StandardLayout";
import { UserContext } from "../context/UserContext";
import { NavbarLevel } from "../context/NavbarLevel";
import apiClient from "../apiClient";
import { useNavigate } from "react-router";

interface RegistryMetadata {
    id: string;
    name: string;
    owner?: string;
    type: string;
    createdAt: string;
}

const fetchRegistries = async () => {
    return apiClient.get("/api/v1/registries/list/me").then(res => {
        if (res.ok) {
            return res.json();
        }

        throw new Error("Failed to fetch registries", { cause: res.status });
    })
};

const RegistryGridCard = ({ registry }: { registry: RegistryMetadata }) => {
    const navigate = useNavigate();

    return <>
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer text-left" onClick={() => navigate(`/registries/${registry.id}`)} >
        <h2 className="text-xl font-semibold mb-2" >{registry.name}</h2>
        <p className="text-gray-600 mb-1" >Owner: {registry.owner ?? "Unassigned"}</p>
        <p className="text-gray-600 mb-1" >Type: {registry.type}</p>
        <p className="text-gray-500 text-sm" >Created: {new Date(registry.createdAt).toLocaleDateString()}</p>
    </div>
    </>
}

const Dashboard = () => {

    const { user } = useContext(UserContext);

    const createRegistries = user?.permissions.includes("CREATE_REGISTRY") ?? false;
    const [ loading, setLoading ] = useState(true);

    const navigate = useNavigate();

    const [ registries, setRegistries ] = useState<RegistryMetadata[]>([]);

    useEffect(() => {
        fetchRegistries().then((data) => {
            console.log(data);
            setRegistries(data);
            setLoading(false);
        }).catch((error) => {
            console.error("Error fetching registries:", error);
            setLoading(false);
        });
    }, []);

    return <>

    <StandardLayout navbarLevel={ NavbarLevel.TOP } title="Registries Directory">
        <div className="p-8" >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6" >
                <h1 className="text-3xl font-bold" >Registries Directory</h1>
                <button className={`button ${!createRegistries ? "hidden" : ""} button-primary mt-2 sm:mt-0`} onClick={() => navigate("/registries/new")} >Create Registry</button>
            </div>

            {loading ? (
                <div className="text-center" >
                    <p className="text-gray-500" >Loading registries...</p>
                </div>
            ) : (
                <div className="text-center" >
                    {registries.length === 0 && <span className="text-gray-500">No registries found.</span>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" >
                        {registries.map(registry => <RegistryGridCard key={registry.id} registry={registry} />)}
                    </div>
                </div>
            )}
        </div>
    </StandardLayout>
    </>;

}

export default Dashboard;
