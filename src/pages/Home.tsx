import { FileClock, FolderClosed, Link as LinkIcon, UserKey } from "lucide-react";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import StandardLayout from "../components/StandardLayout";
import { Link } from "react-router";

const features = [
    { icon: <FolderClosed />, title: "Typed registries", body: "Files, MongoDB, SQLite and key-value stores, managed from one place." },
    { icon: <UserKey />, title: "Per-registry access", body: "Grant users exactly the read, write and management permissions they need." },
    { icon: <LinkIcon />, title: "API agents", body: "Issue scoped keys so services can read and write without a human login." },
    { icon: <FileClock />, title: "Audit logs", body: "See who changed what, and when, for every registry you own." },
];

const Home = () => {

    const { user } = useContext(UserContext);

return <>
<title>DMP Registry</title>

    <StandardLayout>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">

            <section className="pt-20 pb-20 sm:pt-32 sm:pb-28">
                <p className="mb-6 flex items-center gap-2 text-meta font-semibold text-legend">
                    <span className="size-2 rounded-full bg-signal" />
                    DMP Registry
                </p>
                <h1 className="text-h1 font-semibold">
                    Your data,<br /><span className="text-legend">in one place.</span>
                </h1>
                <p className="mt-6 max-w-[38ch] text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] leading-snug text-legend">
                    {user
                        ? <>Welcome back, <span className="text-ink">{user.username}</span>. Pick up where you left off.</>
                        : <>Create registries for files, documents, tables and keys — then share them with people and services.</>}
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                    {user && <Link className="button-primary min-h-11 px-6 text-body" to="/dashboard">Go to Dashboard</Link>}
                    {!user && <>
                        <Link className="button-primary min-h-11 px-6 text-body" to="/login">Sign in</Link>
                        <Link className="button-secondary min-h-11 px-6 text-body" to="/register">Create account</Link>
                    </>}
                </div>
            </section>

            <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
                {features.map(f => (
                    <div key={f.title} className="card flex flex-col gap-4">
                        <span className="grid size-11 place-items-center rounded-xl bg-bg text-ink [&>svg]:size-5">{f.icon}</span>
                        <div>
                            <h2 className="mb-1.5 text-body font-semibold">{f.title}</h2>
                            <p className="text-meta text-legend">{f.body}</p>
                        </div>
                    </div>
                ))}
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-rule py-8 text-meta text-legend">
                <span>DMP Registry</span>
                <a className="text-signal hover:underline underline-offset-[0.2em]" href="https://mnmzc.dev" target="_blank" rel="noreferrer">mnmzc.dev</a>
            </footer>

        </div>
    </StandardLayout>
</>
}

export default Home;
