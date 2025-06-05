import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const width = window.innerWidth;
const height = window.innerHeight;

// Create a WebGL renderer and attach it to the HTML canvas
const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('app') as HTMLCanvasElement});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
camera.position.set(0, -4, 3);
camera.up.set(0, 0, 1); 

// Set up the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(THREE.Color.NAMES.grey);

// Set up directional and ambient lights
const directionalLight = new THREE.DirectionalLight(THREE.Color.NAMES.white, 1);
directionalLight.position.set(4,4,2);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(THREE.Color.NAMES.white, 2);
scene.add(ambientLight);

// Set up orbit controls for camera manipulation
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 10;
controls.target.set(0, 0, 0);

// Create a cube and a plane (Just to visualize the scene)
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1); 
const cubeMaterial = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.blue }); 
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 0, 1);
scene.add(cube);

const planeGeometry = new THREE.PlaneGeometry(5, 5, 1); 
const planeMaterial = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white}); 
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.position.set(0, 0, 0);
scene.add(plane);

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
