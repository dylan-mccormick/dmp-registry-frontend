import { useContext, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import apiClient from "../apiClient";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { UserContext } from "../context/UserContext";
import { LoadingBannerContext } from "../context/LoadingBannerContext";

const Register = () => {

    const { setBanner } = useContext(BannerContext);
    const { setResetUser } = useContext(UserContext);
    const { processes, addProcess, removeProcess } = useContext(LoadingBannerContext);

    const navigate = useNavigate();

    const [ username, setUsername ] = useState("");
    const [ email, setEmail ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ confirmPassword, setConfirmPassword ] = useState("");

    const handleSuccess = () => {
        // redirect to home
        navigate("/home");
    }

    const handleError = (message: string) => {
        setBanner({ message, level: "error" });
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (username.length < 3 || !username.match(/^\w+$/)) {
            handleError("Username must be at least 3 characters long and contain only letters, numbers, and underscores");
            return;
        }

        if (password.length < 8 || !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)) {
            handleError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
            return;
        }

        if (password !== confirmPassword) {
            handleError("Passwords do not match");
            return;
        }

        setBanner(undefined);
        addProcess("register_process");

        apiClient.post("/api/v1/users/register", {
            username,
            email,
            password
        })
        .then(res => {
            if (!res.ok) {
                if (res.status === 400) {
                    return res.json().then(data => {
                        handleError(data.message || "Registration failed. Please check your input and try again.");
                    });
                } else {
                    handleError("Registration failed. Please try again.");
                }
                return;
            }

            setResetUser(prev => prev + 1); // trigger user data refresh in App.tsx
            handleSuccess();
        })
        .catch(err => {
            console.error(err);
            handleError("Registration failed. Please try again.");
        })
        .finally(() => {
            removeProcess("register_process");
        });
    }

    return <StandardLayout title="Register">
        <div className="mx-auto w-full max-w-md px-4 pt-16 pb-24 sm:pt-24">
            <div className="mb-10 text-center">
                <img src="https://cdn.mnmzc.dev/logos/dmp-black.png" alt="" className="mx-auto mb-6 size-14" />
                <h1 className="text-h2 font-semibold">Create your account</h1>
                <p className="mt-3 text-body text-legend">One account for every registry you're part of.</p>
            </div>
            <form className="card sm:p-8" onSubmit={handleSubmit}>
                <div className="mb-5">
                    <label htmlFor="username" className="label">Username</label>
                    <input type="text" id="username" name="username" maxLength={255} autoComplete="username" className="field" onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="mb-5">
                    <label htmlFor="email" className="label">Email</label>
                    <input type="email" id="email" name="email" maxLength={255} autoComplete="email" className="field" onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="mb-5">
                    <label htmlFor="password" className="label">Password</label>
                    <input type="password" id="password" name="password" maxLength={255} autoComplete="new-password" className="field" onChange={e => setPassword(e.target.value)} required />
                    <p className="mt-1.5 text-xs text-legend">At least 8 characters with upper and lowercase letters, a number and a symbol.</p>
                </div>
                <div className="mb-6">
                    <label htmlFor="confirm-password" className="label">Confirm password</label>
                    <input type="password" id="confirm-password" name="confirm-password" maxLength={255} autoComplete="new-password" className="field" onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="button-primary min-h-11 w-full text-body" disabled={processes.has("register_process")}>
                    {processes.has("register_process") ? "Creating account…" : "Create account"}
                </button>
            </form>
            <p className="mt-8 text-center text-meta text-legend">
                Already have an account?{" "}
                <button type="button" className="button-link" onClick={() => navigate("/login")} disabled={processes.has("register_process")}>Sign in</button>
            </p>
        </div>
    </StandardLayout>

}

export default Register;