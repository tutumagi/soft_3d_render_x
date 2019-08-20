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
  }

  Device.prototype.clear = function () {
    this.workingContext.clearRect(0, 0, this.workingWidth, this.workingHeight);
    this.backbuffer = this.workingContext.getImageData(0, 0, this.workingWidth, this.workingHeight);
  };

  Device.prototype.present = function () {
    this.workingContext.putImageData(this.backbuffer, 0, 0);
  };

  Device.prototype.putPixel = function (x, y, color) {
    this.backbufferdata = this.backbuffer.data;
    var index = ((x >> 0) + (y >> 0) * this.workingWidth) * 4;
    this.backbufferdata[index] = color.r * 255;
    this.backbufferdata[index + 1] = color.g * 255;
    this.backbufferdata[index + 2] = color.b * 255;
    this.backbufferdata[index + 3] = color.a * 255;
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
      this.putPixel(point.x, point.y, color);
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
    var ex = this.interpolate(pc.x, pd.x, gradient2) >> 0; // drawing a line from left (sx) to right (ex)

    for (var x = sx; x < ex; x++) {
      this.drawPoint(new BABYLON.Vector2(x, y), color);
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


  Device.prototype.drawLine = function (point0, point1) {
    var dist = point1.subtract(point0).length();

    if (dist < 2) {
      return;
    }

    var middlePoint = point0.add(point1.subtract(point0).scale(0.5));
    this.drawPoint(middlePoint, new BABYLON.Color4(1, 1, 0, 1));
    this.drawLine(point0, middlePoint);
    this.drawLine(middlePoint, point1);
  };
  /**
   * [Bresenham's_line_algorithm](https://en.wikipedia.org/wiki/Bresenham's_line_algorithm)
   * 更平滑的绘制线条的算法
   */


  Device.prototype.drawBline = function (point0, point1) {
    var x0 = point0.x >> 0;
    var y0 = point0.y >> 0;
    var x1 = point1.x >> 0;
    var y1 = point1.y >> 0;
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var err = dx - dy;

    while (true) {
      this.drawPoint(new BABYLON.Vector2(x0, y0), new BABYLON.Color4(1, 1, 0, 1));

      if (x0 == x1 && y0 == y1) {
        break;
      }

      var e2 = 2 * err;

      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }

      if (e2 < dx) {
        err += dx;
        y0 += sy;
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
    mesh.rotation.x += 0.01;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FtZXJhLnRzIiwic3JjL2RldmljZS50cyIsInNyYy9sb2FkZXIudHMiLCJzcmMvbWFpbi50cyIsInNyYy9tZXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsSUFBQSxNQUFBO0FBQUE7QUFBQSxZQUFBO0FBSUksV0FBQSxNQUFBLEdBQUE7QUFDSSxTQUFLLFFBQUwsR0FBZ0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFBaEI7QUFDQSxTQUFLLE1BQUwsR0FBYyxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFkO0FBQ0g7O0FBQ0wsU0FBQSxNQUFBO0FBQUMsQ0FSRCxFQUFBOztBQUFhLE9BQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQTs7Ozs7Ozs7O0FDR2IsSUFBQSxNQUFBO0FBQUE7QUFBQSxZQUFBO0FBU0ksV0FBQSxNQUFBLENBQVksTUFBWixFQUFxQztBQUNqQyxTQUFLLGFBQUwsR0FBcUIsTUFBckI7QUFDQSxTQUFLLFlBQUwsR0FBb0IsTUFBTSxDQUFDLEtBQTNCO0FBQ0EsU0FBSyxhQUFMLEdBQXFCLE1BQU0sQ0FBQyxNQUE1QjtBQUVBLFNBQUssY0FBTCxHQUFzQixLQUFLLGFBQUwsQ0FBbUIsVUFBbkIsQ0FBOEIsSUFBOUIsQ0FBdEI7QUFDSDs7QUFFTSxFQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsS0FBQSxHQUFQLFlBQUE7QUFDSSxTQUFLLGNBQUwsQ0FBb0IsU0FBcEIsQ0FBOEIsQ0FBOUIsRUFBaUMsQ0FBakMsRUFBb0MsS0FBSyxZQUF6QyxFQUF1RCxLQUFLLGFBQTVEO0FBQ0EsU0FBSyxVQUFMLEdBQWtCLEtBQUssY0FBTCxDQUFvQixZQUFwQixDQUFpQyxDQUFqQyxFQUFvQyxDQUFwQyxFQUF1QyxLQUFLLFlBQTVDLEVBQTBELEtBQUssYUFBL0QsQ0FBbEI7QUFDSCxHQUhNOztBQUtBLEVBQUEsTUFBQSxD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cUJBQXFCLENBQUMsV0FBRCxDQUFyQjtBQUNIOztBQUVELFNBQVMsV0FBVCxHQUFvQjtBQUNoQixFQUFBLE1BQU0sQ0FBQyxLQUFQLEdBRGdCLENBR2hCOztBQUNBLEVBQUEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxVQUFDLElBQUQsRUFBSztBQUNoQixJQUFBLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBZCxJQUFtQixJQUFuQjtBQUNBLElBQUEsSUFBSSxDQUFDLFFBQUwsQ0FBYyxDQUFkLElBQW1CLElBQW5CO0FBQ0gsR0FIRCxFQUpnQixDQVNoQjs7QUFDQSxFQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBZCxFQUFzQixNQUF0QixFQVZnQixDQVdoQjs7QUFDQSxFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBWmdCLENBY2hCOztBQUNBLEVBQUEscUJBQXFCLENBQUMsV0FBRCxDQUFyQjtBQUNIOzs7Ozs7Ozs7QUNuRkQsSUFBQSxJQUFBO0FBQUE7QUFBQSxZQUFBO0FBTUksV0FBQSxJQUFBLENBQW1CLElBQW5CLEVBQWlDLGFBQWpDLEVBQXdELFVBQXhELEVBQTBFO0FBQXZELFNBQUEsSUFBQSxHQUFBLElBQUE7QUFDZixTQUFLLFFBQUwsR0FBZ0IsSUFBSSxLQUFKLENBQVUsYUFBVixDQUFoQjtBQUNBLFNBQUssS0FBTCxHQUFhLElBQUksS0FBSixDQUFVLFVBQVYsQ0FBYjtBQUNBLFNBQUssUUFBTCxHQUFnQixPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFoQjtBQUNBLFNBQUssT0FBTCxHQUFlLE9BQU8sQ0FBQyxPQUFSLENBQWdCLElBQWhCLEVBQWY7QUFDSDs7QUFDTCxTQUFBLElBQUE7QUFBQyxDQVpELEVBQUE7O0FBQWEsT0FBQSxDQUFBLElBQUEsR0FBQSxJQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiZXhwb3J0IGNsYXNzIENhbWVyYSB7XG4gICAgcHVibGljIHBvc2l0aW9uOiBCQUJZTE9OLlZlY3RvcjM7XG4gICAgcHVibGljIHRhcmdldDogQkFCWUxPTi5WZWN0b3IzO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSBCQUJZTE9OLlZlY3RvcjMuWmVybygpO1xuICAgICAgICB0aGlzLnRhcmdldCA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ2FtZXJhIH0gZnJvbSBcIi4vY2FtZXJhXCI7XG5pbXBvcnQgeyBNZXNoIH0gZnJvbSBcIi4vbWVzaFwiO1xuXG5leHBvcnQgY2xhc3MgRGV2aWNlIHtcbiAgICBwcml2YXRlIGJhY2tidWZmZXI/OiBJbWFnZURhdGE7XG4gICAgcHJpdmF0ZSB3b3JraW5nQ2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICBwcml2YXRlIHdvcmtpbmdDb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG4gICAgcHJpdmF0ZSB3b3JraW5nV2lkdGg6IG51bWJlcjtcbiAgICBwcml2YXRlIHdvcmtpbmdIZWlnaHQ6IG51bWJlcjtcblxuICAgIHByaXZhdGUgYmFja2J1ZmZlcmRhdGE/OiBVaW50OENsYW1wZWRBcnJheTtcblxuICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICAgICAgdGhpcy53b3JraW5nQ2FudmFzID0gY2FudmFzO1xuICAgICAgICB0aGlzLndvcmtpbmdXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgICAgdGhpcy53b3JraW5nSGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcblxuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0ID0gdGhpcy53b3JraW5nQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKSE7XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndvcmtpbmdXaWR0aCwgdGhpcy53b3JraW5nSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyID0gdGhpcy53b3JraW5nQ29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy53b3JraW5nV2lkdGgsIHRoaXMud29ya2luZ0hlaWdodCk7XG4gICAgfVxuXG4gICAgcHVibGljIHByZXNlbnQoKSB7XG4gICAgICAgIHRoaXMud29ya2luZ0NvbnRleHQucHV0SW1hZ2VEYXRhKHRoaXMuYmFja2J1ZmZlciEsIDAsIDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBwdXRQaXhlbCh4OiBudW1iZXIsIHk6IG51bWJlciwgY29sb3I6IEJBQllMT04uQ29sb3I0KSB7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGEgPSB0aGlzLmJhY2tidWZmZXIhLmRhdGE7XG5cbiAgICAgICAgY29uc3QgaW5kZXg6IG51bWJlciA9ICgoeCA+PiAwKSArICh5ID4+IDApICogdGhpcy53b3JraW5nV2lkdGgpICogNDtcblxuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4XSA9IGNvbG9yLnIgKiAyNTU7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXggKyAxXSA9IGNvbG9yLmcgKiAyNTU7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXggKyAyXSA9IGNvbG9yLmIgKiAyNTU7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXggKyAzXSA9IGNvbG9yLmEgKiAyNTU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvamVjdCB0YWtlcyBzb21lIDNEIGNvb3JkaW5hdGVzIGFuZCB0cmFuc2Zvcm0gdGhlbVxuICAgICAqIGluIDJEIGNvb3JkaW5hdGVzIHVzaW5nIHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICAgKi9cbiAgICBwdWJsaWMgcHJvamVjdChjb29yZDogQkFCWUxPTi5WZWN0b3IzLCB0cmFuc01hdDogQkFCWUxPTi5NYXRyaXgpOiBCQUJZTE9OLlZlY3RvcjMge1xuICAgICAgICAvLyB0cmFuc2Zvcm1pbmcgdGhlIGNvb3JkaW5hdGVzXG4gICAgICAgIGNvbnN0IHBvaW50ID0gQkFCWUxPTi5WZWN0b3IzLlRyYW5zZm9ybUNvb3JkaW5hdGVzKGNvb3JkLCB0cmFuc01hdCk7XG5cbiAgICAgICAgLy8gVGhlIHRyYW5zZm9ybWVkIGNvb3JkaW5hdGVzIHdpbGwgYmUgYmFzZWQgb24gY29vcmRpbmF0ZSBzeXN0ZW1cbiAgICAgICAgLy8gc3RhcnRpbmcgb24gdGhlIGNlbnRlciBvZiB0aGUgc2NyZWVuLiBCdXQgZHJhd2luZyBvbiBzY3JlZW4gbm9ybWFsbHkgc3RhcnRzXG4gICAgICAgIC8vIGZyb20gdG9wIGxlZnQuIFdlIHRoZW4gbmVlZCB0byB0cmFuc2Zvcm0gdGhlbSBhZ2FpbiB0byBoYXZlIHg6MCwgeTowIG9uIHRvcCBsZWZ0XG4gICAgICAgIGNvbnN0IHggPSAocG9pbnQueCAqIHRoaXMud29ya2luZ1dpZHRoICsgdGhpcy53b3JraW5nV2lkdGggLyAyLjApID4+IDA7XG4gICAgICAgIGNvbnN0IHkgPSAoLXBvaW50LnkgKiB0aGlzLndvcmtpbmdIZWlnaHQgKyB0aGlzLndvcmtpbmdIZWlnaHQgLyAyLjApID4+IDA7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgeSwgcG9pbnQueik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYGRyYXdQb2ludGAgY2FsbHMgcHV0UGl4ZWwgYnV0IGRvZXMgdGhlIGNsaXBwaW5nIG9wZXJhdGlvbiBiZWZvcmVcbiAgICAgKiBAcGFyYW0gcG9pbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgZHJhd1BvaW50KHBvaW50OiBCQUJZTE9OLlZlY3RvcjIsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCkge1xuICAgICAgICAvLyBDbGlwcGluZyB3aGF0J3MgdmlzaWJsZSBvbiBzY3JlZW5cbiAgICAgICAgaWYgKHBvaW50LnggPj0gMCAmJiBwb2ludC55ID49IDAgJiYgcG9pbnQueCA8IHRoaXMud29ya2luZ1dpZHRoICYmIHBvaW50LnkgPCB0aGlzLndvcmtpbmdIZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIERyYXdpbmcgYSB5ZWxsb3cgcG9pbnRcbiAgICAgICAgICAgIHRoaXMucHV0UGl4ZWwocG9pbnQueCwgcG9pbnQueSwgY29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xhbXBpbmcgdmFsdWVzIHRvIGtlZXAgdGhlbSBiZXR3ZWVuIG1pbiBhbmQgbWF4XG4gICAgICogQHBhcmFtIHZhbHVlIOW+heS/ruato+WAvFxuICAgICAqIEBwYXJhbSBtaW57PTB9IOacgOWwj+WAvFxuICAgICAqIEBwYXJhbSBtYXh7PTF9IOacgOWkp+WAvFxuICAgICAqL1xuICAgIHB1YmxpYyBjbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciA9IDAsIG1heDogbnVtYmVyID0gMSk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKHZhbHVlLCBtYXgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcnBvbGF0aW5nIHRoZSB2YWx1ZSBiZXR3ZWVuIDIgdmVydGljZXNcbiAgICAgKiBtaW4gaXMgdGhlIHN0YXJ0aW5nIHBvaW50LCBtYXggdGhlIGVuZGluZyBwb2ludFxuICAgICAqIGFuZCBncmFkaWVudCB0aGUgJSBiZXR3ZWVuIHRoZSAyIHBvaW50c1xuICAgICAqIOagueaNriBncmFkaWVudOezu+aVsCDojrflj5Yg5LuOIGBtaW5gIOWIsCBgbWF4YCDnmoTkuK3pl7TlgLxcbiAgICAgKiBAcGFyYW0gbWluXG4gICAgICogQHBhcmFtIG1heFxuICAgICAqIEBwYXJhbSBncmFkaWVudFxuICAgICAqL1xuICAgIHB1YmxpYyBpbnRlcnBvbGF0ZShtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIGdyYWRpZW50OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gbWluICsgKG1heCAtIG1pbikgKiB0aGlzLmNsYW1wKGdyYWRpZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBkcmF3aW5nIGxpbmUgYmV0d2VlbiAyIHBvaW50cyBmcm9tIGxlZnQgdG8gcmlnaHRcbiAgICAgKiBwYSBwYiAtPiBwYyBwZFxuICAgICAqIHBhLHBiLHBjLHBkIG11c3QgdGhlbiBiZSBzb3J0ZWQgYmVmb3JlXG4gICAgICogQHBhcmFtIHlcbiAgICAgKiBAcGFyYW0gcGFcbiAgICAgKiBAcGFyYW0gcGJcbiAgICAgKiBAcGFyYW0gcGNcbiAgICAgKiBAcGFyYW0gcGRcbiAgICAgKiBAcGFyYW0gY29sb3JcbiAgICAgKi9cbiAgICBwdWJsaWMgcHJvY2Vzc1NjYW5MaW5lKFxuICAgICAgICB5OiBudW1iZXIsXG4gICAgICAgIHBhOiBCQUJZTE9OLlZlY3RvcjMsXG4gICAgICAgIHBiOiBCQUJZTE9OLlZlY3RvcjMsXG4gICAgICAgIHBjOiBCQUJZTE9OLlZlY3RvcjMsXG4gICAgICAgIHBkOiBCQUJZTE9OLlZlY3RvcjMsXG4gICAgICAgIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCxcbiAgICApOiB2b2lkIHtcbiAgICAgICAgLy8gdGhhbmtzIHRvIGN1cnJlbnQgWSwgd2UgY2FuIGNvbXB1dGUgdGhlIGdyYWRpZW50IHRvIGNvbXB1dGUgb3RoZXJzIHZhbHVlcyBsaWtlXG4gICAgICAgIC8vIHRoZSBzdGFydGluZyBYKHN4KSBhbmQgZW5kaW5nIFggKGVzKSB0byBkcmF3IGJldHdlZW5cbiAgICAgICAgLy8gaWYgcGEuWSA9PSBwYi5ZIG9yIHBjLlkgPT0gcGQuWSwgZ3JhZGllbnQgaXMgZm9yY2VkIHRvIDFcbiAgICAgICAgY29uc3QgZ3JhZGllbnQxID0gcGEueSAhPSBwYi55ID8gKHkgLSBwYS55KSAvIChwYi55IC0gcGEueSkgOiAxO1xuICAgICAgICBjb25zdCBncmFkaWVudDIgPSBwYS55ICE9IHBiLnkgPyAoeSAtIHBjLnkpIC8gKHBkLnkgLSBwYy55KSA6IDE7XG4gICAgICAgIGNvbnN0IHN4ID0gdGhpcy5pbnRlcnBvbGF0ZShwYS54LCBwYi54LCBncmFkaWVudDEpID4+IDA7XG4gICAgICAgIGNvbnN0IGV4ID0gdGhpcy5pbnRlcnBvbGF0ZShwYy54LCBwZC54LCBncmFkaWVudDIpID4+IDA7XG5cbiAgICAgICAgLy8gZHJhd2luZyBhIGxpbmUgZnJvbSBsZWZ0IChzeCkgdG8gcmlnaHQgKGV4KVxuICAgICAgICBmb3IgKGxldCB4ID0gc3g7IHggPCBleDsgeCsrKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdQb2ludChuZXcgQkFCWUxPTi5WZWN0b3IyKHgsIHkpLCBjb2xvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZHJhd1RyaWFuZ2xlKHAxOiBCQUJZTE9OLlZlY3RvcjMsIHAyOiBCQUJZTE9OLlZlY3RvcjMsIHAzOiBCQUJZTE9OLlZlY3RvcjMsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCk6IHZvaWQge1xuICAgICAgICAvLyBTb3J0aW5nIHRoZSBwb2ludHMgaW4gb3JkZXIgdG8gYWx3YXlzIGhhdmUgdGhpcyBvcmRlciBvbiBzY3JlZW4gcDEsIHAyICYgcDNcbiAgICAgICAgLy8gd2l0aCBwMSBhbHdheXMgdXAgKHRodXMgaGF2aW5nIHRoZSBZIHRoZSBsb3dlc3QgcG9zc2libGUgdG8gYmUgbmVhciB0aGUgdG9wIHNjcmVlbilcbiAgICAgICAgLy8gdGhlbiBwMiBiZXR3ZWVuIHAxICYgcDMgKGFjY29yZGluZyB0byBZLWF4aXMgdXAgdG8gZG93biApXG4gICAgICAgIGlmIChwMS55ID4gcDIueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHAyO1xuICAgICAgICAgICAgcDIgPSBwMTtcbiAgICAgICAgICAgIHAxID0gdGVtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwMi55ID4gcDMueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHAyO1xuICAgICAgICAgICAgcDIgPSBwMztcbiAgICAgICAgICAgIHAzID0gdGVtcDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwMS55ID4gcDIueSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcCA9IHAyO1xuICAgICAgICAgICAgcDIgPSBwMTtcbiAgICAgICAgICAgIHAxID0gdGVtcDtcbiAgICAgICAgfVxuICAgICAgICAvLyBzb3J0IGVuZFxuXG4gICAgICAgIC8vIGludmVyc2Ugc2xvcGVzXG4gICAgICAgIGxldCBkUDFQMjogbnVtYmVyO1xuICAgICAgICBsZXQgZFAxUDM6IG51bWJlcjtcblxuICAgICAgICAvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1Nsb3BlXG4gICAgICAgIC8vIENvbXB1dGluZyBzbG9wZXNcbiAgICAgICAgaWYgKHAyLnkgLSBwMS55ID4gMCkge1xuICAgICAgICAgICAgZFAxUDIgPSAocDIueCAtIHAxLngpIC8gKHAyLnkgLSBwMS55KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRQMVAyID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwMy55IC0gcDEueSA+IDApIHtcbiAgICAgICAgICAgIGRQMVAzID0gKHAzLnggLSBwMS54KSAvIChwMy55IC0gcDEueSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkUDFQMyA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBGaXJzdCBjYXNlIHdoZXJlIHRyaWFuZ2xlcyBhcmUgbGlrZSB0aGF0OlxuICAgICAgICAvLyAgICAgICAgIHAxXG4gICAgICAgIC8vICAgICAgICAgICDOm1xuICAgICAgICAvLyAgICAgICAgICDilbEg4pWyXG4gICAgICAgIC8vICAgICAgICAg4pWxICAg4pWyXG4gICAgICAgIC8vICAgICAgICDilbEgICAgIOKVslxuICAgICAgICAvLyAgICAgICDilbEgICAgICAg4pWyXG4gICAgICAgIC8vICAgICAg4pWxICAgICAgICAg4pWyXG4gICAgICAgIC8vICAgICDilbEgICAgICAgICAgIOKVslxuICAgICAgICAvLyAgICDilbEgICAgICAgICAgICAgICDilo9wMlxuICAgICAgICAvLyAg4pWxXG4gICAgICAgIC8vIHAzIOKWleKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgICAgICAvLyBwMiBvbiByaWdodFxuICAgICAgICBpZiAoZFAxUDIgPiBkUDFQMykge1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHAxLnkgPj4gMDsgeSA8PSBwMy55ID4+IDA7IHkrKykge1xuICAgICAgICAgICAgICAgIGlmICh5IDwgcDIueSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDMgcDFwMlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZSh5LCBwMSwgcDMsIHAxLCBwMiwgY29sb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDFwMyBwMnAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKHksIHAxLCBwMywgcDIsIHAzLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcDIgb24gbGVmdFxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHAxLnkgPj4gMDsgeSA8PSBwMy55ID4+IDA7IHkrKykge1xuICAgICAgICAgICAgICAgIGlmICh5IDwgcDIueSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDIgcDFwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZSh5LCBwMSwgcDIsIHAxLCBwMywgY29sb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDJwMyBwMXAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKHksIHAyLCBwMywgcDEsIHAzLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqIOe7mOWItue6v+adoSDmmK/kuIDkuKog6YCS5b2S57uY5Yi26LW35aeL54K5IC0g5Lit6Ze054K5IC0g57uT5p2f54K577yI5oC75YWxIDMgcGl4ZWzvvInnmoTov4fnqIsgKi9cbiAgICBwdWJsaWMgZHJhd0xpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGRpc3QgPSBwb2ludDEuc3VidHJhY3QocG9pbnQwKS5sZW5ndGgoKTtcblxuICAgICAgICBpZiAoZGlzdCA8IDIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1pZGRsZVBvaW50ID0gcG9pbnQwLmFkZChwb2ludDEuc3VidHJhY3QocG9pbnQwKS5zY2FsZSgwLjUpKTtcblxuICAgICAgICB0aGlzLmRyYXdQb2ludChtaWRkbGVQb2ludCwgbmV3IEJBQllMT04uQ29sb3I0KDEsIDEsIDAsIDEpKTtcblxuICAgICAgICB0aGlzLmRyYXdMaW5lKHBvaW50MCwgbWlkZGxlUG9pbnQpO1xuICAgICAgICB0aGlzLmRyYXdMaW5lKG1pZGRsZVBvaW50LCBwb2ludDEpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFtCcmVzZW5oYW0nc19saW5lX2FsZ29yaXRobV0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQnJlc2VuaGFtJ3NfbGluZV9hbGdvcml0aG0pXG4gICAgICog5pu05bmz5ruR55qE57uY5Yi257q/5p2h55qE566X5rOVXG4gICAgICovXG4gICAgcHVibGljIGRyYXdCbGluZShwb2ludDA6IEJBQllMT04uVmVjdG9yMiwgcG9pbnQxOiBCQUJZTE9OLlZlY3RvcjIpOiB2b2lkIHtcbiAgICAgICAgbGV0IHgwID0gcG9pbnQwLnggPj4gMDtcbiAgICAgICAgbGV0IHkwID0gcG9pbnQwLnkgPj4gMDtcbiAgICAgICAgY29uc3QgeDEgPSBwb2ludDEueCA+PiAwO1xuICAgICAgICBjb25zdCB5MSA9IHBvaW50MS55ID4+IDA7XG4gICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMoeDEgLSB4MCk7XG4gICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMoeTEgLSB5MCk7XG5cbiAgICAgICAgY29uc3Qgc3ggPSB4MCA8IHgxID8gMSA6IC0xO1xuICAgICAgICBjb25zdCBzeSA9IHkwIDwgeTEgPyAxIDogLTE7XG5cbiAgICAgICAgbGV0IGVyciA9IGR4IC0gZHk7XG5cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd1BvaW50KG5ldyBCQUJZTE9OLlZlY3RvcjIoeDAsIHkwKSwgbmV3IEJBQllMT04uQ29sb3I0KDEsIDEsIDAsIDEpKTtcbiAgICAgICAgICAgIGlmICh4MCA9PSB4MSAmJiB5MCA9PSB5MSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZTIgPSAyICogZXJyO1xuICAgICAgICAgICAgaWYgKGUyID4gLWR5KSB7XG4gICAgICAgICAgICAgICAgZXJyIC09IGR5O1xuICAgICAgICAgICAgICAgIHgwICs9IHN4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGUyIDwgZHgpIHtcbiAgICAgICAgICAgICAgICBlcnIgKz0gZHg7XG4gICAgICAgICAgICAgICAgeTAgKz0gc3k7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKGNhbWVyYTogQ2FtZXJhLCBtZXNoZXM6IE1lc2hbXSkge1xuICAgICAgICBjb25zdCB2aWV3TWF0cml4ID0gQkFCWUxPTi5NYXRyaXguTG9va0F0TEgoY2FtZXJhLnBvc2l0aW9uLCBjYW1lcmEudGFyZ2V0LCBCQUJZTE9OLlZlY3RvcjMuVXAoKSk7XG5cbiAgICAgICAgY29uc3QgcHJvamVjdE1hdHJpeCA9IEJBQllMT04uTWF0cml4LlBlcnNwZWN0aXZlRm92TEgoMC43OCwgdGhpcy53b3JraW5nV2lkdGggLyB0aGlzLndvcmtpbmdIZWlnaHQsIDAuMDEsIDEuMCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBjTWVzaCBvZiBtZXNoZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gQkFCWUxPTi5NYXRyaXguUm90YXRpb25ZYXdQaXRjaFJvbGwoXG4gICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueSxcbiAgICAgICAgICAgICAgICBjTWVzaC5yb3RhdGlvbi54LFxuICAgICAgICAgICAgICAgIGNNZXNoLnJvdGF0aW9uLnosXG4gICAgICAgICAgICApLm11bHRpcGx5KEJBQllMT04uTWF0cml4LlRyYW5zbGF0aW9uKGNNZXNoLnBvc3Rpb24ueCwgY01lc2gucG9zdGlvbi55LCBjTWVzaC5wb3N0aW9uLnopKTtcblxuICAgICAgICAgICAgY29uc3QgdHJhbnNmb3JtTWF0cml4ID0gd29ybGRNYXRyaXgubXVsdGlwbHkodmlld01hdHJpeCkubXVsdGlwbHkocHJvamVjdE1hdHJpeCk7XG5cbiAgICAgICAgICAgIC8qKiBkcmF3IHBvaW50cyAqL1xuICAgICAgICAgICAgLy8gZm9yIChjb25zdCBpbmRleFZlcnRleCBvZiBjTWVzaC52ZXJ0aWNlcykge1xuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHByb2plY3RQb2ludCA9IHRoaXMucHJvamVjdChpbmRleFZlcnRleCwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmRyYXdQb2ludChwcm9qZWN0UG9pbnQpO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvKiogZHJhdyBsaW5lcyAqL1xuICAgICAgICAgICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCBjTWVzaC52ZXJ0aWNlcy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwb2ludDAgPSB0aGlzLnByb2plY3QoY01lc2gudmVydGljZXNbaV0sIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcG9pbnQxID0gdGhpcy5wcm9qZWN0KGNNZXNoLnZlcnRpY2VzW2kgKyAxXSwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgIC8vICAgICB0aGlzLmRyYXdMaW5lKHBvaW50MCwgcG9pbnQxKTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLyoqIGRyYXcgZmFjZXMgKi9cbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogcHJlZmVyLWZvci1vZlxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjTWVzaC5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRGYWNlID0gY01lc2guZmFjZXNbaV07XG5cbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhBID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQV07XG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QiA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkJdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEMgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5DXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsQSA9IHRoaXMucHJvamVjdCh2ZXJ0ZXhBLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsQiA9IHRoaXMucHJvamVjdCh2ZXJ0ZXhCLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsQyA9IHRoaXMucHJvamVjdCh2ZXJ0ZXhDLCB0cmFuc2Zvcm1NYXRyaXgpO1xuXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3TGluZShwaXhlbEEsIHBpeGVsQik7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3TGluZShwaXhlbEIsIHBpeGVsQyk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3TGluZShwaXhlbEMsIHBpeGVsQSk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3QmxpbmUocGl4ZWxBLCBwaXhlbEIpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0JsaW5lKHBpeGVsQiwgcGl4ZWxDKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdCbGluZShwaXhlbEMsIHBpeGVsQSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjb2xvcjogbnVtYmVyID0gMC4yNSArICgoaSAlIGNNZXNoLmZhY2VzLmxlbmd0aCkgLyBjTWVzaC5mYWNlcy5sZW5ndGgpICogMC43NTtcblxuICAgICAgICAgICAgICAgIC8qKiBkcmF3IHRyaWFuZ2xlICovXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3VHJpYW5nbGUocGl4ZWxBLCBwaXhlbEIsIHBpeGVsQywgbmV3IEJBQllMT04uQ29sb3I0KGNvbG9yLCBjb2xvciwgY29sb3IsIDEpKTtcblxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkcmF3ICR7dmVydGV4QS50b1N0cmluZygpfSAke3ZlcnRleEIudG9TdHJpbmcoKX0gJHt2ZXJ0ZXhDLnRvU3RyaW5nKCl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNZXNoIH0gZnJvbSBcIi4vbWVzaFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEpTT05GaWxlQXN5bmMoZmlsZU5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChyZXN1bHQ6IE1lc2hbXSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGxldCBqc29uT2JqZWN0ID0ge307XG4gICAgY29uc3QgeG1sSHR0cCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhtbEh0dHAub3BlbihcIkdFVFwiLCBmaWxlTmFtZSwgdHJ1ZSk7XG5cbiAgICB4bWxIdHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHhtbEh0dHAucmVhZHlTdGF0ZSA9PSA0ICYmIHhtbEh0dHAuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAganNvbk9iamVjdCA9IEpTT04ucGFyc2UoeG1sSHR0cC5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgLy8gY2FsbGJhY2sodGhpcy5jcmVhdGVNZXNoZXNGcm9tSlNPTihqc29uT2JqZWN0KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhjcmVhdGVNZXNoZXNGcm9tSlNPTihqc29uT2JqZWN0KSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgeG1sSHR0cC5zZW5kKG51bGwpO1xufVxuXG4vKiogaHR0cHM6Ly9kb2MuYmFieWxvbmpzLmNvbS9yZXNvdXJjZXMvZmlsZV9mb3JtYXRfbWFwXyguYmFieWxvbilcbiAqICBqc29uIOagvOW8j1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdDogYW55KTogTWVzaFtdIHtcbiAgICByZXR1cm4ganNvbk9iamVjdC5tZXNoZXMubWFwKChtZXNoT2JqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHZlcnRpY2VzQXJyYXk6IG51bWJlcltdID0gbWVzaE9iamVjdC5wb3NpdGlvbnM7XG4gICAgICAgIC8vIEZhY2VzXG4gICAgICAgIGNvbnN0IGluZGljZXNBcnJheTogbnVtYmVyW10gPSBtZXNoT2JqZWN0LmluZGljZXM7XG5cbiAgICAgICAgY29uc3QgdmVydGljZXNDb3VudCA9IG1lc2hPYmplY3Quc3ViTWVzaGVzWzBdLnZlcnRpY2VzQ291bnQ7XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIGZhY2VzIGlzIGxvZ2ljYWxseSB0aGUgc2l6ZSBvZiB0aGUgYXJyYXkgZGl2aWRlZCBieSAzIChBLCBCLCBDKVxuICAgICAgICBjb25zdCBmYWNlc0NvdW50ID0gaW5kaWNlc0FycmF5Lmxlbmd0aCAvIDM7XG4gICAgICAgIGNvbnN0IG1lc2ggPSBuZXcgTWVzaChtZXNoT2JqZWN0Lm5hbWUsIHZlcnRpY2VzQ291bnQsIGZhY2VzQ291bnQpO1xuXG4gICAgICAgIC8vIEZpbGxpbmcgdGhlIHZlcnRpY2VzIGFycmF5IG9mIG91ciBtZXNoIGZpcnN077yM5qC55o2ucG9zaXRpb24g5q+P5qyh5Y+W5LiJ5Liq5pS+5Yiw6aG254K55pWw5o2uXG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB2ZXJ0aWNlc0NvdW50OyArK2luZGV4KSB7XG4gICAgICAgICAgICBjb25zdCB4ID0gdmVydGljZXNBcnJheVtpbmRleCAqIDNdO1xuICAgICAgICAgICAgY29uc3QgeSA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzICsgMV07XG4gICAgICAgICAgICBjb25zdCB6ID0gdmVydGljZXNBcnJheVtpbmRleCAqIDMgKyAyXTtcbiAgICAgICAgICAgIG1lc2gudmVydGljZXNbaW5kZXhdID0gbmV3IEJBQllMT04uVmVjdG9yMyh4LCB5LCB6KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoZW4gZmlsbGluZyB0aGUgZmFjZXMgYXJyYXkg5qC55o2u6Z2i55qE54K557Si5byV5pWw5o2u77yM5q+P5qyh5Y+W5LiJ5LiqIOaUvuWIsG1lc2jnmoTpnaLmlbDmja7kuK3ljrtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGZhY2VzQ291bnQ7ICsraW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IGEgPSBpbmRpY2VzQXJyYXlbaW5kZXggKiAzXTtcbiAgICAgICAgICAgIGNvbnN0IGIgPSBpbmRpY2VzQXJyYXlbaW5kZXggKiAzICsgMV07XG4gICAgICAgICAgICBjb25zdCBjID0gaW5kaWNlc0FycmF5W2luZGV4ICogMyArIDJdO1xuXG4gICAgICAgICAgICBtZXNoLmZhY2VzW2luZGV4XSA9IHtcbiAgICAgICAgICAgICAgICBBOiBhLFxuICAgICAgICAgICAgICAgIEI6IGIsXG4gICAgICAgICAgICAgICAgQzogYyxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXR0aW5nIHRoZSBwb3NpdGlvbiB5b3UndmUgc2V0IGluIEJsZW5kZXJcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSBtZXNoT2JqZWN0LnBvc2l0aW9uO1xuICAgICAgICBtZXNoLnBvc3Rpb24gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKHBvc2l0aW9uWzBdLCBwb3NpdGlvblsxXSwgcG9zaXRpb25bMl0pO1xuXG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH0pO1xuICAgIHJldHVybiBbXTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJiYWJ5bG9uLm1hdGgudHNcIi8+XG5cbmltcG9ydCB7IENhbWVyYSB9IGZyb20gXCIuL2NhbWVyYVwiO1xuaW1wb3J0IHsgRGV2aWNlIH0gZnJvbSBcIi4vZGV2aWNlXCI7XG5pbXBvcnQgeyBsb2FkSlNPTkZpbGVBc3luYyB9IGZyb20gXCIuL2xvYWRlclwiO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gXCIuL21lc2hcIjtcblxubGV0IGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG5sZXQgZGV2aWNlOiBEZXZpY2U7XG5sZXQgbWVzaDogTWVzaDtcbmxldCBtZXNoZXM6IE1lc2hbXSA9IFtdO1xubGV0IGNhbWVyYTogQ2FtZXJhO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBpbml0LCBmYWxzZSk7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcm9udEJ1ZmZlclwiKSBhcyBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICAvLyBtZXNoID0gbmV3IFNvZnRFbmdpbmUuTWVzaChcIkN1YmVcIiwgOCk7XG5cbiAgICAvLyBtZXNoZXMucHVzaChtZXNoKTtcblxuICAgIC8vIG1lc2gudmVydGljZXNbMF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzFdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzJdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbM10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzddID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgLTEpO1xuXG4gICAgLy8gbWVzaCA9IG5ldyBNZXNoKFwiQ3ViZVwiLCA4LCAxMik7XG4gICAgLy8gbWVzaGVzLnB1c2gobWVzaCk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1swXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1szXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s3XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAtMSk7XG5cbiAgICAvLyBtZXNoLmZhY2VzWzBdID0geyBBOiAwLCBCOiAxLCBDOiAyIH07XG4gICAgLy8gbWVzaC5mYWNlc1sxXSA9IHsgQTogMSwgQjogMiwgQzogMyB9O1xuICAgIC8vIG1lc2guZmFjZXNbMl0gPSB7IEE6IDEsIEI6IDMsIEM6IDYgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzNdID0geyBBOiAxLCBCOiA1LCBDOiA2IH07XG4gICAgLy8gbWVzaC5mYWNlc1s0XSA9IHsgQTogMCwgQjogMSwgQzogNCB9O1xuICAgIC8vIG1lc2guZmFjZXNbNV0gPSB7IEE6IDEsIEI6IDQsIEM6IDUgfTtcblxuICAgIC8vIG1lc2guZmFjZXNbNl0gPSB7IEE6IDIsIEI6IDMsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzddID0geyBBOiAzLCBCOiA2LCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1s4XSA9IHsgQTogMCwgQjogMiwgQzogNyB9O1xuICAgIC8vIG1lc2guZmFjZXNbOV0gPSB7IEE6IDAsIEI6IDQsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzEwXSA9IHsgQTogNCwgQjogNSwgQzogNiB9O1xuICAgIC8vIG1lc2guZmFjZXNbMTFdID0geyBBOiA0LCBCOiA2LCBDOiA3IH07XG5cbiAgICBjYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gICAgZGV2aWNlID0gbmV3IERldmljZShjYW52YXMpO1xuXG4gICAgY2FtZXJhLnBvc2l0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMygwLCAwLCAxMCk7XG4gICAgY2FtZXJhLnRhcmdldCA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMCwgMCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcFxuICAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG5cbiAgICBsb2FkSlNPTkZpbGVBc3luYyhcIi4vZGlzdC9yZXMvdGVzdF9tb25rZXkuYmFieWxvblwiLCBsb2FkSlNPTkNvbXBsZXRlZCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRKU09OQ29tcGxldGVkKG1lc2hlc0xvYWRlZDogTWVzaFtdKSB7XG4gICAgbWVzaGVzID0gbWVzaGVzTG9hZGVkO1xuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdpbmdMb29wKTtcbn1cblxuZnVuY3Rpb24gZHJhd2luZ0xvb3AoKSB7XG4gICAgZGV2aWNlLmNsZWFyKCk7XG5cbiAgICAvLyByb3RhdGluZyBzbGlnaHRseSB0aGUgY3ViZSBkdXJpbmcgZWFjaCBmcmFtZSByZW5kZXJlZFxuICAgIG1lc2hlcy5mb3JFYWNoKChtZXNoKSA9PiB7XG4gICAgICAgIG1lc2gucm90YXRpb24ueCArPSAwLjAxO1xuICAgICAgICBtZXNoLnJvdGF0aW9uLnkgKz0gMC4wMTtcbiAgICB9KTtcblxuICAgIC8vIERvaW5nIHRoZSB2YXJpb3VzIG1hdHJpeCBvcGVyYXRpb25zXG4gICAgZGV2aWNlLnJlbmRlcihjYW1lcmEsIG1lc2hlcyk7XG4gICAgLy8gRmx1c2hpbmcgdGhlIGJhY2sgYnVmZmVyIGludG8gdGhlIGZyb250IGJ1ZmZlclxuICAgIGRldmljZS5wcmVzZW50KCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcCByZWN1cnNpdmVseVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG59XG4iLCJleHBvcnQgaW50ZXJmYWNlIEZhY2Uge1xuICAgIEE6IG51bWJlcjtcbiAgICBCOiBudW1iZXI7XG4gICAgQzogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTWVzaCB7XG4gICAgcHVibGljIHBvc3Rpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgcm90YXRpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgdmVydGljZXM6IEJBQllMT04uVmVjdG9yM1tdO1xuICAgIHB1YmxpYyBmYWNlczogRmFjZVtdO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgdmVydGljZXNDb3VudDogbnVtYmVyLCBmYWNlc0NvdW50OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy52ZXJ0aWNlcyA9IG5ldyBBcnJheSh2ZXJ0aWNlc0NvdW50KTtcbiAgICAgICAgdGhpcy5mYWNlcyA9IG5ldyBBcnJheShmYWNlc0NvdW50KTtcbiAgICAgICAgdGhpcy5yb3RhdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgIHRoaXMucG9zdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgfVxufVxuIl19
