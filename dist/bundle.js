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
    var point2d = BABYLON.Vector3.TransformCoordinates(vertex.coordinates, transMat);
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
    var gradient2 = pa.y != pb.y ? (data.currentY - pc.y) / (pd.y - pc.y) : 1;
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
   * 计算 光源向量（灯源坐标 - 顶点坐标）和法向量的夹角的cos值，返回值0 到 1
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
      var temp = v1;
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
          data.ndotld = nl2;
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
      mesh.texture = new texture_1.Texture(materials[materialID].diffuseTextureName, 2048, 2048);
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
  device = new device_1.Device(canvas); // camera.position = new BABYLON.Vector3(0, 0, 10);
  // camera.target = new BABYLON.Vector3(0, 0, 0);

  camera.position = new BABYLON.Vector3(32, 95, 45);
  camera.target = new BABYLON.Vector3(-0.13, 31, 8); // Calling the HTML5 rendering loop
  // requestAnimationFrame(drawingLoop);
  // loadJSONFileAsync("./dist/res/test_monkey.babylon", loadJSONCompleted);

  loader_1.loadJSONFileAsync("./dist/res/rabbit.babylon", loadJSONCompleted);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FtZXJhLnRzIiwic3JjL2RldmljZS50cyIsInNyYy9sb2FkZXIudHMiLCJzcmMvbWFpbi50cyIsInNyYy9tZXNoLnRzIiwic3JjL3RleHR1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQSxJQUFBLE1BQUE7QUFBQTtBQUFBLFlBQUE7QUFJSSxXQUFBLE1BQUEsR0FBQTtBQUNJLFNBQUssUUFBTCxHQUFnQixPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFoQjtBQUNBLFNBQUssTUFBTCxHQUFjLE9BQU8sQ0FBQyxPQUFSLENBQWdCLElBQWhCLEVBQWQ7QUFDSDs7QUFDTCxTQUFBLE1BQUE7QUFBQyxDQVJELEVBQUE7O0FBQWEsT0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBOzs7Ozs7Ozs7QUNJYixJQUFBLE1BQUE7QUFBQTtBQUFBLFlBQUE7QUFXSSxXQUFBLE1BQUEsQ0FBWSxNQUFaLEVBQXFDO0FBQ2pDLFNBQUssYUFBTCxHQUFxQixNQUFyQjtBQUNBLFNBQUssWUFBTCxHQUFvQixNQUFNLENBQUMsS0FBM0I7QUFDQSxTQUFLLGFBQUwsR0FBcUIsTUFBTSxDQUFDLE1BQTVCO0FBRUEsU0FBSyxjQUFMLEdBQXNCLEtBQUssYUFBTCxDQUFtQixVQUFuQixDQUE4QixJQUE5QixDQUF0QjtBQUVBLFNBQUssV0FBTCxHQUFtQixJQUFJLEtBQUosQ0FBVSxLQUFLLFlBQUwsR0FBb0IsS0FBSyxhQUFuQyxDQUFuQjtBQUNIOztBQUVNLEVBQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxLQUFBLEdBQVAsWUFBQTtBQUNJLFNBQUssY0FBTCxDQUFvQixTQUFwQixDQUE4QixDQUE5QixFQUFpQyxDQUFqQyxFQUFvQyxLQUFLLFlBQXpDLEVBQXVELEtBQUssYUFBNUQ7QUFDQSxTQUFLLFVBQUwsR0FBa0IsS0FBSyxjQUFMLENBQW9CLFlBQXBCLENBQWlD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QUFNLENBQUMsR0FBRyxLQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsR0FBRyxHQUFHLENBQS9CLENBQVY7QUFDQSxVQUFNLENBQUMsR0FBRyxLQUFLLGNBQUwsQ0FBb0IsSUFBcEIsQ0FBeUIsR0FBRyxHQUFHLENBQS9CLENBQVY7QUFFQSxhQUFPLElBQUksT0FBTyxDQUFDLE1BQVosQ0FBbUIsQ0FBQyxHQUFHLEtBQXZCLEVBQThCLENBQUMsR0FBRyxLQUFsQyxFQUF5QyxDQUFDLEdBQUcsS0FBN0MsRUFBb0QsQ0FBQyxHQUFHLEtBQXhELENBQVA7QUFDSCxLQWJELE1BYU87QUFDSCxhQUFPLElBQUksT0FBTyxDQUFDLE1BQVosQ0FBbUIsQ0FBbkIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsQ0FBUDtBQUNIO0FBQ0osR0FqQk07O0FBa0JYLFNBQUEsT0FBQTtBQUFDLENBOUNELEVBQUE7O0FBQWEsT0FBQSxDQUFBLE9BQUEsR0FBQSxPQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiZXhwb3J0IGNsYXNzIENhbWVyYSB7XG4gICAgcHVibGljIHBvc2l0aW9uOiBCQUJZTE9OLlZlY3RvcjM7XG4gICAgcHVibGljIHRhcmdldDogQkFCWUxPTi5WZWN0b3IzO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBCQUJZTE9OLlZlY3RvcjMuWmVybygpO1xuICAgICAgICB0aGlzLnRhcmdldCA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ2FtZXJhIH0gZnJvbSBcIi4vY2FtZXJhXCI7XG5pbXBvcnQgeyBNZXNoLCBTY2FuTGluZURhdGEsIFZlcnRleCB9IGZyb20gXCIuL21lc2hcIjtcbmltcG9ydCB7IFRleHR1cmUgfSBmcm9tIFwiLi90ZXh0dXJlXCI7XG5cbmV4cG9ydCBjbGFzcyBEZXZpY2Uge1xuICAgIHByaXZhdGUgYmFja2J1ZmZlcj86IEltYWdlRGF0YTtcbiAgICBwcml2YXRlIHdvcmtpbmdDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuICAgIHByaXZhdGUgd29ya2luZ0NvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcbiAgICBwcml2YXRlIHdvcmtpbmdXaWR0aDogbnVtYmVyO1xuICAgIHByaXZhdGUgd29ya2luZ0hlaWdodDogbnVtYmVyO1xuICAgIC8vIGVxdWFscyB0byBiYWNrYnVmZmVyLmRhdGFcbiAgICBwcml2YXRlIGJhY2tidWZmZXJkYXRhPzogVWludDhDbGFtcGVkQXJyYXk7XG4gICAgLy8g57yT5a2Y5q+P5Liq5YOP57Sg54K555qEIHotYnVmZmVy77yM5aaC5p6c5ZCO6Z2i57uY5Yi255qEeiBpbmRleCDlpKfkuo7lvZPliY3nmoTvvIzliJnlv73nlaXvvIzlkKbliJnopobnm5blvZPliY3nmoTlg4/ntKBcbiAgICBwcml2YXRlIGRlcHRoYnVmZmVyOiBudW1iZXJbXTtcblxuICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICAgICAgdGhpcy53b3JraW5nQ2FudmFzID0gY2FudmFzO1xuICAgICAgICB0aGlzLndvcmtpbmdXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgICAgdGhpcy53b3JraW5nSGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcblxuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0ID0gdGhpcy53b3JraW5nQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKSE7XG5cbiAgICAgICAgdGhpcy5kZXB0aGJ1ZmZlciA9IG5ldyBBcnJheSh0aGlzLndvcmtpbmdXaWR0aCAqIHRoaXMud29ya2luZ0hlaWdodCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndvcmtpbmdXaWR0aCwgdGhpcy53b3JraW5nSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyID0gdGhpcy53b3JraW5nQ29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy53b3JraW5nV2lkdGgsIHRoaXMud29ya2luZ0hlaWdodCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRlcHRoYnVmZmVyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAvLyDloavkuIDkuKrlpKfkuIDngrnnmoTmlbDlrZdcbiAgICAgICAgICAgIHRoaXMuZGVwdGhidWZmZXJbaV0gPSAxMDAwMDAwO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHByZXNlbnQoKSB7XG4gICAgICAgIHRoaXMud29ya2luZ0NvbnRleHQucHV0SW1hZ2VEYXRhKHRoaXMuYmFja2J1ZmZlciEsIDAsIDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBwdXRQaXhlbCh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpIHtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YSA9IHRoaXMuYmFja2J1ZmZlciEuZGF0YTtcblxuICAgICAgICBjb25zdCBpbmRleDogbnVtYmVyID0gKHggPj4gMCkgKyAoeSA+PiAwKSAqIHRoaXMud29ya2luZ1dpZHRoO1xuICAgICAgICBjb25zdCBpbmRleDQ6IG51bWJlciA9IGluZGV4ICogNDtcblxuICAgICAgICBpZiAodGhpcy5kZXB0aGJ1ZmZlcltpbmRleF0gPCB6KSB7XG4gICAgICAgICAgICByZXR1cm47IC8vIERpc2NhcmRcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRlcHRoYnVmZmVyW2luZGV4XSA9IHo7XG5cbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleDRdID0gY29sb3IuciAqIDI1NTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleDQgKyAxXSA9IGNvbG9yLmcgKiAyNTU7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXg0ICsgMl0gPSBjb2xvci5iICogMjU1O1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4NCArIDNdID0gY29sb3IuYSAqIDI1NTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9qZWN0IHRha2VzIHNvbWUgM0QgY29vcmRpbmF0ZXMgYW5kIHRyYW5zZm9ybSB0aGVtXG4gICAgICogaW4gMkQgY29vcmRpbmF0ZXMgdXNpbmcgdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAgICAqL1xuICAgIHB1YmxpYyBwcm9qZWN0KHZlcnRleDogVmVydGV4LCB0cmFuc01hdDogQkFCWUxPTi5NYXRyaXgsIHdvcmxkOiBCQUJZTE9OLk1hdHJpeCk6IFZlcnRleCB7XG4gICAgICAgIC8vIHRyYW5zZm9ybWluZyB0aGUgY29vcmRpbmF0ZXNcbiAgICAgICAgY29uc3QgcG9pbnQyZCA9IEJBQllMT04uVmVjdG9yMy5UcmFuc2Zvcm1Db29yZGluYXRlcyh2ZXJ0ZXguY29vcmRpbmF0ZXMsIHRyYW5zTWF0KTtcbiAgICAgICAgY29uc3QgcG9pbnQzZFdvcmxkID0gQkFCWUxPTi5WZWN0b3IzLlRyYW5zZm9ybUNvb3JkaW5hdGVzKHZlcnRleC5jb29yZGluYXRlcywgd29ybGQpO1xuICAgICAgICBjb25zdCBub3JtYWwzZFdvcmxkID0gQkFCWUxPTi5WZWN0b3IzLlRyYW5zZm9ybUNvb3JkaW5hdGVzKHZlcnRleC5ub3JtYWwsIHdvcmxkKTtcblxuICAgICAgICAvLyBUaGUgdHJhbnNmb3JtZWQgY29vcmRpbmF0ZXMgd2lsbCBiZSBiYXNlZCBvbiBjb29yZGluYXRlIHN5c3RlbVxuICAgICAgICAvLyBzdGFydGluZyBvbiB0aGUgY2VudGVyIG9mIHRoZSBzY3JlZW4uIEJ1dCBkcmF3aW5nIG9uIHNjcmVlbiBub3JtYWxseSBzdGFydHNcbiAgICAgICAgLy8gZnJvbSB0b3AgbGVmdC4gV2UgdGhlbiBuZWVkIHRvIHRyYW5zZm9ybSB0aGVtIGFnYWluIHRvIGhhdmUgeDowLCB5OjAgb24gdG9wIGxlZnRcbiAgICAgICAgY29uc3QgeCA9IChwb2ludDJkLnggKiB0aGlzLndvcmtpbmdXaWR0aCArIHRoaXMud29ya2luZ1dpZHRoIC8gMi4wKSA+PiAwO1xuICAgICAgICBjb25zdCB5ID0gKC1wb2ludDJkLnkgKiB0aGlzLndvcmtpbmdIZWlnaHQgKyB0aGlzLndvcmtpbmdIZWlnaHQgLyAyLjApID4+IDA7XG5cbiAgICAgICAgLy8gcmV0dXJuIG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgeSwgcG9pbnQueik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb29yZGluYXRlczogbmV3IEJBQllMT04uVmVjdG9yMyh4LCB5LCBwb2ludDJkLnopLFxuICAgICAgICAgICAgbm9ybWFsOiBub3JtYWwzZFdvcmxkLFxuICAgICAgICAgICAgd29ybGRDb29yZGluYXRlczogcG9pbnQzZFdvcmxkLFxuICAgICAgICAgICAgVGV4dHVyZUNvb3JkaW5hdGVzOiB2ZXJ0ZXguVGV4dHVyZUNvb3JkaW5hdGVzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGBkcmF3UG9pbnRgIGNhbGxzIHB1dFBpeGVsIGJ1dCBkb2VzIHRoZSBjbGlwcGluZyBvcGVyYXRpb24gYmVmb3JlXG4gICAgICogQHBhcmFtIHBvaW50XG4gICAgICovXG4gICAgcHVibGljIGRyYXdQb2ludChwb2ludDogQkFCWUxPTi5WZWN0b3IzLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpIHtcbiAgICAgICAgLy8gQ2xpcHBpbmcgd2hhdCdzIHZpc2libGUgb24gc2NyZWVuXG4gICAgICAgIGlmIChwb2ludC54ID49IDAgJiYgcG9pbnQueSA+PSAwICYmIHBvaW50LnggPCB0aGlzLndvcmtpbmdXaWR0aCAmJiBwb2ludC55IDwgdGhpcy53b3JraW5nSGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBEcmF3aW5nIGEgeWVsbG93IHBvaW50XG4gICAgICAgICAgICB0aGlzLnB1dFBpeGVsKHBvaW50LngsIHBvaW50LnksIHBvaW50LnosIGNvbG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsYW1waW5nIHZhbHVlcyB0byBrZWVwIHRoZW0gYmV0d2VlbiBtaW4gYW5kIG1heFxuICAgICAqIEBwYXJhbSB2YWx1ZSDlvoXkv67mraPlgLxcbiAgICAgKiBAcGFyYW0gbWluez0wfSDmnIDlsI/lgLxcbiAgICAgKiBAcGFyYW0gbWF4ez0xfSDmnIDlpKflgLxcbiAgICAgKi9cbiAgICBwdWJsaWMgY2xhbXAodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIgPSAwLCBtYXg6IG51bWJlciA9IDEpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbih2YWx1ZSwgbWF4KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJwb2xhdGluZyB0aGUgdmFsdWUgYmV0d2VlbiAyIHZlcnRpY2VzXG4gICAgICogbWluIGlzIHRoZSBzdGFydGluZyBwb2ludCwgbWF4IHRoZSBlbmRpbmcgcG9pbnRcbiAgICAgKiBhbmQgZ3JhZGllbnQgdGhlICUgYmV0d2VlbiB0aGUgMiBwb2ludHNcbiAgICAgKiDmoLnmja4gZ3JhZGllbnTns7vmlbAg6I635Y+WIOS7jiBgbWluYCDliLAgYG1heGAg55qE5Lit6Ze05YC8XG4gICAgICogQHBhcmFtIG1pblxuICAgICAqIEBwYXJhbSBtYXhcbiAgICAgKiBAcGFyYW0gZ3JhZGllbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgaW50ZXJwb2xhdGUobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBncmFkaWVudDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIG1pbiArIChtYXggLSBtaW4pICogdGhpcy5jbGFtcChncmFkaWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZHJhd2luZyBsaW5lIGJldHdlZW4gMiBwb2ludHMgZnJvbSBsZWZ0IHRvIHJpZ2h0XG4gICAgICogcGEgcGIgLT4gcGMgcGRcbiAgICAgKiBwYSxwYixwYyxwZCBtdXN0IHRoZW4gYmUgc29ydGVkIGJlZm9yZVxuICAgICAqIEBwYXJhbSB5XG4gICAgICogQHBhcmFtIHBhXG4gICAgICogQHBhcmFtIHBiXG4gICAgICogQHBhcmFtIHBjXG4gICAgICogQHBhcmFtIHBkXG4gICAgICogQHBhcmFtIGNvbG9yXG4gICAgICovXG4gICAgcHVibGljIHByb2Nlc3NTY2FuTGluZShcbiAgICAgICAgZGF0YTogU2NhbkxpbmVEYXRhLFxuICAgICAgICB2YTogVmVydGV4LFxuICAgICAgICB2YjogVmVydGV4LFxuICAgICAgICB2YzogVmVydGV4LFxuICAgICAgICB2ZDogVmVydGV4LFxuICAgICAgICBjb2xvcjogQkFCWUxPTi5Db2xvcjQsXG4gICAgICAgIHRleHR1cmU/OiBUZXh0dXJlLFxuICAgICk6IHZvaWQge1xuICAgICAgICBjb25zdCBwYSA9IHZhLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwYiA9IHZiLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwYyA9IHZjLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwZCA9IHZkLmNvb3JkaW5hdGVzO1xuICAgICAgICAvLyB0aGFua3MgdG8gY3VycmVudCBZLCB3ZSBjYW4gY29tcHV0ZSB0aGUgZ3JhZGllbnQgdG8gY29tcHV0ZSBvdGhlcnMgdmFsdWVzIGxpa2VcbiAgICAgICAgLy8gdGhlIHN0YXJ0aW5nIFgoc3gpIGFuZCBlbmRpbmcgWCAoZXMpIHRvIGRyYXcgYmV0d2VlblxuICAgICAgICAvLyBpZiBwYS5ZID09IHBiLlkgb3IgcGMuWSA9PSBwZC5ZLCBncmFkaWVudCBpcyBmb3JjZWQgdG8gMVxuICAgICAgICBjb25zdCBncmFkaWVudDEgPSBwYS55ICE9IHBiLnkgPyAoZGF0YS5jdXJyZW50WSAtIHBhLnkpIC8gKHBiLnkgLSBwYS55KSA6IDE7XG4gICAgICAgIGNvbnN0IGdyYWRpZW50MiA9IHBhLnkgIT0gcGIueSA/IChkYXRhLmN1cnJlbnRZIC0gcGMueSkgLyAocGQueSAtIHBjLnkpIDogMTtcblxuICAgICAgICBjb25zdCBzeCA9IHRoaXMuaW50ZXJwb2xhdGUocGEueCwgcGIueCwgZ3JhZGllbnQxKSA+PiAwO1xuICAgICAgICBjb25zdCBleCA9IHRoaXMuaW50ZXJwb2xhdGUocGMueCwgcGQueCwgZ3JhZGllbnQyKSA+PiAwO1xuXG4gICAgICAgIC8vIHN0YXJ0aW5nIFogJiAgZW5kaW5nIFpcbiAgICAgICAgY29uc3QgejE6IG51bWJlciA9IHRoaXMuaW50ZXJwb2xhdGUocGEueiwgcGIueiwgZ3JhZGllbnQxKTtcbiAgICAgICAgY29uc3QgejI6IG51bWJlciA9IHRoaXMuaW50ZXJwb2xhdGUocGMueiwgcGQueiwgZ3JhZGllbnQyKTtcblxuICAgICAgICAvLyBpbnRlcnBvbGF0aW5nIG5vcm1hbHMgb24gWVxuICAgICAgICBjb25zdCBzbmwgPSB0aGlzLmludGVycG9sYXRlKGRhdGEubmRvdGxhLCBkYXRhLm5kb3RsYiwgZ3JhZGllbnQxKTtcbiAgICAgICAgY29uc3QgZW5sID0gdGhpcy5pbnRlcnBvbGF0ZShkYXRhLm5kb3RsYywgZGF0YS5uZG90bGQsIGdyYWRpZW50Mik7XG5cbiAgICAgICAgLy8gaW50ZXJwb2xhdGluZyB0ZXh0dXJlIGNvb3JkaW5hdGVzIG9uIFlcbiAgICAgICAgY29uc3Qgc3UgPSB0aGlzLmludGVycG9sYXRlKGRhdGEudWEsIGRhdGEudWIsIGdyYWRpZW50MSk7XG4gICAgICAgIGNvbnN0IGV1ID0gdGhpcy5pbnRlcnBvbGF0ZShkYXRhLnVjLCBkYXRhLnVkLCBncmFkaWVudDIpO1xuICAgICAgICBjb25zdCBzdiA9IHRoaXMuaW50ZXJwb2xhdGUoZGF0YS52YSwgZGF0YS52YiwgZ3JhZGllbnQxKTtcbiAgICAgICAgY29uc3QgZXYgPSB0aGlzLmludGVycG9sYXRlKGRhdGEudmMsIGRhdGEudmQsIGdyYWRpZW50Mik7XG5cbiAgICAgICAgLy8gZHJhd2luZyBhIGxpbmUgZnJvbSBsZWZ0IChzeCkgdG8gcmlnaHQgKGV4KVxuICAgICAgICBmb3IgKGxldCB4ID0gc3g7IHggPCBleDsgeCsrKSB7XG4gICAgICAgICAgICAvLyBub3JtYWxpc2F0aW9uIHBvdXIgZGVzc2luZXIgZGUgZ2F1Y2hlIMOgIGRyb2l0ZVxuICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQ6IG51bWJlciA9ICh4IC0gc3gpIC8gKGV4IC0gc3gpO1xuXG4gICAgICAgICAgICBjb25zdCB6ID0gdGhpcy5pbnRlcnBvbGF0ZSh6MSwgejIsIGdyYWRpZW50KTtcblxuICAgICAgICAgICAgY29uc3QgbmRvdGwgPSB0aGlzLmludGVycG9sYXRlKHNubCwgZW5sLCBncmFkaWVudCk7XG4gICAgICAgICAgICBjb25zdCB1ID0gdGhpcy5pbnRlcnBvbGF0ZShzdSwgZXUsIGdyYWRpZW50KTtcbiAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmludGVycG9sYXRlKHN2LCBldiwgZ3JhZGllbnQpO1xuXG4gICAgICAgICAgICAvLyDlhYnmupDlkJHph4/lkozpnaLnmoTms5XlkJHph4/nmoTlpLnop5Jjb3PlgLxcbiAgICAgICAgICAgIC8vIGNvbnN0IG5kb3RsID0gZGF0YS5uZG90bGE7XG5cbiAgICAgICAgICAgIGxldCB0ZXh0dXJlQ29sb3I7XG4gICAgICAgICAgICBpZiAodGV4dHVyZSkge1xuICAgICAgICAgICAgICAgIHRleHR1cmVDb2xvciA9IHRleHR1cmUubWFwKHUsIHYpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXh0dXJlQ29sb3IgPSBuZXcgQkFCWUxPTi5Db2xvcjQoMSwgMSwgMSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGFuZ2luZyB0aGUgY29sb3IgdmFsdWUgdXNpbmcgdGhlIGNvc2luZSBvZiB0aGUgYW5nbGVcbiAgICAgICAgICAgIC8vIGJldHdlZW4gdGhlIGxpZ2h0IHZlY3RvciBhbmQgdGhlIG5vcm1hbCB2ZWN0b3JcbiAgICAgICAgICAgIHRoaXMuZHJhd1BvaW50KFxuICAgICAgICAgICAgICAgIG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgZGF0YS5jdXJyZW50WSwgeiksXG4gICAgICAgICAgICAgICAgbmV3IEJBQllMT04uQ29sb3I0KFxuICAgICAgICAgICAgICAgICAgICBjb2xvci5yICogbmRvdGwgKiB0ZXh0dXJlQ29sb3IucixcbiAgICAgICAgICAgICAgICAgICAgY29sb3IuZyAqIG5kb3RsICogdGV4dHVyZUNvbG9yLmcsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yLmIgKiBuZG90bCAqIHRleHR1cmVDb2xvci5iLFxuICAgICAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgLy8gY29sb3IsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICog6K6h566XIOWFiea6kOWQkemHj++8iOeBr+a6kOWdkOaghyAtIOmhtueCueWdkOagh++8ieWSjOazleWQkemHj+eahOWkueinkueahGNvc+WAvO+8jOi/lOWbnuWAvDAg5YiwIDFcbiAgICAgKlxuICAgICAqIG5vcm1hbCB2ZWN0b3Ig4oCiIGxpZ2h0IHZlY3RvclxuICAgICAqIEBwYXJhbSB2ZXJ0ZXhcbiAgICAgKiBAcGFyYW0gbm9ybWFsXG4gICAgICogQHBhcmFtIGxpZ2h0UG9zaXRpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgY29tcHV0ZU5Eb3RMKHZlcnRleDogQkFCWUxPTi5WZWN0b3IzLCBub3JtYWw6IEJBQllMT04uVmVjdG9yMywgbGlnaHRQb3NpdGlvbjogQkFCWUxPTi5WZWN0b3IzKTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgbGlnaHREaXJlY3Rpb24gPSBsaWdodFBvc2l0aW9uLnN1YnRyYWN0KHZlcnRleCk7XG4gICAgICAgIG5vcm1hbC5ub3JtYWxpemUoKTtcbiAgICAgICAgbGlnaHREaXJlY3Rpb24ubm9ybWFsaXplKCk7XG5cbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KDAsIEJBQllMT04uVmVjdG9yMy5Eb3Qobm9ybWFsLCBsaWdodERpcmVjdGlvbikpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkcmF3VHJpYW5nbGUodjE6IFZlcnRleCwgdjI6IFZlcnRleCwgdjM6IFZlcnRleCwgY29sb3I6IEJBQllMT04uQ29sb3I0LCB0ZXh0dXJlPzogVGV4dHVyZSk6IHZvaWQge1xuICAgICAgICAvLyBTb3J0aW5nIHRoZSBwb2ludHMgaW4gb3JkZXIgdG8gYWx3YXlzIGhhdmUgdGhpcyBvcmRlciBvbiBzY3JlZW4gcDEsIHAyICYgcDNcbiAgICAgICAgLy8gd2l0aCBwMSBhbHdheXMgdXAgKHRodXMgaGF2aW5nIHRoZSBZIHRoZSBsb3dlc3QgcG9zc2libGUgdG8gYmUgbmVhciB0aGUgdG9wIHNjcmVlbilcbiAgICAgICAgLy8gdGhlbiBwMiBiZXR3ZWVuIHAxICYgcDMgKGFjY29yZGluZyB0byBZLWF4aXMgdXAgdG8gZG93biApXG4gICAgICAgIGlmICh2MS5jb29yZGluYXRlcy55ID4gdjIuY29vcmRpbmF0ZXMueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHYxO1xuICAgICAgICAgICAgdjIgPSB2MTtcbiAgICAgICAgICAgIHYxID0gdGVtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2Mi5jb29yZGluYXRlcy55ID4gdjMuY29vcmRpbmF0ZXMueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHYyO1xuICAgICAgICAgICAgdjIgPSB2MztcbiAgICAgICAgICAgIHYzID0gdGVtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2MS5jb29yZGluYXRlcy55ID4gdjIuY29vcmRpbmF0ZXMueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHYyO1xuICAgICAgICAgICAgdjIgPSB2MTtcbiAgICAgICAgICAgIHYxID0gdGVtcDtcbiAgICAgICAgfVxuICAgICAgICAvLyBzb3J0IGVuZFxuXG4gICAgICAgIGNvbnN0IHAxID0gdjEuY29vcmRpbmF0ZXM7XG4gICAgICAgIGNvbnN0IHAyID0gdjIuY29vcmRpbmF0ZXM7XG4gICAgICAgIGNvbnN0IHAzID0gdjMuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgLy8gbm9ybWFsIGZhY2UncyB2ZWN0b3IgaXMgdGhlIGF2ZXJhZ2Ugbm9ybWFsIGJldHdlZW4gZWFjaCB2ZXJ0ZXgncyBub3JtYWxcbiAgICAgICAgLy8gY29tcHV0aW5nIGFsc28gdGhlIGNlbnRlciBwb2ludCBvZiB0aGUgZmFjZVxuICAgICAgICAvLyAvLyDpnaLnmoTms5XlkJHph49cbiAgICAgICAgLy8gY29uc3Qgdm5GYWNlID0gdjEubm9ybWFsLmFkZCh2Mi5ub3JtYWwuYWRkKHYzLm5vcm1hbCkpLnNjYWxlKDEgLyAzKTtcbiAgICAgICAgLy8gLy8g6Z2i55qE5Lit5b+D54K5XG4gICAgICAgIC8vIGNvbnN0IGNlbnRlclBvaW50ID0gdjEud29ybGRDb29yZGluYXRlcy5hZGQodjIud29ybGRDb29yZGluYXRlcy5hZGQodjMud29ybGRDb29yZGluYXRlcykpLnNjYWxlKDEgLyAzKTtcbiAgICAgICAgLy8gbGlnaHQgcG9zaXRpb25cbiAgICAgICAgY29uc3QgbGlnaHRQb3MgPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDAsIDEwLCAxMCk7XG4gICAgICAgIC8vIOiuoeeul+WFiea6kOWQkemHj+WSjOmdoueahOazleWQkemHj+eahOWkueinkmNvc+WAvFxuICAgICAgICAvLyBjb25zdCBuZG90bCA9IHRoaXMuY29tcHV0ZU5Eb3RMKGNlbnRlclBvaW50LCB2bkZhY2UsIGxpZ2h0UG9zKTtcbiAgICAgICAgY29uc3QgbmwxID0gdGhpcy5jb21wdXRlTkRvdEwodjEud29ybGRDb29yZGluYXRlcywgdjEubm9ybWFsLCBsaWdodFBvcyk7XG4gICAgICAgIGNvbnN0IG5sMiA9IHRoaXMuY29tcHV0ZU5Eb3RMKHYyLndvcmxkQ29vcmRpbmF0ZXMsIHYyLm5vcm1hbCwgbGlnaHRQb3MpO1xuICAgICAgICBjb25zdCBubDMgPSB0aGlzLmNvbXB1dGVORG90TCh2My53b3JsZENvb3JkaW5hdGVzLCB2My5ub3JtYWwsIGxpZ2h0UG9zKTtcblxuICAgICAgICBjb25zdCBkYXRhOiBTY2FuTGluZURhdGEgPSB7fTtcblxuICAgICAgICAvLyBpbnZlcnNlIHNsb3Blc1xuICAgICAgICBsZXQgZFAxUDI6IG51bWJlcjtcbiAgICAgICAgbGV0IGRQMVAzOiBudW1iZXI7XG5cbiAgICAgICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TbG9wZVxuICAgICAgICAvLyBDb21wdXRpbmcgc2xvcGVzXG4gICAgICAgIGlmIChwMi55IC0gcDEueSA+IDApIHtcbiAgICAgICAgICAgIGRQMVAyID0gKHAyLnggLSBwMS54KSAvIChwMi55IC0gcDEueSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkUDFQMiA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocDMueSAtIHAxLnkgPiAwKSB7XG4gICAgICAgICAgICBkUDFQMyA9IChwMy54IC0gcDEueCkgLyAocDMueSAtIHAxLnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZFAxUDMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmlyc3QgY2FzZSB3aGVyZSB0cmlhbmdsZXMgYXJlIGxpa2UgdGhhdDpcbiAgICAgICAgLy8gICAgICAgICBwMVxuICAgICAgICAvLyAgICAgICAgICAgzptcbiAgICAgICAgLy8gICAgICAgICAg4pWxIOKVslxuICAgICAgICAvLyAgICAgICAgIOKVsSAgIOKVslxuICAgICAgICAvLyAgICAgICAg4pWxICAgICDilbJcbiAgICAgICAgLy8gICAgICAg4pWxICAgICAgIOKVslxuICAgICAgICAvLyAgICAgIOKVsSAgICAgICAgIOKVslxuICAgICAgICAvLyAgICAg4pWxICAgICAgICAgICDilbJcbiAgICAgICAgLy8gICAg4pWxICAgICAgICAgICAgICAg4paPcDJcbiAgICAgICAgLy8gIOKVsVxuICAgICAgICAvLyBwMyDilpXilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICAgICAgLy8gcDIgb24gcmlnaHRcbiAgICAgICAgaWYgKGRQMVAyID4gZFAxUDMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSBwMS55ID4+IDA7IHkgPD0gcDMueSA+PiAwOyB5KyspIHtcbiAgICAgICAgICAgICAgICBkYXRhLmN1cnJlbnRZID0geTtcbiAgICAgICAgICAgICAgICBpZiAoeSA8IHAyLnkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGEgPSBubDE7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxiID0gbmwzO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYyA9IG5sMTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGQgPSBubDI7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YS51YSA9IHYxLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnViID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWMgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS51ZCA9IHYyLlRleHR1cmVDb29yZGluYXRlcy54O1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmEgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YiA9IHYzLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnZjID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmQgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDMgcDFwMlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZShkYXRhLCB2MSwgdjMsIHYxLCB2MiwgY29sb3IsIHRleHR1cmUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxhID0gbmwxO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYiA9IG5sMztcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGMgPSBubDI7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxkID0gbmwzO1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWEgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS51YiA9IHYzLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnVjID0gdjIuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWQgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcblxuICAgICAgICAgICAgICAgICAgICBkYXRhLnZhID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmIgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YyA9IHYyLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnZkID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDFwMyBwMnAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKGRhdGEsIHYxLCB2MywgdjIsIHYzLCBjb2xvciwgdGV4dHVyZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcDIgb24gbGVmdFxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHAxLnkgPj4gMDsgeSA8PSBwMy55ID4+IDA7IHkrKykge1xuICAgICAgICAgICAgICAgIGRhdGEuY3VycmVudFkgPSB5O1xuICAgICAgICAgICAgICAgIGlmICh5IDwgcDIueSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYSA9IG5sMTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGIgPSBubDI7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxjID0gbmwxO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsZCA9IG5sMztcblxuICAgICAgICAgICAgICAgICAgICBkYXRhLnVhID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWIgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS51YyA9IHYxLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnVkID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YSA9IHYxLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnZiID0gdjIuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmMgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52ZCA9IHYzLlRleHR1cmVDb29yZGluYXRlcy55O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDFwMiBwMXAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKGRhdGEsIHYxLCB2MiwgdjEsIHYzLCBjb2xvciwgdGV4dHVyZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGEgPSBubDI7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxiID0gbmwzO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYyA9IG5sMTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGQgPSBubDI7XG5cbiAgICAgICAgICAgICAgICAgICAgZGF0YS51YSA9IHYyLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnViID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudWMgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS51ZCA9IHYzLlRleHR1cmVDb29yZGluYXRlcy54O1xuXG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmEgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS52YiA9IHYzLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICBkYXRhLnZjID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEudmQgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAycDMgcDFwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZShkYXRhLCB2MiwgdjMsIHYxLCB2MywgY29sb3IsIHRleHR1cmUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiDnu5jliLbnur/mnaEg5piv5LiA5LiqIOmAkuW9kue7mOWItui1t+Wni+eCuSAtIOS4remXtOeCuSAtIOe7k+adn+eCue+8iOaAu+WFsSAzIHBpeGVs77yJ55qE6L+H56iLICovXG4gICAgLy8gcHVibGljIGRyYXdMaW5lKHBvaW50MDogQkFCWUxPTi5WZWN0b3IyLCBwb2ludDE6IEJBQllMT04uVmVjdG9yMik6IHZvaWQge1xuICAgIC8vICAgICBjb25zdCBkaXN0ID0gcG9pbnQxLnN1YnRyYWN0KHBvaW50MCkubGVuZ3RoKCk7XG5cbiAgICAvLyAgICAgaWYgKGRpc3QgPCAyKSB7XG4gICAgLy8gICAgICAgICByZXR1cm47XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBjb25zdCBtaWRkbGVQb2ludCA9IHBvaW50MC5hZGQocG9pbnQxLnN1YnRyYWN0KHBvaW50MCkuc2NhbGUoMC41KSk7XG5cbiAgICAvLyAgICAgdGhpcy5kcmF3UG9pbnQobWlkZGxlUG9pbnQsIG5ldyBCQUJZTE9OLkNvbG9yNCgxLCAxLCAwLCAxKSk7XG5cbiAgICAvLyAgICAgdGhpcy5kcmF3TGluZShwb2ludDAsIG1pZGRsZVBvaW50KTtcbiAgICAvLyAgICAgdGhpcy5kcmF3TGluZShtaWRkbGVQb2ludCwgcG9pbnQxKTtcbiAgICAvLyB9XG5cbiAgICAvKipcbiAgICAgKiBbQnJlc2VuaGFtJ3NfbGluZV9hbGdvcml0aG1dKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0JyZXNlbmhhbSdzX2xpbmVfYWxnb3JpdGhtKVxuICAgICAqIOabtOW5s+a7keeahOe7mOWItue6v+adoeeahOeul+azlVxuICAgICAqL1xuICAgIC8vIHB1YmxpYyBkcmF3QmxpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpOiB2b2lkIHtcbiAgICAvLyAgICAgbGV0IHgwID0gcG9pbnQwLnggPj4gMDtcbiAgICAvLyAgICAgbGV0IHkwID0gcG9pbnQwLnkgPj4gMDtcbiAgICAvLyAgICAgY29uc3QgeDEgPSBwb2ludDEueCA+PiAwO1xuICAgIC8vICAgICBjb25zdCB5MSA9IHBvaW50MS55ID4+IDA7XG4gICAgLy8gICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMoeDEgLSB4MCk7XG4gICAgLy8gICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMoeTEgLSB5MCk7XG5cbiAgICAvLyAgICAgY29uc3Qgc3ggPSB4MCA8IHgxID8gMSA6IC0xO1xuICAgIC8vICAgICBjb25zdCBzeSA9IHkwIDwgeTEgPyAxIDogLTE7XG5cbiAgICAvLyAgICAgbGV0IGVyciA9IGR4IC0gZHk7XG5cbiAgICAvLyAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAvLyAgICAgICAgIHRoaXMuZHJhd1BvaW50KG5ldyBCQUJZTE9OLlZlY3RvcjIoeDAsIHkwKSwgY29sb3IpO1xuICAgIC8vICAgICAgICAgaWYgKHgwID09IHgxICYmIHkwID09IHkxKSB7XG4gICAgLy8gICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgICAgICBjb25zdCBlMiA9IDIgKiBlcnI7XG4gICAgLy8gICAgICAgICBpZiAoZTIgPiAtZHkpIHtcbiAgICAvLyAgICAgICAgICAgICBlcnIgLT0gZHk7XG4gICAgLy8gICAgICAgICAgICAgeDAgKz0gc3g7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgICAgICBpZiAoZTIgPCBkeCkge1xuICAgIC8vICAgICAgICAgICAgIGVyciArPSBkeDtcbiAgICAvLyAgICAgICAgICAgICB5MCArPSBzeTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIHB1YmxpYyByZW5kZXIoY2FtZXJhOiBDYW1lcmEsIG1lc2hlczogTWVzaFtdKSB7XG4gICAgICAgIGNvbnN0IHZpZXdNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Mb29rQXRMSChjYW1lcmEucG9zaXRpb24sIGNhbWVyYS50YXJnZXQsIEJBQllMT04uVmVjdG9yMy5VcCgpKTtcblxuICAgICAgICBjb25zdCBwcm9qZWN0TWF0cml4ID0gQkFCWUxPTi5NYXRyaXguUGVyc3BlY3RpdmVGb3ZMSCgwLjc4LCB0aGlzLndvcmtpbmdXaWR0aCAvIHRoaXMud29ya2luZ0hlaWdodCwgMC4wMSwgMS4wKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNNZXNoIG9mIG1lc2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Sb3RhdGlvbllhd1BpdGNoUm9sbChcbiAgICAgICAgICAgICAgICBjTWVzaC5yb3RhdGlvbi55LFxuICAgICAgICAgICAgICAgIGNNZXNoLnJvdGF0aW9uLngsXG4gICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueixcbiAgICAgICAgICAgICkubXVsdGlwbHkoQkFCWUxPTi5NYXRyaXguVHJhbnNsYXRpb24oY01lc2gucG9zdGlvbi54LCBjTWVzaC5wb3N0aW9uLnksIGNNZXNoLnBvc3Rpb24ueikpO1xuXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1NYXRyaXggPSB3b3JsZE1hdHJpeC5tdWx0aXBseSh2aWV3TWF0cml4KS5tdWx0aXBseShwcm9qZWN0TWF0cml4KTtcblxuICAgICAgICAgICAgLyoqIGRyYXcgcG9pbnRzICovXG4gICAgICAgICAgICAvLyBmb3IgKGNvbnN0IGluZGV4VmVydGV4IG9mIGNNZXNoLnZlcnRpY2VzKSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcHJvamVjdFBvaW50ID0gdGhpcy5wcm9qZWN0KGluZGV4VmVydGV4LCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd1BvaW50KHByb2plY3RQb2ludCk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8qKiBkcmF3IGxpbmVzICovXG4gICAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLnZlcnRpY2VzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHBvaW50MCA9IHRoaXMucHJvamVjdChjTWVzaC52ZXJ0aWNlc1tpXSwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwb2ludDEgPSB0aGlzLnByb2plY3QoY01lc2gudmVydGljZXNbaSArIDFdLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpbmUocG9pbnQwLCBwb2ludDEpO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvKiogZHJhdyBmYWNlcyAqL1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBwcmVmZXItZm9yLW9mXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEZhY2UgPSBjTWVzaC5mYWNlc1tpXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEEgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5BXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhCID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQl07XG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QyA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkNdO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxBID0gdGhpcy5wcm9qZWN0KHZlcnRleEEsIHRyYW5zZm9ybU1hdHJpeCwgd29ybGRNYXRyaXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsQiA9IHRoaXMucHJvamVjdCh2ZXJ0ZXhCLCB0cmFuc2Zvcm1NYXRyaXgsIHdvcmxkTWF0cml4KTtcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbEMgPSB0aGlzLnByb2plY3QodmVydGV4QywgdHJhbnNmb3JtTWF0cml4LCB3b3JsZE1hdHJpeCk7XG5cbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQSwgcGl4ZWxCKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQiwgcGl4ZWxDKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQywgcGl4ZWxBKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdCbGluZShwaXhlbEEsIHBpeGVsQik7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3QmxpbmUocGl4ZWxCLCBwaXhlbEMpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0JsaW5lKHBpeGVsQywgcGl4ZWxBKTtcblxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IGNvbG9yOiBudW1iZXIgPSAwLjI1ICsgKChpICUgY01lc2guZmFjZXMubGVuZ3RoKSAvIGNNZXNoLmZhY2VzLmxlbmd0aCkgKiAwLjc1O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gMS4wO1xuICAgICAgICAgICAgICAgIC8qKiBkcmF3IHRyaWFuZ2xlICovXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUocGl4ZWxBLCBwaXhlbEIsIHBpeGVsQywgbmV3IEJBQllMT04uQ29sb3I0KGNvbG9yLCBjb2xvciwgY29sb3IsIDEpLCBjTWVzaC50ZXh0dXJlKTtcblxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkcmF3ICR7dmVydGV4QS50b1N0cmluZygpfSAke3ZlcnRleEIudG9TdHJpbmcoKX0gJHt2ZXJ0ZXhDLnRvU3RyaW5nKCl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXRlcmlhbCwgTWVzaCB9IGZyb20gXCIuL21lc2hcIjtcbmltcG9ydCB7IFRleHR1cmUgfSBmcm9tIFwiLi90ZXh0dXJlXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSlNPTkZpbGVBc3luYyhmaWxlTmFtZTogc3RyaW5nLCBjYWxsYmFjazogKHJlc3VsdDogTWVzaFtdKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbGV0IGpzb25PYmplY3QgPSB7fTtcbiAgICBjb25zdCB4bWxIdHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgeG1sSHR0cC5vcGVuKFwiR0VUXCIsIGZpbGVOYW1lLCB0cnVlKTtcblxuICAgIHhtbEh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAoeG1sSHR0cC5yZWFkeVN0YXRlID09IDQgJiYgeG1sSHR0cC5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgICAgICBqc29uT2JqZWN0ID0gSlNPTi5wYXJzZSh4bWxIdHRwLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAvLyBjYWxsYmFjayh0aGlzLmNyZWF0ZU1lc2hlc0Zyb21KU09OKGpzb25PYmplY3QpKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNyZWF0ZU1lc2hlc0Zyb21KU09OKGpzb25PYmplY3QpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB4bWxIdHRwLnNlbmQobnVsbCk7XG59XG5cbi8qKiBodHRwczovL2RvYy5iYWJ5bG9uanMuY29tL3Jlc291cmNlcy9maWxlX2Zvcm1hdF9tYXBfKC5iYWJ5bG9uKVxuICogIGpzb24g5qC85byPXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNZXNoZXNGcm9tSlNPTihqc29uT2JqZWN0OiBhbnkpOiBNZXNoW10ge1xuICAgIGNvbnN0IG1hdGVyaWFsczogeyBbaWQ6IHN0cmluZ106IE1hdGVyaWFsIH0gPSB7fTtcblxuICAgIGpzb25PYmplY3QubWF0ZXJpYWxzLmZvckVhY2goKG1hdGVyaWFsKSA9PiB7XG4gICAgICAgIG1hdGVyaWFsc1ttYXRlcmlhbC5pZF0gPSB7XG4gICAgICAgICAgICBJRDogbWF0ZXJpYWwuaWQsXG4gICAgICAgICAgICBuYW1lOiBtYXRlcmlhbC5uYW1lLFxuICAgICAgICAgICAgZGlmZnVzZVRleHR1cmVOYW1lOiBtYXRlcmlhbC5kaWZmdXNlVGV4dHVyZS5uYW1lLFxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgY29uc3QgbWVzaGVzOiBNZXNoW10gPSBqc29uT2JqZWN0Lm1lc2hlcy5tYXAoKG1lc2hPYmplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdmVydGljZXNBcnJheTogbnVtYmVyW10gPSBtZXNoT2JqZWN0LnBvc2l0aW9ucztcbiAgICAgICAgaWYgKCF2ZXJ0aWNlc0FycmF5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gRmFjZXNcbiAgICAgICAgY29uc3QgaW5kaWNlc0FycmF5OiBudW1iZXJbXSA9IG1lc2hPYmplY3QuaW5kaWNlcztcblxuICAgICAgICBjb25zdCBub3JtYWxzOiBudW1iZXJbXSA9IG1lc2hPYmplY3Qubm9ybWFscztcblxuICAgICAgICBjb25zdCB2ZXJ0aWNlc0NvdW50ID0gdmVydGljZXNBcnJheS5sZW5ndGg7XG5cbiAgICAgICAgY29uc3QgdXZzOiBudW1iZXJbXSA9IG1lc2hPYmplY3QudXZzO1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBmYWNlcyBpcyBsb2dpY2FsbHkgdGhlIHNpemUgb2YgdGhlIGFycmF5IGRpdmlkZWQgYnkgMyAoQSwgQiwgQylcbiAgICAgICAgY29uc3QgZmFjZXNDb3VudCA9IGluZGljZXNBcnJheS5sZW5ndGggLyAzO1xuICAgICAgICBjb25zdCBtZXNoID0gbmV3IE1lc2gobWVzaE9iamVjdC5uYW1lLCB2ZXJ0aWNlc0NvdW50LCBmYWNlc0NvdW50KTtcblxuICAgICAgICAvLyBGaWxsaW5nIHRoZSB2ZXJ0aWNlcyBhcnJheSBvZiBvdXIgbWVzaCBmaXJzdO+8jOagueaNrnBvc2l0aW9uIOavj+asoeWPluS4ieS4quaUvuWIsOmhtueCueaVsOaNrlxuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdmVydGljZXNDb3VudCAvIDM7ICsraW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IHggPSB2ZXJ0aWNlc0FycmF5W2luZGV4ICogM107XG4gICAgICAgICAgICBjb25zdCB5ID0gdmVydGljZXNBcnJheVtpbmRleCAqIDMgKyAxXTtcbiAgICAgICAgICAgIGNvbnN0IHogPSB2ZXJ0aWNlc0FycmF5W2luZGV4ICogMyArIDJdO1xuXG4gICAgICAgICAgICBjb25zdCBueCA9IG5vcm1hbHNbaW5kZXggKiAzXTtcbiAgICAgICAgICAgIGNvbnN0IG55ID0gbm9ybWFsc1tpbmRleCAqIDMgKyAxXTtcbiAgICAgICAgICAgIGNvbnN0IG56ID0gbm9ybWFsc1tpbmRleCAqIDMgKyAyXTtcblxuICAgICAgICAgICAgbWVzaC52ZXJ0aWNlc1tpbmRleF0gPSB7XG4gICAgICAgICAgICAgICAgY29vcmRpbmF0ZXM6IG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgeSwgeiksXG4gICAgICAgICAgICAgICAgbm9ybWFsOiBuZXcgQkFCWUxPTi5WZWN0b3IzKG54LCBueSwgbnopLFxuICAgICAgICAgICAgICAgIHdvcmxkQ29vcmRpbmF0ZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgVGV4dHVyZUNvb3JkaW5hdGVzOiBuZXcgQkFCWUxPTi5WZWN0b3IyKHV2c1tpbmRleCAqIDJdLCB1dnNbaW5kZXggKiAyICsgMV0pLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZW4gZmlsbGluZyB0aGUgZmFjZXMgYXJyYXkg5qC55o2u6Z2i55qE54K557Si5byV5pWw5o2u77yM5q+P5qyh5Y+W5LiJ5LiqIOaUvuWIsG1lc2jnmoTpnaLmlbDmja7kuK3ljrtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGZhY2VzQ291bnQ7ICsraW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IGEgPSBpbmRpY2VzQXJyYXlbaW5kZXggKiAzXTtcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbmRpY2VzQXJyYXlbaW5kZXggKiAzICsgMV07XG4gICAgICAgICAgICBjb25zdCBjID0gaW5kaWNlc0FycmF5W2luZGV4ICogMyArIDJdO1xuXG4gICAgICAgICAgICBtZXNoLmZhY2VzW2luZGV4XSA9IHtcbiAgICAgICAgICAgICAgICBBOiBhLFxuICAgICAgICAgICAgICAgIEI6IGIsXG4gICAgICAgICAgICAgICAgQzogYyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXR0aW5nIHRoZSBwb3NpdGlvbiB5b3UndmUgc2V0IGluIEJsZW5kZXJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBtZXNoT2JqZWN0LnBvc2l0aW9uO1xuICAgICAgICBtZXNoLnBvc3Rpb24gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSwgcG9zaXRpb25bMl0pO1xuXG4gICAgICAgIGlmICh1dnMgJiYgdXZzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGVyaWFsSUQgPSBtZXNoT2JqZWN0Lm1hdGVyaWFsSWQ7XG4gICAgICAgICAgICBtZXNoLnRleHR1cmUgPSBuZXcgVGV4dHVyZShtYXRlcmlhbHNbbWF0ZXJpYWxJRF0uZGlmZnVzZVRleHR1cmVOYW1lLCAyMDQ4LCAyMDQ4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH0pO1xuICAgIHJldHVybiBtZXNoZXM7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiYmFieWxvbi5tYXRoLnRzXCIvPlxuXG5pbXBvcnQgeyBDYW1lcmEgfSBmcm9tIFwiLi9jYW1lcmFcIjtcbmltcG9ydCB7IERldmljZSB9IGZyb20gXCIuL2RldmljZVwiO1xuaW1wb3J0IHsgbG9hZEpTT05GaWxlQXN5bmMgfSBmcm9tIFwiLi9sb2FkZXJcIjtcbmltcG9ydCB7IE1lc2ggfSBmcm9tIFwiLi9tZXNoXCI7XG5cbmxldCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xubGV0IGRldmljZTogRGV2aWNlO1xubGV0IG1lc2g6IE1lc2g7XG5sZXQgbWVzaGVzOiBNZXNoW10gPSBbXTtcbmxldCBjYW1lcmE6IENhbWVyYTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgaW5pdCwgZmFsc2UpO1xuXG5mdW5jdGlvbiBpbml0KCkge1xuICAgIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZnJvbnRCdWZmZXJcIikgYXMgSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgLy8gbWVzaCA9IG5ldyBTb2Z0RW5naW5lLk1lc2goXCJDdWJlXCIsIDgpO1xuXG4gICAgLy8gbWVzaGVzLnB1c2gobWVzaCk7XG5cbiAgICAvLyBtZXNoLnZlcnRpY2VzWzBdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1sxXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1syXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzNdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzRdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzZdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s3XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIC0xKTtcblxuICAgIC8vIG1lc2ggPSBuZXcgTWVzaChcIkN1YmVcIiwgOCwgMTIpO1xuICAgIC8vIG1lc2hlcy5wdXNoKG1lc2gpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzFdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzJdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbM10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzRdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzZdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbN10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgLTEpO1xuXG4gICAgLy8gbWVzaC5mYWNlc1swXSA9IHsgQTogMCwgQjogMSwgQzogMiB9O1xuICAgIC8vIG1lc2guZmFjZXNbMV0gPSB7IEE6IDEsIEI6IDIsIEM6IDMgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzJdID0geyBBOiAxLCBCOiAzLCBDOiA2IH07XG4gICAgLy8gbWVzaC5mYWNlc1szXSA9IHsgQTogMSwgQjogNSwgQzogNiB9O1xuICAgIC8vIG1lc2guZmFjZXNbNF0gPSB7IEE6IDAsIEI6IDEsIEM6IDQgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzVdID0geyBBOiAxLCBCOiA0LCBDOiA1IH07XG5cbiAgICAvLyBtZXNoLmZhY2VzWzZdID0geyBBOiAyLCBCOiAzLCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1s3XSA9IHsgQTogMywgQjogNiwgQzogNyB9O1xuICAgIC8vIG1lc2guZmFjZXNbOF0gPSB7IEE6IDAsIEI6IDIsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzldID0geyBBOiAwLCBCOiA0LCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1sxMF0gPSB7IEE6IDQsIEI6IDUsIEM6IDYgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzExXSA9IHsgQTogNCwgQjogNiwgQzogNyB9O1xuXG4gICAgY2FtZXJhID0gbmV3IENhbWVyYSgpO1xuICAgIGRldmljZSA9IG5ldyBEZXZpY2UoY2FudmFzKTtcblxuICAgIC8vIGNhbWVyYS5wb3NpdGlvbiA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMCwgMTApO1xuICAgIC8vIGNhbWVyYS50YXJnZXQgPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDAsIDAsIDApO1xuXG4gICAgY2FtZXJhLnBvc2l0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMygzMiwgOTUsIDQ1KTtcbiAgICBjYW1lcmEudGFyZ2V0ID0gbmV3IEJBQllMT04uVmVjdG9yMygtMC4xMywgMzEsIDgpO1xuXG4gICAgLy8gQ2FsbGluZyB0aGUgSFRNTDUgcmVuZGVyaW5nIGxvb3BcbiAgICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd2luZ0xvb3ApO1xuXG4gICAgLy8gbG9hZEpTT05GaWxlQXN5bmMoXCIuL2Rpc3QvcmVzL3Rlc3RfbW9ua2V5LmJhYnlsb25cIiwgbG9hZEpTT05Db21wbGV0ZWQpO1xuICAgIGxvYWRKU09ORmlsZUFzeW5jKFwiLi9kaXN0L3Jlcy9yYWJiaXQuYmFieWxvblwiLCBsb2FkSlNPTkNvbXBsZXRlZCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRKU09OQ29tcGxldGVkKG1lc2hlc0xvYWRlZDogTWVzaFtdKSB7XG4gICAgbWVzaGVzID0gbWVzaGVzTG9hZGVkO1xuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdpbmdMb29wKTtcbn1cblxubGV0IHByZXZpb3VzRGF0ZTogbnVtYmVyID0gMDtcbmZ1bmN0aW9uIGRyYXdpbmdMb29wKCkge1xuICAgIC8vIGZwc1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgY3VycmVudEZwcyA9IDEwMDAuMCAvIChub3cgLSBwcmV2aW91c0RhdGUpO1xuICAgIHByZXZpb3VzRGF0ZSA9IG5vdztcblxuICAgIC8vIGNvbnNvbGUubG9nKGAke2N1cnJlbnRGcHMudG9QcmVjaXNpb24oMil9IGZwc2ApO1xuXG4gICAgZGV2aWNlLmNsZWFyKCk7XG5cbiAgICAvLyByb3RhdGluZyBzbGlnaHRseSB0aGUgY3ViZSBkdXJpbmcgZWFjaCBmcmFtZSByZW5kZXJlZFxuICAgIG1lc2hlcy5mb3JFYWNoKChtZXNoKSA9PiB7XG4gICAgICAgIC8vIG1lc2gucm90YXRpb24ueCArPSAwLjAxO1xuICAgICAgICBtZXNoLnJvdGF0aW9uLnkgKz0gMC4wMTtcbiAgICB9KTtcblxuICAgIC8vIERvaW5nIHRoZSB2YXJpb3VzIG1hdHJpeCBvcGVyYXRpb25zXG4gICAgZGV2aWNlLnJlbmRlcihjYW1lcmEsIG1lc2hlcyk7XG4gICAgLy8gRmx1c2hpbmcgdGhlIGJhY2sgYnVmZmVyIGludG8gdGhlIGZyb250IGJ1ZmZlclxuICAgIGRldmljZS5wcmVzZW50KCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcCByZWN1cnNpdmVseVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG59XG4iLCJpbXBvcnQgeyBUZXh0dXJlIH0gZnJvbSBcIi4vdGV4dHVyZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZhY2Uge1xuICAgIEE6IG51bWJlcjtcbiAgICBCOiBudW1iZXI7XG4gICAgQzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZlcnRleCB7XG4gICAgbm9ybWFsOiBCQUJZTE9OLlZlY3RvcjM7IC8vIOWtmOWCqOeCueeahOazleWQkemHj++8jOWPr+S7peebtOaOpeS7jueOsOacieeahDNk5riy5p+T6L2v5Lu255qE5a+85Ye65paH5Lu25Lit6I635Y+WXG4gICAgY29vcmRpbmF0ZXM6IEJBQllMT04uVmVjdG9yMzsgLy8gbG9jYWxcbiAgICB3b3JsZENvb3JkaW5hdGVzOiBCQUJZTE9OLlZlY3RvcjM7IC8vIHdvcmxkXG4gICAgVGV4dHVyZUNvb3JkaW5hdGVzPzogQkFCWUxPTi5WZWN0b3IyO1xufVxuXG5leHBvcnQgY2xhc3MgTWVzaCB7XG4gICAgcHVibGljIHBvc3Rpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgcm90YXRpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgdmVydGljZXM6IFZlcnRleFtdO1xuICAgIHB1YmxpYyBmYWNlczogRmFjZVtdO1xuICAgIHB1YmxpYyB0ZXh0dXJlOiBUZXh0dXJlO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgdmVydGljZXNDb3VudDogbnVtYmVyLCBmYWNlc0NvdW50OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IG5ldyBBcnJheSh2ZXJ0aWNlc0NvdW50KTtcbiAgICAgICAgdGhpcy5mYWNlcyA9IG5ldyBBcnJheShmYWNlc0NvdW50KTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgIHRoaXMucG9zdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjYW5MaW5lRGF0YSB7XG4gICAgY3VycmVudFk/OiBudW1iZXI7XG4gICAgbmRvdGxhPzogbnVtYmVyO1xuICAgIG5kb3RsYj86IG51bWJlcjtcbiAgICBuZG90bGM/OiBudW1iZXI7XG4gICAgbmRvdGxkPzogbnVtYmVyO1xuXG4gICAgdWE/OiBudW1iZXI7XG4gICAgdWI/OiBudW1iZXI7XG4gICAgdWM/OiBudW1iZXI7XG4gICAgdWQ/OiBudW1iZXI7XG5cbiAgICB2YT86IG51bWJlcjtcbiAgICB2Yj86IG51bWJlcjtcbiAgICB2Yz86IG51bWJlcjtcbiAgICB2ZD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNYXRlcmlhbCB7XG4gICAgSUQ6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGlmZnVzZVRleHR1cmVOYW1lOiBzdHJpbmc7XG59XG4iLCJleHBvcnQgY2xhc3MgVGV4dHVyZSB7XG4gICAgcHVibGljIHdpZHRoOiBudW1iZXI7XG4gICAgcHVibGljIGhlaWdodDogbnVtYmVyO1xuICAgIHB1YmxpYyBpbnRlcm5hbEJ1ZmZlcjogSW1hZ2VEYXRhO1xuXG4gICAgY29uc3RydWN0b3IoZmlsZW5hbWU6IHN0cmluZywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5sb2FkKGZpbGVuYW1lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbG9hZChmaWxlbmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGltYWdlVGV4dHVyZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWFnZVRleHR1cmUuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgICAgIGltYWdlVGV4dHVyZS53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgICAgIGltYWdlVGV4dHVyZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcm5hbENhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgaW50ZXJuYWxDYW52YXMud2lkdGggPSB0aGlzLndpZHRoO1xuICAgICAgICAgICAgaW50ZXJuYWxDYW52YXMuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBpbnRlcm5hbENvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCA9IGludGVybmFsQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgICAgIGludGVybmFsQ29udGV4dC5kcmF3SW1hZ2UoaW1hZ2VUZXh0dXJlLCAwLCAwKTtcbiAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxCdWZmZXIgPSBpbnRlcm5hbENvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2VUZXh0dXJlLnNyYyA9IGZpbGVuYW1lO1xuICAgIH1cblxuICAgIC8vIFRha2VzIHRoZSBVICYgViBjb29yZGluYXRlcyBleHBvcnRlZCBieSBCbGVuZGVyXG4gICAgLy8gYW5kIHJldHVybiB0aGUgY29ycmVzcG9uZGluZyBwaXhlbCBjb2xvciBpbiB0ZXh0dXJlXG4gICAgcHVibGljIG1hcCh0dTogbnVtYmVyLCB0djogbnVtYmVyKTogQkFCWUxPTi5Db2xvcjQge1xuICAgICAgICBpZiAodGhpcy5pbnRlcm5hbEJ1ZmZlcikge1xuICAgICAgICAgICAgLy8gdXNpbmcgYSAlIG9wZXJhdG9yIHRvIGN5Y2xlL3JlcGVhdCB0aGUgdGV4dHVyZSBpZiBuZWVkZWRcbiAgICAgICAgICAgIGNvbnN0IHUgPSBNYXRoLmFicygodHUgKiB0aGlzLndpZHRoKSAlIHRoaXMud2lkdGgpID4+IDA7XG4gICAgICAgICAgICBjb25zdCB2ID0gTWF0aC5hYnMoKHR2ICogdGhpcy5oZWlnaHQpICUgdGhpcy5oZWlnaHQpID4+IDA7XG5cbiAgICAgICAgICAgIGNvbnN0IHBvcyA9ICh1ICsgdiAqIHRoaXMud2lkdGgpICogNDtcblxuICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuaW50ZXJuYWxCdWZmZXIuZGF0YVtwb3NdO1xuICAgICAgICAgICAgY29uc3QgZyA9IHRoaXMuaW50ZXJuYWxCdWZmZXIuZGF0YVtwb3MgKyAxXTtcbiAgICAgICAgICAgIGNvbnN0IGIgPSB0aGlzLmludGVybmFsQnVmZmVyLmRhdGFbcG9zICsgMl07XG4gICAgICAgICAgICBjb25zdCBhID0gdGhpcy5pbnRlcm5hbEJ1ZmZlci5kYXRhW3BvcyArIDNdO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJBQllMT04uQ29sb3I0KHIgLyAyNTUuMCwgZyAvIDI1NS4wLCBiIC8gMjU1LjAsIGEgLyAyNTUuMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJBQllMT04uQ29sb3I0KDEsIDEsIDEsIDEpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19
