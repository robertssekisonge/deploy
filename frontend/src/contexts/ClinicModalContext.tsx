import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ClinicModalContextType {
  isAddRecordModalOpen: boolean;
  openAddRecordModal: () => void;
  closeAddRecordModal: () => void;
}

const ClinicModalContext = createContext<ClinicModalContextType | undefined>(undefined);

export const useClinicModal = () => {
  const context = useContext(ClinicModalContext);
  if (!context) {
    throw new Error('useClinicModal must be used within a ClinicModalProvider');
  }
  return context;
};

interface ClinicModalProviderProps {
  children: ReactNode;
}

export const ClinicModalProvider: React.FC<ClinicModalProviderProps> = ({ children }) => {
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);

  const openAddRecordModal = () => {
    setIsAddRecordModalOpen(true);
  };

  const closeAddRecordModal = () => {
    setIsAddRecordModalOpen(false);
  };

  return (
    <ClinicModalContext.Provider
      value={{
        isAddRecordModalOpen,
        openAddRecordModal,
        closeAddRecordModal,
      }}
    >
      {children}
    </ClinicModalContext.Provider>
  );
};

