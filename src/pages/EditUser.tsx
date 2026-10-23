import { Database, Gauge, Settings, UsersRound } from "lucide-react";
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
import { RegistryContext } from "../context/RegistryContext";
import type { RegistrySummary, UserRegistrySummary } from "../model/RegistrySummary";
import { formatDateShort, registryPermissionLabels, registryTypeIcon, registryTypeLabel } from "../utils/registryDisplay";

type Tab = 'registries' | 'roles' | 'profile';
const tabs: Tab[] = ['registries', 'roles', 'profile'];

const RegistriesPanel = ({ targetUserId }: { targetUserId: string }) => {
    const navigate = useNavigate();

    const { setBanner } = useContext(BannerContext);
    const { setRegistry } = useContext(RegistryContext);
    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);

    const [ registries, setRegistries ] = useState<UserRegistrySummary[]>([]);
    // Registries the current (admin) user can open themselves
    const [ accessibleIds, setAccessibleIds ] = useState<Set<number>>(new Set());

    useEffect(() => {
        const fetchRegistries = async () => {
            addProcess("fetching_user_registries");
            try {
                const [ userRes, mineRes ] = await Promise.all([
                    apiClient.get(`/api/v1/registries/list/user/${targetUserId}`),
                    apiClient.get("/api/v1/registries/list/me")
                ]);

                if (!userRes.ok) {
                    setBanner({ level: "error", message: "Failed to load this user's registries." });
                    return;
                }

                setRegistries(await userRes.json());
                if (mineRes.ok) {
                    const mine = await mineRes.json() as RegistrySummary[];
                    setAccessibleIds(new Set(mine.map(r => r.id)));
                }
            } catch (err) {
                console.error(err);
                setBanner({ level: "error", message: "Failed to load this user's registries." });
            } finally {
                removeProcess("fetching_user_registries");
            }
        };

        fetchRegistries();
    }, [targetUserId, addProcess, removeProcess, setBanner]);

    if (processes.has("fetching_user_registries")) return null;

    if (registries.length === 0) return <div className="card flex max-w-3xl flex-col items-center py-16 text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-xl bg-bg text-legend"><Database className="size-5" /></span>
        <p className="text-body font-medium">No registries</p>
        <p className="mt-1 text-meta text-legend">This user hasn't created or been added to any registries.</p>
    </div>;

    const owned = registries.filter(r => String(r.ownerId) === targetUserId).length;

    return <div className="max-w-3xl">
        <SettingsGroup title="Registries" description={`Member of ${registries.length} ${registries.length === 1 ? "registry" : "registries"}, owner of ${owned}.`}>
            {registries.map(r => {
                const isOwner = String(r.ownerId) === targetUserId;
                return <div key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3.5">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg text-ink [&>svg]:size-4.5">{registryTypeIcon(r.type)}</span>
                        <div className="min-w-0">
                            <p className="truncate text-body font-medium">{r.name}</p>
                            <p className="text-meta text-legend">
                                {registryTypeLabel(r.type)} · {isOwner ? "Owner" : `Owned by ${r.owner ?? "nobody"}`} · Created {formatDateShort(r.createdAt)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {r.permissions.map(p => <span key={p} className="chip">{registryPermissionLabels[p] ?? p}</span>)}
                            </div>
                        </div>
                    </div>
                    <button
                        className="button-tertiary shrink-0 self-start sm:self-center"
                        disabled={!accessibleIds.has(r.id)}
                        title={accessibleIds.has(r.id) ? "Open registry" : "You don't have access to this registry"}
                        onClick={() => { setRegistry(undefined); navigate(`/registries/${r.id}`); }}
                    >
                        Open
                    </button>
                </div>;
            })}
        </SettingsGroup>
    </div>;
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
            items.push({ text: "Registry Management", to: "/admin/registries", icon: <Database /> });
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

                {/* Tab Bar: ARIA tabs pattern, arrow keys move between tabs */}
                <div role="tablist" aria-label="User details" className="mb-8 inline-flex rounded-full bg-surface p-1" onKeyDown={e => {
                    const index = tabs.indexOf(activeTab);
                    const next = e.key === 'ArrowRight' ? (index + 1) % tabs.length
                        : e.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
                        : e.key === 'Home' ? 0
                        : e.key === 'End' ? tabs.length - 1
                        : null;
                    if (next === null) return;
                    e.preventDefault();
                    setActiveTab(tabs[next]);
                    document.getElementById(`tab-${tabs[next]}`)?.focus();
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            id={`tab-${tab}`}
                            role="tab"
                            aria-selected={activeTab === tab}
                            aria-controls={`tabpanel-${tab}`}
                            tabIndex={activeTab === tab ? 0 : -1}
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
                <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                    {activeTab === 'registries' && <RegistriesPanel targetUserId={id!} />}
                    {activeTab === 'roles' && <RolesPanel targetUserId={id!} />}
                    {activeTab === 'profile' && <ProfilePanel userId={id!} username={targetUser?.username || ""} email={targetUser?.email || ""} emailVerified={targetUser?.emailVerified || false} createdAt={targetUser?.createdAt || ""} tokenVersion={targetUser?.tokenVersion || 0} />}
                </div>

            </div>
        </StandardLayout>
    </>
}

export default EditUser;