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
    return <div className="mb-4">
        { label && <label className="font-medium block mb-2" htmlFor={name}>{label}</label> }
        {type === "select" ? (
            <select className="w-full px-3 py-2 border rounded" id={name} name={name} required={required} disabled={disabled}>
                <option value="">Select an option</option>
                {options?.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        ) : type === "checkbox" ? (
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id={name}
                    name={name}
                    checked={stateValue as boolean}
                    defaultChecked={defaultChecked}
                    onChange={(e) =>  setStateValue && setStateValue(e.target.checked)}
                    disabled={disabled}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                />
                <label htmlFor={name} className="ml-2 text-gray-700">
                    {labelText || label}
                </label>
            </div>
        ) : type === "textarea" ? (
            <textarea className="w-full px-3 py-2 border rounded" id={name} name={name} placeholder={placeholder} required={required} maxLength={maxLength} minLength={minLength} defaultValue={stateValue as string} disabled={disabled}></textarea>
        ) : (
            <input className="w-full px-3 py-2 border rounded" type={type} id={name} name={name} placeholder={placeholder} required={required} maxLength={maxLength} minLength={minLength} defaultValue={stateValue as string} disabled={disabled} />
        )}
        {warning && <p className="text-red-500 text-sm mt-1">{warning}</p>}
    </div>;
};

const CreationForm = ({ title, buttonText, buttonLoadingText, onSubmit, loading, fields, disclaimer, formDisabled }: CreationFormProps) => {
    return <>
    <div className="p-8 max-w-lg mx-auto md:border md:border-gray-200 rounded-lg py-16">
        <form className="max-w-sm mx-auto" onSubmit={onSubmit}>
            <h1 className="text-3xl font-bold text-center mb-6">{title}</h1>
            {fields.map(field => (
                <FormField key={field.name} {...field} disabled={formDisabled} />
            ))}
            {disclaimer && <p className="text-gray-500 text-sm mb-4">{disclaimer}</p>}
            <button className="button button-primary w-full" type="submit" disabled={loading || formDisabled}>
                {loading ? (buttonLoadingText || "Submitting...") : (buttonText || "Submit")}
            </button>
        </form>
    </div>
    </>;
};

export default CreationForm;