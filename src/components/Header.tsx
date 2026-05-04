import { CircleUserRound, Menu } from "lucide-react";
import { NavContext } from "../context/NavContext";
import { useContext } from "react";
import { Link } from "react-router";
import apiClient from "../apiClient";

interface HeaderProps {
    loggedInUser?: string;
    hideNavbar?: boolean;
}

const LogoutComponent = (props: HeaderProps) => {

    const logoutUser = () => {
        apiClient.post("/api/v1/users/logout", {})
            .then(res => {
                if (!res.ok) {
                    throw new Error("Logout failed");
                }
                return res.json();
            })
            .then(() => {
                // Redirect to home page after logout
                window.location.href = "/home";
            })
            .catch(err => {
                console.error(err);
                alert("An error occurred while logging out. Please try again.");
            });
    }

return <div className="flex-col items-center">
    <div className="w-full flex">
        <CircleUserRound />
        <p className="ml-4">{props.loggedInUser}</p>
    </div>
    <button className="button-link w-full text-right" onClick={logoutUser}>Log Out</button>
</div>

}

const LoginComponent = () => <>
    <Link className="button-link" to="/login">Log In</Link>
</>

const Header = (props: HeaderProps) => {
    const { setNavOpen, navOpen } = useContext(NavContext);

    return (
<div className="w-full h-16 border-b border-gray-300 flex items-center justify-between px-4">

    <link rel="icon" type="image/x-icon" href="https://cdn.mnmzc.us.to/logos/dmp.png" />

    {/* Left */}
    <div className="flex items-center h-16" >
        <button className={`button-link text-black ${props.hideNavbar ? 'hidden' : ''}`}><Menu className="mr-2" onClick={ () => setNavOpen(!navOpen) } /></button>
        <Link className="button-link no-underline flex items-center h-16" to="/">
            <img className="h-full ml-2 mr-2 py-2" alt="DMP Service Logo" src="https://cdn.mnmzc.us.to/logos/dmp-black.png"></img>
            <h3 className="text-lg ml-2 mr-2 hover:text-black active:text-black text-black">Registry</h3>
        </Link>
    </div>

    {/* Right */}
    <div className="flex items-center gap-2 h-16">
        {props.loggedInUser ? <LogoutComponent loggedInUser={props.loggedInUser} /> : <LoginComponent />}
    </div>

</div>

    )}

export default Header;