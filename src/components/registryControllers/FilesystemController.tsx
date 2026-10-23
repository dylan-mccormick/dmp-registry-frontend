import { ChevronRight, FileUp, Folder, FolderOpen, FolderPlus, Info, Pencil, Trash2 } from "lucide-react";
import { Fragment, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import apiClient from "../../apiClient";
import { BannerContext } from "../../context/BannerContext";
import { ModalContext } from "../../context/ModalContext";
import { RegistryContext } from "../../context/RegistryContext";
import useRegistryBootstrap, { RegistryLoadingState } from "../../hooks/useRegistryBootstrap";
import { RegistryUserPermissions } from "../../model/RegistryUser";
import { formatSize } from "../../utils/formatSize";
import { FormField } from "../CreationForm";
import HTMLTable from "../HTMLTable";
import PageHeader from "../PageHeader";

// File Hierarchy Information
interface FSNode { name: string; type: "file" | "directory"; children?: FSNode[]; };

// File metadata returned by /files/*filepath/meta
interface FileMeta {
    fName: string;
    directory: boolean;
    size: number;
    createdAt: string;
    modifiedAt: string;
    accessedAt: string;
    isPublic: boolean;
}

// Styling for the icon buttons in the actions column
const iconButtonClass = "button-icon size-8";

// Get the basename of a filepath
const baseName = (filePath: string) => {
    return filePath.split(`/`)[filePath.split(`/`).length - 1];
}

interface FileDetailsProps {
    filePath: string;
    meta: FileMeta;
    onView: () => void;
    onDownload: () => void;
    onClose: () => void;
}

const FileDetails = ({ filePath, meta, onView, onDownload, onClose }: FileDetailsProps) => {
    const details: [string, string][] = [
        [ "Path", filePath ],
        [ "Size", formatSize(meta.size) ],
        [ "Visibility", meta.isPublic ? "Public" : "Private" ],
        [ "Created", new Date(meta.createdAt).toLocaleString() ],
        [ "Modified", new Date(meta.modifiedAt).toLocaleString() ],
        [ "Accessed", new Date(meta.accessedAt).toLocaleString() ]
    ];

    return <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 rounded-2xl bg-surface p-4 text-meta">
            {details.map(([ label, value ]) => <Fragment key={label}>
                <dt className="text-legend">{label}</dt>
                <dd className="break-all">{value}</dd>
            </Fragment>)}
        </dl>
        <div className="mt-2 flex justify-end gap-2">
            <button className="button-secondary" onClick={onClose}>Close</button>
            <button className="button-secondary" onClick={onView}>View</button>
            <button className="button-primary" onClick={onDownload}>Download</button>
        </div>
    </div>
}

interface FileEditorProps {
    meta: FileMeta;
    onSave: (isPublic: boolean) => void;
    onDelete: () => void;
    onCancel: () => void;
}

const FileEditor = ({ meta, onSave, onDelete, onCancel }: FileEditorProps) => {
    const [ isPublic, setIsPublic ] = useState(meta.isPublic);

    return <div className="flex flex-col gap-2">
        <p className="text-meta text-legend">Public files can be accessed by anyone without logging in.</p>
        <FormField name="isPublic" type="checkbox" labelText="Public File" stateValue={isPublic} setStateValue={setIsPublic} />
        <div className="mt-4 flex items-center justify-between">
            <button className="button-destructive" onClick={onDelete}>Delete</button>
            <div className="flex gap-2">
                <button className="button-secondary" onClick={onCancel}>Cancel</button>
                <button className="button-primary" onClick={() => onSave(isPublic)}>Save</button>
            </div>
        </div>
    </div>
}

const HierarchyViewer = ({ node }: { node: FSNode }) => {
    // params
    const { registryId } = useParams();

    // registry
    const { localUser } = useContext(RegistryContext);

    // banner/modal
    const { setBanner } = useContext(BannerContext);
    const { showModal, closeModal } = useContext(ModalContext);

    // path/node mgmt
    const [ currentPath, setCurrentPath ] = useState<string[]>([]);
    const [ currentNode, setCurrentNode ] = useState<FSNode>(node);
    const [ baseNode, setBaseNode ] = useState<FSNode>(node);

    // view contents of node (dir)
    const [ contents, setContents ] = useState<(FSNode & { actions: React.ReactNode })[]>([]);

    // Update a node at a given path
    const updateNodeAtPath = useCallback((node: FSNode, path: string[], updater: (node: FSNode) => FSNode): FSNode => {
        if (path.length === 0) return updater(node);

        return {
            ...node,
            children: node.children?.map(child =>
                child.name === path[0]
                    // eslint-disable-next-line react-hooks/immutability
                    ? updateNodeAtPath(child, path.slice(1), updater)
                    : child
            )
        };
    }, []);

    // Upload file
    const requestUploadFiles = useCallback(() => {
        showModal({
            title: "Upload Files",
            type: "files",
            fileUploadConfig: {
                sizeLimit: 1024 * 1024 * 50 // 50 MB
            },
            onConfirm: async files => {
                closeModal();
                showModal({
                    title: "Uploading Files",
                    type: "buttonless",
                    loadingSpinner: true
                });
                try {
                    for (const file of files) {
                        const formData = new FormData();
                        formData.append('file', file, file.name);
                        const res = await apiClient.putMultipart(
                            `/r/${registryId}/api/v1/files${currentPath.join('/')}/${file.name}`,
                            formData
                        );
                        if (!res.ok) {
                            throw new Error(`HTTP request failed with status code ${res.statusText}: ${await res.text()}`);
                        }

                        // Update the current node's children to include the newly uploaded file
                        setBaseNode(prevNode => updateNodeAtPath(
                            prevNode,
                            currentPath.slice(1),
                            node => ({
                                ...node,
                                children: [...(node.children ?? []), { name: file.name, type: "file" }]
                            })
                        ));
                    }
                } catch (err) {
                    console.error(`Failed to upload files: `, err);
                    setBanner({ message: "Some files failed to upload.", level: "error" })
                } finally {
                    closeModal();
                }
            }
        });
    }, [closeModal, currentPath, registryId, setBanner, showModal, updateNodeAtPath]);

    // Create directory
    const requestCreateDirectory = useCallback(() => {
        showModal({
            title: "Create Directory",
            type: "input",
            placeholder: "Enter directory name",
            onConfirm: async dirName => {
                closeModal();
                showModal({
                    title: "Creating Directory",
                    type: "buttonless",
                    loadingSpinner: true
                });
                try {
                    const res = await apiClient.put(`/r/${registryId}/api/v1/files${currentPath.join('/')}/${dirName}?directory=true`, {});
                    if (!res.ok) {
                        throw new Error(`HTTP request failed with status code ${res.statusText}: ${await res.text()}`);
                    }

                    // Update the current node's children to include the newly created directory
                    setBaseNode(prevNode => updateNodeAtPath(
                        prevNode,
                        currentPath.slice(1),
                        node => ({
                            ...node,
                            children: [...(node.children ?? []), { name: dirName, type: "directory", children: [] }]
                        })
                    ));
                } catch (err) {
                    console.error(`Failed to create directory: `, err);
                    setBanner({ message: "Failed to create directory.", level: "error" })
                } finally {
                    closeModal();
                }
            }
        });
    }, [closeModal, currentPath, registryId, setBanner, showModal, updateNodeAtPath]);

    const openFileInNewTab = useCallback((filePath: string) => {
        showModal({
            title: "Downloading...",
            loadingSpinner: true,
            type: "buttonless"
        });
        apiClient.get(`/r/${registryId}/api/v1/files${filePath}`).then(async res => {
            if (!res.ok) {
                throw new Error(`HTTP request failed with status code ${res.statusText}: ${await res.text()}`);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }).catch(err => {
            console.error("Failed to open requested file in new tab", err);
            setBanner({ level: "error", message: "Failed to open file" });
        }).finally(closeModal);
    }, [showModal, registryId, closeModal, setBanner]);

    const downloadFile = useCallback((filePath: string) => {
        showModal({
            title: "Downloading...",
            loadingSpinner: true,
            type: "buttonless"
        });
        apiClient.get(`/r/${registryId}/api/v1/files${filePath}`).then(async res => {
            if (!res.ok) {
                throw new Error(`HTTP request failed with status code ${res.statusText}: ${await res.text()}`);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = baseName(filePath);
            a.click();
            URL.revokeObjectURL(url);
        }).catch(err => {
            console.error("Failed to open requested file in new tab", err);
            setBanner({ level: "error", message: "Failed to open file" });
        }).finally(closeModal);
    }, [closeModal, registryId, setBanner, showModal]);

    const openDirectory = useCallback((dirPath: string) => {
        setCurrentPath(dirPath.split(`/`));
    }, []);

    const deleteFileOrDirectory = useCallback((filePath: string) => {
        showModal({
            title: "Confirm Deletion",
            message: `Are you sure you want to delete ${filePath}? This action cannot be undone.`,
            type: "confirm",
            onConfirm: () => {
                showModal({
                    title: "Deleting...",
                    loadingSpinner: true,
                    type: "buttonless"
                });
                apiClient.delete(`/r/${registryId}/api/v1/files${filePath}`).then(async res => {
                    if (!res.ok) {
                        throw new Error(`HTTP request failed with status code ${res.statusText}: ${await res.text()}`);
                    }

                    setBanner({ level: "success", message: `Successfully deleted ${filePath}` });

                    // remove the deleted file from the current node's children
                    setBaseNode(prevNode => updateNodeAtPath(
                        prevNode,
                        currentPath.slice(1),
                        node => ({
                            ...node,
                            children: node.children?.filter(c => c.name !== baseName(filePath))
                        })
                    ));
                }).catch(err => {
                    console.error("Failed to delete requested file or directory", err);
                    setBanner({ level: "error", message: "Failed to delete file or directory" });
                }).finally(closeModal);
            }
        });
    }, [closeModal, currentPath, registryId, setBanner, showModal, updateNodeAtPath]);

    // Fetch a file's metadata behind a loading modal; resolves to null (with an error banner) on failure
    const fetchFileMeta = useCallback(async (filePath: string): Promise<FileMeta | null> => {
        showModal({
            title: "Loading...",
            loadingSpinner: true,
            type: "buttonless"
        });
        try {
            const res = await apiClient.get(`/r/${registryId}/api/v1/files${filePath}/meta`);
            if (!res.ok) {
                throw new Error(`HTTP request failed with status code ${res.statusText}: ${await res.text()}`);
            }

            return await res.json() as FileMeta;
        } catch (err) {
            console.error("Failed to fetch file metadata", err);
            setBanner({ level: "error", message: "Failed to load file details" });
            closeModal();
            return null;
        }
    }, [closeModal, registryId, setBanner, showModal]);

    const showFileDetails = useCallback(async (filePath: string) => {
        const meta = await fetchFileMeta(filePath);
        if (!meta) return;

        showModal({
            title: meta.fName,
            type: "custom",
            content: <FileDetails
                filePath={filePath}
                meta={meta}
                onView={() => openFileInNewTab(filePath)}
                onDownload={() => downloadFile(filePath)}
                onClose={closeModal}
            />
        });
    }, [closeModal, downloadFile, fetchFileMeta, openFileInNewTab, showModal]);

    const showFileEditor = useCallback(async (filePath: string) => {
        const meta = await fetchFileMeta(filePath);
        if (!meta) return;

        const saveFile = async (isPublic: boolean) => {
            if (isPublic === meta.isPublic) {
                closeModal();
                return;
            }

            showModal({
                title: "Saving...",
                loadingSpinner: true,
                type: "buttonless"
            });
            try {
                const res = await apiClient.patch(`/r/${registryId}/api/v1/files${filePath}/public?public=${isPublic}`, {});
                if (!res.ok) {
                    throw new Error(`HTTP request failed with status code ${res.statusText}: ${await res.text()}`);
                }

                setBanner({ level: "success", message: `${filePath} is now ${isPublic ? "public" : "private"}` });
            } catch (err) {
                console.error("Failed to update file visibility", err);
                setBanner({ level: "error", message: "Failed to update file visibility" });
            } finally {
                closeModal();
            }
        };

        showModal({
            title: `Edit ${meta.fName}`,
            type: "custom",
            content: <FileEditor
                meta={meta}
                onSave={saveFile}
                onDelete={() => deleteFileOrDirectory(filePath)}
                onCancel={closeModal}
            />
        });
    }, [closeModal, deleteFileOrDirectory, fetchFileMeta, registryId, setBanner, showModal]);

    useEffect(() => {
        if (currentPath.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentNode(baseNode);
            return;
        }

        let traversed = baseNode;
        for (const segment of currentPath.slice(1)) {
            const next = traversed.children?.find(c => c.name === segment);
            if (!next) {
                setBanner({ level: "error", message: "Unable to open the requested directory" });
                return;
            }
            traversed = next;
        }

        setCurrentNode(traversed);
    }, [currentPath, baseNode, setBanner]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContents((currentNode.children ?? []).map((c: FSNode) => {
            return {
                name: c.name,
                type: c.type,
                actions: <div className="flex items-center gap-0.5">
                    {c.type == "file" && <>
                        <button className={iconButtonClass} title="Details" aria-label="Details" onClick={() => showFileDetails(`${currentPath.join(`/`)}/${c.name}`)}><Info className="size-4.5" /></button>
                        { localUser?.permissions?.includes(RegistryUserPermissions.WRITE_REGISTRY) && <button className={iconButtonClass} title="Edit" aria-label="Edit" onClick={() => showFileEditor(`${currentPath.join(`/`)}/${c.name}`)}><Pencil className="size-4.5" /></button>}
                    </> || <>
                        <button className={iconButtonClass} title="Open" aria-label="Open" onClick={() => openDirectory(`${currentPath.join(`/`)}/${c.name}`)}><FolderOpen className="size-4.5" /></button>
                        { localUser?.permissions?.includes(RegistryUserPermissions.WRITE_REGISTRY) && <button className={`${iconButtonClass} not-disabled:hover:bg-danger/8 not-disabled:hover:text-danger`} title="Delete" aria-label="Delete" onClick={() => deleteFileOrDirectory(`${currentPath.join(`/`)}/${c.name}`)}><Trash2 className="size-4.5" /></button>}
                    </>}
                </div>
            }
        }));
    }, [currentNode, currentPath, deleteFileOrDirectory, localUser?.permissions, openDirectory, showFileDetails, showFileEditor]);

    return <>
        <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <nav aria-label="Path" className="flex min-w-0 flex-wrap items-center gap-0.5">
                    { ["root", ...(currentPath.slice(1))].map((segment, index) => {
                        return <button key={index} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-meta transition-colors not-disabled:cursor-pointer not-disabled:text-legend not-disabled:hover:bg-surface not-disabled:hover:text-ink ${index == currentPath.length - 1 ? "font-medium text-ink" : ""}`} onClick={() => setCurrentPath(currentPath.slice(0, index + 1))} disabled={index == currentPath.length - 1}>
                            <Folder className="size-4" />
                            <span>{segment}</span>
                        </button>
                    }).flatMap((crumb, index) => index == 0 ? [crumb] : [<ChevronRight key={`sep-${index}`} className="size-3.5 text-legend/60" />, crumb]) }
                </nav>
                { localUser?.permissions?.includes(RegistryUserPermissions.WRITE_REGISTRY) &&
                <div className="flex shrink-0 items-center gap-2">
                    <button className="button-secondary" onClick={requestCreateDirectory}>
                        <FolderPlus className="size-4" /><span>New Folder</span>
                    </button>
                    <button className="button-primary" onClick={requestUploadFiles}>
                        <FileUp className="size-4" /><span>Upload</span>
                    </button>
                </div>}
            </div>
            { (currentNode.children && currentNode.children?.length > 0) && <HTMLTable<{ name: string; type: "file" | "directory"; actions: React.ReactNode }>
                columns={[
                    { text: "Name", dataKey: "name" },
                    { text: "Type", dataKey: "type", fixedPixelSize: 200 },
                    { text: "Actions", dataKey: "actions", queryable: false, fixedPixelSize: 100 }
                ]}

                data={contents}
            />}
            { (currentNode.children?.length == 0) && <>
                <div className="card flex flex-col items-center py-16 text-center">
                    <span className="mb-4 grid size-12 place-items-center rounded-xl bg-bg text-legend"><Folder className="size-5" /></span>
                    <p className="text-body font-medium">This folder is empty</p>
                    <p className="mt-1 text-meta text-legend">Upload files or create a folder to get started.</p>
                </div>
            </> }
        </div>
    </>
}

const FilesystemController = () => {

    // Navigate
    const navigate = useNavigate();

    // Banner
    const { setBanner } = useContext(BannerContext);

    // Local registry information
    const { registryId } = useParams();
    const { registryLoading } = useRegistryBootstrap(registryId);
    const { registry } = useContext(RegistryContext);

    // Registry data
    const [ registryData, setRegistryData ] = useState<FSNode | null>(null);
    const [ dataLoading, setDataLoading ] = useState<boolean>(true);


    // Fetch registry data
    useEffect(() => {
        if (registryLoading == RegistryLoadingState.LOADED) {
            apiClient.get(`/r/${registryId}/api/v1/hierarchy`).then(async res => {
                if (!res.ok) {
                    throw new Error(`HTTP request failed with status code ${res.status}: ${await res.text()}`);
                }

                const data = await res.json() as FSNode;
                setRegistryData(data);
                setDataLoading(false);
            }).catch(err => {
                console.error(`Failed to fetch the hierarchy for the specified registry`, err);
                setBanner({ level: "error", message: "Failed to load filesystem information." });
                navigate(`/dashboard`);
            })
        }
    }, [navigate, registryId, registryLoading, setBanner])

    return <>
        <PageHeader eyebrow="Files" title={registry?.name ?? "Filesystem Registry"} />
        <div className="flex items-center justify-center">
            { (registryLoading == RegistryLoadingState.LOADED && !dataLoading && registryData == null) && <span className="text-legend">There is no data to show.</span> }
            { (registryLoading == RegistryLoadingState.LOADED && !dataLoading && registryData != null) && <HierarchyViewer node={registryData} /> }
        </div>
    </>
}

export default FilesystemController;