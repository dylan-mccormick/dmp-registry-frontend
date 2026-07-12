import { useNavigate, useParams } from "react-router";
import useRegistryBootstrap, { RegistryLoadingState } from "../../hooks/useRegistryBootstrap";
import PageHeader from "../PageHeader";
import { useCallback, useContext, useEffect, useState } from "react";
import { RegistryContext } from "../../context/RegistryContext";
import { LoaderCircle } from "lucide-react";
import apiClient from "../../apiClient";
import { NavContext } from "../../context/NavContext";
import HTMLTable from "../HTMLTable";
import { ModalContext } from "../../context/ModalContext";

// File Hierarchy Information
interface FSNode { name: string; type: "file" | "directory"; children?: FSNode[]; };

// Get the basename of a filepath
const baseName = (filePath: string) => {
    return filePath.split(`/`)[filePath.split(`/`).length - 1];
}

const HierarchyViewer = ({ node }: { node: FSNode }) => {
    // params
    const { registryId } = useParams();

    // banner/modal
    const { setBanner } = useContext(NavContext);
    const { showModal, closeModal } = useContext(ModalContext);

    // path/node mgmt
    const [ currentPath, setCurrentPath ] = useState<string[]>([]);
    const [ currentNode, setCurrentNode ] = useState<FSNode>(node);

    // view contents of node (dir)
    const [ contents, setContents ] = useState<(FSNode & { actions: React.ReactNode })[]>([]);

    const openFileInNewTab = useCallback((filePath: string) => {
        showModal({
            title: "Downloading...",
            message: "Please wait. Downloading the requested resource...",
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
            message: "Please wait. Downloading the requested resource...",
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
                    setCurrentPath(currentPath.slice(0, currentPath.length - 1));
                }).catch(err => {
                    console.error("Failed to delete requested file or directory", err);
                    setBanner({ level: "error", message: "Failed to delete file or directory" });
                }).finally(closeModal);
            }
        });
    }, [closeModal, currentPath, registryId, setBanner, showModal]);

    useEffect(() => {
        if (currentPath.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentNode(node);
            return;
        }

        let traversed = node;
        for (const segment of currentPath.slice(1)) {
            const next = traversed.children?.find(c => c.name === segment);
            if (!next) {
                setBanner({ level: "error", message: "Unable to open the requested directory" });
                return;
            }
            traversed = next;
        }

        setCurrentNode(traversed);
    }, [currentPath, node, setBanner]);

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
                    <button className="button-secondary border-red-500" onClick={() => deleteFileOrDirectory(`${currentPath.join(`/`)}/${c.name}`)} >Delete</button>
                </div>
            }
        }));
    }, [currentNode, currentPath, deleteFileOrDirectory, downloadFile, openDirectory, openFileInNewTab]);

    return <>
        <div className="w-full flex flex-col gap-4">
            <div>

            </div>
            <HTMLTable<{ name: string; type: "file" | "directory"; actions: React.ReactNode }>
                columns={[
                    { text: "Name", dataKey: "name" },
                    { text: "Type", dataKey: "type", fixedPixelSize: 200 },
                    { text: "Actions", dataKey: "actions", queryable: false, fixedPixelSize: 250 }
                ]}

                data={contents}
            />
            { (node.children?.length == 0) && <>
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