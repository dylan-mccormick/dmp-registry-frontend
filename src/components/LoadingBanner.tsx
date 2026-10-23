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
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-bg/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} role="status" aria-live="polite">
            <div className="flex min-w-40 flex-col items-center gap-3 rounded-3xl bg-bg/90 px-8 py-7 shadow-[0_8px_40px_rgb(0_0_0/0.12)] ring-1 ring-rule/50 backdrop-blur-xl">
                <LoaderCircle className="size-7 animate-spin text-legend" />
                {[...processes.values()].at(-1) && (
                    <span className="text-meta text-legend">{[...processes.values()].at(-1)}</span>
                )}
            </div>
        </div>
    );
};

export default LoadingBanner;