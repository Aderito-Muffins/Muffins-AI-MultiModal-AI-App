import React from "react";
import { Image } from "react-native";

export function Icon({ size = 200, ...props }) {
  return (
    <Image
      source={require("./muffinsaiallw.png")} // Substitua pelo caminho do seu arquivo PNG
      style={{
        width: size + 100,
        height: size + 20,
        resizeMode: "contain", // Ajusta a imagem dentro do espaço definido
      }}
      {...props}
    />
  );
}
