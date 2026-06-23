import { useContext, useEffect, useState, type JSX } from "react";
import StandardLayout from "../components/StandardLayout"
import apiClient from "../apiClient";
import { NavContext } from "../context/NavContext";
import { useNavigate } from "react-router";
import { NavbarLevel } from "../context/NavbarLevel";
import HTMLTable from "../components/HTMLTable";

const Users = () => {

    const navigate = useNavigate();

    const [ loading, setLoading ] = useState(false);
    const [ users, setUsers ] = useState<{ id: number; username: string; email: string }[]>([]);

    const { setBanner } = useContext(NavContext);

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
    }, [setBanner]);


    return <>

    <StandardLayout navbarLevel={NavbarLevel.TOP} title="Users Directory" >
        <div className="p-8" >
            <div className="mb-6" >
                <h1 className="text-3xl font-bold mb-6" >Users Directory</h1>

                {loading && <p>Loading users...</p>}

                <HTMLTable<{ id: number; username: string; email: string, actions: JSX.Element }>
                    columns={[
                        { text: "ID", dataKey: "id" },
                        { text: "Username", dataKey: "username" },
                        { text: "Email", dataKey: "email" },
                        { text: "Actions", dataKey: "actions", queryable: false }
                    ]}
                    data={users.map(u => ({ ...u, actions: <button className="button button-secondary" onClick={() => navigate(`/user/${u.id}/edit`)}>Edit</button> }))}
                />

                {/* <div className="flex flex-col w-full">
                    {users.map(user => <UserCard key={user.id} id={user.id} username={user.username} email={user.email} />)}
                </div> */}
            </div>
        </div>
    </StandardLayout>
    </>
}

export default Users;