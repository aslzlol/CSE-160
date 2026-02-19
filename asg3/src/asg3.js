// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform float u_PointSize;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else {
      gl_FragColor = vec4(1.0, .2, .2, 1.0);
    }
  }`;

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_PointSize;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let camera;
let projectionMatrix;
let viewMatrix;

// Animation globals
let g_globalAngle = 0;
let g_globalAngleY = 0;
let g_headAngle = 0;
let g_tailAngle = 0;
let g_frontLeftLegAngle = 0;
let g_frontRightLegAngle = 0;
let g_backLeftLegAngle = 0;
let g_backRightLegAngle = 0;
let g_frontLeftLowerLegAngle = 0;
let g_frontLeftFootAngle = 0;
let g_frontRightLowerLegAngle = 0;
let g_frontRightFootAngle = 0;
let g_backLeftLowerLegAngle = 0;
let g_backLeftFootAngle = 0;
let g_backRightLowerLegAngle = 0;
let g_backRightFootAngle = 0;

let g_bodyBob = 0;
let g_bodySway = 0;
let g_tailMidAngle = 0;
let g_tailTipAngle = 0;

let g_animation = true;
let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;

// Add these global variables after the other globals
let g_isDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true}) ||
       canvas.getContext("webgl2", {preserveDrawingBuffer: true}) ||
       canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return;
  }

  // Get storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_PointSize
  // u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
  // if (!u_PointSize) {
  //   console.log('Failed to get the storage location of u_PointSize');
  //   return;
  // }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  

  // Set initial identity matrix
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
  
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }

  image.onload = function() { sendImageToTEXTURE0(image);};
  image.src = 'sky.svg';
  
  var image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image object');
    return false;
  }

  image1.onload = function() { sendImageToTEXTURE1(image1);};
  image1.src = 'wall.jpg';

  var image2 = new Image();
  if (!image2) {
    console.log('Failed to create the image object');
    return false;
  }
  image2.onload = function() { sendImageToTEXTURE2(image2);};
  image2.src = 'ground.png';

  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler0, 0);
}

function sendImageToTEXTURE1(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler1, 1);
}

function sendImageToTEXTURE2(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler2, 2);

  console.log('finished loadTexture');
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=10.0;
let g_selectedType=POINT;
let g_selectedSegment=10;

// 32x32 world map (height values 0-4)
let worldMap = [
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,4],
  [4,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,3,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,3,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,3,3,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,4],
  [4,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,4],
  [4,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,2,2,2,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,2,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]
];
// 32x32 maze
// let worldMap = [
//   [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
//   [4,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
//   [4,4,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4],
//   [4,4,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4],
//   [4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,0,0,4],
//   [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4,4,4,0,0,4],
//   [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4,0,0,0,0,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4],
//   [4,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
//   [4,4,4,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,4],
//   [4,4,4,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
//   [4,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
//   [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,4],
//   [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
//   [4,0,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
//   [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
//   [4,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
//   [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]
// ];

function addActionsForHtmlUI(){
  // Button Events (Shape Type)
  document.getElementById('animationOn').onclick = function() { g_animation = true; };
  document.getElementById('animationOff').onclick = function() { g_animation = false; };

  // Angle Sliders
  document.getElementById('angleSlide').addEventListener('input', function() {
    g_globalAngle = parseFloat(this.value);
    document.getElementById('angleValue').innerHTML = this.value;
    renderScene();
  });
  
  document.getElementById('headSlide').addEventListener('input', function() {
    g_headAngle = parseFloat(this.value);
    document.getElementById('headValue').innerHTML = this.value;
    renderScene();
  });
  
  document.getElementById('tailSlide').addEventListener('input', function() {
    g_tailAngle = parseFloat(this.value);
    document.getElementById('tailValue').innerHTML = this.value;
    renderScene();
  });

  document.getElementById('frontLeftLegSlide').addEventListener('input', function() {
    g_frontLeftLegAngle = parseFloat(this.value);
    document.getElementById('frontLeftLegValue').innerHTML = this.value;
    renderScene();
  });

  document.getElementById('frontRightLegSlide').addEventListener('input', function() {
    g_frontRightLegAngle = parseFloat(this.value);
    document.getElementById('frontRightLegValue').innerHTML = this.value;
    renderScene();
  });

  document.getElementById('backLeftLegSlide').addEventListener('input', function() {
    g_backLeftLegAngle = parseFloat(this.value);
    document.getElementById('backLeftLegValue').innerHTML = this.value;
    renderScene();
  });

  document.getElementById('backRightLegSlide').addEventListener('input', function() {
    g_backRightLegAngle = parseFloat(this.value);
    document.getElementById('backRightLegValue').innerHTML = this.value;
    renderScene();
  });

  document.getElementById('frontLeftLowerLegSlide').addEventListener('input', function() {
    g_frontLeftLowerLegAngle = parseFloat(this.value);
    document.getElementById('frontLeftLowerLegValue').innerHTML = this.value;
    renderScene();
  });

  document.getElementById('frontLeftFootSlide').addEventListener('input', function() {
    g_frontLeftFootAngle = parseFloat(this.value);
    document.getElementById('frontLeftFootValue').innerHTML = this.value;
    renderScene();
  });
  
  canvas.addEventListener('mousedown', function(ev) {
    // if (ev.button === 0) { // Left mouse button
    //   mouseCoord = convertCoordinateEventToGL(ev);
    // }
    if (!ev.shiftKey) {
      g_isDragging = true;
      mouseCoord = convertCoordinateEventToGL(ev);
    }
  });
  
  canvas.addEventListener('mousemove', function(ev) {
    if (g_isDragging) {
      mouseMove(ev);
    }
  });
  
  canvas.addEventListener('mouseup', function(ev) {
    g_isDragging = false;
  });
  
  canvas.addEventListener('mouseleave', function(ev) {
    g_isDragging = false;
  });
}

let g_keysPressed = {
  'w': false,
  'a': false,
  's': false,
  'd': false,
  'q': false,
  'e': false,
  'r': false,
};

function keydown(ev) {
  g_keysPressed[ev.key.toLowerCase()] = true;
  if (g_keysPressed['r']) camera.Block();
  renderScene();
}

function keyup(ev) {
  g_keysPressed[ev.key.toLowerCase()] = false;
  renderScene();
}

let mouseCoord = [0, 0];

function mouseMove(ev) {
  let [x, y] = convertCoordinateEventToGL(ev);

  if (mouseCoord[0] > x) {
    camera.panLeft(Math.abs(mouseCoord[0] - x) * 100);
  } else if (mouseCoord[0] < x) {
    camera.panRight(Math.abs(mouseCoord[0] - x) * 100);
  }

  if (mouseCoord[1] > y) {
    camera.panDown(Math.abs(mouseCoord[1] - y) * 100);
  } else if (mouseCoord[1] < y) {
    camera.panUp(Math.abs(mouseCoord[1] - y) * 100);
  }
  mouseCoord = [x, y];
}

function main() {
  // Set up canvas and get gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  camera = new Camera();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Keyboard event listener
  document.onkeydown = keydown;
  document.onkeyup = keyup;
  //document.onmousemove = mouseMove;

  // Load texture from filesystem
  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Render the scene
  renderScene();

  // Start animation loop
  requestAnimationFrame(tick);
}


//var g_shapesList = [];

function tick() {
  // Update animation
  g_seconds = performance.now() / 1000.0 - g_startTime;
  
  updateAnimationAngles();

  if (g_keysPressed['w']) camera.moveForward(0.05);
  if (g_keysPressed['s']) camera.moveBackwards(0.05);
  if (g_keysPressed['a']) camera.moveLeft(0.05);
  if (g_keysPressed['d']) camera.moveRight(0.05);
  if (g_keysPressed['q']) camera.panLeft(2.5);
  if (g_keysPressed['e']) camera.panRight(2.5);
  
  // Render scene
  renderScene();
  
  // Request next frame
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_animation) {
    // Animate legs - walking motion
    g_frontLeftLegAngle = 30 * Math.sin(g_seconds * 2);
    g_frontRightLegAngle = 30 * Math.sin(g_seconds * 2 + Math.PI);
    g_backLeftLegAngle = 30 * Math.sin(g_seconds * 2 + Math.PI);
    g_backRightLegAngle = 30 * Math.sin(g_seconds * 2);

    // Animate lower legs
    g_frontLeftLowerLegAngle = 15 * Math.sin(g_seconds * 2);
    g_frontRightLowerLegAngle = 15 * Math.sin(g_seconds * 2 + Math.PI);
    g_backLeftLowerLegAngle = 15 * Math.sin(g_seconds * 2 + Math.PI);
    g_backRightLowerLegAngle = 15 * Math.sin(g_seconds * 2);

    // Animate feet
    g_frontLeftFootAngle = 10 * Math.sin(g_seconds * 2);
    g_frontRightFootAngle = 10 * Math.sin(g_seconds * 2 + Math.PI);
    g_backLeftFootAngle = 10 * Math.sin(g_seconds * 2 + Math.PI);
    g_backRightFootAngle = 10 * Math.sin(g_seconds * 2);

    // Animate head
    g_headAngle = 10 * Math.sin(g_seconds * 1.5);

    // Animate tail
    g_tailAngle = 10 * Math.sin(g_seconds * 3);
    g_tailMidAngle = 5 * Math.sin(g_seconds * 3 + Math.PI / 2);
    g_tailTipAngle = 10 * Math.sin(g_seconds * 3 + Math.PI / 2);

    // Animate body bob/sway
    g_bodyBob = 0.02 * Math.sin(g_seconds * 2);
    g_bodySway = 0.02 * Math.sin(g_seconds * 2 + Math.PI / 2);
  }
}

// function keydown(ev) {
//     if (ev.key === 'w' || ev.key === 'W') {
//       camera.moveForward(0.1);
//     } if (ev.key === 's' || ev.key === 'S') {
//       camera.moveBackwards(0.1);
//     } if (ev.key === 'a' || ev.key === 'A') {
//       camera.moveLeft(0.1);
//     } if (ev.key === 'd' || ev.key === 'D') {
//       camera.moveRight(0.1);
//     } if (ev.key === 'q' || ev.key === 'Q') {
//       camera.panLeft(5);
//     } if (ev.key === 'e' || ev.key === 'E') {
//       camera.panRight(5);
//     }
//     renderScene();
// }

// function initProjectionMatrix() {
//   var projectionMatrix = new Matrix4(); 
//   projectionMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
//   gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
// }

// function updateViewMatrix() {
//   viewMatrix.setLookAt(camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2],
//                        camera.at.elements[0], camera.at.elements[1], camera.at.elements[2],
//                        camera.up.elements[0], camera.up.elements[1], camera.up.elements[2]);
// }

// function initViewMatrix() {
//   viewMatrix = new Matrix4();
//   updateViewMatrix();
// }

function renderScene() {
  // Clear canvas
  var startTime = performance.now();

  // Set global rotation matrix
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleY, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  if (camera) {
    gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  }
  
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw sky and ground
  drawSky();
  drawGround();
  drawMap();
  
  // drawWorld();


  // Draw Lion

  // Body
  var bodyMatrix2 = new Cube();
  bodyMatrix2.textureNum = -2;
  bodyMatrix2.matrix.translate(-0.15, -0.05 + g_bodyBob, 0.0 + g_bodySway);
  bodyMatrix2.matrix.scale(0.4, 0.2, 0.25);
  bodyMatrix2.color = [0.82, 0.62, 0.42, 1.0];
  bodyMatrix2.render();

  // Head
  var headMatrix2 = new Cube();
  headMatrix2.textureNum = -2;
  headMatrix2.matrix.translate(0.25, 0.05 + g_bodyBob, 0.05 + g_bodySway);
  headMatrix2.matrix.rotate(g_headAngle, 0, 1, 0);
  var headCoord = new Matrix4(headMatrix2.matrix);
  headMatrix2.matrix.scale(0.15, 0.15, 0.15);
  headMatrix2.color = [0.88, 0.68, 0.48, 1.0];
  headMatrix2.render();

  // Left eye
  var leftEyeMatrix2 = new Cube();
  leftEyeMatrix2.textureNum = -1;
  leftEyeMatrix2.matrix.set(headCoord);
  leftEyeMatrix2.matrix.translate(0.12, 0.08, 0.02);
  leftEyeMatrix2.matrix.scale(0.04, 0.04, 0.03);
  leftEyeMatrix2.color = [0.2, 0.2, 0.2, 1.0];
  leftEyeMatrix2.render();

  // Right eye
  var rightEyeMatrix2 = new Cube();
  rightEyeMatrix2.textureNum = -1;
  rightEyeMatrix2.matrix.set(headCoord);
  rightEyeMatrix2.matrix.translate(0.12, 0.08, 0.1);
  rightEyeMatrix2.matrix.scale(0.04, 0.04, 0.03);
  rightEyeMatrix2.color = [0.2, 0.2, 0.2, 1.0];
  rightEyeMatrix2.render();

  // Mane
  var maneMatrix2 = new Cube();
  maneMatrix2.textureNum = -2;
  maneMatrix2.matrix.set(headCoord);
  maneMatrix2.matrix.translate(-0.12, -0.03, -0.08);
  maneMatrix2.matrix.scale(0.2, 0.275, 0.30);
  maneMatrix2.color = [0.4, 0.25, 0.1, 1.0];
  maneMatrix2.render();

  // Snout
  var snoutMatrix2 = new Cube();
  snoutMatrix2.textureNum = -2;
  snoutMatrix2.matrix.set(headCoord);
  snoutMatrix2.matrix.translate(0.07, 0.0, 0.04);
  snoutMatrix2.matrix.scale(0.12, 0.08, 0.08);
  snoutMatrix2.color = [0.75, 0.55, 0.35, 1.0];
  snoutMatrix2.render();

  // Nose
  var noseMatrix2 = new Cube();
  noseMatrix2.textureNum = -2;
  noseMatrix2.matrix.set(headCoord);
  noseMatrix2.matrix.translate(0.17, 0.03, 0.06);
  noseMatrix2.matrix.scale(0.04, 0.04, 0.04);
  noseMatrix2.color = [0.2, 0.1, 0.05, 1.0];
  noseMatrix2.render();

  // Left ear
  var leftEarMatrix2 = new Cube();
  leftEarMatrix2.textureNum = -2;
  leftEarMatrix2.matrix.set(headCoord);
  leftEarMatrix2.matrix.translate(-0.02, 0.13, -0.1);
  leftEarMatrix2.matrix.scale(0.06, 0.08, 0.04);
  leftEarMatrix2.color = [0.80, 0.60, 0.40, 1.0];
  leftEarMatrix2.render();

  // Right ear
  var rightEarMatrix2 = new Cube();
  rightEarMatrix2.textureNum = -2;
  rightEarMatrix2.matrix.set(headCoord);
  rightEarMatrix2.matrix.translate(-0.02, 0.13, 0.195);
  rightEarMatrix2.matrix.scale(0.06, 0.08, 0.04);
  rightEarMatrix2.color = [0.80, 0.60, 0.40, 1.0];
  rightEarMatrix2.render();

  // Tail base
  var tailBaseMatrix2 = new Cube();
  tailBaseMatrix2.textureNum = -2;
  tailBaseMatrix2.matrix.translate(-0.3, 0.0 + g_bodyBob, 0.12 + g_bodySway);
  tailBaseMatrix2.matrix.rotate(g_tailAngle, 0, 0, 1);
  var tailCoord = new Matrix4(tailBaseMatrix2.matrix);
  tailBaseMatrix2.matrix.scale(0.15, 0.05, 0.05);
  tailBaseMatrix2.color = [0.78, 0.58, 0.38, 1.0];
  tailBaseMatrix2.render();

  // Tail mid segment
  var tailMid2 = new Cube();
  tailMid2.textureNum = -2;
  tailMid2.matrix.set(tailCoord);
  tailMid2.matrix.translate(-0.1, 0, 0);
  tailMid2.matrix.rotate(g_tailMidAngle, 0, 0, 1);
  tailMid2.matrix.scale(0.10, 0.04, 0.04);
  tailMid2.color = [0.76, 0.56, 0.36, 1.0];
  tailMid2.render();

  // Tail tuft
  var tailTuft2 = new Cube();
  tailTuft2.textureNum = -1;
  tailTuft2.matrix.set(tailCoord);
  tailTuft2.matrix.translate(-0.2, -0.03, -0.05);
  tailTuft2.matrix.rotate(g_tailTipAngle, 0, 0, 1);
  tailTuft2.matrix.scale(0.1, 0.12, 0.12);
  tailTuft2.color = [0.42, 0.25, 0.10, 1.0];
  tailTuft2.render();

  // Front Left Leg
  var frontLeftLegMatrix2 = new Cube();
  frontLeftLegMatrix2.textureNum = -2;
  frontLeftLegMatrix2.matrix.translate(0.15, 0.0 + g_bodyBob, 0.0 + g_bodySway);
  frontLeftLegMatrix2.matrix.rotate(g_frontLeftLegAngle, 0, 0, 1);
  var frontLeftLegCoord = new Matrix4(frontLeftLegMatrix2.matrix);
  frontLeftLegMatrix2.matrix.scale(0.06, 0.12, 0.06);
  frontLeftLegMatrix2.matrix.translate(0.0, -1.0, 0.0);
  frontLeftLegMatrix2.color = [0.76, 0.56, 0.36, 1.0];
  frontLeftLegMatrix2.render();

  // Front Left Lower Leg
  var frontLeftLowerLegMatrix2 = new Cube();
  frontLeftLowerLegMatrix2.textureNum = -2;
  frontLeftLowerLegMatrix2.matrix.set(frontLeftLegCoord);
  frontLeftLowerLegMatrix2.matrix.translate(0.0, -0.11, 0.0); // adjusted
  frontLeftLowerLegMatrix2.matrix.rotate(g_frontLeftLowerLegAngle, 0, 0, 1);
  var frontLeftLowerLegCoord = new Matrix4(frontLeftLowerLegMatrix2.matrix);
  frontLeftLowerLegMatrix2.matrix.scale(0.055, 0.09, 0.055); // shorter
  frontLeftLowerLegMatrix2.matrix.translate(0.0, -1.0, 0.0);
  frontLeftLowerLegMatrix2.color = [0.72, 0.52, 0.32, 1.0];
  frontLeftLowerLegMatrix2.render();

  // Front Left Foot
  var frontLeftFootMatrix2 = new Cube();
  frontLeftFootMatrix2.textureNum = -2;
  frontLeftFootMatrix2.matrix.set(frontLeftLowerLegCoord);
  frontLeftFootMatrix2.matrix.translate(0, -0.11, -0.01);
  frontLeftFootMatrix2.matrix.rotate(g_frontLeftFootAngle, 0, 0, 1);
  frontLeftFootMatrix2.matrix.scale(0.1, 0.03, 0.08);
  frontLeftFootMatrix2.color = [0.68, 0.48, 0.28, 1.0];
  frontLeftFootMatrix2.render();

  // Front Right Leg
  var frontRightLegMatrix2 = new Cube();
  frontRightLegMatrix2.textureNum = -2;
  frontRightLegMatrix2.matrix.translate(0.15, 0.0 + g_bodyBob, 0.18 + g_bodySway);
  frontRightLegMatrix2.matrix.rotate(g_frontRightLegAngle, 0, 0, 1);
  var frontRightLegCoord = new Matrix4(frontRightLegMatrix2.matrix);
  frontRightLegMatrix2.matrix.scale(0.06, 0.12, 0.06); // shorter
  frontRightLegMatrix2.matrix.translate(0.0, -1.0, 0.0);
  frontRightLegMatrix2.color = [0.76, 0.56, 0.36, 1.0];
  frontRightLegMatrix2.render();

  // Front Right Lower Leg
  var frontRightLowerLegMatrix2 = new Cube();
  frontRightLowerLegMatrix2.textureNum = -2;
  frontRightLowerLegMatrix2.matrix.set(frontRightLegCoord);
  frontRightLowerLegMatrix2.matrix.translate(0.0, -0.11, 0.0); // adjusted
  frontRightLowerLegMatrix2.matrix.rotate(g_frontRightLowerLegAngle, 0, 0, 1);
  var frontRightLowerLegCoord = new Matrix4(frontRightLowerLegMatrix2.matrix);
  frontRightLowerLegMatrix2.matrix.scale(0.055, 0.09, 0.055); // shorter
  frontRightLowerLegMatrix2.matrix.translate(0.0, -1.0, 0.0);
  frontRightLowerLegMatrix2.color = [0.72, 0.52, 0.32, 1.0];
  frontRightLowerLegMatrix2.render();

  // Front Right Foot
  var frontRightFootMatrix2 = new Cube();
  frontRightFootMatrix2.textureNum = -2;
  frontRightFootMatrix2.matrix.set(frontRightLowerLegCoord);
  frontRightFootMatrix2.matrix.translate(0, -0.11, -0.01);
  frontRightFootMatrix2.matrix.rotate(g_frontRightFootAngle, 0, 0, 1);
  frontRightFootMatrix2.matrix.scale(0.1, 0.03, 0.08);
  frontRightFootMatrix2.color = [0.68, 0.48, 0.28, 1.0];
  frontRightFootMatrix2.render();

  // Back Left Leg
  var backLeftLegMatrix2 = new Cube();
  backLeftLegMatrix2.textureNum = -2;
  backLeftLegMatrix2.matrix.translate(-0.125, 0.0 + g_bodyBob, 0.0 + g_bodySway);
  backLeftLegMatrix2.matrix.rotate(g_backLeftLegAngle, 0, 0, 1);
  var backLeftLegCoord = new Matrix4(backLeftLegMatrix2.matrix);
  backLeftLegMatrix2.matrix.scale(0.06, 0.12, 0.06); // shorter
  backLeftLegMatrix2.matrix.translate(0.0, -1.0, 0.0);
  backLeftLegMatrix2.color = [0.76, 0.56, 0.36, 1.0];
  backLeftLegMatrix2.render();

  // Back Left Lower Leg
  var backLeftLowerLegMatrix2 = new Cube();
  backLeftLowerLegMatrix2.textureNum = -2;
  backLeftLowerLegMatrix2.matrix.set(backLeftLegCoord);
  backLeftLowerLegMatrix2.matrix.translate(0.0, -0.11, 0.0); // adjusted
  backLeftLowerLegMatrix2.matrix.rotate(g_backLeftLowerLegAngle, 0, 0, 1);
  var backLeftLowerLegCoord = new Matrix4(backLeftLowerLegMatrix2.matrix);
  backLeftLowerLegMatrix2.matrix.scale(0.055, 0.09, 0.055); // shorter
  backLeftLowerLegMatrix2.matrix.translate(0.0, -1.0, 0.0);
  backLeftLowerLegMatrix2.color = [0.72, 0.52, 0.32, 1.0];
  backLeftLowerLegMatrix2.render();

  // Back Left Foot
  var backLeftFootMatrix2 = new Cube();
  backLeftFootMatrix2.textureNum = -2;
  backLeftFootMatrix2.matrix.set(backLeftLowerLegCoord); 
  backLeftFootMatrix2.matrix.translate(0, -0.11, -0.01);
  backLeftFootMatrix2.matrix.rotate(g_backLeftFootAngle, 0, 0, 1);
  backLeftFootMatrix2.matrix.scale(0.1, 0.03, 0.08);
  backLeftFootMatrix2.color = [0.68, 0.48, 0.28, 1.0];
  backLeftFootMatrix2.render();

  // Back Right Leg
  var backRightLegMatrix2 = new Cube();
  backRightLegMatrix2.textureNum = -2;
  backRightLegMatrix2.matrix.translate(-0.125, 0.0 + g_bodyBob, 0.18 + g_bodySway);
  backRightLegMatrix2.matrix.rotate(g_backRightLegAngle, 0, 0, 1);
  var backRightLegCoord = new Matrix4(backRightLegMatrix2.matrix);
  backRightLegMatrix2.matrix.scale(0.06, 0.12, 0.06); // shorter
  backRightLegMatrix2.matrix.translate(0.0, -1.0, 0.0);
  backRightLegMatrix2.color = [0.76, 0.56, 0.36, 1.0];
  backRightLegMatrix2.render();

  // Back Right Lower Leg
  var backRightLowerLegMatrix2 = new Cube();
  backRightLowerLegMatrix2.textureNum = -2;
  backRightLowerLegMatrix2.matrix.set(backRightLegCoord);
  backRightLowerLegMatrix2.matrix.translate(0.0, -0.11, 0.0); // adjusted
  backRightLowerLegMatrix2.matrix.rotate(g_backRightLowerLegAngle, 0, 0, 1);
  var backRightLowerLegCoord = new Matrix4(backRightLowerLegMatrix2.matrix);
  backRightLowerLegMatrix2.matrix.scale(0.055, 0.09, 0.055); // shorter
  backRightLowerLegMatrix2.matrix.translate(0.0, -1.0, 0.0);
  backRightLowerLegMatrix2.color = [0.72, 0.52, 0.32, 1.0];
  backRightLowerLegMatrix2.render();
  
  // Back Right Foot
  var backRightFootMatrix2 = new Cube();
  backRightFootMatrix2.textureNum = -2;
  backRightFootMatrix2.matrix.set(backRightLowerLegCoord);
  backRightFootMatrix2.matrix.translate(0, -0.11, -0.01);
  backRightFootMatrix2.matrix.rotate(g_backRightFootAngle, 0, 0, 1);
  backRightFootMatrix2.matrix.scale(0.1, 0.03, 0.08);
  backRightFootMatrix2.color = [0.68, 0.48, 0.28, 1.0];
  backRightFootMatrix2.render();

  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function drawGround() {
  var groundMatrix = new Cube();
  groundMatrix.color = [0.3, 0.8, 0.3, 1.0];
  groundMatrix.textureNum = -2;
  groundMatrix.matrix.scale(90, -1, 80);
  groundMatrix.matrix.translate(-0.6, 0.2, -0.5);
  groundMatrix.renderfaster();
}

function drawSky() {
  var skyMatrix = new Cube();
  skyMatrix.textureNum = 0;
  skyMatrix.matrix.translate(-5, -.5, -5);
  skyMatrix.matrix.scale(50, 50, 50);
  skyMatrix.color = [.5, 0.8, .9, 1.0];
  skyMatrix.renderfaster();
}

function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      const height = worldMap[z][x];
        var walls = new Cube();
        walls.color = [0.5, 0.5, 0.5, 1.0];
        walls.textureNum = 1;
        walls.matrix.translate(x-5, -0.25, z-4);
        walls.matrix.scale(1, height, 1);
        walls.renderfaster();
    }
  }
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];   // The array to store the size of a point

function click(ev) {

  renderAllShapes();
}

function convertCoordinateEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function renderAllShapes() {
  
  camera.updateViewMatrix();
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);

  camera.updateProjectionMatrix();
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  var globalRotMat = new Matrix4().rotate(0, 0, 1, 0).rotate(0, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  renderScene();
}