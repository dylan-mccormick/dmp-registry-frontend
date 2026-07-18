import { useCallback, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import FilesystemController from "../components/registryControllers/FilesystemController";
import KeyValueController from "../components/registryControllers/KeyValueController";
import MongoDBController from "../components/registryControllers/MongoDBController";
import SQLiteController from "../components/registryControllers/SQLiteController";
import StandardLayout from "../components/StandardLayout";
import { BannerContext } from "../context/BannerContext";
import { NavbarLevel } from "../context/NavbarLevel";
import { RegistryContext } from "../context/RegistryContext";
import useRegistryBootstrap from "../hooks/useRegistryBootstrap";
import { LoadingBannerContext } from "../context/LoadingBannerContext";

const RegistryDashboard = () => {
    const { registryId } = useParams();

    const navigate = useNavigate();

    const { registryLoadingError } = useRegistryBootstrap(registryId);
    const { registry } = useContext(RegistryContext);
    const { setBanner } = useContext(BannerContext);
    const { processes } = useContext(LoadingBannerContext);

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
    }, [registryLoadingError, kickbackUser]);

    return (
        <>
            <StandardLayout navbarLevel={NavbarLevel.REGISTRY}>
                {!processes.has("loading_registry") &&
                <div className="p-8">
                    <div>
                        {(() => {
                            switch (registry?.type) {
                                case "files":
                                    return <FilesystemController />;
                                case "mongodb":
                                    return <MongoDBController />;
                                case "sqlite":
                                    return <SQLiteController />;
                                case "keyvalue":
                                    return <KeyValueController />;
                                default:
                                    return (
                                        <div className="border-red-500 bg-red-200 border br rounded p-4 text-red-900">
                                            Sorry, the controller for this
                                            registry type has not yet been
                                            implemented.
                                        </div>
                                    );
                            }
                        })()}
                    </div>
                </div>}
            </StandardLayout>
        </>
    );
};

export default RegistryDashboard;
