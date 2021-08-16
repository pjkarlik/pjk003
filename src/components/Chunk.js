import React, { useContext, useRef } from "react";
import { Store } from "../Store";
import ClassStyles from "../styles/styles.less";

const Chunk = (props) => {
  const { id, children, offsetTop = 0, offsetLeft = 0, factor = 1 } = props;
  const { state } = useContext(Store);
  const { currentTop } = state;

  const ref = useRef();

  const height = ~~(document.documentElement.clientHeight,
  window.innerHeight || 0);
  const gp = height * id * 1;
  const dp = currentTop * factor - gp;

  return (
    <div
      className={ClassStyles.chunk}
      ref={ref}
      style={{ ...props.style, top: offsetTop + gp - dp, left: offsetLeft }}
    >
      {children}
    </div>
  );
};

Chunk.displayname = "Chunk";

export default Chunk;
