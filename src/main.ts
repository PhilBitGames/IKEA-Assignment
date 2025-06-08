import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { select } from 'three/tsl';

// Used to import GLB models into the scene
const gltfLoader = new GLTFLoader();

const width = window.innerWidth;
const height = window.innerHeight;

// Variable to hold the currently selected model mesh
let selectedModelMesh: THREE.Mesh<any, any, any> | null = null;

// Array to hold selectable objects in the scene
let selectableObjects: THREE.Object3D[] = [];

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
                selectableObjects.push(model);
                adjustYPositionOfObjectToBeOnFloor(model);
                resolve(model);
                scene.add(model);
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

// Create a single geometry and material to reuse for both spheres
const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white });

// Create the first sphere and set its position
const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere1.position.set(-1, 0.5, 0);
scene.add(sphere1);
selectableObjects.push(sphere1);

// Create the second sphere and set its position
const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere2.position.set(1, 0.5, 0);
scene.add(sphere2);
selectableObjects.push(sphere2);


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
                reject(new Error('Failed to read file.'));
            }
        };
        reader.onerror = () => {
            reject(reader.error || new Error('Unknown FileReader error'));
        };
        reader.readAsDataURL(file);
    });
}

// Create a raycaster and a mouse vector to handle object selection
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Add an event listener for mouse down events to handle object selection
renderer.domElement.addEventListener('mousedown', onMouseDown, false);

// Create a selection indicator to show the selected object
const selectionIndicatorGeometry = new THREE.SphereGeometry(0.1, 10, 10);
const selectionIndicatorMaterial = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white, transparent: true, opacity: 0.5 });
const selectionIndicator = new THREE.Mesh(selectionIndicatorGeometry, selectionIndicatorMaterial);
selectionIndicator.visible = false; 
scene.add(selectionIndicator);

function onMouseDown(event: { preventDefault: () => void; clientX: number; clientY: number; }) {
    // Prevent text selection or other default browser behaviors
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with selectable objects
    const intersects = raycaster.intersectObjects(selectableObjects, true);

    if (intersects.length > 0) {

        // Selects closest selectable object
        const clickedObject = intersects[0].object;

        if (clickedObject instanceof THREE.Mesh) {

            // Set the new selected model
            selectedModelMesh = clickedObject;
            selectedModelMesh.geometry.computeBoundingSphere();
            const worldPos = selectedModelMesh.getWorldPosition(new THREE.Vector3());

            // Enable the selection indicator and position it above the selected model
            selectionIndicator.visible = true;
            selectionIndicator.position.set(
                worldPos.x,
                worldPos.y + selectedModelMesh.geometry.boundingSphere.radius + 0.2,
                worldPos.z
            );

        }

    } else {
        // If no selectable object was clicked, deselect the current model
        if (selectedModelMesh) {
            selectionIndicator.visible = false;
            selectedModelMesh = null;
        }
    }
}

// Animate function, used to render the scene continuously
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

// Function to adjust the Y position of an object so that it appears on the floor
function adjustYPositionOfObjectToBeOnFloor(model: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const newY = size.y / 2;
    model.position.y = newY;
}

// Start the animation loop
animate();
