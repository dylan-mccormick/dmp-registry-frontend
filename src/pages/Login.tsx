import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import apiClient from "../apiClient";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { UserContext } from "../context/UserContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";

const Login = () => {

    const { setBanner } = useContext(BannerContext);
    const { setResetUser } = useContext(UserContext);
    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);

    const [ username, setUsername ] = useState("");
    const [ password, setPassword ] = useState("");

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
        addProcess("login_process");
        setBanner(undefined); // clear existing banners

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
        .finally(() => removeProcess("login_process"));
    }

    return <>
    <title>Login</title>

        <StandardLayout title="Login">
            <div className="mx-auto w-full max-w-md px-4 pt-16 pb-24 sm:pt-24">
                <div className="mb-10 text-center">
                    <img src="https://cdn.mnmzc.dev/logos/dmp-black.png" alt="" className="mx-auto mb-6 size-14" />
                    <h1 className="text-h2 font-semibold">Sign in</h1>
                    <p className="mt-3 text-body text-legend">Use your DMP Registry account.</p>
                </div>
                <form className="card sm:p-8" onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label htmlFor="username" className="label">Username</label>
                        <input type="text" id="username" name="username" autoComplete="username" className="field" required value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="label">Password</label>
                        <input type="password" id="password" name="password" autoComplete="current-password" className="field" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="button-primary min-h-11 w-full text-body" disabled={processes.has("login_process")}>
                        {processes.has("login_process") ? "Signing in…" : "Sign in"}
                    </button>
                    <button type="button" className="button-link mt-4 w-full text-meta" onClick={() => navigate("/forgot-password")}>
                        Forgot password?
                    </button>
                </form>
                <p className="mt-8 text-center text-meta text-legend">
                    Don't have an account?{" "}
                    <button type="button" className="button-link" disabled={processes.has("login_process")} onClick={() => navigate("/register")}>Create one</button>
                </p>
            </div>
        </StandardLayout>

    </>
}

export default Login;
