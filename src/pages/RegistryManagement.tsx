import { useContext, useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router";
import apiClient from "../apiClient";
import HTMLTable from "../components/HTMLTable";
import PageHeader from "../components/PageHeader";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { NavbarLevel } from "../context/NavbarLevel";
import { RegistryContext } from "../context/RegistryContext";
import { UserContext } from "../context/UserContext";
import type { RegistrySummary } from "../model/RegistrySummary";
import { registryTypeDisplay, registryTypeLabel } from "../utils/registryDisplay";

const statClass = "inline-flex items-center rounded-full bg-surface px-3 py-1 text-xs font-medium text-legend";

const RegistryManagement = () => {

    const navigate = useNavigate();

    const { user } = useContext(UserContext);
    const { setRegistry } = useContext(RegistryContext);
    const { setBanner } = useContext(BannerContext);
    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);

    const [ registries, setRegistries ] = useState<RegistrySummary[]>([]);
    // Registries the current user can open themselves
    const [ accessibleIds, setAccessibleIds ] = useState<Set<number>>(new Set());

    const canManage = user?.permissions.includes("MANAGE_USERS") ?? false;

    useEffect(() => {
        if (user && !canManage) navigate("/dashboard");
    }, [user, canManage, navigate]);

    useEffect(() => {
        if (!canManage) return;

        const fetchRegistries = async () => {
            addProcess("fetching_all_registries");
            try {
                const [ allRes, mineRes ] = await Promise.all([
                    apiClient.get("/api/v1/registries/list/all"),
                    apiClient.get("/api/v1/registries/list/me")
                ]);

                if (!allRes.ok) {
                    setBanner({ level: "error", message: "Failed to fetch registries." });
                    return;
                }

                setRegistries(await allRes.json());
                if (mineRes.ok) {
                    const mine = await mineRes.json() as RegistrySummary[];
                    setAccessibleIds(new Set(mine.map(r => r.id)));
                }
            } catch (err) {
                console.error(err);
                setBanner({ level: "error", message: "Failed to fetch registries." });
            } finally {
                removeProcess("fetching_all_registries");
            }
        };

        fetchRegistries();
    }, [canManage, addProcess, removeProcess, setBanner]);

    const typeCounts = useMemo(() => Object.keys(registryTypeDisplay)
        .map(type => ({ type, count: registries.filter(r => r.type === type).length }))
        .filter(t => t.count > 0), [registries]);

    const openRegistry = (id: number) => {
        setRegistry(undefined);
        navigate(`/registries/${id}`);
    };

    return <>
        <StandardLayout navbarLevel={NavbarLevel.TOP} title="Registry Management">
            <div className="page">
                <PageHeader eyebrow="Administration" title="Registries" subtitle="Every registry on this DMP Registry, across all owners." />

                {!processes.has("fetching_all_registries") && <>
                    <div className="mb-6 flex flex-wrap gap-2">
                        <span className={`${statClass} text-ink`}>{registries.length} total</span>
                        {typeCounts.map(t => <span key={t.type} className={statClass}>{t.count} {registryTypeLabel(t.type)}</span>)}
                    </div>

                    {registries.length === 0 && <p className="card text-center text-meta text-legend">No registries have been created yet.</p>}

                    {registries.length > 0 && <HTMLTable<{ id: number; name: string; type: string; owner: string; created: string; actions: JSX.Element }>
                        columns={[
                            { text: "ID", dataKey: "id", queryable: false, fixedPixelSize: 80 },
                            { text: "Name", dataKey: "name" },
                            { text: "Type", dataKey: "type", fixedPixelSize: 160 },
                            { text: "Owner", dataKey: "owner" },
                            { text: "Created", dataKey: "created", fixedPixelSize: 170 },
                            { text: "Actions", dataKey: "actions", queryable: false, fixedPixelSize: 220 }
                        ]}
                        data={registries.map(r => ({
                            id: r.id,
                            name: r.name,
                            type: registryTypeLabel(r.type),
                            owner: r.owner ?? "Unassigned",
                            created: r.createdAt.slice(0, 10),
                            actions: <div className="flex items-center gap-2">
                                <button className="button-secondary min-h-8 px-3 text-xs" disabled={!accessibleIds.has(r.id)} title={accessibleIds.has(r.id) ? "Open registry" : "You don't have access to this registry"} onClick={() => openRegistry(r.id)}>Open</button>
                                <button className="button-secondary min-h-8 px-3 text-xs" disabled={r.ownerId == null} onClick={() => navigate(`/user/${r.ownerId}/edit`)}>View owner</button>
                            </div>
                        }))}
                    />}
                </>}
            </div>
        </StandardLayout>
    </>
}

export default RegistryManagement;
