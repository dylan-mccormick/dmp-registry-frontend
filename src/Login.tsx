import StandardLayout from "./components/StandardLayout";

const Login = () => <>

    <StandardLayout navItems={[]}>
        <main className="text-center flex-1 p-4 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4 mt-16">Login</h1>
            <p className="text-gray-700">Please enter your credentials to log in.</p>
            <form className="mt-4 max-w-sm mx-auto">
                <div className="mb-4">
                    <label htmlFor="username" className="block text-left text-gray-700 mb-2">Username</label>
                    <input type="text" id="username" name="username" className="w-full px-3 py-2 border rounded" />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-left text-gray-700 mb-2">Password</label>
                    <input type="password" id="password" name="password" className="w-full px-3 py-2 border rounded" />
                </div>
                <button type="submit" className="button-primary w-full">Log In</button>
            </form>
        </main>
    </StandardLayout>

</>

export default Login;
