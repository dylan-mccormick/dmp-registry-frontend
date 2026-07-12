import { useNavigate, useParams } from "react-router";
import useRegistryBootstrap, { RegistryLoadingState } from "../../hooks/useRegistryBootstrap";
import PageHeader from "../PageHeader";
import { useCallback, useContext, useEffect, useState } from "react";
import { RegistryContext } from "../../context/RegistryContext";
import { ChevronRight, FileUp, Folder, FolderPlus, LoaderCircle } from "lucide-react";
import apiClient from "../../apiClient";
import { NavContext } from "../../context/NavContext";
import HTMLTable from "../HTMLTable";
import { ModalContext } from "../../context/ModalContext";
import { RegistryUserPermissions } from "../../model/RegistryUser";

// File Hierarchy Information
interface FSNode { name: string; type: "file" | "directory"; children?: FSNode[]; };

// Get the basename of a filepath
const baseName = (filePath: string) => {
    return filePath.split(`/`)[filePath.split(`/`).length - 1];
}

const HierarchyViewer = ({ node }: { node: FSNode }) => {
    // params
    const { registryId } = useParams();

    // registry
    const { localUser } = useContext(RegistryContext);

    // banner/modal
    const { setBanner } = useContext(NavContext);
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
                    message: "Please wait. Deleting the requested resource...",
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
                actions: <div className="flex justify-between items-center">
                    {c.type == "file" && <>
                        <button className="button-secondary" onClick={() => openFileInNewTab(`${currentPath.join(`/`)}/${c.name}`)} >View</button>
                        <button className="button-secondary" onClick={() => downloadFile(`${currentPath.join(`/`)}/${c.name}`)}>Download</button>
                    </> || <><button className="button-secondary" onClick={() => openDirectory(`${currentPath.join(`/`)}/${c.name}`)} >Open</button><div></div></>} {/* Empty divs to float the delete button right */}
                    { localUser?.permissions?.includes(RegistryUserPermissions.WRITE_REGISTRY) && <button className="button-secondary border-red-500" onClick={() => deleteFileOrDirectory(`${currentPath.join(`/`)}/${c.name}`)} >Delete</button>}
                </div>
            }
        }));
    }, [currentNode, currentPath, deleteFileOrDirectory, downloadFile, localUser?.permissions, openDirectory, openFileInNewTab]);

    return <>
        <div className="w-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                    { ["root", ...(currentPath.slice(1))].map((segment, index) => {
                        return <button key={index} className="flex gap-2 items-center enabled:hover:underline enabled:hover:bg-gray-100 px-2 py-1 rounded-md" onClick={() => setCurrentPath(currentPath.slice(0, index + 1))} disabled={index == currentPath.length - 1}>
                            <Folder className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-600">{segment}</span>
                            {index < currentPath.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600" />}
                        </button>
                    }) }
                </div>
                { localUser?.permissions?.includes(RegistryUserPermissions.WRITE_REGISTRY) &&
                <div className="flex gap-2 items-center mt-2">
                    <button className="button-primary" onClick={requestUploadFiles}>
                        <div className="py-1 px-1 flex gap-2 items-center">
                            <FileUp /><span>Upload File</span>
                        </div>
                    </button>
                    <button className="button-primary" onClick={requestCreateDirectory}>
                        <div className="py-1 px-1 flex gap-2 items-center">
                            <FolderPlus /><span>New Folder</span>
                        </div>
                    </button>
                </div>}
            </div>
            { (currentNode.children && currentNode.children?.length > 0) && <HTMLTable<{ name: string; type: "file" | "directory"; actions: React.ReactNode }>
                columns={[
                    { text: "Name", dataKey: "name" },
                    { text: "Type", dataKey: "type", fixedPixelSize: 200 },
                    { text: "Actions", dataKey: "actions", queryable: false, fixedPixelSize: 250 }
                ]}

                data={contents}
            />}
            { (currentNode.children?.length == 0) && <>
                <span>No data in this directory. Create some to get started.</span>
            </> }
        </div>
    </>
}

const FilesystemController = () => {

    // Navigate
    const navigate = useNavigate();

    // Banner
    const { setBanner } = useContext(NavContext);

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
        <PageHeader title={registry?.name ?? "Filesystem Registry"} />
        <div className="flex items-center justify-center">
            { (registryLoading != RegistryLoadingState.LOADED || dataLoading) && <LoaderCircle className="text-primary w-12 h-12 animate-spin" /> }
            { (registryLoading == RegistryLoadingState.LOADED && !dataLoading && registryData == null) && <span>There is no data to show.</span> }
            { (registryLoading == RegistryLoadingState.LOADED && !dataLoading && registryData != null) && <HierarchyViewer node={registryData} /> }
        </div>
    </>
}

export default FilesystemController;