import StandardLayout from "../components/StandardLayout";

const PageNotFound = () => <>

<title>Error 404</title>

    <StandardLayout title="Page not Found">
        <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-24 sm:px-8 sm:pt-36">
            <p className="mb-6 text-meta font-semibold text-legend">Error 404</p>
            <h1 className="text-h1 font-semibold">Page not found.</h1>
            <p className="mt-6 max-w-[40ch] text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] leading-snug text-legend">The page you're looking for doesn't exist. Check the URL and try again.</p>
            <button className="button-primary mt-10 min-h-11 px-6 text-body" onClick={() => window.history.back()}>Go back</button>
        </div>
    </StandardLayout>

</>

export default PageNotFound;