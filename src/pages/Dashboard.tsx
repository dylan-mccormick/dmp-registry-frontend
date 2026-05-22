import { useContext, useEffect, useState } from "react";
import StandardLayout from "../components/StandardLayout";
import { UserContext } from "../context/UserContext";
import type { NavbarComponentProps } from "../components/NavbarComponent";
import { Gauge, Settings, UsersRound } from "lucide-react";

const Dashboard = () => {

    const { user } = useContext(UserContext);

    const [ navbarItems, setNavbarItems ] = useState<NavbarComponentProps[]>([]);
    const [ createRegistries, setCreateRegistries ] = useState(false);

    useEffect(() => {
        const items: NavbarComponentProps[] = [
        { text: "Dashboard", to: "/dashboard", icon: <Gauge /> }
        ];

        if (user?.permissions.includes("MANAGE_USERS")) {
            items.push({ text: "User Management", to: "/users", icon: <UsersRound /> });
        }

        if (user?.permissions.includes("CREATE_REGISTRY")) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCreateRegistries(true);
        }

        items.push({ text: "Account", to: "/profile", icon: <Settings /> });
        setNavbarItems(items);
    }, [user]);


    return <>

    <StandardLayout navItems={navbarItems}>
        <div className="p-8" >
            <div className="flex justify-between items-center mb-6" >
                <h1 className="text-3xl font-bold" >Registries Directory</h1>
                <button className={`button ${!createRegistries ? "hidden" : ""} button-primary`} onClick={() => window.location.href = "/registries/new"} >Create Registry</button>
            </div>
            <span>Hello Registries!</span>
        </div>
    </StandardLayout>
    </>

}

export default Dashboard;
