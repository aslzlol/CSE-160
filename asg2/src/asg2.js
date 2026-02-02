// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_PointSize;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    gl_PointSize = u_PointSize;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_PointSize;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

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

let g_animation = false;
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
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
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

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_PointSize
  u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
  if (!u_PointSize) {
    console.log('Failed to get the storage location of u_PointSize');
    return;
  }

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

  // Set initial identity matrix
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize=10.0;
let g_selectedType=POINT;
let g_selectedSegment=10;

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
  
  // Mouse controls for rotation
  canvas.addEventListener('mousedown', function(ev) {
    if (!ev.shiftKey) {
      g_isDragging = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  });
  
  canvas.addEventListener('mousemove', function(ev) {
    if (g_isDragging) {
      let deltaX = ev.clientX - g_lastMouseX;
      let deltaY = ev.clientY - g_lastMouseY;
      
      // Map mouse movement to rotation
      g_globalAngle += deltaX * 0.5;
      g_globalAngleY += deltaY * 0.5;
      
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
      
      // Update slider to match
      document.getElementById('angleSlide').value = g_globalAngle;
      document.getElementById('angleValue').innerHTML = Math.floor(g_globalAngle);
    }
  });
  
  canvas.addEventListener('mouseup', function(ev) {
    g_isDragging = false;
  });
  
  canvas.addEventListener('mouseleave', function(ev) {
    g_isDragging = false;
  });
}

function main() {
  // Set up canvas and get gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Render the scene
  renderScene();

  // Start animation loop
  requestAnimationFrame(tick);
}


var g_shapesList = [];

function tick() {
  // Update animation
  g_seconds = performance.now() / 1000.0 - g_startTime;
  
  updateAnimationAngles();
  
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

function renderScene() {
  // Clear canvas
  var startTime = performance.now();
  
  // Set global rotation matrix
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleY, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Draw Lion
  
  // Body
  var bodyMatrix = new Matrix4();
  bodyMatrix.translate(-0.15, -0.05 + g_bodyBob, 0.0 + g_bodySway);
  bodyMatrix.scale(0.4, 0.2, 0.25);
  drawCube(bodyMatrix, [0.82, 0.62, 0.42, 1.0]);
  
  // Head (attached to body front)
  var headMatrix = new Matrix4();
  headMatrix.translate(0.25, 0.05 + g_bodyBob, 0.05 + g_bodySway);
  headMatrix.rotate(g_headAngle, 0, 1, 0);
  var headCoord = new Matrix4(headMatrix);
  headMatrix.scale(0.15, 0.15, 0.15);
  drawCube(headMatrix, [0.88, 0.68, 0.48, 1.0]);
  
  // Left eye
  var leftEyeMatrix = new Matrix4(headCoord);
  leftEyeMatrix.translate(0.12, 0.08, 0.02);
  leftEyeMatrix.scale(0.04, 0.04, 0.03);
  drawCube(leftEyeMatrix, [0.2, 0.2, 0.2, 1.0]);
  
  // Right eye
  var rightEyeMatrix = new Matrix4(headCoord);
  rightEyeMatrix.translate(0.12, 0.08, 0.1);
  rightEyeMatrix.scale(0.04, 0.04, 0.03);
  drawCube(rightEyeMatrix, [0.2, 0.2, 0.2, 1.0]);
  
  // Mane - single block
  var maneMatrix = new Matrix4(headCoord);
  maneMatrix.translate(-0.12, -0.03, -0.08);
  maneMatrix.scale(0.2, 0.275, 0.30);
  drawCube(maneMatrix, [0.4, 0.25, 0.1, 1.0]);
  
  // Snout
  var snoutMatrix = new Matrix4(headCoord);
  snoutMatrix.translate(0.07, 0.0, 0.04);
  snoutMatrix.scale(0.12, 0.08, 0.08);
  drawCube(snoutMatrix, [0.75, 0.55, 0.35, 1.0]);
  
  // Nose
  var noseMatrix = new Matrix4(headCoord);
  noseMatrix.translate(0.17, 0.03, 0.06);
  noseMatrix.scale(0.04, 0.04, 0.04);
  drawCube(noseMatrix, [0.2, 0.1, 0.05, 1.0]);
  
  // Left ear
  var leftEarMatrix = new Matrix4(headCoord);
  leftEarMatrix.translate(-0.02, 0.13, -0.1);
  leftEarMatrix.scale(0.06, 0.08, 0.04);
  drawCube(leftEarMatrix, [0.80, 0.60, 0.40, 1.0]);
  
  // Right ear
  var rightEarMatrix = new Matrix4(headCoord);
  rightEarMatrix.translate(-0.02, 0.13, 0.195);
  rightEarMatrix.scale(0.06, 0.08, 0.04);
  drawCube(rightEarMatrix, [0.80, 0.60, 0.40, 1.0]);
  
  // Tail base
  var tailMatrix = new Matrix4();
  tailMatrix.translate(-0.05, 0.0 + g_bodyBob, 0.12 + g_bodySway);
  tailMatrix.rotate(g_tailAngle, 0, 0, 1);
  var tailCoord = new Matrix4(tailMatrix);
  tailMatrix.translate(-0.15, 0.0, 0.0);
  tailMatrix.scale(0.15, 0.05, 0.05);
  drawCylinder(tailMatrix, [0.78, 0.58, 0.38, 1.0]);
  
  // Tail mid segment
  var tailMid = new Matrix4(tailCoord);
  tailMid.translate(-0.27, 0, 0);
  tailMid.rotate(g_tailMidAngle, 0, 0, 1);
  tailMid.scale(0.10, 0.04, 0.04);
  drawCylinder(tailMid, [0.76, 0.56, 0.36, 1.0]);
  
  // Tail tuft
  var tailTuft = new Matrix4(tailCoord);
  tailTuft.translate(-0.4, -0.03, -0.05);
  tailTuft.rotate(g_tailTipAngle, 0, 0, 1);
  tailTuft.scale(0.1, 0.12, 0.12);
  drawCube(tailTuft, [0.42, 0.25, 0.10, 1.0]);
  
  // Front Left Leg
  var frontLeftLegMatrix = new Matrix4();
  frontLeftLegMatrix.translate(0.15, 0.0 + g_bodyBob, 0.0 + g_bodySway);
  frontLeftLegMatrix.rotate(g_frontLeftLegAngle, 0, 0, 1);
  var frontLeftLegCoord = new Matrix4(frontLeftLegMatrix);
  frontLeftLegMatrix.scale(0.06, 0.12, 0.06); // shorter
  frontLeftLegMatrix.translate(0.0, -1.0, 0.0);
  drawCube(frontLeftLegMatrix, [0.76, 0.56, 0.36, 1.0]);
  
  // Front Left Lower Leg
  var frontLeftLowerLegMatrix = new Matrix4(frontLeftLegCoord);
  frontLeftLowerLegMatrix.translate(0.0, -0.11, 0.0); // adjusted
  frontLeftLowerLegMatrix.rotate(g_frontLeftLowerLegAngle, 0, 0, 1);
  var frontLeftLowerLegCoord = new Matrix4(frontLeftLowerLegMatrix);
  frontLeftLowerLegMatrix.scale(0.055, 0.09, 0.055); // shorter
  frontLeftLowerLegMatrix.translate(0.0, -1.0, 0.0);
  drawCube(frontLeftLowerLegMatrix, [0.72, 0.52, 0.32, 1.0]);
  
  // Front Left Foot
  var frontLeftFootMatrix = new Matrix4(frontLeftLowerLegCoord);
  frontLeftFootMatrix.translate(0, -0.11, -0.01);
  frontLeftFootMatrix.rotate(g_frontLeftFootAngle, 0, 0, 1);
  frontLeftFootMatrix.scale(0.1, 0.03, 0.08);
  drawCube(frontLeftFootMatrix, [0.68, 0.48, 0.28, 1.0]);
  
  // Front Right Leg
  var frontRightLegMatrix = new Matrix4();
  frontRightLegMatrix.translate(0.15, 0.0 + g_bodyBob, 0.18 + g_bodySway);
  frontRightLegMatrix.rotate(g_frontRightLegAngle, 0, 0, 1);
  var frontRightLegCoord = new Matrix4(frontRightLegMatrix);
  frontRightLegMatrix.scale(0.06, 0.12, 0.06); // shorter
  frontRightLegMatrix.translate(0.0, -1.0, 0.0);
  drawCube(frontRightLegMatrix, [0.76, 0.56, 0.36, 1.0]);
  
  // Front Right Lower Leg
  var frontRightLowerLegMatrix = new Matrix4(frontRightLegCoord);
  frontRightLowerLegMatrix.translate(0.0, -0.11, 0.0); // adjusted
  frontRightLowerLegMatrix.rotate(g_frontRightLowerLegAngle, 0, 0, 1);
  var frontRightLowerLegCoord = new Matrix4(frontRightLowerLegMatrix);
  frontRightLowerLegMatrix.scale(0.055, 0.09, 0.055); // shorter
  frontRightLowerLegMatrix.translate(0.0, -1.0, 0.0);
  drawCube(frontRightLowerLegMatrix, [0.72, 0.52, 0.32, 1.0]);
  
  // Front Right Foot
  var frontRightFootMatrix = new Matrix4(frontRightLowerLegCoord);
  frontRightFootMatrix.translate(0, -0.11, -0.01);
  frontRightFootMatrix.rotate(g_frontRightFootAngle, 0, 0, 1);
  frontRightFootMatrix.scale(0.1, 0.03, 0.08);
  drawCube(frontRightFootMatrix, [0.68, 0.48, 0.28, 1.0]);
  
  // Back Left Leg
  var backLeftLegMatrix = new Matrix4();
  backLeftLegMatrix.translate(-0.125, 0.0 + g_bodyBob, 0.0 + g_bodySway);
  backLeftLegMatrix.rotate(g_backLeftLegAngle, 0, 0, 1);
  var backLeftLegCoord = new Matrix4(backLeftLegMatrix);
  backLeftLegMatrix.scale(0.06, 0.12, 0.06); // shorter
  backLeftLegMatrix.translate(0.0, -1.0, 0.0);
  drawCube(backLeftLegMatrix, [0.76, 0.56, 0.36, 1.0]);
  
  // Back Left Lower Leg
  var backLeftLowerLegMatrix = new Matrix4(backLeftLegCoord);
  backLeftLowerLegMatrix.translate(0.0, -0.11, 0.0); // adjusted
  backLeftLowerLegMatrix.rotate(g_backLeftLowerLegAngle, 0, 0, 1);
  var backLeftLowerLegCoord = new Matrix4(backLeftLowerLegMatrix);
  backLeftLowerLegMatrix.scale(0.055, 0.09, 0.055); // shorter
  backLeftLowerLegMatrix.translate(0.0, -1.0, 0.0);
  drawCube(backLeftLowerLegMatrix, [0.72, 0.52, 0.32, 1.0]);
  
  // Back Left Foot
  var backLeftFootMatrix = new Matrix4(backLeftLowerLegCoord);
  backLeftFootMatrix.translate(0, -0.11, -0.01);
  backLeftFootMatrix.rotate(g_backLeftFootAngle, 0, 0, 1);
  backLeftFootMatrix.scale(0.1, 0.03, 0.08);
  drawCube(backLeftFootMatrix, [0.68, 0.48, 0.28, 1.0]);
  
  // Back Right Leg
  var backRightLegMatrix = new Matrix4();
  backRightLegMatrix.translate(-0.125, 0.0 + g_bodyBob, 0.18 + g_bodySway);
  backRightLegMatrix.rotate(g_backRightLegAngle, 0, 0, 1);
  var backRightLegCoord = new Matrix4(backRightLegMatrix);
  backRightLegMatrix.scale(0.06, 0.12, 0.06); // shorter
  backRightLegMatrix.translate(0.0, -1.0, 0.0);
  drawCube(backRightLegMatrix, [0.76, 0.56, 0.36, 1.0]);
  
  // Back Right Lower Leg
  var backRightLowerLegMatrix = new Matrix4(backRightLegCoord);
  backRightLowerLegMatrix.translate(0.0, -0.11, 0.0); // adjusted
  backRightLowerLegMatrix.rotate(g_backRightLowerLegAngle, 0, 0, 1);
  var backRightLowerLegCoord = new Matrix4(backRightLowerLegMatrix);
  backRightLowerLegMatrix.scale(0.055, 0.09, 0.055); // shorter
  backRightLowerLegMatrix.translate(0.0, -1.0, 0.0);
  drawCube(backRightLowerLegMatrix, [0.72, 0.52, 0.32, 1.0]);
  
  // Back Right Foot
  var backRightFootMatrix = new Matrix4(backRightLowerLegCoord);
  backRightFootMatrix.translate(0, -0.11, -0.01);
  backRightFootMatrix.rotate(g_backRightFootAngle, 0, 0, 1);
  backRightFootMatrix.scale(0.1, 0.03, 0.08);
  drawCube(backRightFootMatrix, [0.68, 0.48, 0.28, 1.0]);
  
  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function drawCube(matrix, color) {
  // Pass the matrix to u_ModelMatrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  
  // Pass the color
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  
  // Draw cube using triangles
  drawCubeGeometry();
}

function drawCubeGeometry() {
  // Create vertices for a unit cube centered at origin
  // Front face
  drawTriangle3D([0, 0, 0,  1, 1, 0,  1, 0, 0]);
  drawTriangle3D([0, 0, 0,  0, 1, 0,  1, 1, 0]);
  
  // Back face
  drawTriangle3D([0, 0, 1,  1, 0, 1,  1, 1, 1]);
  drawTriangle3D([0, 0, 1,  1, 1, 1,  0, 1, 1]);
  
  // Top face
  drawTriangle3D([0, 1, 0,  0, 1, 1,  1, 1, 1]);
  drawTriangle3D([0, 1, 0,  1, 1, 1,  1, 1, 0]);
  
  // Bottom face
  drawTriangle3D([0, 0, 0,  1, 0, 0,  1, 0, 1]);
  drawTriangle3D([0, 0, 0,  1, 0, 1,  0, 0, 1]);
  
  // Right face
  drawTriangle3D([1, 0, 0,  1, 1, 0,  1, 1, 1]);
  drawTriangle3D([1, 0, 0,  1, 1, 1,  1, 0, 1]);
  
  // Left face
  drawTriangle3D([0, 0, 0,  0, 0, 1,  0, 1, 1]);
  drawTriangle3D([0, 0, 0,  0, 1, 1,  0, 1, 0]);
}

function drawCylinder(matrix, color, segments = 12) {
  // Pass the matrix to u_ModelMatrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  
  // Pass the color
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  
  // Draw cylinder using triangles
  drawCylinderGeometry(segments);
}

function drawCylinderGeometry(segments) {
  const r = 0.5;
  const h = 1.0;
  
  // Side faces
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * 2 * Math.PI;
    const angle2 = ((i + 1) / segments) * 2 * Math.PI;
    
    const x1 = r * Math.cos(angle1);
    const z1 = r * Math.sin(angle1);
    const x2 = r * Math.cos(angle2);
    const z2 = r * Math.sin(angle2);
    
    // Two triangles for each side segment
    drawTriangle3D([x1, 0, z1,  x2, 0, z2,  x2, h, z2]);
    drawTriangle3D([x1, 0, z1,  x2, h, z2,  x1, h, z1]);
  }
  
  // Top cap
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * 2 * Math.PI;
    const angle2 = ((i + 1) / segments) * 2 * Math.PI;
    
    const x1 = r * Math.cos(angle1);
    const z1 = r * Math.sin(angle1);
    const x2 = r * Math.cos(angle2);
    const z2 = r * Math.sin(angle2);
    
    drawTriangle3D([0.5, h, 0.5,  x1, h, z1,  x2, h, z2]);
  }
  
  // Bottom cap
  for (let i = 0; i < segments; i++) {
    const angle1 = (i / segments) * 2 * Math.PI;
    const angle2 = ((i + 1) / segments) * 2 * Math.PI;
    
    const x1 = r * Math.cos(angle1);
    const z1 = r * Math.sin(angle1);
    const x2 = r * Math.cos(angle2);
    const z2 = r * Math.sin(angle2);
    
    drawTriangle3D([0.5, 0, 0.5,  x2, 0, z2,  x1, 0, z1]);
  }
}

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = [];   // The array to store the size of a point

function click(ev) {

  let [x,y] = convertCoordinateEventToGL(ev);

  // Create and store the new point
  let point;
  if (g_selectedType==POINT) {
    point = new Point();
  } else if (g_selectedType==TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
    point.segments = g_selectedSegment;
  }
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // Store the coordinates to g_points array
  // g_points.push([x, y]);

  // // Store the coordinates to g_points array
  // //g_colors.push(g_selectedColor);

  // g_colors.push(g_selectedColor.slice());
  // g_sizes.push(g_selectedSize);

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
  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var len = g_shapesList.length;        //g_points.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

}