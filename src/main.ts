/// <reference path="babylon.math.ts"/>

import { Camera } from "./camera";
import { Device } from "./device";
import { loadJSONFileAsync } from "./loader";
import { Mesh, Vertex } from "./mesh";

let canvas: HTMLCanvasElement;
let device: Device;
let camera: Camera;

document.addEventListener("DOMContentLoaded", init, false);

interface Drawable {
    meshes: Mesh[];
}

class Rabbit implements Drawable {
    public meshes: Mesh[];

    constructor() {
        loadJSONFileAsync("./dist/res/rabbit.babylon", (mesh: Mesh[]) => {
            this.meshes = mesh;
        });
    }
}

class Cube implements Drawable {
    public meshes: Mesh[] = [];
    constructor() {
        const mesh = new Mesh("Cube", 8, 12);
        this.meshes.push(mesh);
        mesh.vertices[0] = { coordinates: new BABYLON.Vector3(-1, 1, 1), normal: new BABYLON.Vector3(-1, 1, 1) };
        mesh.vertices[1] = { coordinates: new BABYLON.Vector3(1, 1, 1), normal: new BABYLON.Vector3(1, 1, 1) };
        mesh.vertices[2] = { coordinates: new BABYLON.Vector3(-1, -1, 1), normal: new BABYLON.Vector3(-1, -1, 1) };
        mesh.vertices[3] = { coordinates: new BABYLON.Vector3(1, -1, 1), normal: new BABYLON.Vector3(1, -1, 1) };
        mesh.vertices[4] = { coordinates: new BABYLON.Vector3(-1, 1, -1), normal: new BABYLON.Vector3(-1, 1, -1) };
        mesh.vertices[5] = { coordinates: new BABYLON.Vector3(1, 1, -1), normal: new BABYLON.Vector3(1, 1, -1) };
        mesh.vertices[6] = { coordinates: new BABYLON.Vector3(1, -1, -1), normal: new BABYLON.Vector3(1, -1, -1) };
        mesh.vertices[7] = { coordinates: new BABYLON.Vector3(-1, -1, -1), normal: new BABYLON.Vector3(-1, -1, -1) };

        mesh.faces[0] = { A: 0, B: 1, C: 2 };
        mesh.faces[1] = { A: 1, B: 2, C: 3 };
        mesh.faces[2] = { A: 1, B: 3, C: 6 };
        mesh.faces[3] = { A: 1, B: 5, C: 6 };
        mesh.faces[4] = { A: 0, B: 1, C: 4 };
        mesh.faces[5] = { A: 1, B: 4, C: 5 };

        mesh.faces[6] = { A: 2, B: 3, C: 7 };
        mesh.faces[7] = { A: 3, B: 6, C: 7 };
        mesh.faces[8] = { A: 0, B: 2, C: 7 };
        mesh.faces[9] = { A: 0, B: 4, C: 7 };
        mesh.faces[10] = { A: 4, B: 5, C: 6 };
        mesh.faces[11] = { A: 4, B: 6, C: 7 };

        // http://www.waitingfy.com/archives/425
        function calFaceNormal(p0: BABYLON.Vector3, p1: BABYLON.Vector3, p2: BABYLON.Vector3) {
            const a = p0.subtract(p1);
            const b = p0.subtract(p2);
            return a.multiply(b);
        }
        const faceNormal = mesh.faces.map((face) => {
            return {
                face,
                normal: calFaceNormal(
                    mesh.vertices[face.A].coordinates,
                    mesh.vertices[face.B].coordinates,
                    mesh.vertices[face.C].coordinates,
                ),
            };
        });

        mesh.vertices.forEach((vertex: Vertex, index: number) => {
            const relateFaceNormalByVertex = mesh.faces
                .filter((face, index) => {
                    if (face.A == index || face.B == index || face.C == index) {
                        return true;
                    }
                    return false;
                })
                .map((_, index) => {
                    return faceNormal[index].normal;
                });

            const tmp = BABYLON.Vector3.Zero();
            vertex.normal = relateFaceNormalByVertex
                .reduce((pre, cur) => {
                    return pre.add(cur);
                }, tmp)
                .scale(1 / relateFaceNormalByVertex.length);
        });

        // mesh.postion.x = -canvas.width / 4;
        // mesh.postion.y = -canvas.height / 4;
        mesh.postion.x = 3.0;
        mesh.postion.y = 3.0;
    }
}

class Monkey implements Drawable {
    public meshes: Mesh[];
    constructor() {
        loadJSONFileAsync("./dist/res/test_monkey.babylon", (mesh: Mesh[]) => {
            this.meshes = mesh;
        });
    }
}

let entities: Drawable[];
function init() {
    canvas = document.getElementById("frontBuffer") as HTMLCanvasElement;
    // mesh = new SoftEngine.Mesh("Cube", 8);

    // meshes.push(mesh);

    // mesh.vertices[0] = new BABYLON.Vector3(-1, 1, 1);
    // mesh.vertices[1] = new BABYLON.Vector3(1, 1, 1);
    // mesh.vertices[2] = new BABYLON.Vector3(-1, -1, 1);
    // mesh.vertices[3] = new BABYLON.Vector3(-1, -1, -1);
    // mesh.vertices[4] = new BABYLON.Vector3(-1, 1, -1);
    // mesh.vertices[5] = new BABYLON.Vector3(1, 1, -1);
    // mesh.vertices[6] = new BABYLON.Vector3(1, -1, 1);
    // mesh.vertices[7] = new BABYLON.Vector3(1, -1, -1);

    entities = [new Cube(), new Monkey()];

    camera = new Camera();
    device = new Device(canvas);

    camera.position = new BABYLON.Vector3(0, 0, 10);
    camera.target = new BABYLON.Vector3(0, 0, 0);

    // camera.position = new BABYLON.Vector3(32, 95, 45);
    // camera.target = new BABYLON.Vector3(-0.13, 31, 8);

    // Calling the HTML5 rendering loop
    // requestAnimationFrame(drawingLoop);

    requestAnimationFrame(drawingLoop);
}

let previousDate: number = 0;
function drawingLoop() {
    // fps
    const now = Date.now();
    const currentFps = 1000.0 / (now - previousDate);
    previousDate = now;

    // console.log(`${currentFps.toPrecision(2)} fps`);

    device.clear();

    // rotating slightly the cube during each frame rendered
    entities.forEach((entity) => {
        if (entity.meshes && entity.meshes.length > 0) {
            entity.meshes.forEach((mesh) => {
                // mesh.rotation.x += 0.01;
                mesh.rotation.y += 0.01;
            });
            device.render(camera, entity.meshes);
        }
    });

    // Doing the various matrix operations
    // Flushing the back buffer into the front buffer
    device.present();

    // Calling the HTML5 rendering loop recursively
    requestAnimationFrame(drawingLoop);
}

/**
 *            Y
 *            ↑
 *            |
 *            |
 *            |
 *  x ←--------
 *            /O
 *           /
 *          /
 *       z ↙︎
 *   ←↓→
 *
 */
