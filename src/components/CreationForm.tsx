import type { Dispatch, SetStateAction } from "react";

export interface FormField {
    name: string;
    label?: string;
    labelText?: string;
    type: "text" | "password" | "number" | "email" | "textarea" | "select" | "checkbox" | "radio" | "date" | "datetime" | "time" | "datetime-local";
    maxLength?: number;
    minLength?: number;
    options?: { value: string; label: string }[];
    placeholder?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stateValue?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setStateValue?: Dispatch<SetStateAction<any>>;
    defaultChecked?: boolean;
    required?: boolean;
    warning?: string;
    disabled?: boolean;
}

interface CreationFormProps {
    title: string;
    buttonText?: string;
    buttonLoadingText?: string;
    onSubmit: (formData: React.FormEvent<HTMLFormElement>) => void;
    loading?: boolean;
    disclaimer?: string;
    fields: FormField[];
    formDisabled?: boolean;
}

export const FormField = ({ name, label, labelText, type, maxLength, minLength, options, placeholder, required, warning, stateValue, setStateValue, disabled, defaultChecked }: FormField) => {
    return <div className="mb-5">
        { label && type !== "checkbox" && <label className="label" htmlFor={name}>{label}</label> }
        {type === "select" ? (
            <select className="field" id={name} name={name} required={required} disabled={disabled}>
                <option value="">Select an option</option>
                {options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        ) : type === "checkbox" ? (
            <div className="flex items-center gap-3 py-1">
                <input
                    type="checkbox"
                    id={name}
                    name={name}
                    checked={stateValue as boolean}
                    defaultChecked={defaultChecked}
                    onChange={(e) =>  setStateValue && setStateValue(e.target.checked)}
                    disabled={disabled}
                />
                <label htmlFor={name} className="flex-1 cursor-pointer text-body">
                    {labelText || label}
                </label>
            </div>
        ) : type === "textarea" ? (
            <textarea className="field min-h-24 py-2.5" id={name} name={name} placeholder={placeholder} required={required} maxLength={maxLength} minLength={minLength} defaultValue={stateValue as string} disabled={disabled}></textarea>
        ) : (
            <input className="field" type={type} id={name} name={name} placeholder={placeholder} required={required} maxLength={maxLength} minLength={minLength} defaultValue={stateValue as string} disabled={disabled} />
        )}
        {warning && <p className="mt-1.5 text-meta text-danger">{warning}</p>}
    </div>;
};

const CreationForm = ({ title, buttonText, buttonLoadingText, onSubmit, loading, fields, disclaimer, formDisabled }: CreationFormProps) => {
    return <>
    <div className="mx-auto max-w-lg sm:pt-4">
        <form className="card sm:p-10" onSubmit={onSubmit}>
            <h1 className="mb-8 text-center text-h2 font-semibold">{title}</h1>
            {fields.map(field => (
                <FormField key={field.name} {...field} disabled={formDisabled} />
            ))}
            {disclaimer && <p className="mb-5 text-meta text-legend">{disclaimer}</p>}
            <button className="button-primary mt-2 min-h-11 w-full text-body" type="submit" disabled={loading || formDisabled}>
                {loading ? (buttonLoadingText || "Submitting...") : (buttonText || "Submit")}
            </button>
        </form>
    </div>
    </>;
};

export default CreationForm;