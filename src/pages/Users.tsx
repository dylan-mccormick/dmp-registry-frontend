import { useContext, useEffect, useState } from "react";
import StandardLayout from "../components/StandardLayout"
import { Gauge, UsersRound, Settings } from "lucide-react";
import type { NavbarComponentProps } from "../components/NavbarComponent";
import { UserContext } from "../context/UserContext";
import apiClient from "../apiClient";
import { NavContext } from "../context/NavContext";
import { useNavigate } from "react-router";

const UserCard = ({ id, username, email }: { id: number; username: string; email: string }) => {
    const navigate = useNavigate();

    return <div className="p-4 border rounded mb-4" >
        {/* Left */}
        <div className="flex items-center gap-4" >
            <div className="flex flex-col min-w-0" >
                <h2 className="text-xl wrap-break-word">{id} | <span className="font-bold">{username}</span></h2>
                <p className="wrap-break-word">{email}</p>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4 ml-auto" >
                <button className="button button-secondary" onClick={() => navigate(`/user/${id}/edit`)}>Edit</button>
            </div>
        </div>
    </div>
}

const Users = () => {

    const { user } = useContext(UserContext);

    const [ navbarItems, setNavbarItems ] = useState<NavbarComponentProps[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ users, setUsers ] = useState<{ id: number; username: string; email: string }[]>([]);

    const { setBanner } = useContext(NavContext);

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

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get("/api/v1/users/list");

                if (!res.ok) {
                    setBanner({ message: "Failed to fetch users.", level: "error" });
                    return;
                }

                const data = await res.json();
                setUsers(data);
            } catch (err) {
                console.error(err);
                setBanner({ message: "Failed to fetch user data.", level: "error" });
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);


    return <>

    <StandardLayout navItems={navbarItems}>
        <div className="p-8" >
            <div className="mb-6" >
                <h1 className="text-3xl font-bold mb-6" >Users Directory</h1>

                {loading && <p>Loading users...</p>}
                <div className="flex flex-col w-full">
                    {users.map(user => <UserCard key={user.id} id={user.id} username={user.username} email={user.email} />)}
                </div>
            </div>
        </div>
    </StandardLayout>
    </>
}

export default Users;