import { useCallback, useContext, useEffect } from "react";
import StandardLayout from "../components/StandardLayout";
import { NavbarLevel } from "../context/NavbarLevel";
import { RegistryContext } from "../context/RegistryContext";
import { useNavigate, useParams } from "react-router";
import { NavContext } from "../context/NavContext";
import useRegistryBootstrap, { RegistryLoadingState } from "../hooks/useRegistryBootstrap";

const RegistryDashboard = () => {
    const { registryId } = useParams();

    const navigate = useNavigate();

    const { registryLoading, registryLoadingError } = useRegistryBootstrap(registryId);
    const { registry } = useContext(RegistryContext);
    const { setBanner } = useContext(NavContext);

    const kickbackUser = useCallback(() => {
        // Show error modal
        setBanner({
            level: "error",
            message:
                "An error occured and we were unable to load details about the requested registry.",
        });
        navigate("/dashboard");
    }, [navigate, setBanner]);

    useEffect(() => {
        if (registryLoadingError) {
            kickbackUser();
        }
    }, [ registryLoadingError, kickbackUser ])

    return <>
            <StandardLayout navbarLevel={NavbarLevel.REGISTRY}>
                {registryLoading != RegistryLoadingState.LOADED && <div className="text-center mt-8">Loading registry details...</div> ||
                <div className="p-8">
                    <span className="text-3xl font-bold mb-16">{registry?.name}</span>

                    <div className="mt-4">
                        {(() => {
                            switch (registry?.type) {
                                default: return <div className="border-red-500 bg-red-200 border br rounded p-4 text-red-900" >Sorry, the controller for this registry type has not yet been implemented.</div>
                            }
                        })()}
                    </div>
                </div>}
            </StandardLayout>
        </>
};

export default RegistryDashboard;
