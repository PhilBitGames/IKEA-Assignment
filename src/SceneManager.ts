// SceneManager.ts
import * as THREE from 'three';

export class SceneManager {
    private _selectableObjects: THREE.Object3D[] = [];

    private _scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this._scene = scene;
    }

    public initializeScene(): void {

        // Set up the scene
        this._scene.background = new THREE.Color(THREE.Color.NAMES.grey);

        // Set up directional and ambient lights
        const directionalLight = new THREE.DirectionalLight(THREE.Color.NAMES.white, 1);
        directionalLight.position.set(4, 4, 2);
        this._scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(THREE.Color.NAMES.white, 2);
        this._scene.add(ambientLight);

        //Create a plane to serve as the ground
        const planeGeometry = new THREE.PlaneGeometry(5, 5, 1);
        const planeMaterial = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        this._scene.add(plane);
    }

    // Public accessor for selectableObjects
    public get selectableObjects(): THREE.Object3D[] {
        return this._selectableObjects;
    }

    public addModelToScene(model: THREE.Object3D): void {
        this._scene.add(model);
        this.selectableObjects.push(model);
        this.adjustYPositionOfObjectToBeOnFloor(model);
    }

    // Function to adjust the Y position of an object so that it appears on the floor
    private adjustYPositionOfObjectToBeOnFloor(model: THREE.Object3D): void {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const newY = size.y / 2;
        model.position.y = newY;
    }
}