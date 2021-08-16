import React from "react";
import ClassStyles from "../styles/styles.less";

const Block = (props) => {
  const { id, children, top } = props;
  return (
    <article className={ClassStyles.block}>
      <div className={ClassStyles.blockwrapper}>{children}</div>
    </article>
  );
};

Block.displayname = "Block";

export default Block;
