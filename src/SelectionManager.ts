import * as THREE from 'three';

export class SelectionManager {
    private _raycaster: THREE.Raycaster;
    private _mouse: THREE.Vector2;
    private _camera: THREE.Camera;
    private _selectableObjects: THREE.Object3D[]; // Reference to the list of selectable objects

    private _selectedModelMesh: THREE.Mesh | null = null;
    private _selectionIndicator: THREE.Mesh;

    // Callback for selection change
    private _onSelectionChangeCallback: ((selectedMesh: THREE.Mesh | null) => void) | null = null;

    constructor(camera: THREE.Camera, selectableObjects: THREE.Object3D[]) {
        this._camera = camera;
        this._selectableObjects = selectableObjects;

        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();

        // Create a selection indicator to show the selected object
        const selectionIndicatorGeometry = new THREE.SphereGeometry(0.1, 10, 10);
        const selectionIndicatorMaterial = new THREE.MeshStandardMaterial({ color: THREE.Color.NAMES.white, transparent: true, opacity: 0.5 });
        this._selectionIndicator = new THREE.Mesh(selectionIndicatorGeometry, selectionIndicatorMaterial);
        this._selectionIndicator.visible = false;
    }

    public get selectionIndicator(): THREE.Mesh {
        return this._selectionIndicator;
    }

    public getSelectedModelMesh(): THREE.Mesh | null {
        return this._selectedModelMesh;
    }

    public onSelectionChange(callback: (selectedMesh: THREE.Mesh | null) => void): void {
        this._onSelectionChangeCallback = callback;
    }

    public onMouseDown(event: MouseEvent): void {
        event.preventDefault();

        this._mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this._mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this._raycaster.setFromCamera(this._mouse, this._camera);

        // Check for intersections with selectable objects
        const intersects = this._raycaster.intersectObjects(this._selectableObjects, true);

        if (intersects.length > 0) {
            // Selects closest selectable object
            const clickedObject = intersects[0].object;

            if (clickedObject instanceof THREE.Mesh) {
                
                // Set the new selected model
                this._selectedModelMesh = clickedObject;
                this._selectedModelMesh.geometry.computeBoundingSphere();

                this.repositionSelectionIndicator();

                this._selectionIndicator.visible = true;
            }
        } else {
            // If no selectable object was clicked, deselect the current model
            this._selectionIndicator.visible = false;
            this._selectedModelMesh = null;
        }

        
        if (this._onSelectionChangeCallback) {
            this._onSelectionChangeCallback(this._selectedModelMesh);
        }
    }

    public repositionSelectionIndicator(): void {
        if (this._selectedModelMesh) {
            const box = new THREE.Box3().setFromObject(this._selectedModelMesh);
            const center = new THREE.Vector3();
            box.getCenter(center);

            this._selectionIndicator.position.set(
                center.x,
                box.max.y + 0.2, // Slightly above the object
                center.z
            );
        }
    }
}