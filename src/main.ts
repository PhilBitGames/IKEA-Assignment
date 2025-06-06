import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

const width = window.innerWidth;
const height = window.innerHeight;

// Create a WebGL renderer and attach it to the HTML canvas
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('app') as HTMLCanvasElement });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
camera.position.set(0, 1, 3);
camera.up.set(0, 1, 0);

// Set up the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(THREE.Color.NAMES.grey);

// Set up directional and ambient lights
const directionalLight = new THREE.DirectionalLight(THREE.Color.NAMES.white, 1);
directionalLight.position.set(4, 4, 2);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(THREE.Color.NAMES.white, 2);
scene.add(ambientLight);

// Add an axes helper to visualize the coordinate system
const axesHelper = new THREE.AxesHelper(1)
scene.add(axesHelper)

// Set up orbit controls for camera manipulation
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.target.set(0, 1, 0);

// Create a cube (Just to visualize the scene)
// Commented out the cube creation
// const cubeGeometry = new THREE.BoxGeometry(1, 1, 1); 
// const cubeMaterial = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.blue }); 
// const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
// cube.position.set(0, 0, 1);
// scene.add(cube);

//Create a plane to serve as the ground
const planeGeometry = new THREE.PlaneGeometry(5, 5, 1);
const planeMaterial = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Set up the import button and file input and their event listeners
const importButton = document.getElementById('importButton') as HTMLButtonElement;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;

importButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (event) => {
    const files = (event.target as HTMLInputElement).files;
    if (files && files.length > 0) {
        const file = files[0];
        try {
            await loadGLBModelFromInputFile(file);
        } catch (error) {
            console.error('Error loading GLB model:', error);
            alert((error as Error).message);
        }
    }
});

// Generalized function to load a GLB model from a URL or Data URL
function loadGLBModel(source: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        gltfLoader.load(
            source,
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);
                resolve(model);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('An error occurred while loading the model:', error);
                reject(error);
            }
        );
    });
}

// Load a default GLB model (sphere.glb) when the application starts
// let sphere: THREE.Object3D | null = null;
// loadGLBModel('sphere.glb').then(model => {
//     sphere = model;
//     sphere.position.set(0, 1, 0);
//     sphere.scale.set(0.5, 0.5, 0.5);
// }).catch(error => {
//     alert('Failed to load default model: ' + error);
// });

// Function to load a GLB model from a file input
function loadGLBModelFromInputFile(file: File): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
        if (!file.name.endsWith('.glb')) {
            reject(new Error('Please select a .glb file.'));
            return;
        }
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            if (event.target && event.target.result) {
                loadGLBModel(event.target.result as string)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error('FileReader failed to read file.'));
            }
        };
        reader.onerror = () => {
            reject(reader.error || new Error('Unknown FileReader error'));
        };
        reader.readAsDataURL(file);
    });
}

// animate function, used to render the scene continuously
function animate() {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
};

// Handle window resize events to adjust camera and renderer
const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener('resize', handleResize);

// Start the animation loop
animate();
