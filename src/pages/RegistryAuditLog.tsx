import { FileClock } from "lucide-react"
import PageHeader from "../components/PageHeader"
import StandardLayout from "../components/StandardLayout"
import { NavbarLevel } from "../context/NavbarLevel"

const RegistryAuditLog = () => {

    return <>
        <StandardLayout title="Audit Log" navbarLevel={NavbarLevel.REGISTRY} >
            <div className="page">
                <PageHeader title="Audit Log" subtitle="A record of every change made to this registry." />
                <div className="card flex flex-col items-center py-16 text-center">
                    <span className="mb-4 grid size-12 place-items-center rounded-xl bg-bg text-legend"><FileClock className="size-5" /></span>
                    <p className="text-body font-medium">Nothing to show yet</p>
                    <p className="mt-1 text-meta text-legend">Audit events will appear here.</p>
                </div>
            </div>
        </StandardLayout>
    </>
}

export default RegistryAuditLog;