import { useCallback, useContext, useState, type Dispatch, type SetStateAction } from "react";

import { LoaderCircle, Upload } from "lucide-react";
import { ModalContext } from "../context/ModalContext";
import { formatSize } from "../utils/formatSize";
import { FormField } from "./CreationForm";

const FilesUpload = ({ filesLimit, sizeLimit, acceptedFileExtensions, onFilesChange }: { filesLimit?: number, sizeLimit?: number, acceptedFileExtensions?: string[], onFilesChange: Dispatch<SetStateAction<File[]>> }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);

    const handleFiles = (incoming: FileList | null) => {
        if (!incoming) return;
        const arr = Array.from(incoming);

        if (filesLimit && arr.length > filesLimit) {
            setErrorText(`You can only upload up to ${filesLimit} file(s).`);
            return;
        }

        if (sizeLimit && arr.some(file => file.size > sizeLimit)) {
            setErrorText(`One or more files exceed the size limit of ${formatSize(sizeLimit)}.`);
            return;
        }

        if (acceptedFileExtensions && arr.some(file => !acceptedFileExtensions.includes(file.name.split('.').pop() || ''))) {
            setErrorText(`One or more files have an invalid file type. Accepted types: ${acceptedFileExtensions.join(', ')}`);
            return;
        }

        setErrorText(null);

        setFiles(arr);
        onFilesChange(arr);
    };

    return (
        <div className="flex flex-col gap-3 pb-2">
            {/* Drop zone */}
            <div
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                    dragging ? 'border-blue bg-blue/5' : 'border-rule bg-surface hover:border-blue/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    handleFiles(e.dataTransfer.files);
                }}
                onClick={() => document.getElementById('file-upload-input')?.click()}
            >
                <Upload className={`size-6 ${dragging ? 'text-blue' : 'text-legend'}`} />
                <p className="text-meta text-legend">Drop files here, or <span className="text-signal">browse</span></p>
                <input
                    id="file-upload-input"
                    type="file"
                    multiple={filesLimit !== 1}
                    accept={acceptedFileExtensions?.map(ext => `.${ext}`).join(',')}
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            {/* Preview */}
            {files.length > 0 && (
                <div className="flex max-h-40 flex-col divide-y divide-rule/60 overflow-y-auto rounded-xl bg-surface">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between px-3.5 py-2.5 text-meta">
                            <span className="truncate mr-4">{file.name}</span>
                            <span className="shrink-0 text-legend">{formatSize(file.size)}</span>
                        </div>
                    ))}
                </div>
            )}

            {errorText && <span className="text-meta text-danger">{errorText}</span>}
        </div>
    );
};

const Modal = () => {

    const { modal: config, closeModal: onClose } = useContext(ModalContext);

    const [inputValue, setInputValue] = useState('');
    const [ files, setFiles ] = useState<File[]>([]);

    const handleSubmit = useCallback(() => {
        onClose();
        if (!config) return;

        if (config.type === 'form') {
            const formData = new FormData(document.querySelector('#modal-form') as HTMLFormElement);
            const formValues: Record<string, string> = {};
            formData.forEach((value, key) => {
                formValues[key] = value.toString();
            });
            config.onConfirm?.(JSON.stringify(formValues));
            return;
        }
        if (config.type === 'files') {
            config.onConfirm?.(files);
            return;
        }
        if (config.type !== 'buttonless' && config.type !== 'custom') {
            config.onConfirm?.(inputValue);
            setInputValue('');
        }
    }, [config, files, inputValue, onClose]);

    return config && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4 backdrop-blur-sm animate-fade-in">
            <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-bg p-7 shadow-[0_24px_80px_rgb(0_0_0/0.18)] animate-pop-in">
                <h2 id="modal-title" className="text-h3 font-semibold">{config.title}</h2>
                {config.message && <p className="mt-2 text-body text-legend">{config.message}</p>}
                <div className="mt-5 empty:hidden">
                    {config.monoContent && (
                        <div className="mb-4 flex max-h-40 flex-col overflow-y-auto rounded-xl bg-surface p-3.5 font-mono text-meta break-all select-all">
                            <span>{config.monoContent}</span>
                        </div>
                    )}

                    {(config.type === 'input' || config.type === 'password') && (
                        <input
                            autoFocus
                            type={config.type === 'password' ? 'password' : 'text'}
                            placeholder={config.placeholder}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                            className="field"
                        />
                    )}

                    {config.type === 'form' && <>
                        <form id="modal-form" onSubmit={e => e.preventDefault()} className="mb-1">
                            {config.formFields?.map((field) => <FormField key={field.name} {...field} />)}
                        </form>
                    </>}

                    {config.type == "files" && <>
                        <FilesUpload
                            filesLimit={config.fileUploadConfig?.filesLimit}
                            acceptedFileExtensions={config.fileUploadConfig?.acceptedFileExtensions}
                            sizeLimit={config.fileUploadConfig?.sizeLimit}
                            onFilesChange={setFiles}
                        />
                    </>}

                    {config.type === 'custom' && config.content}

                    {config.loadingSpinner && <div className="flex items-center justify-center py-4">
                        <LoaderCircle className="size-8 animate-spin text-legend" />
                    </div>}
                </div>

                <div className="mt-7 flex justify-end gap-2 empty:hidden">
                    {config.type !== 'buttonless' && config.type !== 'custom' && <>
                        {config.type !== 'alert' && (
                            <button className="button-secondary" onClick={() => {
                                setInputValue('');
                                onClose();
                                config.onCancel?.();
                            }}>Cancel</button>
                        )}

                            <button className="button-primary" onClick={handleSubmit}>
                                {config.type === 'alert' ? 'OK' : 'Confirm'}
                            </button>
                    </>}
                </div>
            </div>
        </div>
    );
}

export default Modal;