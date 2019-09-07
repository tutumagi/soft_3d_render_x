import { Camera } from "./camera";
import { Mesh, ScanLineData, Vertex } from "./mesh";
import { Texture } from "./texture";

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
    public project(vertex: Vertex, transMat: BABYLON.Matrix, world: BABYLON.Matrix): Vertex {
        // transforming the coordinates
        const point2d = BABYLON.Vector3.TransformCoordinates(vertex.coordinates, transMat);
        const point3dWorld = BABYLON.Vector3.TransformCoordinates(vertex.coordinates, world);
        const normal3dWorld = BABYLON.Vector3.TransformCoordinates(vertex.normal, world);

        // The transformed coordinates will be based on coordinate system
        // starting on the center of the screen. But drawing on screen normally starts
        // from top left. We then need to transform them again to have x:0, y:0 on top left
        const x = (point2d.x * this.workingWidth + this.workingWidth / 2.0) >> 0;
        const y = (-point2d.y * this.workingHeight + this.workingHeight / 2.0) >> 0;

        // return new BABYLON.Vector3(x, y, point.z);
        return {
            coordinates: new BABYLON.Vector3(x, y, point2d.z),
            normal: normal3dWorld,
            worldCoordinates: point3dWorld,
            TextureCoordinates: vertex.TextureCoordinates,
        };
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
        data: ScanLineData,
        va: Vertex,
        vb: Vertex,
        vc: Vertex,
        vd: Vertex,
        color: BABYLON.Color4,
        texture?: Texture,
    ): void {
        const pa = va.coordinates;
        const pb = vb.coordinates;
        const pc = vc.coordinates;
        const pd = vd.coordinates;
        // thanks to current Y, we can compute the gradient to compute others values like
        // the starting X(sx) and ending X (es) to draw between
        // if pa.Y == pb.Y or pc.Y == pd.Y, gradient is forced to 1
        const gradient1 = pa.y != pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
        const gradient2 = pa.y != pb.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;

        const sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
        const ex = this.interpolate(pc.x, pd.x, gradient2) >> 0;

        // starting Z &  ending Z
        const z1: number = this.interpolate(pa.z, pb.z, gradient1);
        const z2: number = this.interpolate(pc.z, pd.z, gradient2);

        // interpolating normals on Y
        const snl = this.interpolate(data.ndotla, data.ndotlb, gradient1);
        const enl = this.interpolate(data.ndotlc, data.ndotld, gradient2);

        // interpolating texture coordinates on Y
        const su = this.interpolate(data.ua, data.ub, gradient1);
        const eu = this.interpolate(data.uc, data.ud, gradient2);
        const sv = this.interpolate(data.va, data.vb, gradient1);
        const ev = this.interpolate(data.vc, data.vd, gradient2);

        // drawing a line from left (sx) to right (ex)
        for (let x = sx; x < ex; x++) {
            // normalisation pour dessiner de gauche à droite
            const gradient: number = (x - sx) / (ex - sx);

            const z = this.interpolate(z1, z2, gradient);

            const ndotl = this.interpolate(snl, enl, gradient);
            const u = this.interpolate(su, eu, gradient);
            const v = this.interpolate(sv, ev, gradient);

            // 光源向量和面的法向量的夹角cos值
            // const ndotl = data.ndotla;

            let textureColor;
            if (texture) {
                textureColor = texture.map(u, v);
            } else {
                textureColor = new BABYLON.Color4(1, 1, 1, 1);
            }
            // changing the color value using the cosine of the angle
            // between the light vector and the normal vector
            this.drawPoint(
                new BABYLON.Vector3(x, data.currentY, z),
                new BABYLON.Color4(
                    color.r * ndotl * textureColor.r,
                    color.g * ndotl * textureColor.g,
                    color.b * ndotl * textureColor.b,
                    1,
                ),
                // color,
            );
        }
    }

    /**
     * 计算 光源向量（灯源坐标 - 顶点坐标）和法向量的夹角的cos值，返回值0 到 1
     *
     * normal vector • light vector
     * @param vertex
     * @param normal
     * @param lightPosition
     */
    public computeNDotL(vertex: BABYLON.Vector3, normal: BABYLON.Vector3, lightPosition: BABYLON.Vector3): number {
        const lightDirection = lightPosition.subtract(vertex);
        normal.normalize();
        lightDirection.normalize();

        return Math.max(0, BABYLON.Vector3.Dot(normal, lightDirection));
    }

    public drawTriangle(v1: Vertex, v2: Vertex, v3: Vertex, color: BABYLON.Color4, texture?: Texture): void {
        // Sorting the points in order to always have this order on screen p1, p2 & p3
        // with p1 always up (thus having the Y the lowest possible to be near the top screen)
        // then p2 between p1 & p3 (according to Y-axis up to down )
        if (v1.coordinates.y > v2.coordinates.y) {
            const temp = v1;
            v2 = v1;
            v1 = temp;
        }

        if (v2.coordinates.y > v3.coordinates.y) {
            const temp = v2;
            v2 = v3;
            v3 = temp;
        }

        if (v1.coordinates.y > v2.coordinates.y) {
            const temp = v2;
            v2 = v1;
            v1 = temp;
        }
        // sort end

        const p1 = v1.coordinates;
        const p2 = v2.coordinates;
        const p3 = v3.coordinates;

        // normal face's vector is the average normal between each vertex's normal
        // computing also the center point of the face
        // // 面的法向量
        // const vnFace = v1.normal.add(v2.normal.add(v3.normal)).scale(1 / 3);
        // // 面的中心点
        // const centerPoint = v1.worldCoordinates.add(v2.worldCoordinates.add(v3.worldCoordinates)).scale(1 / 3);
        // light position
        const lightPos = new BABYLON.Vector3(0, 10, 10);
        // 计算光源向量和面的法向量的夹角cos值
        // const ndotl = this.computeNDotL(centerPoint, vnFace, lightPos);
        const nl1 = this.computeNDotL(v1.worldCoordinates, v1.normal, lightPos);
        const nl2 = this.computeNDotL(v2.worldCoordinates, v2.normal, lightPos);
        const nl3 = this.computeNDotL(v3.worldCoordinates, v3.normal, lightPos);

        const data: ScanLineData = {};

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
                data.currentY = y;
                if (y < p2.y) {
                    data.ndotla = nl1;
                    data.ndotlb = nl3;
                    data.ndotlc = nl1;
                    data.ndotld = nl2;

                    data.ua = v1.TextureCoordinates.x;
                    data.ub = v3.TextureCoordinates.x;
                    data.uc = v1.TextureCoordinates.x;
                    data.ud = v2.TextureCoordinates.x;

                    data.va = v1.TextureCoordinates.y;
                    data.vb = v3.TextureCoordinates.y;
                    data.vc = v1.TextureCoordinates.y;
                    data.vd = v2.TextureCoordinates.y;

                    // scan p1p3 p1p2
                    this.processScanLine(data, v1, v3, v1, v2, color, texture);
                } else {
                    data.ndotla = nl1;
                    data.ndotlb = nl3;
                    data.ndotlc = nl2;
                    data.ndotld = nl3;

                    data.ua = v1.TextureCoordinates.x;
                    data.ub = v3.TextureCoordinates.x;
                    data.uc = v2.TextureCoordinates.x;
                    data.ud = v3.TextureCoordinates.x;

                    data.va = v1.TextureCoordinates.y;
                    data.vb = v3.TextureCoordinates.y;
                    data.vc = v2.TextureCoordinates.y;
                    data.vd = v3.TextureCoordinates.y;
                    // scan p1p3 p2p3
                    this.processScanLine(data, v1, v3, v2, v3, color, texture);
                }
            }
        } else {
            // p2 on left
            for (let y = p1.y >> 0; y <= p3.y >> 0; y++) {
                data.currentY = y;
                if (y < p2.y) {
                    data.ndotla = nl1;
                    data.ndotlb = nl2;
                    data.ndotlc = nl1;
                    data.ndotld = nl3;

                    data.ua = v1.TextureCoordinates.x;
                    data.ub = v2.TextureCoordinates.x;
                    data.uc = v1.TextureCoordinates.x;
                    data.ud = v3.TextureCoordinates.x;

                    data.va = v1.TextureCoordinates.y;
                    data.vb = v2.TextureCoordinates.y;
                    data.vc = v1.TextureCoordinates.y;
                    data.vd = v3.TextureCoordinates.y;

                    // scan p1p2 p1p3
                    this.processScanLine(data, v1, v2, v1, v3, color, texture);
                } else {
                    data.ndotla = nl2;
                    data.ndotlb = nl3;
                    data.ndotlc = nl1;
                    data.ndotld = nl2;

                    data.ua = v2.TextureCoordinates.x;
                    data.ub = v3.TextureCoordinates.x;
                    data.uc = v1.TextureCoordinates.x;
                    data.ud = v3.TextureCoordinates.x;

                    data.va = v2.TextureCoordinates.y;
                    data.vb = v3.TextureCoordinates.y;
                    data.vc = v1.TextureCoordinates.y;
                    data.vd = v3.TextureCoordinates.y;

                    // scan p2p3 p1p3
                    this.processScanLine(data, v2, v3, v1, v3, color, texture);
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

                const pixelA = this.project(vertexA, transformMatrix, worldMatrix);
                const pixelB = this.project(vertexB, transformMatrix, worldMatrix);
                const pixelC = this.project(vertexC, transformMatrix, worldMatrix);

                // this.drawLine(pixelA, pixelB);
                // this.drawLine(pixelB, pixelC);
                // this.drawLine(pixelC, pixelA);
                // this.drawBline(pixelA, pixelB);
                // this.drawBline(pixelB, pixelC);
                // this.drawBline(pixelC, pixelA);

                // const color: number = 0.25 + ((i % cMesh.faces.length) / cMesh.faces.length) * 0.75;
                const color = 1.0;
                /** draw triangle */
                this.drawTriangle(pixelA, pixelB, pixelC, new BABYLON.Color4(color, color, color, 1), cMesh.texture);

                // console.log(`draw ${vertexA.toString()} ${vertexB.toString()} ${vertexC.toString()}`);
            }
        }
    }
}
