import { Gauge, Settings, UsersRound } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import apiClient from "../apiClient";
import type { NavbarComponentProps } from "../components/NavbarComponent";
import PageHeader from "../components/PageHeader";
import { SettingsActions, SettingsGroup, SettingsRow } from "../components/SettingsGroup";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { ModalContext } from "../context/ModalContext";
import { UserContext } from "../context/UserContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";

type Tab = 'registries' | 'roles' | 'profile';

const RegistriesPanel = () => {
    return <div className="card text-center text-meta text-legend">Registry memberships will appear here.</div>
}

const RolesPanel = ( { targetUserId }: { targetUserId: string } ) => {
    const { setBanner } = useContext(BannerContext);
    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);

    const [ create_registry, setCreateRegistry ] = useState(false);
    const [ manage_users, setManageUsers ] = useState(false);

    useEffect(() => {
        (async () => {
            addProcess("fetching_user_roles");

            // get the roles for the user with the provided id
            const response = await apiClient.get(`/api/v1/users/${targetUserId}/permissions`);
            if (!response.ok) {
                setBanner({ level: "error", message: "Failed to fetch user roles." });
                removeProcess("fetching_user_roles");
                return;
            }

            response.json().then((data) => {
                setCreateRegistry(data.includes("CREATE_REGISTRY"));
                setManageUsers(data.includes("MANAGE_USERS"));
            });

            removeProcess("fetching_user_roles");
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetUserId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        addProcess("updating_user_roles");

        const permissions = [
            { name: 'CREATE_REGISTRY', enabled: create_registry },
            { name: 'MANAGE_USERS', enabled: manage_users }
        ];

        try {
            await Promise.all(permissions.map(({ name, enabled }) => new Promise((resolve, reject) => {
                    (enabled
                        ? apiClient.post(`/api/v1/users/${targetUserId}/permissions/${name}`, {})
                        : apiClient.delete(`/api/v1/users/${targetUserId}/permissions/${name}`)).then(res => {
                            if (!res.ok) {
                                reject(new Error(`Failed to update permission: ${name}`));
                                return;
                            }

                            resolve(null);
                        })
                }
            )));

            setBanner({ level: "success", message: "Permissions updated successfully." });
        } catch {
            setBanner({ level: "error", message: "Failed to update permissions." });
        } finally {
            removeProcess("updating_user_roles");
        }
    };

    return <>
        <form className="max-w-3xl" onSubmit={handleSubmit}>
            <SettingsGroup title="Global permissions" description="These apply across the whole DMP Registry, not to a single registry.">
                <SettingsRow label="Create registries" htmlFor="createRegistries">
                    <input type="checkbox" id="createRegistries" name="createRegistries" checked={create_registry} onChange={(e) => setCreateRegistry(e.target.checked)} className="switch" />
                </SettingsRow>
                <SettingsRow label="Manage users" htmlFor="manageUsers">
                    <input type="checkbox" id="manageUsers" name="manageUsers" checked={manage_users} onChange={(e) => setManageUsers(e.target.checked)} className="switch" />
                </SettingsRow>
            </SettingsGroup>
            <SettingsActions>
                <button type="submit" className="button-primary" disabled={processes.has("updating_user_roles")}>Save Changes</button>
            </SettingsActions>
        </form>
    </>
}

const ProfilePanel = ({ userId, username, email, emailVerified, createdAt, tokenVersion }: { userId: string; username: string; email: string; emailVerified: boolean; createdAt: string; tokenVersion: number }) => {

    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);
    const { showModal } = useContext(ModalContext);
    const { setBanner } = useContext(BannerContext);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        addProcess("updating_user");

        const formData = new FormData(e.currentTarget);

        const updatedData = {
            username: formData.get("username") as string,
            email: formData.get("email") as string,
            email_verified: formData.get("emailVerified") === "on"
        };

        apiClient.patch(`/api/v1/users/${userId}`, updatedData).then((response) => {
            if (response.ok) {
                response.json().then(console.log);
                setBanner({ level: "success", message: "User updated successfully." });
                navigate("/users");
            } else {
                // try to extract error message from response
                let errorMessage = "Failed to update user.";
                response.json().then((data) => {
                    if (data.message) {
                        errorMessage = data.message;
                    }
                    setBanner({ level: "error", message: errorMessage });
                }).catch(() => {
                    setBanner({ level: "error", message: errorMessage });
                });
            }
        }).catch(() => {
            setBanner({ level: "error", message: "An error occurred while updating the user." });
        }).finally(() => {
            removeProcess("updating_user");
        });
    };

    const handleDelete = () => {
        showModal({
            title: "Confirm User Deletion",
            message: "Are you sure you want to delete this user? This action cannot be undone.",
            type: "confirm",
            onConfirm: () => {
                addProcess("deleting_user");

                // make API call to delete user
                apiClient.delete(`/api/v1/users/${userId}`).then((response) => {
                    if (response.ok) {
                        setBanner({ level: "success", message: "User deleted successfully." });
                        removeProcess("deleting_user");
                        navigate("/users");
                    } else {
                        removeProcess("deleting_user");
                        setBanner({ level: "error", message: "Failed to delete user." });
                    }
                }).catch(() => {
                    removeProcess("deleting_user");
                    setBanner({ level: "error", message: "An error occurred while deleting the user." });
                });
            }
        });
    };

    return <>
        <form className="max-w-3xl" onSubmit={handleSubmit}>
            <SettingsGroup title="Profile">
                <SettingsRow label="Username" htmlFor="username">
                    <input type="text" id="username" name="username" maxLength={255} className="field" required defaultValue={username} />
                </SettingsRow>
                <SettingsRow label="Email" htmlFor="email">
                    <input type="email" id="email" name="email" maxLength={255} className="field" required defaultValue={email} />
                </SettingsRow>
                <SettingsRow label="Email verified" htmlFor="emailVerified">
                    <input type="checkbox" id="emailVerified" name="emailVerified" className="switch" defaultChecked={emailVerified} />
                </SettingsRow>
            </SettingsGroup>
            <SettingsGroup title="Details">
                <SettingsRow label="User ID">
                    <span className="field-static font-mono text-meta">{userId}</span>
                </SettingsRow>
                <SettingsRow label="Created">
                    <span className="field-static">{new Date(createdAt).toLocaleString()}</span>
                </SettingsRow>
                <SettingsRow label="Token version">
                    <span className="field-static">{tokenVersion}</span>
                </SettingsRow>
            </SettingsGroup>
            <SettingsActions destructive={<button type="button" className="button-destructive" onClick={handleDelete} disabled={processes.has("deleting_user")}>Delete User</button>}>
                <button type="submit" className="button-primary" disabled={processes.has("updating_user")}>Save Changes</button>
            </SettingsActions>
        </form>
    </>
}

const EditUser = () => {

    const { id } = useParams();

    const { user } = useContext(UserContext);
    const { setBanner } = useContext(BannerContext);

    const navigate = useNavigate();

    const [ navbarItems, setNavbarItems ] = useState<NavbarComponentProps[]>([]);
    const [ activeTab, setActiveTab ] = useState<Tab>('registries');

    const [ targetUser, setTargetUser ] = useState<{ id: number; username: string; email: string; emailVerified: boolean; createdAt: string; tokenVersion: number } | null>(null);

    useEffect(() => {
        const items: NavbarComponentProps[] = [
        { text: "Dashboard", to: "/dashboard", icon: <Gauge /> }
        ];

        if (user?.permissions.includes("MANAGE_USERS")) {
            items.push({ text: "User Management", to: "/users", icon: <UsersRound /> });
        }

        items.push({ text: "Account", to: "/profile", icon: <Settings /> });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNavbarItems(items);
    }, [user]);

    // navigate away if no id is provided
    useEffect(() => {
        if (!id) {
            navigate("/users");
        }
    }, [id, navigate]);

    // get details about the user with the provided id
    useEffect(() => {
        if (!id) return;

        apiClient.get(`/api/v1/users/${id}`).then((response) => {
            if (response.status === 200) {
                response.json().then((data) => {
                    setTargetUser(data);
                });
                return;
            }

            setBanner({ level: "error", message: "Failed to load user details" });
        });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return <>
        <StandardLayout title="Edit User" navItems={navbarItems}>
            <div className="page">
                <PageHeader eyebrow="User Management" title={targetUser?.username || `User ${id}`} subtitle={targetUser?.email} />

                {/* Tab Bar */}
                <div role="tablist" className="mb-8 inline-flex rounded-full bg-surface p-1">
                    {(['registries', 'roles', 'profile'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={activeTab === tab}
                            onClick={() => setActiveTab(tab)}
                            className={`min-h-8 cursor-pointer rounded-full px-4 text-meta font-medium capitalize transition-all duration-200 ${
                                activeTab === tab
                                    ? 'bg-bg text-ink shadow-[0_1px_3px_rgb(0_0_0/0.1)]'
                                    : 'text-legend hover:text-ink'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'registries' && <RegistriesPanel />}
                {activeTab === 'roles' && <RolesPanel targetUserId={id!} />}
                {activeTab === 'profile' && <ProfilePanel userId={id!} username={targetUser?.username || ""} email={targetUser?.email || ""} emailVerified={targetUser?.emailVerified || false} createdAt={targetUser?.createdAt || ""} tokenVersion={targetUser?.tokenVersion || 0} />}

            </div>
        </StandardLayout>
    </>
}

export default EditUser;