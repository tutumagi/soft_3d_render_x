/// <reference path="babylon.math.ts"/>
import { SoftEngine } from "./main";

let canvas: HTMLCanvasElement;
let device: SoftEngine.Device;
let mesh: SoftEngine.Mesh;
const meshes: SoftEngine.Mesh[] = [];
let camera: SoftEngine.Camera;

document.addEventListener("DOMContentLoaded", init, false);

function init() {
    canvas = document.getElementById("frontBuffer") as HTMLCanvasElement;
    mesh = new SoftEngine.Mesh("Cube", 8);

    meshes.push(mesh);
    camera = new SoftEngine.Camera();
    device = new SoftEngine.Device(canvas);

    mesh.vertices[0] = new BABYLON.Vector3(-1, 1, 1);
    mesh.vertices[1] = new BABYLON.Vector3(1, 1, 1);
    mesh.vertices[2] = new BABYLON.Vector3(-1, -1, 1);
    mesh.vertices[3] = new BABYLON.Vector3(-1, -1, -1);
    mesh.vertices[4] = new BABYLON.Vector3(-1, 1, -1);
    mesh.vertices[5] = new BABYLON.Vector3(1, 1, -1);
    mesh.vertices[6] = new BABYLON.Vector3(1, -1, 1);
    mesh.vertices[7] = new BABYLON.Vector3(1, -1, -1);

    camera.position = new BABYLON.Vector3(0, 0, 10);
    camera.target = new BABYLON.Vector3(0, 0, 0);

    // Calling the HTML5 rendering loop
    requestAnimationFrame(drawingLoop);
}

function drawingLoop() {
    device.clear();

    // rotating slightly the cube during each frame rendered
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;

    // Doing the various matrix operations
    device.render(camera, meshes);
    // Flushing the back buffer into the front buffer
    device.present();

    // Calling the HTML5 rendering loop recursively
    requestAnimationFrame(drawingLoop);
}
