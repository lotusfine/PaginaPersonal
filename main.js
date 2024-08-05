import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color('#422725');
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = controls.enableRotate = controls.enableZoom = false;
const rain = createRain();

const loadTexture = (url) => new Promise((resolve, reject) => 
    new THREE.TextureLoader().load(url, resolve, undefined, reject)
);

const images = ['/images/imagen1.jpg', '/images/imagen2.jpg', '/images/imagen3.jpg'];

const createCustomMaterial = (texture) => new THREE.ShaderMaterial({
    uniforms: {
        map: { value: texture },
        resolution: { value: new THREE.Vector2(texture.image.width, texture.image.height) },
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D map;
        uniform vec2 resolution;
        varying vec2 vUv;

        vec4 sharpen(sampler2D tex, vec2 uv, vec2 res) {
            vec4 color = texture2D(tex, uv);
            vec4 neighbor1 = texture2D(tex, uv + vec2(1.0, 0.0) / res);
            vec4 neighbor2 = texture2D(tex, uv + vec2(-1.0, 0.0) / res);
            vec4 neighbor3 = texture2D(tex, uv + vec2(0.0, 1.0) / res);
            vec4 neighbor4 = texture2D(tex, uv + vec2(0.0, -1.0) / res);
            return color * 5.0 - (neighbor1 + neighbor2 + neighbor3 + neighbor4);
        }

        void main() {
            vec4 sharpColor = sharpen(map, vUv, resolution);
            gl_FragColor = clamp(sharpColor, 0.0, 1.0);
        }
    `
});

let geometries = [];
let selectedMesh = null;
let isExpanded = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredMesh = null;

Promise.all(images.map(loadTexture)).then(textures => {
    geometries = textures.map((texture, index) => {
        const aspectRatio = texture.image.width / texture.image.height;
        const offset = -1;
        const width = 8;
        const height = width / aspectRatio;
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = createCustomMaterial(texture);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `imagen${index + 1}`;
        mesh.position.set(offset + index * 1, 0, -index * 0.1); // Increased spacing
        mesh.rotation.y = -0.1;
        scene.add(mesh);
        return mesh;
    });

    camera.position.z = 10;

    window.addEventListener('click', onImageClick);
    window.addEventListener('mousemove', onMouseMove);
    animate();
}).catch(error => console.error('Error loading textures:', error));

function createRain() {
    const rainGeometry = new THREE.BufferGeometry();
    const rainCount = 15000;
    const positions = new Float32Array(rainCount * 6); // 2 vertices per line

    for (let i = 0; i < rainCount * 6; i += 6) {
        const x = Math.random() * 400 - 200;
        const y = Math.random() * 500 - 250;
        const z = Math.random() * 400 - 200;

        // Start point of the line
        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;

        // End point of the line (slightly below start point)
        positions[i + 3] = x;
        positions[i + 4] = y - 0.5; // Length of the raindrop
        positions[i + 5] = z;
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMaterial = new THREE.LineBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.5
    });

    const rain = new THREE.LineSegments(rainGeometry, rainMaterial);
    scene.add(rain);

    return rain;
}


function onImageClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(geometries);

    if (isExpanded) {
        if (intersects.length > 0 && intersects[0].object === selectedMesh) {
            resetView();
        }
    } else if (intersects.length > 0) {
        expandImage(intersects[0].object);
    }
}

let isAnyImageExpanded = false;

function expandImage(mesh) {
    selectedMesh = mesh;
    isExpanded = true;
    isAnyImageExpanded = true;

    gsap.to(mesh.position, { x: 5, y: 0, z: 0, duration: 1, ease: "power2.out" });

    geometries.forEach((otherMesh) => {
        if (otherMesh !== mesh) {
            gsap.to(otherMesh.position, { x: -30, y: 0, z: -5, duration: 1, ease: "power2.out" });
        }
    });

    gsap.to(scene.background, { 
        r: 0.0392, g: 0.2, b: 0.2510, 
        duration: 1, 
        ease: "power2.out",
        onUpdate: function() {
            scene.background = new THREE.Color(this.targets()[0]);
        }
    });
}


function resetView() {
    isExpanded = false;
    isAnyImageExpanded = false;
    hoveredMesh = null;

    const offset = -1;
    const selectedIndex = geometries.indexOf(selectedMesh);

    geometries.forEach((mesh, index) => {
        let newIndex = index;
        if (index < selectedIndex) {
            newIndex = index + 1;
        } else if (index === selectedIndex) {
            newIndex = 0;
        }

        gsap.to(mesh.position, { 
            x: offset + index * 1, 
            y: 0, 
            z: -index * 0.1, 
            duration: 1, 
            ease: "power2.out" 
        });
        gsap.to(mesh.rotation, { y: -0.1, duration: 1, ease: "power2.out" });
    });

    gsap.to(scene.background, { 
        r: 0.0510, g: 0.2667, b: 0.3294, 
        duration: 1, 
        ease: "power2.out",
        onUpdate: function() {
            scene.background = new THREE.Color(this.targets()[0]);
        }
    });
}

function handleHover(mesh, isHovering) {
    if (isAnyImageExpanded && mesh === selectedMesh) {
        gsap.to(mesh.rotation, {
            y: isHovering ? 0 : -0.1,
            duration: 0.5,
            ease: "power2.out"
        });
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(geometries);
    
    if (isAnyImageExpanded) {
        const isHovering = intersects.length > 0 && intersects[0].object === selectedMesh;
        handleHover(selectedMesh, isHovering);
    } else {
        hoveredMesh = intersects.length > 0 ? intersects[0].object : null;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (!isAnyImageExpanded) {
        geometries.forEach(mesh => {
            if (mesh === hoveredMesh) {
                mesh.position.y = Math.sin(Date.now() * 0.002) * 0.1;
            } else {
                mesh.position.y *= 0.9;
            }
        });
    }
    // Animate rain
    const positions = rain.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.1 + Math.random() * 0.1;
        if (positions[i] < -250) {
            positions[i] = 250;
        }
    }
    rain.geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}
