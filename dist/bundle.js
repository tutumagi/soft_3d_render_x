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
      worldCoordinates: point3dWorld
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


  Device.prototype.processScanLine = function (data, va, vb, vc, vd, color) {
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
    var z2 = this.interpolate(pc.z, pd.z, gradient2); // drawing a line from left (sx) to right (ex)

    for (var x = sx; x < ex; x++) {
      // normalisation pour dessiner de gauche à droite
      var gradient = (x - sx) / (ex - sx);
      var z = this.interpolate(z1, z2, gradient); // 光源向量和面的法向量的夹角cos值

      var ndotl = data.ndotla; // changing the color value using the cosine of the angle
      // between the light vector and the normal vector

      this.drawPoint(new BABYLON.Vector3(x, data.currentY, z), new BABYLON.Color4(color.r * ndotl, color.g * ndotl, color.b * ndotl, 1));
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

  Device.prototype.drawTriangle = function (v1, v2, v3, color) {
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
    // 面的法向量

    var vnFace = v1.normal.add(v2.normal.add(v3.normal)).scale(1 / 3); // 面的中心点

    var centerPoint = v1.worldCoordinates.add(v2.worldCoordinates.add(v3.worldCoordinates)).scale(1 / 3); // light position

    var lightPos = new BABYLON.Vector3(0, 10, 10); // 计算光源向量和面的法向量的夹角cos值

    var ndotl = this.computeNDotL(centerPoint, vnFace, lightPos);
    var data = {
      ndotla: ndotl
    }; // inverse slopes

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
          // scan p1p3 p1p2
          this.processScanLine(data, v1, v3, v1, v2, color);
        } else {
          // scan p1p3 p2p3
          this.processScanLine(data, v1, v3, v2, v3, color);
        }
      }
    } else {
      // p2 on left
      for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
        data.currentY = y;

        if (y < p2.y) {
          // scan p1p2 p1p3
          this.processScanLine(data, v1, v2, v1, v3, color);
        } else {
          // scan p2p3 p1p3
          this.processScanLine(data, v2, v3, v1, v3, color);
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

        this.drawTriangle(pixelA, pixelB, pixelC, new BABYLON.Color4(color, color, color, 1)); // console.log(`draw ${vertexA.toString()} ${vertexB.toString()} ${vertexC.toString()}`);
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
  return jsonObject.meshes.map(function (meshObject) {
    var verticesArray = meshObject.positions; // Faces

    var indicesArray = meshObject.indices;
    var normals = meshObject.normals;
    var verticesCount = meshObject.subMeshes[0].verticesCount; // number of faces is logically the size of the array divided by 3 (A, B, C)

    var facesCount = indicesArray.length / 3;
    var mesh = new mesh_1.Mesh(meshObject.name, verticesCount, facesCount); // Filling the vertices array of our mesh first，根据position 每次取三个放到顶点数据

    for (var index = 0; index < verticesCount; ++index) {
      var x = verticesArray[index * 3];
      var y = verticesArray[index * 3 + 1];
      var z = verticesArray[index * 3 + 2];
      var nx = normals[index * 3];
      var ny = normals[index * 3 + 1];
      var nz = normals[index * 3 + 2];
      mesh.vertices[index] = {
        coordinates: new BABYLON.Vector3(x, y, z),
        normal: new BABYLON.Vector3(nx, ny, nz),
        worldCoordinates: null
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
    return mesh;
  });
  return [];
}

exports.createMeshesFromJSON = createMeshesFromJSON;

},{"./mesh":5}],4:[function(require,module,exports){
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
  camera.target = new BABYLON.Vector3(0, 0, 0); // Calling the HTML5 rendering loop
  // requestAnimationFrame(drawingLoop);

  loader_1.loadJSONFileAsync("./dist/res/test_monkey.babylon", loadJSONCompleted);
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
  previousDate = now;
  console.log(currentFps.toPrecision(2) + " fps");
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

},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FtZXJhLnRzIiwic3JjL2RldmljZS50cyIsInNyYy9sb2FkZXIudHMiLCJzcmMvbWFpbi50cyIsInNyYy9tZXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsSUFBQSxNQUFBO0FBQUE7QUFBQSxZQUFBO0FBSUksV0FBQSxNQUFBLEdBQUE7QUFDSSxTQUFLLFFBQUwsR0FBZ0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFBaEI7QUFDQSxTQUFLLE1BQUwsR0FBYyxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFkO0FBQ0g7O0FBQ0wsU0FBQSxNQUFBO0FBQUMsQ0FSRCxFQUFBOztBQUFhLE9BQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQTs7Ozs7Ozs7O0FDR2IsSUFBQSxNQUFBO0FBQUE7QUFBQSxZQUFBO0FBV0ksV0FBQSxNQUFBLENBQVksTUFBWixFQUFxQztBQUNqQyxTQUFLLGFBQUwsR0FBcUIsTUFBckI7QUFDQSxTQUFLLFlBQUwsR0FBb0IsTUFBTSxDQUFDLEtBQTNCO0FBQ0EsU0FBSyxhQUFMLEdBQXFCLE1BQU0sQ0FBQyxNQUE1QjtBQUVBLFNBQUssY0FBTCxHQUFzQixLQUFLLGFBQUwsQ0FBbUIsVUFBbkIsQ0FBOEIsSUFBOUIsQ0FBdEI7QUFFQSxTQUFLLFdBQUwsR0FBbUIsSUFBSSxLQUFKLENBQVUsS0FBSyxZQUFMLEdBQW9CLEtBQUssYUFBbkMsQ0FBbkI7QUFDSDs7QUFFTSxFQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsS0FBQSxHQUFQLFlBQUE7QUFDSSxTQUFLLGNBQUwsQ0FBb0IsU0FBcEIsQ0FBOEIsQ0FBOUIsRUFBaUMsQ0FBakMsRUFBb0MsS0FBSyxZQUF6QyxFQUF1RCxLQUFLLGFBQTVEO0FBQ0EsU0FBSyxVQUFMLEdBQWtCLEtBQUssY0FBTCxDQUFvQixZQUFwQixDQUFpQyxDQUFqQyxFQUFvQyxDQUFw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Q0FBdkIsSUFBeUIsTUFBeEM7QUFFQSxFQUFBLE1BQU0sQ0FBQyxLQUFQLEdBUmdCLENBVWhCOztBQUNBLEVBQUEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxVQUFDLElBQUQsRUFBSztBQUNoQjtBQUNBLElBQUEsSUFBSSxDQUFDLFFBQUwsQ0FBYyxDQUFkLElBQW1CLElBQW5CO0FBQ0gsR0FIRCxFQVhnQixDQWdCaEI7O0FBQ0EsRUFBQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQWQsRUFBc0IsTUFBdEIsRUFqQmdCLENBa0JoQjs7QUFDQSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBbkJnQixDQXFCaEI7O0FBQ0EsRUFBQSxxQkFBcUIsQ0FBQyxXQUFELENBQXJCO0FBQ0g7Ozs7Ozs7OztBQ3JGRCxJQUFBLElBQUE7QUFBQTtBQUFBLFlBQUE7QUFNSSxXQUFBLElBQUEsQ0FBbUIsSUFBbkIsRUFBaUMsYUFBakMsRUFBd0QsVUFBeEQsRUFBMEU7QUFBdkQsU0FBQSxJQUFBLEdBQUEsSUFBQTtBQUNmLFNBQUssUUFBTCxHQUFnQixJQUFJLEtBQUosQ0FBVSxhQUFWLENBQWhCO0FBQ0EsU0FBSyxLQUFMLEdBQWEsSUFBSSxLQUFKLENBQVUsVUFBVixDQUFiO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLE9BQU8sQ0FBQyxPQUFSLENBQWdCLElBQWhCLEVBQWhCO0FBQ0EsU0FBSyxPQUFMLEdBQWUsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFBZjtBQUNIOztBQUNMLFNBQUEsSUFBQTtBQUFDLENBWkQsRUFBQTs7QUFBYSxPQUFBLENBQUEsSUFBQSxHQUFBLElBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJleHBvcnQgY2xhc3MgQ2FtZXJhIHtcbiAgICBwdWJsaWMgcG9zaXRpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgdGFyZ2V0OiBCQUJZTE9OLlZlY3RvcjM7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDYW1lcmEgfSBmcm9tIFwiLi9jYW1lcmFcIjtcbmltcG9ydCB7IE1lc2gsIFNjYW5MaW5lRGF0YSwgVmVydGV4IH0gZnJvbSBcIi4vbWVzaFwiO1xuXG5leHBvcnQgY2xhc3MgRGV2aWNlIHtcbiAgICBwcml2YXRlIGJhY2tidWZmZXI/OiBJbWFnZURhdGE7XG4gICAgcHJpdmF0ZSB3b3JraW5nQ2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICBwcml2YXRlIHdvcmtpbmdDb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gICAgcHJpdmF0ZSB3b3JraW5nV2lkdGg6IG51bWJlcjtcbiAgICBwcml2YXRlIHdvcmtpbmdIZWlnaHQ6IG51bWJlcjtcbiAgICAvLyBlcXVhbHMgdG8gYmFja2J1ZmZlci5kYXRhXG4gICAgcHJpdmF0ZSBiYWNrYnVmZmVyZGF0YT86IFVpbnQ4Q2xhbXBlZEFycmF5O1xuICAgIC8vIOe8k+WtmOavj+S4quWDj+e0oOeCueeahCB6LWJ1ZmZlcu+8jOWmguaenOWQjumdoue7mOWItueahHogaW5kZXgg5aSn5LqO5b2T5YmN55qE77yM5YiZ5b+955Wl77yM5ZCm5YiZ6KaG55uW5b2T5YmN55qE5YOP57SgXG4gICAgcHJpdmF0ZSBkZXB0aGJ1ZmZlcjogbnVtYmVyW107XG5cbiAgICBjb25zdHJ1Y3RvcihjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KSB7XG4gICAgICAgIHRoaXMud29ya2luZ0NhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgdGhpcy53b3JraW5nV2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgICAgIHRoaXMud29ya2luZ0hlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cbiAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dCA9IHRoaXMud29ya2luZ0NhbnZhcy5nZXRDb250ZXh0KFwiMmRcIikhO1xuXG4gICAgICAgIHRoaXMuZGVwdGhidWZmZXIgPSBuZXcgQXJyYXkodGhpcy53b3JraW5nV2lkdGggKiB0aGlzLndvcmtpbmdIZWlnaHQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbGVhcigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy53b3JraW5nV2lkdGgsIHRoaXMud29ya2luZ0hlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlciA9IHRoaXMud29ya2luZ0NvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMud29ya2luZ1dpZHRoLCB0aGlzLndvcmtpbmdIZWlnaHQpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5kZXB0aGJ1ZmZlci5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgLy8g5aGr5LiA5Liq5aSn5LiA54K555qE5pWw5a2XXG4gICAgICAgICAgICB0aGlzLmRlcHRoYnVmZmVyW2ldID0gMTAwMDAwMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmVzZW50KCkge1xuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0LnB1dEltYWdlRGF0YSh0aGlzLmJhY2tidWZmZXIhLCAwLCAwKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHV0UGl4ZWwoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgY29sb3I6IEJBQllMT04uQ29sb3I0KSB7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGEgPSB0aGlzLmJhY2tidWZmZXIhLmRhdGE7XG5cbiAgICAgICAgY29uc3QgaW5kZXg6IG51bWJlciA9ICh4ID4+IDApICsgKHkgPj4gMCkgKiB0aGlzLndvcmtpbmdXaWR0aDtcbiAgICAgICAgY29uc3QgaW5kZXg0OiBudW1iZXIgPSBpbmRleCAqIDQ7XG5cbiAgICAgICAgaWYgKHRoaXMuZGVwdGhidWZmZXJbaW5kZXhdIDwgeikge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBEaXNjYXJkXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXB0aGJ1ZmZlcltpbmRleF0gPSB6O1xuXG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXg0XSA9IGNvbG9yLnIgKiAyNTU7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXg0ICsgMV0gPSBjb2xvci5nICogMjU1O1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4NCArIDJdID0gY29sb3IuYiAqIDI1NTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleDQgKyAzXSA9IGNvbG9yLmEgKiAyNTU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvamVjdCB0YWtlcyBzb21lIDNEIGNvb3JkaW5hdGVzIGFuZCB0cmFuc2Zvcm0gdGhlbVxuICAgICAqIGluIDJEIGNvb3JkaW5hdGVzIHVzaW5nIHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICAgKi9cbiAgICBwdWJsaWMgcHJvamVjdCh2ZXJ0ZXg6IFZlcnRleCwgdHJhbnNNYXQ6IEJBQllMT04uTWF0cml4LCB3b3JsZDogQkFCWUxPTi5NYXRyaXgpOiBWZXJ0ZXgge1xuICAgICAgICAvLyB0cmFuc2Zvcm1pbmcgdGhlIGNvb3JkaW5hdGVzXG4gICAgICAgIGNvbnN0IHBvaW50MmQgPSBCQUJZTE9OLlZlY3RvcjMuVHJhbnNmb3JtQ29vcmRpbmF0ZXModmVydGV4LmNvb3JkaW5hdGVzLCB0cmFuc01hdCk7XG4gICAgICAgIGNvbnN0IHBvaW50M2RXb3JsZCA9IEJBQllMT04uVmVjdG9yMy5UcmFuc2Zvcm1Db29yZGluYXRlcyh2ZXJ0ZXguY29vcmRpbmF0ZXMsIHdvcmxkKTtcbiAgICAgICAgY29uc3Qgbm9ybWFsM2RXb3JsZCA9IEJBQllMT04uVmVjdG9yMy5UcmFuc2Zvcm1Db29yZGluYXRlcyh2ZXJ0ZXgubm9ybWFsLCB3b3JsZCk7XG5cbiAgICAgICAgLy8gVGhlIHRyYW5zZm9ybWVkIGNvb3JkaW5hdGVzIHdpbGwgYmUgYmFzZWQgb24gY29vcmRpbmF0ZSBzeXN0ZW1cbiAgICAgICAgLy8gc3RhcnRpbmcgb24gdGhlIGNlbnRlciBvZiB0aGUgc2NyZWVuLiBCdXQgZHJhd2luZyBvbiBzY3JlZW4gbm9ybWFsbHkgc3RhcnRzXG4gICAgICAgIC8vIGZyb20gdG9wIGxlZnQuIFdlIHRoZW4gbmVlZCB0byB0cmFuc2Zvcm0gdGhlbSBhZ2FpbiB0byBoYXZlIHg6MCwgeTowIG9uIHRvcCBsZWZ0XG4gICAgICAgIGNvbnN0IHggPSAocG9pbnQyZC54ICogdGhpcy53b3JraW5nV2lkdGggKyB0aGlzLndvcmtpbmdXaWR0aCAvIDIuMCkgPj4gMDtcbiAgICAgICAgY29uc3QgeSA9ICgtcG9pbnQyZC55ICogdGhpcy53b3JraW5nSGVpZ2h0ICsgdGhpcy53b3JraW5nSGVpZ2h0IC8gMi4wKSA+PiAwO1xuXG4gICAgICAgIC8vIHJldHVybiBuZXcgQkFCWUxPTi5WZWN0b3IzKHgsIHksIHBvaW50LnopO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29vcmRpbmF0ZXM6IG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgeSwgcG9pbnQyZC56KSxcbiAgICAgICAgICAgIG5vcm1hbDogbm9ybWFsM2RXb3JsZCxcbiAgICAgICAgICAgIHdvcmxkQ29vcmRpbmF0ZXM6IHBvaW50M2RXb3JsZCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBgZHJhd1BvaW50YCBjYWxscyBwdXRQaXhlbCBidXQgZG9lcyB0aGUgY2xpcHBpbmcgb3BlcmF0aW9uIGJlZm9yZVxuICAgICAqIEBwYXJhbSBwb2ludFxuICAgICAqL1xuICAgIHB1YmxpYyBkcmF3UG9pbnQocG9pbnQ6IEJBQllMT04uVmVjdG9yMywgY29sb3I6IEJBQllMT04uQ29sb3I0KSB7XG4gICAgICAgIC8vIENsaXBwaW5nIHdoYXQncyB2aXNpYmxlIG9uIHNjcmVlblxuICAgICAgICBpZiAocG9pbnQueCA+PSAwICYmIHBvaW50LnkgPj0gMCAmJiBwb2ludC54IDwgdGhpcy53b3JraW5nV2lkdGggJiYgcG9pbnQueSA8IHRoaXMud29ya2luZ0hlaWdodCkge1xuICAgICAgICAgICAgLy8gRHJhd2luZyBhIHllbGxvdyBwb2ludFxuICAgICAgICAgICAgdGhpcy5wdXRQaXhlbChwb2ludC54LCBwb2ludC55LCBwb2ludC56LCBjb2xvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGFtcGluZyB2YWx1ZXMgdG8ga2VlcCB0aGVtIGJldHdlZW4gbWluIGFuZCBtYXhcbiAgICAgKiBAcGFyYW0gdmFsdWUg5b6F5L+u5q2j5YC8XG4gICAgICogQHBhcmFtIG1pbns9MH0g5pyA5bCP5YC8XG4gICAgICogQHBhcmFtIG1heHs9MX0g5pyA5aSn5YC8XG4gICAgICovXG4gICAgcHVibGljIGNsYW1wKHZhbHVlOiBudW1iZXIsIG1pbjogbnVtYmVyID0gMCwgbWF4OiBudW1iZXIgPSAxKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4odmFsdWUsIG1heCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVycG9sYXRpbmcgdGhlIHZhbHVlIGJldHdlZW4gMiB2ZXJ0aWNlc1xuICAgICAqIG1pbiBpcyB0aGUgc3RhcnRpbmcgcG9pbnQsIG1heCB0aGUgZW5kaW5nIHBvaW50XG4gICAgICogYW5kIGdyYWRpZW50IHRoZSAlIGJldHdlZW4gdGhlIDIgcG9pbnRzXG4gICAgICog5qC55o2uIGdyYWRpZW5057O75pWwIOiOt+WPliDku44gYG1pbmAg5YiwIGBtYXhgIOeahOS4remXtOWAvFxuICAgICAqIEBwYXJhbSBtaW5cbiAgICAgKiBAcGFyYW0gbWF4XG4gICAgICogQHBhcmFtIGdyYWRpZW50XG4gICAgICovXG4gICAgcHVibGljIGludGVycG9sYXRlKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgZ3JhZGllbnQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBtaW4gKyAobWF4IC0gbWluKSAqIHRoaXMuY2xhbXAoZ3JhZGllbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGRyYXdpbmcgbGluZSBiZXR3ZWVuIDIgcG9pbnRzIGZyb20gbGVmdCB0byByaWdodFxuICAgICAqIHBhIHBiIC0+IHBjIHBkXG4gICAgICogcGEscGIscGMscGQgbXVzdCB0aGVuIGJlIHNvcnRlZCBiZWZvcmVcbiAgICAgKiBAcGFyYW0geVxuICAgICAqIEBwYXJhbSBwYVxuICAgICAqIEBwYXJhbSBwYlxuICAgICAqIEBwYXJhbSBwY1xuICAgICAqIEBwYXJhbSBwZFxuICAgICAqIEBwYXJhbSBjb2xvclxuICAgICAqL1xuICAgIHB1YmxpYyBwcm9jZXNzU2NhbkxpbmUoXG4gICAgICAgIGRhdGE6IFNjYW5MaW5lRGF0YSxcbiAgICAgICAgdmE6IFZlcnRleCxcbiAgICAgICAgdmI6IFZlcnRleCxcbiAgICAgICAgdmM6IFZlcnRleCxcbiAgICAgICAgdmQ6IFZlcnRleCxcbiAgICAgICAgY29sb3I6IEJBQllMT04uQ29sb3I0LFxuICAgICk6IHZvaWQge1xuICAgICAgICBjb25zdCBwYSA9IHZhLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwYiA9IHZiLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwYyA9IHZjLmNvb3JkaW5hdGVzO1xuICAgICAgICBjb25zdCBwZCA9IHZkLmNvb3JkaW5hdGVzO1xuICAgICAgICAvLyB0aGFua3MgdG8gY3VycmVudCBZLCB3ZSBjYW4gY29tcHV0ZSB0aGUgZ3JhZGllbnQgdG8gY29tcHV0ZSBvdGhlcnMgdmFsdWVzIGxpa2VcbiAgICAgICAgLy8gdGhlIHN0YXJ0aW5nIFgoc3gpIGFuZCBlbmRpbmcgWCAoZXMpIHRvIGRyYXcgYmV0d2VlblxuICAgICAgICAvLyBpZiBwYS5ZID09IHBiLlkgb3IgcGMuWSA9PSBwZC5ZLCBncmFkaWVudCBpcyBmb3JjZWQgdG8gMVxuICAgICAgICBjb25zdCBncmFkaWVudDEgPSBwYS55ICE9IHBiLnkgPyAoZGF0YS5jdXJyZW50WSAtIHBhLnkpIC8gKHBiLnkgLSBwYS55KSA6IDE7XG4gICAgICAgIGNvbnN0IGdyYWRpZW50MiA9IHBhLnkgIT0gcGIueSA/IChkYXRhLmN1cnJlbnRZIC0gcGMueSkgLyAocGQueSAtIHBjLnkpIDogMTtcbiAgICAgICAgY29uc3Qgc3ggPSB0aGlzLmludGVycG9sYXRlKHBhLngsIHBiLngsIGdyYWRpZW50MSkgPj4gMDtcbiAgICAgICAgY29uc3QgZXggPSB0aGlzLmludGVycG9sYXRlKHBjLngsIHBkLngsIGdyYWRpZW50MikgPj4gMDtcblxuICAgICAgICAvLyBzdGFydGluZyBaICYgIGVuZGluZyBaXG4gICAgICAgIGNvbnN0IHoxOiBudW1iZXIgPSB0aGlzLmludGVycG9sYXRlKHBhLnosIHBiLnosIGdyYWRpZW50MSk7XG4gICAgICAgIGNvbnN0IHoyOiBudW1iZXIgPSB0aGlzLmludGVycG9sYXRlKHBjLnosIHBkLnosIGdyYWRpZW50Mik7XG5cbiAgICAgICAgLy8gZHJhd2luZyBhIGxpbmUgZnJvbSBsZWZ0IChzeCkgdG8gcmlnaHQgKGV4KVxuICAgICAgICBmb3IgKGxldCB4ID0gc3g7IHggPCBleDsgeCsrKSB7XG4gICAgICAgICAgICAvLyBub3JtYWxpc2F0aW9uIHBvdXIgZGVzc2luZXIgZGUgZ2F1Y2hlIMOgIGRyb2l0ZVxuICAgICAgICAgICAgY29uc3QgZ3JhZGllbnQ6IG51bWJlciA9ICh4IC0gc3gpIC8gKGV4IC0gc3gpO1xuXG4gICAgICAgICAgICBjb25zdCB6ID0gdGhpcy5pbnRlcnBvbGF0ZSh6MSwgejIsIGdyYWRpZW50KTtcblxuICAgICAgICAgICAgLy8g5YWJ5rqQ5ZCR6YeP5ZKM6Z2i55qE5rOV5ZCR6YeP55qE5aS56KeSY29z5YC8XG4gICAgICAgICAgICBjb25zdCBuZG90bCA9IGRhdGEubmRvdGxhO1xuXG4gICAgICAgICAgICAvLyBjaGFuZ2luZyB0aGUgY29sb3IgdmFsdWUgdXNpbmcgdGhlIGNvc2luZSBvZiB0aGUgYW5nbGVcbiAgICAgICAgICAgIC8vIGJldHdlZW4gdGhlIGxpZ2h0IHZlY3RvciBhbmQgdGhlIG5vcm1hbCB2ZWN0b3JcbiAgICAgICAgICAgIHRoaXMuZHJhd1BvaW50KFxuICAgICAgICAgICAgICAgIG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgZGF0YS5jdXJyZW50WSwgeiksXG4gICAgICAgICAgICAgICAgbmV3IEJBQllMT04uQ29sb3I0KGNvbG9yLnIgKiBuZG90bCwgY29sb3IuZyAqIG5kb3RsLCBjb2xvci5iICogbmRvdGwsIDEpLFxuICAgICAgICAgICAgICAgIC8vIGNvbG9yLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuoeeulyDlhYnmupDlkJHph4/vvIjnga/mupDlnZDmoIcgLSDpobbngrnlnZDmoIfvvInlkozms5XlkJHph4/nmoTlpLnop5LnmoRjb3PlgLzvvIzov5Tlm57lgLwwIOWIsCAxXG4gICAgICpcbiAgICAgKiBub3JtYWwgdmVjdG9yIOKAoiBsaWdodCB2ZWN0b3JcbiAgICAgKiBAcGFyYW0gdmVydGV4XG4gICAgICogQHBhcmFtIG5vcm1hbFxuICAgICAqIEBwYXJhbSBsaWdodFBvc2l0aW9uXG4gICAgICovXG4gICAgcHVibGljIGNvbXB1dGVORG90TCh2ZXJ0ZXg6IEJBQllMT04uVmVjdG9yMywgbm9ybWFsOiBCQUJZTE9OLlZlY3RvcjMsIGxpZ2h0UG9zaXRpb246IEJBQllMT04uVmVjdG9yMyk6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IGxpZ2h0RGlyZWN0aW9uID0gbGlnaHRQb3NpdGlvbi5zdWJ0cmFjdCh2ZXJ0ZXgpO1xuICAgICAgICBub3JtYWwubm9ybWFsaXplKCk7XG4gICAgICAgIGxpZ2h0RGlyZWN0aW9uLm5vcm1hbGl6ZSgpO1xuXG4gICAgICAgIHJldHVybiBNYXRoLm1heCgwLCBCQUJZTE9OLlZlY3RvcjMuRG90KG5vcm1hbCwgbGlnaHREaXJlY3Rpb24pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZHJhd1RyaWFuZ2xlKHYxOiBWZXJ0ZXgsIHYyOiBWZXJ0ZXgsIHYzOiBWZXJ0ZXgsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCk6IHZvaWQge1xuICAgICAgICAvLyBTb3J0aW5nIHRoZSBwb2ludHMgaW4gb3JkZXIgdG8gYWx3YXlzIGhhdmUgdGhpcyBvcmRlciBvbiBzY3JlZW4gcDEsIHAyICYgcDNcbiAgICAgICAgLy8gd2l0aCBwMSBhbHdheXMgdXAgKHRodXMgaGF2aW5nIHRoZSBZIHRoZSBsb3dlc3QgcG9zc2libGUgdG8gYmUgbmVhciB0aGUgdG9wIHNjcmVlbilcbiAgICAgICAgLy8gdGhlbiBwMiBiZXR3ZWVuIHAxICYgcDMgKGFjY29yZGluZyB0byBZLWF4aXMgdXAgdG8gZG93biApXG4gICAgICAgIGlmICh2MS5jb29yZGluYXRlcy55ID4gdjIuY29vcmRpbmF0ZXMueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHYxO1xuICAgICAgICAgICAgdjIgPSB2MTtcbiAgICAgICAgICAgIHYxID0gdGVtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2Mi5jb29yZGluYXRlcy55ID4gdjMuY29vcmRpbmF0ZXMueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHYyO1xuICAgICAgICAgICAgdjIgPSB2MztcbiAgICAgICAgICAgIHYzID0gdGVtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2MS5jb29yZGluYXRlcy55ID4gdjIuY29vcmRpbmF0ZXMueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHYyO1xuICAgICAgICAgICAgdjIgPSB2MTtcbiAgICAgICAgICAgIHYxID0gdGVtcDtcbiAgICAgICAgfVxuICAgICAgICAvLyBzb3J0IGVuZFxuXG4gICAgICAgIGNvbnN0IHAxID0gdjEuY29vcmRpbmF0ZXM7XG4gICAgICAgIGNvbnN0IHAyID0gdjIuY29vcmRpbmF0ZXM7XG4gICAgICAgIGNvbnN0IHAzID0gdjMuY29vcmRpbmF0ZXM7XG5cbiAgICAgICAgLy8gbm9ybWFsIGZhY2UncyB2ZWN0b3IgaXMgdGhlIGF2ZXJhZ2Ugbm9ybWFsIGJldHdlZW4gZWFjaCB2ZXJ0ZXgncyBub3JtYWxcbiAgICAgICAgLy8gY29tcHV0aW5nIGFsc28gdGhlIGNlbnRlciBwb2ludCBvZiB0aGUgZmFjZVxuICAgICAgICAvLyDpnaLnmoTms5XlkJHph49cbiAgICAgICAgY29uc3Qgdm5GYWNlID0gdjEubm9ybWFsLmFkZCh2Mi5ub3JtYWwuYWRkKHYzLm5vcm1hbCkpLnNjYWxlKDEgLyAzKTtcbiAgICAgICAgLy8g6Z2i55qE5Lit5b+D54K5XG4gICAgICAgIGNvbnN0IGNlbnRlclBvaW50ID0gdjEud29ybGRDb29yZGluYXRlcy5hZGQodjIud29ybGRDb29yZGluYXRlcy5hZGQodjMud29ybGRDb29yZGluYXRlcykpLnNjYWxlKDEgLyAzKTtcbiAgICAgICAgLy8gbGlnaHQgcG9zaXRpb25cbiAgICAgICAgY29uc3QgbGlnaHRQb3MgPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDAsIDEwLCAxMCk7XG4gICAgICAgIC8vIOiuoeeul+WFiea6kOWQkemHj+WSjOmdoueahOazleWQkemHj+eahOWkueinkmNvc+WAvFxuICAgICAgICBjb25zdCBuZG90bCA9IHRoaXMuY29tcHV0ZU5Eb3RMKGNlbnRlclBvaW50LCB2bkZhY2UsIGxpZ2h0UG9zKTtcblxuICAgICAgICBjb25zdCBkYXRhOiBTY2FuTGluZURhdGEgPSB7IG5kb3RsYTogbmRvdGwgfTtcblxuICAgICAgICAvLyBpbnZlcnNlIHNsb3Blc1xuICAgICAgICBsZXQgZFAxUDI6IG51bWJlcjtcbiAgICAgICAgbGV0IGRQMVAzOiBudW1iZXI7XG5cbiAgICAgICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TbG9wZVxuICAgICAgICAvLyBDb21wdXRpbmcgc2xvcGVzXG4gICAgICAgIGlmIChwMi55IC0gcDEueSA+IDApIHtcbiAgICAgICAgICAgIGRQMVAyID0gKHAyLnggLSBwMS54KSAvIChwMi55IC0gcDEueSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkUDFQMiA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocDMueSAtIHAxLnkgPiAwKSB7XG4gICAgICAgICAgICBkUDFQMyA9IChwMy54IC0gcDEueCkgLyAocDMueSAtIHAxLnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZFAxUDMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmlyc3QgY2FzZSB3aGVyZSB0cmlhbmdsZXMgYXJlIGxpa2UgdGhhdDpcbiAgICAgICAgLy8gICAgICAgICBwMVxuICAgICAgICAvLyAgICAgICAgICAgzptcbiAgICAgICAgLy8gICAgICAgICAg4pWxIOKVslxuICAgICAgICAvLyAgICAgICAgIOKVsSAgIOKVslxuICAgICAgICAvLyAgICAgICAg4pWxICAgICDilbJcbiAgICAgICAgLy8gICAgICAg4pWxICAgICAgIOKVslxuICAgICAgICAvLyAgICAgIOKVsSAgICAgICAgIOKVslxuICAgICAgICAvLyAgICAg4pWxICAgICAgICAgICDilbJcbiAgICAgICAgLy8gICAg4pWxICAgICAgICAgICAgICAg4paPcDJcbiAgICAgICAgLy8gIOKVsVxuICAgICAgICAvLyBwMyDilpXilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICAgICAgLy8gcDIgb24gcmlnaHRcbiAgICAgICAgaWYgKGRQMVAyID4gZFAxUDMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSBwMS55ID4+IDA7IHkgPD0gcDMueSA+PiAwOyB5KyspIHtcbiAgICAgICAgICAgICAgICBkYXRhLmN1cnJlbnRZID0geTtcbiAgICAgICAgICAgICAgICBpZiAoeSA8IHAyLnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2NhbiBwMXAzIHAxcDJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzU2NhbkxpbmUoZGF0YSwgdjEsIHYzLCB2MSwgdjIsIGNvbG9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDMgcDJwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZShkYXRhLCB2MSwgdjMsIHYyLCB2MywgY29sb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHAyIG9uIGxlZnRcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSBwMS55ID4+IDA7IHkgPD0gcDMueSA+PiAwOyB5KyspIHtcbiAgICAgICAgICAgICAgICBkYXRhLmN1cnJlbnRZID0geTtcbiAgICAgICAgICAgICAgICBpZiAoeSA8IHAyLnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2NhbiBwMXAyIHAxcDNcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzU2NhbkxpbmUoZGF0YSwgdjEsIHYyLCB2MSwgdjMsIGNvbG9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAycDMgcDFwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZShkYXRhLCB2MiwgdjMsIHYxLCB2MywgY29sb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiDnu5jliLbnur/mnaEg5piv5LiA5LiqIOmAkuW9kue7mOWItui1t+Wni+eCuSAtIOS4remXtOeCuSAtIOe7k+adn+eCue+8iOaAu+WFsSAzIHBpeGVs77yJ55qE6L+H56iLICovXG4gICAgLy8gcHVibGljIGRyYXdMaW5lKHBvaW50MDogQkFCWUxPTi5WZWN0b3IyLCBwb2ludDE6IEJBQllMT04uVmVjdG9yMik6IHZvaWQge1xuICAgIC8vICAgICBjb25zdCBkaXN0ID0gcG9pbnQxLnN1YnRyYWN0KHBvaW50MCkubGVuZ3RoKCk7XG5cbiAgICAvLyAgICAgaWYgKGRpc3QgPCAyKSB7XG4gICAgLy8gICAgICAgICByZXR1cm47XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBjb25zdCBtaWRkbGVQb2ludCA9IHBvaW50MC5hZGQocG9pbnQxLnN1YnRyYWN0KHBvaW50MCkuc2NhbGUoMC41KSk7XG5cbiAgICAvLyAgICAgdGhpcy5kcmF3UG9pbnQobWlkZGxlUG9pbnQsIG5ldyBCQUJZTE9OLkNvbG9yNCgxLCAxLCAwLCAxKSk7XG5cbiAgICAvLyAgICAgdGhpcy5kcmF3TGluZShwb2ludDAsIG1pZGRsZVBvaW50KTtcbiAgICAvLyAgICAgdGhpcy5kcmF3TGluZShtaWRkbGVQb2ludCwgcG9pbnQxKTtcbiAgICAvLyB9XG5cbiAgICAvKipcbiAgICAgKiBbQnJlc2VuaGFtJ3NfbGluZV9hbGdvcml0aG1dKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0JyZXNlbmhhbSdzX2xpbmVfYWxnb3JpdGhtKVxuICAgICAqIOabtOW5s+a7keeahOe7mOWItue6v+adoeeahOeul+azlVxuICAgICAqL1xuICAgIC8vIHB1YmxpYyBkcmF3QmxpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpOiB2b2lkIHtcbiAgICAvLyAgICAgbGV0IHgwID0gcG9pbnQwLnggPj4gMDtcbiAgICAvLyAgICAgbGV0IHkwID0gcG9pbnQwLnkgPj4gMDtcbiAgICAvLyAgICAgY29uc3QgeDEgPSBwb2ludDEueCA+PiAwO1xuICAgIC8vICAgICBjb25zdCB5MSA9IHBvaW50MS55ID4+IDA7XG4gICAgLy8gICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMoeDEgLSB4MCk7XG4gICAgLy8gICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMoeTEgLSB5MCk7XG5cbiAgICAvLyAgICAgY29uc3Qgc3ggPSB4MCA8IHgxID8gMSA6IC0xO1xuICAgIC8vICAgICBjb25zdCBzeSA9IHkwIDwgeTEgPyAxIDogLTE7XG5cbiAgICAvLyAgICAgbGV0IGVyciA9IGR4IC0gZHk7XG5cbiAgICAvLyAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAvLyAgICAgICAgIHRoaXMuZHJhd1BvaW50KG5ldyBCQUJZTE9OLlZlY3RvcjIoeDAsIHkwKSwgY29sb3IpO1xuICAgIC8vICAgICAgICAgaWYgKHgwID09IHgxICYmIHkwID09IHkxKSB7XG4gICAgLy8gICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgICAgICBjb25zdCBlMiA9IDIgKiBlcnI7XG4gICAgLy8gICAgICAgICBpZiAoZTIgPiAtZHkpIHtcbiAgICAvLyAgICAgICAgICAgICBlcnIgLT0gZHk7XG4gICAgLy8gICAgICAgICAgICAgeDAgKz0gc3g7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgICAgICBpZiAoZTIgPCBkeCkge1xuICAgIC8vICAgICAgICAgICAgIGVyciArPSBkeDtcbiAgICAvLyAgICAgICAgICAgICB5MCArPSBzeTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIHB1YmxpYyByZW5kZXIoY2FtZXJhOiBDYW1lcmEsIG1lc2hlczogTWVzaFtdKSB7XG4gICAgICAgIGNvbnN0IHZpZXdNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Mb29rQXRMSChjYW1lcmEucG9zaXRpb24sIGNhbWVyYS50YXJnZXQsIEJBQllMT04uVmVjdG9yMy5VcCgpKTtcblxuICAgICAgICBjb25zdCBwcm9qZWN0TWF0cml4ID0gQkFCWUxPTi5NYXRyaXguUGVyc3BlY3RpdmVGb3ZMSCgwLjc4LCB0aGlzLndvcmtpbmdXaWR0aCAvIHRoaXMud29ya2luZ0hlaWdodCwgMC4wMSwgMS4wKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNNZXNoIG9mIG1lc2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Sb3RhdGlvbllhd1BpdGNoUm9sbChcbiAgICAgICAgICAgICAgICBjTWVzaC5yb3RhdGlvbi55LFxuICAgICAgICAgICAgICAgIGNNZXNoLnJvdGF0aW9uLngsXG4gICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueixcbiAgICAgICAgICAgICkubXVsdGlwbHkoQkFCWUxPTi5NYXRyaXguVHJhbnNsYXRpb24oY01lc2gucG9zdGlvbi54LCBjTWVzaC5wb3N0aW9uLnksIGNNZXNoLnBvc3Rpb24ueikpO1xuXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1NYXRyaXggPSB3b3JsZE1hdHJpeC5tdWx0aXBseSh2aWV3TWF0cml4KS5tdWx0aXBseShwcm9qZWN0TWF0cml4KTtcblxuICAgICAgICAgICAgLyoqIGRyYXcgcG9pbnRzICovXG4gICAgICAgICAgICAvLyBmb3IgKGNvbnN0IGluZGV4VmVydGV4IG9mIGNNZXNoLnZlcnRpY2VzKSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcHJvamVjdFBvaW50ID0gdGhpcy5wcm9qZWN0KGluZGV4VmVydGV4LCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd1BvaW50KHByb2plY3RQb2ludCk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8qKiBkcmF3IGxpbmVzICovXG4gICAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLnZlcnRpY2VzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHBvaW50MCA9IHRoaXMucHJvamVjdChjTWVzaC52ZXJ0aWNlc1tpXSwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwb2ludDEgPSB0aGlzLnByb2plY3QoY01lc2gudmVydGljZXNbaSArIDFdLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpbmUocG9pbnQwLCBwb2ludDEpO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvKiogZHJhdyBmYWNlcyAqL1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBwcmVmZXItZm9yLW9mXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEZhY2UgPSBjTWVzaC5mYWNlc1tpXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEEgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5BXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhCID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQl07XG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QyA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkNdO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxBID0gdGhpcy5wcm9qZWN0KHZlcnRleEEsIHRyYW5zZm9ybU1hdHJpeCwgd29ybGRNYXRyaXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsQiA9IHRoaXMucHJvamVjdCh2ZXJ0ZXhCLCB0cmFuc2Zvcm1NYXRyaXgsIHdvcmxkTWF0cml4KTtcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbEMgPSB0aGlzLnByb2plY3QodmVydGV4QywgdHJhbnNmb3JtTWF0cml4LCB3b3JsZE1hdHJpeCk7XG5cbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQSwgcGl4ZWxCKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQiwgcGl4ZWxDKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQywgcGl4ZWxBKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdCbGluZShwaXhlbEEsIHBpeGVsQik7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3QmxpbmUocGl4ZWxCLCBwaXhlbEMpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0JsaW5lKHBpeGVsQywgcGl4ZWxBKTtcblxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IGNvbG9yOiBudW1iZXIgPSAwLjI1ICsgKChpICUgY01lc2guZmFjZXMubGVuZ3RoKSAvIGNNZXNoLmZhY2VzLmxlbmd0aCkgKiAwLjc1O1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gMS4wO1xuICAgICAgICAgICAgICAgIC8qKiBkcmF3IHRyaWFuZ2xlICovXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUocGl4ZWxBLCBwaXhlbEIsIHBpeGVsQywgbmV3IEJBQllMT04uQ29sb3I0KGNvbG9yLCBjb2xvciwgY29sb3IsIDEpKTtcblxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkcmF3ICR7dmVydGV4QS50b1N0cmluZygpfSAke3ZlcnRleEIudG9TdHJpbmcoKX0gJHt2ZXJ0ZXhDLnRvU3RyaW5nKCl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNZXNoIH0gZnJvbSBcIi4vbWVzaFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEpTT05GaWxlQXN5bmMoZmlsZU5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChyZXN1bHQ6IE1lc2hbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGxldCBqc29uT2JqZWN0ID0ge307XG4gICAgY29uc3QgeG1sSHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhtbEh0dHAub3BlbihcIkdFVFwiLCBmaWxlTmFtZSwgdHJ1ZSk7XG5cbiAgICB4bWxIdHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHhtbEh0dHAucmVhZHlTdGF0ZSA9PSA0ICYmIHhtbEh0dHAuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAganNvbk9iamVjdCA9IEpTT04ucGFyc2UoeG1sSHR0cC5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgLy8gY2FsbGJhY2sodGhpcy5jcmVhdGVNZXNoZXNGcm9tSlNPTihqc29uT2JqZWN0KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhjcmVhdGVNZXNoZXNGcm9tSlNPTihqc29uT2JqZWN0KSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgeG1sSHR0cC5zZW5kKG51bGwpO1xufVxuXG4vKiogaHR0cHM6Ly9kb2MuYmFieWxvbmpzLmNvbS9yZXNvdXJjZXMvZmlsZV9mb3JtYXRfbWFwXyguYmFieWxvbilcbiAqICBqc29uIOagvOW8j1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdDogYW55KTogTWVzaFtdIHtcbiAgICByZXR1cm4ganNvbk9iamVjdC5tZXNoZXMubWFwKChtZXNoT2JqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHZlcnRpY2VzQXJyYXk6IG51bWJlcltdID0gbWVzaE9iamVjdC5wb3NpdGlvbnM7XG4gICAgICAgIC8vIEZhY2VzXG4gICAgICAgIGNvbnN0IGluZGljZXNBcnJheTogbnVtYmVyW10gPSBtZXNoT2JqZWN0LmluZGljZXM7XG5cbiAgICAgICAgY29uc3Qgbm9ybWFsczogbnVtYmVyW10gPSBtZXNoT2JqZWN0Lm5vcm1hbHM7XG5cbiAgICAgICAgY29uc3QgdmVydGljZXNDb3VudCA9IG1lc2hPYmplY3Quc3ViTWVzaGVzWzBdLnZlcnRpY2VzQ291bnQ7XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIGZhY2VzIGlzIGxvZ2ljYWxseSB0aGUgc2l6ZSBvZiB0aGUgYXJyYXkgZGl2aWRlZCBieSAzIChBLCBCLCBDKVxuICAgICAgICBjb25zdCBmYWNlc0NvdW50ID0gaW5kaWNlc0FycmF5Lmxlbmd0aCAvIDM7XG4gICAgICAgIGNvbnN0IG1lc2ggPSBuZXcgTWVzaChtZXNoT2JqZWN0Lm5hbWUsIHZlcnRpY2VzQ291bnQsIGZhY2VzQ291bnQpO1xuXG4gICAgICAgIC8vIEZpbGxpbmcgdGhlIHZlcnRpY2VzIGFycmF5IG9mIG91ciBtZXNoIGZpcnN077yM5qC55o2ucG9zaXRpb24g5q+P5qyh5Y+W5LiJ5Liq5pS+5Yiw6aG254K55pWw5o2uXG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB2ZXJ0aWNlc0NvdW50OyArK2luZGV4KSB7XG4gICAgICAgICAgICBjb25zdCB4ID0gdmVydGljZXNBcnJheVtpbmRleCAqIDNdO1xuICAgICAgICAgICAgY29uc3QgeSA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzICsgMV07XG4gICAgICAgICAgICBjb25zdCB6ID0gdmVydGljZXNBcnJheVtpbmRleCAqIDMgKyAyXTtcblxuICAgICAgICAgICAgY29uc3QgbnggPSBub3JtYWxzW2luZGV4ICogM107XG4gICAgICAgICAgICBjb25zdCBueSA9IG5vcm1hbHNbaW5kZXggKiAzICsgMV07XG4gICAgICAgICAgICBjb25zdCBueiA9IG5vcm1hbHNbaW5kZXggKiAzICsgMl07XG5cbiAgICAgICAgICAgIG1lc2gudmVydGljZXNbaW5kZXhdID0ge1xuICAgICAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBuZXcgQkFCWUxPTi5WZWN0b3IzKHgsIHksIHopLFxuICAgICAgICAgICAgICAgIG5vcm1hbDogbmV3IEJBQllMT04uVmVjdG9yMyhueCwgbnksIG56KSxcbiAgICAgICAgICAgICAgICB3b3JsZENvb3JkaW5hdGVzOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZW4gZmlsbGluZyB0aGUgZmFjZXMgYXJyYXkg5qC55o2u6Z2i55qE54K557Si5byV5pWw5o2u77yM5q+P5qyh5Y+W5LiJ5LiqIOaUvuWIsG1lc2jnmoTpnaLmlbDmja7kuK3ljrtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGZhY2VzQ291bnQ7ICsraW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IGEgPSBpbmRpY2VzQXJyYXlbaW5kZXggKiAzXTtcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbmRpY2VzQXJyYXlbaW5kZXggKiAzICsgMV07XG4gICAgICAgICAgICBjb25zdCBjID0gaW5kaWNlc0FycmF5W2luZGV4ICogMyArIDJdO1xuXG4gICAgICAgICAgICBtZXNoLmZhY2VzW2luZGV4XSA9IHtcbiAgICAgICAgICAgICAgICBBOiBhLFxuICAgICAgICAgICAgICAgIEI6IGIsXG4gICAgICAgICAgICAgICAgQzogYyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXR0aW5nIHRoZSBwb3NpdGlvbiB5b3UndmUgc2V0IGluIEJsZW5kZXJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBtZXNoT2JqZWN0LnBvc2l0aW9uO1xuICAgICAgICBtZXNoLnBvc3Rpb24gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSwgcG9zaXRpb25bMl0pO1xuXG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH0pO1xuICAgIHJldHVybiBbXTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJiYWJ5bG9uLm1hdGgudHNcIi8+XG5cbmltcG9ydCB7IENhbWVyYSB9IGZyb20gXCIuL2NhbWVyYVwiO1xuaW1wb3J0IHsgRGV2aWNlIH0gZnJvbSBcIi4vZGV2aWNlXCI7XG5pbXBvcnQgeyBsb2FkSlNPTkZpbGVBc3luYyB9IGZyb20gXCIuL2xvYWRlclwiO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gXCIuL21lc2hcIjtcblxubGV0IGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG5sZXQgZGV2aWNlOiBEZXZpY2U7XG5sZXQgbWVzaDogTWVzaDtcbmxldCBtZXNoZXM6IE1lc2hbXSA9IFtdO1xubGV0IGNhbWVyYTogQ2FtZXJhO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBpbml0LCBmYWxzZSk7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcm9udEJ1ZmZlclwiKSBhcyBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICAvLyBtZXNoID0gbmV3IFNvZnRFbmdpbmUuTWVzaChcIkN1YmVcIiwgOCk7XG5cbiAgICAvLyBtZXNoZXMucHVzaChtZXNoKTtcblxuICAgIC8vIG1lc2gudmVydGljZXNbMF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzFdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzJdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbM10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzddID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgLTEpO1xuXG4gICAgLy8gbWVzaCA9IG5ldyBNZXNoKFwiQ3ViZVwiLCA4LCAxMik7XG4gICAgLy8gbWVzaGVzLnB1c2gobWVzaCk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1swXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1szXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s3XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAtMSk7XG5cbiAgICAvLyBtZXNoLmZhY2VzWzBdID0geyBBOiAwLCBCOiAxLCBDOiAyIH07XG4gICAgLy8gbWVzaC5mYWNlc1sxXSA9IHsgQTogMSwgQjogMiwgQzogMyB9O1xuICAgIC8vIG1lc2guZmFjZXNbMl0gPSB7IEE6IDEsIEI6IDMsIEM6IDYgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzNdID0geyBBOiAxLCBCOiA1LCBDOiA2IH07XG4gICAgLy8gbWVzaC5mYWNlc1s0XSA9IHsgQTogMCwgQjogMSwgQzogNCB9O1xuICAgIC8vIG1lc2guZmFjZXNbNV0gPSB7IEE6IDEsIEI6IDQsIEM6IDUgfTtcblxuICAgIC8vIG1lc2guZmFjZXNbNl0gPSB7IEE6IDIsIEI6IDMsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzddID0geyBBOiAzLCBCOiA2LCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1s4XSA9IHsgQTogMCwgQjogMiwgQzogNyB9O1xuICAgIC8vIG1lc2guZmFjZXNbOV0gPSB7IEE6IDAsIEI6IDQsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzEwXSA9IHsgQTogNCwgQjogNSwgQzogNiB9O1xuICAgIC8vIG1lc2guZmFjZXNbMTFdID0geyBBOiA0LCBCOiA2LCBDOiA3IH07XG5cbiAgICBjYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gICAgZGV2aWNlID0gbmV3IERldmljZShjYW52YXMpO1xuXG4gICAgY2FtZXJhLnBvc2l0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMygwLCAwLCAxMCk7XG4gICAgY2FtZXJhLnRhcmdldCA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMCwgMCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcFxuICAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG5cbiAgICBsb2FkSlNPTkZpbGVBc3luYyhcIi4vZGlzdC9yZXMvdGVzdF9tb25rZXkuYmFieWxvblwiLCBsb2FkSlNPTkNvbXBsZXRlZCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRKU09OQ29tcGxldGVkKG1lc2hlc0xvYWRlZDogTWVzaFtdKSB7XG4gICAgbWVzaGVzID0gbWVzaGVzTG9hZGVkO1xuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdpbmdMb29wKTtcbn1cblxubGV0IHByZXZpb3VzRGF0ZTogbnVtYmVyID0gMDtcbmZ1bmN0aW9uIGRyYXdpbmdMb29wKCkge1xuICAgIC8vIGZwc1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgY29uc3QgY3VycmVudEZwcyA9IDEwMDAuMCAvIChub3cgLSBwcmV2aW91c0RhdGUpO1xuICAgIHByZXZpb3VzRGF0ZSA9IG5vdztcblxuICAgIGNvbnNvbGUubG9nKGAke2N1cnJlbnRGcHMudG9QcmVjaXNpb24oMil9IGZwc2ApO1xuXG4gICAgZGV2aWNlLmNsZWFyKCk7XG5cbiAgICAvLyByb3RhdGluZyBzbGlnaHRseSB0aGUgY3ViZSBkdXJpbmcgZWFjaCBmcmFtZSByZW5kZXJlZFxuICAgIG1lc2hlcy5mb3JFYWNoKChtZXNoKSA9PiB7XG4gICAgICAgIC8vIG1lc2gucm90YXRpb24ueCArPSAwLjAxO1xuICAgICAgICBtZXNoLnJvdGF0aW9uLnkgKz0gMC4wMTtcbiAgICB9KTtcblxuICAgIC8vIERvaW5nIHRoZSB2YXJpb3VzIG1hdHJpeCBvcGVyYXRpb25zXG4gICAgZGV2aWNlLnJlbmRlcihjYW1lcmEsIG1lc2hlcyk7XG4gICAgLy8gRmx1c2hpbmcgdGhlIGJhY2sgYnVmZmVyIGludG8gdGhlIGZyb250IGJ1ZmZlclxuICAgIGRldmljZS5wcmVzZW50KCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcCByZWN1cnNpdmVseVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG59XG4iLCJleHBvcnQgaW50ZXJmYWNlIEZhY2Uge1xuICAgIEE6IG51bWJlcjtcbiAgICBCOiBudW1iZXI7XG4gICAgQzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZlcnRleCB7XG4gICAgbm9ybWFsOiBCQUJZTE9OLlZlY3RvcjM7IC8vIOWtmOWCqOeCueeahOazleWQkemHj++8jOWPr+S7peebtOaOpeS7jueOsOacieeahDNk5riy5p+T6L2v5Lu255qE5a+85Ye65paH5Lu25Lit6I635Y+WXG4gICAgY29vcmRpbmF0ZXM6IEJBQllMT04uVmVjdG9yMzsgLy8gbG9jYWxcbiAgICB3b3JsZENvb3JkaW5hdGVzOiBCQUJZTE9OLlZlY3RvcjM7IC8vIHdvcmxkXG59XG5cbmV4cG9ydCBjbGFzcyBNZXNoIHtcbiAgICBwdWJsaWMgcG9zdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyByb3RhdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyB2ZXJ0aWNlczogVmVydGV4W107XG4gICAgcHVibGljIGZhY2VzOiBGYWNlW107XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCB2ZXJ0aWNlc0NvdW50OiBudW1iZXIsIGZhY2VzQ291bnQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEFycmF5KHZlcnRpY2VzQ291bnQpO1xuICAgICAgICB0aGlzLmZhY2VzID0gbmV3IEFycmF5KGZhY2VzQ291bnQpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgdGhpcy5wb3N0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NhbkxpbmVEYXRhIHtcbiAgICBjdXJyZW50WT86IG51bWJlcjtcbiAgICBuZG90bGE/OiBudW1iZXI7XG4gICAgbmRvdGxiPzogbnVtYmVyO1xuICAgIG5kb3RsYz86IG51bWJlcjtcbiAgICBuZG90bGQ/OiBudW1iZXI7XG59XG4iXX0=
