import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"

const RegistryAuditLog = () => {

    return <>
        <StandardLayout title="Audit Log" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="p-8">
                <span className="text-3xl font-bold">Audit Log</span>
            </div>
        </StandardLayout>
    </>
}

export default RegistryAuditLog;