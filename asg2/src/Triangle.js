class Triangle{
    // Constructor
  constructor(){
    this.type='triangle';
    this.position = [0.0,0.0,0.0];
    this.color = [1.0,1.0,1.0,1.0];
    this.size = 5.0;

    this.buffer = null;
    this.vertices = null;
  }

  // Render the shape
  render() {
    var xy = this.position;
    var rgba = this.color;
    var size = this.size;
    // var xy = g_shapesList[i].position;  //g_points[i];
    // var rgba = g_shapesList[i].color;   //g_colors[i];
    // var size = g_shapesList[i].size;    //g_sizes[i];

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Pass the size of a point to u_PointSize variable
    gl.uniform1f(u_PointSize, size);
    // Draw
    // gl.drawArrays(gl.POINTS, 0, 1);
    var d = this.size/200.0;
    drawTriangle( [xy[0], xy[1], xy[0]+d, xy[1], xy[0], xy[1]+d]);
  }
}

// StaticTriangle: draws an arbitrary triangle defined by 3 vertices
// verts: [x1,y1,x2,y2,x3,y3] in NDC; color: [r,g,b,a]
class StaticTriangle {
  constructor(verts, color){
    this.type = 'static-triangle';
    this.color = color || [1.0,1.0,1.0,1.0];
    this.vertexBuffer = gl.createBuffer();
    this.vertexCount = 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  }

  render(){
    // Set color
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    // Bind and configure buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
  }
}

function drawTriangle(vertices) {
    var n = 3;  // Number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3D(vertices) {
    var n = vertices.length / 3;
    // if (this.buffer === null) {
    //   this.buffer = gl.createBuffer();
    //   if (!this.buffer) {
    //     console.log('Failed to create the buffer object');
    //     return;
    //   }
    // }
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}