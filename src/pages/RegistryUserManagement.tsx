import { useNavigate, useParams } from "react-router";
import StandardLayout from "../components/StandardLayout";
import { NavbarLevel } from "../context/NavbarLevel";
import useRegistryBootstrap, { RegistryLoadingState } from "../hooks/useRegistryBootstrap";
import React, { useContext, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { RegistryContext } from "../context/RegistryContext";
import { NavContext } from "../context/NavContext";
import { coerceRegistryUserPermissionFromString, RegistryUserPermissions } from "../model/RegistryUser";
import apiClient from "../apiClient";
import { ModalContext } from "../context/ModalContext";

interface AddUserResultCardProps {
    id: string,
    username: string,
    refreshSearchResults: Dispatch<SetStateAction<UserSearchResult[] | null>>
}

interface RegistryUserCardProps {
    id: number,
    username: string,
    roles: RegistryUserPermissions[]
}

interface UserSearchResult {
    id: string,
    username: string
}

const AddUserResultCard = ({ id, username, refreshSearchResults, setRefreshKey }: AddUserResultCardProps & { setRefreshKey: Dispatch<SetStateAction<number>> }) => {

    const { registryId } = useParams();

    const { reload } = useRegistryBootstrap(registryId);
    const { setBanner } = useContext(NavContext);
    const { showModal, closeModal } = useContext(ModalContext);

    const onClickAdd = () => {
        showModal({
            title: "Confirmation",
            type: "confirm",
            message: `Are you sure you wish to add ${username} (ID: ${id}) to this registry? This will automatically grant READ_REGISTRY permissions.`,
            onConfirm: () => {
                showModal({
                    title: "Please Wait",
                    type: "buttonless",
                    message: `Adding ${username} (ID: ${id}) to the registry...`
                });

                apiClient.post(`/api/v1/registries/${registryId}/users/${id}`, {}).then(async res => {
                    if (!res.ok) {
                        throw new Error(`HTTP Failed with status code ${res.status}: ${await (res.text())}`);
                    }

                    closeModal();
                    setBanner({ level: "success", message: "Successfully added user to the registry" });
                    refreshSearchResults(null);
                    reload();
                    setRefreshKey(k => k + 1);
                }).catch(err => {
                    console.error(err);
                    setBanner({ level: "error", message: "Failed to add user to the registry" });
                })
            }
        })
    }

    return <>
        <div className="flex py-1 flex-row justify-between items-center">
            <div>{username}</div>
            <button className="button-secondary" onClick={onClickAdd}>Add</button>
        </div>
    </>
}

const RoleSelector = ({ label, value, setValue, disabled }: { label: string, value: boolean, setValue: Dispatch<SetStateAction<boolean>>, disabled: boolean }) => <div className="grid grid-cols-2 items-center py-1 gap-4">
    <span className="text-right">{label}</span>
    <input type="checkbox" checked={value} onChange={() => setValue(v => !v)} disabled={disabled} className="justify-self-start"></input>
</div>

const RegistryUserCard = ({ username, id, roles, setRefreshKey }: RegistryUserCardProps & { setRefreshKey: Dispatch<SetStateAction<number>> }) => {

    const { registryId } = useParams();

    const { showModal } = useContext(ModalContext);
    const { setBanner } = useContext(NavContext);

    const [ dropdownOpen, setDropdownOpen ] = useState(false);
    const [ loading, setLoading ] = useState(false);

    const hasWriteRegistry = roles.includes(RegistryUserPermissions.WRITE_REGISTRY);
    const hasReadAgents = roles.includes(RegistryUserPermissions.READ_AGENTS);
    const hasWriteAgents = roles.includes(RegistryUserPermissions.WRITE_AGENTS);
    const hasManageUsers = roles.includes(RegistryUserPermissions.MANAGE_USERS);

    const [ writeRegistry, setWriteRegistry ] = useState(hasWriteRegistry);
    const [ readAgents, setReadAgents ] = useState(hasReadAgents);
    const [ writeAgents, setWriteAgents ] = useState(hasWriteAgents);
    const [ manageUsers, setManageUsers ] = useState(hasManageUsers);

    const onEditUser = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const onSaveRoles = async () => {
        setLoading(true);

        const newPermissions: RegistryUserPermissions[] = [
            (!hasWriteRegistry && writeRegistry) && RegistryUserPermissions.WRITE_REGISTRY,
            (!hasReadAgents && readAgents) && RegistryUserPermissions.READ_AGENTS,
            (!hasWriteAgents && writeAgents) && RegistryUserPermissions.WRITE_AGENTS,
            (!hasManageUsers && manageUsers) && RegistryUserPermissions.MANAGE_USERS
        ].filter(p => p !== false) as RegistryUserPermissions[];

        const revokedPermissions: RegistryUserPermissions[] = [
            (hasWriteRegistry && !writeRegistry) && RegistryUserPermissions.WRITE_REGISTRY,
            (hasReadAgents && !readAgents) && RegistryUserPermissions.READ_AGENTS,
            (hasWriteAgents && !writeAgents) && RegistryUserPermissions.WRITE_AGENTS,
            (hasManageUsers && !manageUsers) && RegistryUserPermissions.MANAGE_USERS
        ].filter(p => p !== false) as RegistryUserPermissions[];

        try {
            const calls: Promise<unknown>[] = [];

            if (newPermissions.length != 0) {
                calls.push(apiClient.post(`/api/v1/registries/${registryId}/users/${id}/permissions`, {
                    permissions: newPermissions
                }).then(async res => {
                    if (!res.ok) throw new Error(`HTTP Failed with status code ${res.status}: ${await res.text()}`);
                }));
            }

            if (revokedPermissions.length != 0) {
                calls.push(apiClient.delete(`/api/v1/registries/${registryId}/users/${id}/permissions`, {
                    permissions: revokedPermissions
                }).then(async res => {
                    if (!res.ok) throw new Error(`HTTP Failed with status code ${res.status}: ${await res.text()}`);
                }));
            }

            await Promise.all(calls);
            setBanner({ level: "success", message: "Successfully updated user permissions." });
            setRefreshKey(k => k + 1);
        } catch (err) {
            console.error(err);
            setBanner({ level: "error", message: "Failed to update user permissions." });
        } finally {
            setLoading(false);
        }
    }

    const onDeleteUser = () => {
        showModal({
            title: "Dangerous Action",
            type: "confirm",
            message: `Are you sure you want to remove ${username} from this registry? This action cannot be undone.`,
            onConfirm: () => {
                setLoading(true);
                apiClient.delete(`/api/v1/registries/${registryId}/users/${id}`).then(async res => {
                    if (!res.ok) {
                        throw new Error(`HTTP Failed with status code ${res.status}: ${await res.text()}`);
                    }

                    setBanner({ level: "success", message: "Successfully removed user from the registry." });
                }).catch(err => {
                    console.error(err);
                    setBanner({ level: "error", message: "Failed to remove user from the registry." });
                }).finally(() => {
                    setLoading(false);
                    setRefreshKey(k => k + 1);
                });
            }
        })
    };

    const dropdownComponent = <div className="border border-gray-400 rounded mb-2 p-4">
        <div className="flex flex-col">
            <RoleSelector label="Read Registry" value={true} setValue={() => {}} disabled={true} /> {/* Fake element, all users have this or they will be removed from registry */}
            <RoleSelector label="Write Registry" value={writeRegistry} setValue={setWriteRegistry} disabled={loading} />
            <RoleSelector label="Read Agents" value={readAgents} setValue={setReadAgents} disabled={loading} />
            <RoleSelector label="Write Agents" value={writeAgents} setValue={setWriteAgents} disabled={loading} />
            <RoleSelector label="Manage Users" value={manageUsers} setValue={() => { if (manageUsers) {setManageUsers(false); return} showModal({ title: "Dangerous Role", type: "confirm", message: "This is a dangerous role to grant. Are you sure you want to proceed?", onConfirm: () => { setManageUsers(true) } }) }} disabled={loading} />
        </div>

        <div className="flex justify-end">
            <button className="button-primary" onClick={onSaveRoles} disabled={loading}>Save</button>
        </div>
    </div>

    return <div>
        <div className="flex flex-row items-center justify-between py-2">
            <span>{username}</span>
            <div className="flex flex-row items-center justify-between space">
                <button className="mr-1 button-secondary" onClick={onEditUser}>{ dropdownOpen ? "Hide" : "Edit" }</button>
                <button className="ml-1 button-secondary border-red-500" onClick={onDeleteUser}>Delete</button>
            </div>
        </div>
        {dropdownOpen && dropdownComponent}
    </div>
}

const AddUsersPanel = ({ setRefreshKey }: { setRefreshKey: Dispatch<SetStateAction<number>> }) => {

    const { registryId } = useParams();

    const [ loading, setLoading ] = useState(false);
    const [ searchResults, setSearchResults ] = useState<UserSearchResult[] | null>(null);

    const { setBanner } = useContext(NavContext);

    const searchUsers = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const username = formData.get("username") as string;

        if (username.trim() == "") {
            setBanner({ level: "error", message: "Please provide a username."});
            setLoading(false);
            return;
        }

        // fetch users by query
        apiClient.get(`/api/v1/registries/${registryId}/users/search?search=${encodeURIComponent(username)}`).then(res => {
            if (!res.ok) {
                setBanner({ level: "error", message: "Failed to search for users." });
                throw new Error("Failed to search for users");
            }

            res.json().then((data: UserSearchResult[]) => {
                setSearchResults(data);
            }).catch(err => {
                console.error("Failed to parse search results", err);
                setBanner({ level: "error", message: "Failed to parse search results." });
            }).finally(() => {
                setLoading(false);
            });
        })
    }

    return <>
        <div className="mx-8 mb-2 p-2 border rounded">
            <span className="text-xl font-bold">Add Users</span>
            <form onSubmit={searchUsers}>
                <div className="flex flex-row gap-2 py-2">
                    <input name="username" placeholder="Enter username..." type="text" className="w-full border rounded h-8 px-2 border-gray-400" disabled={loading}></input>
                    <button className="button-primary" type="submit" disabled={loading}>Search</button>
                </div>

                <div className="my-1 px-4 flex flex-col divide-y divide-gray-400">
                    {searchResults && searchResults.length == 0 && <span className="text-center">No results found.</span>}
                    {searchResults && searchResults.map(sr => <AddUserResultCard key={sr.id} id={sr.id} username={sr.username} refreshSearchResults={setSearchResults} setRefreshKey={setRefreshKey} ></AddUserResultCard>)}
                </div>
            </form>
        </div>
    </>
}

const CurrentUsersPanel = ({ refreshKey, setRefreshKey }: { refreshKey: number, setRefreshKey: Dispatch<SetStateAction<number>> }) => {

    const { registryId } = useParams();

    const [ loading, setLoading ] = useState(true);
    const [ currentUsers, setCurrentUsers ] = useState<RegistryUserCardProps[]>([]);

    const { setBanner } = useContext(NavContext);

    useEffect(() => {
        console.log("refresh key: ", refreshKey);

        apiClient.get(`/api/v1/registries/${registryId}/users`).then(async res => {
            if (!res.ok) {
                throw new Error(`HTTP failed with status code ${res.status}: ${await res.text()}`)
            }

            res.json().then(data => {
                setLoading(false);
                const result: { users: ({ id: number, username: string, permissions: string[] })[] } = data;
                setCurrentUsers(result.users.map(u => ({ id: u.id, username: u.username, roles: u.permissions.map(p => coerceRegistryUserPermissionFromString(p)) })));
            })
        }).catch((err) => {
            console.error(err);
            setBanner({ level: "error", message: "Unable to fetch current users for registry." });
        })
    }, [ registryId, setBanner, refreshKey ]);

    return <>
        <div className="mx-8 p-2 border rounded">
            <span className="text-xl font-bold mb-2">Current Users</span>
            <div className="text-center">
                {loading && <span className="text-center">Loading users...</span>}
            </div>
            <div className="px-4 divide-y divide-gray-400">
                {currentUsers.map(u => <RegistryUserCard key={u.id} id={u.id} username={u.username} roles={u.roles} setRefreshKey={setRefreshKey}></RegistryUserCard>)}
            </div>
        </div>
    </>
}

const RegistryUserManagement = () => {

    const { registryId } = useParams();
    const navigate = useNavigate();

    const { registryLoading, registryLoadingError } = useRegistryBootstrap(registryId);
    const { localUser } = useContext(RegistryContext);
    const { setBanner } = useContext(NavContext);

    const [ refreshKey, setRefreshKey ] = useState(0);

    useEffect(() => {
        if (registryLoadingError) {
            setBanner({ level: "error", message: "Failed to load the selected registry." });
            navigate("/dashboard");
        }
    }, [ registryLoadingError, setBanner, navigate ])

    useEffect(() => {
        if (registryLoading == RegistryLoadingState.LOADED && !localUser?.permissions?.includes(RegistryUserPermissions.READ_USERS)) {
            navigate("/dashboard");
        }
    }, [ registryLoading, localUser, navigate ])

    return <>
        <StandardLayout title="User Management" navbarLevel={NavbarLevel.REGISTRY}>
            {registryLoading != RegistryLoadingState.LOADED && <div className="text-center mt-8">Loading registry details...</div> ||
            <div className="p-8">
                <span className="text-3xl font-bold">Registry User Management</span>
            </div>}

            {localUser?.permissions?.includes(RegistryUserPermissions.MANAGE_USERS) && <AddUsersPanel setRefreshKey={setRefreshKey} />}
            {localUser?.permissions?.includes(RegistryUserPermissions.READ_USERS) && <CurrentUsersPanel refreshKey={refreshKey} setRefreshKey={setRefreshKey} />}
        </StandardLayout>
    </>
}

export default RegistryUserManagement;