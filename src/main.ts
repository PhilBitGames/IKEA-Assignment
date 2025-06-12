import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { select } from 'three/tsl';

// Used to import GLB models into the scene
const gltfLoader = new GLTFLoader();

const width = window.innerWidth;
const height = window.innerHeight;

// Variable to hold the currently selected model mesh
let selectedModelMesh: THREE.Mesh | null = null;

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

// Set up the import button and file input and their event listeners
const extendButton = document.getElementById('extendButton') as HTMLButtonElement;
extendButton.disabled = selectedModelMesh === null;

// Update button state when selection changes
function updateExtendButtonState() {
    extendButton.disabled = selectedModelMesh === null;
}

extendButton.addEventListener('click', () => {
    if (!selectedModelMesh) return;
    // Set duration of extension animation to 200 milliseconds
    const duration = 200;
    const startTime = performance.now();
    const startScale = selectedModelMesh.userData.currentScale || 1;
    
    // For now, extent the selected model by 1 unit in the X direction
    const endScale = startScale + 1;
    const mesh = selectedModelMesh;

    function animateScale(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const newScale = startScale + (endScale - startScale) * t;

        // if something happens to the mesh's existence, stop the animation
        if (!mesh) {
            return;
        }

        // Scale the mesh in the X direction
        scaleObjectMeshInXDirection(mesh as THREE.Mesh, newScale);
        
        // while extending the mesh, if it is still the selected model, update the selection indicator position
        if(mesh === selectedModelMesh) {
            repositionSelectionIndicator();
        }
        // Continue the animation until the duration is reached
        if (t < 1) {
            requestAnimationFrame(animateScale);
        }
        // Update the current scale in userData for future reference
        mesh.userData.currentScale = newScale;
    }

    // Start the extension animation
    requestAnimationFrame(animateScale);
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

// Two spheres to demonstrate selectable objects
const sphereGeometry1 = new THREE.SphereGeometry(0.5, 16, 16);
const sphereMaterial1 = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white });
const sphere1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
sphere1.position.set(-1, 0.5, 0);
scene.add(sphere1);
selectableObjects.push(sphere1);

// const sphereGeometry2 = new THREE.SphereGeometry(0.5, 16, 16);
// const sphereMaterial2 = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white });
// const sphere2 = new THREE.Mesh(sphereGeometry2, sphereMaterial2);
// sphere2.position.set(1, 0.5, 0);
// scene.add(sphere2);
// selectableObjects.push(sphere2);


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

function scaleObjectMeshInXDirection(mesh: THREE.Mesh, scaleFactor = 2) {
    const geometry = mesh.geometry;
    if (geometry instanceof THREE.BufferGeometry) {
        const positionAttribute = geometry.attributes.position;
        if (positionAttribute) {
            let originalPositions;

            // Store a copy of the original positions array in the mesh's userData
            if (!mesh.userData.originalPositions) {
                mesh.userData.originalPositions = positionAttribute.array.slice() as Float32Array;
            }
            
            // Ensure bounding box is computed and not null
            if (!geometry.boundingBox) {
                geometry.computeBoundingBox();
            }

            // Get the minimum X value from the bounding box
            const xMin = geometry.boundingBox ? geometry.boundingBox.min.x : 0;

            originalPositions = mesh.userData.originalPositions;
            const currentPositions = positionAttribute.array;
            const vertexXValueCount = originalPositions.length / 3;

            for (let i = 0; i < vertexXValueCount; i++) {
                currentPositions[i * 3] = ((originalPositions[i * 3] - xMin) * scaleFactor) + xMin; // Scale X by 2
            }
            positionAttribute.needsUpdate = true;
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere(); 
        }
    }
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

            repositionSelectionIndicator();

            selectionIndicator.visible = true;
        }

    } else {
        // If no selectable object was clicked, deselect the current model
        if (selectedModelMesh) {
            selectionIndicator.visible = false;
            selectedModelMesh = null;
        }
    }
    updateExtendButtonState();
}

function repositionSelectionIndicator() {
    if (selectedModelMesh) {
        const box = new THREE.Box3().setFromObject(selectedModelMesh);
        const center = new THREE.Vector3();
        box.getCenter(center);

        selectionIndicator.position.set(
            center.x,
            box.max.y + 0.2,
            center.z
        );
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
