import { createContext } from "react";
import type { FormField } from "../components/CreationForm";

interface BaseModalConfig {
    title: string;
    monoContent?: string;
    loadingSpinner?: boolean;
    message?: string;
    onCancel?: () => void;
}

interface AlertModalConfig extends BaseModalConfig {
    type: 'alert';
    onConfirm?: () => void;
}

interface ConfirmModalConfig extends BaseModalConfig {
    type: 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface InputModalConfig extends BaseModalConfig {
    type: 'input' | 'password';
    placeholder?: string;
    onConfirm?: (value: string) => void;
}

interface FileModalConfig extends BaseModalConfig {
    type: 'files';
    fileUploadConfig?: {
        filesLimit?: number;
        sizeLimit?: number;
        acceptedFileExtensions?: string[];
    };
    onConfirm?: (files: File[]) => void;
}

interface FormModalConfig extends BaseModalConfig {
    type: 'form';
    formFields: FormField[]
    onConfirm?: (result: string) => void;
}

interface ButtonlessModalConfig extends BaseModalConfig {
    type: 'buttonless';
}

export type ModalConfig =
    | AlertModalConfig
    | ConfirmModalConfig
    | InputModalConfig
    | FileModalConfig
    | FormModalConfig
    | ButtonlessModalConfig

interface ModalContextInterface {
    showModal: (config: ModalConfig) => void;
    closeModal: () => void;
}

export const ModalContext = createContext<ModalContextInterface>({
    showModal: () => {},
    closeModal: () => {}
});