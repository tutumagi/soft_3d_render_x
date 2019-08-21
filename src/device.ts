import { Camera } from "./camera";
import { Mesh } from "./mesh";

export class Device {
    private backbuffer?: ImageData;
    private workingCanvas: HTMLCanvasElement;
    private workingContext: CanvasRenderingContext2D;
    private workingWidth: number;
    private workingHeight: number;
    // equals to backbuffer.data
    private backbufferdata?: Uint8ClampedArray;
    // 缓存每个像素点的 z-buffer，如果后面绘制的z index 大于当前的，则忽略，否则覆盖当前的像素
    private depthbuffer: number[];

    constructor(canvas: HTMLCanvasElement) {
        this.workingCanvas = canvas;
        this.workingWidth = canvas.width;
        this.workingHeight = canvas.height;

        this.workingContext = this.workingCanvas.getContext("2d")!;

        this.depthbuffer = new Array(this.workingWidth * this.workingHeight);
    }

    public clear(): void {
        this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
        this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);

        for (let i = 0; i < this.depthbuffer.length; ++i) {
            // 填一个大一点的数字
            this.depthbuffer[i] = 1000000;
        }
    }

    public present() {
        this.workingContext.putImageData(this.backbuffer!, 0, 0);
    }

    public putPixel(x: number, y: number, z: number, color: BABYLON.Color4) {
        this.backbufferdata = this.backbuffer!.data;

        const index: number = (x >> 0) + (y >> 0) * this.workingWidth;
        const index4: number = index * 4;

        if (this.depthbuffer[index] < z) {
            return; // Discard
        }
        this.depthbuffer[index] = z;

        this.backbufferdata[index4] = color.r * 255;
        this.backbufferdata[index4 + 1] = color.g * 255;
        this.backbufferdata[index4 + 2] = color.b * 255;
        this.backbufferdata[index4 + 3] = color.a * 255;
    }

    /**
     * Project takes some 3D coordinates and transform them
     * in 2D coordinates using the transformation matrix
     */
    public project(coord: BABYLON.Vector3, transMat: BABYLON.Matrix): BABYLON.Vector3 {
        // transforming the coordinates
        const point = BABYLON.Vector3.TransformCoordinates(coord, transMat);

        // The transformed coordinates will be based on coordinate system
        // starting on the center of the screen. But drawing on screen normally starts
        // from top left. We then need to transform them again to have x:0, y:0 on top left
        const x = (point.x * this.workingWidth + this.workingWidth / 2.0) >> 0;
        const y = (-point.y * this.workingHeight + this.workingHeight / 2.0) >> 0;

        return new BABYLON.Vector3(x, y, point.z);
    }

    /**
     * `drawPoint` calls putPixel but does the clipping operation before
     * @param point
     */
    public drawPoint(point: BABYLON.Vector3, color: BABYLON.Color4) {
        // Clipping what's visible on screen
        if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
            // Drawing a yellow point
            this.putPixel(point.x, point.y, point.z, color);
        }
    }

    /**
     * Clamping values to keep them between min and max
     * @param value 待修正值
     * @param min{=0} 最小值
     * @param max{=1} 最大值
     */
    public clamp(value: number, min: number = 0, max: number = 1): number {
        return Math.max(min, Math.min(value, max));
    }

    /**
     * Interpolating the value between 2 vertices
     * min is the starting point, max the ending point
     * and gradient the % between the 2 points
     * 根据 gradient系数 获取 从 `min` 到 `max` 的中间值
     * @param min
     * @param max
     * @param gradient
     */
    public interpolate(min: number, max: number, gradient: number): number {
        return min + (max - min) * this.clamp(gradient);
    }

    /**
     * drawing line between 2 points from left to right
     * pa pb -> pc pd
     * pa,pb,pc,pd must then be sorted before
     * @param y
     * @param pa
     * @param pb
     * @param pc
     * @param pd
     * @param color
     */
    public processScanLine(
        y: number,
        pa: BABYLON.Vector3,
        pb: BABYLON.Vector3,
        pc: BABYLON.Vector3,
        pd: BABYLON.Vector3,
        color: BABYLON.Color4,
    ): void {
        // thanks to current Y, we can compute the gradient to compute others values like
        // the starting X(sx) and ending X (es) to draw between
        // if pa.Y == pb.Y or pc.Y == pd.Y, gradient is forced to 1
        const gradient1 = pa.y != pb.y ? (y - pa.y) / (pb.y - pa.y) : 1;
        const gradient2 = pa.y != pb.y ? (y - pc.y) / (pd.y - pc.y) : 1;
        const sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
        const ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

        // starting Z &  ending Z
        const z1: number = this.interpolate(pa.z, pb.z, gradient1);
        const z2: number = this.interpolate(pc.z, pd.z, gradient2);

        // drawing a line from left (sx) to right (ex)
        for (let x = sx; x < ex; x++) {
            // normalisation pour dessiner de gauche à droite
            const gradient: number = (x - sx) / (ex - sx);

            const z = this.interpolate(z1, z2, gradient);

            this.drawPoint(new BABYLON.Vector3(x, y, z), color);
        }
    }

    public drawTriangle(p1: BABYLON.Vector3, p2: BABYLON.Vector3, p3: BABYLON.Vector3, color: BABYLON.Color4): void {
        // Sorting the points in order to always have this order on screen p1, p2 & p3
        // with p1 always up (thus having the Y the lowest possible to be near the top screen)
        // then p2 between p1 & p3 (according to Y-axis up to down )
        if (p1.y > p2.y) {
            const temp = p2;
            p2 = p1;
            p1 = temp;
        }

        if (p2.y > p3.y) {
            const temp = p2;
            p2 = p3;
            p3 = temp;
        }

        if (p1.y > p2.y) {
            const temp = p2;
            p2 = p1;
            p1 = temp;
        }
        // sort end

        // inverse slopes
        let dP1P2: number;
        let dP1P3: number;

        // http://en.wikipedia.org/wiki/Slope
        // Computing slopes
        if (p2.y - p1.y > 0) {
            dP1P2 = (p2.x - p1.x) / (p2.y - p1.y);
        } else {
            dP1P2 = 0;
        }

        if (p3.y - p1.y > 0) {
            dP1P3 = (p3.x - p1.x) / (p3.y - p1.y);
        } else {
            dP1P3 = 0;
        }

        // First case where triangles are like that:
        //         p1
        //           Λ
        //          ╱ ╲
        //         ╱   ╲
        //        ╱     ╲
        //       ╱       ╲
        //      ╱         ╲
        //     ╱           ╲
        //    ╱               ▏p2
        //  ╱
        // p3 ▕─────────────
        // p2 on right
        if (dP1P2 > dP1P3) {
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (y < p2.y) {
                    // scan p1p3 p1p2
                    this.processScanLine(y, p1, p3, p1, p2, color);
                } else {
                    // scan p1p3 p2p3
                    this.processScanLine(y, p1, p3, p2, p3, color);
                }
            }
        } else {
            // p2 on left
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                if (y < p2.y) {
                    // scan p1p2 p1p3
                    this.processScanLine(y, p1, p2, p1, p3, color);
                } else {
                    // scan p2p3 p1p3
                    this.processScanLine(y, p2, p3, p1, p3, color);
                }
            }
        }
    }

    /** 绘制线条 是一个 递归绘制起始点 - 中间点 - 结束点（总共 3 pixel）的过程 */
    // public drawLine(point0: BABYLON.Vector2, point1: BABYLON.Vector2): void {
    //     const dist = point1.subtract(point0).length();

    //     if (dist < 2) {
    //         return;
    //     }

    //     const middlePoint = point0.add(point1.subtract(point0).scale(0.5));

    //     this.drawPoint(middlePoint, new BABYLON.Color4(1, 1, 0, 1));

    //     this.drawLine(point0, middlePoint);
    //     this.drawLine(middlePoint, point1);
    // }

    /**
     * [Bresenham's_line_algorithm](https://en.wikipedia.org/wiki/Bresenham's_line_algorithm)
     * 更平滑的绘制线条的算法
     */
    // public drawBline(point0: BABYLON.Vector2, point1: BABYLON.Vector2, color: BABYLON.Color4): void {
    //     let x0 = point0.x >> 0;
    //     let y0 = point0.y >> 0;
    //     const x1 = point1.x >> 0;
    //     const y1 = point1.y >> 0;
    //     const dx = Math.abs(x1 - x0);
    //     const dy = Math.abs(y1 - y0);

    //     const sx = x0 < x1 ? 1 : -1;
    //     const sy = y0 < y1 ? 1 : -1;

    //     let err = dx - dy;

    //     while (true) {
    //         this.drawPoint(new BABYLON.Vector2(x0, y0), color);
    //         if (x0 == x1 && y0 == y1) {
    //             break;
    //         }
    //         const e2 = 2 * err;
    //         if (e2 > -dy) {
    //             err -= dy;
    //             x0 += sx;
    //         }
    //         if (e2 < dx) {
    //             err += dx;
    //             y0 += sy;
    //         }
    //     }
    // }

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
                // this.drawBline(pixelA, pixelB);
                // this.drawBline(pixelB, pixelC);
                // this.drawBline(pixelC, pixelA);

                const color: number = 0.25 + ((i % cMesh.faces.length) / cMesh.faces.length) * 0.75;

                /** draw triangle */
                this.drawTriangle(pixelA, pixelB, pixelC, new BABYLON.Color4(color, color, color, 1));

                // console.log(`draw ${vertexA.toString()} ${vertexB.toString()} ${vertexC.toString()}`);
            }
        }
    }
}
