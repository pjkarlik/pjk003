import React, { createContext, useReducer } from "react";

const width = ~~(document.documentElement.clientWidth, window.innerWidth || 0);
const height = ~~(document.documentElement.clientHeight,
window.innerHeight || 0);

const initialState = {
  width,
  height,
  pages: 6,
  sections: 6,
  pageHeight: height,
  current: 0,
  currentTop: 0,
};

export const Store = createContext(initialState);

const updateTop = (state, top) => {
  return { ...state, currentTop: top };
};

const updateViewport = (state) => {
  const width = ~~(document.documentElement.clientWidth,
  window.innerWidth || 0);
  const height = ~~(document.documentElement.clientHeight,
  window.innerHeight || 0);
  const config = {
    width,
    height,
  };
  console.log(config);
  return { ...state, ...config };
};

const updateCurrent = (state, current) => {
  return { ...state, current };
};
/**
 * Reducers for state/actions
 */

const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_TOP":
      return updateTop(state, action.top);
    case "UPDATE_CURRENT":
      return updateCurrent(state, action.current);
    case "UPDATE_VIEWPORT":
      return updateViewport(state, action.config);
    default:
      return state;
  }
};

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <Store.Provider value={{ state, dispatch }}>{children}</Store.Provider>
  );
};
