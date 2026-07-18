import { type ReactNode, useState, useCallback } from "react";
import { ModalContext, type ModalConfig } from "./ModalContext";

const ModalContextProvider = ({ children }: { children: ReactNode }) => {

    // State vars
    const [ modal, setModal ] = useState<ModalConfig | undefined>(undefined);

    // Modal functions
    const showModal = useCallback((config: ModalConfig) => setModal(config), []);
    const closeModal = useCallback(() => setModal(undefined), []);

    // Provider
    return <ModalContext.Provider value={{ showModal, modal, closeModal }}>
        { children }
    </ModalContext.Provider>
};

export default ModalContextProvider;