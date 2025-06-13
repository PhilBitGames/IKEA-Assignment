import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelImportManager {
    private _gltfLoader: GLTFLoader;

    constructor() {
        this._gltfLoader = new GLTFLoader();
    }

    // Generalized function to load a GLB model from a URL or Data URL
    private loadGLBModel(source: string): Promise<THREE.Group> {
        return new Promise((resolve, reject) => {
            this._gltfLoader.load(
                source,
                (gltf) => {
                    const model = gltf.scene;
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

    // Function to load a GLB model from a file input
    public loadGLBModelFromInputFile(file: File): Promise<THREE.Group> {
        return new Promise((resolve, reject) => {
            if (!file.name.endsWith('.glb')) {
                reject(new Error('Please select a .glb file.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target && event.target.result) {
                    this.loadGLBModel(event.target.result as string)
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
}