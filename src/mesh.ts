export interface Face {
    A: number;
    B: number;
    C: number;
}

export class Mesh {
    public postion: BABYLON.Vector3;
    public rotation: BABYLON.Vector3;
    public vertices: BABYLON.Vector3[];
    public faces: Face[];

    constructor(public name: string, verticesCount: number, facesCount: number) {
        this.vertices = new Array(verticesCount);
        this.faces = new Array(facesCount);
        this.rotation = BABYLON.Vector3.Zero();
        this.postion = BABYLON.Vector3.Zero();
    }
}
