export class Camera {
    public position: BABYLON.Vector3;
    public target: BABYLON.Vector3;

    constructor() {
        this.position = BABYLON.Vector3.Zero();
        this.target = BABYLON.Vector3.Zero();
    }
}
