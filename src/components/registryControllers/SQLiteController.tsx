import { Pencil, Plus, Table2, Trash2, X } from "lucide-react";
import { useCallback, useContext, useEffect, useId, useState, type JSX } from "react";
import { useParams } from "react-router";
import apiClient from "../../apiClient";
import { BannerContext } from "../../context/BannerContext";
import { ModalContext } from "../../context/ModalContext";
import { RegistryContext } from "../../context/RegistryContext";
import useRegistryBootstrap, { RegistryLoadingState } from "../../hooks/useRegistryBootstrap";
import { RegistryUserPermissions } from "../../model/RegistryUser";
import { readApiError } from "../../utils/readApiError";
import type { FormField } from "../CreationForm";
import HTMLTable from "../HTMLTable";
import PageHeader from "../PageHeader";
import ResourceList from "./ResourceList";

type ColumnType = "integer" | "real" | "text";

interface ColumnInfo {
    name: string;
    type: ColumnType;
    notNull: boolean;
    unique: boolean;
    primaryKey: boolean;
}

interface TableInfo {
    name: string;
    columns: ColumnInfo[];
    rowCount: number;
}

type Row = Record<string, string | number | null>;

// The backend returns at most this many rows per request
const ROW_LIMIT = 1000;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

const identifierError = (name: string) => {
    if (!name) return "A name is required.";
    if (!IDENTIFIER.test(name)) return "Use letters, numbers and underscores, starting with a letter or underscore (max 64).";
    if (name.toLowerCase().startsWith("sqlite_")) return "Names may not start with 'sqlite_'.";
    return null;
};

interface ColumnDraft {
    key: number;
    name: string;
    type: ColumnType;
    notNull: boolean;
    unique: boolean;
}

// Modal body for defining a new table and its columns
const CreateTableForm = ({ existing, onCreate }: { existing: string[]; onCreate: (name: string, columns: Omit<ColumnDraft, "key">[]) => void }) => {
    const { closeModal } = useContext(ModalContext);
    const formId = useId();
    const [ name, setName ] = useState("");
    const [ columns, setColumns ] = useState<ColumnDraft[]>([ { key: 0, name: "", type: "text", notNull: false, unique: false } ]);
    const [ error, setError ] = useState<string | null>(null);

    const update = (key: number, patch: Partial<ColumnDraft>) => setColumns(cols => cols.map(c => c.key === key ? { ...c, ...patch } : c));

    const submit = () => {
        const nameError = identifierError(name);
        if (nameError) return setError(`Table name: ${nameError}`);
        if (existing.includes(name)) return setError(`A table named '${name}' already exists.`);
        for (const c of columns) {
            const columnError = identifierError(c.name);
            if (columnError) return setError(`Column ${columns.indexOf(c) + 1}: ${columnError}`);
            if (c.name.toLowerCase() === "id") return setError("'id' is added automatically; choose another column name.");
        }
        if (new Set(columns.map(c => c.name.toLowerCase())).size !== columns.length) return setError("Column names must be unique.");

        closeModal();
        onCreate(name, columns.map(({ key, ...c }) => { void key; return c; }));
    };

    return <div className="flex flex-col gap-5">
        <div>
            <label htmlFor={`${formId}-name`} className="label">Table name</label>
            <input id={`${formId}-name`} className="field font-mono" value={name} onChange={e => { setName(e.target.value); setError(null); }} autoComplete="off" />
        </div>

        <fieldset>
            <legend className="label">Columns</legend>
            <p className="mb-3 text-xs text-legend">An <code className="font-mono">id</code> column is added automatically.</p>
            <ul className="flex flex-col gap-3">
                {columns.map((c, i) => <li key={c.key} className="rounded-2xl bg-surface p-3">
                    <div className="flex gap-2">
                        <input aria-label={`Column ${i + 1} name`} placeholder="column_name" className="field min-h-10 bg-bg font-mono" value={c.name} onChange={e => { update(c.key, { name: e.target.value }); setError(null); }} autoComplete="off" />
                        <select aria-label={`Column ${i + 1} type`} className="field min-h-10 w-32 shrink-0" value={c.type} onChange={e => update(c.key, { type: e.target.value as ColumnType })}>
                            <option value="text">Text</option>
                            <option value="integer">Integer</option>
                            <option value="real">Real</option>
                        </select>
                        <button type="button" className="button-icon size-10" aria-label={`Remove column ${i + 1}`} disabled={columns.length === 1} onClick={() => setColumns(cols => cols.filter(x => x.key !== c.key))}>
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="mt-2.5 flex gap-5 px-1 text-meta">
                        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={c.notNull} onChange={e => update(c.key, { notNull: e.target.checked })} /> Required</label>
                        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={c.unique} onChange={e => update(c.key, { unique: e.target.checked })} /> Unique</label>
                    </div>
                </li>)}
            </ul>
            <button type="button" className="button-link mt-3 text-meta" disabled={columns.length >= 64} onClick={() => setColumns(cols => [ ...cols, { key: Math.max(...cols.map(x => x.key)) + 1, name: "", type: "text", notNull: false, unique: false } ])}>
                + Add column
            </button>
        </fieldset>

        <p role="alert" className="text-meta text-danger empty:hidden">{error}</p>

        <div className="mt-2 flex justify-end gap-2">
            <button className="button-secondary" onClick={closeModal}>Cancel</button>
            <button className="button-primary" onClick={submit}>Create Table</button>
        </div>
    </div>;
};

const columnFormFields = (columns: ColumnInfo[], row?: Row): FormField[] => columns.filter(c => !c.primaryKey).map(c => ({
    name: c.name,
    label: `${c.name}${c.notNull ? " (required)" : ""}`,
    type: c.type === "text" ? "text" : "number",
    stateValue: row?.[c.name] ?? undefined,
    maxLength: c.type === "text" ? 10000 : undefined,
}));

const SQLiteController = () => {

    const { registryId } = useParams();
    const { registryLoading } = useRegistryBootstrap(registryId);

    const { showModal, closeModal } = useContext(ModalContext);
    const { setBanner } = useContext(BannerContext);
    const { registry, localUser } = useContext(RegistryContext);

    const canWrite = localUser?.permissions?.includes(RegistryUserPermissions.WRITE_REGISTRY) ?? false;
    const base = `/r/${registryId}/api/v1`;

    const [ tables, setTables ] = useState<TableInfo[] | null>(null);
    const [ selected, setSelected ] = useState<string | undefined>();
    const [ rows, setRows ] = useState<{ table: string; rows: Row[]; total: number } | null>(null);
    const [ refreshKey, setRefreshKey ] = useState(0);
    const refresh = () => setRefreshKey(k => k + 1);

    const selectedTable = tables?.find(t => t.name === selected);

    // Load the table list; keep the selection if the table still exists
    useEffect(() => {
        if (registryLoading != RegistryLoadingState.LOADED) return;
        apiClient.get(`${base}/tables`).then(async res => {
            if (!res.ok) throw new Error(await readApiError(res, "Failed to load tables."));
            const data = await res.json() as TableInfo[];
            setTables(data);
            setSelected(current => data.some(t => t.name === current) ? current : data[0]?.name);
        }).catch(err => {
            console.error(err);
            setBanner({ level: "error", message: err.message });
        });
    }, [base, registryLoading, refreshKey, setBanner]);

    // Load rows for the selected table
    useEffect(() => {
        if (!selected) return;
        apiClient.get(`${base}/tables/${selected}/rows?limit=${ROW_LIMIT}`).then(async res => {
            if (!res.ok) throw new Error(await readApiError(res, `Failed to load rows for '${selected}'.`));
            const data = await res.json() as { rows: Row[]; total: number };
            setRows({ table: selected, rows: data.rows, total: data.total });
        }).catch(err => {
            console.error(err);
            setBanner({ level: "error", message: err.message });
        });
    }, [base, selected, refreshKey, setBanner]);

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

    const createTable = () => showModal({
        title: "New Table",
        type: "custom",
        content: <CreateTableForm existing={tables?.map(t => t.name) ?? []} onCreate={(name, columns) => {
            mutate(() => apiClient.post(`${base}/tables`, { name, columns }), `Created table '${name}'.`, `Failed to create table '${name}'.`, () => setSelected(name));
        }} />
    });

    const dropTable = (table: string) => showModal({
        title: "Drop Table",
        message: `Permanently delete '${table}' and all of its rows? This can't be undone.`,
        type: "confirm",
        onConfirm: () => mutate(() => apiClient.delete(`${base}/tables/${table}`), `Dropped table '${table}'.`, `Failed to drop '${table}'.`)
    });

    const editRow = (table: TableInfo, row?: Row) => showModal({
        title: row ? `Edit Row ${row.id}` : "Add Row",
        message: row ? undefined : `Add a row to '${table.name}'. Leave a field empty to store NULL.`,
        type: "form",
        formFields: columnFormFields(table.columns, row),
        onConfirm: (result) => {
            const values = JSON.parse(result || "{}") as Record<string, string>;
            if (row) mutate(() => apiClient.put(`${base}/tables/${table.name}/rows/${row.id}`, { values }), `Updated row ${row.id}.`, `Failed to update row ${row.id}.`);
            else mutate(() => apiClient.post(`${base}/tables/${table.name}/rows`, { values }), `Added a row to '${table.name}'.`, `Failed to add a row to '${table.name}'.`);
        }
    });

    const deleteRow = (table: string, rowId: number) => showModal({
        title: "Delete Row",
        message: `Delete row ${rowId} from '${table}'?`,
        type: "confirm",
        onConfirm: () => mutate(() => apiClient.delete(`${base}/tables/${table}/rows/${rowId}`), `Deleted row ${rowId}.`, `Failed to delete row ${rowId}.`)
    });

    const tableRows = rows && selectedTable && rows.table === selectedTable.name ? rows : null;

    return <>
        <PageHeader eyebrow="SQLite" title={registry?.name ?? "SQLite Registry"} actions={canWrite && <button className="button-primary" onClick={createTable}><Plus className="size-4" /> New Table</button>} />

        {tables && tables.length === 0 && <div className="card flex flex-col items-center py-16 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-xl bg-bg text-legend"><Table2 className="size-5" /></span>
            <p className="text-body font-medium">No tables yet</p>
            <p className="mt-1 text-meta text-legend">{canWrite ? "Create a table to start storing rows." : "Tables created in this registry will appear here."}</p>
        </div>}

        {tables && tables.length > 0 && <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
            <ResourceList label="Tables" items={tables.map(t => ({ name: t.name, count: t.rowCount }))} countNoun={[ "row", "rows" ]} selected={selected} onSelect={setSelected} />

            {selectedTable && <section aria-labelledby="sqlite-table-title" className="min-w-0">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h2 id="sqlite-table-title" className="truncate font-mono text-h3 font-semibold">{selectedTable.name}</h2>
                        <ul aria-label="Columns" className="mt-2 flex flex-wrap gap-1.5">
                            {selectedTable.columns.map(c => <li key={c.name} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-legend">
                                <span className="font-mono font-medium text-ink">{c.name}</span>
                                <span>{c.primaryKey ? "primary key" : c.type}{c.notNull && !c.primaryKey ? " · required" : ""}{c.unique && !c.primaryKey ? " · unique" : ""}</span>
                            </li>)}
                        </ul>
                    </div>
                    {canWrite && <div className="flex shrink-0 gap-2">
                        <button className="button-destructive" onClick={() => dropTable(selectedTable.name)}>Drop Table</button>
                        <button className="button-primary" onClick={() => editRow(selectedTable)}><Plus className="size-4" /> Add Row</button>
                    </div>}
                </div>

                {tableRows && tableRows.rows.length === 0 && <p className="card text-center text-meta text-legend">This table has no rows.</p>}
                {tableRows && tableRows.rows.length > 0 && <>
                    <HTMLTable<Record<string, string | number | JSX.Element>>
                        key={selectedTable.name}
                        columns={[
                            ...selectedTable.columns.map(c => ({ text: c.name, dataKey: c.name, fixedPixelSize: c.primaryKey ? 90 : undefined, queryable: !c.primaryKey })),
                            ...(canWrite ? [ { text: "Actions", dataKey: "__actions", queryable: false, fixedPixelSize: 110 } ] : [])
                        ]}
                        data={tableRows.rows.map(r => ({
                            ...Object.fromEntries(Object.entries(r).map(([ k, v ]) => [ k, v ?? "NULL" ])),
                            __actions: <div className="flex items-center gap-0.5">
                                <button className="button-icon size-8" aria-label={`Edit row ${r.id}`} title="Edit" onClick={() => editRow(selectedTable, r)}><Pencil className="size-4" /></button>
                                <button className="button-icon size-8 not-disabled:hover:bg-danger/8 not-disabled:hover:text-danger" aria-label={`Delete row ${r.id}`} title="Delete" onClick={() => deleteRow(selectedTable.name, Number(r.id))}><Trash2 className="size-4" /></button>
                            </div>
                        }))}
                    />
                    {tableRows.total > tableRows.rows.length && <p className="mt-3 text-meta text-legend">Showing the first {tableRows.rows.length} of {tableRows.total} rows.</p>}
                </>}
            </section>}
        </div>}
    </>;
};

export default SQLiteController;
