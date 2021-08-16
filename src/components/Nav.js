import React, { useContext } from "react";
import { Store } from "../Store";
import ClassStyles from "../styles/styles.less";

const DotNav = (props) => {
  const { handleClick } = props;
  const { state } = useContext(Store);
  const { current } = state;
  const pages = [0, 1, 2, 3, 4, 5];

  const links = pages.map((index) => {
    return (
      <li key={`${index}`}>
        <a
          className={`${ClassStyles.dots} ${
            current === index ? ClassStyles.active : null
          }`}
          href="#"
          onClick={() => handleClick(index)}
        >
          &nbsp;
        </a>
      </li>
    );
  });

  return (
    <div className={ClassStyles.dotNav}>
      <ul className={ClassStyles.dotMenu}>{links}</ul>
    </div>
  );
};

export default DotNav;
