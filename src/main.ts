/// <reference path="babylon.math.ts"/>

import { Camera } from "./camera";
import { Device } from "./device";
import { loadJSONFileAsync } from "./loader";
import { Mesh } from "./mesh";

let canvas: HTMLCanvasElement;
let device: Device;
let mesh: Mesh;
let meshes: Mesh[] = [];
let camera: Camera;

document.addEventListener("DOMContentLoaded", init, false);

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

    // mesh = new Mesh("Cube", 8, 12);
    // meshes.push(mesh);
    // mesh.vertices[0] = new BABYLON.Vector3(-1, 1, 1);
    // mesh.vertices[1] = new BABYLON.Vector3(1, 1, 1);
    // mesh.vertices[2] = new BABYLON.Vector3(-1, -1, 1);
    // mesh.vertices[3] = new BABYLON.Vector3(1, -1, 1);
    // mesh.vertices[4] = new BABYLON.Vector3(-1, 1, -1);
    // mesh.vertices[5] = new BABYLON.Vector3(1, 1, -1);
    // mesh.vertices[6] = new BABYLON.Vector3(1, -1, -1);
    // mesh.vertices[7] = new BABYLON.Vector3(-1, -1, -1);

    // mesh.faces[0] = { A: 0, B: 1, C: 2 };
    // mesh.faces[1] = { A: 1, B: 2, C: 3 };
    // mesh.faces[2] = { A: 1, B: 3, C: 6 };
    // mesh.faces[3] = { A: 1, B: 5, C: 6 };
    // mesh.faces[4] = { A: 0, B: 1, C: 4 };
    // mesh.faces[5] = { A: 1, B: 4, C: 5 };

    // mesh.faces[6] = { A: 2, B: 3, C: 7 };
    // mesh.faces[7] = { A: 3, B: 6, C: 7 };
    // mesh.faces[8] = { A: 0, B: 2, C: 7 };
    // mesh.faces[9] = { A: 0, B: 4, C: 7 };
    // mesh.faces[10] = { A: 4, B: 5, C: 6 };
    // mesh.faces[11] = { A: 4, B: 6, C: 7 };

    camera = new Camera();
    device = new Device(canvas);

    camera.position = new BABYLON.Vector3(0, 0, 10);
    camera.target = new BABYLON.Vector3(0, 0, 0);

    // Calling the HTML5 rendering loop
    // requestAnimationFrame(drawingLoop);

    loadJSONFileAsync("./dist/res/test_monkey.babylon", loadJSONCompleted);
}

function loadJSONCompleted(meshesLoaded: Mesh[]) {
    meshes = meshesLoaded;

    requestAnimationFrame(drawingLoop);
}

let previousDate: number = 0;
function drawingLoop() {
    // fps
    const now = Date.now();
    const currentFps = 1000.0 / (now - previousDate);
    previousDate = now;

    console.log(`${currentFps.toPrecision(2)} fps`);

    device.clear();

    // rotating slightly the cube during each frame rendered
    meshes.forEach((mesh) => {
        // mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
    });

    // Doing the various matrix operations
    device.render(camera, meshes);
    // Flushing the back buffer into the front buffer
    device.present();

    // Calling the HTML5 rendering loop recursively
    requestAnimationFrame(drawingLoop);
}
