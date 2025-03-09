import express from "express";
import cors from "cors"; // Importe o pacote cors
import chatRouter from "./chat/chatRouter";
import imagesRouter from "./images/imagesRouter";
import fileRouter from "./files/fileRouter";
import authRouter from "./auth/authRouter";
import bodyParser from "body-parser";
import "dotenv/config";

const app = express();

// Configuração do CORS
app.use(
  cors({
    origin: "http://localhost:8081", // Permite apenas solicitações deste domínio
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
    allowedHeaders: ["Content-Type", "Authorization"], // Cabeçalhos permitidos
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/chat", chatRouter);
app.use("/images", imagesRouter);
app.use("/files", fileRouter);
app.use("/auth", authRouter);

app.listen(3050, () => {
  console.log("Server started on port 3050");
});
