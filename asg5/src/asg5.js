/*
CSE 160 – Assignment 5
*/

import * as THREE from 'three';
import { OrbitControls }    from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }       from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader }        from 'three/addons/loaders/EXRLoader.js';


// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.75;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Scene
const scene = new THREE.Scene();

// Fog
scene.fog = new THREE.FogExp2(0x657A9C, 0.012);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);
camera.position.set(0, 4, 8);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping  = true;
controls.dampingFactor  = 0.08;
controls.maxPolarAngle  = Math.PI / 1.8;
controls.minDistance    = 2;
controls.maxDistance    = 25;
controls.target.set(0, 0.2, 0);

renderer.domElement.addEventListener('dblclick', () => {
    camera.position.set(0, 4, 8);
    controls.target.set(0, 0.2, 0);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Skybox
// new EXRLoader().load('../resources/images/qwantani_dusk_2_puresky_2k.exr', (texture) => {
//     texture.mapping = THREE.EquirectangularReflectionMapping;
//     scene.background  = texture;
//     scene.environment = texture;   // PBR materials (balls, water) pick this up
// });


// Skybox from Freepik https://www.freepik.com/free-photo/coma-berenices-star-constellation-night-sky-cluster-stars-deep-space-berenice-hair_24149865.htm#fromView=keyword&page=1&position=8&uuid=c9e7159c-ef3a-4401-b838-ccb681e774d5&query=Equirectangular+night+sky
const loader = new THREE.TextureLoader();
const texture = loader.load('../resources/images/nightSky.jpg', () => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.background = texture;
});

// Lighting

// AmbientLight
const color = 0xffc48a;
const intensity = 0.5;
const ambientLight = new THREE.AmbientLight(color, intensity);
scene.add(ambientLight);

// HemisphereLight
const skyColor = 0x657A9C;    // light from the sky
const groundColor = 0x00FF00; // light from the ground
const hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 0.25);
scene.add(hemiLight);

// const boxWidth = 0.25;
// const boxHeight = 0.25;
// const boxDepth = 0.25;
// const boxGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
// const boxMat = new THREE.MeshBasicMaterial({ color: 0x2a2a4a });
// const boxPositions = [
//     [4, 0.55, -4.8],
//     [4, 0.55, -5.525],
//     [-5, 4.25, -5],
//     [-5, 4.25, 5],
//     [5, 4.25, 5],
// ];
// boxPositions.forEach(([x, y, z]) => {
//     const box = new THREE.Mesh(boxGeo, boxMat);
//     box.position.set(x, y, z);
//     scene.add(box);
// });


// Lamppost lights
const lampLightPositions = [
    new THREE.Vector3(-5, 4.25, -5),
    new THREE.Vector3(-5, 4.25, 5),
    new THREE.Vector3(5, 4.25, 5),
];

lampLightPositions.forEach((pos) => {
    const lampLight = new THREE.PointLight(0xffc48a, 100, 0, 2.0);
    lampLight.position.copy(pos);
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(512, 512);
    lampLight.shadow.bias = -0.001;
    scene.add(lampLight);
});

// Headlight for golf cart (spotlight)
const cartLightPos = [
    new THREE.Vector3(4, 0.55, -4.8),
    new THREE.Vector3(4, 0.55, -5.525),
];
cartLightPos.forEach((pos) => {
    const headlight = new THREE.SpotLight(0xffc48a, 110, 0, Math.PI / 6, 0.75, 0.75);
    headlight.position.copy(pos);
    headlight.target.position.set(pos.x - 200, pos.y + 1, pos.z);
    headlight.castShadow = true;
    headlight.shadow.mapSize.set(512, 512);
    headlight.shadow.bias = -0.001;
    scene.add(headlight);
    scene.add(headlight.target);
});

// Textures
const texLoader = new THREE.TextureLoader();

const planeS = 2000;

// Grass
const grassTex = texLoader.load('../resources/images/grass.jpg');
grassTex.encoding = THREE.sRGBEncoding;
grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
const repeats = planeS / 2;
grassTex.repeat.set(repeats, repeats);

const planeGeo = new THREE.PlaneGeometry(planeS, planeS);
const planeMat = new THREE.MeshLambertMaterial({ map: grassTex });
const ground = new THREE.Mesh(planeGeo, planeMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);


// Golf Balls
const ballMat = new THREE.MeshStandardMaterial({
    color:     0xffffff,
    roughness: 0.25,
    metalness: 0.1,
});

// Ball physics
const balls = [];
const BALL_RADIUS = 0.15;
const GRAVITY = 9.81; 
const FRICTION = 0.97;  
const ROLL_RESISTANCE = 0.97; 
const GROUND_Y = BALL_RADIUS;  // height when ball "rests" on ground

// Hole positions
const holes = [];
const HOLE_RADIUS = 0.25; 

class GolfBall {
    constructor(x, z) {
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 14, 14), ballMat);
        this.mesh.position.set(x, GROUND_Y, z);
        this.mesh.castShadow = true;
        scene.add(this.mesh);
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.originalColor = new THREE.Color(0xffffff);
        this.hitCooldown = 0;
    }
    
    update(delta) {
        this.hitCooldown = Math.max(0, this.hitCooldown - delta);

        if (this.velocity.length() < 0.001) {
            this.velocity.set(0, 0, 0);
            this.mesh.position.y = GROUND_Y;
            return;
        }
        
        // Apply gravity
        this.velocity.y -= GRAVITY * delta;
        
        // Apply friction
        this.velocity.multiplyScalar(Math.pow(FRICTION, delta));
        
        // Rolling resistance
        const horiz = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        horiz.multiplyScalar(ROLL_RESISTANCE);
        this.velocity.x = horiz.x;
        this.velocity.z = horiz.z;
        
        // Update position
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Ground collision
        if (this.mesh.position.y < GROUND_Y) {
            this.mesh.position.y = GROUND_Y;
            this.velocity.y *= -0.6;
            if (Math.abs(this.velocity.y) < 0.2) this.velocity.y = 0;
        }
        
        // Check if ball sank into a hole
        for (const hole of holes) {
            const dist = this.mesh.position.distanceTo(hole.position);
            if (dist < HOLE_RADIUS) {
                this.reset();
                return;
            }
        }
        
        // Boundaries (invisible walls)
        const boundsX = 5.5, boundsZ = 5.5;
        if (Math.abs(this.mesh.position.x) > boundsX) {
            this.mesh.position.x = Math.sign(this.mesh.position.x) * boundsX;
            this.velocity.x *= -0.4;
        }
        if (Math.abs(this.mesh.position.z) > boundsZ) {
            this.mesh.position.z = Math.sign(this.mesh.position.z) * boundsZ;
            this.velocity.z *= -0.4;
        }
        
    }
    
    reset() {
        // Reset ball to starting position
        const idx = balls.indexOf(this);
        if (idx >= 0 && idx < ballPositions.length) {
            const [x, z] = ballPositions[idx];
            this.mesh.position.set(x, GROUND_Y, z);
            this.velocity.set(0, 0, 0);
            this.hitCooldown = 0;
        }
    }
    
    hit(direction, power = 8) {
        this.velocity.copy(direction).multiplyScalar(power);
        this.velocity.y = 0.2;
    }
    
    getDistance(point) {
        return this.mesh.position.distanceTo(point);
    }
}

// Golf ball positions
const ballPositions = [
    [-2, 3], [2, 3], [-1, 0], [1, 0],
    [0, -2], [3, -1], [0, 0],
];

ballPositions.forEach(([x, z]) => {
    balls.push(new GolfBall(x, z));
});


// Holes with flags
const flagMeshes = [];   // for animation

const holeConfig = [
    { x: -3, z: 4,  color: 0xff6666 },
    { x:  3, z: 4,  color: 0x6666ff },
    { x:  0, z: -3.5, color: 0xffdd44 },
];

holeConfig.forEach(({ x, z, color }) => {
    // Register hole for ball detection
    holes.push({ position: new THREE.Vector3(x, 0, z) });
    
    // Hole cup – CylinderGeometry
    const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    cup.position.set(x, -0.05, z);
    scene.add(cup);


    // Flag pole – CylinderGeometry
    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.8, 5),
        new THREE.MeshLambertMaterial({ color: 0xeeeeee })
    );
    pole.position.set(x, 0.4, z);
    pole.castShadow = true;
    scene.add(pole);

    // Flag cloth – PlaneGeometry
    const flagGeo = new THREE.PlaneGeometry(0.35, 0.22, 4, 2);
    const rawPos = flagGeo.attributes.position.array;
    const origZ  = [];
    for (let i = 2; i < rawPos.length; i += 3) origZ.push(rawPos[i]);
    flagGeo.userData.origZ = origZ;

    const flagMesh = new THREE.Mesh(
        flagGeo,
        new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })
    );
    flagMesh.position.set(x + 0.175, 0.75, z);
    flagMesh.castShadow = true;
    flagMesh.userData.phase = Math.random() * Math.PI * 2;
    scene.add(flagMesh);
    flagMeshes.push(flagMesh);
});

// Golf cart by Eric Wilson [CC-BY] via Poly Pizza
const gltfLoader = new GLTFLoader();
gltfLoader.load('../resources/glb/Golf cart.glb', (gltf) => {
    const cartModel = gltf.scene;
    cartModel.scale.set(1, 1, 1);
    cartModel.position.set(5, 0.8, -5);
    cartModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(cartModel);
}, undefined, (error) => {
    console.warn('Failed to load golf cart:', error);
});

// Lamp post by Poly by Google [CC-BY] via Poly Pizza
gltfLoader.load('../resources/glb/Lamp post.glb', (gltf) => {
    const lampModel = gltf.scene;
    lampModel.scale.set(0.25, 0.25, 0.25);
    lampModel.position.set(-5, 0, -5);
    lampModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(lampModel);
}, undefined, (error) => {
    console.warn('Failed to load lamp post:', error);
});

gltfLoader.load('../resources/glb/Lamp post.glb', (gltf) => {
    const lampModel = gltf.scene;
    lampModel.scale.set(0.25, 0.25, 0.25);
    lampModel.position.set(-5, 0, 5);
    lampModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(lampModel);
}, undefined, (error) => {
    console.warn('Failed to load lamp post:', error);
});

gltfLoader.load('../resources/glb/Lamp post.glb', (gltf) => {
    const lampModel = gltf.scene;
    lampModel.scale.set(0.25, 0.25, 0.25);
    lampModel.position.set(5, 0, 5);
    lampModel.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(lampModel);
}, undefined, (error) => {
    console.warn('Failed to load lamp post:', error);
});

// Ball interaction
let mouseDownPos = null;
const raycaster = new THREE.Raycaster();

function hitNearestBall(hitPoint) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const ball of balls) {
        const dist = ball.getDistance(hitPoint);
        if (dist < minDist && dist < 1.25) {
            minDist = dist;
            nearest = ball;
        }
    }
    
    if (nearest && nearest.hitCooldown <= 0) {
        // Direction away from hit point
        const direction = new THREE.Vector3().subVectors(nearest.mesh.position, hitPoint).normalize();
        const power = 5 + Math.random() * 4;  // moderate putting power
        nearest.hit(direction, power);
        nearest.hitCooldown = 0.3;
    }
}

// Track mousedown position to distinguish clicks from drags
window.addEventListener('mousedown', (e) => {
    mouseDownPos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', (e) => {
    if (!mouseDownPos) return;
    
    // Only trigger if not mouse drag
    const dx = e.clientX - mouseDownPos.x;
    const dy = e.clientY - mouseDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 5) {
        // Get world position at mouse location
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        
        // Cast ray to ground plane and hit nearest ball
        const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hitPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(planeY, hitPoint);
        
        if (hitPoint) {
            hitNearestBall(hitPoint);
        }
    }
    
    mouseDownPos = null;
});


// Animations
const timer = new THREE.Timer();
const FLAG_COLS = 11;

renderer.setAnimationLoop(() => {
    timer.update();
    const delta   = timer.getDelta();
    const elapsed = timer.getElapsed();

    // Update golf balls physics
    balls.forEach(ball => ball.update(delta));

    // For each flag, iterate over all 66 vertices (11 columns × 6 rows).
    // Column index = i % FLAG_COLS gives position along flag width.
    // u = col / (FLAG_COLS-1) maps to [0…1]; 0 is the fixed pole attachment.
    // Z displacement = sin(t*speed + u*2π + phase) * maxAmplitude * u²
    flagMeshes.forEach((flag, fi) => {
        const geo       = flag.geometry;
        const posAttr   = geo.attributes.position;
        const origZ     = geo.userData.origZ;
        const phase     = flag.userData.phase;

        for (let i = 0; i < posAttr.count; i++) {
            const col = i % FLAG_COLS;
            const u   = col / (FLAG_COLS - 1);       
            const amp = 0.12 * u * u;                  
            const z   = origZ[i] + Math.sin(elapsed * 3.5 + u * Math.PI * 2 + phase) * amp;
            posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
        geo.computeVertexNormals();
    });

    controls.update();
    renderer.render(scene, camera);
});
