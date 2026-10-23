import type { ReactNode } from "react";

interface SettingsGroupProps {
    title?: string;
    description?: string;
    children: ReactNode;
}

// A rounded, hairline-divided list of rows, like an Apple Settings section
export const SettingsGroup = ({ title, description, children }: SettingsGroupProps) => <section className="mb-8">
    {title && <h2 className="mb-1 px-1 text-body font-semibold">{title}</h2>}
    {description && <p className="mb-3 px-1 text-meta text-legend">{description}</p>}
    <div className={`divide-y divide-rule/60 overflow-hidden rounded-2xl bg-surface ${title && !description ? "mt-3" : ""}`}>
        {children}
    </div>
</section>;

interface SettingsRowProps {
    label: string;
    htmlFor?: string;
    hint?: string;
    children: ReactNode;
}

export const SettingsRow = ({ label, htmlFor, hint, children }: SettingsRowProps) => <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
    <div className="min-w-0">
        {htmlFor ? <label htmlFor={htmlFor} className="text-body">{label}</label> : <span className="text-body">{label}</span>}
        {hint && <p className="text-meta text-legend">{hint}</p>}
    </div>
    <div className="flex min-w-0 items-center sm:w-80 sm:shrink-0 sm:justify-end">
        {children}
    </div>
</div>;

// Bottom row of form actions: primary actions on the right, destructive on the left
export const SettingsActions = ({ children, destructive }: { children: ReactNode; destructive?: ReactNode }) => <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>{destructive}</div>
    <div className="flex flex-wrap justify-end gap-2">{children}</div>
</div>;
