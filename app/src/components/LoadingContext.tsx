import React, { createContext, useState, useContext, ReactNode } from "react";

// Defina o contexto
const LoadingContext = createContext<{
  loading: boolean;
  setLoading: (loading: boolean) => void;
}>({
  loading: false,
  setLoading: () => {},
});

// Provedor do contexto
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook customizado para acessar o contexto
export const useLoading = () => useContext(LoadingContext);
