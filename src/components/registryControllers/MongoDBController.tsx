import { ArrowLeft, ArrowRight, Leaf, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useContext, useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router";
import apiClient from "../../apiClient";
import { BannerContext } from "../../context/BannerContext";
import { ModalContext } from "../../context/ModalContext";
import { RegistryContext } from "../../context/RegistryContext";
import useRegistryBootstrap, { RegistryLoadingState } from "../../hooks/useRegistryBootstrap";
import { RegistryUserPermissions } from "../../model/RegistryUser";
import { readApiError } from "../../utils/readApiError";
import PageHeader from "../PageHeader";
import JsonEditor from "./JsonEditor";
import ResourceList from "./ResourceList";

interface CollectionInfo {
    name: string;
    documentCount: number;
}

type MongoDocument = Record<string, unknown> & { _id?: unknown };

const PAGE_SIZE = 50;
const COLLECTION_NAME = /^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/;

// Documents arrive as relaxed Extended JSON: ObjectIds look like {"$oid": "..."}
const documentId = (doc: MongoDocument): string => {
    const id = doc._id;
    if (id && typeof id === "object" && "$oid" in id) return String((id as { $oid: string }).$oid);
    return String(id);
};

const MongoDBController = () => {

    const { registryId } = useParams();
    const { registryLoading } = useRegistryBootstrap(registryId);

    const { showModal, closeModal } = useContext(ModalContext);
    const { setBanner } = useContext(BannerContext);
    const { registry, localUser } = useContext(RegistryContext);

    const canWrite = localUser?.permissions?.includes(RegistryUserPermissions.WRITE_REGISTRY) ?? false;
    const base = `/r/${registryId}/api/v1`;

    const [ collections, setCollections ] = useState<CollectionInfo[] | null>(null);
    const [ unavailable, setUnavailable ] = useState<string | null>(null);
    const [ selected, setSelected ] = useState<string | undefined>();
    const [ page, setPage ] = useState<{ collection: string; documents: MongoDocument[]; total: number } | null>(null);
    const [ skip, setSkip ] = useState(0);
    const [ filterText, setFilterText ] = useState("");
    const [ appliedFilter, setAppliedFilter ] = useState("");
    const [ refreshKey, setRefreshKey ] = useState(0);
    const refresh = () => setRefreshKey(k => k + 1);

    const selectCollection = (name: string) => {
        setSelected(name);
        setSkip(0);
        setFilterText("");
        setAppliedFilter("");
    };

    // Load collections; a 503 means MongoDB isn't set up on the server
    useEffect(() => {
        if (registryLoading != RegistryLoadingState.LOADED) return;
        apiClient.get(`${base}/collections`).then(async res => {
            if (res.status === 503) {
                setUnavailable(await readApiError(res, "MongoDB is unavailable."));
                return;
            }
            if (!res.ok) throw new Error(await readApiError(res, "Failed to load collections."));
            const data = await res.json() as CollectionInfo[];
            setUnavailable(null);
            setCollections(data);
            setSelected(current => data.some(c => c.name === current) ? current : data[0]?.name);
        }).catch(err => {
            console.error(err);
            setBanner({ level: "error", message: err.message });
        });
    }, [base, registryLoading, refreshKey, setBanner]);

    // Load a page of documents for the selected collection
    useEffect(() => {
        if (!selected) return;
        const query = new URLSearchParams({ limit: String(PAGE_SIZE), skip: String(skip) });
        if (appliedFilter) query.set("filter", appliedFilter);
        apiClient.get(`${base}/collections/${selected}/documents?${query}`).then(async res => {
            if (!res.ok) throw new Error(await readApiError(res, `Failed to load documents from '${selected}'.`));
            const data = await res.json() as { documents: MongoDocument[]; total: number };
            setPage({ collection: selected, documents: data.documents, total: data.total });
        }).catch(err => {
            console.error(err);
            setBanner({ level: "error", message: err.message });
        });
    }, [base, selected, skip, appliedFilter, refreshKey, setBanner]);

    // Run a write request behind a "please wait" modal, then refresh
    const mutate = useCallback((request: () => Promise<Response>, success: string, failure: string, onSuccess?: () => void) => {
        showModal({ title: "Please wait", type: "buttonless", loadingSpinner: true });
        request().then(async res => {
            if (!res.ok) throw new Error(await readApiError(res, failure));
            setBanner({ level: "success", message: success });
            onSuccess?.();
            refresh();
        }).catch(err => {
            console.error(err);
            setBanner({ level: "error", message: err.message });
        }).finally(closeModal);
    }, [closeModal, setBanner, showModal]);

    const applyFilter = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = filterText.trim();
        if (trimmed) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
            } catch {
                setBanner({ level: "error", message: "The filter must be a JSON object, e.g. {\"status\": \"active\"}." });
                return;
            }
        }
        setSkip(0);
        setAppliedFilter(trimmed);
    };

    const createCollection = () => showModal({
        title: "New Collection",
        type: "input",
        placeholder: "collection_name",
        onConfirm: (name) => {
            if (!COLLECTION_NAME.test(name) || name.startsWith("system.")) {
                setBanner({ level: "error", message: "Collection names must start with a letter or underscore and use only letters, numbers, '_', '-' and '.'." });
                return;
            }
            mutate(() => apiClient.post(`${base}/collections`, { name }), `Created collection '${name}'.`, `Failed to create '${name}'.`, () => selectCollection(name));
        }
    });

    const dropCollection = (name: string) => showModal({
        title: "Drop Collection",
        message: `Permanently delete '${name}' and all of its documents? This can't be undone.`,
        type: "confirm",
        onConfirm: () => mutate(() => apiClient.delete(`${base}/collections/${name}`), `Dropped collection '${name}'.`, `Failed to drop '${name}'.`)
    });

    const editDocument = (collection: string, doc?: MongoDocument) => showModal({
        title: doc ? "Edit Document" : "Insert Document",
        message: doc ? `Editing ${documentId(doc)}. The _id can't be changed.` : `Insert a JSON document into '${collection}'. Omit _id to generate one.`,
        type: "custom",
        content: <JsonEditor
            initialValue={doc ? JSON.stringify(doc, null, 2) : "{\n  \n}"}
            confirmText={doc ? "Save" : "Insert"}
            onSave={value => doc
                ? mutate(() => apiClient.put(`${base}/collections/${collection}/documents/${encodeURIComponent(documentId(doc))}`, { document: value }), "Document updated.", "Failed to update the document.")
                : mutate(() => apiClient.post(`${base}/collections/${collection}/documents`, { document: value }), "Document inserted.", "Failed to insert the document.")}
        />
    });

    const deleteDocument = (collection: string, doc: MongoDocument) => showModal({
        title: "Delete Document",
        message: `Delete document ${documentId(doc)} from '${collection}'?`,
        type: "confirm",
        onConfirm: () => mutate(() => apiClient.delete(`${base}/collections/${collection}/documents/${encodeURIComponent(documentId(doc))}`), "Document deleted.", "Failed to delete the document.")
    });

    const current = page && page.collection === selected ? page : null;

    return <>
        <PageHeader eyebrow="MongoDB" title={registry?.name ?? "MongoDB Registry"} actions={canWrite && !unavailable && <button className="button-primary" onClick={createCollection}><Plus className="size-4" /> New Collection</button>} />

        {unavailable && <div className="card flex flex-col items-center py-16 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-xl bg-bg text-legend"><Leaf className="size-5" /></span>
            <p className="text-body font-medium">MongoDB isn't available</p>
            <p className="mt-1 max-w-[50ch] text-meta text-legend">{unavailable} Your data is safe; ask the administrator to check the MongoDB service.</p>
        </div>}

        {!unavailable && collections && collections.length === 0 && <div className="card flex flex-col items-center py-16 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-xl bg-bg text-legend"><Leaf className="size-5" /></span>
            <p className="text-body font-medium">No collections yet</p>
            <p className="mt-1 text-meta text-legend">{canWrite ? "Create a collection to start storing documents." : "Collections created in this registry will appear here."}</p>
        </div>}

        {!unavailable && collections && collections.length > 0 && <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
            <ResourceList label="Collections" items={collections.map(c => ({ name: c.name, count: c.documentCount }))} countNoun={[ "doc", "docs" ]} selected={selected} onSelect={selectCollection} />

            {selected && <section aria-labelledby="mongo-collection-title" className="min-w-0">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 id="mongo-collection-title" className="truncate font-mono text-h3 font-semibold">{selected}</h2>
                    {canWrite && <div className="flex shrink-0 gap-2">
                        <button className="button-destructive" onClick={() => dropCollection(selected)}>Drop Collection</button>
                        <button className="button-primary" onClick={() => editDocument(selected)}><Plus className="size-4" /> Insert Document</button>
                    </div>}
                </div>

                <form onSubmit={applyFilter} className="mb-4 flex flex-col gap-2 sm:flex-row" role="search" aria-label="Filter documents">
                    <input
                        aria-label="Filter (JSON query)"
                        placeholder='Filter, e.g. {"status": "active"}'
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                        spellCheck={false}
                        className="field font-mono text-meta"
                    />
                    <div className="flex shrink-0 gap-2">
                        <button type="submit" className="button-secondary min-h-11 px-5">Apply</button>
                        {appliedFilter && <button type="button" className="button-link text-meta" onClick={() => { setFilterText(""); setAppliedFilter(""); setSkip(0); }}>Clear</button>}
                    </div>
                </form>

                {current && current.documents.length === 0 && <p className="card text-center text-meta text-legend">{appliedFilter ? "No documents match this filter." : "This collection is empty."}</p>}

                {current && current.documents.length > 0 && <>
                    <ul className="flex flex-col gap-3">
                        {current.documents.map(doc => <li key={documentId(doc)} className="rounded-2xl ring-1 ring-rule/60">
                            <div className="flex items-center justify-between gap-3 border-b border-rule/60 px-4 py-2">
                                <span className="truncate font-mono text-xs text-legend">_id: {documentId(doc)}</span>
                                {canWrite && <div className="flex shrink-0 items-center gap-0.5">
                                    <button className="button-icon size-8" aria-label={`Edit document ${documentId(doc)}`} title="Edit" onClick={() => editDocument(selected, doc)}><Pencil className="size-4" /></button>
                                    <button className="button-icon size-8 not-disabled:hover:bg-danger/8 not-disabled:hover:text-danger" aria-label={`Delete document ${documentId(doc)}`} title="Delete" onClick={() => deleteDocument(selected, doc)}><Trash2 className="size-4" /></button>
                                </div>}
                            </div>
                            <pre tabIndex={0} aria-label={`Document ${documentId(doc)}`} className="max-h-72 overflow-auto px-4 py-3 font-mono text-meta leading-relaxed">{JSON.stringify(doc, null, 2)}</pre>
                        </li>)}
                    </ul>

                    <div className="mt-4 flex items-center justify-between text-meta text-legend">
                        <span>{skip + 1}–{skip + current.documents.length} of {current.total}</span>
                        <div className="flex items-center gap-1">
                            <button className="button-icon size-8" aria-label="Previous page" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}><ArrowLeft className="size-4" /></button>
                            <button className="button-icon size-8" aria-label="Next page" disabled={skip + PAGE_SIZE >= current.total} onClick={() => setSkip(skip + PAGE_SIZE)}><ArrowRight className="size-4" /></button>
                        </div>
                    </div>
                </>}
            </section>}
        </div>}
    </>;
};

export default MongoDBController;
