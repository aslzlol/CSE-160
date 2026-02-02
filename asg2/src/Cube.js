// filepath: /Users/joshualee/Documents/ucsc/classes/cse160/assignments/asg2/src/Cube.js
class Cube {
    constructor() {
        this.type = 'cube';
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 1.0;
    }

    render() {
        const [x, y, z] = this.position;
        const [r, g, b, a] = this.color;
        const d = this.size / 2.0;

        // 12 triangles (36 vertices) for a cube
        const v = [
            // Front
            -d, -d,  d,   d, -d,  d,   d,  d,  d,
            -d, -d,  d,   d,  d,  d,  -d,  d,  d,
            // Back
            -d, -d, -d,  -d,  d, -d,   d,  d, -d,
            -d, -d, -d,   d,  d, -d,   d, -d, -d,
            // Top
            -d,  d, -d,  -d,  d,  d,   d,  d,  d,
            -d,  d, -d,   d,  d,  d,   d,  d, -d,
            // Bottom
            -d, -d, -d,   d, -d, -d,   d, -d,  d,
            -d, -d, -d,   d, -d,  d,  -d, -d,  d,
            // Right
             d, -d, -d,   d,  d, -d,   d,  d,  d,
             d, -d, -d,   d,  d,  d,   d, -d,  d,
            // Left
            -d, -d, -d,  -d, -d,  d,  -d,  d,  d,
            -d, -d, -d,  -d,  d,  d,  -d,  d, -d,
        ];

        // Translate to position
        for (let i = 0; i < v.length; i += 3) {
            v[i] += x;
            v[i + 1] += y;
            v[i + 2] += z;
        }

        gl.uniform4f(u_FragColor, r, g, b, a);
        drawTriangle3D(v);
    }
}

