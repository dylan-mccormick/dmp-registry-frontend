import { useContext, useState } from "react";
import StandardLayout from "../components/StandardLayout";
import { NavContext } from "../context/NavContext";
import apiClient from "../apiClient";
import { useNavigate } from "react-router";
import { UserContext } from "../context/UserContext";

const Login = () => {

    const { setBanner } = useContext(NavContext);
    const { setResetUser } = useContext(UserContext);

    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");

    const [ loading, setLoading ] = useState(false);

    const navigate = useNavigate();

    const handleSuccess = () => {
        // redirect to home

        navigate("/home");
    }

    const handleError = (message: string) => {
        // show error banner
        setBanner({ level: "error", message });
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setBanner(null); // clear existing banners

        apiClient.post("/api/v1/users/login", {
            username,
            password
        })
        .then(res => {
            if (!res.ok) {
                if (res.status === 401) {
                    handleError("Invalid username or password.");
                    return;
                }
                handleError("Login failed. Please try again.");
                return;
            }

            setResetUser(prev => prev + 1); // trigger user data refresh in App.tsx
            handleSuccess();
        })
        .catch(err => {
            console.error(err);
            handleError("Login failed. Please try again.");
        })
        .finally(() => setLoading(false));
    }

    return <>
    <title>Login</title>

        <StandardLayout title="Login">
            <main className="text-center flex-1 p-4 overflow-y-auto">
                <h1 className="text-2xl font-bold mb-4 mt-16">Login</h1>
                <p>Please enter your credentials to log in.</p>
                <form className="mt-4 max-w-sm mx-auto" onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-left mb-2">Username</label>
                        <input type="text" id="username" name="username" className="w-full px-3 py-2 border rounded" required value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-left mb-2">Password</label>
                        <input type="password" id="password" name="password" className="w-full px-3 py-2 border rounded" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="button-primary w-full" disabled={loading}>
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                    <button type="button" className="button-secondary mt-2 w-full" disabled={loading} onClick={() => navigate("/register")}>
                        Don't have an account? Register
                    </button>
                    <button type="button" className="button-link mt-2 w-full" onClick={() => navigate("/forgot-password")}>
                        Forgot Password?
                    </button>
                </form>
            </main>
        </StandardLayout>

    </>
}

export default Login;
