import type { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    eyebrow?: string;
    subtitle?: ReactNode;
    buttonText?: string;
    buttonAction?: () => void;
    actions?: ReactNode;
}

const PageHeader = ({ title, eyebrow, subtitle, buttonText, buttonAction, actions }: PageHeaderProps) => {
    return <>
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
            {eyebrow && <p className="mb-2 text-meta font-semibold text-legend">{eyebrow}</p>}
            <h1 className="text-h2 font-semibold break-words">{title}</h1>
            {subtitle && <p className="mt-3 max-w-[65ch] text-body text-legend">{subtitle}</p>}
        </div>
        {(actions || (buttonText && buttonAction)) && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                {actions}
                {buttonText && buttonAction && (
                    <button className="button-primary" onClick={buttonAction}>
                        {buttonText}
                    </button>
                )}
            </div>
        )}
    </div>
    </>
}

export default PageHeader;
