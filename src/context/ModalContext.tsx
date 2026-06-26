import { createContext } from "react";
import type { FormField } from "../components/CreationForm";

export interface ModalConfig {
    title: string;
    message?: string;
    type: 'alert' | 'confirm' | 'input' | 'password' | 'buttonless' | 'form';
    formFields?: FormField[];
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