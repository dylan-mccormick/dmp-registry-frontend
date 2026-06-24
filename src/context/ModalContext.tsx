import { createContext } from "react";

export interface ModalConfig {
    title: string;
    message?: string;
    type: 'alert' | 'confirm' | 'input' | 'password' | 'buttonless';
    placeholder?: string;
    monoContent?: string;
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
}

interface ModalContextInterface {
    showModal: (config: ModalConfig) => void;
    closeModal: () => void;
}

export const ModalContext = createContext<ModalContextInterface>({
    showModal: () => {},
    closeModal: () => {}
});