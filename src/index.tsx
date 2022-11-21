import React from "react";
import { render } from "react-dom";
import App from "./components/app.tsx";
import "./index.css";
import store from "./redux/store.tsx";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

 render(
  <BrowserRouter forceRefresh={false}>
    <Provider store={store}>
        <App />
    </Provider>
  </BrowserRouter>,
  document.getElementById("App")
);
