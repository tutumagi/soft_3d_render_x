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


  Device.prototype.project = function (coord, transMat) {
    // transforming the coordinates
    var point = BABYLON.Vector3.TransformCoordinates(coord, transMat); // The transformed coordinates will be based on coordinate system
    // starting on the center of the screen. But drawing on screen normally starts
    // from top left. We then need to transform them again to have x:0, y:0 on top left

    var x = point.x * this.workingWidth + this.workingWidth / 2.0 >> 0;
    var y = -point.y * this.workingHeight + this.workingHeight / 2.0 >> 0;
    return new BABYLON.Vector3(x, y, point.z);
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


  Device.prototype.processScanLine = function (y, pa, pb, pc, pd, color) {
    // thanks to current Y, we can compute the gradient to compute others values like
    // the starting X(sx) and ending X (es) to draw between
    // if pa.Y == pb.Y or pc.Y == pd.Y, gradient is forced to 1
    var gradient1 = pa.y != pb.y ? (y - pa.y) / (pb.y - pa.y) : 1;
    var gradient2 = pa.y != pb.y ? (y - pc.y) / (pd.y - pc.y) : 1;
    var sx = this.interpolate(pa.x, pb.x, gradient1) >> 0;
    var ex = this.interpolate(pc.x, pd.x, gradient2) >> 0; // starting Z &  ending Z

    var z1 = this.interpolate(pa.z, pb.z, gradient1);
    var z2 = this.interpolate(pc.z, pd.z, gradient2); // drawing a line from left (sx) to right (ex)

    for (var x = sx; x < ex; x++) {
      // normalisation pour dessiner de gauche à droite
      var gradient = (x - sx) / (ex - sx);
      var z = this.interpolate(z1, z2, gradient);
      this.drawPoint(new BABYLON.Vector3(x, y, z), color);
    }
  };

  Device.prototype.drawTriangle = function (p1, p2, p3, color) {
    // Sorting the points in order to always have this order on screen p1, p2 & p3
    // with p1 always up (thus having the Y the lowest possible to be near the top screen)
    // then p2 between p1 & p3 (according to Y-axis up to down )
    if (p1.y > p2.y) {
      var temp = p2;
      p2 = p1;
      p1 = temp;
    }

    if (p2.y > p3.y) {
      var temp = p2;
      p2 = p3;
      p3 = temp;
    }

    if (p1.y > p2.y) {
      var temp = p2;
      p2 = p1;
      p1 = temp;
    } // sort end
    // inverse slopes


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
      for (var y = p1.y >> 0; y <= p3.y >> 0; y++) {
        if (y < p2.y) {
          // scan p1p2 p1p3
          this.processScanLine(y, p1, p2, p1, p3, color);
        } else {
          // scan p2p3 p1p3
          this.processScanLine(y, p2, p3, p1, p3, color);
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
        var pixelA = this.project(vertexA, transformMatrix);
        var pixelB = this.project(vertexB, transformMatrix);
        var pixelC = this.project(vertexC, transformMatrix); // this.drawLine(pixelA, pixelB);
        // this.drawLine(pixelB, pixelC);
        // this.drawLine(pixelC, pixelA);
        // this.drawBline(pixelA, pixelB);
        // this.drawBline(pixelB, pixelC);
        // this.drawBline(pixelC, pixelA);

        var color = 0.25 + i % cMesh.faces.length / cMesh.faces.length * 0.75;
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
    var verticesCount = meshObject.subMeshes[0].verticesCount; // number of faces is logically the size of the array divided by 3 (A, B, C)

    var facesCount = indicesArray.length / 3;
    var mesh = new mesh_1.Mesh(meshObject.name, verticesCount, facesCount); // Filling the vertices array of our mesh first，根据position 每次取三个放到顶点数据

    for (var index = 0; index < verticesCount; ++index) {
      var x = verticesArray[index * 3];
      var y = verticesArray[index * 3 + 1];
      var z = verticesArray[index * 3 + 2];
      mesh.vertices[index] = new BABYLON.Vector3(x, y, z);
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

function drawingLoop() {
  device.clear(); // rotating slightly the cube during each frame rendered

  meshes.forEach(function (mesh) {
    mesh.rotation.y = Math.PI; // mesh.rotation.y += 0.01;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FtZXJhLnRzIiwic3JjL2RldmljZS50cyIsInNyYy9sb2FkZXIudHMiLCJzcmMvbWFpbi50cyIsInNyYy9tZXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsSUFBQSxNQUFBO0FBQUE7QUFBQSxZQUFBO0FBSUksV0FBQSxNQUFBLEdBQUE7QUFDSSxTQUFLLFFBQUwsR0FBZ0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFBaEI7QUFDQSxTQUFLLE1BQUwsR0FBYyxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFkO0FBQ0g7O0FBQ0wsU0FBQSxNQUFBO0FBQUMsQ0FSRCxFQUFBOztBQUFhLE9BQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQTs7Ozs7Ozs7O0FDR2IsSUFBQSxNQUFBO0FBQUE7QUFBQSxZQUFBO0FBV0ksV0FBQSxNQUFBLENBQVksTUFBWixFQUFxQztBQUNqQyxTQUFLLGFBQUwsR0FBcUIsTUFBckI7QUFDQSxTQUFLLFlBQUwsR0FBb0IsTUFBTSxDQUFDLEtBQTNCO0FBQ0EsU0FBSyxhQUFMLEdBQXFCLE1BQU0sQ0FBQyxNQUE1QjtBQUVBLFNBQUssY0FBTCxHQUFzQixLQUFLLGFBQUwsQ0FBbUIsVUFBbkIsQ0FBOEIsSUFBOUIsQ0FBdEI7QUFFQSxTQUFLLFdBQUwsR0FBbUIsSUFBSSxLQUFKLENBQVUsS0FBSyxZQUFMLEdBQW9CLEtBQUssYUFBbkMsQ0FBbkI7QUFDSDs7QUFFTSxFQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsS0FBQSxHQUFQLFlBQUE7QUFDSSxTQUFLLGNBQUwsQ0FBb0IsU0FBcEIsQ0FBOEIsQ0FBOUIsRUFBaUMsQ0FBakMsRUFBb0MsS0FBSyxZQUF6QyxFQUF1RCxLQUFLLGFBQTVEO0FBQ0EsU0FBSyxVQUFMLEdBQWtCLEtBQUssY0FBTCxDQUFvQixZQUFwQixDQUFpQyxDQUFqQyxFQUFvQyxDQUFw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YSxJQUFJLEtBQUosQ0FBVSxVQUFWLENBQWI7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFBaEI7QUFDQSxTQUFLLE9BQUwsR0FBZSxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFmO0FBQ0g7O0FBQ0wsU0FBQSxJQUFBO0FBQUMsQ0FaRCxFQUFBOztBQUFhLE9BQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImV4cG9ydCBjbGFzcyBDYW1lcmEge1xuICAgIHB1YmxpYyBwb3NpdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyB0YXJnZXQ6IEJBQllMT04uVmVjdG9yMztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBCQUJZTE9OLlZlY3RvcjMuWmVybygpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENhbWVyYSB9IGZyb20gXCIuL2NhbWVyYVwiO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gXCIuL21lc2hcIjtcblxuZXhwb3J0IGNsYXNzIERldmljZSB7XG4gICAgcHJpdmF0ZSBiYWNrYnVmZmVyPzogSW1hZ2VEYXRhO1xuICAgIHByaXZhdGUgd29ya2luZ0NhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgcHJpdmF0ZSB3b3JraW5nQ29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICAgIHByaXZhdGUgd29ya2luZ1dpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSB3b3JraW5nSGVpZ2h0OiBudW1iZXI7XG4gICAgLy8gZXF1YWxzIHRvIGJhY2tidWZmZXIuZGF0YVxuICAgIHByaXZhdGUgYmFja2J1ZmZlcmRhdGE/OiBVaW50OENsYW1wZWRBcnJheTtcbiAgICAvLyDnvJPlrZjmr4/kuKrlg4/ntKDngrnnmoQgei1idWZmZXLvvIzlpoLmnpzlkI7pnaLnu5jliLbnmoR6IGluZGV4IOWkp+S6juW9k+WJjeeahO+8jOWImeW/veeVpe+8jOWQpuWImeimhuebluW9k+WJjeeahOWDj+e0oFxuICAgIHByaXZhdGUgZGVwdGhidWZmZXI6IG51bWJlcltdO1xuXG4gICAgY29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCkge1xuICAgICAgICB0aGlzLndvcmtpbmdDYW52YXMgPSBjYW52YXM7XG4gICAgICAgIHRoaXMud29ya2luZ1dpZHRoID0gY2FudmFzLndpZHRoO1xuICAgICAgICB0aGlzLndvcmtpbmdIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMud29ya2luZ0NvbnRleHQgPSB0aGlzLndvcmtpbmdDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpITtcblxuICAgICAgICB0aGlzLmRlcHRoYnVmZmVyID0gbmV3IEFycmF5KHRoaXMud29ya2luZ1dpZHRoICogdGhpcy53b3JraW5nSGVpZ2h0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMud29ya2luZ0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMud29ya2luZ1dpZHRoLCB0aGlzLndvcmtpbmdIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tidWZmZXIgPSB0aGlzLndvcmtpbmdDb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLndvcmtpbmdXaWR0aCwgdGhpcy53b3JraW5nSGVpZ2h0KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZGVwdGhidWZmZXIubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIC8vIOWhq+S4gOS4quWkp+S4gOeCueeahOaVsOWtl1xuICAgICAgICAgICAgdGhpcy5kZXB0aGJ1ZmZlcltpXSA9IDEwMDAwMDA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcHJlc2VudCgpIHtcbiAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dC5wdXRJbWFnZURhdGEodGhpcy5iYWNrYnVmZmVyISwgMCwgMCk7XG4gICAgfVxuXG4gICAgcHVibGljIHB1dFBpeGVsKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCkge1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhID0gdGhpcy5iYWNrYnVmZmVyIS5kYXRhO1xuXG4gICAgICAgIGNvbnN0IGluZGV4OiBudW1iZXIgPSAoeCA+PiAwKSArICh5ID4+IDApICogdGhpcy53b3JraW5nV2lkdGg7XG4gICAgICAgIGNvbnN0IGluZGV4NDogbnVtYmVyID0gaW5kZXggKiA0O1xuXG4gICAgICAgIGlmICh0aGlzLmRlcHRoYnVmZmVyW2luZGV4XSA8IHopIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gRGlzY2FyZFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVwdGhidWZmZXJbaW5kZXhdID0gejtcblxuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4NF0gPSBjb2xvci5yICogMjU1O1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4NCArIDFdID0gY29sb3IuZyAqIDI1NTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleDQgKyAyXSA9IGNvbG9yLmIgKiAyNTU7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXg0ICsgM10gPSBjb2xvci5hICogMjU1O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb2plY3QgdGFrZXMgc29tZSAzRCBjb29yZGluYXRlcyBhbmQgdHJhbnNmb3JtIHRoZW1cbiAgICAgKiBpbiAyRCBjb29yZGluYXRlcyB1c2luZyB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gICAgICovXG4gICAgcHVibGljIHByb2plY3QoY29vcmQ6IEJBQllMT04uVmVjdG9yMywgdHJhbnNNYXQ6IEJBQllMT04uTWF0cml4KTogQkFCWUxPTi5WZWN0b3IzIHtcbiAgICAgICAgLy8gdHJhbnNmb3JtaW5nIHRoZSBjb29yZGluYXRlc1xuICAgICAgICBjb25zdCBwb2ludCA9IEJBQllMT04uVmVjdG9yMy5UcmFuc2Zvcm1Db29yZGluYXRlcyhjb29yZCwgdHJhbnNNYXQpO1xuXG4gICAgICAgIC8vIFRoZSB0cmFuc2Zvcm1lZCBjb29yZGluYXRlcyB3aWxsIGJlIGJhc2VkIG9uIGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgICAgIC8vIHN0YXJ0aW5nIG9uIHRoZSBjZW50ZXIgb2YgdGhlIHNjcmVlbi4gQnV0IGRyYXdpbmcgb24gc2NyZWVuIG5vcm1hbGx5IHN0YXJ0c1xuICAgICAgICAvLyBmcm9tIHRvcCBsZWZ0LiBXZSB0aGVuIG5lZWQgdG8gdHJhbnNmb3JtIHRoZW0gYWdhaW4gdG8gaGF2ZSB4OjAsIHk6MCBvbiB0b3AgbGVmdFxuICAgICAgICBjb25zdCB4ID0gKHBvaW50LnggKiB0aGlzLndvcmtpbmdXaWR0aCArIHRoaXMud29ya2luZ1dpZHRoIC8gMi4wKSA+PiAwO1xuICAgICAgICBjb25zdCB5ID0gKC1wb2ludC55ICogdGhpcy53b3JraW5nSGVpZ2h0ICsgdGhpcy53b3JraW5nSGVpZ2h0IC8gMi4wKSA+PiAwO1xuXG4gICAgICAgIHJldHVybiBuZXcgQkFCWUxPTi5WZWN0b3IzKHgsIHksIHBvaW50LnopO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGBkcmF3UG9pbnRgIGNhbGxzIHB1dFBpeGVsIGJ1dCBkb2VzIHRoZSBjbGlwcGluZyBvcGVyYXRpb24gYmVmb3JlXG4gICAgICogQHBhcmFtIHBvaW50XG4gICAgICovXG4gICAgcHVibGljIGRyYXdQb2ludChwb2ludDogQkFCWUxPTi5WZWN0b3IzLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpIHtcbiAgICAgICAgLy8gQ2xpcHBpbmcgd2hhdCdzIHZpc2libGUgb24gc2NyZWVuXG4gICAgICAgIGlmIChwb2ludC54ID49IDAgJiYgcG9pbnQueSA+PSAwICYmIHBvaW50LnggPCB0aGlzLndvcmtpbmdXaWR0aCAmJiBwb2ludC55IDwgdGhpcy53b3JraW5nSGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBEcmF3aW5nIGEgeWVsbG93IHBvaW50XG4gICAgICAgICAgICB0aGlzLnB1dFBpeGVsKHBvaW50LngsIHBvaW50LnksIHBvaW50LnosIGNvbG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsYW1waW5nIHZhbHVlcyB0byBrZWVwIHRoZW0gYmV0d2VlbiBtaW4gYW5kIG1heFxuICAgICAqIEBwYXJhbSB2YWx1ZSDlvoXkv67mraPlgLxcbiAgICAgKiBAcGFyYW0gbWluez0wfSDmnIDlsI/lgLxcbiAgICAgKiBAcGFyYW0gbWF4ez0xfSDmnIDlpKflgLxcbiAgICAgKi9cbiAgICBwdWJsaWMgY2xhbXAodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIgPSAwLCBtYXg6IG51bWJlciA9IDEpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbih2YWx1ZSwgbWF4KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJwb2xhdGluZyB0aGUgdmFsdWUgYmV0d2VlbiAyIHZlcnRpY2VzXG4gICAgICogbWluIGlzIHRoZSBzdGFydGluZyBwb2ludCwgbWF4IHRoZSBlbmRpbmcgcG9pbnRcbiAgICAgKiBhbmQgZ3JhZGllbnQgdGhlICUgYmV0d2VlbiB0aGUgMiBwb2ludHNcbiAgICAgKiDmoLnmja4gZ3JhZGllbnTns7vmlbAg6I635Y+WIOS7jiBgbWluYCDliLAgYG1heGAg55qE5Lit6Ze05YC8XG4gICAgICogQHBhcmFtIG1pblxuICAgICAqIEBwYXJhbSBtYXhcbiAgICAgKiBAcGFyYW0gZ3JhZGllbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgaW50ZXJwb2xhdGUobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBncmFkaWVudDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIG1pbiArIChtYXggLSBtaW4pICogdGhpcy5jbGFtcChncmFkaWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZHJhd2luZyBsaW5lIGJldHdlZW4gMiBwb2ludHMgZnJvbSBsZWZ0IHRvIHJpZ2h0XG4gICAgICogcGEgcGIgLT4gcGMgcGRcbiAgICAgKiBwYSxwYixwYyxwZCBtdXN0IHRoZW4gYmUgc29ydGVkIGJlZm9yZVxuICAgICAqIEBwYXJhbSB5XG4gICAgICogQHBhcmFtIHBhXG4gICAgICogQHBhcmFtIHBiXG4gICAgICogQHBhcmFtIHBjXG4gICAgICogQHBhcmFtIHBkXG4gICAgICogQHBhcmFtIGNvbG9yXG4gICAgICovXG4gICAgcHVibGljIHByb2Nlc3NTY2FuTGluZShcbiAgICAgICAgeTogbnVtYmVyLFxuICAgICAgICBwYTogQkFCWUxPTi5WZWN0b3IzLFxuICAgICAgICBwYjogQkFCWUxPTi5WZWN0b3IzLFxuICAgICAgICBwYzogQkFCWUxPTi5WZWN0b3IzLFxuICAgICAgICBwZDogQkFCWUxPTi5WZWN0b3IzLFxuICAgICAgICBjb2xvcjogQkFCWUxPTi5Db2xvcjQsXG4gICAgKTogdm9pZCB7XG4gICAgICAgIC8vIHRoYW5rcyB0byBjdXJyZW50IFksIHdlIGNhbiBjb21wdXRlIHRoZSBncmFkaWVudCB0byBjb21wdXRlIG90aGVycyB2YWx1ZXMgbGlrZVxuICAgICAgICAvLyB0aGUgc3RhcnRpbmcgWChzeCkgYW5kIGVuZGluZyBYIChlcykgdG8gZHJhdyBiZXR3ZWVuXG4gICAgICAgIC8vIGlmIHBhLlkgPT0gcGIuWSBvciBwYy5ZID09IHBkLlksIGdyYWRpZW50IGlzIGZvcmNlZCB0byAxXG4gICAgICAgIGNvbnN0IGdyYWRpZW50MSA9IHBhLnkgIT0gcGIueSA/ICh5IC0gcGEueSkgLyAocGIueSAtIHBhLnkpIDogMTtcbiAgICAgICAgY29uc3QgZ3JhZGllbnQyID0gcGEueSAhPSBwYi55ID8gKHkgLSBwYy55KSAvIChwZC55IC0gcGMueSkgOiAxO1xuICAgICAgICBjb25zdCBzeCA9IHRoaXMuaW50ZXJwb2xhdGUocGEueCwgcGIueCwgZ3JhZGllbnQxKSA+PiAwO1xuICAgICAgICBjb25zdCBleCA9IHRoaXMuaW50ZXJwb2xhdGUocGMueCwgcGQueCwgZ3JhZGllbnQyKSA+PiAwO1xuXG4gICAgICAgIC8vIHN0YXJ0aW5nIFogJiAgZW5kaW5nIFpcbiAgICAgICAgY29uc3QgejE6IG51bWJlciA9IHRoaXMuaW50ZXJwb2xhdGUocGEueiwgcGIueiwgZ3JhZGllbnQxKTtcbiAgICAgICAgY29uc3QgejI6IG51bWJlciA9IHRoaXMuaW50ZXJwb2xhdGUocGMueiwgcGQueiwgZ3JhZGllbnQyKTtcblxuICAgICAgICAvLyBkcmF3aW5nIGEgbGluZSBmcm9tIGxlZnQgKHN4KSB0byByaWdodCAoZXgpXG4gICAgICAgIGZvciAobGV0IHggPSBzeDsgeCA8IGV4OyB4KyspIHtcbiAgICAgICAgICAgIC8vIG5vcm1hbGlzYXRpb24gcG91ciBkZXNzaW5lciBkZSBnYXVjaGUgw6AgZHJvaXRlXG4gICAgICAgICAgICBjb25zdCBncmFkaWVudDogbnVtYmVyID0gKHggLSBzeCkgLyAoZXggLSBzeCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHogPSB0aGlzLmludGVycG9sYXRlKHoxLCB6MiwgZ3JhZGllbnQpO1xuXG4gICAgICAgICAgICB0aGlzLmRyYXdQb2ludChuZXcgQkFCWUxPTi5WZWN0b3IzKHgsIHksIHopLCBjb2xvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZHJhd1RyaWFuZ2xlKHAxOiBCQUJZTE9OLlZlY3RvcjMsIHAyOiBCQUJZTE9OLlZlY3RvcjMsIHAzOiBCQUJZTE9OLlZlY3RvcjMsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCk6IHZvaWQge1xuICAgICAgICAvLyBTb3J0aW5nIHRoZSBwb2ludHMgaW4gb3JkZXIgdG8gYWx3YXlzIGhhdmUgdGhpcyBvcmRlciBvbiBzY3JlZW4gcDEsIHAyICYgcDNcbiAgICAgICAgLy8gd2l0aCBwMSBhbHdheXMgdXAgKHRodXMgaGF2aW5nIHRoZSBZIHRoZSBsb3dlc3QgcG9zc2libGUgdG8gYmUgbmVhciB0aGUgdG9wIHNjcmVlbilcbiAgICAgICAgLy8gdGhlbiBwMiBiZXR3ZWVuIHAxICYgcDMgKGFjY29yZGluZyB0byBZLWF4aXMgdXAgdG8gZG93biApXG4gICAgICAgIGlmIChwMS55ID4gcDIueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHAyO1xuICAgICAgICAgICAgcDIgPSBwMTtcbiAgICAgICAgICAgIHAxID0gdGVtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwMi55ID4gcDMueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHAyO1xuICAgICAgICAgICAgcDIgPSBwMztcbiAgICAgICAgICAgIHAzID0gdGVtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwMS55ID4gcDIueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHAyO1xuICAgICAgICAgICAgcDIgPSBwMTtcbiAgICAgICAgICAgIHAxID0gdGVtcDtcbiAgICAgICAgfVxuICAgICAgICAvLyBzb3J0IGVuZFxuXG4gICAgICAgIC8vIGludmVyc2Ugc2xvcGVzXG4gICAgICAgIGxldCBkUDFQMjogbnVtYmVyO1xuICAgICAgICBsZXQgZFAxUDM6IG51bWJlcjtcblxuICAgICAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1Nsb3BlXG4gICAgICAgIC8vIENvbXB1dGluZyBzbG9wZXNcbiAgICAgICAgaWYgKHAyLnkgLSBwMS55ID4gMCkge1xuICAgICAgICAgICAgZFAxUDIgPSAocDIueCAtIHAxLngpIC8gKHAyLnkgLSBwMS55KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRQMVAyID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwMy55IC0gcDEueSA+IDApIHtcbiAgICAgICAgICAgIGRQMVAzID0gKHAzLnggLSBwMS54KSAvIChwMy55IC0gcDEueSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkUDFQMyA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaXJzdCBjYXNlIHdoZXJlIHRyaWFuZ2xlcyBhcmUgbGlrZSB0aGF0OlxuICAgICAgICAvLyAgICAgICAgIHAxXG4gICAgICAgIC8vICAgICAgICAgICDOm1xuICAgICAgICAvLyAgICAgICAgICDilbEg4pWyXG4gICAgICAgIC8vICAgICAgICAg4pWxICAg4pWyXG4gICAgICAgIC8vICAgICAgICDilbEgICAgIOKVslxuICAgICAgICAvLyAgICAgICDilbEgICAgICAg4pWyXG4gICAgICAgIC8vICAgICAg4pWxICAgICAgICAg4pWyXG4gICAgICAgIC8vICAgICDilbEgICAgICAgICAgIOKVslxuICAgICAgICAvLyAgICDilbEgICAgICAgICAgICAgICDilo9wMlxuICAgICAgICAvLyAg4pWxXG4gICAgICAgIC8vIHAzIOKWleKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgICAgICAvLyBwMiBvbiByaWdodFxuICAgICAgICBpZiAoZFAxUDIgPiBkUDFQMykge1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHAxLnkgPj4gMDsgeSA8PSBwMy55ID4+IDA7IHkrKykge1xuICAgICAgICAgICAgICAgIGlmICh5IDwgcDIueSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDMgcDFwMlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZSh5LCBwMSwgcDMsIHAxLCBwMiwgY29sb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDFwMyBwMnAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKHksIHAxLCBwMywgcDIsIHAzLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcDIgb24gbGVmdFxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHAxLnkgPj4gMDsgeSA8PSBwMy55ID4+IDA7IHkrKykge1xuICAgICAgICAgICAgICAgIGlmICh5IDwgcDIueSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDIgcDFwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZSh5LCBwMSwgcDIsIHAxLCBwMywgY29sb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDJwMyBwMXAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKHksIHAyLCBwMywgcDEsIHAzLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIOe7mOWItue6v+adoSDmmK/kuIDkuKog6YCS5b2S57uY5Yi26LW35aeL54K5IC0g5Lit6Ze054K5IC0g57uT5p2f54K577yI5oC75YWxIDMgcGl4ZWzvvInnmoTov4fnqIsgKi9cbiAgICAvLyBwdWJsaWMgZHJhd0xpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyKTogdm9pZCB7XG4gICAgLy8gICAgIGNvbnN0IGRpc3QgPSBwb2ludDEuc3VidHJhY3QocG9pbnQwKS5sZW5ndGgoKTtcblxuICAgIC8vICAgICBpZiAoZGlzdCA8IDIpIHtcbiAgICAvLyAgICAgICAgIHJldHVybjtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIGNvbnN0IG1pZGRsZVBvaW50ID0gcG9pbnQwLmFkZChwb2ludDEuc3VidHJhY3QocG9pbnQwKS5zY2FsZSgwLjUpKTtcblxuICAgIC8vICAgICB0aGlzLmRyYXdQb2ludChtaWRkbGVQb2ludCwgbmV3IEJBQllMT04uQ29sb3I0KDEsIDEsIDAsIDEpKTtcblxuICAgIC8vICAgICB0aGlzLmRyYXdMaW5lKHBvaW50MCwgbWlkZGxlUG9pbnQpO1xuICAgIC8vICAgICB0aGlzLmRyYXdMaW5lKG1pZGRsZVBvaW50LCBwb2ludDEpO1xuICAgIC8vIH1cblxuICAgIC8qKlxuICAgICAqIFtCcmVzZW5oYW0nc19saW5lX2FsZ29yaXRobV0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQnJlc2VuaGFtJ3NfbGluZV9hbGdvcml0aG0pXG4gICAgICog5pu05bmz5ruR55qE57uY5Yi257q/5p2h55qE566X5rOVXG4gICAgICovXG4gICAgLy8gcHVibGljIGRyYXdCbGluZShwb2ludDA6IEJBQllMT04uVmVjdG9yMiwgcG9pbnQxOiBCQUJZTE9OLlZlY3RvcjIsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCk6IHZvaWQge1xuICAgIC8vICAgICBsZXQgeDAgPSBwb2ludDAueCA+PiAwO1xuICAgIC8vICAgICBsZXQgeTAgPSBwb2ludDAueSA+PiAwO1xuICAgIC8vICAgICBjb25zdCB4MSA9IHBvaW50MS54ID4+IDA7XG4gICAgLy8gICAgIGNvbnN0IHkxID0gcG9pbnQxLnkgPj4gMDtcbiAgICAvLyAgICAgY29uc3QgZHggPSBNYXRoLmFicyh4MSAtIHgwKTtcbiAgICAvLyAgICAgY29uc3QgZHkgPSBNYXRoLmFicyh5MSAtIHkwKTtcblxuICAgIC8vICAgICBjb25zdCBzeCA9IHgwIDwgeDEgPyAxIDogLTE7XG4gICAgLy8gICAgIGNvbnN0IHN5ID0geTAgPCB5MSA/IDEgOiAtMTtcblxuICAgIC8vICAgICBsZXQgZXJyID0gZHggLSBkeTtcblxuICAgIC8vICAgICB3aGlsZSAodHJ1ZSkge1xuICAgIC8vICAgICAgICAgdGhpcy5kcmF3UG9pbnQobmV3IEJBQllMT04uVmVjdG9yMih4MCwgeTApLCBjb2xvcik7XG4gICAgLy8gICAgICAgICBpZiAoeDAgPT0geDEgJiYgeTAgPT0geTEpIHtcbiAgICAvLyAgICAgICAgICAgICBicmVhaztcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNvbnN0IGUyID0gMiAqIGVycjtcbiAgICAvLyAgICAgICAgIGlmIChlMiA+IC1keSkge1xuICAgIC8vICAgICAgICAgICAgIGVyciAtPSBkeTtcbiAgICAvLyAgICAgICAgICAgICB4MCArPSBzeDtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGlmIChlMiA8IGR4KSB7XG4gICAgLy8gICAgICAgICAgICAgZXJyICs9IGR4O1xuICAgIC8vICAgICAgICAgICAgIHkwICs9IHN5O1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgcHVibGljIHJlbmRlcihjYW1lcmE6IENhbWVyYSwgbWVzaGVzOiBNZXNoW10pIHtcbiAgICAgICAgY29uc3Qgdmlld01hdHJpeCA9IEJBQllMT04uTWF0cml4Lkxvb2tBdExIKGNhbWVyYS5wb3NpdGlvbiwgY2FtZXJhLnRhcmdldCwgQkFCWUxPTi5WZWN0b3IzLlVwKCkpO1xuXG4gICAgICAgIGNvbnN0IHByb2plY3RNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5QZXJzcGVjdGl2ZUZvdkxIKDAuNzgsIHRoaXMud29ya2luZ1dpZHRoIC8gdGhpcy53b3JraW5nSGVpZ2h0LCAwLjAxLCAxLjApO1xuXG4gICAgICAgIGZvciAoY29uc3QgY01lc2ggb2YgbWVzaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IEJBQllMT04uTWF0cml4LlJvdGF0aW9uWWF3UGl0Y2hSb2xsKFxuICAgICAgICAgICAgICAgIGNNZXNoLnJvdGF0aW9uLnksXG4gICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueCxcbiAgICAgICAgICAgICAgICBjTWVzaC5yb3RhdGlvbi56LFxuICAgICAgICAgICAgKS5tdWx0aXBseShCQUJZTE9OLk1hdHJpeC5UcmFuc2xhdGlvbihjTWVzaC5wb3N0aW9uLngsIGNNZXNoLnBvc3Rpb24ueSwgY01lc2gucG9zdGlvbi56KSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybU1hdHJpeCA9IHdvcmxkTWF0cml4Lm11bHRpcGx5KHZpZXdNYXRyaXgpLm11bHRpcGx5KHByb2plY3RNYXRyaXgpO1xuXG4gICAgICAgICAgICAvKiogZHJhdyBwb2ludHMgKi9cbiAgICAgICAgICAgIC8vIGZvciAoY29uc3QgaW5kZXhWZXJ0ZXggb2YgY01lc2gudmVydGljZXMpIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwcm9qZWN0UG9pbnQgPSB0aGlzLnByb2plY3QoaW5kZXhWZXJ0ZXgsIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5kcmF3UG9pbnQocHJvamVjdFBvaW50KTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLyoqIGRyYXcgbGluZXMgKi9cbiAgICAgICAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgY01lc2gudmVydGljZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcG9pbnQwID0gdGhpcy5wcm9qZWN0KGNNZXNoLnZlcnRpY2VzW2ldLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHBvaW50MSA9IHRoaXMucHJvamVjdChjTWVzaC52ZXJ0aWNlc1tpICsgMV0sIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5kcmF3TGluZShwb2ludDAsIHBvaW50MSk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8qKiBkcmF3IGZhY2VzICovXG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IHByZWZlci1mb3Itb2ZcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY01lc2guZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RmFjZSA9IGNNZXNoLmZhY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QSA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEIgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5CXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhDID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQ107XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbEEgPSB0aGlzLnByb2plY3QodmVydGV4QSwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbEIgPSB0aGlzLnByb2plY3QodmVydGV4QiwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbEMgPSB0aGlzLnByb2plY3QodmVydGV4QywgdHJhbnNmb3JtTWF0cml4KTtcblxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0xpbmUocGl4ZWxBLCBwaXhlbEIpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0xpbmUocGl4ZWxCLCBwaXhlbEMpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0xpbmUocGl4ZWxDLCBwaXhlbEEpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0JsaW5lKHBpeGVsQSwgcGl4ZWxCKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdCbGluZShwaXhlbEIsIHBpeGVsQyk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3QmxpbmUocGl4ZWxDLCBwaXhlbEEpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3I6IG51bWJlciA9IDAuMjUgKyAoKGkgJSBjTWVzaC5mYWNlcy5sZW5ndGgpIC8gY01lc2guZmFjZXMubGVuZ3RoKSAqIDAuNzU7XG5cbiAgICAgICAgICAgICAgICAvKiogZHJhdyB0cmlhbmdsZSAqL1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1RyaWFuZ2xlKHBpeGVsQSwgcGl4ZWxCLCBwaXhlbEMsIG5ldyBCQUJZTE9OLkNvbG9yNChjb2xvciwgY29sb3IsIGNvbG9yLCAxKSk7XG5cbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgZHJhdyAke3ZlcnRleEEudG9TdHJpbmcoKX0gJHt2ZXJ0ZXhCLnRvU3RyaW5nKCl9ICR7dmVydGV4Qy50b1N0cmluZygpfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTWVzaCB9IGZyb20gXCIuL21lc2hcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRKU09ORmlsZUFzeW5jKGZpbGVOYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAocmVzdWx0OiBNZXNoW10pID0+IHZvaWQpOiB2b2lkIHtcbiAgICBsZXQganNvbk9iamVjdCA9IHt9O1xuICAgIGNvbnN0IHhtbEh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4bWxIdHRwLm9wZW4oXCJHRVRcIiwgZmlsZU5hbWUsIHRydWUpO1xuXG4gICAgeG1sSHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGlmICh4bWxIdHRwLnJlYWR5U3RhdGUgPT0gNCAmJiB4bWxIdHRwLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgIGpzb25PYmplY3QgPSBKU09OLnBhcnNlKHhtbEh0dHAucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIC8vIGNhbGxiYWNrKHRoaXMuY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdCkpO1xuICAgICAgICAgICAgY2FsbGJhY2soY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdCkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHhtbEh0dHAuc2VuZChudWxsKTtcbn1cblxuLyoqIGh0dHBzOi8vZG9jLmJhYnlsb25qcy5jb20vcmVzb3VyY2VzL2ZpbGVfZm9ybWF0X21hcF8oLmJhYnlsb24pXG4gKiAganNvbiDmoLzlvI9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1lc2hlc0Zyb21KU09OKGpzb25PYmplY3Q6IGFueSk6IE1lc2hbXSB7XG4gICAgcmV0dXJuIGpzb25PYmplY3QubWVzaGVzLm1hcCgobWVzaE9iamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB2ZXJ0aWNlc0FycmF5OiBudW1iZXJbXSA9IG1lc2hPYmplY3QucG9zaXRpb25zO1xuICAgICAgICAvLyBGYWNlc1xuICAgICAgICBjb25zdCBpbmRpY2VzQXJyYXk6IG51bWJlcltdID0gbWVzaE9iamVjdC5pbmRpY2VzO1xuXG4gICAgICAgIGNvbnN0IHZlcnRpY2VzQ291bnQgPSBtZXNoT2JqZWN0LnN1Yk1lc2hlc1swXS52ZXJ0aWNlc0NvdW50O1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBmYWNlcyBpcyBsb2dpY2FsbHkgdGhlIHNpemUgb2YgdGhlIGFycmF5IGRpdmlkZWQgYnkgMyAoQSwgQiwgQylcbiAgICAgICAgY29uc3QgZmFjZXNDb3VudCA9IGluZGljZXNBcnJheS5sZW5ndGggLyAzO1xuICAgICAgICBjb25zdCBtZXNoID0gbmV3IE1lc2gobWVzaE9iamVjdC5uYW1lLCB2ZXJ0aWNlc0NvdW50LCBmYWNlc0NvdW50KTtcblxuICAgICAgICAvLyBGaWxsaW5nIHRoZSB2ZXJ0aWNlcyBhcnJheSBvZiBvdXIgbWVzaCBmaXJzdO+8jOagueaNrnBvc2l0aW9uIOavj+asoeWPluS4ieS4quaUvuWIsOmhtueCueaVsOaNrlxuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdmVydGljZXNDb3VudDsgKytpbmRleCkge1xuICAgICAgICAgICAgY29uc3QgeCA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzXTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSB2ZXJ0aWNlc0FycmF5W2luZGV4ICogMyArIDFdO1xuICAgICAgICAgICAgY29uc3QgeiA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzICsgMl07XG4gICAgICAgICAgICBtZXNoLnZlcnRpY2VzW2luZGV4XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgeSwgeik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGVuIGZpbGxpbmcgdGhlIGZhY2VzIGFycmF5IOagueaNrumdoueahOeCuee0ouW8leaVsOaNru+8jOavj+asoeWPluS4ieS4qiDmlL7liLBtZXNo55qE6Z2i5pWw5o2u5Lit5Y67XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBmYWNlc0NvdW50OyArK2luZGV4KSB7XG4gICAgICAgICAgICBjb25zdCBhID0gaW5kaWNlc0FycmF5W2luZGV4ICogM107XG4gICAgICAgICAgICBjb25zdCBiID0gaW5kaWNlc0FycmF5W2luZGV4ICogMyArIDFdO1xuICAgICAgICAgICAgY29uc3QgYyA9IGluZGljZXNBcnJheVtpbmRleCAqIDMgKyAyXTtcblxuICAgICAgICAgICAgbWVzaC5mYWNlc1tpbmRleF0gPSB7XG4gICAgICAgICAgICAgICAgQTogYSxcbiAgICAgICAgICAgICAgICBCOiBiLFxuICAgICAgICAgICAgICAgIEM6IGMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0dGluZyB0aGUgcG9zaXRpb24geW91J3ZlIHNldCBpbiBCbGVuZGVyXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gbWVzaE9iamVjdC5wb3NpdGlvbjtcbiAgICAgICAgbWVzaC5wb3N0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMyhwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sIHBvc2l0aW9uWzJdKTtcblxuICAgICAgICByZXR1cm4gbWVzaDtcbiAgICB9KTtcbiAgICByZXR1cm4gW107XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiYmFieWxvbi5tYXRoLnRzXCIvPlxuXG5pbXBvcnQgeyBDYW1lcmEgfSBmcm9tIFwiLi9jYW1lcmFcIjtcbmltcG9ydCB7IERldmljZSB9IGZyb20gXCIuL2RldmljZVwiO1xuaW1wb3J0IHsgbG9hZEpTT05GaWxlQXN5bmMgfSBmcm9tIFwiLi9sb2FkZXJcIjtcbmltcG9ydCB7IE1lc2ggfSBmcm9tIFwiLi9tZXNoXCI7XG5cbmxldCBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xubGV0IGRldmljZTogRGV2aWNlO1xubGV0IG1lc2g6IE1lc2g7XG5sZXQgbWVzaGVzOiBNZXNoW10gPSBbXTtcbmxldCBjYW1lcmE6IENhbWVyYTtcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgaW5pdCwgZmFsc2UpO1xuXG5mdW5jdGlvbiBpbml0KCkge1xuICAgIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZnJvbnRCdWZmZXJcIikgYXMgSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgLy8gbWVzaCA9IG5ldyBTb2Z0RW5naW5lLk1lc2goXCJDdWJlXCIsIDgpO1xuXG4gICAgLy8gbWVzaGVzLnB1c2gobWVzaCk7XG5cbiAgICAvLyBtZXNoLnZlcnRpY2VzWzBdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1sxXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1syXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzNdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzRdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzZdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s3XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIC0xKTtcblxuICAgIC8vIG1lc2ggPSBuZXcgTWVzaChcIkN1YmVcIiwgOCwgMTIpO1xuICAgIC8vIG1lc2hlcy5wdXNoKG1lc2gpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzFdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzJdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbM10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzRdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzZdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbN10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgLTEpO1xuXG4gICAgLy8gbWVzaC5mYWNlc1swXSA9IHsgQTogMCwgQjogMSwgQzogMiB9O1xuICAgIC8vIG1lc2guZmFjZXNbMV0gPSB7IEE6IDEsIEI6IDIsIEM6IDMgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzJdID0geyBBOiAxLCBCOiAzLCBDOiA2IH07XG4gICAgLy8gbWVzaC5mYWNlc1szXSA9IHsgQTogMSwgQjogNSwgQzogNiB9O1xuICAgIC8vIG1lc2guZmFjZXNbNF0gPSB7IEE6IDAsIEI6IDEsIEM6IDQgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzVdID0geyBBOiAxLCBCOiA0LCBDOiA1IH07XG5cbiAgICAvLyBtZXNoLmZhY2VzWzZdID0geyBBOiAyLCBCOiAzLCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1s3XSA9IHsgQTogMywgQjogNiwgQzogNyB9O1xuICAgIC8vIG1lc2guZmFjZXNbOF0gPSB7IEE6IDAsIEI6IDIsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzldID0geyBBOiAwLCBCOiA0LCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1sxMF0gPSB7IEE6IDQsIEI6IDUsIEM6IDYgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzExXSA9IHsgQTogNCwgQjogNiwgQzogNyB9O1xuXG4gICAgY2FtZXJhID0gbmV3IENhbWVyYSgpO1xuICAgIGRldmljZSA9IG5ldyBEZXZpY2UoY2FudmFzKTtcblxuICAgIGNhbWVyYS5wb3NpdGlvbiA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMCwgMTApO1xuICAgIGNhbWVyYS50YXJnZXQgPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDAsIDAsIDApO1xuXG4gICAgLy8gQ2FsbGluZyB0aGUgSFRNTDUgcmVuZGVyaW5nIGxvb3BcbiAgICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd2luZ0xvb3ApO1xuXG4gICAgbG9hZEpTT05GaWxlQXN5bmMoXCIuL2Rpc3QvcmVzL3Rlc3RfbW9ua2V5LmJhYnlsb25cIiwgbG9hZEpTT05Db21wbGV0ZWQpO1xufVxuXG5mdW5jdGlvbiBsb2FkSlNPTkNvbXBsZXRlZChtZXNoZXNMb2FkZWQ6IE1lc2hbXSkge1xuICAgIG1lc2hlcyA9IG1lc2hlc0xvYWRlZDtcblxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG59XG5cbmZ1bmN0aW9uIGRyYXdpbmdMb29wKCkge1xuICAgIGRldmljZS5jbGVhcigpO1xuXG4gICAgLy8gcm90YXRpbmcgc2xpZ2h0bHkgdGhlIGN1YmUgZHVyaW5nIGVhY2ggZnJhbWUgcmVuZGVyZWRcbiAgICBtZXNoZXMuZm9yRWFjaCgobWVzaCkgPT4ge1xuICAgICAgICBtZXNoLnJvdGF0aW9uLnkgPSBNYXRoLlBJO1xuICAgICAgICAvLyBtZXNoLnJvdGF0aW9uLnkgKz0gMC4wMTtcbiAgICB9KTtcblxuICAgIC8vIERvaW5nIHRoZSB2YXJpb3VzIG1hdHJpeCBvcGVyYXRpb25zXG4gICAgZGV2aWNlLnJlbmRlcihjYW1lcmEsIG1lc2hlcyk7XG4gICAgLy8gRmx1c2hpbmcgdGhlIGJhY2sgYnVmZmVyIGludG8gdGhlIGZyb250IGJ1ZmZlclxuICAgIGRldmljZS5wcmVzZW50KCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcCByZWN1cnNpdmVseVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG59XG4iLCJleHBvcnQgaW50ZXJmYWNlIEZhY2Uge1xuICAgIEE6IG51bWJlcjtcbiAgICBCOiBudW1iZXI7XG4gICAgQzogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTWVzaCB7XG4gICAgcHVibGljIHBvc3Rpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgcm90YXRpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgdmVydGljZXM6IEJBQllMT04uVmVjdG9yM1tdO1xuICAgIHB1YmxpYyBmYWNlczogRmFjZVtdO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgdmVydGljZXNDb3VudDogbnVtYmVyLCBmYWNlc0NvdW50OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IG5ldyBBcnJheSh2ZXJ0aWNlc0NvdW50KTtcbiAgICAgICAgdGhpcy5mYWNlcyA9IG5ldyBBcnJheShmYWNlc0NvdW50KTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgIHRoaXMucG9zdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgfVxufVxuIl19
