class Model {
    constructor(filePath) {
        this.filePath = filePath;
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.isFullyLoaded = false;

        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.modelData = null;

        this.getFileContent();
    }

    parseModel(fileContent) {
        const lines = fileContent.split("\n");
        const allVertices = [];
        const allNormals = [];

        const unpackedVerts = [];
        const unpackedNormals = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue;

            const tokens = line.split(/\s+/);

            if (tokens[0] === 'v') {
                allVertices.push(
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                );
            } else if (tokens[0] === "vn") {
                allNormals.push(
                    parseFloat(tokens[1]),
                    parseFloat(tokens[2]),
                    parseFloat(tokens[3])
                );
            } else if (tokens[0] === "f") {
                // Handle triangles (assumes triangulated OBJ)
                for (let j = 1; j <= 3; j++) {
                    if (j >= tokens.length) break;
                    
                    const face = tokens[j];
                    const indices = face.split("//");
                    const vertexIndex = (parseInt(indices[0]) - 1) * 3;
                    const normalIndex = (parseInt(indices[1]) - 1) * 3;

                    unpackedVerts.push(
                        allVertices[vertexIndex],
                        allVertices[vertexIndex + 1],
                        allVertices[vertexIndex + 2]
                    );

                    unpackedNormals.push(
                        allNormals[normalIndex],
                        allNormals[normalIndex + 1],
                        allNormals[normalIndex + 2]
                    );
                }
            }
        }

        this.modelData = {
            vertices: new Float32Array(unpackedVerts),
            normals: new Float32Array(unpackedNormals)
        };

        // Create buffers after data is loaded
        this.vertexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        if (!this.vertexBuffer || !this.normalBuffer) {
            console.log("Failed to create buffers for", this.filePath);
            return;
        }

        this.isFullyLoaded = true;
        console.log(`Model loaded: ${this.filePath}, vertices: ${this.modelData.vertices.length / 3}`);
    }

    render() {
        if (!this.isFullyLoaded) return;

        // vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.vertices, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.modelData.normals, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        // set uniforms
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniform1i(u_whichTexture, -2);

        // normal matrix
        this.normalMatrix.setInverseOf(this.matrix);
        this.normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        gl.drawArrays(gl.TRIANGLES, 0, this.modelData.vertices.length / 3);
    }

    getFileContent() {
        fetch(this.filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Could not load file "${this.filePath}"`);
                }
                return response.text();
            })
            .then(fileContent => {
                this.parseModel(fileContent);
            })
            .catch(e => {
                console.error(`Error loading ${this.filePath}:`, e);
            });
    }
}