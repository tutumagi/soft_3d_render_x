import { Camera } from "./camera";
import { Mesh } from "./mesh";

export class Device {
    private backbuffer?: ImageData;
    private workingCanvas: HTMLCanvasElement;
    private workingContext: CanvasRenderingContext2D;
    private workingWidth: number;
    private workingHeight: number;

    private backbufferdata?: Uint8ClampedArray;

    constructor(canvas: HTMLCanvasElement) {
        this.workingCanvas = canvas;
        this.workingWidth = canvas.width;
        this.workingHeight = canvas.height;

        this.workingContext = this.workingCanvas.getContext("2d")!;
    }

    public clear(): void {
        this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
        this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
    }

    public present() {
        this.workingContext.putImageData(this.backbuffer!, 0, 0);
    }

    public putPixel(x: number, y: number, color: BABYLON.Color4) {
        this.backbufferdata = this.backbuffer!.data;

        const index: number = ((x >> 0) + (y >> 0) * this.workingWidth) * 4;

        this.backbufferdata[index] = color.r * 255;
        this.backbufferdata[index + 1] = color.g * 255;
        this.backbufferdata[index + 2] = color.b * 255;
        this.backbufferdata[index + 3] = color.a * 255;
    }

    public project(coord: BABYLON.Vector3, transMat: BABYLON.Matrix): BABYLON.Vector2 {
        const point = BABYLON.Vector3.TransformCoordinates(coord, transMat);

        const x = (point.x * this.workingWidth + this.workingWidth / 2.0) >> 0;
        const y = (-point.y * this.workingHeight + this.workingHeight / 2.0) >> 0;

        return new BABYLON.Vector2(x, y);
    }

    public drawPoint(point: BABYLON.Vector2) {
        if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
            this.putPixel(point.x, point.y, new BABYLON.Color4(1, 1, 0, 1));
        }
    }

    /** 绘制线条 是一个 递归绘制起始点 - 中间点 - 结束点（总共 3 pixel）的过程 */
    public drawLine(point0: BABYLON.Vector2, point1: BABYLON.Vector2): void {
        const dist = point1.subtract(point0).length();

        if (dist < 2) {
            return;
        }

        const middlePoint = point0.add(point1.subtract(point0).scale(0.5));

        this.drawPoint(middlePoint);

        this.drawLine(point0, middlePoint);
        this.drawLine(middlePoint, point1);
    }

    public drawBline(point0: BABYLON.Vector2, point1: BABYLON.Vector2): void {
        let x0 = point0.x >> 0;
        let y0 = point0.y >> 0;
        const x1 = point1.x >> 0;
        const y1 = point1.y >> 0;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);

        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;

        let err = dx - dy;

        while (true) {
            this.drawPoint(new BABYLON.Vector2(x0, y0));
            if (x0 == x1 && y0 == y1) {
                break;
            }
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    public render(camera: Camera, meshes: Mesh[]) {
        const viewMatrix = BABYLON.Matrix.LookAtLH(camera.position, camera.target, BABYLON.Vector3.Up());

        const projectMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);

        for (const cMesh of meshes) {
            const worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(
                cMesh.rotation.y,
                cMesh.rotation.x,
                cMesh.rotation.z,
            ).multiply(BABYLON.Matrix.Translation(cMesh.postion.x, cMesh.postion.y, cMesh.postion.z));

            const transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectMatrix);

            /** draw points */
            // for (const indexVertex of cMesh.vertices) {
            //     const projectPoint = this.project(indexVertex, transformMatrix);
            //     this.drawPoint(projectPoint);
            // }

            /** draw lines */
            // for (let i = 0; i < cMesh.vertices.length - 1; i++) {
            //     const point0 = this.project(cMesh.vertices[i], transformMatrix);
            //     const point1 = this.project(cMesh.vertices[i + 1], transformMatrix);
            //     this.drawLine(point0, point1);
            // }

            /** draw faces */
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < cMesh.faces.length; i++) {
                const currentFace = cMesh.faces[i];

                const vertexA = cMesh.vertices[currentFace.A];
                const vertexB = cMesh.vertices[currentFace.B];
                const vertexC = cMesh.vertices[currentFace.C];

                const pixelA = this.project(vertexA, transformMatrix);
                const pixelB = this.project(vertexB, transformMatrix);
                const pixelC = this.project(vertexC, transformMatrix);

                // this.drawLine(pixelA, pixelB);
                // this.drawLine(pixelB, pixelC);
                // this.drawLine(pixelC, pixelA);
                this.drawBline(pixelA, pixelB);
                this.drawBline(pixelB, pixelC);
                this.drawBline(pixelC, pixelA);

                // console.log(`draw ${vertexA.toString()} ${vertexB.toString()} ${vertexC.toString()}`);
            }
        }
    }
}
