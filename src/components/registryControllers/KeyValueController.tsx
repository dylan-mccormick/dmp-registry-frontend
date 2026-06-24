import { useContext, useEffect, useRef, useState } from "react";
import HTMLTable from "../HTMLTable";
import { useParams } from "react-router";
import { ModalContext } from "../../context/ModalContext";
import { NavContext } from "../../context/NavContext";
import useRegistryBootstrap from "../../hooks/useRegistryBootstrap";
import apiClient from "../../apiClient";

const KeyValueController = () => {

    const { registryId } = useParams();

    const { registryLoading } = useRegistryBootstrap(registryId);

    const { showModal } = useContext(ModalContext);
    const { setBanner } = useContext(NavContext);

    const [ loading ] = useState(false);
    const [ data, setData ] = useState<{ id: number; key: string; type: string; value: string; actions: React.ReactNode }[]>([]);

    const dataRef = useRef(data);
    useEffect(() => { dataRef.current = data; }, [data]);

    const handleEdit = (id: number) => {
        const row = dataRef.current.find(r => r.id == id);
        if (!row) return;

        showModal({
            title: "Edit Value",
            message: `Enter a new value for "${row["key"]}"`,
            type: "input",
            onConfirm: v => {
                // dummy
                console.log(v);
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

            }
        })
    };

    const columns: { text: string; dataKey: keyof typeof data[0]; queryable?: boolean }[] = [
        { text: "ID", dataKey: "id", queryable: false },
        { text: "Key", dataKey: "key" },
        { text: "Type", dataKey: "type" },
        { text: "Value", dataKey: "value" },
        { text: "Actions", dataKey: "actions", queryable: false }
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
    }, [ ]);

    return <>
        { loading && <p className="text-center">{registryLoading ? "Loading registry..." : "Loading key-value pairs..."}</p> || data.length === 0 && <p className="text-center">No key-value pairs found.</p> }
        { !loading && data.length > 0 && <HTMLTable<{ id: number; key: string; type: string; value: string; actions: React.ReactNode }> columns={columns} data={data} /> }
    </>;

}

export default KeyValueController;