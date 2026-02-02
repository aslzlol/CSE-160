// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_PointSize;
  void main() {
    gl_Position = a_Position;
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
  // document.getElementById('green').onclick = function() {g_selectedColor = [0.0,1.0,0.0,1.0]; };
  // document.getElementById('red').onclick = function() {g_selectedColor = [1.0,0.0,0.0,1.0]; };
  document.getElementById('clearButton').onclick = function() {g_shapesList=[]; renderAllShapes(); };

  document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
  document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
  document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};
  document.getElementById('drawRefButton').onclick = drawReference;

  // Color Slider Events
  document.getElementById('redSlider').addEventListener('mouseup', function() {g_selectedColor[0] = parseFloat(this.value); });
  document.getElementById('greenSlider').addEventListener('mouseup', function() {g_selectedColor[1] = parseFloat(this.value); });
  document.getElementById('blueSlider').addEventListener('mouseup', function() {g_selectedColor[2] = parseFloat(this.value); });

  // Size Slider Event
  document.getElementById('sizeSlider').addEventListener('input', function() {g_selectedSize = parseFloat(this.value); });
  document.getElementById('segmentSlider').addEventListener('input', function() {g_selectedSegment = parseFloat(this.value); });
}

function main() {
  // Set up canvas and get gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}


var g_shapesList = [];

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
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;        //g_points.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

}

// Drawing
function drawReference(){
  const tris = [
    // Grass 
    {verts: [
        -1.0, -1.0,
         1.0, -1.0,
        -1.0, -0.6,
      ],
      color: [0.0, 0.6, 0.0, 1.0],
    },
    {
      verts: [
        -1.0, -0.6,
         1.0, -1.0,
         1.0, -0.6,
      ],
      color: [0.0, 0.6, 0.0, 1.0],
    },
    // Trunk (two triangles)
    {
      verts: [
        -0.05, -0.6,
         0.05, -0.6,
        -0.05, -0.45,
      ],
      color: [0.55, 0.27, 0.07, 1.0],
    },
    {
      verts: [
        -0.05, -0.45,
         0.05, -0.6,
         0.05, -0.45,
      ],
      color: [0.55, 0.27, 0.07, 1.0],
    },

    // Bottom foliage
    {
      verts: [
        -0.45, -0.45,
         0.45, -0.45,
         0.00,  0.05,
      ],
      color: [0.0, 0.55, 0.0, 1.0],
    },

    // Middle foliage
    {
      verts: [
        -0.35, -0.20,
         0.35, -0.20,
         0.00,  0.25,
      ],
      color: [0.0, 0.60, 0.0, 1.0],
    },

    // Top foliage
    {
      verts: [
        -0.25,  0.00,
         0.25,  0.00,
         0.00,  0.40,
      ],
      color: [0.0, 0.65, 0.0, 1.0],
    },

    // Diamond ornaments (two triangles per diamond)
    // Bottom layer ornaments (slightly below the tips)
    { verts: [-0.45, -0.41, -0.41, -0.45, -0.49, -0.45], color: [0.35, 0.70, 1.0, 1.0] },
    { verts: [-0.45, -0.49, -0.41, -0.45, -0.49, -0.45], color: [0.35, 0.70, 1.0, 1.0] },

    { verts: [ 0.45, -0.41,  0.49, -0.45,  0.41, -0.45], color: [1.0, 0.35, 0.35, 1.0] },
    { verts: [ 0.45, -0.49,  0.49, -0.45,  0.41, -0.45], color: [1.0, 0.35, 0.35, 1.0] },

    // Middle layer ornaments
    { verts: [-0.35, -0.16, -0.31, -0.20, -0.39, -0.20], color: [1.0, 0.85, 0.0, 1.0] },
    { verts: [-0.35, -0.24, -0.31, -0.20, -0.39, -0.20], color: [1.0, 0.85, 0.0, 1.0] },

    { verts: [ 0.35, -0.16,  0.39, -0.20,  0.31, -0.20], color: [0.35, 0.70, 1.0, 1.0] },
    { verts: [ 0.35, -0.24,  0.39, -0.20,  0.31, -0.20], color: [0.35, 0.70, 1.0, 1.0] },

    // Top layer ornaments
    { verts: [-0.25,  0.04, -0.21,  0.00, -0.29,  0.00], color: [1.0, 0.35, 0.35, 1.0] },
    { verts: [-0.25, -0.04, -0.21,  0.00, -0.29,  0.00], color: [1.0, 0.35, 0.35, 1.0] },

    { verts: [ 0.25,  0.04,  0.29,  0.00,  0.21,  0.00], color: [1.0, 0.85, 0.0, 1.0] },
    { verts: [ 0.25, -0.04,  0.29,  0.00,  0.21,  0.00], color: [1.0, 0.85, 0.0, 1.0] },

    // Star (five-pointed star made of triangles)
    { verts: [-0.04, 0.42,  0.04, 0.42,  0.00, 0.52], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [-0.04, 0.42, -0.12, 0.40, -0.06, 0.36], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [-0.06, 0.36, -0.10, 0.28,  0.00, 0.32], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [ 0.00, 0.32,  0.10, 0.28,  0.06, 0.36], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [ 0.06, 0.36,  0.12, 0.40,  0.04, 0.42], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [ 0.00, 0.38, -0.04, 0.42, -0.06, 0.36], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [ 0.00, 0.38, -0.06, 0.36,  0.00, 0.32], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [ 0.00, 0.38,  0.00, 0.32,  0.06, 0.36], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [ 0.00, 0.38,  0.06, 0.36,  0.04, 0.42], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [ 0.00, 0.38,  0.04, 0.42, -0.04, 0.42], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [-0.04, 0.42,  0.04, 0.42,  0.00, 0.52], color: [1.0, 0.9, 0.2, 1.0] },
    { verts: [-0.04, 0.42,  0.04, 0.42,  0.00, 0.34], color: [1.0, 0.9, 0.2, 1.0] },
  ];

  for (const t of tris){
    const tri = new StaticTriangle(t.verts, t.color);
    g_shapesList.push(tri);
  }

  renderAllShapes();
}
