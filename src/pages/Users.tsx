import { useContext, useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import apiClient from "../apiClient";
import HTMLTable from "../components/HTMLTable";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { NavbarLevel } from "../context/NavbarLevel";
import { LoadingBannerContext } from "../context/LoadingBannerContext";

const Users = () => {

    const navigate = useNavigate();

    const [ users, setUsers ] = useState<{ id: number; username: string; email: string }[]>([]);

    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);
    const { setBanner } = useContext(BannerContext);

    useEffect(() => {
        const fetchUsers = async () => {
            addProcess("fetching_users");
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
                removeProcess("fetching_users");
            }
        };

        fetchUsers();
    }, [setBanner, removeProcess, addProcess]);


    return <>

    <StandardLayout navbarLevel={NavbarLevel.TOP} title="Users Directory" >
        <div className="p-8" >
            <div className="mb-6" >
                <h1 className="text-3xl font-bold mb-6" >Users Directory</h1>

                {!processes.has("fetching_users") && (
                    <HTMLTable<{ id: number; username: string; email: string, actions: JSX.Element }>
                        columns={[
                            { text: "ID", dataKey: "id", fixedPixelSize: 150 },
                            { text: "Username", dataKey: "username" },
                            { text: "Email", dataKey: "email" },
                            { text: "Actions", dataKey: "actions", queryable: false, fixedPixelSize: 200 }
                    ]}
                    data={users.map(u => ({ ...u, actions: <button className="button button-secondary" onClick={() => navigate(`/user/${u.id}/edit`)}>Edit</button> }))}
                    />)}

                {/* <div className="flex flex-col w-full">
                    {users.map(user => <UserCard key={user.id} id={user.id} username={user.username} email={user.email} />)}
                </div> */}
            </div>
        </div>
    </StandardLayout>
    </>
}

export default Users;