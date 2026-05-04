import StandardLayout from "../components/StandardLayout";
import { Link } from "react-router";

const Home = () => <>

<title>DMP Registry</title>

    <StandardLayout>
        <main className="text-center flex-1 p-4 overflow-y-auto">

            <img src="https://cdn.mnmzc.us.to/logos/dmp-black.png" alt="DMP Service Logo" className="mx-auto mt-16 mb-4 w-32 h-32" />
            <h1 className="text-2xl font-bold mb-4">DMP Registry</h1>
            <Link className="button-primary" to="/login">Login</Link>
            <Link className="button-secondary ml-4" to="/register">Register</Link>

        </main>
    </StandardLayout>
</>

export default Home;