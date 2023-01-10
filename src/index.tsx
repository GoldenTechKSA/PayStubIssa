import React from "react";
import { render } from "react-dom";
import App from "./components/app";
import "./index.css";
import store from "./redux/store";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

 render(
  <BrowserRouter>
    <Provider store={store}>
        <App />
    </Provider>
  </BrowserRouter>,
  document.getElementById("App")
);
