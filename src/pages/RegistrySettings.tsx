import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"

const RegistrySettings = () => {

    return <>
        <StandardLayout title="Agent Management" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="p-8">
                <span className="text-3xl font-bold">Registry Settings</span>
            </div>
        </StandardLayout>
    </>
}

export default RegistrySettings;