export interface Face {
    A: number;
    B: number;
    C: number;
}

export interface Vertex {
    normal: BABYLON.Vector3; // 存储点的法向量，可以直接从现有的3d渲染软件的导出文件中获取
    coordinates: BABYLON.Vector3; // local
    worldCoordinates: BABYLON.Vector3; // world
}

export class Mesh {
    public postion: BABYLON.Vector3;
    public rotation: BABYLON.Vector3;
    public vertices: Vertex[];
    public faces: Face[];

    constructor(public name: string, verticesCount: number, facesCount: number) {
        this.vertices = new Array(verticesCount);
        this.faces = new Array(facesCount);
        this.rotation = BABYLON.Vector3.Zero();
        this.postion = BABYLON.Vector3.Zero();
    }
}

export interface ScanLineData {
    currentY?: number;
    ndotla?: number;
    ndotlb?: number;
    ndotlc?: number;
    ndotld?: number;
}
