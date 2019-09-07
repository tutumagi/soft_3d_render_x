(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Camera =
/** @class */
function () {
  function Camera() {
    this.position = BABYLON.Vector3.Zero();
    this.target = BABYLON.Vector3.Zero();
  }

  return Camera;
}();

exports.Camera = Camera;

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Device =
/** @class */
function () {
  function Device(canvas) {
    this.workingCanvas = canvas;
    this.workingWidth = canvas.width;
    this.workingHeight = canvas.height;
    this.workingContext = this.workingCanvas.getContext("2d");
    this.depthbuffer = new Array(this.workingWidth * this.workingHeight);
  }

  Device.prototype.clear = function () {
    this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
    this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);

    for (var i = 0; i < this.depthbuffer.length; ++i) {
      // 填一个大一点的数字
      this.depthbuffer[i] = 1000000;
    }
  };

  Device.prototype.present = function () {
    this.workingContext.putImageData(this.backbuffer, 0, 0);
  };

  Device.prototype.putPixel = function (x, y, z, color) {
    this.backbufferdata = this.backbuffer.data;
    var index = (x >> 0) + (y >> 0) * this.workingWidth;
    var index4 = index * 4;

    if (this.depthbuffer[index] < z) {
      return; // Discard
    }

    this.depthbuffer[index] = z;
    this.backbufferdata[index4] = color.r * 255;
    this.backbufferdata[index4 + 1] = color.g * 255;
    this.backbufferdata[index4 + 2] = color.b * 255;
    this.backbufferdata[index4 + 3] = color.a * 255;
  };
  /**
   * Project takes some 3D coordinates and transform them
   * in 2D coordinates using the transformation matrix
   */


  Device.prototype.project = function (vertex, transMat, world) {
    // transforming the coordinates
    var point2d = BABYLON.Vector3.TransformCoordinates(vertex.coordinates, transMat); // 将坐标和法向量转换到 3d空间的 向量

    var point3dWorld = BABYLON.Vector3.TransformCoordinates(vertex.coordinates, world);
    var normal3dWorld = BABYLON.Vector3.TransformCoordinates(vertex.normal, world); // The transformed coordinates will be based on coordinate system
    // starting on the center of the screen. But drawing on screen normally starts
    // from top left. We then need to transform them again to have x:0, y:0 on top left

    var x = point2d.x * this.workingWidth + this.workingWidth / 2.0 >> 0;
    var y = -point2d.y * this.workingHeight + this.workingHeight / 2.0 >> 0; // return new BABYLON.Vector3(x, y, point.z);

    return {
      coordinates: new BABYLON.Vector3(x, y, point2d.z),
      normal: normal3dWorld,
      worldCoordinates: point3dWorld,
      TextureCoordinates: vertex.TextureCoordinates
    };
  };
  /**
   * `drawPoint` calls putPixel but does the clipping operation before
   * @param point
   */


  Device.prototype.drawPoint = function (point, color) {
    // Clipping what's visible on screen
    if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
      // Drawing a yellow point
      this.putPixel(point.x, point.y, point.z, color);
    }
  };
  /**
   * Clamping values to keep them between min and max
   * @param value 待修正值
   * @param min{=0} 最小值
   * @param max{=1} 最大值
   */


  Device.prototype.clamp = function (value, min, max) {
    if (min === void 0) {
      min = 0;
    }

    if (max === void 0) {
      max = 1;
    }

    return Math.max(min, Math.min(value, max));
  };
  /**
   * Interpolating the value between 2 vertices
   * min is the starting point, max the ending point
   * and gradient the % between the 2 points
   * 根据 gradient系数 获取 从 `min` 到 `max` 的中间值
   * @param min
   * @param max
   * @param gradient
   */


  Device.prototype.interpolate = function (min, max, gradient) {
    return min + (max - min) * this.clamp(gradient);
  };
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


  Device.prototype.processScanLine = function (data, va, vb, vc, vd, color, texture) {
    var pa = va.coordinates;
    var pb = vb.coordinates;
    var pc = vc.coordinates;
    var pd = vd.coordinates; // thanks to current Y, we can compute the gradient to compute others values like
    // the starting X(sx) and ending X (es) to draw between
    // if pa.Y == pb.Y or pc.Y == pd.Y, gradient is forced to 1

    var gradient1 = pa.y != pb.y ? (data.currentY - pa.y) / (pb.y - pa.y) : 1;
    var gradient2 = pc.y != pd.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;
    var sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
    var ex = this.interpolate(pc.x, pd.x, gradient2) >> 0; // starting Z &  ending Z

    var z1 = this.interpolate(pa.z, pb.z, gradient1);
    var z2 = this.interpolate(pc.z, pd.z, gradient2); // interpolating normals on Y

    var snl = this.interpolate(data.ndotla, data.ndotlb, gradient1);
    var enl = this.interpolate(data.ndotlc, data.ndotld, gradient2); // interpolating texture coordinates on Y

    var su = this.interpolate(data.ua, data.ub, gradient1);
    var eu = this.interpolate(data.uc, data.ud, gradient2);
    var sv = this.interpolate(data.va, data.vb, gradient1);
    var ev = this.interpolate(data.vc, data.vd, gradient2); // drawing a line from left (sx) to right (ex)

    for (var x = sx; x < ex; x++) {
      // normalisation pour dessiner de gauche à droite
      var gradient = (x - sx) / (ex - sx);
      var z = this.interpolate(z1, z2, gradient);
      var ndotl = this.interpolate(snl, enl, gradient);
      var u = this.interpolate(su, eu, gradient);
      var v = this.interpolate(sv, ev, gradient); // 光源向量和面的法向量的夹角cos值
      // const ndotl = data.ndotla;

      var textureColor = void 0;

      if (texture) {
        textureColor = texture.map(u, v);
      } else {
        textureColor = new BABYLON.Color4(1, 1, 1, 1);
      } // changing the color value using the cosine of the angle
      // between the light vector and the normal vector


      this.drawPoint(new BABYLON.Vector3(x, data.currentY, z), new BABYLON.Color4(color.r * ndotl * textureColor.r, color.g * ndotl * textureColor.g, color.b * ndotl * textureColor.b, 1));
    }
  };
  /**
   * 计算 光源向量(light)（灯源坐标 - 顶点坐标）和法向量（normal）的夹角的cos值，返回值0 到 1
   *
   * normal vector • light vector
   * @param vertex
   * @param normal
   * @param lightPosition
   */


  Device.prototype.computeNDotL = function (vertex, normal, lightPosition) {
    var lightDirection = lightPosition.subtract(vertex);
    normal.normalize();
    lightDirection.normalize();
    return Math.max(0, BABYLON.Vector3.Dot(normal, lightDirection));
  };

  Device.prototype.drawTriangle = function (v1, v2, v3, color, texture) {
    // Sorting the points in order to always have this order on screen p1, p2 & p3
    // with p1 always up (thus having the Y the lowest possible to be near the top screen)
    // then p2 between p1 & p3 (according to Y-axis up to down )
    if (v1.coordinates.y > v2.coordinates.y) {
      var temp = v2;
      v2 = v1;
      v1 = temp;
    }

    if (v2.coordinates.y > v3.coordinates.y) {
      var temp = v2;
      v2 = v3;
      v3 = temp;
    }

    if (v1.coordinates.y > v2.coordinates.y) {
      var temp = v2;
      v2 = v1;
      v1 = temp;
    } // sort end


    var p1 = v1.coordinates;
    var p2 = v2.coordinates;
    var p3 = v3.coordinates; // normal face's vector is the average normal between each vertex's normal
    // computing also the center point of the face
    // // 面的法向量
    // const vnFace = v1.normal.add(v2.normal.add(v3.normal)).scale(1 / 3);
    // // 面的中心点
    // const centerPoint = v1.worldCoordinates.add(v2.worldCoordinates.add(v3.worldCoordinates)).scale(1 / 3);
    // light position

    var lightPos = new BABYLON.Vector3(0, 10, 10); // 计算光源向量和面的法向量的夹角cos值
    // const ndotl = this.computeNDotL(centerPoint, vnFace, lightPos);

    var nl1 = this.computeNDotL(v1.worldCoordinates, v1.normal, lightPos);
    var nl2 = this.computeNDotL(v2.worldCoordinates, v2.normal, lightPos);
    var nl3 = this.computeNDotL(v3.worldCoordinates, v3.normal, lightPos);
    var data = {}; // inverse slopes

    var dP1P2;
    var dP1P3; // http://en.wikipedia.org/wiki/Slope
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
    } // First case where triangles are like that:
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
      for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
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
          data.vd = v2.TextureCoordinates.y; // scan p1p3 p1p2

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
          data.vd = v3.TextureCoordinates.y; // scan p1p3 p2p3

          this.processScanLine(data, v1, v3, v2, v3, color, texture);
        }
      }
    } else {
      // p2 on left
      for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
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
          data.vd = v3.TextureCoordinates.y; // scan p1p2 p1p3

          this.processScanLine(data, v1, v2, v1, v3, color, texture);
        } else {
          data.ndotla = nl2;
          data.ndotlb = nl3;
          data.ndotlc = nl1;
          data.ndotld = nl3;
          data.ua = v2.TextureCoordinates.x;
          data.ub = v3.TextureCoordinates.x;
          data.uc = v1.TextureCoordinates.x;
          data.ud = v3.TextureCoordinates.x;
          data.va = v2.TextureCoordinates.y;
          data.vb = v3.TextureCoordinates.y;
          data.vc = v1.TextureCoordinates.y;
          data.vd = v3.TextureCoordinates.y; // scan p2p3 p1p3

          this.processScanLine(data, v2, v3, v1, v3, color, texture);
        }
      }
    }
  };

  Device.prototype.render = function (camera, meshes) {
    var viewMatrix = BABYLON.Matrix.LookAtLH(camera.position, camera.target, BABYLON.Vector3.Up());
    var projectMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);

    for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
      var cMesh = meshes_1[_i];
      var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(cMesh.rotation.y, cMesh.rotation.x, cMesh.rotation.z).multiply(BABYLON.Matrix.Translation(cMesh.postion.x, cMesh.postion.y, cMesh.postion.z));
      var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectMatrix);
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

      for (var i = 0; i < cMesh.faces.length; i++) {
        var currentFace = cMesh.faces[i];
        var vertexA = cMesh.vertices[currentFace.A];
        var vertexB = cMesh.vertices[currentFace.B];
        var vertexC = cMesh.vertices[currentFace.C];
        var pixelA = this.project(vertexA, transformMatrix, worldMatrix);
        var pixelB = this.project(vertexB, transformMatrix, worldMatrix);
        var pixelC = this.project(vertexC, transformMatrix, worldMatrix); // this.drawLine(pixelA, pixelB);
        // this.drawLine(pixelB, pixelC);
        // this.drawLine(pixelC, pixelA);
        // this.drawBline(pixelA, pixelB);
        // this.drawBline(pixelB, pixelC);
        // this.drawBline(pixelC, pixelA);
        // const color: number = 0.25 + ((i % cMesh.faces.length) / cMesh.faces.length) * 0.75;

        var color = 1.0;
        /** draw triangle */

        this.drawTriangle(pixelA, pixelB, pixelC, new BABYLON.Color4(color, color, color, 1), cMesh.texture); // console.log(`draw ${vertexA.toString()} ${vertexB.toString()} ${vertexC.toString()}`);
      }
    }
  };

  return Device;
}();

exports.Device = Device;

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var mesh_1 = require("./mesh");

var texture_1 = require("./texture");

function loadJSONFileAsync(fileName, callback) {
  var jsonObject = {};
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", fileName, true);

  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      jsonObject = JSON.parse(xmlHttp.responseText); // callback(this.createMeshesFromJSON(jsonObject));

      callback(createMeshesFromJSON(jsonObject));
    }
  };

  xmlHttp.send(null);
}

exports.loadJSONFileAsync = loadJSONFileAsync;
/** https://doc.babylonjs.com/resources/file_format_map_(.babylon)
 *  json 格式
 */

function createMeshesFromJSON(jsonObject) {
  var materials = {};
  jsonObject.materials.forEach(function (material) {
    materials[material.id] = {
      ID: material.id,
      name: material.name,
      diffuseTextureName: material.diffuseTexture.name
    };
  });
  var meshes = jsonObject.meshes.map(function (meshObject) {
    var verticesArray = meshObject.positions;

    if (!verticesArray) {
      return;
    } // Faces


    var indicesArray = meshObject.indices;
    var normals = meshObject.normals;
    var verticesCount = verticesArray.length;
    var uvs = meshObject.uvs; // number of faces is logically the size of the array divided by 3 (A, B, C)

    var facesCount = indicesArray.length / 3;
    var mesh = new mesh_1.Mesh(meshObject.name, verticesCount, facesCount); // Filling the vertices array of our mesh first，根据position 每次取三个放到顶点数据

    for (var index = 0; index < verticesCount / 3; ++index) {
      var x = verticesArray[index * 3];
      var y = verticesArray[index * 3 + 1];
      var z = verticesArray[index * 3 + 2];
      var nx = normals[index * 3];
      var ny = normals[index * 3 + 1];
      var nz = normals[index * 3 + 2];
      mesh.vertices[index] = {
        coordinates: new BABYLON.Vector3(x, y, z),
        normal: new BABYLON.Vector3(nx, ny, nz),
        worldCoordinates: null,
        TextureCoordinates: new BABYLON.Vector2(uvs[index * 2], uvs[index * 2 + 1])
      };
    } // then filling the faces array 根据面的点索引数据，每次取三个 放到mesh的面数据中去


    for (var index = 0; index < facesCount; ++index) {
      var a = indicesArray[index * 3];
      var b = indicesArray[index * 3 + 1];
      var c = indicesArray[index * 3 + 2];
      mesh.faces[index] = {
        A: a,
        B: b,
        C: c
      };
    } // Getting the position you've set in Blender


    var position = meshObject.position;
    mesh.postion = new BABYLON.Vector3(position[0], position[1], position[2]);

    if (uvs && uvs.length > 0) {
      var materialID = meshObject.materialId;

      if (materials[materialID]) {
        mesh.texture = new texture_1.Texture(materials[materialID].diffuseTextureName, 2048, 2048);
      }
    }

    return mesh;
  });
  return meshes;
}

exports.createMeshesFromJSON = createMeshesFromJSON;

},{"./mesh":5,"./texture":6}],4:[function(require,module,exports){
"use strict"; /// <reference path="babylon.math.ts"/>

Object.defineProperty(exports, "__esModule", {
  value: true
});

var camera_1 = require("./camera");

var device_1 = require("./device");

var loader_1 = require("./loader");

var canvas;
var device;
var mesh;
var meshes = [];
var camera;
document.addEventListener("DOMContentLoaded", init, false);

function init() {
  canvas = document.getElementById("frontBuffer"); // mesh = new SoftEngine.Mesh("Cube", 8);
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

  camera = new camera_1.Camera();
  device = new device_1.Device(canvas);
  camera.position = new BABYLON.Vector3(0, 0, 10);
  camera.target = new BABYLON.Vector3(0, 0, 0); // camera.position = new BABYLON.Vector3(32, 95, 45);
  // camera.target = new BABYLON.Vector3(-0.13, 31, 8);
  // Calling the HTML5 rendering loop
  // requestAnimationFrame(drawingLoop);

  loader_1.loadJSONFileAsync("./dist/res/test_monkey.babylon", loadJSONCompleted); // loadJSONFileAsync("./dist/res/rabbit.babylon", loadJSONCompleted);
}

function loadJSONCompleted(meshesLoaded) {
  meshes = meshesLoaded;
  requestAnimationFrame(drawingLoop);
}

var previousDate = 0;

function drawingLoop() {
  // fps
  var now = Date.now();
  var currentFps = 1000.0 / (now - previousDate);
  previousDate = now; // console.log(`${currentFps.toPrecision(2)} fps`);

  device.clear(); // rotating slightly the cube during each frame rendered

  meshes.forEach(function (mesh) {
    // mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
  }); // Doing the various matrix operations

  device.render(camera, meshes); // Flushing the back buffer into the front buffer

  device.present(); // Calling the HTML5 rendering loop recursively

  requestAnimationFrame(drawingLoop);
}

},{"./camera":1,"./device":2,"./loader":3}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Mesh =
/** @class */
function () {
  function Mesh(name, verticesCount, facesCount) {
    this.name = name;
    this.vertices = new Array(verticesCount);
    this.faces = new Array(facesCount);
    this.rotation = BABYLON.Vector3.Zero();
    this.postion = BABYLON.Vector3.Zero();
  }

  return Mesh;
}();

exports.Mesh = Mesh;

},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Texture =
/** @class */
function () {
  function Texture(filename, width, height) {
    this.width = width;
    this.height = height;
    this.load(filename);
  }

  Texture.prototype.load = function (filename) {
    var _this = this;

    var imageTexture = new Image();
    imageTexture.height = this.height;
    imageTexture.width = this.width;

    imageTexture.onload = function () {
      var internalCanvas = document.createElement("canvas");
      internalCanvas.width = _this.width;
      internalCanvas.height = _this.height;
      var internalContext = internalCanvas.getContext("2d");
      internalContext.drawImage(imageTexture, 0, 0);
      _this.internalBuffer = internalContext.getImageData(0, 0, _this.width, _this.height);
    };

    imageTexture.src = filename;
  }; // Takes the U & V coordinates exported by Blender
  // and return the corresponding pixel color in texture


  Texture.prototype.map = function (tu, tv) {
    if (this.internalBuffer) {
      // using a % operator to cycle/repeat the texture if needed
      var u = Math.abs(tu * this.width % this.width) >> 0;
      var v = Math.abs(tv * this.height % this.height) >> 0;
      var pos = (u + v * this.width) * 4;
      var r = this.internalBuffer.data[pos];
      var g = this.internalBuffer.data[pos + 1];
      var b = this.internalBuffer.data[pos + 2];
      var a = this.internalBuffer.data[pos + 3];
      return new BABYLON.Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
    } else {
      return new BABYLON.Color4(1, 1, 1, 1);
    }
  };

  return Texture;
}();

exports.Texture = Texture;

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FtZXJhLnRzIiwic3JjL2RldmljZS50cyIsInNyYy9sb2FkZXIudHMiLCJzcmMvbWFpbi50cyIsInNyYy9tZXNoLnRzIiwic3JjL3RleHR1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQSxJQUFBLE1BQUE7QUFBQTtBQUFBLFlBQUE7QUFJSSxXQUFBLE1BQUEsR0FBQTtBQUNJLFNBQUssUUFBTCxHQUFnQixPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFoQjtBQUNBLFNBQUssTUFBTCxHQUFjLE9BQU8sQ0FBQyxPQUFSLENBQWdCLElBQWhCLEVBQWQ7QUFDSDs7QUFDTCxTQUFBLE1BQUE7QUFBQyxDQVJELEVBQUE7O0FBQWEsT0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBOzs7Ozs7Ozs7QUNJYixJQUFBLE1BQUE7QUFBQTtBQUFBLFlBQUE7QUFXSSxXQUFBLE1BQUEsQ0FBWSxNQUFaLEVBQXFDO0FBQ2pDLFNBQUssYUFBTCxHQUFxQixNQUFyQjtBQUNBLFNBQUssWUFBTCxHQUFvQixNQUFNLENBQUMsS0FBM0I7QUFDQSxTQUFLLGFBQUwsR0FBcUIsTUFBTSxDQUFDLE1BQTVCO0FBRUEsU0FBSyxjQUFMLEdBQXNCLEtBQUssYUFBTCxDQUFtQixVQUFuQixDQUE4QixJQUE5QixDQUF0QjtBQUVBLFNBQUssV0FBTCxHQUFtQixJQUFJLEtBQUosQ0FBVSxLQUFLLFlBQUwsR0FBb0IsS0FBSyxhQUFuQyxDQUFuQjtBQUNIOztBQUVNLEVBQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxLQUFBLEdBQVAsWUFBQTtBQUNJLFNBQUssY0FBTCxDQUFvQixTQUFwQixDQUE4QixDQUE5QixFQUFpQyxDQUFqQyxFQUFvQyxLQUFLLFlBQXpDLEVBQXVELEtBQUssYUFBNUQ7QUFDQSxTQUFLLFVBQUwsR0FBa0IsS0FBSyxjQUFMLENBQW9CLFlBQXBCLENBQWlD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SSxPQUFPLENBQUMsTUFBWixDQUFtQixDQUFDLEdBQUcsS0FBdkIsRUFBOEIsQ0FBQyxHQUFHLEtBQWxDLEVBQXlDLENBQUMsR0FBRyxLQUE3QyxFQUFvRCxDQUFDLEdBQUcsS0FBeEQsQ0FBUDtBQUNILEtBYkQsTUFhTztBQUNILGFBQU8sSUFBSSxPQUFPLENBQUMsTUFBWixDQUFtQixDQUFuQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUE0QixDQUE1QixDQUFQO0FBQ0g7QUFDSixHQWpCTTs7QUFrQlgsU0FBQSxPQUFBO0FBQUMsQ0E5Q0QsRUFBQTs7QUFBYSxPQUFBLENBQUEsT0FBQSxHQUFBLE9BQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJleHBvcnQgY2xhc3MgQ2FtZXJhIHtcbiAgICBwdWJsaWMgcG9zaXRpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgdGFyZ2V0OiBCQUJZTE9OLlZlY3RvcjM7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDYW1lcmEgfSBmcm9tIFwiLi9jYW1lcmFcIjtcbmltcG9ydCB7IE1lc2gsIFNjYW5MaW5lRGF0YSwgVmVydGV4IH0gZnJvbSBcIi4vbWVzaFwiO1xuaW1wb3J0IHsgVGV4dHVyZSB9IGZyb20gXCIuL3RleHR1cmVcIjtcblxuZXhwb3J0IGNsYXNzIERldmljZSB7XG4gICAgcHJpdmF0ZSBiYWNrYnVmZmVyPzogSW1hZ2VEYXRhO1xuICAgIHByaXZhdGUgd29ya2luZ0NhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgcHJpdmF0ZSB3b3JraW5nQ29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICAgIHByaXZhdGUgd29ya2luZ1dpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSB3b3JraW5nSGVpZ2h0OiBudW1iZXI7XG4gICAgLy8gZXF1YWxzIHRvIGJhY2tidWZmZXIuZGF0YVxuICAgIHByaXZhdGUgYmFja2J1ZmZlcmRhdGE/OiBVaW50OENsYW1wZWRBcnJheTtcbiAgICAvLyDnvJPlrZjmr4/kuKrlg4/ntKDngrnnmoQgei1idWZmZXLvvIzlpoLmnpzlkI7pnaLnu5jliLbnmoR6IGluZGV4IOWkp+S6juW9k+WJjeeahO+8jOWImeW/veeVpe+8jOWQpuWImeimhuebluW9k+WJjeeahOWDj+e0oFxuICAgIHByaXZhdGUgZGVwdGhidWZmZXI6IG51bWJlcltdO1xuXG4gICAgY29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCkge1xuICAgICAgICB0aGlzLndvcmtpbmdDYW52YXMgPSBjYW52YXM7XG4gICAgICAgIHRoaXMud29ya2luZ1dpZHRoID0gY2FudmFzLndpZHRoO1xuICAgICAgICB0aGlzLndvcmtpbmdIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMud29ya2luZ0NvbnRleHQgPSB0aGlzLndvcmtpbmdDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpITtcblxuICAgICAgICB0aGlzLmRlcHRoYnVmZmVyID0gbmV3IEFycmF5KHRoaXMud29ya2luZ1dpZHRoICogdGhpcy53b3JraW5nSGVpZ2h0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMud29ya2luZ0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMud29ya2luZ1dpZHRoLCB0aGlzLndvcmtpbmdIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tidWZmZXIgPSB0aGlzLndvcmtpbmdDb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLndvcmtpbmdXaWR0aCwgdGhpcy53b3JraW5nSGVpZ2h0KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZGVwdGhidWZmZXIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIC8vIOWhq+S4gOS4quWkp+S4gOeCueeahOaVsOWtl1xuICAgICAgICAgICAgdGhpcy5kZXB0aGJ1ZmZlcltpXSA9IDEwMDAwMDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcHJlc2VudCgpIHtcbiAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dC5wdXRJbWFnZURhdGEodGhpcy5iYWNrYnVmZmVyISwgMCwgMCk7XG4gICAgfVxuXG4gICAgcHVibGljIHB1dFBpeGVsKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCkge1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhID0gdGhpcy5iYWNrYnVmZmVyIS5kYXRhO1xuXG4gICAgICAgIGNvbnN0IGluZGV4OiBudW1iZXIgPSAoeCA+PiAwKSArICh5ID4+IDApICogdGhpcy53b3JraW5nV2lkdGg7XG4gICAgICAgIGNvbnN0IGluZGV4NDogbnVtYmVyID0gaW5kZXggKiA0O1xuXG4gICAgICAgIGlmICh0aGlzLmRlcHRoYnVmZmVyW2luZGV4XSA8IHopIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gRGlzY2FyZFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVwdGhidWZmZXJbaW5kZXhdID0gejtcblxuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4NF0gPSBjb2xvci5yICogMjU1O1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4NCArIDFdID0gY29sb3IuZyAqIDI1NTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleDQgKyAyXSA9IGNvbG9yLmIgKiAyNTU7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXg0ICsgM10gPSBjb2xvci5hICogMjU1O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb2plY3QgdGFrZXMgc29tZSAzRCBjb29yZGluYXRlcyBhbmQgdHJhbnNmb3JtIHRoZW1cbiAgICAgKiBpbiAyRCBjb29yZGluYXRlcyB1c2luZyB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gICAgICovXG4gICAgcHVibGljIHByb2plY3QodmVydGV4OiBWZXJ0ZXgsIHRyYW5zTWF0OiBCQUJZTE9OLk1hdHJpeCwgd29ybGQ6IEJBQllMT04uTWF0cml4KTogVmVydGV4IHtcbiAgICAgICAgLy8gdHJhbnNmb3JtaW5nIHRoZSBjb29yZGluYXRlc1xuICAgICAgICBjb25zdCBwb2ludDJkID0gQkFCWUxPTi5WZWN0b3IzLlRyYW5zZm9ybUNvb3JkaW5hdGVzKHZlcnRleC5jb29yZGluYXRlcywgdHJhbnNNYXQpO1xuXG4gICAgICAgIC8vIOWwhuWdkOagh+WSjOazleWQkemHj+i9rOaNouWIsCAzZOepuumXtOeahCDlkJHph49cbiAgICAgICAgY29uc3QgcG9pbnQzZFdvcmxkID0gQkFCWUxPTi5WZWN0b3IzLlRyYW5zZm9ybUNvb3JkaW5hdGVzKHZlcnRleC5jb29yZGluYXRlcywgd29ybGQpO1xuICAgICAgICBjb25zdCBub3JtYWwzZFdvcmxkID0gQkFCWUxPTi5WZWN0b3IzLlRyYW5zZm9ybUNvb3JkaW5hdGVzKHZlcnRleC5ub3JtYWwsIHdvcmxkKTtcblxuICAgICAgICAvLyBUaGUgdHJhbnNmb3JtZWQgY29vcmRpbmF0ZXMgd2lsbCBiZSBiYXNlZCBvbiBjb29yZGluYXRlIHN5c3RlbVxuICAgICAgICAvLyBzdGFydGluZyBvbiB0aGUgY2VudGVyIG9mIHRoZSBzY3JlZW4uIEJ1dCBkcmF3aW5nIG9uIHNjcmVlbiBub3JtYWxseSBzdGFydHNcbiAgICAgICAgLy8gZnJvbSB0b3AgbGVmdC4gV2UgdGhlbiBuZWVkIHRvIHRyYW5zZm9ybSB0aGVtIGFnYWluIHRvIGhhdmUgeDowLCB5OjAgb24gdG9wIGxlZnRcbiAgICAgICAgY29uc3QgeCA9IChwb2ludDJkLnggKiB0aGlzLndvcmtpbmdXaWR0aCArIHRoaXMud29ya2luZ1dpZHRoIC8gMi4wKSA+PiAwO1xuICAgICAgICBjb25zdCB5ID0gKC1wb2ludDJkLnkgKiB0aGlzLndvcmtpbmdIZWlnaHQgKyB0aGlzLndvcmtpbmdIZWlnaHQgLyAyLjApID4+IDA7XG5cbiAgICAgICAgLy8gcmV0dXJuIG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgeSwgcG9pbnQueik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb29yZGluYXRlczogbmV3IEJBQllMT04uVmVjdG9yMyh4LCB5LCBwb2ludDJkLnopLFxuICAgICAgICAgICAgbm9ybWFsOiBub3JtYWwzZFdvcmxkLFxuICAgICAgICAgICAgd29ybGRDb29yZGluYXRlczogcG9pbnQzZFdvcmxkLFxuICAgICAgICAgICAgVGV4dHVyZUNvb3JkaW5hdGVzOiB2ZXJ0ZXguVGV4dHVyZUNvb3JkaW5hdGVzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGBkcmF3UG9pbnRgIGNhbGxzIHB1dFBpeGVsIGJ1dCBkb2VzIHRoZSBjbGlwcGluZyBvcGVyYXRpb24gYmVmb3JlXG4gICAgICogQHBhcmFtIHBvaW50XG4gICAgICovXG4gICAgcHVibGljIGRyYXdQb2ludChwb2ludDogQkFCWUxPTi5WZWN0b3IzLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpIHtcbiAgICAgICAgLy8gQ2xpcHBpbmcgd2hhdCdzIHZpc2libGUgb24gc2NyZWVuXG4gICAgICAgIGlmIChwb2ludC54ID49IDAgJiYgcG9pbnQueSA+PSAwICYmIHBvaW50LnggPCB0aGlzLndvcmtpbmdXaWR0aCAmJiBwb2ludC55IDwgdGhpcy53b3JraW5nSGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBEcmF3aW5nIGEgeWVsbG93IHBvaW50XG4gICAgICAgICAgICB0aGlzLnB1dFBpeGVsKHBvaW50LngsIHBvaW50LnksIHBvaW50LnosIGNvbG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsYW1waW5nIHZhbHVlcyB0byBrZWVwIHRoZW0gYmV0d2VlbiBtaW4gYW5kIG1heFxuICAgICAqIEBwYXJhbSB2YWx1ZSDlvoXkv67mraPlgLxcbiAgICAgKiBAcGFyYW0gbWluez0wfSDmnIDlsI/lgLxcbiAgICAgKiBAcGFyYW0gbWF4ez0xfSDmnIDlpKflgLxcbiAgICAgKi9cbiAgICBwdWJsaWMgY2xhbXAodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIgPSAwLCBtYXg6IG51bWJlciA9IDEpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbih2YWx1ZSwgbWF4KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJwb2xhdGluZyB0aGUgdmFsdWUgYmV0d2VlbiAyIHZlcnRpY2VzXG4gICAgICogbWluIGlzIHRoZSBzdGFydGluZyBwb2ludCwgbWF4IHRoZSBlbmRpbmcgcG9pbnRcbiAgICAgKiBhbmQgZ3JhZGllbnQgdGhlICUgYmV0d2VlbiB0aGUgMiBwb2ludHNcbiAgICAgKiDmoLnmja4gZ3JhZGllbnTns7vmlbAg6I635Y+WIOS7jiBgbWluYCDliLAgYG1heGAg55qE5Lit6Ze05YC8XG4gICAgICogQHBhcmFtIG1pblxuICAgICAqIEBwYXJhbSBtYXhcbiAgICAgKiBAcGFyYW0gZ3JhZGllbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgaW50ZXJwb2xhdGUobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBncmFkaWVudDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIG1pbiArIChtYXggLSBtaW4pICogdGhpcy5jbGFtcChncmFkaWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZHJhd2luZyBsaW5lIGJldHdlZW4gMiBwb2ludHMgZnJvbSBsZWZ0IHRvIHJpZ2h0XG4gICAgICogcGEgcGIgLT4gcGMgcGRcbiAgICAgKiBwYSxwYixwYyxwZCBtdXN0IHRoZW4gYmUgc29ydGVkIGJlZm9yZVxuICAgICAqIEBwYXJhbSB5XG4gICAgICogQHBhcmFtIHBhXG4gICAgICogQHBhcmFtIHBiXG4gICAgICogQHBhcmFtIHBjXG4gICAgICogQHBhcmFtIHBkXG4gICAgICogQHBhcmFtIGNvbG9yXG4gICAgICovXG4gICAgcHVibGljIHByb2Nlc3NTY2FuTGluZShcbiAgICAgICAgZGF0YTogU2NhbkxpbmVEYXRhLFxuICAgICAgICB2YTogVmVydGV4LFxuICAgICAgICB2YjogVmVydGV4LFxuICAgICAgICB2YzogVmVydGV4LFxuICAgICAgICB2ZDogVmVydGV4LFxuICAgICAgICBjb2xvcjogQkFCWUxPTi5Db2xvcjQsXG4gICAgICAgIHRleHR1cmU/OiBUZXh0dXJlLFxuICAgICk6IHZvaWQge1xuICAgICAgICBjb25zdCBwYSA9IHZhLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwYiA9IHZiLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwYyA9IHZjLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwZCA9IHZkLmNvb3JkaW5hdGVzO1xuICAgICAgICAvLyB0aGFua3MgdG8gY3VycmVudCBZLCB3ZSBjYW4gY29tcHV0ZSB0aGUgZ3JhZGllbnQgdG8gY29tcHV0ZSBvdGhlcnMgdmFsdWVzIGxpa2VcbiAgICAgICAgLy8gdGhlIHN0YXJ0aW5nIFgoc3gpIGFuZCBlbmRpbmcgWCAoZXMpIHRvIGRyYXcgYmV0d2VlblxuICAgICAgICAvLyBpZiBwYS5ZID09IHBiLlkgb3IgcGMuWSA9PSBwZC5ZLCBncmFkaWVudCBpcyBmb3JjZWQgdG8gMVxuICAgICAgICBjb25zdCBncmFkaWVudDEgPSBwYS55ICE9IHBiLnkgPyAoZGF0YS5jdXJyZW50WSAtIHBhLnkpIC8gKHBiLnkgLSBwYS55KSA6IDE7XG4gICAgICAgIGNvbnN0IGdyYWRpZW50MiA9IHBjLnkgIT0gcGQueSA/IChkYXRhLmN1cnJlbnRZIC0gcGMueSkgLyAocGQueSAtIHBjLnkpIDogMTtcblxuICAgICAgICBjb25zdCBzeCA9IHRoaXMuaW50ZXJwb2xhdGUocGEueCwgcGIueCwgZ3JhZGllbnQxKSA+PiAwO1xuICAgICAgICBjb25zdCBleCA9IHRoaXMuaW50ZXJwb2xhdGUocGMueCwgcGQueCwgZ3JhZGllbnQyKSA+PiAwO1xuXG4gICAgICAgIC8vIHN0YXJ0aW5nIFogJiAgZW5kaW5nIFpcbiAgICAgICAgY29uc3QgejE6IG51bWJlciA9IHRoaXMuaW50ZXJwb2xhdGUocGEueiwgcGIueiwgZ3JhZGllbnQxKTtcbiAgICAgICAgY29uc3QgejI6IG51bWJlciA9IHRoaXMuaW50ZXJwb2xhdGUocGMueiwgcGQueiwgZ3JhZGllbnQyKTtcblxuICAgICAgICAvLyBpbnRlcnBvbGF0aW5nIG5vcm1hbHMgb24gWVxuICAgICAgICBjb25zdCBzbmwgPSB0aGlzLmludGVycG9sYXRlKGRhdGEubmRvdGxhLCBkYXRhLm5kb3RsYiwgZ3JhZGllbnQxKTtcbiAgICAgICAgY29uc3QgZW5sID0gdGhpcy5pbnRlcnBvbGF0ZShkYXRhLm5kb3RsYywgZGF0YS5uZG90bGQsIGdyYWRpZW50Mik7XG5cbiAgICAgICAgLy8gaW50ZXJwb2xhdGluZyB0ZXh0dXJlIGNvb3JkaW5hdGVzIG9uIFlcbiAgICAgICAgY29uc3Qgc3UgPSB0aGlzLmludGVycG9sYXRlKGRhdGEudWEsIGRhdGEudWIsIGdyYWRpZW50MSk7XG4gICAgICAgIGNvbnN0IGV1ID0gdGhpcy5pbnRlcnBvbGF0ZShkYXRhLnVjLCBkYXRhLnVkLCBncmFkaWVudDIpO1xuICAgICAgICBjb25zdCBzdiA9IHRoaXMuaW50ZXJwb2xhdGUoZGF0YS52YSwgZGF0YS52YiwgZ3JhZGllbnQxKTtcbiAgICAgICAgY29uc3QgZXYgPSB0aGlzLmludGVycG9sYXRlKGRhdGEudmMsIGRhdGEudmQsIGdyYWRpZW50Mik7XG5cbiAgICAgICAgLy8gZHJhd2luZyBhIGxpbmUgZnJvbSBsZWZ0IChzeCkgdG8gcmlnaHQgKGV4KVxuICAgICAgICBmb3IgKGxldCB4ID0gc3g7IHggPCBleDsgeCsrKSB7XG4gICAgICAgICAgICAvLyBub3JtYWxpc2F0aW9uIHBvdXIgZGVzc2luZXIgZGUgZ2F1Y2hlIMOgIGRyb2l0ZVxuICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQ6IG51bWJlciA9ICh4IC0gc3gpIC8gKGV4IC0gc3gpO1xuXG4gICAgICAgICAgICBjb25zdCB6ID0gdGhpcy5pbnRlcnBvbGF0ZSh6MSwgejIsIGdyYWRpZW50KTtcblxuICAgICAgICAgICAgY29uc3QgbmRvdGwgPSB0aGlzLmludGVycG9sYXRlKHNubCwgZW5sLCBncmFkaWVudCk7XG4gICAgICAgICAgICBjb25zdCB1ID0gdGhpcy5pbnRlcnBvbGF0ZShzdSwgZXUsIGdyYWRpZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmludGVycG9sYXRlKHN2LCBldiwgZ3JhZGllbnQpO1xuXG4gICAgICAgICAgICAvLyDlhYnmupDlkJHph4/lkozpnaLnmoTms5XlkJHph4/nmoTlpLnop5Jjb3PlgLxcbiAgICAgICAgICAgIC8vIGNvbnN0IG5kb3RsID0gZGF0YS5uZG90bGE7XG5cbiAgICAgICAgICAgIGxldCB0ZXh0dXJlQ29sb3I7XG4gICAgICAgICAgICBpZiAodGV4dHVyZSkge1xuICAgICAgICAgICAgICAgIHRleHR1cmVDb2xvciA9IHRleHR1cmUubWFwKHUsIHYpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXh0dXJlQ29sb3IgPSBuZXcgQkFCWUxPTi5Db2xvcjQoMSwgMSwgMSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGFuZ2luZyB0aGUgY29sb3IgdmFsdWUgdXNpbmcgdGhlIGNvc2luZSBvZiB0aGUgYW5nbGVcbiAgICAgICAgICAgIC8vIGJldHdlZW4gdGhlIGxpZ2h0IHZlY3RvciBhbmQgdGhlIG5vcm1hbCB2ZWN0b3JcbiAgICAgICAgICAgIHRoaXMuZHJhd1BvaW50KFxuICAgICAgICAgICAgICAgIG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgZGF0YS5jdXJyZW50WSwgeiksXG4gICAgICAgICAgICAgICAgbmV3IEJBQllMT04uQ29sb3I0KFxuICAgICAgICAgICAgICAgICAgICBjb2xvci5yICogbmRvdGwgKiB0ZXh0dXJlQ29sb3IucixcbiAgICAgICAgICAgICAgICAgICAgY29sb3IuZyAqIG5kb3RsICogdGV4dHVyZUNvbG9yLmcsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yLmIgKiBuZG90bCAqIHRleHR1cmVDb2xvci5iLFxuICAgICAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgLy8gY29sb3IsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6h566XIOWFiea6kOWQkemHjyhsaWdodCnvvIjnga/mupDlnZDmoIcgLSDpobbngrnlnZDmoIfvvInlkozms5XlkJHph4/vvIhub3JtYWzvvInnmoTlpLnop5LnmoRjb3PlgLzvvIzov5Tlm57lgLwwIOWIsCAxXG4gICAgICpcbiAgICAgKiBub3JtYWwgdmVjdG9yIOKAoiBsaWdodCB2ZWN0b3JcbiAgICAgKiBAcGFyYW0gdmVydGV4XG4gICAgICogQHBhcmFtIG5vcm1hbFxuICAgICAqIEBwYXJhbSBsaWdodFBvc2l0aW9uXG4gICAgICovXG4gICAgcHVibGljIGNvbXB1dGVORG90TCh2ZXJ0ZXg6IEJBQllMT04uVmVjdG9yMywgbm9ybWFsOiBCQUJZTE9OLlZlY3RvcjMsIGxpZ2h0UG9zaXRpb246IEJBQllMT04uVmVjdG9yMyk6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IGxpZ2h0RGlyZWN0aW9uID0gbGlnaHRQb3NpdGlvbi5zdWJ0cmFjdCh2ZXJ0ZXgpO1xuICAgICAgICBub3JtYWwubm9ybWFsaXplKCk7XG4gICAgICAgIGxpZ2h0RGlyZWN0aW9uLm5vcm1hbGl6ZSgpO1xuXG4gICAgICAgIHJldHVybiBNYXRoLm1heCgwLCBCQUJZTE9OLlZlY3RvcjMuRG90KG5vcm1hbCwgbGlnaHREaXJlY3Rpb24pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZHJhd1RyaWFuZ2xlKHYxOiBWZXJ0ZXgsIHYyOiBWZXJ0ZXgsIHYzOiBWZXJ0ZXgsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCwgdGV4dHVyZT86IFRleHR1cmUpOiB2b2lkIHtcbiAgICAgICAgLy8gU29ydGluZyB0aGUgcG9pbnRzIGluIG9yZGVyIHRvIGFsd2F5cyBoYXZlIHRoaXMgb3JkZXIgb24gc2NyZWVuIHAxLCBwMiAmIHAzXG4gICAgICAgIC8vIHdpdGggcDEgYWx3YXlzIHVwICh0aHVzIGhhdmluZyB0aGUgWSB0aGUgbG93ZXN0IHBvc3NpYmxlIHRvIGJlIG5lYXIgdGhlIHRvcCBzY3JlZW4pXG4gICAgICAgIC8vIHRoZW4gcDIgYmV0d2VlbiBwMSAmIHAzIChhY2NvcmRpbmcgdG8gWS1heGlzIHVwIHRvIGRvd24gKVxuICAgICAgICBpZiAodjEuY29vcmRpbmF0ZXMueSA+IHYyLmNvb3JkaW5hdGVzLnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXAgPSB2MjtcbiAgICAgICAgICAgIHYyID0gdjE7XG4gICAgICAgICAgICB2MSA9IHRlbXA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodjIuY29vcmRpbmF0ZXMueSA+IHYzLmNvb3JkaW5hdGVzLnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXAgPSB2MjtcbiAgICAgICAgICAgIHYyID0gdjM7XG4gICAgICAgICAgICB2MyA9IHRlbXA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodjEuY29vcmRpbmF0ZXMueSA+IHYyLmNvb3JkaW5hdGVzLnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXAgPSB2MjtcbiAgICAgICAgICAgIHYyID0gdjE7XG4gICAgICAgICAgICB2MSA9IHRlbXA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc29ydCBlbmRcblxuICAgICAgICBjb25zdCBwMSA9IHYxLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwMiA9IHYyLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwMyA9IHYzLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgIC8vIG5vcm1hbCBmYWNlJ3MgdmVjdG9yIGlzIHRoZSBhdmVyYWdlIG5vcm1hbCBiZXR3ZWVuIGVhY2ggdmVydGV4J3Mgbm9ybWFsXG4gICAgICAgIC8vIGNvbXB1dGluZyBhbHNvIHRoZSBjZW50ZXIgcG9pbnQgb2YgdGhlIGZhY2VcbiAgICAgICAgLy8gLy8g6Z2i55qE5rOV5ZCR6YePXG4gICAgICAgIC8vIGNvbnN0IHZuRmFjZSA9IHYxLm5vcm1hbC5hZGQodjIubm9ybWFsLmFkZCh2My5ub3JtYWwpKS5zY2FsZSgxIC8gMyk7XG4gICAgICAgIC8vIC8vIOmdoueahOS4reW/g+eCuVxuICAgICAgICAvLyBjb25zdCBjZW50ZXJQb2ludCA9IHYxLndvcmxkQ29vcmRpbmF0ZXMuYWRkKHYyLndvcmxkQ29vcmRpbmF0ZXMuYWRkKHYzLndvcmxkQ29vcmRpbmF0ZXMpKS5zY2FsZSgxIC8gMyk7XG4gICAgICAgIC8vIGxpZ2h0IHBvc2l0aW9uXG4gICAgICAgIGNvbnN0IGxpZ2h0UG9zID0gbmV3IEJBQllMT04uVmVjdG9yMygwLCAxMCwgMTApO1xuICAgICAgICAvLyDorqHnrpflhYnmupDlkJHph4/lkozpnaLnmoTms5XlkJHph4/nmoTlpLnop5Jjb3PlgLxcbiAgICAgICAgLy8gY29uc3QgbmRvdGwgPSB0aGlzLmNvbXB1dGVORG90TChjZW50ZXJQb2ludCwgdm5GYWNlLCBsaWdodFBvcyk7XG4gICAgICAgIGNvbnN0IG5sMSA9IHRoaXMuY29tcHV0ZU5Eb3RMKHYxLndvcmxkQ29vcmRpbmF0ZXMsIHYxLm5vcm1hbCwgbGlnaHRQb3MpO1xuICAgICAgICBjb25zdCBubDIgPSB0aGlzLmNvbXB1dGVORG90TCh2Mi53b3JsZENvb3JkaW5hdGVzLCB2Mi5ub3JtYWwsIGxpZ2h0UG9zKTtcbiAgICAgICAgY29uc3QgbmwzID0gdGhpcy5jb21wdXRlTkRvdEwodjMud29ybGRDb29yZGluYXRlcywgdjMubm9ybWFsLCBsaWdodFBvcyk7XG5cbiAgICAgICAgY29uc3QgZGF0YTogU2NhbkxpbmVEYXRhID0ge307XG5cbiAgICAgICAgLy8gaW52ZXJzZSBzbG9wZXNcbiAgICAgICAgbGV0IGRQMVAyOiBudW1iZXI7XG4gICAgICAgIGxldCBkUDFQMzogbnVtYmVyO1xuXG4gICAgICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU2xvcGVcbiAgICAgICAgLy8gQ29tcHV0aW5nIHNsb3Blc1xuICAgICAgICBpZiAocDIueSAtIHAxLnkgPiAwKSB7XG4gICAgICAgICAgICBkUDFQMiA9IChwMi54IC0gcDEueCkgLyAocDIueSAtIHAxLnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZFAxUDIgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHAzLnkgLSBwMS55ID4gMCkge1xuICAgICAgICAgICAgZFAxUDMgPSAocDMueCAtIHAxLngpIC8gKHAzLnkgLSBwMS55KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRQMVAzID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpcnN0IGNhc2Ugd2hlcmUgdHJpYW5nbGVzIGFyZSBsaWtlIHRoYXQ6XG4gICAgICAgIC8vICAgICAgICAgcDFcbiAgICAgICAgLy8gICAgICAgICAgIM6bXG4gICAgICAgIC8vICAgICAgICAgIOKVsSDilbJcbiAgICAgICAgLy8gICAgICAgICDilbEgICDilbJcbiAgICAgICAgLy8gICAgICAgIOKVsSAgICAg4pWyXG4gICAgICAgIC8vICAgICAgIOKVsSAgICAgICDilbJcbiAgICAgICAgLy8gICAgICDilbEgICAgICAgICDilbJcbiAgICAgICAgLy8gICAgIOKVsSAgICAgICAgICAg4pWyXG4gICAgICAgIC8vICAgIOKVsSAgICAgICAgICAgICAgIOKWj3AyXG4gICAgICAgIC8vICDilbFcbiAgICAgICAgLy8gcDMg4paV4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgICAgIC8vIHAyIG9uIHJpZ2h0XG4gICAgICAgIGlmIChkUDFQMiA+IGRQMVAzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gcDEueSA+PiAwOyB5IDw9IHAzLnkgPj4gMDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5jdXJyZW50WSA9IHk7XG4gICAgICAgICAgICAgICAgaWYgKHkgPCBwMi55KSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxhID0gbmwxO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYiA9IG5sMztcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGMgPSBubDE7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxkID0gbmwyO1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWEgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS51YiA9IHYzLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnVjID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWQgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcblxuICAgICAgICAgICAgICAgICAgICBkYXRhLnZhID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmIgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YyA9IHYxLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnZkID0gdjIuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc2NhbiBwMXAzIHAxcDJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzU2NhbkxpbmUoZGF0YSwgdjEsIHYzLCB2MSwgdjIsIGNvbG9yLCB0ZXh0dXJlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYSA9IG5sMTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGIgPSBubDM7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxjID0gbmwyO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsZCA9IG5sMztcblxuICAgICAgICAgICAgICAgICAgICBkYXRhLnVhID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWIgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS51YyA9IHYyLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnVkID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YSA9IHYxLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnZiID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmMgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52ZCA9IHYzLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDMgcDJwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZShkYXRhLCB2MSwgdjMsIHYyLCB2MywgY29sb3IsIHRleHR1cmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHAyIG9uIGxlZnRcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSBwMS55ID4+IDA7IHkgPD0gcDMueSA+PiAwOyB5KyspIHtcbiAgICAgICAgICAgICAgICBkYXRhLmN1cnJlbnRZID0geTtcbiAgICAgICAgICAgICAgICBpZiAoeSA8IHAyLnkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGEgPSBubDE7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxiID0gbmwyO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYyA9IG5sMTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGQgPSBubDM7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YS51YSA9IHYxLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnViID0gdjIuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWMgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS51ZCA9IHYzLlRleHR1cmVDb29yZGluYXRlcy54O1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmEgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YiA9IHYyLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnZjID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmQgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDIgcDFwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZShkYXRhLCB2MSwgdjIsIHYxLCB2MywgY29sb3IsIHRleHR1cmUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxhID0gbmwyO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYiA9IG5sMztcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGMgPSBubDE7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxkID0gbmwzO1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWEgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS51YiA9IHYzLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnVjID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWQgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcblxuICAgICAgICAgICAgICAgICAgICBkYXRhLnZhID0gdjIuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmIgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YyA9IHYxLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnZkID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc2NhbiBwMnAzIHAxcDNcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzU2NhbkxpbmUoZGF0YSwgdjIsIHYzLCB2MSwgdjMsIGNvbG9yLCB0ZXh0dXJlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKGNhbWVyYTogQ2FtZXJhLCBtZXNoZXM6IE1lc2hbXSkge1xuICAgICAgICBjb25zdCB2aWV3TWF0cml4ID0gQkFCWUxPTi5NYXRyaXguTG9va0F0TEgoY2FtZXJhLnBvc2l0aW9uLCBjYW1lcmEudGFyZ2V0LCBCQUJZTE9OLlZlY3RvcjMuVXAoKSk7XG5cbiAgICAgICAgY29uc3QgcHJvamVjdE1hdHJpeCA9IEJBQllMT04uTWF0cml4LlBlcnNwZWN0aXZlRm92TEgoMC43OCwgdGhpcy53b3JraW5nV2lkdGggLyB0aGlzLndvcmtpbmdIZWlnaHQsIDAuMDEsIDEuMCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBjTWVzaCBvZiBtZXNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gQkFCWUxPTi5NYXRyaXguUm90YXRpb25ZYXdQaXRjaFJvbGwoXG4gICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueSxcbiAgICAgICAgICAgICAgICBjTWVzaC5yb3RhdGlvbi54LFxuICAgICAgICAgICAgICAgIGNNZXNoLnJvdGF0aW9uLnosXG4gICAgICAgICAgICApLm11bHRpcGx5KEJBQllMT04uTWF0cml4LlRyYW5zbGF0aW9uKGNNZXNoLnBvc3Rpb24ueCwgY01lc2gucG9zdGlvbi55LCBjTWVzaC5wb3N0aW9uLnopKTtcblxuICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtTWF0cml4ID0gd29ybGRNYXRyaXgubXVsdGlwbHkodmlld01hdHJpeCkubXVsdGlwbHkocHJvamVjdE1hdHJpeCk7XG5cbiAgICAgICAgICAgIC8qKiBkcmF3IHBvaW50cyAqL1xuICAgICAgICAgICAgLy8gZm9yIChjb25zdCBpbmRleFZlcnRleCBvZiBjTWVzaC52ZXJ0aWNlcykge1xuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHByb2plY3RQb2ludCA9IHRoaXMucHJvamVjdChpbmRleFZlcnRleCwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmRyYXdQb2ludChwcm9qZWN0UG9pbnQpO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvKiogZHJhdyBsaW5lcyAqL1xuICAgICAgICAgICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCBjTWVzaC52ZXJ0aWNlcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwb2ludDAgPSB0aGlzLnByb2plY3QoY01lc2gudmVydGljZXNbaV0sIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcG9pbnQxID0gdGhpcy5wcm9qZWN0KGNNZXNoLnZlcnRpY2VzW2kgKyAxXSwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmRyYXdMaW5lKHBvaW50MCwgcG9pbnQxKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLyoqIGRyYXcgZmFjZXMgKi9cbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogcHJlZmVyLWZvci1vZlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjTWVzaC5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRGYWNlID0gY01lc2guZmFjZXNbaV07XG5cbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhBID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQV07XG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QiA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkJdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEMgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5DXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsQSA9IHRoaXMucHJvamVjdCh2ZXJ0ZXhBLCB0cmFuc2Zvcm1NYXRyaXgsIHdvcmxkTWF0cml4KTtcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbEIgPSB0aGlzLnByb2plY3QodmVydGV4QiwgdHJhbnNmb3JtTWF0cml4LCB3b3JsZE1hdHJpeCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxDID0gdGhpcy5wcm9qZWN0KHZlcnRleEMsIHRyYW5zZm9ybU1hdHJpeCwgd29ybGRNYXRyaXgpO1xuXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3TGluZShwaXhlbEEsIHBpeGVsQik7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3TGluZShwaXhlbEIsIHBpeGVsQyk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3TGluZShwaXhlbEMsIHBpeGVsQSk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3QmxpbmUocGl4ZWxBLCBwaXhlbEIpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0JsaW5lKHBpeGVsQiwgcGl4ZWxDKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdCbGluZShwaXhlbEMsIHBpeGVsQSk7XG5cbiAgICAgICAgICAgICAgICAvLyBjb25zdCBjb2xvcjogbnVtYmVyID0gMC4yNSArICgoaSAlIGNNZXNoLmZhY2VzLmxlbmd0aCkgLyBjTWVzaC5mYWNlcy5sZW5ndGgpICogMC43NTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2xvciA9IDEuMDtcbiAgICAgICAgICAgICAgICAvKiogZHJhdyB0cmlhbmdsZSAqL1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1RyaWFuZ2xlKHBpeGVsQSwgcGl4ZWxCLCBwaXhlbEMsIG5ldyBCQUJZTE9OLkNvbG9yNChjb2xvciwgY29sb3IsIGNvbG9yLCAxKSwgY01lc2gudGV4dHVyZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZHJhdyAke3ZlcnRleEEudG9TdHJpbmcoKX0gJHt2ZXJ0ZXhCLnRvU3RyaW5nKCl9ICR7dmVydGV4Qy50b1N0cmluZygpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIOe7mOWItue6v+adoSDmmK/kuIDkuKog6YCS5b2S57uY5Yi26LW35aeL54K5IC0g5Lit6Ze054K5IC0g57uT5p2f54K577yI5oC75YWxIDMgcGl4ZWzvvInnmoTov4fnqIsgKi9cbiAgICAvLyBwdWJsaWMgZHJhd0xpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyKTogdm9pZCB7XG4gICAgLy8gICAgIGNvbnN0IGRpc3QgPSBwb2ludDEuc3VidHJhY3QocG9pbnQwKS5sZW5ndGgoKTtcblxuICAgIC8vICAgICBpZiAoZGlzdCA8IDIpIHtcbiAgICAvLyAgICAgICAgIHJldHVybjtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIGNvbnN0IG1pZGRsZVBvaW50ID0gcG9pbnQwLmFkZChwb2ludDEuc3VidHJhY3QocG9pbnQwKS5zY2FsZSgwLjUpKTtcblxuICAgIC8vICAgICB0aGlzLmRyYXdQb2ludChtaWRkbGVQb2ludCwgbmV3IEJBQllMT04uQ29sb3I0KDEsIDEsIDAsIDEpKTtcblxuICAgIC8vICAgICB0aGlzLmRyYXdMaW5lKHBvaW50MCwgbWlkZGxlUG9pbnQpO1xuICAgIC8vICAgICB0aGlzLmRyYXdMaW5lKG1pZGRsZVBvaW50LCBwb2ludDEpO1xuICAgIC8vIH1cblxuICAgIC8qKlxuICAgICAqIFtCcmVzZW5oYW0nc19saW5lX2FsZ29yaXRobV0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQnJlc2VuaGFtJ3NfbGluZV9hbGdvcml0aG0pXG4gICAgICog5pu05bmz5ruR55qE57uY5Yi257q/5p2h55qE566X5rOVXG4gICAgICovXG4gICAgLy8gcHVibGljIGRyYXdCbGluZShwb2ludDA6IEJBQllMT04uVmVjdG9yMiwgcG9pbnQxOiBCQUJZTE9OLlZlY3RvcjIsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCk6IHZvaWQge1xuICAgIC8vICAgICBsZXQgeDAgPSBwb2ludDAueCA+PiAwO1xuICAgIC8vICAgICBsZXQgeTAgPSBwb2ludDAueSA+PiAwO1xuICAgIC8vICAgICBjb25zdCB4MSA9IHBvaW50MS54ID4+IDA7XG4gICAgLy8gICAgIGNvbnN0IHkxID0gcG9pbnQxLnkgPj4gMDtcbiAgICAvLyAgICAgY29uc3QgZHggPSBNYXRoLmFicyh4MSAtIHgwKTtcbiAgICAvLyAgICAgY29uc3QgZHkgPSBNYXRoLmFicyh5MSAtIHkwKTtcblxuICAgIC8vICAgICBjb25zdCBzeCA9IHgwIDwgeDEgPyAxIDogLTE7XG4gICAgLy8gICAgIGNvbnN0IHN5ID0geTAgPCB5MSA/IDEgOiAtMTtcblxuICAgIC8vICAgICBsZXQgZXJyID0gZHggLSBkeTtcblxuICAgIC8vICAgICB3aGlsZSAodHJ1ZSkge1xuICAgIC8vICAgICAgICAgdGhpcy5kcmF3UG9pbnQobmV3IEJBQllMT04uVmVjdG9yMih4MCwgeTApLCBjb2xvcik7XG4gICAgLy8gICAgICAgICBpZiAoeDAgPT0geDEgJiYgeTAgPT0geTEpIHtcbiAgICAvLyAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNvbnN0IGUyID0gMiAqIGVycjtcbiAgICAvLyAgICAgICAgIGlmIChlMiA+IC1keSkge1xuICAgIC8vICAgICAgICAgICAgIGVyciAtPSBkeTtcbiAgICAvLyAgICAgICAgICAgICB4MCArPSBzeDtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGlmIChlMiA8IGR4KSB7XG4gICAgLy8gICAgICAgICAgICAgZXJyICs9IGR4O1xuICAgIC8vICAgICAgICAgICAgIHkwICs9IHN5O1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9XG4gICAgLy8gfVxufVxuIiwiaW1wb3J0IHsgTWF0ZXJpYWwsIE1lc2ggfSBmcm9tIFwiLi9tZXNoXCI7XG5pbXBvcnQgeyBUZXh0dXJlIH0gZnJvbSBcIi4vdGV4dHVyZVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEpTT05GaWxlQXN5bmMoZmlsZU5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChyZXN1bHQ6IE1lc2hbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGxldCBqc29uT2JqZWN0ID0ge307XG4gICAgY29uc3QgeG1sSHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhtbEh0dHAub3BlbihcIkdFVFwiLCBmaWxlTmFtZSwgdHJ1ZSk7XG5cbiAgICB4bWxIdHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHhtbEh0dHAucmVhZHlTdGF0ZSA9PSA0ICYmIHhtbEh0dHAuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAganNvbk9iamVjdCA9IEpTT04ucGFyc2UoeG1sSHR0cC5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgLy8gY2FsbGJhY2sodGhpcy5jcmVhdGVNZXNoZXNGcm9tSlNPTihqc29uT2JqZWN0KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhjcmVhdGVNZXNoZXNGcm9tSlNPTihqc29uT2JqZWN0KSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgeG1sSHR0cC5zZW5kKG51bGwpO1xufVxuXG4vKiogaHR0cHM6Ly9kb2MuYmFieWxvbmpzLmNvbS9yZXNvdXJjZXMvZmlsZV9mb3JtYXRfbWFwXyguYmFieWxvbilcbiAqICBqc29uIOagvOW8j1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdDogYW55KTogTWVzaFtdIHtcbiAgICBjb25zdCBtYXRlcmlhbHM6IHsgW2lkOiBzdHJpbmddOiBNYXRlcmlhbCB9ID0ge307XG5cbiAgICBqc29uT2JqZWN0Lm1hdGVyaWFscy5mb3JFYWNoKChtYXRlcmlhbCkgPT4ge1xuICAgICAgICBtYXRlcmlhbHNbbWF0ZXJpYWwuaWRdID0ge1xuICAgICAgICAgICAgSUQ6IG1hdGVyaWFsLmlkLFxuICAgICAgICAgICAgbmFtZTogbWF0ZXJpYWwubmFtZSxcbiAgICAgICAgICAgIGRpZmZ1c2VUZXh0dXJlTmFtZTogbWF0ZXJpYWwuZGlmZnVzZVRleHR1cmUubmFtZSxcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IG1lc2hlczogTWVzaFtdID0ganNvbk9iamVjdC5tZXNoZXMubWFwKChtZXNoT2JqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHZlcnRpY2VzQXJyYXk6IG51bWJlcltdID0gbWVzaE9iamVjdC5wb3NpdGlvbnM7XG4gICAgICAgIGlmICghdmVydGljZXNBcnJheSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZhY2VzXG4gICAgICAgIGNvbnN0IGluZGljZXNBcnJheTogbnVtYmVyW10gPSBtZXNoT2JqZWN0LmluZGljZXM7XG5cbiAgICAgICAgY29uc3Qgbm9ybWFsczogbnVtYmVyW10gPSBtZXNoT2JqZWN0Lm5vcm1hbHM7XG5cbiAgICAgICAgY29uc3QgdmVydGljZXNDb3VudCA9IHZlcnRpY2VzQXJyYXkubGVuZ3RoO1xuXG4gICAgICAgIGNvbnN0IHV2czogbnVtYmVyW10gPSBtZXNoT2JqZWN0LnV2cztcblxuICAgICAgICAvLyBudW1iZXIgb2YgZmFjZXMgaXMgbG9naWNhbGx5IHRoZSBzaXplIG9mIHRoZSBhcnJheSBkaXZpZGVkIGJ5IDMgKEEsIEIsIEMpXG4gICAgICAgIGNvbnN0IGZhY2VzQ291bnQgPSBpbmRpY2VzQXJyYXkubGVuZ3RoIC8gMztcbiAgICAgICAgY29uc3QgbWVzaCA9IG5ldyBNZXNoKG1lc2hPYmplY3QubmFtZSwgdmVydGljZXNDb3VudCwgZmFjZXNDb3VudCk7XG5cbiAgICAgICAgLy8gRmlsbGluZyB0aGUgdmVydGljZXMgYXJyYXkgb2Ygb3VyIG1lc2ggZmlyc3TvvIzmoLnmja5wb3NpdGlvbiDmr4/mrKHlj5bkuInkuKrmlL7liLDpobbngrnmlbDmja5cbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHZlcnRpY2VzQ291bnQgLyAzOyArK2luZGV4KSB7XG4gICAgICAgICAgICBjb25zdCB4ID0gdmVydGljZXNBcnJheVtpbmRleCAqIDNdO1xuICAgICAgICAgICAgY29uc3QgeSA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzICsgMV07XG4gICAgICAgICAgICBjb25zdCB6ID0gdmVydGljZXNBcnJheVtpbmRleCAqIDMgKyAyXTtcblxuICAgICAgICAgICAgY29uc3QgbnggPSBub3JtYWxzW2luZGV4ICogM107XG4gICAgICAgICAgICBjb25zdCBueSA9IG5vcm1hbHNbaW5kZXggKiAzICsgMV07XG4gICAgICAgICAgICBjb25zdCBueiA9IG5vcm1hbHNbaW5kZXggKiAzICsgMl07XG5cbiAgICAgICAgICAgIG1lc2gudmVydGljZXNbaW5kZXhdID0ge1xuICAgICAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBuZXcgQkFCWUxPTi5WZWN0b3IzKHgsIHksIHopLFxuICAgICAgICAgICAgICAgIG5vcm1hbDogbmV3IEJBQllMT04uVmVjdG9yMyhueCwgbnksIG56KSxcbiAgICAgICAgICAgICAgICB3b3JsZENvb3JkaW5hdGVzOiBudWxsLFxuICAgICAgICAgICAgICAgIFRleHR1cmVDb29yZGluYXRlczogbmV3IEJBQllMT04uVmVjdG9yMih1dnNbaW5kZXggKiAyXSwgdXZzW2luZGV4ICogMiArIDFdKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGVuIGZpbGxpbmcgdGhlIGZhY2VzIGFycmF5IOagueaNrumdoueahOeCuee0ouW8leaVsOaNru+8jOavj+asoeWPluS4ieS4qiDmlL7liLBtZXNo55qE6Z2i5pWw5o2u5Lit5Y67XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBmYWNlc0NvdW50OyArK2luZGV4KSB7XG4gICAgICAgICAgICBjb25zdCBhID0gaW5kaWNlc0FycmF5W2luZGV4ICogM107XG4gICAgICAgICAgICBjb25zdCBiID0gaW5kaWNlc0FycmF5W2luZGV4ICogMyArIDFdO1xuICAgICAgICAgICAgY29uc3QgYyA9IGluZGljZXNBcnJheVtpbmRleCAqIDMgKyAyXTtcblxuICAgICAgICAgICAgbWVzaC5mYWNlc1tpbmRleF0gPSB7XG4gICAgICAgICAgICAgICAgQTogYSxcbiAgICAgICAgICAgICAgICBCOiBiLFxuICAgICAgICAgICAgICAgIEM6IGMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0dGluZyB0aGUgcG9zaXRpb24geW91J3ZlIHNldCBpbiBCbGVuZGVyXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gbWVzaE9iamVjdC5wb3NpdGlvbjtcbiAgICAgICAgbWVzaC5wb3N0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMyhwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sIHBvc2l0aW9uWzJdKTtcblxuICAgICAgICBpZiAodXZzICYmIHV2cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBtYXRlcmlhbElEID0gbWVzaE9iamVjdC5tYXRlcmlhbElkO1xuICAgICAgICAgICAgaWYgKG1hdGVyaWFsc1ttYXRlcmlhbElEXSkge1xuICAgICAgICAgICAgICAgIG1lc2gudGV4dHVyZSA9IG5ldyBUZXh0dXJlKG1hdGVyaWFsc1ttYXRlcmlhbElEXS5kaWZmdXNlVGV4dHVyZU5hbWUsIDIwNDgsIDIwNDgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1lc2g7XG4gICAgfSk7XG4gICAgcmV0dXJuIG1lc2hlcztcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJiYWJ5bG9uLm1hdGgudHNcIi8+XG5cbmltcG9ydCB7IENhbWVyYSB9IGZyb20gXCIuL2NhbWVyYVwiO1xuaW1wb3J0IHsgRGV2aWNlIH0gZnJvbSBcIi4vZGV2aWNlXCI7XG5pbXBvcnQgeyBsb2FkSlNPTkZpbGVBc3luYyB9IGZyb20gXCIuL2xvYWRlclwiO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gXCIuL21lc2hcIjtcblxubGV0IGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG5sZXQgZGV2aWNlOiBEZXZpY2U7XG5sZXQgbWVzaDogTWVzaDtcbmxldCBtZXNoZXM6IE1lc2hbXSA9IFtdO1xubGV0IGNhbWVyYTogQ2FtZXJhO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBpbml0LCBmYWxzZSk7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcm9udEJ1ZmZlclwiKSBhcyBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICAvLyBtZXNoID0gbmV3IFNvZnRFbmdpbmUuTWVzaChcIkN1YmVcIiwgOCk7XG5cbiAgICAvLyBtZXNoZXMucHVzaChtZXNoKTtcblxuICAgIC8vIG1lc2gudmVydGljZXNbMF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzFdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzJdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbM10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzddID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgLTEpO1xuXG4gICAgLy8gbWVzaCA9IG5ldyBNZXNoKFwiQ3ViZVwiLCA4LCAxMik7XG4gICAgLy8gbWVzaGVzLnB1c2gobWVzaCk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1swXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1szXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s3XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAtMSk7XG5cbiAgICAvLyBtZXNoLmZhY2VzWzBdID0geyBBOiAwLCBCOiAxLCBDOiAyIH07XG4gICAgLy8gbWVzaC5mYWNlc1sxXSA9IHsgQTogMSwgQjogMiwgQzogMyB9O1xuICAgIC8vIG1lc2guZmFjZXNbMl0gPSB7IEE6IDEsIEI6IDMsIEM6IDYgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzNdID0geyBBOiAxLCBCOiA1LCBDOiA2IH07XG4gICAgLy8gbWVzaC5mYWNlc1s0XSA9IHsgQTogMCwgQjogMSwgQzogNCB9O1xuICAgIC8vIG1lc2guZmFjZXNbNV0gPSB7IEE6IDEsIEI6IDQsIEM6IDUgfTtcblxuICAgIC8vIG1lc2guZmFjZXNbNl0gPSB7IEE6IDIsIEI6IDMsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzddID0geyBBOiAzLCBCOiA2LCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1s4XSA9IHsgQTogMCwgQjogMiwgQzogNyB9O1xuICAgIC8vIG1lc2guZmFjZXNbOV0gPSB7IEE6IDAsIEI6IDQsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzEwXSA9IHsgQTogNCwgQjogNSwgQzogNiB9O1xuICAgIC8vIG1lc2guZmFjZXNbMTFdID0geyBBOiA0LCBCOiA2LCBDOiA3IH07XG5cbiAgICBjYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gICAgZGV2aWNlID0gbmV3IERldmljZShjYW52YXMpO1xuXG4gICAgY2FtZXJhLnBvc2l0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMygwLCAwLCAxMCk7XG4gICAgY2FtZXJhLnRhcmdldCA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMCwgMCk7XG5cbiAgICAvLyBjYW1lcmEucG9zaXRpb24gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDMyLCA5NSwgNDUpO1xuICAgIC8vIGNhbWVyYS50YXJnZXQgPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0wLjEzLCAzMSwgOCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcFxuICAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG5cbiAgICBsb2FkSlNPTkZpbGVBc3luYyhcIi4vZGlzdC9yZXMvdGVzdF9tb25rZXkuYmFieWxvblwiLCBsb2FkSlNPTkNvbXBsZXRlZCk7XG4gICAgLy8gbG9hZEpTT05GaWxlQXN5bmMoXCIuL2Rpc3QvcmVzL3JhYmJpdC5iYWJ5bG9uXCIsIGxvYWRKU09OQ29tcGxldGVkKTtcbn1cblxuZnVuY3Rpb24gbG9hZEpTT05Db21wbGV0ZWQobWVzaGVzTG9hZGVkOiBNZXNoW10pIHtcbiAgICBtZXNoZXMgPSBtZXNoZXNMb2FkZWQ7XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd2luZ0xvb3ApO1xufVxuXG5sZXQgcHJldmlvdXNEYXRlOiBudW1iZXIgPSAwO1xuZnVuY3Rpb24gZHJhd2luZ0xvb3AoKSB7XG4gICAgLy8gZnBzXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBjdXJyZW50RnBzID0gMTAwMC4wIC8gKG5vdyAtIHByZXZpb3VzRGF0ZSk7XG4gICAgcHJldmlvdXNEYXRlID0gbm93O1xuXG4gICAgLy8gY29uc29sZS5sb2coYCR7Y3VycmVudEZwcy50b1ByZWNpc2lvbigyKX0gZnBzYCk7XG5cbiAgICBkZXZpY2UuY2xlYXIoKTtcblxuICAgIC8vIHJvdGF0aW5nIHNsaWdodGx5IHRoZSBjdWJlIGR1cmluZyBlYWNoIGZyYW1lIHJlbmRlcmVkXG4gICAgbWVzaGVzLmZvckVhY2goKG1lc2gpID0+IHtcbiAgICAgICAgLy8gbWVzaC5yb3RhdGlvbi54ICs9IDAuMDE7XG4gICAgICAgIG1lc2gucm90YXRpb24ueSArPSAwLjAxO1xuICAgIH0pO1xuXG4gICAgLy8gRG9pbmcgdGhlIHZhcmlvdXMgbWF0cml4IG9wZXJhdGlvbnNcbiAgICBkZXZpY2UucmVuZGVyKGNhbWVyYSwgbWVzaGVzKTtcbiAgICAvLyBGbHVzaGluZyB0aGUgYmFjayBidWZmZXIgaW50byB0aGUgZnJvbnQgYnVmZmVyXG4gICAgZGV2aWNlLnByZXNlbnQoKTtcblxuICAgIC8vIENhbGxpbmcgdGhlIEhUTUw1IHJlbmRlcmluZyBsb29wIHJlY3Vyc2l2ZWx5XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdpbmdMb29wKTtcbn1cbiIsImltcG9ydCB7IFRleHR1cmUgfSBmcm9tIFwiLi90ZXh0dXJlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmFjZSB7XG4gICAgQTogbnVtYmVyO1xuICAgIEI6IG51bWJlcjtcbiAgICBDOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmVydGV4IHtcbiAgICBub3JtYWw6IEJBQllMT04uVmVjdG9yMzsgLy8g5a2Y5YKo54K555qE5rOV5ZCR6YeP77yM5Y+v5Lul55u05o6l5LuO546w5pyJ55qEM2TmuLLmn5Pova/ku7bnmoTlr7zlh7rmlofku7bkuK3ojrflj5ZcbiAgICBjb29yZGluYXRlczogQkFCWUxPTi5WZWN0b3IzOyAvLyBsb2NhbFxuICAgIHdvcmxkQ29vcmRpbmF0ZXM6IEJBQllMT04uVmVjdG9yMzsgLy8gd29ybGRcbiAgICBUZXh0dXJlQ29vcmRpbmF0ZXM/OiBCQUJZTE9OLlZlY3RvcjI7XG59XG5cbmV4cG9ydCBjbGFzcyBNZXNoIHtcbiAgICBwdWJsaWMgcG9zdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyByb3RhdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyB2ZXJ0aWNlczogVmVydGV4W107XG4gICAgcHVibGljIGZhY2VzOiBGYWNlW107XG4gICAgcHVibGljIHRleHR1cmU6IFRleHR1cmU7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCB2ZXJ0aWNlc0NvdW50OiBudW1iZXIsIGZhY2VzQ291bnQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEFycmF5KHZlcnRpY2VzQ291bnQpO1xuICAgICAgICB0aGlzLmZhY2VzID0gbmV3IEFycmF5KGZhY2VzQ291bnQpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgdGhpcy5wb3N0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NhbkxpbmVEYXRhIHtcbiAgICBjdXJyZW50WT86IG51bWJlcjtcbiAgICBuZG90bGE/OiBudW1iZXI7XG4gICAgbmRvdGxiPzogbnVtYmVyO1xuICAgIG5kb3RsYz86IG51bWJlcjtcbiAgICBuZG90bGQ/OiBudW1iZXI7XG5cbiAgICB1YT86IG51bWJlcjtcbiAgICB1Yj86IG51bWJlcjtcbiAgICB1Yz86IG51bWJlcjtcbiAgICB1ZD86IG51bWJlcjtcblxuICAgIHZhPzogbnVtYmVyO1xuICAgIHZiPzogbnVtYmVyO1xuICAgIHZjPzogbnVtYmVyO1xuICAgIHZkPzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1hdGVyaWFsIHtcbiAgICBJRDogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkaWZmdXNlVGV4dHVyZU5hbWU6IHN0cmluZztcbn1cbiIsImV4cG9ydCBjbGFzcyBUZXh0dXJlIHtcbiAgICBwdWJsaWMgd2lkdGg6IG51bWJlcjtcbiAgICBwdWJsaWMgaGVpZ2h0OiBudW1iZXI7XG4gICAgcHVibGljIGludGVybmFsQnVmZmVyOiBJbWFnZURhdGE7XG5cbiAgICBjb25zdHJ1Y3RvcihmaWxlbmFtZTogc3RyaW5nLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICB0aGlzLmxvYWQoZmlsZW5hbWUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBsb2FkKGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgaW1hZ2VUZXh0dXJlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlVGV4dHVyZS5oZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICAgICAgaW1hZ2VUZXh0dXJlLndpZHRoID0gdGhpcy53aWR0aDtcbiAgICAgICAgaW1hZ2VUZXh0dXJlLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGludGVybmFsQ2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgICAgICAgICBpbnRlcm5hbENhbnZhcy53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgICAgICAgICBpbnRlcm5hbENhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IGludGVybmFsQ29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEID0gaW50ZXJuYWxDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICAgICAgaW50ZXJuYWxDb250ZXh0LmRyYXdJbWFnZShpbWFnZVRleHR1cmUsIDAsIDApO1xuICAgICAgICAgICAgdGhpcy5pbnRlcm5hbEJ1ZmZlciA9IGludGVybmFsQ29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgICB9O1xuICAgICAgICBpbWFnZVRleHR1cmUuc3JjID0gZmlsZW5hbWU7XG4gICAgfVxuXG4gICAgLy8gVGFrZXMgdGhlIFUgJiBWIGNvb3JkaW5hdGVzIGV4cG9ydGVkIGJ5IEJsZW5kZXJcbiAgICAvLyBhbmQgcmV0dXJuIHRoZSBjb3JyZXNwb25kaW5nIHBpeGVsIGNvbG9yIGluIHRleHR1cmVcbiAgICBwdWJsaWMgbWFwKHR1OiBudW1iZXIsIHR2OiBudW1iZXIpOiBCQUJZTE9OLkNvbG9yNCB7XG4gICAgICAgIGlmICh0aGlzLmludGVybmFsQnVmZmVyKSB7XG4gICAgICAgICAgICAvLyB1c2luZyBhICUgb3BlcmF0b3IgdG8gY3ljbGUvcmVwZWF0IHRoZSB0ZXh0dXJlIGlmIG5lZWRlZFxuICAgICAgICAgICAgY29uc3QgdSA9IE1hdGguYWJzKCh0dSAqIHRoaXMud2lkdGgpICUgdGhpcy53aWR0aCkgPj4gMDtcbiAgICAgICAgICAgIGNvbnN0IHYgPSBNYXRoLmFicygodHYgKiB0aGlzLmhlaWdodCkgJSB0aGlzLmhlaWdodCkgPj4gMDtcblxuICAgICAgICAgICAgY29uc3QgcG9zID0gKHUgKyB2ICogdGhpcy53aWR0aCkgKiA0O1xuXG4gICAgICAgICAgICBjb25zdCByID0gdGhpcy5pbnRlcm5hbEJ1ZmZlci5kYXRhW3Bvc107XG4gICAgICAgICAgICBjb25zdCBnID0gdGhpcy5pbnRlcm5hbEJ1ZmZlci5kYXRhW3BvcyArIDFdO1xuICAgICAgICAgICAgY29uc3QgYiA9IHRoaXMuaW50ZXJuYWxCdWZmZXIuZGF0YVtwb3MgKyAyXTtcbiAgICAgICAgICAgIGNvbnN0IGEgPSB0aGlzLmludGVybmFsQnVmZmVyLmRhdGFbcG9zICsgM107XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgQkFCWUxPTi5Db2xvcjQociAvIDI1NS4wLCBnIC8gMjU1LjAsIGIgLyAyNTUuMCwgYSAvIDI1NS4wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQkFCWUxPTi5Db2xvcjQoMSwgMSwgMSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=
