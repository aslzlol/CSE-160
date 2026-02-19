class Cube {
    constructor() {
        //this.type = 'cube';
        //this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 1.0;
        //this.segments = 10;
        this.matrix = new Matrix4();
        this.textureNum = -2;
        this.vertexBuffer = null;
        this.vertices = new Float32Array([ //Taken off 3.11 Lab Video
                0,0,0,  1,1,0,  1,0,0,
                0,0,0,  0,1,0,  1,1,0,

                0,1,0,  1,1,1,  1,1,0,
                0,1,0,  0,1,1,  1,1,1,

                1,0,0,  1,1,0,  1,1,1,
                1,0,0,  1,1,1,  1,0,1,

                0,0,0,  0,0,1,  1,0,1,
                0,0,0,  1,0,1,  1,0,0,

                0,0,0,  0,1,0,  0,1,1,
                0,0,0,  0,1,1,  0,0,1,

                0,0,1,  1,1,1,  1,0,1,
                0,0,1,  0,1,1,  1,1,1
              ] );
        this.UV = new Float32Array([ //Taken off 3.11 Lab Video
                0,0, 1,1, 1,0,
                0,0, 0,1, 1,1,

                0,0, 1,1, 1,0,
                0,0, 0,1, 1,1,

                0,0, 0,1, 1,1,
                0,0, 1,1, 1,0,

                0,0, 0,1, 1,1,
                0,0, 1,1, 1,0,

                0,0, 0,1, 1,1,
                0,0, 1,1, 1,0,

                0,0, 1,1, 1,0,
                0,0, 0,1, 1,1
            ]);

        this.verticesUV = new Float32Array([
                0,0,0,  0,0,
                1,1,0,  1,1,
                1,0,0,  1,0,
                0,0,0,  0,0,
                0,1,0,  0,1,
                1,1,0,  1,1,

                0,1,0,  0,0,
                1,1,1,  1,1,
                1,1,0,  1,0,
                0,1,0,  0,0,
                0,1,1,  0,1,
                1,1,1,  1,1,

                1,0,0,  0,0,
                1,1,0,  1,0,
                1,1,1,  1,1,
                1,0,0,  0,0,
                1,1,1,  1,1,
                1,0,1,  1,0,

                0,0,0,  0,0,
                0,0,1,  0,1,
                1,0,1,  1,1,
                0,0,0,  0,0,
                1,0,1,  1,1,
                1,0,0,  1,0,

                0,0,0,  0,0,
                0,1,0,  0,1,
                0,1,1,  1,1,
                0,0,0,  0,0,
                0,1,1,  1,1,
                0,0,1,  0,1,
                
                0,0,1,  0,0,
                1,1,1,  0,1,
                1,0,1,  1,1,
                0,0,1,  0,0,
                0,1,1,  0,1,
                1,1,1,  1,1,
        ])
                
    }

    renderfaster() {
        var rgba = this.color;

        if (this.vertexBuffer == null) {
            this.vertexBuffer = gl.createBuffer();
            if(!this.vertexBuffer){
                console.log('Failed to create the buffer object');
                return -1;
            }
            // Bind the buffer object to target
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        }

        gl.uniform1i(u_whichTexture, this.textureNum);
        
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // if (vertexBuffer == null) {
        //     initTriangle3D(this.vertices, this.UV);
        // }
        //initTriangle3D(this.vertices, this.UV);
        
        drawCube(this.verticesUV);
    }

    render() {
        var rgba = this.color;

    //   gl.uniform1i(u_whichTexture, this.textureNum);

    //   // Pass the color of a point to u_FragColor variable
    //   gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    //   // Pass the matrix to u_ModelMatrix attribute
    //   gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  

        // Pass the color
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniform1i(u_whichTexture, this.textureNum);

        // // Pass the color of a point to the u_FragColor uniform variable 
        // gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        drawTriangle3DUV([0,0,0,  1,1,0,  1,0,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,0,  0,1,0,  1,1,0], [0,0, 0,1, 1,1]);

        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);
        drawTriangle3DUV([0,1,0,  1,1,1,  1,1,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,1,0,  0,1,1,  1,1,1], [0,0, 0,1, 1,1]);

        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);
        drawTriangle3DUV([0,0,0,  1,0,1,  0,0,1], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,0,  1,0,0,  1,0,1], [0,0, 0,1, 1,1]);

        
        gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3]);
        drawTriangle3DUV([1,0,0,  1,1,1,  1,1,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([1,0,0,  1,0,1,  1,1,1], [0,0, 0,1, 1,1]);


        gl.uniform4f(u_FragColor, rgba[0]*.8, rgba[1]*.8, rgba[2]*.8, rgba[3]);
        drawTriangle3DUV([0,0,0,  0,1,1,  0,1,0], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,0,  0,0,1,  0,1,1], [0,0, 0,1, 1,1]);

    
        gl.uniform4f(u_FragColor, rgba[0]*.7, rgba[1]*.7, rgba[2]*.7, rgba[3]);
        drawTriangle3DUV([0,0,1,  1,1,1,  0,1,1], [0,0, 1,1, 1,0]);
        drawTriangle3DUV([0,0,1,  1,0,1,  1,1,1], [0,0, 0,1, 1,1]);
    }

    renderfast() {
        var rgba = this.color;

        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable

        var allverts=[];
        var alluv=[];

        // Front
        allverts=allverts.concat([0,0,0,  1,1,0,  1,0,0]);
        alluv=alluv.concat([0,0, 1,1, 1,0]);
        allverts=allverts.concat([0,0,0, 0,1,0, 1,1,0]);
        alluv=alluv.concat([0,0, 0,1, 1,1]);

        // Top
        allverts=allverts.concat([0,1,0, 0,1,1, 1,1,1]);
        alluv=alluv.concat([0,0, 0,1, 1,1]);
        allverts=allverts.concat([0,1,0, 1,1,1, 1,1,0]);
        alluv=alluv.concat([0,0, 1,1, 1,0]);

        // Right
        allverts=allverts.concat([1,0,0,  1,0,1,  1,1,0]);
        alluv=alluv.concat([1,0, 0,1, 1,1]);
        allverts=allverts.concat([1,1,0,  1,1,1,  1,0,1]);
        alluv=alluv.concat([1,0, 0,1, 1,1]);

        // Left
        allverts=allverts.concat([0,0,0,  0,1,0,  0,0,1]);
        alluv=alluv.concat([1,0, 0,1, 1,1]);
        allverts=allverts.concat([0,0,1,  0,1,1,  0,1,0]);
        alluv=alluv.concat([1,0, 0,1, 1,1]);

        // Back
        allverts=allverts.concat([0,0,1,  0,1,1,  1,0,1]);
        alluv=alluv.concat([1,0, 0,1, 1,1]);
        allverts=allverts.concat([1,1,1,  1,0,1,  0,1,1]);
        alluv=alluv.concat([1,0, 0,1, 1,1]);

        // Bottom
        allverts=allverts.concat([0,0,0,  0,0,1,  1,0,0]);
        alluv=alluv.concat([1,0, 0,1, 1,1]);
        allverts=allverts.concat([0,0,1,  1,0,1,  1,0,0]);
        alluv=alluv.concat([1,0, 0,1, 1,1]);
        
        drawTriangle3DUV(allverts, alluv);
    }
}
function drawCube(vertices) {
    var n = 36;  // Number of vertices
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

    gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}

