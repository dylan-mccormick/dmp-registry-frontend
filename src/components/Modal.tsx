import { useCallback, useContext, useState, type Dispatch, type SetStateAction } from "react";

import { LoaderCircle } from "lucide-react";
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
        <div className="flex flex-col gap-3 py-3">
            {/* Drop zone */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragging ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'
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
                <p className="text-gray-500 text-sm">Drag and drop files here, or click to select</p>
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
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {files.map((file, i) => (
                        <div key={i} className="flex justify-between items-center border border-gray-300 rounded px-3 py-2 text-sm">
                            <span className="truncate mr-4">{file.name}</span>
                            <span className="text-gray-400 shrink-0">{formatSize(file.size)}</span>
                        </div>
                    ))}
                </div>
            )}

            <span className="text-red-500">{errorText}</span>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                <h2 className="text-lg font-bold mb-2">{config.title}</h2>
                {config.message && <p className="text-gray-600 mb-4">{config.message}</p>}

                {config.monoContent && (
                    <div className="flex flex-col space-y-2 bg-gray-100 p-3 rounded font-mono text-sm break-all max-h-40 overflow-y-auto">
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
                        className="w-full px-3 py-2 border rounded mb-4"
                    />
                )}

                {config.type === 'form' && <>
                    <form id="modal-form" onSubmit={e => e.preventDefault()} className="space-y-4">
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

                {config.loadingSpinner && <div className="flex items-center justify-center">
                    <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                </div>}

                <div className="flex gap-2 justify-end">
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