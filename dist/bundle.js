(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
}); /// <reference path="babylon.math.ts"/>

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

  mesh = new main_1.SoftEngine.Mesh("Cube", 8, 12);
  meshes.push(mesh);
  mesh.vertices[0] = new BABYLON.Vector3(-1, 1, 1);
  mesh.vertices[1] = new BABYLON.Vector3(1, 1, 1);
  mesh.vertices[2] = new BABYLON.Vector3(-1, -1, 1);
  mesh.vertices[3] = new BABYLON.Vector3(1, -1, 1);
  mesh.vertices[4] = new BABYLON.Vector3(-1, 1, -1);
  mesh.vertices[5] = new BABYLON.Vector3(1, 1, -1);
  mesh.vertices[6] = new BABYLON.Vector3(1, -1, -1);
  mesh.vertices[7] = new BABYLON.Vector3(-1, -1, -1);
  mesh.faces[0] = {
    A: 0,
    B: 1,
    C: 2
  };
  mesh.faces[1] = {
    A: 1,
    B: 2,
    C: 3
  };
  mesh.faces[2] = {
    A: 1,
    B: 3,
    C: 6
  };
  mesh.faces[3] = {
    A: 1,
    B: 5,
    C: 6
  };
  mesh.faces[4] = {
    A: 0,
    B: 1,
    C: 4
  };
  mesh.faces[5] = {
    A: 1,
    B: 4,
    C: 5
  };
  mesh.faces[6] = {
    A: 2,
    B: 3,
    C: 7
  };
  mesh.faces[7] = {
    A: 3,
    B: 6,
    C: 7
  };
  mesh.faces[8] = {
    A: 0,
    B: 2,
    C: 7
  };
  mesh.faces[9] = {
    A: 0,
    B: 4,
    C: 7
  };
  mesh.faces[10] = {
    A: 4,
    B: 5,
    C: 6
  };
  mesh.faces[11] = {
    A: 4,
    B: 6,
    C: 7
  };
  camera = new main_1.SoftEngine.Camera();
  device = new main_1.SoftEngine.Device(canvas);
  camera.position = new BABYLON.Vector3(0, 0, 10);
  camera.target = new BABYLON.Vector3(0, 0, 0); // Calling the HTML5 rendering loop

  requestAnimationFrame(drawingLoop);
}

function drawingLoop() {
  device.clear(); // rotating slightly the cube during each frame rendered

  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01; // Doing the various matrix operations

  device.render(camera, meshes); // Flushing the back buffer into the front buffer

  device.present(); // Calling the HTML5 rendering loop recursively

  requestAnimationFrame(drawingLoop);
}

},{"./main":2}],2:[function(require,module,exports){
"use strict"; /// <reference path="babylon.math.ts"/>

Object.defineProperty(exports, "__esModule", {
  value: true
});
var SoftEngine;

(function (SoftEngine) {
  var Camera =
  /** @class */
  function () {
    function Camera() {
      this.position = BABYLON.Vector3.Zero();
      this.target = BABYLON.Vector3.Zero();
    }

    return Camera;
  }();

  SoftEngine.Camera = Camera;

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

  SoftEngine.Mesh = Mesh;

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

    Device.prototype.render = function (camera, meshes) {
      var viewMatrix = BABYLON.Matrix.LookAtLH(camera.position, camera.target, BABYLON.Vector3.Up());
      var projectMatrix = BABYLON.Matrix.PerspectiveFovLH(0.78, this.workingWidth / this.workingHeight, 0.01, 1.0);

      for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
        var cMesh = meshes_1[_i];
        var worldMatrix = BABYLON.Matrix.RotationYawPitchRoll(cMesh.rotation.y, cMesh.rotation.x, cMesh.rotation.z).multiply(BABYLON.Matrix.Translation(cMesh.postion.x, cMesh.postion.y, cMesh.postion.z));
        var transformMatrix = worldMatrix.multiply(viewMatrix).multiply(projectMatrix);
        /** draw points */

        for (var _a = 0, _b = cMesh.vertices; _a < _b.length; _a++) {
          var indexVertex = _b[_a];
          var projectPoint = this.project(indexVertex, transformMatrix);
          this.drawPoint(projectPoint);
        }
        /** draw lines */
        // for (let i = 0; i < cMesh.vertices.length - 1; i++) {
        //     const point0 = this.project(cMesh.vertices[i], transformMatrix);
        //     const point1 = this.project(cMesh.vertices[i + 1], transformMatrix);
        //     this.drawLine(point0, point1);
        // }

        /** draw faces */


        for (var i = 0; i < cMesh.faces.length; i++) {
          var currentFace = cMesh.faces[i];
          var vertexA = cMesh.vertices[currentFace.A];
          var vertexB = cMesh.vertices[currentFace.B];
          var vertexC = cMesh.vertices[currentFace.C];
          var pixelA = this.project(vertexA, transformMatrix);
          var pixelB = this.project(vertexB, transformMatrix);
          var pixelC = this.project(vertexC, transformMatrix);
          this.drawLine(pixelA, pixelB);
          this.drawLine(pixelB, pixelC);
          this.drawLine(pixelC, pixelA);
        }
      }
    };

    return Device;
  }();

  SoftEngine.Device = Device;
})(SoftEngine = exports.SoftEngine || (exports.SoftEngine = {}));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLnRzIiwic3JjL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0lDQUE7O0FBQ0EsSUFBQSxNQUFBLEdBQUEsT0FBQSxDQUFBLFFBQUEsQ0FBQTs7QUFFQSxJQUFJLE1BQUo7QUFDQSxJQUFJLE1BQUo7QUFDQSxJQUFJLElBQUo7QUFDQSxJQUFNLE1BQU0sR0FBc0IsRUFBbEM7QUFDQSxJQUFJLE1BQUo7QUFFQSxRQUFRLENBQUMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLElBQTlDLEVBQW9ELEtBQXBEOztBQUVBLFNBQVMsSUFBVCxHQUFhO0FBQ1QsRUFBQSxNQUFNLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBVCxDQURTLENBRVQ7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsRUFBQSxJQUFJLEdBQUcsSUFBSSxNQUFBLENBQUEsVUFBQSxDQUFXLElBQWYsQ0FBb0IsTUFBcEIsRUFBNEIsQ0FBNUIsRUFBK0IsRUFBL0IsQ0FBUDtBQUNBLEVBQUEsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFaO0FBQ0EsRUFBQSxJQUFJLENBQUMsUUFBTCxDQUFjLENBQWQsSUFBbUIsSUFBSSxPQUFPLENBQUMsT0FBWixDQUFvQixDQUFDLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLENBQTNCLENBQW5CO0FBQ0EsRUFBQSxJQUFJLENBQUMsUUFBTCxDQUFjLENBQWQsSUFBbUIsSUFBSSxPQUFPLENBQUMsT0FBWixDQUFvQixDQUFwQixFQUF1QixDQUF2QixFQUEwQixDQUExQixDQUFuQjtBQUNBLEVBQUEsSUFBSSxDQUFDLFFBQUwsQ0FBYyxDQUFkLElBQW1CLElBQUksT0FBTyxDQUFDLE9BQVosQ0FBb0IsQ0FBQyxDQUFyQixFQUF3QixDQUFDLENBQXpCLEVBQTRCLENBQTVCLENBQW5CO0FBQ0EsRUFBQSxJQUFJLENBQUMsUUFBTCxDQUFjLENBQWQsSUFBbUIsSUFBSSxPQUFPLENBQUMsT0FBWixDQUFvQixDQUFwQixFQUF1QixDQUFDLENBQXhCLEVBQTJCLENBQTNCLENBQW5CO0FBQ0EsRUFBQSxJQUFJLENBQUMsUUFBTCxDQUFjLENBQWQsSUFBbUIsSUFBSSxPQUFPLENBQUMsT0FBWixDQUFvQixDQUFDLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLENBQUMsQ0FBNUIsQ0FBbkI7QUFDQSxFQUFBLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBZCxJQUFtQixJQUFJLE9BQU8sQ0FBQyxPQUFaLENBQW9CLENBQXBCLEVBQXVCLENBQXZCLEVBQTBCLENBQUMsQ0FBM0IsQ0FBbkI7QUFDQSxFQUFBLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBZCxJQUFtQixJQUFJLE9BQU8sQ0FBQyxPQUFaLENBQW9CLENBQXBCLEVBQXVCLENBQUMsQ0FBeEIsRUFBMkIsQ0FBQyxDQUE1QixDQUFuQjtBQUNBLEVBQUEsSUFBSSxDQUFDLFFBQUwsQ0FBYyxDQUFkLElBQW1CLElBQUksT0FBTyxDQUFDLE9BQVosQ0FBb0IsQ0FBQyxDQUFyQixFQUF3QixDQUFDLENBQXpCLEVBQTRCLENBQUMsQ0FBN0IsQ0FBbkI7QUFFQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFFQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBWCxJQUFnQjtBQUFFLElBQUEsQ0FBQyxFQUFFLENBQUw7QUFBUSxJQUFBLENBQUMsRUFBRSxDQUFYO0FBQWMsSUFBQSxDQUFDLEVBQUU7QUFBakIsR0FBaEI7QUFDQSxFQUFBLElBQUks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QWY7QUFDQSxjQUFNLE1BQU0sR0FBRyxLQUFLLE9BQUwsQ0FBYSxPQUFiLEVBQXNCLGVBQXRCLENBQWY7QUFFQSxlQUFLLFFBQUwsQ0FBYyxNQUFkLEVBQXNCLE1BQXRCO0FBQ0EsZUFBSyxRQUFMLENBQWMsTUFBZCxFQUFzQixNQUF0QjtBQUNBLGVBQUssUUFBTCxDQUFjLE1BQWQsRUFBc0IsTUFBdEI7QUFDSDtBQUNKO0FBQ0osS0FqRE07O0FBa0RYLFdBQUEsTUFBQTtBQUFDLEdBdEhELEVBQUE7O0FBQWEsRUFBQSxVQUFBLENBQUEsTUFBQSxHQUFNLE1BQU47QUF1SGhCLENBdEpELEVBQWlCLFVBQVUsR0FBVixPQUFBLENBQUEsVUFBQSxLQUFBLE9BQUEsQ0FBQSxVQUFBLEdBQVUsRUFBVixDQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJiYWJ5bG9uLm1hdGgudHNcIi8+XG5pbXBvcnQgeyBTb2Z0RW5naW5lIH0gZnJvbSBcIi4vbWFpblwiO1xuXG5sZXQgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcbmxldCBkZXZpY2U6IFNvZnRFbmdpbmUuRGV2aWNlO1xubGV0IG1lc2g6IFNvZnRFbmdpbmUuTWVzaDtcbmNvbnN0IG1lc2hlczogU29mdEVuZ2luZS5NZXNoW10gPSBbXTtcbmxldCBjYW1lcmE6IFNvZnRFbmdpbmUuQ2FtZXJhO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBpbml0LCBmYWxzZSk7XG5cbmZ1bmN0aW9uIGluaXQoKSB7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcm9udEJ1ZmZlclwiKSBhcyBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICAvLyBtZXNoID0gbmV3IFNvZnRFbmdpbmUuTWVzaChcIkN1YmVcIiwgOCk7XG5cbiAgICAvLyBtZXNoZXMucHVzaChtZXNoKTtcblxuICAgIC8vIG1lc2gudmVydGljZXNbMF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzFdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzJdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIDEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbM10gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNF0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s1XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNl0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzddID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgLTEpO1xuXG4gICAgbWVzaCA9IG5ldyBTb2Z0RW5naW5lLk1lc2goXCJDdWJlXCIsIDgsIDEyKTtcbiAgICBtZXNoZXMucHVzaChtZXNoKTtcbiAgICBtZXNoLnZlcnRpY2VzWzBdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgMSk7XG4gICAgbWVzaC52ZXJ0aWNlc1sxXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgMSk7XG4gICAgbWVzaC52ZXJ0aWNlc1syXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAxKTtcbiAgICBtZXNoLnZlcnRpY2VzWzNdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgMSk7XG4gICAgbWVzaC52ZXJ0aWNlc1s0XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIC0xKTtcbiAgICBtZXNoLnZlcnRpY2VzWzVdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAtMSk7XG4gICAgbWVzaC52ZXJ0aWNlc1s2XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIC0xKTtcbiAgICBtZXNoLnZlcnRpY2VzWzddID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIC0xKTtcblxuICAgIG1lc2guZmFjZXNbMF0gPSB7IEE6IDAsIEI6IDEsIEM6IDIgfTtcbiAgICBtZXNoLmZhY2VzWzFdID0geyBBOiAxLCBCOiAyLCBDOiAzIH07XG4gICAgbWVzaC5mYWNlc1syXSA9IHsgQTogMSwgQjogMywgQzogNiB9O1xuICAgIG1lc2guZmFjZXNbM10gPSB7IEE6IDEsIEI6IDUsIEM6IDYgfTtcbiAgICBtZXNoLmZhY2VzWzRdID0geyBBOiAwLCBCOiAxLCBDOiA0IH07XG4gICAgbWVzaC5mYWNlc1s1XSA9IHsgQTogMSwgQjogNCwgQzogNSB9O1xuXG4gICAgbWVzaC5mYWNlc1s2XSA9IHsgQTogMiwgQjogMywgQzogNyB9O1xuICAgIG1lc2guZmFjZXNbN10gPSB7IEE6IDMsIEI6IDYsIEM6IDcgfTtcbiAgICBtZXNoLmZhY2VzWzhdID0geyBBOiAwLCBCOiAyLCBDOiA3IH07XG4gICAgbWVzaC5mYWNlc1s5XSA9IHsgQTogMCwgQjogNCwgQzogNyB9O1xuICAgIG1lc2guZmFjZXNbMTBdID0geyBBOiA0LCBCOiA1LCBDOiA2IH07XG4gICAgbWVzaC5mYWNlc1sxMV0gPSB7IEE6IDQsIEI6IDYsIEM6IDcgfTtcblxuICAgIGNhbWVyYSA9IG5ldyBTb2Z0RW5naW5lLkNhbWVyYSgpO1xuICAgIGRldmljZSA9IG5ldyBTb2Z0RW5naW5lLkRldmljZShjYW52YXMpO1xuXG4gICAgY2FtZXJhLnBvc2l0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMygwLCAwLCAxMCk7XG4gICAgY2FtZXJhLnRhcmdldCA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMCwgMCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcFxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG59XG5cbmZ1bmN0aW9uIGRyYXdpbmdMb29wKCkge1xuICAgIGRldmljZS5jbGVhcigpO1xuXG4gICAgLy8gcm90YXRpbmcgc2xpZ2h0bHkgdGhlIGN1YmUgZHVyaW5nIGVhY2ggZnJhbWUgcmVuZGVyZWRcbiAgICBtZXNoLnJvdGF0aW9uLnggKz0gMC4wMTtcbiAgICBtZXNoLnJvdGF0aW9uLnkgKz0gMC4wMTtcblxuICAgIC8vIERvaW5nIHRoZSB2YXJpb3VzIG1hdHJpeCBvcGVyYXRpb25zXG4gICAgZGV2aWNlLnJlbmRlcihjYW1lcmEsIG1lc2hlcyk7XG4gICAgLy8gRmx1c2hpbmcgdGhlIGJhY2sgYnVmZmVyIGludG8gdGhlIGZyb250IGJ1ZmZlclxuICAgIGRldmljZS5wcmVzZW50KCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcCByZWN1cnNpdmVseVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiYmFieWxvbi5tYXRoLnRzXCIvPlxuXG5leHBvcnQgbmFtZXNwYWNlIFNvZnRFbmdpbmUge1xuICAgIGV4cG9ydCBjbGFzcyBDYW1lcmEge1xuICAgICAgICBwdWJsaWMgcG9zaXRpb246IEJBQllMT04uVmVjdG9yMztcbiAgICAgICAgcHVibGljIHRhcmdldDogQkFCWUxPTi5WZWN0b3IzO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvbiA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgICAgICB0aGlzLnRhcmdldCA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIEZhY2Uge1xuICAgICAgICBBOiBudW1iZXI7XG4gICAgICAgIEI6IG51bWJlcjtcbiAgICAgICAgQzogbnVtYmVyO1xuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBNZXNoIHtcbiAgICAgICAgcHVibGljIHBvc3Rpb246IEJBQllMT04uVmVjdG9yMztcbiAgICAgICAgcHVibGljIHJvdGF0aW9uOiBCQUJZTE9OLlZlY3RvcjM7XG4gICAgICAgIHB1YmxpYyB2ZXJ0aWNlczogQkFCWUxPTi5WZWN0b3IzW107XG4gICAgICAgIHB1YmxpYyBmYWNlczogRmFjZVtdO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBuYW1lOiBzdHJpbmcsIHZlcnRpY2VzQ291bnQ6IG51bWJlciwgZmFjZXNDb3VudDogbnVtYmVyKSB7XG4gICAgICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEFycmF5KHZlcnRpY2VzQ291bnQpO1xuICAgICAgICAgICAgdGhpcy5mYWNlcyA9IG5ldyBBcnJheShmYWNlc0NvdW50KTtcbiAgICAgICAgICAgIHRoaXMucm90YXRpb24gPSBCQUJZTE9OLlZlY3RvcjMuWmVybygpO1xuICAgICAgICAgICAgdGhpcy5wb3N0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydCBjbGFzcyBEZXZpY2Uge1xuICAgICAgICBwcml2YXRlIGJhY2tidWZmZXI/OiBJbWFnZURhdGE7XG4gICAgICAgIHByaXZhdGUgd29ya2luZ0NhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgICAgIHByaXZhdGUgd29ya2luZ0NvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcbiAgICAgICAgcHJpdmF0ZSB3b3JraW5nV2lkdGg6IG51bWJlcjtcbiAgICAgICAgcHJpdmF0ZSB3b3JraW5nSGVpZ2h0OiBudW1iZXI7XG5cbiAgICAgICAgcHJpdmF0ZSBiYWNrYnVmZmVyZGF0YT86IFVpbnQ4Q2xhbXBlZEFycmF5O1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMud29ya2luZ0NhbnZhcyA9IGNhbnZhcztcbiAgICAgICAgICAgIHRoaXMud29ya2luZ1dpZHRoID0gY2FudmFzLndpZHRoO1xuICAgICAgICAgICAgdGhpcy53b3JraW5nSGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcblxuICAgICAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dCA9IHRoaXMud29ya2luZ0NhbnZhcy5nZXRDb250ZXh0KFwiMmRcIikhO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy53b3JraW5nV2lkdGgsIHRoaXMud29ya2luZ0hlaWdodCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tidWZmZXIgPSB0aGlzLndvcmtpbmdDb250ZXh0LmdldEltYWdlRGF0YSgwLCAwLCB0aGlzLndvcmtpbmdXaWR0aCwgdGhpcy53b3JraW5nSGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBwcmVzZW50KCkge1xuICAgICAgICAgICAgdGhpcy53b3JraW5nQ29udGV4dC5wdXRJbWFnZURhdGEodGhpcy5iYWNrYnVmZmVyISwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgcHV0UGl4ZWwoeDogbnVtYmVyLCB5OiBudW1iZXIsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCkge1xuICAgICAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YSA9IHRoaXMuYmFja2J1ZmZlciEuZGF0YTtcblxuICAgICAgICAgICAgY29uc3QgaW5kZXg6IG51bWJlciA9ICgoeCA+PiAwKSArICh5ID4+IDApICogdGhpcy53b3JraW5nV2lkdGgpICogNDtcblxuICAgICAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleF0gPSBjb2xvci5yICogMjU1O1xuICAgICAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleCArIDFdID0gY29sb3IuZyAqIDI1NTtcbiAgICAgICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXggKyAyXSA9IGNvbG9yLmIgKiAyNTU7XG4gICAgICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4ICsgM10gPSBjb2xvci5hICogMjU1O1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHByb2plY3QoY29vcmQ6IEJBQllMT04uVmVjdG9yMywgdHJhbnNNYXQ6IEJBQllMT04uTWF0cml4KTogQkFCWUxPTi5WZWN0b3IyIHtcbiAgICAgICAgICAgIGNvbnN0IHBvaW50ID0gQkFCWUxPTi5WZWN0b3IzLlRyYW5zZm9ybUNvb3JkaW5hdGVzKGNvb3JkLCB0cmFuc01hdCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHggPSAocG9pbnQueCAqIHRoaXMud29ya2luZ1dpZHRoICsgdGhpcy53b3JraW5nV2lkdGggLyAyLjApID4+IDA7XG4gICAgICAgICAgICBjb25zdCB5ID0gKC1wb2ludC55ICogdGhpcy53b3JraW5nSGVpZ2h0ICsgdGhpcy53b3JraW5nSGVpZ2h0IC8gMi4wKSA+PiAwO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJBQllMT04uVmVjdG9yMih4LCB5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHB1YmxpYyBkcmF3UG9pbnQocG9pbnQ6IEJBQllMT04uVmVjdG9yMikge1xuICAgICAgICAgICAgaWYgKHBvaW50LnggPj0gMCAmJiBwb2ludC55ID49IDAgJiYgcG9pbnQueCA8IHRoaXMud29ya2luZ1dpZHRoICYmIHBvaW50LnkgPCB0aGlzLndvcmtpbmdIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1dFBpeGVsKHBvaW50LngsIHBvaW50LnksIG5ldyBCQUJZTE9OLkNvbG9yNCgxLCAxLCAwLCAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvKiog57uY5Yi257q/5p2hIOaYr+S4gOS4qiDpgJLlvZLnu5jliLbotbflp4vngrkgLSDkuK3pl7TngrkgLSDnu5PmnZ/ngrnvvIjmgLvlhbEgMyBwaXhlbO+8ieeahOi/h+eoiyAqL1xuICAgICAgICBwdWJsaWMgZHJhd0xpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyKTogdm9pZCB7XG4gICAgICAgICAgICBjb25zdCBkaXN0ID0gcG9pbnQxLnN1YnRyYWN0KHBvaW50MCkubGVuZ3RoKCk7XG5cbiAgICAgICAgICAgIGlmIChkaXN0IDwgMikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbWlkZGxlUG9pbnQgPSBwb2ludDAuYWRkKHBvaW50MS5zdWJ0cmFjdChwb2ludDApLnNjYWxlKDAuNSkpO1xuXG4gICAgICAgICAgICB0aGlzLmRyYXdQb2ludChtaWRkbGVQb2ludCk7XG5cbiAgICAgICAgICAgIHRoaXMuZHJhd0xpbmUocG9pbnQwLCBtaWRkbGVQb2ludCk7XG4gICAgICAgICAgICB0aGlzLmRyYXdMaW5lKG1pZGRsZVBvaW50LCBwb2ludDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHVibGljIHJlbmRlcihjYW1lcmE6IENhbWVyYSwgbWVzaGVzOiBNZXNoW10pIHtcbiAgICAgICAgICAgIGNvbnN0IHZpZXdNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Mb29rQXRMSChjYW1lcmEucG9zaXRpb24sIGNhbWVyYS50YXJnZXQsIEJBQllMT04uVmVjdG9yMy5VcCgpKTtcblxuICAgICAgICAgICAgY29uc3QgcHJvamVjdE1hdHJpeCA9IEJBQllMT04uTWF0cml4LlBlcnNwZWN0aXZlRm92TEgoXG4gICAgICAgICAgICAgICAgMC43OCxcbiAgICAgICAgICAgICAgICB0aGlzLndvcmtpbmdXaWR0aCAvIHRoaXMud29ya2luZ0hlaWdodCxcbiAgICAgICAgICAgICAgICAwLjAxLFxuICAgICAgICAgICAgICAgIDEuMCxcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgY01lc2ggb2YgbWVzaGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd29ybGRNYXRyaXggPSBCQUJZTE9OLk1hdHJpeC5Sb3RhdGlvbllhd1BpdGNoUm9sbChcbiAgICAgICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueSxcbiAgICAgICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueCxcbiAgICAgICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueixcbiAgICAgICAgICAgICAgICApLm11bHRpcGx5KEJBQllMT04uTWF0cml4LlRyYW5zbGF0aW9uKGNNZXNoLnBvc3Rpb24ueCwgY01lc2gucG9zdGlvbi55LCBjTWVzaC5wb3N0aW9uLnopKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybU1hdHJpeCA9IHdvcmxkTWF0cml4Lm11bHRpcGx5KHZpZXdNYXRyaXgpLm11bHRpcGx5KHByb2plY3RNYXRyaXgpO1xuXG4gICAgICAgICAgICAgICAgLyoqIGRyYXcgcG9pbnRzICovXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBpbmRleFZlcnRleCBvZiBjTWVzaC52ZXJ0aWNlcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0UG9pbnQgPSB0aGlzLnByb2plY3QoaW5kZXhWZXJ0ZXgsIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1BvaW50KHByb2plY3RQb2ludCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLyoqIGRyYXcgbGluZXMgKi9cbiAgICAgICAgICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IGNNZXNoLnZlcnRpY2VzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vICAgICBjb25zdCBwb2ludDAgPSB0aGlzLnByb2plY3QoY01lc2gudmVydGljZXNbaV0sIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgLy8gICAgIGNvbnN0IHBvaW50MSA9IHRoaXMucHJvamVjdChjTWVzaC52ZXJ0aWNlc1tpICsgMV0sIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpbmUocG9pbnQwLCBwb2ludDEpO1xuICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgIC8qKiBkcmF3IGZhY2VzICovXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjTWVzaC5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RmFjZSA9IGNNZXNoLmZhY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEEgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5BXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QiA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkJdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhDID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQ107XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxBID0gdGhpcy5wcm9qZWN0KHZlcnRleEEsIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsQiA9IHRoaXMucHJvamVjdCh2ZXJ0ZXhCLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwaXhlbEMgPSB0aGlzLnByb2plY3QodmVydGV4QywgdHJhbnNmb3JtTWF0cml4KTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdMaW5lKHBpeGVsQSwgcGl4ZWxCKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3TGluZShwaXhlbEIsIHBpeGVsQyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0xpbmUocGl4ZWxDLCBwaXhlbEEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==
