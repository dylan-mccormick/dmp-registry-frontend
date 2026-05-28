import { useContext, useState } from "react";
import StandardLayout from "../components/StandardLayout"
import { UserContext } from "../context/UserContext";
import apiClient from "../apiClient";
import { ModalContext } from "../context/ModalContext";
import { NavContext } from "../context/NavContext";
import { useNavigate } from "react-router";
import { NavbarLevel } from "../context/NavbarLevel";

const Account = () => {

    const { user, setUser } = useContext(UserContext);
    const { setBanner } = useContext(NavContext);
    const { showModal, closeModal } = useContext(ModalContext);

    const [ loading, setLoading ] = useState(false);
    const navigate = useNavigate();

    const handleChangePassword = async () => {
        showModal({
            title: "Change Password",
            type: "password",
            placeholder: "Current password",
            onConfirm: async (currentPassword) => {
                showModal({
                    title: "New Password",
                    type: "password",
                    placeholder: "New password",
                    onConfirm: async (newPassword) => {
                        // validate new password
                        if (!newPassword || newPassword.length < 8 || !newPassword?.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)) {
                            setBanner({ level: "error", message: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character." });
                            return;
                        }

                        showModal({
                            title: "Confirm New Password",
                            type: "password",
                            placeholder: "Confirm new password",
                            onConfirm: async (confirmPassword) => {
                                if (newPassword !== confirmPassword) {
                                    setBanner({ level: "error", message: "New password and confirmation do not match." });
                                    return;
                                }

                                try {
                                    const res = await apiClient.patch(`/api/v1/users/change-password/me`, {
                                        oldPassword: currentPassword,
                                        newPassword
                                    });
                                    if (!res.ok) {
                                        const data = await res.json();
                                        setBanner({ level: "error", message: data.message ?? "Failed to change password." });
                                        return;
                                    }

                                    // run logout to force user to log in with new password
                                    apiClient.post("/api/v1/users/logout", {}).then(() => showModal({
                                        title: "Password Changed",
                                        message: "Your password has been changed successfully. Please log in again with your new password.",
                                        type: "alert",
                                        onConfirm: () => {
                                            // clear user and redirect
                                            setUser(null);
                                            navigate("/home");
                                            setBanner({ level: "success", message: "Password changed successfully." });
                                        }
                                    }));


                                } catch {
                                    setBanner({ level: "error", message: "An error occurred." });
                                } finally {
                                    closeModal();
                                }
                            }
                        });
                    }
                });
            }
        });
    };

    const handleDeleteAccount = async () => {
        showModal({
            title: "Delete Account",
            message: "This action cannot be undone. Please enter your password to confirm.",
            type: "password",
            placeholder: "Enter your password",
            onConfirm: async (password) => {
                // run through a few more confirmation modals to make sure they know what they're doing
                showModal({
                    title: "Confirmation Prompt",
                    message: "Type 'I want to delete my account' to confirm.",
                    type: "input",
                    placeholder: "Type the confirmation phrase here",
                    onConfirm: async (input) => {
                        if (input !== "I want to delete my account") {
                            setBanner({ level: "error", message: "Confirmation phrase did not match. Account deletion cancelled." });
                            return;
                        }

                        showModal({
                            title: "Final Confirmation",
                            message: "Upon deletion of your account, you will permanently lose access to your account and all associated data. This action cannot be undone. Are you absolutely sure you want to proceed?",
                            type: "confirm",
                            onConfirm: async () => {

                                showModal({
                                    title: "FINAL CONFIRMATION",
                                    message: "UPON PRESSING 'CONFIRM' YOU WILL BE REDIRECTED TO THE HOMEPAGE AND YOU WILL NEVER BE ABLE TO LOG BACK INTO THIS ACCOUNT AGAIN. THERE IS NO WAY TO RECOVER YOUR ACCOUNT AFTER THIS ACTION. DO NOT PROCEED UNLESS YOU ARE ABSOLUTELY SURE THIS IS WHAT YOU WANT TO DO. ARE YOU 100% SURE YOU WANT TO DELETE YOUR ACCOUNT?",
                                    type: "confirm",
                                    onConfirm: async () => {

                                        showModal({
                                            title: "Deleting Account...",
                                            message: "Please wait while we delete your account. This may take a few moments.",
                                            type: "buttonless"
                                        });

                                        try {
                                            setLoading(true);
                                            const res = await apiClient.delete(`/api/v1/users/delete/me`, { password });
                                            if (!res.ok) {
                                                const data = await res.json();
                                                setBanner({ level: "error", message: data.message ?? "Failed to delete account." });
                                                setLoading(false);
                                                closeModal();
                                                return;
                                            }
                                            // clear user and redirect
                                            setUser(null);
                                            navigate("/home");
                                            setBanner({ level: "success", message: "Account deleted successfully." });
                                        } catch {
                                            setBanner({ level: "error", message: "An error occurred." });
                                            setLoading(false);
                                        } finally {
                                            closeModal();
                                        }
                                    }
                                });

                            }
                        });
                    }
                });
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // get the new username and email from the form
        const formData = new FormData(e.target as HTMLFormElement);
        const username = formData.get("username") as string;
        const email = formData.get("email") as string;

        // test username for regex
        if (!username || username.length < 3 || !username.match(/^\w+$/)) {
            setBanner({ message: "Username must be at least 3 characters long and contain only letters, numbers, and underscores.", level: "error" });
            setLoading(false);
            return;
        }

        // send the update request to the server
        const res = await apiClient.patch("/api/v1/users/update/me", { username, email });
        if (!res.ok) {
            setLoading(false);

            // try to extract error message from response
            let errorMessage = "Failed to update account.";
            try {
                const errorData = await res.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_) {
                // ignore JSON parsing errors
            }

            setBanner({ message: errorMessage, level: "error" });
            setLoading(false);
            return;
        }

        setBanner({ message: "Account updated successfully.", level: "success" });
        setLoading(false);
    };


    return <>

    <StandardLayout navbarLevel={NavbarLevel.TOP} title="Account Settings">
        <div className="p-8" >
            <h1 className="text-3xl font-bold mb-16" >Account Settings</h1>
            <div className="flex flex-col items-center" >
                <form onSubmit={handleSubmit} className="mt-4 w-full sm:w-lg">
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 items-center">
                        <label htmlFor="username" className="text-right">Username</label>
                        <input type="text" id="username" name="username" maxLength={255} className="px-3 py-2 border rounded" defaultValue={user?.username} required />

                        <label htmlFor="email" className="text-right">Email</label>
                        <input type="email" id="email" name="email" maxLength={255} className="px-3 py-2 border rounded" defaultValue={user?.email} required />


                        <div /> {/* empty cell */}<div /> {/* empty cell */}
                        <div /> {/* empty cell */}
                        <button type="submit" className="button-primary" disabled={loading}>Save Changes</button>
                        <div /> {/* empty cell to push button into second column */}
                        <button type="button" className="button-secondary" disabled={loading} onClick={handleChangePassword}>
                            Change Password
                        </button>
                        <div /> {/* empty cell */}
                        <button type="button" className="button-secondary border-red-500" disabled={loading} onClick={handleDeleteAccount}>
                            Delete Account
                        </button>
                    </div>
                </form>

            </div>
        </div>
    </StandardLayout>
    </>
}

export default Account;