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


  Device.prototype.drawBline = function (point0, point1, color) {
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
      this.drawPoint(new BABYLON.Vector2(x0, y0), color);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FtZXJhLnRzIiwic3JjL2RldmljZS50cyIsInNyYy9sb2FkZXIudHMiLCJzcmMvbWFpbi50cyIsInNyYy9tZXNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FDQUEsSUFBQSxNQUFBO0FBQUE7QUFBQSxZQUFBO0FBSUksV0FBQSxNQUFBLEdBQUE7QUFDSSxTQUFLLFFBQUwsR0FBZ0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFBaEI7QUFDQSxTQUFLLE1BQUwsR0FBYyxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFkO0FBQ0g7O0FBQ0wsU0FBQSxNQUFBO0FBQUMsQ0FSRCxFQUFBOztBQUFhLE9BQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQTs7Ozs7Ozs7O0FDR2IsSUFBQSxNQUFBO0FBQUE7QUFBQSxZQUFBO0FBU0ksV0FBQSxNQUFBLENBQVksTUFBWixFQUFxQztBQUNqQyxTQUFLLGFBQUwsR0FBcUIsTUFBckI7QUFDQSxTQUFLLFlBQUwsR0FBb0IsTUFBTSxDQUFDLEtBQTNCO0FBQ0EsU0FBSyxhQUFMLEdBQXFCLE1BQU0sQ0FBQyxNQUE1QjtBQUVBLFNBQUssY0FBTCxHQUFzQixLQUFLLGFBQUwsQ0FBbUIsVUFBbkIsQ0FBOEIsSUFBOUIsQ0FBdEI7QUFDSDs7QUFFTSxFQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsS0FBQSxHQUFQLFlBQUE7QUFDSSxTQUFLLGNBQUwsQ0FBb0IsU0FBcEIsQ0FBOEIsQ0FBOUIsRUFBaUMsQ0FBakMsRUFBb0MsS0FBSyxZQUF6QyxFQUF1RCxLQUFLLGFBQTVEO0FBQ0EsU0FBSyxVQUFMLEdBQWtCLEtBQUssY0FBTCxDQUFvQixZQUFwQixDQUFpQyxDQUFqQyxFQUFvQyxDQUFwQyxFQUF1QyxLQUFLLFlBQTVDLEVBQTBELEtBQUssYUFBL0QsQ0FBbEI7QUFDSCxHQUhNOztBQUtBLEVBQUEsTUFBQSxD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RUFBQSxNQUFNLENBQUMsS0FBUCxHQURnQixDQUdoQjs7QUFDQSxFQUFBLE1BQU0sQ0FBQyxPQUFQLENBQWUsVUFBQyxJQUFELEVBQUs7QUFDaEIsSUFBQSxJQUFJLENBQUMsUUFBTCxDQUFjLENBQWQsSUFBbUIsSUFBbkI7QUFDQSxJQUFBLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBZCxJQUFtQixJQUFuQjtBQUNILEdBSEQsRUFKZ0IsQ0FTaEI7O0FBQ0EsRUFBQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQWQsRUFBc0IsTUFBdEIsRUFWZ0IsQ0FXaEI7O0FBQ0EsRUFBQSxNQUFNLENBQUMsT0FBUCxHQVpnQixDQWNoQjs7QUFDQSxFQUFBLHFCQUFxQixDQUFDLFdBQUQsQ0FBckI7QUFDSDs7Ozs7Ozs7O0FDbkZELElBQUEsSUFBQTtBQUFBO0FBQUEsWUFBQTtBQU1JLFdBQUEsSUFBQSxDQUFtQixJQUFuQixFQUFpQyxhQUFqQyxFQUF3RCxVQUF4RCxFQUEwRTtBQUF2RCxTQUFBLElBQUEsR0FBQSxJQUFBO0FBQ2YsU0FBSyxRQUFMLEdBQWdCLElBQUksS0FBSixDQUFVLGFBQVYsQ0FBaEI7QUFDQSxTQUFLLEtBQUwsR0FBYSxJQUFJLEtBQUosQ0FBVSxVQUFWLENBQWI7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsSUFBaEIsRUFBaEI7QUFDQSxTQUFLLE9BQUwsR0FBZSxPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFmO0FBQ0g7O0FBQ0wsU0FBQSxJQUFBO0FBQUMsQ0FaRCxFQUFBOztBQUFhLE9BQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImV4cG9ydCBjbGFzcyBDYW1lcmEge1xuICAgIHB1YmxpYyBwb3NpdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyB0YXJnZXQ6IEJBQllMT04uVmVjdG9yMztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBCQUJZTE9OLlZlY3RvcjMuWmVybygpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENhbWVyYSB9IGZyb20gXCIuL2NhbWVyYVwiO1xuaW1wb3J0IHsgTWVzaCB9IGZyb20gXCIuL21lc2hcIjtcblxuZXhwb3J0IGNsYXNzIERldmljZSB7XG4gICAgcHJpdmF0ZSBiYWNrYnVmZmVyPzogSW1hZ2VEYXRhO1xuICAgIHByaXZhdGUgd29ya2luZ0NhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgcHJpdmF0ZSB3b3JraW5nQ29udGV4dDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICAgIHByaXZhdGUgd29ya2luZ1dpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSB3b3JraW5nSGVpZ2h0OiBudW1iZXI7XG5cbiAgICBwcml2YXRlIGJhY2tidWZmZXJkYXRhPzogVWludDhDbGFtcGVkQXJyYXk7XG5cbiAgICBjb25zdHJ1Y3RvcihjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KSB7XG4gICAgICAgIHRoaXMud29ya2luZ0NhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgdGhpcy53b3JraW5nV2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgICAgIHRoaXMud29ya2luZ0hlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cbiAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dCA9IHRoaXMud29ya2luZ0NhbnZhcy5nZXRDb250ZXh0KFwiMmRcIikhO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbGVhcigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy53b3JraW5nV2lkdGgsIHRoaXMud29ya2luZ0hlaWdodCk7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlciA9IHRoaXMud29ya2luZ0NvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMud29ya2luZ1dpZHRoLCB0aGlzLndvcmtpbmdIZWlnaHQpO1xuICAgIH1cblxuICAgIHB1YmxpYyBwcmVzZW50KCkge1xuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0LnB1dEltYWdlRGF0YSh0aGlzLmJhY2tidWZmZXIhLCAwLCAwKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHV0UGl4ZWwoeDogbnVtYmVyLCB5OiBudW1iZXIsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCkge1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhID0gdGhpcy5iYWNrYnVmZmVyIS5kYXRhO1xuXG4gICAgICAgIGNvbnN0IGluZGV4OiBudW1iZXIgPSAoKHggPj4gMCkgKyAoeSA+PiAwKSAqIHRoaXMud29ya2luZ1dpZHRoKSAqIDQ7XG5cbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleF0gPSBjb2xvci5yICogMjU1O1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4ICsgMV0gPSBjb2xvci5nICogMjU1O1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4ICsgMl0gPSBjb2xvci5iICogMjU1O1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4ICsgM10gPSBjb2xvci5hICogMjU1O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb2plY3QgdGFrZXMgc29tZSAzRCBjb29yZGluYXRlcyBhbmQgdHJhbnNmb3JtIHRoZW1cbiAgICAgKiBpbiAyRCBjb29yZGluYXRlcyB1c2luZyB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gICAgICovXG4gICAgcHVibGljIHByb2plY3QoY29vcmQ6IEJBQllMT04uVmVjdG9yMywgdHJhbnNNYXQ6IEJBQllMT04uTWF0cml4KTogQkFCWUxPTi5WZWN0b3IzIHtcbiAgICAgICAgLy8gdHJhbnNmb3JtaW5nIHRoZSBjb29yZGluYXRlc1xuICAgICAgICBjb25zdCBwb2ludCA9IEJBQllMT04uVmVjdG9yMy5UcmFuc2Zvcm1Db29yZGluYXRlcyhjb29yZCwgdHJhbnNNYXQpO1xuXG4gICAgICAgIC8vIFRoZSB0cmFuc2Zvcm1lZCBjb29yZGluYXRlcyB3aWxsIGJlIGJhc2VkIG9uIGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgICAgIC8vIHN0YXJ0aW5nIG9uIHRoZSBjZW50ZXIgb2YgdGhlIHNjcmVlbi4gQnV0IGRyYXdpbmcgb24gc2NyZWVuIG5vcm1hbGx5IHN0YXJ0c1xuICAgICAgICAvLyBmcm9tIHRvcCBsZWZ0LiBXZSB0aGVuIG5lZWQgdG8gdHJhbnNmb3JtIHRoZW0gYWdhaW4gdG8gaGF2ZSB4OjAsIHk6MCBvbiB0b3AgbGVmdFxuICAgICAgICBjb25zdCB4ID0gKHBvaW50LnggKiB0aGlzLndvcmtpbmdXaWR0aCArIHRoaXMud29ya2luZ1dpZHRoIC8gMi4wKSA+PiAwO1xuICAgICAgICBjb25zdCB5ID0gKC1wb2ludC55ICogdGhpcy53b3JraW5nSGVpZ2h0ICsgdGhpcy53b3JraW5nSGVpZ2h0IC8gMi4wKSA+PiAwO1xuXG4gICAgICAgIHJldHVybiBuZXcgQkFCWUxPTi5WZWN0b3IzKHgsIHksIHBvaW50LnopO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGBkcmF3UG9pbnRgIGNhbGxzIHB1dFBpeGVsIGJ1dCBkb2VzIHRoZSBjbGlwcGluZyBvcGVyYXRpb24gYmVmb3JlXG4gICAgICogQHBhcmFtIHBvaW50XG4gICAgICovXG4gICAgcHVibGljIGRyYXdQb2ludChwb2ludDogQkFCWUxPTi5WZWN0b3IyLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpIHtcbiAgICAgICAgLy8gQ2xpcHBpbmcgd2hhdCdzIHZpc2libGUgb24gc2NyZWVuXG4gICAgICAgIGlmIChwb2ludC54ID49IDAgJiYgcG9pbnQueSA+PSAwICYmIHBvaW50LnggPCB0aGlzLndvcmtpbmdXaWR0aCAmJiBwb2ludC55IDwgdGhpcy53b3JraW5nSGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBEcmF3aW5nIGEgeWVsbG93IHBvaW50XG4gICAgICAgICAgICB0aGlzLnB1dFBpeGVsKHBvaW50LngsIHBvaW50LnksIGNvbG9yKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsYW1waW5nIHZhbHVlcyB0byBrZWVwIHRoZW0gYmV0d2VlbiBtaW4gYW5kIG1heFxuICAgICAqIEBwYXJhbSB2YWx1ZSDlvoXkv67mraPlgLxcbiAgICAgKiBAcGFyYW0gbWluez0wfSDmnIDlsI/lgLxcbiAgICAgKiBAcGFyYW0gbWF4ez0xfSDmnIDlpKflgLxcbiAgICAgKi9cbiAgICBwdWJsaWMgY2xhbXAodmFsdWU6IG51bWJlciwgbWluOiBudW1iZXIgPSAwLCBtYXg6IG51bWJlciA9IDEpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbih2YWx1ZSwgbWF4KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJwb2xhdGluZyB0aGUgdmFsdWUgYmV0d2VlbiAyIHZlcnRpY2VzXG4gICAgICogbWluIGlzIHRoZSBzdGFydGluZyBwb2ludCwgbWF4IHRoZSBlbmRpbmcgcG9pbnRcbiAgICAgKiBhbmQgZ3JhZGllbnQgdGhlICUgYmV0d2VlbiB0aGUgMiBwb2ludHNcbiAgICAgKiDmoLnmja4gZ3JhZGllbnTns7vmlbAg6I635Y+WIOS7jiBgbWluYCDliLAgYG1heGAg55qE5Lit6Ze05YC8XG4gICAgICogQHBhcmFtIG1pblxuICAgICAqIEBwYXJhbSBtYXhcbiAgICAgKiBAcGFyYW0gZ3JhZGllbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgaW50ZXJwb2xhdGUobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBncmFkaWVudDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIG1pbiArIChtYXggLSBtaW4pICogdGhpcy5jbGFtcChncmFkaWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZHJhd2luZyBsaW5lIGJldHdlZW4gMiBwb2ludHMgZnJvbSBsZWZ0IHRvIHJpZ2h0XG4gICAgICogcGEgcGIgLT4gcGMgcGRcbiAgICAgKiBwYSxwYixwYyxwZCBtdXN0IHRoZW4gYmUgc29ydGVkIGJlZm9yZVxuICAgICAqIEBwYXJhbSB5XG4gICAgICogQHBhcmFtIHBhXG4gICAgICogQHBhcmFtIHBiXG4gICAgICogQHBhcmFtIHBjXG4gICAgICogQHBhcmFtIHBkXG4gICAgICogQHBhcmFtIGNvbG9yXG4gICAgICovXG4gICAgcHVibGljIHByb2Nlc3NTY2FuTGluZShcbiAgICAgICAgeTogbnVtYmVyLFxuICAgICAgICBwYTogQkFCWUxPTi5WZWN0b3IzLFxuICAgICAgICBwYjogQkFCWUxPTi5WZWN0b3IzLFxuICAgICAgICBwYzogQkFCWUxPTi5WZWN0b3IzLFxuICAgICAgICBwZDogQkFCWUxPTi5WZWN0b3IzLFxuICAgICAgICBjb2xvcjogQkFCWUxPTi5Db2xvcjQsXG4gICAgKTogdm9pZCB7XG4gICAgICAgIC8vIHRoYW5rcyB0byBjdXJyZW50IFksIHdlIGNhbiBjb21wdXRlIHRoZSBncmFkaWVudCB0byBjb21wdXRlIG90aGVycyB2YWx1ZXMgbGlrZVxuICAgICAgICAvLyB0aGUgc3RhcnRpbmcgWChzeCkgYW5kIGVuZGluZyBYIChlcykgdG8gZHJhdyBiZXR3ZWVuXG4gICAgICAgIC8vIGlmIHBhLlkgPT0gcGIuWSBvciBwYy5ZID09IHBkLlksIGdyYWRpZW50IGlzIGZvcmNlZCB0byAxXG4gICAgICAgIGNvbnN0IGdyYWRpZW50MSA9IHBhLnkgIT0gcGIueSA/ICh5IC0gcGEueSkgLyAocGIueSAtIHBhLnkpIDogMTtcbiAgICAgICAgY29uc3QgZ3JhZGllbnQyID0gcGEueSAhPSBwYi55ID8gKHkgLSBwYy55KSAvIChwZC55IC0gcGMueSkgOiAxO1xuICAgICAgICBjb25zdCBzeCA9IHRoaXMuaW50ZXJwb2xhdGUocGEueCwgcGIueCwgZ3JhZGllbnQxKSA+PiAwO1xuICAgICAgICBjb25zdCBleCA9IHRoaXMuaW50ZXJwb2xhdGUocGMueCwgcGQueCwgZ3JhZGllbnQyKSA+PiAwO1xuXG4gICAgICAgIC8vIGRyYXdpbmcgYSBsaW5lIGZyb20gbGVmdCAoc3gpIHRvIHJpZ2h0IChleClcbiAgICAgICAgZm9yIChsZXQgeCA9IHN4OyB4IDwgZXg7IHgrKykge1xuICAgICAgICAgICAgdGhpcy5kcmF3UG9pbnQobmV3IEJBQllMT04uVmVjdG9yMih4LCB5KSwgY29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGRyYXdUcmlhbmdsZShwMTogQkFCWUxPTi5WZWN0b3IzLCBwMjogQkFCWUxPTi5WZWN0b3IzLCBwMzogQkFCWUxPTi5WZWN0b3IzLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpOiB2b2lkIHtcbiAgICAgICAgLy8gU29ydGluZyB0aGUgcG9pbnRzIGluIG9yZGVyIHRvIGFsd2F5cyBoYXZlIHRoaXMgb3JkZXIgb24gc2NyZWVuIHAxLCBwMiAmIHAzXG4gICAgICAgIC8vIHdpdGggcDEgYWx3YXlzIHVwICh0aHVzIGhhdmluZyB0aGUgWSB0aGUgbG93ZXN0IHBvc3NpYmxlIHRvIGJlIG5lYXIgdGhlIHRvcCBzY3JlZW4pXG4gICAgICAgIC8vIHRoZW4gcDIgYmV0d2VlbiBwMSAmIHAzIChhY2NvcmRpbmcgdG8gWS1heGlzIHVwIHRvIGRvd24gKVxuICAgICAgICBpZiAocDEueSA+IHAyLnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXAgPSBwMjtcbiAgICAgICAgICAgIHAyID0gcDE7XG4gICAgICAgICAgICBwMSA9IHRlbXA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocDIueSA+IHAzLnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXAgPSBwMjtcbiAgICAgICAgICAgIHAyID0gcDM7XG4gICAgICAgICAgICBwMyA9IHRlbXA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocDEueSA+IHAyLnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXAgPSBwMjtcbiAgICAgICAgICAgIHAyID0gcDE7XG4gICAgICAgICAgICBwMSA9IHRlbXA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc29ydCBlbmRcblxuICAgICAgICAvLyBpbnZlcnNlIHNsb3Blc1xuICAgICAgICBsZXQgZFAxUDI6IG51bWJlcjtcbiAgICAgICAgbGV0IGRQMVAzOiBudW1iZXI7XG5cbiAgICAgICAgLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TbG9wZVxuICAgICAgICAvLyBDb21wdXRpbmcgc2xvcGVzXG4gICAgICAgIGlmIChwMi55IC0gcDEueSA+IDApIHtcbiAgICAgICAgICAgIGRQMVAyID0gKHAyLnggLSBwMS54KSAvIChwMi55IC0gcDEueSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkUDFQMiA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocDMueSAtIHAxLnkgPiAwKSB7XG4gICAgICAgICAgICBkUDFQMyA9IChwMy54IC0gcDEueCkgLyAocDMueSAtIHAxLnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZFAxUDMgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmlyc3QgY2FzZSB3aGVyZSB0cmlhbmdsZXMgYXJlIGxpa2UgdGhhdDpcbiAgICAgICAgLy8gICAgICAgICBwMVxuICAgICAgICAvLyAgICAgICAgICAgzptcbiAgICAgICAgLy8gICAgICAgICAg4pWxIOKVslxuICAgICAgICAvLyAgICAgICAgIOKVsSAgIOKVslxuICAgICAgICAvLyAgICAgICAg4pWxICAgICDilbJcbiAgICAgICAgLy8gICAgICAg4pWxICAgICAgIOKVslxuICAgICAgICAvLyAgICAgIOKVsSAgICAgICAgIOKVslxuICAgICAgICAvLyAgICAg4pWxICAgICAgICAgICDilbJcbiAgICAgICAgLy8gICAg4pWxICAgICAgICAgICAgICAg4paPcDJcbiAgICAgICAgLy8gIOKVsVxuICAgICAgICAvLyBwMyDilpXilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICAgICAgLy8gcDIgb24gcmlnaHRcbiAgICAgICAgaWYgKGRQMVAyID4gZFAxUDMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSBwMS55ID4+IDA7IHkgPD0gcDMueSA+PiAwOyB5KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoeSA8IHAyLnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2NhbiBwMXAzIHAxcDJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzU2NhbkxpbmUoeSwgcDEsIHAzLCBwMSwgcDIsIGNvbG9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDMgcDJwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZSh5LCBwMSwgcDMsIHAyLCBwMywgY29sb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHAyIG9uIGxlZnRcbiAgICAgICAgICAgIGZvciAobGV0IHkgPSBwMS55ID4+IDA7IHkgPD0gcDMueSA+PiAwOyB5KyspIHtcbiAgICAgICAgICAgICAgICBpZiAoeSA8IHAyLnkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2NhbiBwMXAyIHAxcDNcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzU2NhbkxpbmUoeSwgcDEsIHAyLCBwMSwgcDMsIGNvbG9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAycDMgcDFwM1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZSh5LCBwMiwgcDMsIHAxLCBwMywgY29sb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiDnu5jliLbnur/mnaEg5piv5LiA5LiqIOmAkuW9kue7mOWItui1t+Wni+eCuSAtIOS4remXtOeCuSAtIOe7k+adn+eCue+8iOaAu+WFsSAzIHBpeGVs77yJ55qE6L+H56iLICovXG4gICAgcHVibGljIGRyYXdMaW5lKHBvaW50MDogQkFCWUxPTi5WZWN0b3IyLCBwb2ludDE6IEJBQllMT04uVmVjdG9yMik6IHZvaWQge1xuICAgICAgICBjb25zdCBkaXN0ID0gcG9pbnQxLnN1YnRyYWN0KHBvaW50MCkubGVuZ3RoKCk7XG5cbiAgICAgICAgaWYgKGRpc3QgPCAyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtaWRkbGVQb2ludCA9IHBvaW50MC5hZGQocG9pbnQxLnN1YnRyYWN0KHBvaW50MCkuc2NhbGUoMC41KSk7XG5cbiAgICAgICAgdGhpcy5kcmF3UG9pbnQobWlkZGxlUG9pbnQsIG5ldyBCQUJZTE9OLkNvbG9yNCgxLCAxLCAwLCAxKSk7XG5cbiAgICAgICAgdGhpcy5kcmF3TGluZShwb2ludDAsIG1pZGRsZVBvaW50KTtcbiAgICAgICAgdGhpcy5kcmF3TGluZShtaWRkbGVQb2ludCwgcG9pbnQxKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBbQnJlc2VuaGFtJ3NfbGluZV9hbGdvcml0aG1dKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0JyZXNlbmhhbSdzX2xpbmVfYWxnb3JpdGhtKVxuICAgICAqIOabtOW5s+a7keeahOe7mOWItue6v+adoeeahOeul+azlVxuICAgICAqL1xuICAgIHB1YmxpYyBkcmF3QmxpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpOiB2b2lkIHtcbiAgICAgICAgbGV0IHgwID0gcG9pbnQwLnggPj4gMDtcbiAgICAgICAgbGV0IHkwID0gcG9pbnQwLnkgPj4gMDtcbiAgICAgICAgY29uc3QgeDEgPSBwb2ludDEueCA+PiAwO1xuICAgICAgICBjb25zdCB5MSA9IHBvaW50MS55ID4+IDA7XG4gICAgICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMoeDEgLSB4MCk7XG4gICAgICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMoeTEgLSB5MCk7XG5cbiAgICAgICAgY29uc3Qgc3ggPSB4MCA8IHgxID8gMSA6IC0xO1xuICAgICAgICBjb25zdCBzeSA9IHkwIDwgeTEgPyAxIDogLTE7XG5cbiAgICAgICAgbGV0IGVyciA9IGR4IC0gZHk7XG5cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd1BvaW50KG5ldyBCQUJZTE9OLlZlY3RvcjIoeDAsIHkwKSwgY29sb3IpO1xuICAgICAgICAgICAgaWYgKHgwID09IHgxICYmIHkwID09IHkxKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBlMiA9IDIgKiBlcnI7XG4gICAgICAgICAgICBpZiAoZTIgPiAtZHkpIHtcbiAgICAgICAgICAgICAgICBlcnIgLT0gZHk7XG4gICAgICAgICAgICAgICAgeDAgKz0gc3g7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZTIgPCBkeCkge1xuICAgICAgICAgICAgICAgIGVyciArPSBkeDtcbiAgICAgICAgICAgICAgICB5MCArPSBzeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoY2FtZXJhOiBDYW1lcmEsIG1lc2hlczogTWVzaFtdKSB7XG4gICAgICAgIGNvbnN0IHZpZXdNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Mb29rQXRMSChjYW1lcmEucG9zaXRpb24sIGNhbWVyYS50YXJnZXQsIEJBQllMT04uVmVjdG9yMy5VcCgpKTtcblxuICAgICAgICBjb25zdCBwcm9qZWN0TWF0cml4ID0gQkFCWUxPTi5NYXRyaXguUGVyc3BlY3RpdmVGb3ZMSCgwLjc4LCB0aGlzLndvcmtpbmdXaWR0aCAvIHRoaXMud29ya2luZ0hlaWdodCwgMC4wMSwgMS4wKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNNZXNoIG9mIG1lc2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Sb3RhdGlvbllhd1BpdGNoUm9sbChcbiAgICAgICAgICAgICAgICBjTWVzaC5yb3RhdGlvbi55LFxuICAgICAgICAgICAgICAgIGNNZXNoLnJvdGF0aW9uLngsXG4gICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueixcbiAgICAgICAgICAgICkubXVsdGlwbHkoQkFCWUxPTi5NYXRyaXguVHJhbnNsYXRpb24oY01lc2gucG9zdGlvbi54LCBjTWVzaC5wb3N0aW9uLnksIGNNZXNoLnBvc3Rpb24ueikpO1xuXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1NYXRyaXggPSB3b3JsZE1hdHJpeC5tdWx0aXBseSh2aWV3TWF0cml4KS5tdWx0aXBseShwcm9qZWN0TWF0cml4KTtcblxuICAgICAgICAgICAgLyoqIGRyYXcgcG9pbnRzICovXG4gICAgICAgICAgICAvLyBmb3IgKGNvbnN0IGluZGV4VmVydGV4IG9mIGNNZXNoLnZlcnRpY2VzKSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcHJvamVjdFBvaW50ID0gdGhpcy5wcm9qZWN0KGluZGV4VmVydGV4LCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd1BvaW50KHByb2plY3RQb2ludCk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8qKiBkcmF3IGxpbmVzICovXG4gICAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLnZlcnRpY2VzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHBvaW50MCA9IHRoaXMucHJvamVjdChjTWVzaC52ZXJ0aWNlc1tpXSwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwb2ludDEgPSB0aGlzLnByb2plY3QoY01lc2gudmVydGljZXNbaSArIDFdLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpbmUocG9pbnQwLCBwb2ludDEpO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvKiogZHJhdyBmYWNlcyAqL1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBwcmVmZXItZm9yLW9mXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEZhY2UgPSBjTWVzaC5mYWNlc1tpXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEEgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5BXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhCID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQl07XG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QyA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkNdO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxBID0gdGhpcy5wcm9qZWN0KHZlcnRleEEsIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxCID0gdGhpcy5wcm9qZWN0KHZlcnRleEIsIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxDID0gdGhpcy5wcm9qZWN0KHZlcnRleEMsIHRyYW5zZm9ybU1hdHJpeCk7XG5cbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQSwgcGl4ZWxCKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQiwgcGl4ZWxDKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQywgcGl4ZWxBKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdCbGluZShwaXhlbEEsIHBpeGVsQik7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3QmxpbmUocGl4ZWxCLCBwaXhlbEMpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0JsaW5lKHBpeGVsQywgcGl4ZWxBKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbG9yOiBudW1iZXIgPSAwLjI1ICsgKChpICUgY01lc2guZmFjZXMubGVuZ3RoKSAvIGNNZXNoLmZhY2VzLmxlbmd0aCkgKiAwLjc1O1xuXG4gICAgICAgICAgICAgICAgLyoqIGRyYXcgdHJpYW5nbGUgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdUcmlhbmdsZShwaXhlbEEsIHBpeGVsQiwgcGl4ZWxDLCBuZXcgQkFCWUxPTi5Db2xvcjQoY29sb3IsIGNvbG9yLCBjb2xvciwgMSkpO1xuXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRyYXcgJHt2ZXJ0ZXhBLnRvU3RyaW5nKCl9ICR7dmVydGV4Qi50b1N0cmluZygpfSAke3ZlcnRleEMudG9TdHJpbmcoKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IE1lc2ggfSBmcm9tIFwiLi9tZXNoXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSlNPTkZpbGVBc3luYyhmaWxlTmFtZTogc3RyaW5nLCBjYWxsYmFjazogKHJlc3VsdDogTWVzaFtdKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgbGV0IGpzb25PYmplY3QgPSB7fTtcbiAgICBjb25zdCB4bWxIdHRwID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgeG1sSHR0cC5vcGVuKFwiR0VUXCIsIGZpbGVOYW1lLCB0cnVlKTtcblxuICAgIHhtbEh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAoeG1sSHR0cC5yZWFkeVN0YXRlID09IDQgJiYgeG1sSHR0cC5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgICAgICBqc29uT2JqZWN0ID0gSlNPTi5wYXJzZSh4bWxIdHRwLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAvLyBjYWxsYmFjayh0aGlzLmNyZWF0ZU1lc2hlc0Zyb21KU09OKGpzb25PYmplY3QpKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGNyZWF0ZU1lc2hlc0Zyb21KU09OKGpzb25PYmplY3QpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB4bWxIdHRwLnNlbmQobnVsbCk7XG59XG5cbi8qKiBodHRwczovL2RvYy5iYWJ5bG9uanMuY29tL3Jlc291cmNlcy9maWxlX2Zvcm1hdF9tYXBfKC5iYWJ5bG9uKVxuICogIGpzb24g5qC85byPXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNZXNoZXNGcm9tSlNPTihqc29uT2JqZWN0OiBhbnkpOiBNZXNoW10ge1xuICAgIHJldHVybiBqc29uT2JqZWN0Lm1lc2hlcy5tYXAoKG1lc2hPYmplY3QpID0+IHtcbiAgICAgICAgY29uc3QgdmVydGljZXNBcnJheTogbnVtYmVyW10gPSBtZXNoT2JqZWN0LnBvc2l0aW9ucztcbiAgICAgICAgLy8gRmFjZXNcbiAgICAgICAgY29uc3QgaW5kaWNlc0FycmF5OiBudW1iZXJbXSA9IG1lc2hPYmplY3QuaW5kaWNlcztcblxuICAgICAgICBjb25zdCB2ZXJ0aWNlc0NvdW50ID0gbWVzaE9iamVjdC5zdWJNZXNoZXNbMF0udmVydGljZXNDb3VudDtcblxuICAgICAgICAvLyBudW1iZXIgb2YgZmFjZXMgaXMgbG9naWNhbGx5IHRoZSBzaXplIG9mIHRoZSBhcnJheSBkaXZpZGVkIGJ5IDMgKEEsIEIsIEMpXG4gICAgICAgIGNvbnN0IGZhY2VzQ291bnQgPSBpbmRpY2VzQXJyYXkubGVuZ3RoIC8gMztcbiAgICAgICAgY29uc3QgbWVzaCA9IG5ldyBNZXNoKG1lc2hPYmplY3QubmFtZSwgdmVydGljZXNDb3VudCwgZmFjZXNDb3VudCk7XG5cbiAgICAgICAgLy8gRmlsbGluZyB0aGUgdmVydGljZXMgYXJyYXkgb2Ygb3VyIG1lc2ggZmlyc3TvvIzmoLnmja5wb3NpdGlvbiDmr4/mrKHlj5bkuInkuKrmlL7liLDpobbngrnmlbDmja5cbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHZlcnRpY2VzQ291bnQ7ICsraW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IHggPSB2ZXJ0aWNlc0FycmF5W2luZGV4ICogM107XG4gICAgICAgICAgICBjb25zdCB5ID0gdmVydGljZXNBcnJheVtpbmRleCAqIDMgKyAxXTtcbiAgICAgICAgICAgIGNvbnN0IHogPSB2ZXJ0aWNlc0FycmF5W2luZGV4ICogMyArIDJdO1xuICAgICAgICAgICAgbWVzaC52ZXJ0aWNlc1tpbmRleF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKHgsIHksIHopO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlbiBmaWxsaW5nIHRoZSBmYWNlcyBhcnJheSDmoLnmja7pnaLnmoTngrnntKLlvJXmlbDmja7vvIzmr4/mrKHlj5bkuInkuKog5pS+5YiwbWVzaOeahOmdouaVsOaNruS4reWOu1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmFjZXNDb3VudDsgKytpbmRleCkge1xuICAgICAgICAgICAgY29uc3QgYSA9IGluZGljZXNBcnJheVtpbmRleCAqIDNdO1xuICAgICAgICAgICAgY29uc3QgYiA9IGluZGljZXNBcnJheVtpbmRleCAqIDMgKyAxXTtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBpbmRpY2VzQXJyYXlbaW5kZXggKiAzICsgMl07XG5cbiAgICAgICAgICAgIG1lc2guZmFjZXNbaW5kZXhdID0ge1xuICAgICAgICAgICAgICAgIEE6IGEsXG4gICAgICAgICAgICAgICAgQjogYixcbiAgICAgICAgICAgICAgICBDOiBjLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldHRpbmcgdGhlIHBvc2l0aW9uIHlvdSd2ZSBzZXQgaW4gQmxlbmRlclxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IG1lc2hPYmplY3QucG9zaXRpb247XG4gICAgICAgIG1lc2gucG9zdGlvbiA9IG5ldyBCQUJZTE9OLlZlY3RvcjMocG9zaXRpb25bMF0sIHBvc2l0aW9uWzFdLCBwb3NpdGlvblsyXSk7XG5cbiAgICAgICAgcmV0dXJuIG1lc2g7XG4gICAgfSk7XG4gICAgcmV0dXJuIFtdO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImJhYnlsb24ubWF0aC50c1wiLz5cblxuaW1wb3J0IHsgQ2FtZXJhIH0gZnJvbSBcIi4vY2FtZXJhXCI7XG5pbXBvcnQgeyBEZXZpY2UgfSBmcm9tIFwiLi9kZXZpY2VcIjtcbmltcG9ydCB7IGxvYWRKU09ORmlsZUFzeW5jIH0gZnJvbSBcIi4vbG9hZGVyXCI7XG5pbXBvcnQgeyBNZXNoIH0gZnJvbSBcIi4vbWVzaFwiO1xuXG5sZXQgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcbmxldCBkZXZpY2U6IERldmljZTtcbmxldCBtZXNoOiBNZXNoO1xubGV0IG1lc2hlczogTWVzaFtdID0gW107XG5sZXQgY2FtZXJhOiBDYW1lcmE7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGluaXQsIGZhbHNlKTtcblxuZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZyb250QnVmZmVyXCIpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xuICAgIC8vIG1lc2ggPSBuZXcgU29mdEVuZ2luZS5NZXNoKFwiQ3ViZVwiLCA4KTtcblxuICAgIC8vIG1lc2hlcy5wdXNoKG1lc2gpO1xuXG4gICAgLy8gbWVzaC52ZXJ0aWNlc1swXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1szXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s0XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzVdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s2XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbN10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAtMSk7XG5cbiAgICAvLyBtZXNoID0gbmV3IE1lc2goXCJDdWJlXCIsIDgsIDEyKTtcbiAgICAvLyBtZXNoZXMucHVzaChtZXNoKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzBdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1sxXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1syXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzNdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s0XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzVdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s2XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzddID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIC0xKTtcblxuICAgIC8vIG1lc2guZmFjZXNbMF0gPSB7IEE6IDAsIEI6IDEsIEM6IDIgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzFdID0geyBBOiAxLCBCOiAyLCBDOiAzIH07XG4gICAgLy8gbWVzaC5mYWNlc1syXSA9IHsgQTogMSwgQjogMywgQzogNiB9O1xuICAgIC8vIG1lc2guZmFjZXNbM10gPSB7IEE6IDEsIEI6IDUsIEM6IDYgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzRdID0geyBBOiAwLCBCOiAxLCBDOiA0IH07XG4gICAgLy8gbWVzaC5mYWNlc1s1XSA9IHsgQTogMSwgQjogNCwgQzogNSB9O1xuXG4gICAgLy8gbWVzaC5mYWNlc1s2XSA9IHsgQTogMiwgQjogMywgQzogNyB9O1xuICAgIC8vIG1lc2guZmFjZXNbN10gPSB7IEE6IDMsIEI6IDYsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzhdID0geyBBOiAwLCBCOiAyLCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1s5XSA9IHsgQTogMCwgQjogNCwgQzogNyB9O1xuICAgIC8vIG1lc2guZmFjZXNbMTBdID0geyBBOiA0LCBCOiA1LCBDOiA2IH07XG4gICAgLy8gbWVzaC5mYWNlc1sxMV0gPSB7IEE6IDQsIEI6IDYsIEM6IDcgfTtcblxuICAgIGNhbWVyYSA9IG5ldyBDYW1lcmEoKTtcbiAgICBkZXZpY2UgPSBuZXcgRGV2aWNlKGNhbnZhcyk7XG5cbiAgICBjYW1lcmEucG9zaXRpb24gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDAsIDAsIDEwKTtcbiAgICBjYW1lcmEudGFyZ2V0ID0gbmV3IEJBQllMT04uVmVjdG9yMygwLCAwLCAwKTtcblxuICAgIC8vIENhbGxpbmcgdGhlIEhUTUw1IHJlbmRlcmluZyBsb29wXG4gICAgLy8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdpbmdMb29wKTtcblxuICAgIGxvYWRKU09ORmlsZUFzeW5jKFwiLi9kaXN0L3Jlcy90ZXN0X21vbmtleS5iYWJ5bG9uXCIsIGxvYWRKU09OQ29tcGxldGVkKTtcbn1cblxuZnVuY3Rpb24gbG9hZEpTT05Db21wbGV0ZWQobWVzaGVzTG9hZGVkOiBNZXNoW10pIHtcbiAgICBtZXNoZXMgPSBtZXNoZXNMb2FkZWQ7XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd2luZ0xvb3ApO1xufVxuXG5mdW5jdGlvbiBkcmF3aW5nTG9vcCgpIHtcbiAgICBkZXZpY2UuY2xlYXIoKTtcblxuICAgIC8vIHJvdGF0aW5nIHNsaWdodGx5IHRoZSBjdWJlIGR1cmluZyBlYWNoIGZyYW1lIHJlbmRlcmVkXG4gICAgbWVzaGVzLmZvckVhY2goKG1lc2gpID0+IHtcbiAgICAgICAgbWVzaC5yb3RhdGlvbi54ICs9IDAuMDE7XG4gICAgICAgIG1lc2gucm90YXRpb24ueSArPSAwLjAxO1xuICAgIH0pO1xuXG4gICAgLy8gRG9pbmcgdGhlIHZhcmlvdXMgbWF0cml4IG9wZXJhdGlvbnNcbiAgICBkZXZpY2UucmVuZGVyKGNhbWVyYSwgbWVzaGVzKTtcbiAgICAvLyBGbHVzaGluZyB0aGUgYmFjayBidWZmZXIgaW50byB0aGUgZnJvbnQgYnVmZmVyXG4gICAgZGV2aWNlLnByZXNlbnQoKTtcblxuICAgIC8vIENhbGxpbmcgdGhlIEhUTUw1IHJlbmRlcmluZyBsb29wIHJlY3Vyc2l2ZWx5XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdpbmdMb29wKTtcbn1cbiIsImV4cG9ydCBpbnRlcmZhY2UgRmFjZSB7XG4gICAgQTogbnVtYmVyO1xuICAgIEI6IG51bWJlcjtcbiAgICBDOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBNZXNoIHtcbiAgICBwdWJsaWMgcG9zdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyByb3RhdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyB2ZXJ0aWNlczogQkFCWUxPTi5WZWN0b3IzW107XG4gICAgcHVibGljIGZhY2VzOiBGYWNlW107XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCB2ZXJ0aWNlc0NvdW50OiBudW1iZXIsIGZhY2VzQ291bnQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEFycmF5KHZlcnRpY2VzQ291bnQpO1xuICAgICAgICB0aGlzLmZhY2VzID0gbmV3IEFycmF5KGZhY2VzQ291bnQpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgdGhpcy5wb3N0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICB9XG59XG4iXX0=
