// HelloCanvas.js (c) 2012 matsuda
function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  if (!canvas) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Get 2D context for drawing
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Instantiate vector v1
  //var v1 = new Vector3([2.25, 2.25, 0]);
  
  // Draw the vector
  //drawVector(v1, "red");
}

function drawVector(v, color) {
  // Get canvas element
  var canvas = document.getElementById('webgl');
  var ctx = canvas.getContext('2d');
  
  // Set line properties
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  // Get canvas center
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2;
  
  // Scale factor
  var scale = 20;
  
  // Draw line from origin to vector endpoint
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + v.elements[0] * scale, centerY - v.elements[1] * scale);
  ctx.stroke();
}

// Compute the angle between two vectors in radians; returns null if either has zero length
function angleBetween(v1, v2) {
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();
  if (mag1 === 0 || mag2 === 0) {
    return null;
  }
  var cosTheta = Vector3.dot(v1, v2) / (mag1 * mag2);
  // Clamp for numerical stability
  cosTheta = Math.min(1, Math.max(-1, cosTheta));
  return Math.acos(cosTheta);
}

// Compute the area of the triangle formed by v1 and v2 using cross product
function areaTriangle(v1, v2) {
  var cross = Vector3.cross(v1, v2);
  return 0.5 * cross.magnitude();
}

function handleDrawEvent() {
  var canvas = document.getElementById('webgl');
  var ctx = canvas.getContext('2d');

  // Clear and redraw black background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read input values
  var xInput = document.getElementById('x');
  var yInput = document.getElementById('y');
  var x = parseFloat(xInput.value);
  var y = parseFloat(yInput.value);

  // Draw v1 if valid
  if (!isNaN(x) && !isNaN(y)) {
    var v1 = new Vector3([x, y, 0]);
    drawVector(v1, 'red');
  }

  // Read v2 input values
  var x2Input = document.getElementById('x2');
  var y2Input = document.getElementById('y2');
  var x2 = parseFloat(x2Input ? x2Input.value : '');
  var y2 = parseFloat(y2Input ? y2Input.value : '');

  // Draw v2 if valid
  if (!isNaN(x2) && !isNaN(y2)) {
    var v2 = new Vector3([x2, y2, 0]);
    drawVector(v2, 'blue');
  }
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('webgl');
  var ctx = canvas.getContext('2d');

  // Clear and redraw black background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read v1 inputs
  var x = parseFloat((document.getElementById('x') || {}).value);
  var y = parseFloat((document.getElementById('y') || {}).value);
  var v1 = null;
  if (!isNaN(x) && !isNaN(y)) {
    v1 = new Vector3([x, y, 0]);
    drawVector(v1, 'red');
  }

  // Read v2 inputs
  var x2 = parseFloat((document.getElementById('x2') || {}).value);
  var y2 = parseFloat((document.getElementById('y2') || {}).value);
  var v2 = null;
  if (!isNaN(x2) && !isNaN(y2)) {
    v2 = new Vector3([x2, y2, 0]);
    drawVector(v2, 'blue');
  }

  // Read operation and scalar
  var opEl = document.getElementById('operation');
  var op = opEl ? opEl.value : '';
  var sEl = document.getElementById('scalar');
  var s = sEl ? parseFloat(sEl.value) : NaN;

  // Perform operation and draw results in green
  if (op === 'add' && v1 && v2) {
    var v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(v3, 'green');
  } else if (op === 'sub' && v1 && v2) {
    var v3s = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3s.sub(v2);
    drawVector(v3s, 'green');
  } else if (op === 'mul' && !isNaN(s)) {
    if (v1) {
      var m1 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
      m1.mul(s);
      drawVector(m1, 'green');
    }
    if (v2) {
      var m2 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
      m2.mul(s);
      drawVector(m2, 'green');
    }
  } else if (op === 'div' && !isNaN(s) && s !== 0) {
    if (v1) {
      var d1 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
      d1.div(s);
      drawVector(d1, 'green');
    }
    if (v2) {
      var d2 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
      d2.div(s);
      drawVector(d2, 'green');
    }
  } else if (op === 'magnitude') {
    if (v1) {
      console.log('Magnitude v1:', v1.magnitude());
    }
    if (v2) {
      console.log('Magnitude v2:', v2.magnitude());
    }
  } else if (op === 'normalize') {
    if (v1) {
      var n1 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
      n1.normalize();
      drawVector(n1, 'green');
    }
    if (v2) {
      var n2 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
      n2.normalize();
      drawVector(n2, 'green');
    }
  } else if (op === 'angle' && v1 && v2) {
    var angle = angleBetween(v1, v2);
    if (angle !== null) {
      console.log('Angle:', angle * 180 / Math.PI);
    }
  } else if (op === 'area' && v1 && v2) {
    var area = areaTriangle(v1, v2);
    console.log('Area of the triangle:', area);
  }
}
