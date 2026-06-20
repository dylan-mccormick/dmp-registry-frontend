import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"

const RegistryAgentManagement = () => {

    return <>
        <StandardLayout title="Agent Management" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="p-8">
                <span className="text-3xl font-bold">Registry Agent Management</span>
            </div>
        </StandardLayout>
    </>
}

export default RegistryAgentManagement;