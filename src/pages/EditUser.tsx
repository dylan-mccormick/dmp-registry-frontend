import { Gauge, Settings, UsersRound } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import apiClient from "../apiClient";
import type { NavbarComponentProps } from "../components/NavbarComponent";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { ModalContext } from "../context/ModalContext";
import { UserContext } from "../context/UserContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";

type Tab = 'registries' | 'roles' | 'profile';

const RegistriesPanel = () => {
    return <div>Registries panel</div>
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
        <div className="p-8 flex flex-col items-center" >
            <form className="mt-4 w-full sm:w-lg" onSubmit={handleSubmit}>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 items-center">
                    <label htmlFor="createRegistries" className="text-right">Create Registries</label>
                    <input type="checkbox" id="createRegistries" name="createRegistries" checked={create_registry} onChange={(e) => setCreateRegistry(e.target.checked)} className="h-5 w-5 border-gray-300 rounded" />

                    <label htmlFor="manageUsers" className="text-right">Manage Users</label>
                    <input type="checkbox" id="manageUsers" name="manageUsers" checked={manage_users} onChange={(e) => setManageUsers(e.target.checked)} className="h-5 w-5 border-gray-300 rounded" />

                    <div /> {/* empty cell */}<div /> {/* empty cell */}
                    <div /> {/* empty cell */}

                    <button type="submit" className="button-primary" disabled={processes.has("updating_user_roles")}>Save Changes</button>
                </div>
            </form>
        </div>
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
        <div className="p-8 flex flex-col items-center" >
            <form className="mt-4 w-full sm:w-lg" onSubmit={handleSubmit}>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 items-center">
                    <label htmlFor="userId" className="text-right">User ID</label>
                    <span id="userId" className="px-3 py-2 border rounded bg-gray-100">{userId}</span>

                    <label htmlFor="username" className="text-right">Username</label>
                    <input type="text" id="username" name="username" maxLength={255} className="px-3 py-2 border rounded" required defaultValue={username} />

                    <label htmlFor="email" className="text-right">Email</label>
                    <input type="email" id="email" name="email" maxLength={255} className="px-3 py-2 border rounded" required defaultValue={email} />

                    <label htmlFor="emailVerified" className="text-right">Email Verified</label>
                    <input type="checkbox" id="emailVerified" name="emailVerified" className="h-5 w-5 border-gray-300 rounded" defaultChecked={emailVerified} />

                    <label htmlFor="createdAt" className="text-right">Created At</label>
                    <span id="createdAt" className="px-3 py-2 border rounded bg-gray-100">{new Date(createdAt).toLocaleString()}</span>

                    <label htmlFor="tokenVersion" className="text-right">Token Version</label>
                    <span id="tokenVersion" className="px-3 py-2 border rounded bg-gray-100">{tokenVersion}</span>

                    <div /> {/* empty cell */}<div /> {/* empty cell */}
                    <div /> {/* empty cell */}

                    <button type="submit" className="button-primary" disabled={processes.has("updating_user")}>Save Changes</button>

                    <div /> {/* empty cell */}

                    <button type="button" className="button-secondary border-red-500" onClick={handleDelete} disabled={processes.has("deleting_user")}>Delete User</button>
                </div>
            </form>
        </div>
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
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Edit User {id}</h1>

                {/* Tab Bar */}
                <div className="flex border-b border-primary mb-6">
                    {(['registries', 'roles', 'profile'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 capitalize border-b-2 -mb-px transition-colors ${
                                activeTab === tab
                                    ? 'border-primary text-primary font-semibold'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
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