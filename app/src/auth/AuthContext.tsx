import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Definição do tipo para o contexto de autenticação
interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  checkLoginStatus: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  checkLoginStatus: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // Iniciar como 'null' para aguardar a verificação

  // Verificação de login na montagem do componente
  const checkLoginStatus = async () => {
    try {
      const storedLoginStatus = await AsyncStorage.getItem("isLoggedIn");
      setIsLoggedIn(storedLoginStatus === "true");
    } catch (error) {
      console.log("Erro ao verificar status de login", error);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkLoginStatus().catch((error) =>
      console.log("Erro ao verificar status de login", error)
    );
  }, []);

  const login = async () => {
    try {
      // Não permite login enquanto o estado não for verificado
      if (isLoggedIn === null) {
        console.log("A verificação do login ainda está em andamento...");
        return; // Aguarde até que o estado seja atualizado
      }

      if (isLoggedIn) {
        console.log("Já está logado");
        return;
      }

      console.log("Login realizado com sucesso");
      setIsLoggedIn(true);
      await AsyncStorage.setItem("isLoggedIn", "true");
    } catch (error) {
      console.log("Erro ao fazer login", error);
      setIsLoggedIn(false);
    }
  };

  const logout = async () => {
    try {
      // Não permite logout enquanto o estado não for verificado
      if (isLoggedIn === null) {
        console.log("A verificação do login ainda está em andamento...");
        return; // Aguarde até que o estado seja atualizado
      }

      if (!isLoggedIn) {
        console.log("Já está deslogado");
        return;
      }

      setIsLoggedIn(false);
      await AsyncStorage.setItem("isLoggedIn", "false");
    } catch (error) {
      console.log("Erro ao fazer logout", error);
    }
  };

  // Enquanto a verificação do status de login não for concluída, não renderiza nada
  if (isLoggedIn === null) {
    return null; // Ou pode retornar um loader aqui
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, login, logout, checkLoginStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
