import { useState } from "react";

import { type ModalConfig } from "../context/ModalContext";

const Modal = ({ config, onClose }: { config: ModalConfig, onClose: () => void }) => {
    const [inputValue, setInputValue] = useState('');

    return (
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

                <div className="flex gap-2 justify-end">
                    {config.type !== 'buttonless' && <>
                        {config.type !== 'alert' && (
                            <button className="button-secondary" onClick={() => {
                                setInputValue('');
                                onClose();
                                config.onCancel?.();
                            }}>Cancel</button>
                        )}

                            <button className="button-primary" onClick={() => {
                                onClose();
                                config.onConfirm?.(inputValue || undefined);
                                setInputValue('');
                            }}>
                                {config.type === 'alert' ? 'OK' : 'Confirm'}
                            </button>
                    </>}
                </div>
            </div>
        </div>
    );
}

export default Modal;