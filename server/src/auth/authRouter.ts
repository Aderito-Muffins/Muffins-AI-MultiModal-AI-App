import express from "express";
import { compare } from "bcrypt-ts";
import jwt from "jsonwebtoken"; // Para criação de JWT
import { getUser } from "../lib/db/queries"; // Para consultar o usuário na base de dados
import ms from "ms";
import { AnyColumn } from "drizzle-orm";
const authRouter = express.Router();

// Função para gerar token JWT
const generateToken = (user: any) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não está definido nas variáveis de ambiente.");
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined");
  }

  // Verifique se JWT_EXPIRES é definido e é um número válido
  const jwtExpires = process.env.JWT_EXPIRES;
  if (!jwtExpires) {
    throw new Error("jwtExpires is not defined");
  }

  const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: Number(jwtExpires), // Certificando-se de que o valor é numérico
  });

  return token;
};

// Endpoint de login
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await getUser(email);
    if (!users || users.length === 0) {
      return res
        .status(404)
        .json({ code: 0, message: "Usuário não encontrado", data: "" });
    }

    const user = users[0];
    if (!user.password) {
      return res.status(400).json({
        code: 0,
        message: "Senha ausente no registro do usuário",
        data: "",
      });
    }

    const passwordsMatch = await compare(password, user.password);
    if (!passwordsMatch) {
      return res
        .status(400)
        .json({ code: 0, message: "Senha incorreta", data: "" });
    }

    const token = generateToken(user); // Gerando o JWT

    return res.status(200).json({
      code: 1,
      message: "Login bem-sucedido",
      data: { token, user },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ code: 0, message: "Erro no servidor", data: error.message });
  }
});

// Endpoint de logout
authRouter.post("/logout", (req, res) => {
  // Para o logout, apenas podemos remover o token do lado do cliente
  res.clearCookie("auth-token"); // Se estiver usando cookies
  return res
    .status(200)
    .json({ code: 1, message: "Logout bem-sucedido", data: "" });
});

authRouter.post("/check", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Exemplo: "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      code: 0,
      message: "Token não fornecido",
      data: { isValid: false, reason: "Token ausente" },
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET não está definido");
    }

    const decoded = jwt.verify(token, jwtSecret); // Verifica o token
    return res.status(200).json({
      code: 1,
      message: "Token válido",
      data: { isValid: true, decoded }, // Inclui `isValid` e os dados decodificados
    });
  } catch (error: any) {
    return res.status(401).json({
      code: 0,
      message: "Token inválido ou expirado",
      data: { isValid: false, reason: error.message }, // Inclui `isValid` e a razão do erro
    });
  }
});

export default authRouter;
