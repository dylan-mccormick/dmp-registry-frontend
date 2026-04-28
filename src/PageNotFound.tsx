import StandardLayout from "./components/StandardLayout";

const PageNotFound = () => <>

    <StandardLayout navItems={[]}>
        <main className="text-center flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="text-gray-700">The page you are looking for does not exist. Please check the URL and try again.</p>
            <button className="button-link" onClick={() => window.history.back()}>Go Back</button>
        </main>
    </StandardLayout>

</>

export default PageNotFound;