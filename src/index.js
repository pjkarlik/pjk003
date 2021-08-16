import React from "react";
import ReactDOM from "react-dom";
import { StoreProvider } from "./Store";

import Parallax from "./components/App";
import AppStyles from "./styles/global.less";

import GLRender from "./gl2shader.js";
window.onload = () => {
  const demo = new GLRender();
  return demo;
};

const Main = () => {
  return (
    <StoreProvider>
      <Parallax className={AppStyles.parallax} />
    </StoreProvider>
  );
};

ReactDOM.render(<Main />, document.getElementById("react-mount"));
