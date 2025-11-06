import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import App from "./App";
import "./index.css";
import "@/styles/richtext.css";


const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// (Varsa) prerender event’in kalsın
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      document.dispatchEvent(new Event("render-event"));
    }, 2000);
  });
}
