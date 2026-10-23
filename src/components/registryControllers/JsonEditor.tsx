import { useContext, useId, useState } from "react";
import { ModalContext } from "../../context/ModalContext";

interface JsonEditorProps {
    initialValue: string;
    confirmText: string;
    onSave: (value: Record<string, unknown>) => void;
}

// Modal body for editing a JSON object; validates before handing the parsed object back
const JsonEditor = ({ initialValue, confirmText, onSave }: JsonEditorProps) => {
    const { closeModal } = useContext(ModalContext);
    const [ text, setText ] = useState(initialValue);
    const [ error, setError ] = useState<string | null>(null);
    const errorId = useId();

    const save = () => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch (err) {
            setError(`Invalid JSON: ${(err as Error).message}`);
            return;
        }
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            setError("The document must be a JSON object.");
            return;
        }
        closeModal();
        onSave(parsed as Record<string, unknown>);
    };

    return <div className="flex flex-col gap-3">
        <textarea
            aria-label="Document JSON"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            spellCheck={false}
            value={text}
            onChange={e => { setText(e.target.value); setError(null); }}
            className="field min-h-64 py-2.5 font-mono text-meta"
        />
        <p id={errorId} role="alert" className="text-meta text-danger empty:hidden">{error}</p>
        <p className="text-xs text-legend">Extended JSON is supported, e.g. <code className="font-mono">{`{"$date": "2026-01-01T00:00:00Z"}`}</code> or <code className="font-mono">{`{"$oid": "…"}`}</code>.</p>
        <div className="mt-4 flex justify-end gap-2">
            <button className="button-secondary" onClick={closeModal}>Cancel</button>
            <button className="button-primary" onClick={save}>{confirmText}</button>
        </div>
    </div>;
};

export default JsonEditor;
