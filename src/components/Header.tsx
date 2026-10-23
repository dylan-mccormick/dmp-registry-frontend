import { LogOut, Menu, PanelLeft } from "lucide-react";
import { NavContext } from "../context/NavContext";
import { useContext } from "react";
import { Link, useNavigate } from "react-router";
import apiClient from "../apiClient";
import { UserContext } from "../context/UserContext";

interface HeaderProps {
    loggedInUser?: string;
    hideNavbar?: boolean;
}

const LogoutComponent = (props: HeaderProps) => {
    const navigate = useNavigate();
    const { setResetUser } = useContext(UserContext);

    const logoutUser = () => {
        apiClient.post("/api/v1/users/logout", {})
            .then(res => {
                if (!res.ok) {
                    throw new Error("Logout failed");
                }
                return res.json();
            })
            .then(() => {
                setResetUser(prev => prev + 1); // trigger user data refresh in App.tsx
                navigate("/home");
            })
            .catch(err => {
                console.error(err);
                alert("An error occurred while logging out. Please try again.");
            });
    }

    return <div className="flex items-center gap-1">
        <Link to="/profile" aria-label={`${props.loggedInUser}, account settings`} className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-surface">
            <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-ink text-xs font-semibold text-snow uppercase">
                {props.loggedInUser?.charAt(0)}
            </span>
            <span className="hidden text-meta font-medium sm:inline">{props.loggedInUser}</span>
        </Link>
        <button className="button-icon" onClick={logoutUser} title="Log out" aria-label="Log out">
            <LogOut className="size-4" />
        </button>
    </div>;
}

const LoginComponent = () => <div className="flex items-center gap-2">
    <Link className="hidden text-meta text-legend transition-colors hover:text-ink sm:inline" to="/register">Create account</Link>
    <Link className="button-primary min-h-8 px-3.5 text-xs" to="/login">Sign in</Link>
</div>

const Header = (props: HeaderProps) => {
    const { setNavOpen, navOpen } = useContext(NavContext);

    return (
        <header className="sticky top-0 z-30 w-full border-b border-rule/60 bg-bg/80 backdrop-blur-xl backdrop-saturate-150">
            <div className="flex h-14 items-center justify-between gap-4 px-3 sm:px-5">

                {/* Left */}
                <div className="flex items-center gap-1">
                    {!props.hideNavbar && (
                        <button
                            className="button-icon"
                            onClick={() => setNavOpen(!navOpen)}
                            title={navOpen ? "Hide sidebar" : "Show sidebar"}
                            aria-label={navOpen ? "Hide sidebar" : "Show sidebar"}
                            aria-expanded={navOpen}
                            aria-controls="sidebar"
                        >
                            <PanelLeft className="hidden size-4.5 sm:block" />
                            <Menu className="size-4.5 sm:hidden" />
                        </button>
                    )}
                    <Link className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1.5" to="/">
                        <img className="size-7" alt="" src="https://cdn.mnmzc.dev/logos/dmp-black.png" />
                        <span className="text-body font-semibold tracking-tight whitespace-nowrap">
                            DMP <span className="text-legend">Registry</span>
                        </span>
                    </Link>
                </div>

                {/* Right */}
                {props.loggedInUser ? <LogoutComponent loggedInUser={props.loggedInUser} /> : <LoginComponent />}

            </div>
        </header>
    )}

export default Header;
