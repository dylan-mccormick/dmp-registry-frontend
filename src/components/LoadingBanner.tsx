import { useContext, useEffect, useRef, useState } from "react";
import { LoadingBannerContext } from "../context/LoadingBannerContext";
import { LoaderCircle } from "lucide-react";

const LoadingBanner = () => {
    const { processes } = useContext(LoadingBannerContext);
    const [ visible, setVisible ] = useState(false);
    const [ mounted, setMounted ] = useState(false);
    const showTimeout = useRef<number | null>(null);
    const hideTimeout = useRef<number | null>(null);

    useEffect(() => {
        if (showTimeout.current != null) {
            window.clearTimeout(showTimeout.current);
            showTimeout.current = null;
        }

        if (hideTimeout.current != null) {
            window.clearTimeout(hideTimeout.current);
            hideTimeout.current = null;
        }

        if (processes.size > 0) {
            showTimeout.current = window.setTimeout(() => {
                setMounted(true);
                setVisible(true);
            }, 10);
        } else {
            hideTimeout.current = window.setTimeout(() => {
                setVisible(false);
                setMounted(false);
            }, 300);
        }

        return () => {
            if (showTimeout.current != null) {
                window.clearTimeout(showTimeout.current);
                showTimeout.current = null;
            }

            if (hideTimeout.current != null) {
                window.clearTimeout(hideTimeout.current);
                hideTimeout.current = null;
            }
        };
    }, [ processes.size ]);

    if (!mounted) return null;

    return (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                {[...processes.values()].at(-1) && (
                    <span className="text-sm text-gray-600">{[...processes.values()].at(-1)}</span>
                )}
            </div>
        </div>
    );
};

export default LoadingBanner;