import Mouse, { getWidth, getHeight } from "./mouse";
import fragmentSource from "./frg-shade000";
import vertexSource from "./vrt-shader";
/**
 * Base WebGL2 /GLSL Shader BoilerPlate
 * pjkarlik@gmail.com
 * April 2020
 */

/* eslint no-console:0 */
export default class GLRender {
  constructor() {
    // Make Canvas and get WebGl2 Context //
    const width = (this.width = getWidth());
    const height = (this.height = getHeight());
    const canvas = (this.canvas = document.createElement("canvas"));
    canvas.id = "GLShaders";
    canvas.width = width;
    canvas.height = height;

    const elm = document.getElementById("react-mount");
    elm.appendChild(canvas);

    const mouse = (this.mouse = new Mouse());

    this.umouse = [0.0, 0.0, 0.0, 0.0];
    this.tmouse = [0.0, 0.0, 0.0, 0.0];

    // to work on iphone must be gl and not gl2 //
    const gl = (this.gl = canvas.getContext("webgl"));

    if (!gl) {
      console.warn("WebGL 2 is not available.");
      return;
    }
    // WebGl and WebGl2 Extension //
    this.gl.getExtension("OES_standard_derivatives");
    // this.gl.getExtension("EXT_shader_texture_lod");
    // this.gl.getExtension("OES_texture_float");
    this.gl.getExtension("WEBGL_color_buffer_float");
    // this.gl.getExtension("OES_texture_float_linear");

    this.gl.viewport(0, 0, canvas.width, canvas.height);

    window.addEventListener(
      "resize",
      () => {
        const width = getWidth();
        const height = getHeight();
        this.canvas.width = width;
        this.canvas.height = height;
        this.scrollarea = `${height * 10}px`;
        this.resolution = new Float32Array([width, height]);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.uniform2fv(
          this.gl.getUniformLocation(this.program, "resolution"),
          this.resolution
        );
        this.clearCanvas();
      },
      true
    );
    this.frame = 0;
    this.start = Date.now();
    this.init();
  }

  init = () => {
    this.createWebGL(vertexSource, fragmentSource);
    this.renderLoop();
  };

  createShader = (type, source) => {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!success) {
      console.log(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return false;
    }
    return shader;
  };

  createWebGL = (vertexSource, fragmentSource) => {
    // Setup Vertext/Fragment Shader functions
    this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    this.fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      fragmentSource
    );

    // Setup Program and Attach Shader functions
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, this.vertexShader);
    this.gl.attachShader(this.program, this.fragmentShader);
    this.gl.linkProgram(this.program);
    this.gl.useProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.warn(
        "Unable to initialize the shader program: " +
          this.gl.getProgramInfoLog(this.program)
      );
      return null;
    }

    // Create and Bind buffer //
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, -1, 1, 1]),
      this.gl.STATIC_DRAW
    );

    const vPosition = this.gl.getAttribLocation(this.program, "vPosition");

    this.gl.enableVertexAttribArray(vPosition);
    this.gl.vertexAttribPointer(
      vPosition,
      2, // size: 2 components per iteration
      this.gl.FLOAT, // type: the data is 32bit floats
      false, // normalize: don't normalize the data
      0, // stride: 0 = move forward size * sizeof(type) each iteration to get the next position
      0 // start at the beginning of the buffer
    );

    this.clearCanvas();
    this.importUniforms();
  };

  clearCanvas = () => {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  };

  importUniforms = () => {
    const width = getWidth();
    const height = getHeight();
    this.resolution = new Float32Array([width, height]);
    this.gl.uniform2fv(
      this.gl.getUniformLocation(this.program, "resolution"),
      this.resolution
    );

    this.ut = this.gl.getUniformLocation(this.program, "time");
    this.ms = this.gl.getUniformLocation(this.program, "mouse");
    this.tp = this.gl.getUniformLocation(this.program, "top");
  };

  updateUniforms = () => {
    this.gl.uniform1f(this.ut, (Date.now() - this.start) / 1000);
    const elm = document.getElementById("scrollarea");
    const scrolltop = elm.pageYOffset || elm.scrollTop;
    const scrollvalue = scrolltop;
    //console.log(scrollvalue);
    this.gl.uniform1f(this.tp, scrollvalue);

    const pointer = this.mouse.pointer();
    const factor = 0.15;
    this.umouse = [
      pointer.x,
      this.canvas.height - pointer.y,
      pointer.x - pointer.y,
    ];
    this.tmouse[0] =
      this.tmouse[0] - (this.tmouse[0] - this.umouse[0]) * factor;
    this.tmouse[1] =
      this.tmouse[1] - (this.tmouse[1] - this.umouse[1]) * factor;
    this.tmouse[2] = pointer.drag ? 1 : 0;
    this.gl.uniform4fv(this.ms, this.tmouse);

    this.gl.drawArrays(
      this.gl.TRIANGLE_FAN, // primitiveType
      0, // Offset
      4 // Count
    );
  };

  renderLoop = () => {
    this.updateUniforms();
    this.animation = window.requestAnimationFrame(this.renderLoop);
  };
}
