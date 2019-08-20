(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict"; /// <reference path="babylon.math.ts"/>

Object.defineProperty(exports, "__esModule", {
  value: true
});

var loader_1 = require("./loader");

var main_1 = require("./main");

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

  camera = new main_1.Camera();
  device = new main_1.Device(canvas);
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
  // requestAnimationFrame(drawingLoop);
}

},{"./loader":2,"./main":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var main_1 = require("./main");

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
    var mesh = new main_1.Mesh(meshObject.name, verticesCount, facesCount); // Filling the vertices array of our mesh first，根据position 每次取三个放到顶点数据

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

},{"./main":3}],3:[function(require,module,exports){
"use strict"; /// <reference path="babylon.math.ts"/>

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

  Device.prototype.project = function (coord, transMat) {
    var point = BABYLON.Vector3.TransformCoordinates(coord, transMat);
    var x = point.x * this.workingWidth + this.workingWidth / 2.0 >> 0;
    var y = -point.y * this.workingHeight + this.workingHeight / 2.0 >> 0;
    return new BABYLON.Vector2(x, y);
  };

  Device.prototype.drawPoint = function (point) {
    if (point.x >= 0 && point.y >= 0 && point.x < this.workingWidth && point.y < this.workingHeight) {
      this.putPixel(point.x, point.y, new BABYLON.Color4(1, 1, 0, 1));
    }
  };
  /** 绘制线条 是一个 递归绘制起始点 - 中间点 - 结束点（总共 3 pixel）的过程 */


  Device.prototype.drawLine = function (point0, point1) {
    var dist = point1.subtract(point0).length();

    if (dist < 2) {
      return;
    }

    var middlePoint = point0.add(point1.subtract(point0).scale(0.5));
    this.drawPoint(middlePoint);
    this.drawLine(point0, middlePoint);
    this.drawLine(middlePoint, point1);
  };

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
      this.drawPoint(new BABYLON.Vector2(x0, y0));

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

        this.drawBline(pixelA, pixelB);
        this.drawBline(pixelB, pixelC);
        this.drawBline(pixelC, pixelA); // console.log(`draw ${vertexA.toString()} ${vertexB.toString()} ${vertexC.toString()}`);
      }
    }
  };

  return Device;
}();

exports.Device = Device;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLnRzIiwic3JjL2xvYWRlci50cyIsInNyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO2NDQUE7Ozs7OztBQUVBLElBQUEsUUFBQSxHQUFBLE9BQUEsQ0FBQSxVQUFBLENBQUE7O0FBQ0EsSUFBQSxNQUFBLEdBQUEsT0FBQSxDQUFBLFFBQUEsQ0FBQTs7QUFFQSxJQUFJLE1BQUo7QUFDQSxJQUFJLE1BQUo7QUFDQSxJQUFJLElBQUo7QUFDQSxJQUFJLE1BQU0sR0FBVyxFQUFyQjtBQUNBLElBQUksTUFBSjtBQUVBLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsSUFBOUMsRUFBb0QsS0FBcEQ7O0FBRUEsU0FBUyxJQUFULEdBQWE7QUFDVCxFQUFBLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBVCxDQUF3QixhQUF4QixDQUFULENBRFMsQ0FFVDtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLEVBQUEsTUFBTSxHQUFHLElBQUksTUFBQSxDQUFBLE1BQUosRUFBVDtBQUNBLEVBQUEsTUFBTSxHQUFHLElBQUksTUFBQSxDQUFBLE1BQUosQ0FBVyxNQUFYLENBQVQ7QUFFQSxFQUFBLE1BQU0sQ0FBQyxRQUFQLEdBQWtCLElBQUksT0FBTyxDQUFDLE9BQVosQ0FBb0IsQ0FBcEIsRUFBdUIsQ0FBdkIsRUFBMEIsRUFBMUIsQ0FBbEI7QUFDQSxFQUFBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLElBQUksT0FBTyxDQUFDLE9BQVosQ0FBb0IsQ0FBcEIsRUFBdUIsQ0FBdkIsRUFBMEIsQ0FBMUIsQ0FBaEIsQ0E1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Q0FBQyxHQUFHLENBQWIsRUFBZ0IsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFOLENBQVksTUFBaEMsRUFBd0MsQ0FBQyxFQUF6QyxFQUE2QztBQUN6QyxZQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsS0FBTixDQUFZLENBQVosQ0FBcEI7QUFFQSxZQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsUUFBTixDQUFlLFdBQVcsQ0FBQyxDQUEzQixDQUFoQjtBQUNBLFlBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxRQUFOLENBQWUsV0FBVyxDQUFDLENBQTNCLENBQWhCO0FBQ0EsWUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLFFBQU4sQ0FBZSxXQUFXLENBQUMsQ0FBM0IsQ0FBaEI7QUFFQSxZQUFNLE1BQU0sR0FBRyxLQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLGVBQXRCLENBQWY7QUFDQSxZQUFNLE1BQU0sR0FBRyxLQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLGVBQXRCLENBQWY7QUFDQSxZQUFNLE1BQU0sR0FBRyxLQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLGVBQXRCLENBQWYsQ0FUeUMsQ0FXekM7QUFDQTtBQUNBOztBQUNBLGFBQUssU0FBTCxDQUFlLE1BQWYsRUFBdUIsTUFBdkI7QUFDQSxhQUFLLFNBQUwsQ0FBZSxNQUFmLEVBQXVCLE1BQXZCO0FBQ0EsYUFBSyxTQUFMLENBQWUsTUFBZixFQUF1QixNQUF2QixFQWhCeUMsQ0FrQnpDO0FBQ0g7QUFDSjtBQUNKLEdBbERNOztBQW1EWCxTQUFBLE1BQUE7QUFBQyxDQXJKRCxFQUFBOztBQUFhLE9BQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJiYWJ5bG9uLm1hdGgudHNcIi8+XG5cbmltcG9ydCB7IGxvYWRKU09ORmlsZUFzeW5jIH0gZnJvbSBcIi4vbG9hZGVyXCI7XG5pbXBvcnQgeyBDYW1lcmEsIERldmljZSwgTWVzaCB9IGZyb20gXCIuL21haW5cIjtcblxubGV0IGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG5sZXQgZGV2aWNlOiBEZXZpY2U7XG5sZXQgbWVzaDogTWVzaDtcbmxldCBtZXNoZXM6IE1lc2hbXSA9IFtdO1xubGV0IGNhbWVyYTogQ2FtZXJhO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBpbml0LCBmYWxzZSk7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcm9udEJ1ZmZlclwiKSBhcyBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICAvLyBtZXNoID0gbmV3IFNvZnRFbmdpbmUuTWVzaChcIkN1YmVcIiwgOCk7XG5cbiAgICAvLyBtZXNoZXMucHVzaChtZXNoKTtcblxuICAgIC8vIG1lc2gudmVydGljZXNbMF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzFdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzJdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbM10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzddID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgLTEpO1xuXG4gICAgLy8gbWVzaCA9IG5ldyBNZXNoKFwiQ3ViZVwiLCA4LCAxMik7XG4gICAgLy8gbWVzaGVzLnB1c2gobWVzaCk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1swXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbMl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1szXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s3XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAtMSk7XG5cbiAgICAvLyBtZXNoLmZhY2VzWzBdID0geyBBOiAwLCBCOiAxLCBDOiAyIH07XG4gICAgLy8gbWVzaC5mYWNlc1sxXSA9IHsgQTogMSwgQjogMiwgQzogMyB9O1xuICAgIC8vIG1lc2guZmFjZXNbMl0gPSB7IEE6IDEsIEI6IDMsIEM6IDYgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzNdID0geyBBOiAxLCBCOiA1LCBDOiA2IH07XG4gICAgLy8gbWVzaC5mYWNlc1s0XSA9IHsgQTogMCwgQjogMSwgQzogNCB9O1xuICAgIC8vIG1lc2guZmFjZXNbNV0gPSB7IEE6IDEsIEI6IDQsIEM6IDUgfTtcblxuICAgIC8vIG1lc2guZmFjZXNbNl0gPSB7IEE6IDIsIEI6IDMsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzddID0geyBBOiAzLCBCOiA2LCBDOiA3IH07XG4gICAgLy8gbWVzaC5mYWNlc1s4XSA9IHsgQTogMCwgQjogMiwgQzogNyB9O1xuICAgIC8vIG1lc2guZmFjZXNbOV0gPSB7IEE6IDAsIEI6IDQsIEM6IDcgfTtcbiAgICAvLyBtZXNoLmZhY2VzWzEwXSA9IHsgQTogNCwgQjogNSwgQzogNiB9O1xuICAgIC8vIG1lc2guZmFjZXNbMTFdID0geyBBOiA0LCBCOiA2LCBDOiA3IH07XG5cbiAgICBjYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gICAgZGV2aWNlID0gbmV3IERldmljZShjYW52YXMpO1xuXG4gICAgY2FtZXJhLnBvc2l0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMygwLCAwLCAxMCk7XG4gICAgY2FtZXJhLnRhcmdldCA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMCwgMCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcFxuICAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG5cbiAgICBsb2FkSlNPTkZpbGVBc3luYyhcIi4vZGlzdC9yZXMvdGVzdF9tb25rZXkuYmFieWxvblwiLCBsb2FkSlNPTkNvbXBsZXRlZCk7XG59XG5cbmZ1bmN0aW9uIGxvYWRKU09OQ29tcGxldGVkKG1lc2hlc0xvYWRlZDogTWVzaFtdKSB7XG4gICAgbWVzaGVzID0gbWVzaGVzTG9hZGVkO1xuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdpbmdMb29wKTtcbn1cblxuZnVuY3Rpb24gZHJhd2luZ0xvb3AoKSB7XG4gICAgZGV2aWNlLmNsZWFyKCk7XG5cbiAgICAvLyByb3RhdGluZyBzbGlnaHRseSB0aGUgY3ViZSBkdXJpbmcgZWFjaCBmcmFtZSByZW5kZXJlZFxuICAgIG1lc2hlcy5mb3JFYWNoKChtZXNoKSA9PiB7XG4gICAgICAgIG1lc2gucm90YXRpb24ueCArPSAwLjAxO1xuICAgICAgICBtZXNoLnJvdGF0aW9uLnkgKz0gMC4wMTtcbiAgICB9KTtcblxuICAgIC8vIERvaW5nIHRoZSB2YXJpb3VzIG1hdHJpeCBvcGVyYXRpb25zXG4gICAgZGV2aWNlLnJlbmRlcihjYW1lcmEsIG1lc2hlcyk7XG4gICAgLy8gRmx1c2hpbmcgdGhlIGJhY2sgYnVmZmVyIGludG8gdGhlIGZyb250IGJ1ZmZlclxuICAgIGRldmljZS5wcmVzZW50KCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcCByZWN1cnNpdmVseVxuICAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG59XG4iLCJpbXBvcnQgeyBDYW1lcmEsIERldmljZSwgTWVzaCB9IGZyb20gXCIuL21haW5cIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRKU09ORmlsZUFzeW5jKGZpbGVOYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAocmVzdWx0OiBNZXNoW10pID0+IHZvaWQpOiB2b2lkIHtcbiAgICBsZXQganNvbk9iamVjdCA9IHt9O1xuICAgIGNvbnN0IHhtbEh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4bWxIdHRwLm9wZW4oXCJHRVRcIiwgZmlsZU5hbWUsIHRydWUpO1xuXG4gICAgeG1sSHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGlmICh4bWxIdHRwLnJlYWR5U3RhdGUgPT0gNCAmJiB4bWxIdHRwLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgIGpzb25PYmplY3QgPSBKU09OLnBhcnNlKHhtbEh0dHAucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIC8vIGNhbGxiYWNrKHRoaXMuY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdCkpO1xuICAgICAgICAgICAgY2FsbGJhY2soY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdCkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHhtbEh0dHAuc2VuZChudWxsKTtcbn1cblxuLyoqIGh0dHBzOi8vZG9jLmJhYnlsb25qcy5jb20vcmVzb3VyY2VzL2ZpbGVfZm9ybWF0X21hcF8oLmJhYnlsb24pXG4gKiAganNvbiDmoLzlvI9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1lc2hlc0Zyb21KU09OKGpzb25PYmplY3Q6IGFueSk6IE1lc2hbXSB7XG4gICAgcmV0dXJuIGpzb25PYmplY3QubWVzaGVzLm1hcCgobWVzaE9iamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB2ZXJ0aWNlc0FycmF5OiBudW1iZXJbXSA9IG1lc2hPYmplY3QucG9zaXRpb25zO1xuICAgICAgICAvLyBGYWNlc1xuICAgICAgICBjb25zdCBpbmRpY2VzQXJyYXk6IG51bWJlcltdID0gbWVzaE9iamVjdC5pbmRpY2VzO1xuXG4gICAgICAgIGNvbnN0IHZlcnRpY2VzQ291bnQgPSBtZXNoT2JqZWN0LnN1Yk1lc2hlc1swXS52ZXJ0aWNlc0NvdW50O1xuXG4gICAgICAgIC8vIG51bWJlciBvZiBmYWNlcyBpcyBsb2dpY2FsbHkgdGhlIHNpemUgb2YgdGhlIGFycmF5IGRpdmlkZWQgYnkgMyAoQSwgQiwgQylcbiAgICAgICAgY29uc3QgZmFjZXNDb3VudCA9IGluZGljZXNBcnJheS5sZW5ndGggLyAzO1xuICAgICAgICBjb25zdCBtZXNoID0gbmV3IE1lc2gobWVzaE9iamVjdC5uYW1lLCB2ZXJ0aWNlc0NvdW50LCBmYWNlc0NvdW50KTtcblxuICAgICAgICAvLyBGaWxsaW5nIHRoZSB2ZXJ0aWNlcyBhcnJheSBvZiBvdXIgbWVzaCBmaXJzdO+8jOagueaNrnBvc2l0aW9uIOavj+asoeWPluS4ieS4quaUvuWIsOmhtueCueaVsOaNrlxuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdmVydGljZXNDb3VudDsgKytpbmRleCkge1xuICAgICAgICAgICAgY29uc3QgeCA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzXTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSB2ZXJ0aWNlc0FycmF5W2luZGV4ICogMyArIDFdO1xuICAgICAgICAgICAgY29uc3QgeiA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzICsgMl07XG4gICAgICAgICAgICBtZXNoLnZlcnRpY2VzW2luZGV4XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgeSwgeik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGVuIGZpbGxpbmcgdGhlIGZhY2VzIGFycmF5IOagueaNrumdoueahOeCuee0ouW8leaVsOaNru+8jOavj+asoeWPluS4ieS4qiDmlL7liLBtZXNo55qE6Z2i5pWw5o2u5Lit5Y67XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBmYWNlc0NvdW50OyArK2luZGV4KSB7XG4gICAgICAgICAgICBjb25zdCBhID0gaW5kaWNlc0FycmF5W2luZGV4ICogM107XG4gICAgICAgICAgICBjb25zdCBiID0gaW5kaWNlc0FycmF5W2luZGV4ICogMyArIDFdO1xuICAgICAgICAgICAgY29uc3QgYyA9IGluZGljZXNBcnJheVtpbmRleCAqIDMgKyAyXTtcblxuICAgICAgICAgICAgbWVzaC5mYWNlc1tpbmRleF0gPSB7XG4gICAgICAgICAgICAgICAgQTogYSxcbiAgICAgICAgICAgICAgICBCOiBiLFxuICAgICAgICAgICAgICAgIEM6IGMsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0dGluZyB0aGUgcG9zaXRpb24geW91J3ZlIHNldCBpbiBCbGVuZGVyXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gbWVzaE9iamVjdC5wb3NpdGlvbjtcbiAgICAgICAgbWVzaC5wb3N0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMyhwb3NpdGlvblswXSwgcG9zaXRpb25bMV0sIHBvc2l0aW9uWzJdKTtcblxuICAgICAgICByZXR1cm4gbWVzaDtcbiAgICB9KTtcbiAgICByZXR1cm4gW107XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiYmFieWxvbi5tYXRoLnRzXCIvPlxuXG5leHBvcnQgY2xhc3MgQ2FtZXJhIHtcbiAgICBwdWJsaWMgcG9zaXRpb246IEJBQllMT04uVmVjdG9yMztcbiAgICBwdWJsaWMgdGFyZ2V0OiBCQUJZTE9OLlZlY3RvcjM7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmFjZSB7XG4gICAgQTogbnVtYmVyO1xuICAgIEI6IG51bWJlcjtcbiAgICBDOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBNZXNoIHtcbiAgICBwdWJsaWMgcG9zdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyByb3RhdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyB2ZXJ0aWNlczogQkFCWUxPTi5WZWN0b3IzW107XG4gICAgcHVibGljIGZhY2VzOiBGYWNlW107XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCB2ZXJ0aWNlc0NvdW50OiBudW1iZXIsIGZhY2VzQ291bnQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEFycmF5KHZlcnRpY2VzQ291bnQpO1xuICAgICAgICB0aGlzLmZhY2VzID0gbmV3IEFycmF5KGZhY2VzQ291bnQpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgdGhpcy5wb3N0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEZXZpY2Uge1xuICAgIHByaXZhdGUgYmFja2J1ZmZlcj86IEltYWdlRGF0YTtcbiAgICBwcml2YXRlIHdvcmtpbmdDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuICAgIHByaXZhdGUgd29ya2luZ0NvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcbiAgICBwcml2YXRlIHdvcmtpbmdXaWR0aDogbnVtYmVyO1xuICAgIHByaXZhdGUgd29ya2luZ0hlaWdodDogbnVtYmVyO1xuXG4gICAgcHJpdmF0ZSBiYWNrYnVmZmVyZGF0YT86IFVpbnQ4Q2xhbXBlZEFycmF5O1xuXG4gICAgY29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCkge1xuICAgICAgICB0aGlzLndvcmtpbmdDYW52YXMgPSBjYW52YXM7XG4gICAgICAgIHRoaXMud29ya2luZ1dpZHRoID0gY2FudmFzLndpZHRoO1xuICAgICAgICB0aGlzLndvcmtpbmdIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuXG4gICAgICAgIHRoaXMud29ya2luZ0NvbnRleHQgPSB0aGlzLndvcmtpbmdDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpITtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMud29ya2luZ0NvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMud29ya2luZ1dpZHRoLCB0aGlzLndvcmtpbmdIZWlnaHQpO1xuICAgICAgICB0aGlzLmJhY2tidWZmZXIgPSB0aGlzLndvcmtpbmdDb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLndvcmtpbmdXaWR0aCwgdGhpcy53b3JraW5nSGVpZ2h0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJlc2VudCgpIHtcbiAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dC5wdXRJbWFnZURhdGEodGhpcy5iYWNrYnVmZmVyISwgMCwgMCk7XG4gICAgfVxuXG4gICAgcHVibGljIHB1dFBpeGVsKHg6IG51bWJlciwgeTogbnVtYmVyLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpIHtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YSA9IHRoaXMuYmFja2J1ZmZlciEuZGF0YTtcblxuICAgICAgICBjb25zdCBpbmRleDogbnVtYmVyID0gKCh4ID4+IDApICsgKHkgPj4gMCkgKiB0aGlzLndvcmtpbmdXaWR0aCkgKiA0O1xuXG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXhdID0gY29sb3IuciAqIDI1NTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleCArIDFdID0gY29sb3IuZyAqIDI1NTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleCArIDJdID0gY29sb3IuYiAqIDI1NTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleCArIDNdID0gY29sb3IuYSAqIDI1NTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHJvamVjdChjb29yZDogQkFCWUxPTi5WZWN0b3IzLCB0cmFuc01hdDogQkFCWUxPTi5NYXRyaXgpOiBCQUJZTE9OLlZlY3RvcjIge1xuICAgICAgICBjb25zdCBwb2ludCA9IEJBQllMT04uVmVjdG9yMy5UcmFuc2Zvcm1Db29yZGluYXRlcyhjb29yZCwgdHJhbnNNYXQpO1xuXG4gICAgICAgIGNvbnN0IHggPSAocG9pbnQueCAqIHRoaXMud29ya2luZ1dpZHRoICsgdGhpcy53b3JraW5nV2lkdGggLyAyLjApID4+IDA7XG4gICAgICAgIGNvbnN0IHkgPSAoLXBvaW50LnkgKiB0aGlzLndvcmtpbmdIZWlnaHQgKyB0aGlzLndvcmtpbmdIZWlnaHQgLyAyLjApID4+IDA7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBCQUJZTE9OLlZlY3RvcjIoeCwgeSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRyYXdQb2ludChwb2ludDogQkFCWUxPTi5WZWN0b3IyKSB7XG4gICAgICAgIGlmIChwb2ludC54ID49IDAgJiYgcG9pbnQueSA+PSAwICYmIHBvaW50LnggPCB0aGlzLndvcmtpbmdXaWR0aCAmJiBwb2ludC55IDwgdGhpcy53b3JraW5nSGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLnB1dFBpeGVsKHBvaW50LngsIHBvaW50LnksIG5ldyBCQUJZTE9OLkNvbG9yNCgxLCAxLCAwLCAxKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiog57uY5Yi257q/5p2hIOaYr+S4gOS4qiDpgJLlvZLnu5jliLbotbflp4vngrkgLSDkuK3pl7TngrkgLSDnu5PmnZ/ngrnvvIjmgLvlhbEgMyBwaXhlbO+8ieeahOi/h+eoiyAqL1xuICAgIHB1YmxpYyBkcmF3TGluZShwb2ludDA6IEJBQllMT04uVmVjdG9yMiwgcG9pbnQxOiBCQUJZTE9OLlZlY3RvcjIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZGlzdCA9IHBvaW50MS5zdWJ0cmFjdChwb2ludDApLmxlbmd0aCgpO1xuXG4gICAgICAgIGlmIChkaXN0IDwgMikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWlkZGxlUG9pbnQgPSBwb2ludDAuYWRkKHBvaW50MS5zdWJ0cmFjdChwb2ludDApLnNjYWxlKDAuNSkpO1xuXG4gICAgICAgIHRoaXMuZHJhd1BvaW50KG1pZGRsZVBvaW50KTtcblxuICAgICAgICB0aGlzLmRyYXdMaW5lKHBvaW50MCwgbWlkZGxlUG9pbnQpO1xuICAgICAgICB0aGlzLmRyYXdMaW5lKG1pZGRsZVBvaW50LCBwb2ludDEpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkcmF3QmxpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyKTogdm9pZCB7XG4gICAgICAgIGxldCB4MCA9IHBvaW50MC54ID4+IDA7XG4gICAgICAgIGxldCB5MCA9IHBvaW50MC55ID4+IDA7XG4gICAgICAgIGNvbnN0IHgxID0gcG9pbnQxLnggPj4gMDtcbiAgICAgICAgY29uc3QgeTEgPSBwb2ludDEueSA+PiAwO1xuICAgICAgICBjb25zdCBkeCA9IE1hdGguYWJzKHgxIC0geDApO1xuICAgICAgICBjb25zdCBkeSA9IE1hdGguYWJzKHkxIC0geTApO1xuXG4gICAgICAgIGNvbnN0IHN4ID0geDAgPCB4MSA/IDEgOiAtMTtcbiAgICAgICAgY29uc3Qgc3kgPSB5MCA8IHkxID8gMSA6IC0xO1xuXG4gICAgICAgIGxldCBlcnIgPSBkeCAtIGR5O1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLmRyYXdQb2ludChuZXcgQkFCWUxPTi5WZWN0b3IyKHgwLCB5MCkpO1xuICAgICAgICAgICAgaWYgKHgwID09IHgxICYmIHkwID09IHkxKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBlMiA9IDIgKiBlcnI7XG4gICAgICAgICAgICBpZiAoZTIgPiAtZHkpIHtcbiAgICAgICAgICAgICAgICBlcnIgLT0gZHk7XG4gICAgICAgICAgICAgICAgeDAgKz0gc3g7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZTIgPCBkeCkge1xuICAgICAgICAgICAgICAgIGVyciArPSBkeDtcbiAgICAgICAgICAgICAgICB5MCArPSBzeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoY2FtZXJhOiBDYW1lcmEsIG1lc2hlczogTWVzaFtdKSB7XG4gICAgICAgIGNvbnN0IHZpZXdNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Mb29rQXRMSChjYW1lcmEucG9zaXRpb24sIGNhbWVyYS50YXJnZXQsIEJBQllMT04uVmVjdG9yMy5VcCgpKTtcblxuICAgICAgICBjb25zdCBwcm9qZWN0TWF0cml4ID0gQkFCWUxPTi5NYXRyaXguUGVyc3BlY3RpdmVGb3ZMSCgwLjc4LCB0aGlzLndvcmtpbmdXaWR0aCAvIHRoaXMud29ya2luZ0hlaWdodCwgMC4wMSwgMS4wKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNNZXNoIG9mIG1lc2hlcykge1xuICAgICAgICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Sb3RhdGlvbllhd1BpdGNoUm9sbChcbiAgICAgICAgICAgICAgICBjTWVzaC5yb3RhdGlvbi55LFxuICAgICAgICAgICAgICAgIGNNZXNoLnJvdGF0aW9uLngsXG4gICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueixcbiAgICAgICAgICAgICkubXVsdGlwbHkoQkFCWUxPTi5NYXRyaXguVHJhbnNsYXRpb24oY01lc2gucG9zdGlvbi54LCBjTWVzaC5wb3N0aW9uLnksIGNNZXNoLnBvc3Rpb24ueikpO1xuXG4gICAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1NYXRyaXggPSB3b3JsZE1hdHJpeC5tdWx0aXBseSh2aWV3TWF0cml4KS5tdWx0aXBseShwcm9qZWN0TWF0cml4KTtcblxuICAgICAgICAgICAgLyoqIGRyYXcgcG9pbnRzICovXG4gICAgICAgICAgICAvLyBmb3IgKGNvbnN0IGluZGV4VmVydGV4IG9mIGNNZXNoLnZlcnRpY2VzKSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcHJvamVjdFBvaW50ID0gdGhpcy5wcm9qZWN0KGluZGV4VmVydGV4LCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd1BvaW50KHByb2plY3RQb2ludCk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8qKiBkcmF3IGxpbmVzICovXG4gICAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLnZlcnRpY2VzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHBvaW50MCA9IHRoaXMucHJvamVjdChjTWVzaC52ZXJ0aWNlc1tpXSwgdHJhbnNmb3JtTWF0cml4KTtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwb2ludDEgPSB0aGlzLnByb2plY3QoY01lc2gudmVydGljZXNbaSArIDFdLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpbmUocG9pbnQwLCBwb2ludDEpO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAvKiogZHJhdyBmYWNlcyAqL1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBwcmVmZXItZm9yLW9mXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLmZhY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEZhY2UgPSBjTWVzaC5mYWNlc1tpXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEEgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5BXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhCID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQl07XG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QyA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkNdO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxBID0gdGhpcy5wcm9qZWN0KHZlcnRleEEsIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxCID0gdGhpcy5wcm9qZWN0KHZlcnRleEIsIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxDID0gdGhpcy5wcm9qZWN0KHZlcnRleEMsIHRyYW5zZm9ybU1hdHJpeCk7XG5cbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQSwgcGl4ZWxCKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQiwgcGl4ZWxDKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdMaW5lKHBpeGVsQywgcGl4ZWxBKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdCbGluZShwaXhlbEEsIHBpeGVsQik7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QmxpbmUocGl4ZWxCLCBwaXhlbEMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0JsaW5lKHBpeGVsQywgcGl4ZWxBKTtcblxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBkcmF3ICR7dmVydGV4QS50b1N0cmluZygpfSAke3ZlcnRleEIudG9TdHJpbmcoKX0gJHt2ZXJ0ZXhDLnRvU3RyaW5nKCl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=
