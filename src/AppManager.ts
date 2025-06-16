import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { SceneManager } from './SceneManager';
import { ModelImportManager } from './ModelImportManager';
import { UIManager } from './UIManager';
import { SelectionManager } from './SelectionManager';
import { ExtensionManager } from './ExtensionManager';

export class AppManager {
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private controls: OrbitControls;

    private sceneManager: SceneManager;
    private modelLoader: ModelImportManager;
    private uiManager: UIManager;
    private selectionManager: SelectionManager;
    private extensionManager: ExtensionManager;

    constructor() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Set up the renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('app') as HTMLCanvasElement });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(width, height);

        // Set up the camera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
        this.camera.position.set(0, 1, 3);
        this.camera.up.set(0, 1, 0);

        this.scene = new THREE.Scene();

        // Set up orbit controls for camera manipulation
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        this.controls.target.set(0, 1, 0);

        this.sceneManager = new SceneManager(this.scene);
        this.modelLoader = new ModelImportManager();
        this.uiManager = new UIManager();
        this.selectionManager = new SelectionManager(this.camera, this.sceneManager.selectableObjects);
        this.extensionManager = new ExtensionManager();

        this.scene.add(this.selectionManager.selectionIndicator);

        this.setupEventHandlers();
    }

    // Connects UI functionality to the model loader and scene manager
    private setupEventHandlers() {
        window.addEventListener('resize', this.handleResize.bind(this));

        this.renderer.domElement.addEventListener('mousedown', this.selectionManager.onMouseDown.bind(this.selectionManager), false);

        this.uiManager.onImportButtonClick((file: File) => {
            this.modelLoader.loadGLBModelFromInputFile(file)
                .then(model => {
                    this.sceneManager.addModelToScene(model);
                })
                .catch(error => console.error('Error loading model:', error));
        });

        this.uiManager.onExtendButtonClick(() => {
            const selectedMesh = this.selectionManager.SelectedModelMesh;
            if (selectedMesh) {
                this.extensionManager.animateXScale(selectedMesh);
            }
        });

        // If the selected model is currently animating, reposition the selection indicator
        this.extensionManager.onAnimatedSelectedModel((currentlyAnimatingMesh: THREE.Mesh | null) => {
            if (this.selectionManager.SelectedModelMesh === currentlyAnimatingMesh) {
                this.selectionManager.repositionSelectionIndicator();
            }
        });

        // Update UI based on selection changes
        this.selectionManager.onSelectionChange((selectedMesh: THREE.Mesh | null) => {
            this.uiManager.updateExtendButtonState(selectedMesh === null);
        });


    }

    // Handle window resize events to adjust camera and renderer
    private handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public start() {
        this.sceneManager.initializeScene();

        // Example selectable spheres
        const sphereGeometry1 = new THREE.SphereGeometry(0.5, 16, 16);
        const sphereMaterial1 = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white });
        const sphere1 = new THREE.Mesh(sphereGeometry1, sphereMaterial1);
        sphere1.position.set(-1, 0.5, 0);
        this.sceneManager.addModelToScene(sphere1);

        this.animate();
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}