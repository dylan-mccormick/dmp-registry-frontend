import { X } from "lucide-react";
import { useContext } from "react";
import { BannerContext } from "../context/BannerContext";

const Banner = () => {

    const { banner, setBanner } = useContext(BannerContext);

    if (!banner) return null;

    return (
        <div className="p-2">
            <div className={`w-full p-4 px-8 flex justify-between rounded text-white ${banner.level === "success" ? "bg-green-700" : banner.level === "error" ? "bg-red-700" : "bg-blue-700"}`}>
                <span>{banner.message}</span>
                <button onClick={() => setBanner(undefined)}><X /></button>
            </div>
        </div>
    )

}

export default Banner;