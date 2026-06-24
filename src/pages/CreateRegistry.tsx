import { useContext, useState } from "react";
import StandardLayout from "../components/StandardLayout";
import { NavbarLevel } from "../context/NavbarLevel";
import { NavContext } from "../context/NavContext";
import apiClient from "../apiClient";
import { useNavigate } from "react-router";

const CreateRegistry = () => {

    const { setBanner } = useContext(NavContext);

    const navigate = useNavigate();

    const [ loading, setLoading ] = useState(false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const type = formData.get("type") as string;

        if (type == "") {
            setBanner({ message: "Please select a registry type.", level: "error" });
            return;
        }

        setLoading(true);

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
        }).finally(() => setLoading(false));
    };

    return <>
        <StandardLayout title="Create Registry" navbarLevel={NavbarLevel.TOP} >
            <div className="p-8" >
                <h1 className="text-3xl font-bold" >Create New Registry</h1>

                <div className="border border-gray-300 rounded w-1/2 mx-auto pb-16 mt-16 flex-1 p-4 overflow-y-auto" >
                    <form className="mt-4 max-w-sm mx-auto" onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2" htmlFor="name">Name/Identifier</label>
                            <input className="w-full px-3 py-2 border rounded" type="text" id="name" name="name" required />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2" htmlFor="type">Registry Type</label>
                            <select className="w-full px-3 py-2 border rounded" id="type" name="type" required>
                                <option value="">Select a type</option>
                                <option value="files">Filesystem</option>
                                <option value="mongodb">MongoDB</option>
                                <option value="sqlite">Relational / SQLite</option>
                                <option value="keyvalue">Key-Value Store</option>
                            </select>
                            <span className="text-sm text-red-500" >
                                Warning: This option is irreversible. Make sure to choose the correct registry type, as it cannot be changed later.
                            </span>
                        </div>

                        <button className="button button-primary w-full" type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Registry"}
                        </button>
                    </form>
                </div>
            </div>
        </StandardLayout>
    </>
};

export default CreateRegistry;