import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Providers } from "./app/providers";

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
);
