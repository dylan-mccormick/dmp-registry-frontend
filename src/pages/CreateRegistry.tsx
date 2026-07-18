import { useContext } from "react";
import { useNavigate } from "react-router";
import apiClient from "../apiClient";
import CreationForm, { FormField } from "../components/CreationForm";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { NavbarLevel } from "../context/NavbarLevel";

const CreateRegistry = () => {

    const { setBanner } = useContext(BannerContext);
    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);

    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const type = formData.get("type") as string;

        if (type == "") {
            setBanner({ message: "Please select a registry type.", level: "error" });
            return;
        }

        addProcess("creating_registry");

        apiClient.post("/api/v1/registries/new", { name, type }).then(res => {
            if (!res.ok) {
                res.json().then(text => {
                    setBanner({ message: text.message ?? "Failed to create registry", level: "error" });
                });
                throw new Error("Failed to create registry", { cause: res.status });
            }

            res.json().then(data => {
                setBanner({ message: "Registry created successfully.", level: "success" });
                navigate(`/registries/${data.id}`); // Redirect to the new registry page
            })
        }).catch(error => {
            console.error("Error creating registry:", error);
            setBanner({ message: "Failed to create registry. Please try again.", level: "error" });
        }).finally(() => removeProcess("creating_registry"));
    };

    const fields: FormField[] = [
        { name: "name", label: "Name/Identifier", type: "text", required: true },
        { name: "type", label: "Registry Type", type: "select", options: [
            { value: "", label: "Select a type" },
            { value: "files", label: "Filesystem" },
            { value: "mongodb", label: "MongoDB" },
            { value: "sqlite", label: "Relational / SQLite" },
            { value: "keyvalue", label: "Key-Value Store" }
        ], required: true, warning: "Warning: This option is irreversible. Make sure to choose the correct registry type, as it cannot be changed later." }
    ];

    return <>
        <StandardLayout title="Create Registry" navbarLevel={NavbarLevel.TOP} >
            <div className="p-8" >
                <CreationForm title="Create New Registry" buttonText="Create Registry" buttonLoadingText="Creating..." fields={fields} onSubmit={handleSubmit} loading={processes.has("creating_registry")} />
            </div>
        </StandardLayout>
    </>
};

export default CreateRegistry;