import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import apiClient from "../../apiClient";
import { BannerContext } from "../../context/BannerContext";
import { ModalContext } from "../../context/ModalContext";
import { RegistryContext } from "../../context/RegistryContext";
import useRegistryBootstrap from "../../hooks/useRegistryBootstrap";
import { RegistryUserPermissions } from "../../model/RegistryUser";
import HTMLTable from "../HTMLTable";
import PageHeader from "../PageHeader";

const KeyValueController = () => {

    const { registryId } = useParams();

    const { registryLoading } = useRegistryBootstrap(registryId);

    const { showModal } = useContext(ModalContext);
    const { setBanner } = useContext(BannerContext);
    const { registry, localUser } = useContext(RegistryContext);

    const [ loading ] = useState(false);
    const [ refreshData, setRefreshData ] = useState(0);
    const [ data, setData ] = useState<{ id: number; key: string; type: string; value: string | number | boolean | Date; actions: React.ReactNode }[]>([]);

    const dataRef = useRef(data);
    useEffect(() => { dataRef.current = data; }, [data]);

    const handleCreate = () => {
        showModal({
            title: "Create new Key",
            message: `Please fill out the form to create a new key.`,
            type: "form",
            formFields: [
                { name: "key", label: "Key", type: "text", required: true, minLength: 1, maxLength: 64, placeholder: "Key (1-64 characters, unique)" },
                { name: "datatype", label: "Data Type", type: "select", required: true, options: [ { label: "String/Text", value: "string" }, { label: "Number", value: "number" }, { label: "Boolean", value: "boolean" }, { label: "Date", value: "date" }, { label: "Time", value: "time" }, { label: "Date + Time", value: "datetime" } ] }
            ],
            onConfirm: (results) => {
                const parsedResults = JSON.parse(results || "{}");
                const key = parsedResults["key"];
                const datatype = parsedResults["datatype"];

                // verify key is valid
                if (!key || key.length < 1 || key.length > 64) {
                    setBanner({ message: "Key must be between 1 and 64 characters.", level: "error" });
                    return;
                }

                if (!(/^[a-zA-Z0-9_]+$/.test(key))) {
                    setBanner({ message: "Key must only contain alphanumeric characters and underscores.", level: "error" });
                    return;
                }

                if (dataRef.current.find(d => d.key == key)) {
                    setBanner({ message: `Key "${key}" already exists. Please choose a different key.`, level: "error" });
                    return;
                }

                showModal({
                    title: "Edit Value",
                    message: `Enter a new value for "${key}"`,
                    type: "form",
                    formFields: [
                        { name: "value", label: "Value", labelText: key, type: ( datatype == "number" ? "number" : datatype == "boolean" ? "checkbox" : datatype == "date" ? "date" : datatype == "time" ? "time" : datatype == "datetime" ? "datetime-local" : "text" ), required: true}
                    ],
                    onConfirm: (newValue) => {
                        const parsedValue = JSON.parse(newValue || "{}");
                        const postedValue = datatype == "boolean" ? (parsedValue["value"] == "on") : parsedValue["value"];

                        apiClient.put(`/r/${registryId}/api/v1/data/${key}`, { type: datatype, value: postedValue }).then(async res => {
                            if (!res.ok) {
                                throw new Error(`HTTP request failed with status ${res.status}: ${await res.text()}`);
                            }
                            setBanner({ message: `Successfully created key-value pair "${key}".`, level: "success" });
                            // manually refresh the data, we don't know what the next ID will be
                            setRefreshData(refreshData + 1);
                        }).catch(err => {
                            console.error(`Failed to create key-value pair "${key}".`, err);
                            setBanner({ message: `Failed to create key-value pair "${key}".`, level: "error" });
                        });
                    }
                })
            }
        })
    };

    const handleEdit = (id: number) => {
        const row = dataRef.current.find(r => r.id == id);
        if (!row) return;

        showModal({
            title: "Edit Value",
            message: `Enter a new value for "${row["key"]}"`,
            type: "form",
            formFields: [
                { name: "value", label: "Value", labelText: row["key"], type: ( row["type"] == "number" ? "number" : row["type"] == "boolean" ? "checkbox" : row["type"] == "date" ? "date" : row["type"] == "time" ? "time" : row["type"] == "datetime" ? "datetime-local" : "text" ), required: true, stateValue: (row["type"] != "boolean" && row["value"] || undefined), defaultChecked: ( row["type"] == "boolean" && row["value"] == true )}
            ],
            onConfirm: (newValue) => {
                const parsedValue = JSON.parse(newValue || "{}");
                const postedValue = row["type"] == "boolean" ? (parsedValue["value"] == "on") : parsedValue["value"];

                apiClient.put(`/r/${registryId}/api/v1/data/${row["key"]}`, { value: postedValue }).then(async res => {
                    if (!res.ok) {
                        throw new Error(`HTTP request failed with status ${res.status}: ${await res.text()}`);
                    }

                    setBanner({ message: `Successfully updated value for "${row["key"]}".`, level: "success" });
                    setData(dataRef.current.map(d => d.id == row.id ? { ...d, value: postedValue } : d));
                }).catch(err => {
                    console.error(`Failed to update value for "${row["key"]}".`, err);
                    setBanner({ message: `Failed to update value for "${row["key"]}".`, level: "error" });
                });
            }
        })
    };

    const deletePair = (id: number) => {
        const row = dataRef.current.find(r => r.id == id);
        if (!row) return;

        showModal({
            title: "Delete Value",
            message: `Are you sure you would like to delete "${row["key"]}"?`,
            type: "confirm",
            onConfirm: () => {
                apiClient.delete(`/r/${registryId}/api/v1/data/${row["key"]}`).then(async res => {
                    if (!res.ok) {
                        throw new Error(`HTTP request failed with status ${res.status}: ${await res.text()}`);
                    }

                    setBanner({ message: `Successfully deleted "${row["key"]}".`, level: "success" });
                    setData(dataRef.current.filter(d => d.id != row.id));
                }).catch(err => {
                    console.error(`Failed to delete "${row["key"]}".`, err);
                    setBanner({ message: `Failed to delete "${row["key"]}".`, level: "error" });
                });
            }
        })
    };

    const columns: { text: string; dataKey: keyof typeof data[0]; queryable?: boolean, fixedPixelSize?: number }[] = [
        { text: "ID", dataKey: "id", queryable: false, fixedPixelSize: 150 },
        { text: "Key", dataKey: "key" },
        { text: "Type", dataKey: "type", fixedPixelSize: 150 },
        { text: "Value", dataKey: "value" },
        { text: "Actions", dataKey: "actions", queryable: false, fixedPixelSize: 160 }
    ];

    useEffect(() => {
        apiClient.get(`/r/${registryId}/api/v1/data`).then(async res => {
            if (!res.ok) {
                throw new Error(`Request failed with status code ${res.status}: ${await res.text()}`);
            }

            const data = await res.json();
            setData(data.map((d: { id: number; key: string; type: string; value: string }) => ({ id: d.id, key: d.key, type: d.type, value: d.value, actions: <div className="flex flex-row gap-2 items-center"><button className="button button-secondary" onClick={() => handleEdit(d.id)}>Edit</button><button className="button button-secondary border-red-500" onClick={() => deletePair(d.id)}>Delete</button></div> })));
        }).catch(err => {
            console.error(`Failed to load key-value pairs.`, err);
            setBanner({ level: "error", message: `Unable to load current data in registry.`});
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ refreshData ]);

    return <>
        <PageHeader title={registry?.name || "Key-Value Registry"} buttonText={localUser?.permissions?.includes(RegistryUserPermissions.WRITE_REGISTRY) ? "Create Key-Value Pair" : undefined} buttonAction={handleCreate} />
        { loading && <p className="text-center">{registryLoading ? "Loading registry..." : "Loading key-value pairs..."}</p> || data.length === 0 && <p className="text-center">No key-value pairs found.</p> }
        { !loading && data.length > 0 && <HTMLTable<{ id: number; key: string; type: string; value: string | number | boolean | Date; actions: React.ReactNode }> columns={columns} data={data} /> }
    </>;

}

export default KeyValueController;