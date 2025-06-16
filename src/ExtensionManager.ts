import * as THREE from 'three';

export class ExtensionManager {

    private _onAnimatedSelectedModel: ((currentlyAnimatingMesh: THREE.Mesh | null) => void) | null = null;

    public animateXScale(selectedModelMesh: THREE.Mesh) {
        // Set duration of extension animation to 200 milliseconds
        const duration = 200;
        const startTime = performance.now();
        const startScale = selectedModelMesh.userData.currentScale || 1;

        // For now, extent the selected model by 1 unit in the X direction
        const endScale = startScale + 1;
        const mesh = selectedModelMesh;

        const animateScale = (now: number) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const newScale = startScale + (endScale - startScale) * t;

            // if something happens to the mesh's existence, stop the animation
            if (!mesh) return;

            // Scale the mesh in the X direction
            this.scaleObjectMeshInXDirection(mesh as THREE.Mesh, newScale);

            // Trigger callback with currently animating mesh
            this._onAnimatedSelectedModel?.(mesh);

            // Continue the animation until the duration is reached
            if (t < 1) {
                requestAnimationFrame(animateScale);
            }
            // Update the current scale in userData for future reference
            mesh.userData.currentScale = newScale;
        }

        // Start the extension animation
        requestAnimationFrame(animateScale);
    }

    public onAnimatedSelectedModel(callback: (currentlyAnimatingMesh: THREE.Mesh | null) => void): void {
        this._onAnimatedSelectedModel = callback;
    }

    private scaleObjectMeshInXDirection(mesh: THREE.Mesh, scaleFactor: number) {
        const geometry = mesh.geometry;
        if (geometry instanceof THREE.BufferGeometry) {
            const positionAttribute = geometry.attributes.position;
            if (positionAttribute) {

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

                const originalPositions = mesh.userData.originalPositions;
                const currentPositions = positionAttribute.array;
                const vertexXValueCount = originalPositions.length / 3;

                for (let i = 0; i < vertexXValueCount; i++) {
                    // Scale the X position of each vertex
                    currentPositions[i * 3] = ((originalPositions[i * 3] - xMin) * scaleFactor) + xMin;
                }
                positionAttribute.needsUpdate = true;
                geometry.computeBoundingBox();
                geometry.computeBoundingSphere();
            }
        }
    }

}