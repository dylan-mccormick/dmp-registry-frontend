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
        <main className="text-center flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4 mt-16">Register</h1>
            <p>Please enter your details to create an account.</p>
            <form className="mt-4 max-w-sm mx-auto" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="username" className="block text-left mb-2">Username</label>
                    <input type="text" id="username" name="username" maxLength={255} className="w-full px-3 py-2 border rounded" onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-left mb-2" >Email</label>
                    <input type="email" id="email" name="email" maxLength={255} className="w-full px-3 py-2 border rounded" onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-left mb-2">Password</label>
                    <input type="password" id="password" name="password" maxLength={255} className="w-full px-3 py-2 border rounded" onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="mb-4">
                    <label htmlFor="confirm-password" className="block text-left mb-2">Confirm Password</label>
                    <input type="password" id="confirm-password" name="confirm-password" maxLength={255} className="w-full px-3 py-2 border rounded" onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="button-primary w-full" disabled={processes.has("register_process")}>
                    {processes.has("register_process") ? "Registering..." : "Register"}
                </button>
                <button type="button" className="button-secondary mt-2 w-full" onClick={() => navigate("/login")} disabled={processes.has("register_process")}>Already have an account? Log In</button>
            </form>
        </main>
    </StandardLayout>

}

export default Register;