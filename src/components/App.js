import React, { useEffect, useRef, useContext } from "react";
import Block from "./Block";
import Chunk from "./Chunk";
import Nav from "./Nav";
import ClassStyles from "../styles/styles.less";
import { Store } from "../Store";

const App = () => {
  const scrollArea = useRef();
  const scrollinner = useRef();
  const { state, dispatch } = useContext(Store);
  const { currentTop, pages } = state;

  const handleClick = (num) => {
    const newHeight = num * window.innerHeight;
    console.log(newHeight);
    scrollinner.current.scrollTo(0, newHeight);
    dispatch({ type: "UPDATE_CURRENT", current: num });
  };

  const onScroll = (e) =>
    dispatch({ type: "UPDATE_TOP", top: e.target.scrollTop });
  useEffect(() => void onScroll({ target: scrollArea.current }), []);
  useEffect(() => {
    let pick = 0;
    for (let i = 0; i < pages; i++) {
      if (currentTop > i * window.innerHeight - 100) pick = i;
    }
    dispatch({ type: "UPDATE_CURRENT", current: pick });
  }, [currentTop]);
  return (
    <div className={ClassStyles.wrapper} ref={scrollArea} onScroll={onScroll}>
      <Nav handleClick={handleClick} />
      <div className={ClassStyles.scrollarea} id="scrollarea" ref={scrollinner}>
        <div className={ClassStyles.maskblock}>
          {/* content sections */}
          <Block></Block>
          <Block><h2 className={ClassStyles.sectionheader}>WebGL Fragment Shader</h2></Block>
          <Block>&nbsp;</Block>
          <Block><h2 className={ClassStyles.sectionheader}>keep scrolling</h2></Block>
          <Block>&nbsp;</Block>
          <Block>
            <h2 className={ClassStyles.sectionheader}>contact</h2>
          </Block>

          {/* parallax sections */}
          <Chunk id={0} offsetTop={window.innerHeight / 6.2}>
            <h1 className={ClassStyles.nameheader}>paul j karlik</h1>
          </Chunk>
          <Chunk id={0} offsetTop={window.innerHeight / 6.25} factor={-2}>
            <h3 className={ClassStyles.namesubheader}>
              creative technologist | development &amp; architecture
            </h3>
          </Chunk>

          <Chunk id={1}>&nbsp;</Chunk>
          <Chunk id={2}>&nbsp;</Chunk>
          <Chunk id={3}>&nbsp;</Chunk>
          <Chunk id={4}>&nbsp;</Chunk>
          <Chunk id={5}>
            <p>
              please feel free to check out some of my online portfolios,
              experiments, work and examples. below are links to all things me
              on the web.
              <br />
              <br />
              <ul>
                <li>
                  <a href="https://codepen.io/pjkarlik">codepen.io</a>
                </li>
                <li>
                  <a href="https://github.com/pjkarlik">github.com</a>
                </li>
                <li>
                  <a href="https://www.shadertoy.com/user/pjkarlik">
                    shadertoy.com
                  </a>
                </li>
                <li>
                  <a href="https://soundcloud.com/pjkarlik">soundcloud.com</a>
                </li>
              </ul>
            </p>
          </Chunk>
        </div>
      </div>
    </div>
  );
};

export default App;
