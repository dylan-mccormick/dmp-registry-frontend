import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useContext } from "react";
import { BannerContext } from "../context/BannerContext";

const bannerStyles = {
    success: { className: "bg-success/10 text-success", icon: CircleCheck },
    error: { className: "bg-danger/8 text-danger", icon: CircleAlert },
    info: { className: "bg-blue/8 text-signal", icon: Info },
};

const Banner = () => {

    const { banner, setBanner } = useContext(BannerContext);

    if (!banner) return null;

    const { className, icon: Icon } = bannerStyles[banner.level];

    return (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-8 sm:pt-6">
            <div role={banner.level === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 animate-pop-in ${className}`}>
                <Icon className="mt-0.5 size-4.5 shrink-0" />
                <span className="flex-1 text-meta font-medium text-ink">{banner.message}</span>
                <button className="-my-1 -mr-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink" onClick={() => setBanner(undefined)} aria-label="Dismiss">
                    <X className="size-4" />
                </button>
            </div>
        </div>
    )

}

export default Banner;
