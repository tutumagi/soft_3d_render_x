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
var eRenderType;

(function (eRenderType) {
  eRenderType[eRenderType["Vertice"] = 0] = "Vertice";
  eRenderType[eRenderType["Line"] = 1] = "Line";
  eRenderType[eRenderType["Face"] = 2] = "Face";
  eRenderType[eRenderType["UVMap"] = 3] = "UVMap";
})(eRenderType = exports.eRenderType || (exports.eRenderType = {}));

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
      this.depthbuffer[i] = 10000000;
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
    var normal3dWorld = BABYLON.Vector3.TransformCoordinates(vertex.normal, world); // 原始的point2d 是在 NDC space的，一个立方体，原点在中心，左下角为 (-1，-1)，右上角为(1，1)
    // 转换到屏幕坐标尺寸
    // The transformed coordinates will be based on coordinate system
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
    var enl = this.interpolate(data.ndotlc, data.ndotld, gradient2);
    var su;
    var eu;
    var sv;
    var ev; // interpolating texture coordinates on Y

    if (data.ua && data.ub && data.uc && data.ud && data.va && data.vb && data.vc && data.vd) {
      su = this.interpolate(data.ua, data.ub, gradient1);
      eu = this.interpolate(data.uc, data.ud, gradient2);
      sv = this.interpolate(data.va, data.vb, gradient1);
      ev = this.interpolate(data.vc, data.vd, gradient2);
    } // drawing a line from left (sx) to right (ex)


    for (var x = sx; x < ex; x++) {
      // normalisation pour dessiner de gauche à droite
      var gradient = (x - sx) / (ex - sx);
      var z = this.interpolate(z1, z2, gradient);
      var ndotl = this.interpolate(snl, enl, gradient); // 光源向量和面的法向量的夹角cos值
      // const ndotl = data.ndotla;

      var textureColor = void 0;

      if (texture && su && sv && eu && ev) {
        var u = this.interpolate(su, eu, gradient);
        var v = this.interpolate(sv, ev, gradient);
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
    var nl3 = this.computeNDotL(v3.worldCoordinates, v3.normal, lightPos); // @ts-ignore

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

          if (v1.TextureCoordinates && v2.TextureCoordinates && v3.TextureCoordinates) {
            data.ua = v1.TextureCoordinates.x;
            data.ub = v3.TextureCoordinates.x;
            data.uc = v1.TextureCoordinates.x;
            data.ud = v2.TextureCoordinates.x;
            data.va = v1.TextureCoordinates.y;
            data.vb = v3.TextureCoordinates.y;
            data.vc = v1.TextureCoordinates.y;
            data.vd = v2.TextureCoordinates.y;
          } // scan p1p3 p1p2


          this.processScanLine(data, v1, v3, v1, v2, color, texture);
        } else {
          data.ndotla = nl1;
          data.ndotlb = nl3;
          data.ndotlc = nl2;
          data.ndotld = nl3;

          if (v1.TextureCoordinates && v2.TextureCoordinates && v3.TextureCoordinates) {
            data.ua = v1.TextureCoordinates.x;
            data.ub = v3.TextureCoordinates.x;
            data.uc = v2.TextureCoordinates.x;
            data.ud = v3.TextureCoordinates.x;
            data.va = v1.TextureCoordinates.y;
            data.vb = v3.TextureCoordinates.y;
            data.vc = v2.TextureCoordinates.y;
            data.vd = v3.TextureCoordinates.y;
          } // scan p1p3 p2p3


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

          if (v1.TextureCoordinates && v2.TextureCoordinates && v3.TextureCoordinates) {
            data.ua = v1.TextureCoordinates.x;
            data.ub = v2.TextureCoordinates.x;
            data.uc = v1.TextureCoordinates.x;
            data.ud = v3.TextureCoordinates.x;
            data.va = v1.TextureCoordinates.y;
            data.vb = v2.TextureCoordinates.y;
            data.vc = v1.TextureCoordinates.y;
            data.vd = v3.TextureCoordinates.y;
          } // scan p1p2 p1p3


          this.processScanLine(data, v1, v2, v1, v3, color, texture);
        } else {
          data.ndotla = nl2;
          data.ndotlb = nl3;
          data.ndotlc = nl1;
          data.ndotld = nl3;

          if (v1.TextureCoordinates && v2.TextureCoordinates && v3.TextureCoordinates) {
            data.ua = v2.TextureCoordinates.x;
            data.ub = v3.TextureCoordinates.x;
            data.uc = v1.TextureCoordinates.x;
            data.ud = v3.TextureCoordinates.x;
            data.va = v2.TextureCoordinates.y;
            data.vb = v3.TextureCoordinates.y;
            data.vc = v1.TextureCoordinates.y;
            data.vd = v3.TextureCoordinates.y;
          } // scan p2p3 p1p3


          this.processScanLine(data, v2, v3, v1, v3, color, texture);
        }
      }
    }
  };

  Device.prototype.render = function (camera, meshes) {
    // glm::mat4 CameraMatrix = glm::lookAt(
    //     cameraPosition, // the position of your camera, in world space
    //     cameraTarget,   // where you want to look at, in world space
    //     upVector        // probably glm::vec3(0,1,0), but (0,-1,0) would make you looking upside-down(倒置), which can be great too
    // );
    var viewMatrix = BABYLON.Matrix.LookAtLH(camera.position, camera.target, new BABYLON.Vector3(0, 1.0, 0)); // Generates a really hard-to-read matrix, but a normal, standard 4x4 matrix nonetheless
    // glm::mat4 projectionMatrix = glm::perspective(
    //      // The vertical Field of View, in radians: the amount of "zoom".
    //      //Think "camera lens". Usually between 90° (extra wide) and 30° (quite zoomed in)
    //     glm::radians(FoV),
    //      // Aspect Ratio. Depends on the size of your window. Notice that 4/3 == 800/600 == 1280/960,
    //      //sounds familiar ?
    //     4.0f / 3.0f,
    //     0.1f,              // Near clipping plane. Keep as big as possible, or you'll get precision issues.
    //     100.0f             // Far clipping plane. Keep as little as possible.
    // );

    var projectMatrix = BABYLON.Matrix.PerspectiveFovLH(1.5, this.workingWidth / this.workingHeight, 0.01, 100.0);

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

var mesh_1 = require("./mesh");

var canvas;
var device;
var camera;
document.addEventListener("DOMContentLoaded", init, false);

var Rabbit =
/** @class */
function () {
  function Rabbit() {
    var _this = this;

    loader_1.loadJSONFileAsync("./dist/res/rabbit.babylon", function (mesh) {
      _this.meshes = mesh;
    });
  }

  return Rabbit;
}();

var Cube =
/** @class */
function () {
  function Cube() {
    this.meshes = [];
    var mesh = new mesh_1.Mesh("Cube", 8, 12);
    this.meshes.push(mesh);
    mesh.vertices[0] = {
      coordinates: new BABYLON.Vector3(-1, 1, 1),
      normal: new BABYLON.Vector3(-1, 1, 1)
    };
    mesh.vertices[1] = {
      coordinates: new BABYLON.Vector3(1, 1, 1),
      normal: new BABYLON.Vector3(1, 1, 1)
    };
    mesh.vertices[2] = {
      coordinates: new BABYLON.Vector3(-1, -1, 1),
      normal: new BABYLON.Vector3(-1, -1, 1)
    };
    mesh.vertices[3] = {
      coordinates: new BABYLON.Vector3(1, -1, 1),
      normal: new BABYLON.Vector3(1, -1, 1)
    };
    mesh.vertices[4] = {
      coordinates: new BABYLON.Vector3(-1, 1, -1),
      normal: new BABYLON.Vector3(-1, 1, -1)
    };
    mesh.vertices[5] = {
      coordinates: new BABYLON.Vector3(1, 1, -1),
      normal: new BABYLON.Vector3(1, 1, -1)
    };
    mesh.vertices[6] = {
      coordinates: new BABYLON.Vector3(1, -1, -1),
      normal: new BABYLON.Vector3(1, -1, -1)
    };
    mesh.vertices[7] = {
      coordinates: new BABYLON.Vector3(-1, -1, -1),
      normal: new BABYLON.Vector3(-1, -1, -1)
    };
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
    }; // http://www.waitingfy.com/archives/425

    function calFaceNormal(p0, p1, p2) {
      var a = p0.subtract(p1);
      var b = p0.subtract(p2);
      return a.multiply(b);
    }

    var faceNormal = mesh.faces.map(function (face) {
      return {
        face: face,
        normal: calFaceNormal(mesh.vertices[face.A].coordinates, mesh.vertices[face.B].coordinates, mesh.vertices[face.C].coordinates)
      };
    });
    mesh.vertices.forEach(function (vertex, index) {
      var relateFaceNormalByVertex = mesh.faces.filter(function (face, index) {
        if (face.A == index || face.B == index || face.C == index) {
          return true;
        }

        return false;
      }).map(function (_, index) {
        return faceNormal[index].normal;
      });
      var tmp = BABYLON.Vector3.Zero();
      vertex.normal = relateFaceNormalByVertex.reduce(function (pre, cur) {
        return pre.add(cur);
      }, tmp).scale(1 / relateFaceNormalByVertex.length);
    }); // mesh.postion.x = -canvas.width / 4;
    // mesh.postion.y = -canvas.height / 4;

    mesh.postion.x = 3.0;
    mesh.postion.y = 3.0;
  }

  return Cube;
}();

var Monkey =
/** @class */
function () {
  function Monkey() {
    var _this = this;

    loader_1.loadJSONFileAsync("./dist/res/test_monkey.babylon", function (mesh) {
      _this.meshes = mesh;
    });
  }

  return Monkey;
}();

var entities;

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

  entities = [new Cube(), new Monkey()];
  camera = new camera_1.Camera();
  device = new device_1.Device(canvas);
  camera.position = new BABYLON.Vector3(0, 0, 10);
  camera.target = new BABYLON.Vector3(0, 0, 0); // camera.position = new BABYLON.Vector3(32, 95, 45);
  // camera.target = new BABYLON.Vector3(-0.13, 31, 8);
  // Calling the HTML5 rendering loop
  // requestAnimationFrame(drawingLoop);

  requestAnimationFrame(drawingLoop);
}

var previousDate = 0;

function drawingLoop() {
  // fps
  var now = Date.now();
  var currentFps = 1000.0 / (now - previousDate);
  previousDate = now; // console.log(`${currentFps.toPrecision(2)} fps`);

  device.clear(); // rotating slightly the cube during each frame rendered

  entities.forEach(function (entity) {
    if (entity.meshes && entity.meshes.length > 0) {
      entity.meshes.forEach(function (mesh) {
        // mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      });
      device.render(camera, entity.meshes);
    }
  }); // Doing the various matrix operations
  // Flushing the back buffer into the front buffer

  device.present(); // Calling the HTML5 rendering loop recursively

  requestAnimationFrame(drawingLoop);
}
/**
 *            Y
 *            ↑
 *            |
 *            |
 *            |
 *  x ←--------
 *            /O
 *           /
 *          /
 *       z ↙︎
 *   ←↓→
 *
 */

},{"./camera":1,"./device":2,"./loader":3,"./mesh":5}],5:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FtZXJhLnRzIiwic3JjL2RldmljZS50cyIsInNyYy9sb2FkZXIudHMiLCJzcmMvbWFpbi50cyIsInNyYy9tZXNoLnRzIiwic3JjL3RleHR1cmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUNBQSxJQUFBLE1BQUE7QUFBQTtBQUFBLFlBQUE7QUFJSSxXQUFBLE1BQUEsR0FBQTtBQUNJLFNBQUssUUFBTCxHQUFnQixPQUFPLENBQUMsT0FBUixDQUFnQixJQUFoQixFQUFoQjtBQUNBLFNBQUssTUFBTCxHQUFjLE9BQU8sQ0FBQyxPQUFSLENBQWdCLElBQWhCLEVBQWQ7QUFDSDs7QUFDTCxTQUFBLE1BQUE7QUFBQyxDQVJELEVBQUE7O0FBQWEsT0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBOzs7Ozs7OztBQ0liLElBQVksV0FBWjs7QUFBQSxDQUFBLFVBQVksV0FBWixFQUF1QjtBQUNuQixFQUFBLFdBQUEsQ0FBQSxXQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsU0FBQTtBQUNBLEVBQUEsV0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBO0FBQ0EsRUFBQSxXQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxHQUFBLE1BQUE7QUFDQSxFQUFBLFdBQUEsQ0FBQSxXQUFBLENBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEdBQUEsT0FBQTtBQUNILENBTEQsRUFBWSxXQUFXLEdBQVgsT0FBQSxDQUFBLFdBQUEsS0FBQSxPQUFBLENBQUEsV0FBQSxHQUFXLEVBQVgsQ0FBWjs7QUFPQSxJQUFBLE1BQUE7QUFBQTtBQUFBLFlBQUE7QUFXSSxXQUFBLE1BQUEsQ0FBWSxNQUFaLEVBQXFDO0FBQ2pDLFNBQUssYUFBTCxHQUFxQixNQUFyQjtBQUNBLFNBQUss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RTtBQUFqQixLQUFoQjtBQUNBLElBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLElBQWdCO0FBQUUsTUFBQSxDQUFDLEVBQUUsQ0FBTDtBQUFRLE1BQUEsQ0FBQyxFQUFFLENBQVg7QUFBYyxNQUFBLENBQUMsRUFBRTtBQUFqQixLQUFoQjtBQUVBLElBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLElBQWdCO0FBQUUsTUFBQSxDQUFDLEVBQUUsQ0FBTDtBQUFRLE1BQUEsQ0FBQyxFQUFFLENBQVg7QUFBYyxNQUFBLENBQUMsRUFBRTtBQUFqQixLQUFoQjtBQUNBLElBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLElBQWdCO0FBQUUsTUFBQSxDQUFDLEVBQUUsQ0FBTDtBQUFRLE1BQUEsQ0FBQyxFQUFFLENBQVg7QUFBYyxNQUFBLENBQUMsRUFBRTtBQUFqQixLQUFoQjtBQUNBLElBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLElBQWdCO0FBQUUsTUFBQSxDQUFDLEVBQUUsQ0FBTDtBQUFRLE1BQUEsQ0FBQyxFQUFFLENBQVg7QUFBYyxNQUFBLENBQUMsRUFBRTtBQUFqQixLQUFoQjtBQUNBLElBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYLElBQWdCO0FBQUUsTUFBQSxDQUFDLEVBQUUsQ0FBTDtBQUFRLE1BQUEsQ0FBQyxFQUFFLENBQVg7QUFBYyxNQUFBLENBQUMsRUFBRTtBQUFqQixLQUFoQjtBQUNBLElBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxFQUFYLElBQWlCO0FBQUUsTUFBQSxDQUFDLEVBQUUsQ0FBTDtBQUFRLE1BQUEsQ0FBQyxFQUFFLENBQVg7QUFBYyxNQUFBLENBQUMsRUFBRTtBQUFqQixLQUFqQjtBQUNBLElBQUEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxFQUFYLElBQWlCO0FBQUUsTUFBQSxDQUFDLEVBQUUsQ0FBTDtBQUFRLE1BQUEsQ0FBQyxFQUFFLENBQVg7QUFBYyxNQUFBLENBQUMsRUFBRTtBQUFqQixLQUFqQixDQXhCSixDQTBCSTs7QUFDQSxhQUFTLGFB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QUFMLENBQW9CLElBQXBCLENBQXlCLEdBQUcsR0FBRyxDQUEvQixDQUFWO0FBQ0EsVUFBTSxDQUFDLEdBQUcsS0FBSyxjQUFMLENBQW9CLElBQXBCLENBQXlCLEdBQUcsR0FBRyxDQUEvQixDQUFWO0FBRUEsYUFBTyxJQUFJLE9BQU8sQ0FBQyxNQUFaLENBQW1CLENBQUMsR0FBRyxLQUF2QixFQUE4QixDQUFDLEdBQUcsS0FBbEMsRUFBeUMsQ0FBQyxHQUFHLEtBQTdDLEVBQW9ELENBQUMsR0FBRyxLQUF4RCxDQUFQO0FBQ0gsS0FiRCxNQWFPO0FBQ0gsYUFBTyxJQUFJLE9BQU8sQ0FBQyxNQUFaLENBQW1CLENBQW5CLEVBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBQTRCLENBQTVCLENBQVA7QUFDSDtBQUNKLEdBakJNOztBQWtCWCxTQUFBLE9BQUE7QUFBQyxDQTlDRCxFQUFBOztBQUFhLE9BQUEsQ0FBQSxPQUFBLEdBQUEsT0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImV4cG9ydCBjbGFzcyBDYW1lcmEge1xuICAgIHB1YmxpYyBwb3NpdGlvbjogQkFCWUxPTi5WZWN0b3IzO1xuICAgIHB1YmxpYyB0YXJnZXQ6IEJBQllMT04uVmVjdG9yMztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBCQUJZTE9OLlZlY3RvcjMuWmVybygpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENhbWVyYSB9IGZyb20gXCIuL2NhbWVyYVwiO1xuaW1wb3J0IHsgTWVzaCwgU2NhbkxpbmVEYXRhLCBWZXJ0ZXggfSBmcm9tIFwiLi9tZXNoXCI7XG5pbXBvcnQgeyBUZXh0dXJlIH0gZnJvbSBcIi4vdGV4dHVyZVwiO1xuXG5leHBvcnQgZW51bSBlUmVuZGVyVHlwZSB7XG4gICAgVmVydGljZSxcbiAgICBMaW5lLFxuICAgIEZhY2UsXG4gICAgVVZNYXAsXG59XG5cbmV4cG9ydCBjbGFzcyBEZXZpY2Uge1xuICAgIHByaXZhdGUgYmFja2J1ZmZlcj86IEltYWdlRGF0YTtcbiAgICBwcml2YXRlIHdvcmtpbmdDYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuICAgIHByaXZhdGUgd29ya2luZ0NvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcbiAgICBwcml2YXRlIHdvcmtpbmdXaWR0aDogbnVtYmVyO1xuICAgIHByaXZhdGUgd29ya2luZ0hlaWdodDogbnVtYmVyO1xuICAgIC8vIGVxdWFscyB0byBiYWNrYnVmZmVyLmRhdGFcbiAgICBwcml2YXRlIGJhY2tidWZmZXJkYXRhPzogVWludDhDbGFtcGVkQXJyYXk7XG4gICAgLy8g57yT5a2Y5q+P5Liq5YOP57Sg54K555qEIHotYnVmZmVy77yM5aaC5p6c5ZCO6Z2i57uY5Yi255qEeiBpbmRleCDlpKfkuo7lvZPliY3nmoTvvIzliJnlv73nlaXvvIzlkKbliJnopobnm5blvZPliY3nmoTlg4/ntKBcbiAgICBwcml2YXRlIGRlcHRoYnVmZmVyOiBudW1iZXJbXTtcblxuICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICAgICAgdGhpcy53b3JraW5nQ2FudmFzID0gY2FudmFzO1xuICAgICAgICB0aGlzLndvcmtpbmdXaWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgICAgdGhpcy53b3JraW5nSGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcblxuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0ID0gdGhpcy53b3JraW5nQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKSE7XG5cbiAgICAgICAgdGhpcy5kZXB0aGJ1ZmZlciA9IG5ldyBBcnJheSh0aGlzLndvcmtpbmdXaWR0aCAqIHRoaXMud29ya2luZ0hlaWdodCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNsZWFyKCk6IHZvaWQge1xuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndvcmtpbmdXaWR0aCwgdGhpcy53b3JraW5nSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyID0gdGhpcy53b3JraW5nQ29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgdGhpcy53b3JraW5nV2lkdGgsIHRoaXMud29ya2luZ0hlaWdodCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRlcHRoYnVmZmVyLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAvLyDloavkuIDkuKrlpKfkuIDngrnnmoTmlbDlrZdcbiAgICAgICAgICAgIHRoaXMuZGVwdGhidWZmZXJbaV0gPSAxMDAwMDAwMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBwcmVzZW50KCkge1xuICAgICAgICB0aGlzLndvcmtpbmdDb250ZXh0LnB1dEltYWdlRGF0YSh0aGlzLmJhY2tidWZmZXIhLCAwLCAwKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcHV0UGl4ZWwoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgY29sb3I6IEJBQllMT04uQ29sb3I0KSB7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGEgPSB0aGlzLmJhY2tidWZmZXIhLmRhdGE7XG5cbiAgICAgICAgY29uc3QgaW5kZXg6IG51bWJlciA9ICh4ID4+IDApICsgKHkgPj4gMCkgKiB0aGlzLndvcmtpbmdXaWR0aDtcbiAgICAgICAgY29uc3QgaW5kZXg0OiBudW1iZXIgPSBpbmRleCAqIDQ7XG5cbiAgICAgICAgaWYgKHRoaXMuZGVwdGhidWZmZXJbaW5kZXhdIDwgeikge1xuICAgICAgICAgICAgcmV0dXJuOyAvLyBEaXNjYXJkXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXB0aGJ1ZmZlcltpbmRleF0gPSB6O1xuXG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXg0XSA9IGNvbG9yLnIgKiAyNTU7XG4gICAgICAgIHRoaXMuYmFja2J1ZmZlcmRhdGFbaW5kZXg0ICsgMV0gPSBjb2xvci5nICogMjU1O1xuICAgICAgICB0aGlzLmJhY2tidWZmZXJkYXRhW2luZGV4NCArIDJdID0gY29sb3IuYiAqIDI1NTtcbiAgICAgICAgdGhpcy5iYWNrYnVmZmVyZGF0YVtpbmRleDQgKyAzXSA9IGNvbG9yLmEgKiAyNTU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvamVjdCB0YWtlcyBzb21lIDNEIGNvb3JkaW5hdGVzIGFuZCB0cmFuc2Zvcm0gdGhlbVxuICAgICAqIGluIDJEIGNvb3JkaW5hdGVzIHVzaW5nIHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICAgKi9cbiAgICBwdWJsaWMgcHJvamVjdCh2ZXJ0ZXg6IFZlcnRleCwgdHJhbnNNYXQ6IEJBQllMT04uTWF0cml4LCB3b3JsZDogQkFCWUxPTi5NYXRyaXgpOiBWZXJ0ZXgge1xuICAgICAgICAvLyB0cmFuc2Zvcm1pbmcgdGhlIGNvb3JkaW5hdGVzXG4gICAgICAgIGNvbnN0IHBvaW50MmQgPSBCQUJZTE9OLlZlY3RvcjMuVHJhbnNmb3JtQ29vcmRpbmF0ZXModmVydGV4LmNvb3JkaW5hdGVzLCB0cmFuc01hdCk7XG5cbiAgICAgICAgLy8g5bCG5Z2Q5qCH5ZKM5rOV5ZCR6YeP6L2s5o2i5YiwIDNk56m66Ze055qEIOWQkemHj1xuICAgICAgICBjb25zdCBwb2ludDNkV29ybGQgPSBCQUJZTE9OLlZlY3RvcjMuVHJhbnNmb3JtQ29vcmRpbmF0ZXModmVydGV4LmNvb3JkaW5hdGVzLCB3b3JsZCk7XG4gICAgICAgIGNvbnN0IG5vcm1hbDNkV29ybGQ6IEJBQllMT04uVmVjdG9yMyA9IEJBQllMT04uVmVjdG9yMy5UcmFuc2Zvcm1Db29yZGluYXRlcyh2ZXJ0ZXgubm9ybWFsLCB3b3JsZCk7XG5cbiAgICAgICAgLy8g5Y6f5aeL55qEcG9pbnQyZCDmmK/lnKggTkRDIHNwYWNl55qE77yM5LiA5Liq56uL5pa55L2T77yM5Y6f54K55Zyo5Lit5b+D77yM5bem5LiL6KeS5Li6ICgtMe+8jC0xKe+8jOWPs+S4iuinkuS4uigx77yMMSlcbiAgICAgICAgLy8g6L2s5o2i5Yiw5bGP5bmV5Z2Q5qCH5bC65a+4XG4gICAgICAgIC8vIFRoZSB0cmFuc2Zvcm1lZCBjb29yZGluYXRlcyB3aWxsIGJlIGJhc2VkIG9uIGNvb3JkaW5hdGUgc3lzdGVtXG4gICAgICAgIC8vIHN0YXJ0aW5nIG9uIHRoZSBjZW50ZXIgb2YgdGhlIHNjcmVlbi4gQnV0IGRyYXdpbmcgb24gc2NyZWVuIG5vcm1hbGx5IHN0YXJ0c1xuICAgICAgICAvLyBmcm9tIHRvcCBsZWZ0LiBXZSB0aGVuIG5lZWQgdG8gdHJhbnNmb3JtIHRoZW0gYWdhaW4gdG8gaGF2ZSB4OjAsIHk6MCBvbiB0b3AgbGVmdFxuICAgICAgICBjb25zdCB4ID0gKHBvaW50MmQueCAqIHRoaXMud29ya2luZ1dpZHRoICsgdGhpcy53b3JraW5nV2lkdGggLyAyLjApID4+IDA7XG4gICAgICAgIGNvbnN0IHkgPSAoLXBvaW50MmQueSAqIHRoaXMud29ya2luZ0hlaWdodCArIHRoaXMud29ya2luZ0hlaWdodCAvIDIuMCkgPj4gMDtcblxuICAgICAgICAvLyByZXR1cm4gbmV3IEJBQllMT04uVmVjdG9yMyh4LCB5LCBwb2ludC56KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvb3JkaW5hdGVzOiBuZXcgQkFCWUxPTi5WZWN0b3IzKHgsIHksIHBvaW50MmQueiksXG4gICAgICAgICAgICBub3JtYWw6IG5vcm1hbDNkV29ybGQsXG4gICAgICAgICAgICB3b3JsZENvb3JkaW5hdGVzOiBwb2ludDNkV29ybGQsXG4gICAgICAgICAgICBUZXh0dXJlQ29vcmRpbmF0ZXM6IHZlcnRleC5UZXh0dXJlQ29vcmRpbmF0ZXMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogYGRyYXdQb2ludGAgY2FsbHMgcHV0UGl4ZWwgYnV0IGRvZXMgdGhlIGNsaXBwaW5nIG9wZXJhdGlvbiBiZWZvcmVcbiAgICAgKiBAcGFyYW0gcG9pbnRcbiAgICAgKi9cbiAgICBwdWJsaWMgZHJhd1BvaW50KHBvaW50OiBCQUJZTE9OLlZlY3RvcjMsIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCkge1xuICAgICAgICAvLyBDbGlwcGluZyB3aGF0J3MgdmlzaWJsZSBvbiBzY3JlZW5cbiAgICAgICAgaWYgKHBvaW50LnggPj0gMCAmJiBwb2ludC55ID49IDAgJiYgcG9pbnQueCA8IHRoaXMud29ya2luZ1dpZHRoICYmIHBvaW50LnkgPCB0aGlzLndvcmtpbmdIZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIERyYXdpbmcgYSB5ZWxsb3cgcG9pbnRcbiAgICAgICAgICAgIHRoaXMucHV0UGl4ZWwocG9pbnQueCwgcG9pbnQueSwgcG9pbnQueiwgY29sb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xhbXBpbmcgdmFsdWVzIHRvIGtlZXAgdGhlbSBiZXR3ZWVuIG1pbiBhbmQgbWF4XG4gICAgICogQHBhcmFtIHZhbHVlIOW+heS/ruato+WAvFxuICAgICAqIEBwYXJhbSBtaW57PTB9IOacgOWwj+WAvFxuICAgICAqIEBwYXJhbSBtYXh7PTF9IOacgOWkp+WAvFxuICAgICAqL1xuICAgIHB1YmxpYyBjbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciA9IDAsIG1heDogbnVtYmVyID0gMSk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heChtaW4sIE1hdGgubWluKHZhbHVlLCBtYXgpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcnBvbGF0aW5nIHRoZSB2YWx1ZSBiZXR3ZWVuIDIgdmVydGljZXNcbiAgICAgKiBtaW4gaXMgdGhlIHN0YXJ0aW5nIHBvaW50LCBtYXggdGhlIGVuZGluZyBwb2ludFxuICAgICAqIGFuZCBncmFkaWVudCB0aGUgJSBiZXR3ZWVuIHRoZSAyIHBvaW50c1xuICAgICAqIOagueaNriBncmFkaWVudOezu+aVsCDojrflj5Yg5LuOIGBtaW5gIOWIsCBgbWF4YCDnmoTkuK3pl7TlgLxcbiAgICAgKiBAcGFyYW0gbWluXG4gICAgICogQHBhcmFtIG1heFxuICAgICAqIEBwYXJhbSBncmFkaWVudFxuICAgICAqL1xuICAgIHB1YmxpYyBpbnRlcnBvbGF0ZShtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIGdyYWRpZW50OiBudW1iZXIpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gbWluICsgKG1heCAtIG1pbikgKiB0aGlzLmNsYW1wKGdyYWRpZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBkcmF3aW5nIGxpbmUgYmV0d2VlbiAyIHBvaW50cyBmcm9tIGxlZnQgdG8gcmlnaHRcbiAgICAgKiBwYSBwYiAtPiBwYyBwZFxuICAgICAqIHBhLHBiLHBjLHBkIG11c3QgdGhlbiBiZSBzb3J0ZWQgYmVmb3JlXG4gICAgICogQHBhcmFtIHlcbiAgICAgKiBAcGFyYW0gcGFcbiAgICAgKiBAcGFyYW0gcGJcbiAgICAgKiBAcGFyYW0gcGNcbiAgICAgKiBAcGFyYW0gcGRcbiAgICAgKiBAcGFyYW0gY29sb3JcbiAgICAgKi9cbiAgICBwdWJsaWMgcHJvY2Vzc1NjYW5MaW5lKFxuICAgICAgICBkYXRhOiBTY2FuTGluZURhdGEsXG4gICAgICAgIHZhOiBWZXJ0ZXgsXG4gICAgICAgIHZiOiBWZXJ0ZXgsXG4gICAgICAgIHZjOiBWZXJ0ZXgsXG4gICAgICAgIHZkOiBWZXJ0ZXgsXG4gICAgICAgIGNvbG9yOiBCQUJZTE9OLkNvbG9yNCxcbiAgICAgICAgdGV4dHVyZT86IFRleHR1cmUsXG4gICAgKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHBhID0gdmEuY29vcmRpbmF0ZXM7XG4gICAgICAgIGNvbnN0IHBiID0gdmIuY29vcmRpbmF0ZXM7XG4gICAgICAgIGNvbnN0IHBjID0gdmMuY29vcmRpbmF0ZXM7XG4gICAgICAgIGNvbnN0IHBkID0gdmQuY29vcmRpbmF0ZXM7XG4gICAgICAgIC8vIHRoYW5rcyB0byBjdXJyZW50IFksIHdlIGNhbiBjb21wdXRlIHRoZSBncmFkaWVudCB0byBjb21wdXRlIG90aGVycyB2YWx1ZXMgbGlrZVxuICAgICAgICAvLyB0aGUgc3RhcnRpbmcgWChzeCkgYW5kIGVuZGluZyBYIChlcykgdG8gZHJhdyBiZXR3ZWVuXG4gICAgICAgIC8vIGlmIHBhLlkgPT0gcGIuWSBvciBwYy5ZID09IHBkLlksIGdyYWRpZW50IGlzIGZvcmNlZCB0byAxXG4gICAgICAgIGNvbnN0IGdyYWRpZW50MSA9IHBhLnkgIT0gcGIueSA/IChkYXRhLmN1cnJlbnRZISAtIHBhLnkpIC8gKHBiLnkgLSBwYS55KSA6IDE7XG4gICAgICAgIGNvbnN0IGdyYWRpZW50MiA9IHBjLnkgIT0gcGQueSA/IChkYXRhLmN1cnJlbnRZISAtIHBjLnkpIC8gKHBkLnkgLSBwYy55KSA6IDE7XG5cbiAgICAgICAgY29uc3Qgc3ggPSB0aGlzLmludGVycG9sYXRlKHBhLngsIHBiLngsIGdyYWRpZW50MSkgPj4gMDtcbiAgICAgICAgY29uc3QgZXggPSB0aGlzLmludGVycG9sYXRlKHBjLngsIHBkLngsIGdyYWRpZW50MikgPj4gMDtcblxuICAgICAgICAvLyBzdGFydGluZyBaICYgIGVuZGluZyBaXG4gICAgICAgIGNvbnN0IHoxOiBudW1iZXIgPSB0aGlzLmludGVycG9sYXRlKHBhLnosIHBiLnosIGdyYWRpZW50MSk7XG4gICAgICAgIGNvbnN0IHoyOiBudW1iZXIgPSB0aGlzLmludGVycG9sYXRlKHBjLnosIHBkLnosIGdyYWRpZW50Mik7XG5cbiAgICAgICAgLy8gaW50ZXJwb2xhdGluZyBub3JtYWxzIG9uIFlcbiAgICAgICAgY29uc3Qgc25sID0gdGhpcy5pbnRlcnBvbGF0ZShkYXRhLm5kb3RsYSwgZGF0YS5uZG90bGIsIGdyYWRpZW50MSk7XG4gICAgICAgIGNvbnN0IGVubCA9IHRoaXMuaW50ZXJwb2xhdGUoZGF0YS5uZG90bGMsIGRhdGEubmRvdGxkLCBncmFkaWVudDIpO1xuXG4gICAgICAgIGxldCBzdTogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgZXU6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHN2OiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgIGxldCBldjogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgICAvLyBpbnRlcnBvbGF0aW5nIHRleHR1cmUgY29vcmRpbmF0ZXMgb24gWVxuICAgICAgICBpZiAoZGF0YS51YSAmJiBkYXRhLnViICYmIGRhdGEudWMgJiYgZGF0YS51ZCAmJiBkYXRhLnZhICYmIGRhdGEudmIgJiYgZGF0YS52YyAmJiBkYXRhLnZkKSB7XG4gICAgICAgICAgICBzdSA9IHRoaXMuaW50ZXJwb2xhdGUoZGF0YS51YSwgZGF0YS51YiwgZ3JhZGllbnQxKTtcbiAgICAgICAgICAgIGV1ID0gdGhpcy5pbnRlcnBvbGF0ZShkYXRhLnVjLCBkYXRhLnVkLCBncmFkaWVudDIpO1xuICAgICAgICAgICAgc3YgPSB0aGlzLmludGVycG9sYXRlKGRhdGEudmEsIGRhdGEudmIsIGdyYWRpZW50MSk7XG4gICAgICAgICAgICBldiA9IHRoaXMuaW50ZXJwb2xhdGUoZGF0YS52YywgZGF0YS52ZCwgZ3JhZGllbnQyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRyYXdpbmcgYSBsaW5lIGZyb20gbGVmdCAoc3gpIHRvIHJpZ2h0IChleClcbiAgICAgICAgZm9yIChsZXQgeCA9IHN4OyB4IDwgZXg7IHgrKykge1xuICAgICAgICAgICAgLy8gbm9ybWFsaXNhdGlvbiBwb3VyIGRlc3NpbmVyIGRlIGdhdWNoZSDDoCBkcm9pdGVcbiAgICAgICAgICAgIGNvbnN0IGdyYWRpZW50OiBudW1iZXIgPSAoeCAtIHN4KSAvIChleCAtIHN4KTtcblxuICAgICAgICAgICAgY29uc3QgeiA9IHRoaXMuaW50ZXJwb2xhdGUoejEsIHoyLCBncmFkaWVudCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5kb3RsID0gdGhpcy5pbnRlcnBvbGF0ZShzbmwsIGVubCwgZ3JhZGllbnQpO1xuXG4gICAgICAgICAgICAvLyDlhYnmupDlkJHph4/lkozpnaLnmoTms5XlkJHph4/nmoTlpLnop5Jjb3PlgLxcbiAgICAgICAgICAgIC8vIGNvbnN0IG5kb3RsID0gZGF0YS5uZG90bGE7XG5cbiAgICAgICAgICAgIGxldCB0ZXh0dXJlQ29sb3I7XG4gICAgICAgICAgICBpZiAodGV4dHVyZSAmJiBzdSAmJiBzdiAmJiBldSAmJiBldikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHUgPSB0aGlzLmludGVycG9sYXRlKHN1LCBldSwgZ3JhZGllbnQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmludGVycG9sYXRlKHN2LCBldiwgZ3JhZGllbnQpO1xuICAgICAgICAgICAgICAgIHRleHR1cmVDb2xvciA9IHRleHR1cmUubWFwKHUsIHYpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0ZXh0dXJlQ29sb3IgPSBuZXcgQkFCWUxPTi5Db2xvcjQoMSwgMSwgMSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGFuZ2luZyB0aGUgY29sb3IgdmFsdWUgdXNpbmcgdGhlIGNvc2luZSBvZiB0aGUgYW5nbGVcbiAgICAgICAgICAgIC8vIGJldHdlZW4gdGhlIGxpZ2h0IHZlY3RvciBhbmQgdGhlIG5vcm1hbCB2ZWN0b3JcbiAgICAgICAgICAgIHRoaXMuZHJhd1BvaW50KFxuICAgICAgICAgICAgICAgIG5ldyBCQUJZTE9OLlZlY3RvcjMoeCwgZGF0YS5jdXJyZW50WSEsIHopLFxuICAgICAgICAgICAgICAgIG5ldyBCQUJZTE9OLkNvbG9yNChcbiAgICAgICAgICAgICAgICAgICAgY29sb3IuciAqIG5kb3RsICogdGV4dHVyZUNvbG9yLnIsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yLmcgKiBuZG90bCAqIHRleHR1cmVDb2xvci5nLFxuICAgICAgICAgICAgICAgICAgICBjb2xvci5iICogbmRvdGwgKiB0ZXh0dXJlQ29sb3IuYixcbiAgICAgICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIC8vIGNvbG9yLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIOiuoeeulyDlhYnmupDlkJHph48obGlnaHQp77yI54Gv5rqQ5Z2Q5qCHIC0g6aG254K55Z2Q5qCH77yJ5ZKM5rOV5ZCR6YeP77yIbm9ybWFs77yJ55qE5aS56KeS55qEY29z5YC877yM6L+U5Zue5YC8MCDliLAgMVxuICAgICAqXG4gICAgICogbm9ybWFsIHZlY3RvciDigKIgbGlnaHQgdmVjdG9yXG4gICAgICogQHBhcmFtIHZlcnRleFxuICAgICAqIEBwYXJhbSBub3JtYWxcbiAgICAgKiBAcGFyYW0gbGlnaHRQb3NpdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyBjb21wdXRlTkRvdEwodmVydGV4OiBCQUJZTE9OLlZlY3RvcjMsIG5vcm1hbDogQkFCWUxPTi5WZWN0b3IzLCBsaWdodFBvc2l0aW9uOiBCQUJZTE9OLlZlY3RvcjMpOiBudW1iZXIge1xuICAgICAgICBjb25zdCBsaWdodERpcmVjdGlvbiA9IGxpZ2h0UG9zaXRpb24uc3VidHJhY3QodmVydGV4KTtcbiAgICAgICAgbm9ybWFsLm5vcm1hbGl6ZSgpO1xuICAgICAgICBsaWdodERpcmVjdGlvbi5ub3JtYWxpemUoKTtcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgQkFCWUxPTi5WZWN0b3IzLkRvdChub3JtYWwsIGxpZ2h0RGlyZWN0aW9uKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRyYXdUcmlhbmdsZSh2MTogVmVydGV4LCB2MjogVmVydGV4LCB2MzogVmVydGV4LCBjb2xvcjogQkFCWUxPTi5Db2xvcjQsIHRleHR1cmU/OiBUZXh0dXJlKTogdm9pZCB7XG4gICAgICAgIC8vIFNvcnRpbmcgdGhlIHBvaW50cyBpbiBvcmRlciB0byBhbHdheXMgaGF2ZSB0aGlzIG9yZGVyIG9uIHNjcmVlbiBwMSwgcDIgJiBwM1xuICAgICAgICAvLyB3aXRoIHAxIGFsd2F5cyB1cCAodGh1cyBoYXZpbmcgdGhlIFkgdGhlIGxvd2VzdCBwb3NzaWJsZSB0byBiZSBuZWFyIHRoZSB0b3Agc2NyZWVuKVxuICAgICAgICAvLyB0aGVuIHAyIGJldHdlZW4gcDEgJiBwMyAoYWNjb3JkaW5nIHRvIFktYXhpcyB1cCB0byBkb3duIClcbiAgICAgICAgaWYgKHYxLmNvb3JkaW5hdGVzLnkgPiB2Mi5jb29yZGluYXRlcy55KSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wID0gdjI7XG4gICAgICAgICAgICB2MiA9IHYxO1xuICAgICAgICAgICAgdjEgPSB0ZW1wO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYyLmNvb3JkaW5hdGVzLnkgPiB2My5jb29yZGluYXRlcy55KSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wID0gdjI7XG4gICAgICAgICAgICB2MiA9IHYzO1xuICAgICAgICAgICAgdjMgPSB0ZW1wO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHYxLmNvb3JkaW5hdGVzLnkgPiB2Mi5jb29yZGluYXRlcy55KSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wID0gdjI7XG4gICAgICAgICAgICB2MiA9IHYxO1xuICAgICAgICAgICAgdjEgPSB0ZW1wO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNvcnQgZW5kXG5cbiAgICAgICAgY29uc3QgcDEgPSB2MS5jb29yZGluYXRlcztcbiAgICAgICAgY29uc3QgcDIgPSB2Mi5jb29yZGluYXRlcztcbiAgICAgICAgY29uc3QgcDMgPSB2My5jb29yZGluYXRlcztcblxuICAgICAgICAvLyBub3JtYWwgZmFjZSdzIHZlY3RvciBpcyB0aGUgYXZlcmFnZSBub3JtYWwgYmV0d2VlbiBlYWNoIHZlcnRleCdzIG5vcm1hbFxuICAgICAgICAvLyBjb21wdXRpbmcgYWxzbyB0aGUgY2VudGVyIHBvaW50IG9mIHRoZSBmYWNlXG4gICAgICAgIC8vIC8vIOmdoueahOazleWQkemHj1xuICAgICAgICAvLyBjb25zdCB2bkZhY2UgPSB2MS5ub3JtYWwuYWRkKHYyLm5vcm1hbC5hZGQodjMubm9ybWFsKSkuc2NhbGUoMSAvIDMpO1xuICAgICAgICAvLyAvLyDpnaLnmoTkuK3lv4PngrlcbiAgICAgICAgLy8gY29uc3QgY2VudGVyUG9pbnQgPSB2MS53b3JsZENvb3JkaW5hdGVzLmFkZCh2Mi53b3JsZENvb3JkaW5hdGVzLmFkZCh2My53b3JsZENvb3JkaW5hdGVzKSkuc2NhbGUoMSAvIDMpO1xuICAgICAgICAvLyBsaWdodCBwb3NpdGlvblxuICAgICAgICBjb25zdCBsaWdodFBvcyA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMTAsIDEwKTtcbiAgICAgICAgLy8g6K6h566X5YWJ5rqQ5ZCR6YeP5ZKM6Z2i55qE5rOV5ZCR6YeP55qE5aS56KeSY29z5YC8XG4gICAgICAgIC8vIGNvbnN0IG5kb3RsID0gdGhpcy5jb21wdXRlTkRvdEwoY2VudGVyUG9pbnQsIHZuRmFjZSwgbGlnaHRQb3MpO1xuXG4gICAgICAgIGNvbnN0IG5sMSA9IHRoaXMuY29tcHV0ZU5Eb3RMKHYxLndvcmxkQ29vcmRpbmF0ZXMhLCB2MS5ub3JtYWwsIGxpZ2h0UG9zKTtcbiAgICAgICAgY29uc3QgbmwyID0gdGhpcy5jb21wdXRlTkRvdEwodjIud29ybGRDb29yZGluYXRlcyEsIHYyLm5vcm1hbCwgbGlnaHRQb3MpO1xuICAgICAgICBjb25zdCBubDMgPSB0aGlzLmNvbXB1dGVORG90TCh2My53b3JsZENvb3JkaW5hdGVzISwgdjMubm9ybWFsLCBsaWdodFBvcyk7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgZGF0YTogU2NhbkxpbmVEYXRhID0ge307XG5cbiAgICAgICAgLy8gaW52ZXJzZSBzbG9wZXNcbiAgICAgICAgbGV0IGRQMVAyOiBudW1iZXI7XG4gICAgICAgIGxldCBkUDFQMzogbnVtYmVyO1xuXG4gICAgICAgIC8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU2xvcGVcbiAgICAgICAgLy8gQ29tcHV0aW5nIHNsb3Blc1xuICAgICAgICBpZiAocDIueSAtIHAxLnkgPiAwKSB7XG4gICAgICAgICAgICBkUDFQMiA9IChwMi54IC0gcDEueCkgLyAocDIueSAtIHAxLnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZFAxUDIgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHAzLnkgLSBwMS55ID4gMCkge1xuICAgICAgICAgICAgZFAxUDMgPSAocDMueCAtIHAxLngpIC8gKHAzLnkgLSBwMS55KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRQMVAzID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZpcnN0IGNhc2Ugd2hlcmUgdHJpYW5nbGVzIGFyZSBsaWtlIHRoYXQ6XG4gICAgICAgIC8vICAgICAgICAgcDFcbiAgICAgICAgLy8gICAgICAgICAgIM6bXG4gICAgICAgIC8vICAgICAgICAgIOKVsSDilbJcbiAgICAgICAgLy8gICAgICAgICDilbEgICDilbJcbiAgICAgICAgLy8gICAgICAgIOKVsSAgICAg4pWyXG4gICAgICAgIC8vICAgICAgIOKVsSAgICAgICDilbJcbiAgICAgICAgLy8gICAgICDilbEgICAgICAgICDilbJcbiAgICAgICAgLy8gICAgIOKVsSAgICAgICAgICAg4pWyXG4gICAgICAgIC8vICAgIOKVsSAgICAgICAgICAgICAgIOKWj3AyXG4gICAgICAgIC8vICDilbFcbiAgICAgICAgLy8gcDMg4paV4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgICAgIC8vIHAyIG9uIHJpZ2h0XG4gICAgICAgIGlmIChkUDFQMiA+IGRQMVAzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gcDEueSA+PiAwOyB5IDw9IHAzLnkgPj4gMDsgeSsrKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5jdXJyZW50WSA9IHk7XG4gICAgICAgICAgICAgICAgaWYgKHkgPCBwMi55KSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxhID0gbmwxO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYiA9IG5sMztcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGMgPSBubDE7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxkID0gbmwyO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh2MS5UZXh0dXJlQ29vcmRpbmF0ZXMgJiYgdjIuVGV4dHVyZUNvb3JkaW5hdGVzICYmIHYzLlRleHR1cmVDb29yZGluYXRlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS51YSA9IHYxLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS51YiA9IHYzLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS51YyA9IHYxLlRleHR1cmVDb29yZGluYXRlcy54O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS51ZCA9IHYyLlRleHR1cmVDb29yZGluYXRlcy54O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnZhID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnZiID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnZjID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnZkID0gdjIuVGV4dHVyZUNvb3JkaW5hdGVzLnk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBzY2FuIHAxcDMgcDFwMlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NTY2FuTGluZShkYXRhLCB2MSwgdjMsIHYxLCB2MiwgY29sb3IsIHRleHR1cmUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxhID0gbmwxO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYiA9IG5sMztcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGMgPSBubDI7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxkID0gbmwzO1xuICAgICAgICAgICAgICAgICAgICBpZiAodjEuVGV4dHVyZUNvb3JkaW5hdGVzICYmIHYyLlRleHR1cmVDb29yZGluYXRlcyAmJiB2My5UZXh0dXJlQ29vcmRpbmF0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudWEgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudWIgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudWMgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudWQgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS52YSA9IHYxLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS52YiA9IHYzLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS52YyA9IHYyLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS52ZCA9IHYzLlRleHR1cmVDb29yZGluYXRlcy55O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDFwMyBwMnAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKGRhdGEsIHYxLCB2MywgdjIsIHYzLCBjb2xvciwgdGV4dHVyZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gcDIgb24gbGVmdFxuICAgICAgICAgICAgZm9yIChsZXQgeSA9IHAxLnkgPj4gMDsgeSA8PSBwMy55ID4+IDA7IHkrKykge1xuICAgICAgICAgICAgICAgIGRhdGEuY3VycmVudFkgPSB5O1xuICAgICAgICAgICAgICAgIGlmICh5IDwgcDIueSkge1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYSA9IG5sMTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGIgPSBubDI7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxjID0gbmwxO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsZCA9IG5sMztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYxLlRleHR1cmVDb29yZGluYXRlcyAmJiB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMgJiYgdjMuVGV4dHVyZUNvb3JkaW5hdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnVhID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnViID0gdjIuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnVjID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnVkID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmEgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmIgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmMgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmQgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDFwMiBwMXAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKGRhdGEsIHYxLCB2MiwgdjEsIHYzLCBjb2xvciwgdGV4dHVyZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGEgPSBubDI7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEubmRvdGxiID0gbmwzO1xuICAgICAgICAgICAgICAgICAgICBkYXRhLm5kb3RsYyA9IG5sMTtcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5uZG90bGQgPSBubDM7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHYxLlRleHR1cmVDb29yZGluYXRlcyAmJiB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMgJiYgdjMuVGV4dHVyZUNvb3JkaW5hdGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnVhID0gdjIuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnViID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnVjID0gdjEuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnVkID0gdjMuVGV4dHVyZUNvb3JkaW5hdGVzLng7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmEgPSB2Mi5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmIgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmMgPSB2MS5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEudmQgPSB2My5UZXh0dXJlQ29vcmRpbmF0ZXMueTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIHNjYW4gcDJwMyBwMXAzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc1NjYW5MaW5lKGRhdGEsIHYyLCB2MywgdjEsIHYzLCBjb2xvciwgdGV4dHVyZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcihjYW1lcmE6IENhbWVyYSwgbWVzaGVzOiBNZXNoW10pIHtcbiAgICAgICAgLy8gZ2xtOjptYXQ0IENhbWVyYU1hdHJpeCA9IGdsbTo6bG9va0F0KFxuICAgICAgICAvLyAgICAgY2FtZXJhUG9zaXRpb24sIC8vIHRoZSBwb3NpdGlvbiBvZiB5b3VyIGNhbWVyYSwgaW4gd29ybGQgc3BhY2VcbiAgICAgICAgLy8gICAgIGNhbWVyYVRhcmdldCwgICAvLyB3aGVyZSB5b3Ugd2FudCB0byBsb29rIGF0LCBpbiB3b3JsZCBzcGFjZVxuICAgICAgICAvLyAgICAgdXBWZWN0b3IgICAgICAgIC8vIHByb2JhYmx5IGdsbTo6dmVjMygwLDEsMCksIGJ1dCAoMCwtMSwwKSB3b3VsZCBtYWtlIHlvdSBsb29raW5nIHVwc2lkZS1kb3duKOWAkue9riksIHdoaWNoIGNhbiBiZSBncmVhdCB0b29cbiAgICAgICAgLy8gKTtcbiAgICAgICAgY29uc3Qgdmlld01hdHJpeCA9IEJBQllMT04uTWF0cml4Lkxvb2tBdExIKGNhbWVyYS5wb3NpdGlvbiwgY2FtZXJhLnRhcmdldCwgbmV3IEJBQllMT04uVmVjdG9yMygwLCAxLjAsIDApKTtcblxuICAgICAgICAvLyBHZW5lcmF0ZXMgYSByZWFsbHkgaGFyZC10by1yZWFkIG1hdHJpeCwgYnV0IGEgbm9ybWFsLCBzdGFuZGFyZCA0eDQgbWF0cml4IG5vbmV0aGVsZXNzXG4gICAgICAgIC8vIGdsbTo6bWF0NCBwcm9qZWN0aW9uTWF0cml4ID0gZ2xtOjpwZXJzcGVjdGl2ZShcbiAgICAgICAgLy8gICAgICAvLyBUaGUgdmVydGljYWwgRmllbGQgb2YgVmlldywgaW4gcmFkaWFuczogdGhlIGFtb3VudCBvZiBcInpvb21cIi5cbiAgICAgICAgLy8gICAgICAvL1RoaW5rIFwiY2FtZXJhIGxlbnNcIi4gVXN1YWxseSBiZXR3ZWVuIDkwwrAgKGV4dHJhIHdpZGUpIGFuZCAzMMKwIChxdWl0ZSB6b29tZWQgaW4pXG4gICAgICAgIC8vICAgICBnbG06OnJhZGlhbnMoRm9WKSxcbiAgICAgICAgLy8gICAgICAvLyBBc3BlY3QgUmF0aW8uIERlcGVuZHMgb24gdGhlIHNpemUgb2YgeW91ciB3aW5kb3cuIE5vdGljZSB0aGF0IDQvMyA9PSA4MDAvNjAwID09IDEyODAvOTYwLFxuICAgICAgICAvLyAgICAgIC8vc291bmRzIGZhbWlsaWFyID9cbiAgICAgICAgLy8gICAgIDQuMGYgLyAzLjBmLFxuICAgICAgICAvLyAgICAgMC4xZiwgICAgICAgICAgICAgIC8vIE5lYXIgY2xpcHBpbmcgcGxhbmUuIEtlZXAgYXMgYmlnIGFzIHBvc3NpYmxlLCBvciB5b3UnbGwgZ2V0IHByZWNpc2lvbiBpc3N1ZXMuXG4gICAgICAgIC8vICAgICAxMDAuMGYgICAgICAgICAgICAgLy8gRmFyIGNsaXBwaW5nIHBsYW5lLiBLZWVwIGFzIGxpdHRsZSBhcyBwb3NzaWJsZS5cbiAgICAgICAgLy8gKTtcbiAgICAgICAgY29uc3QgcHJvamVjdE1hdHJpeCA9IEJBQllMT04uTWF0cml4LlBlcnNwZWN0aXZlRm92TEgoMS41LCB0aGlzLndvcmtpbmdXaWR0aCAvIHRoaXMud29ya2luZ0hlaWdodCwgMC4wMSwgMTAwLjApO1xuXG4gICAgICAgIGZvciAoY29uc3QgY01lc2ggb2YgbWVzaGVzKSB7XG4gICAgICAgICAgICBjb25zdCB3b3JsZE1hdHJpeCA9IEJBQllMT04uTWF0cml4LlJvdGF0aW9uWWF3UGl0Y2hSb2xsKFxuICAgICAgICAgICAgICAgIGNNZXNoLnJvdGF0aW9uLnksXG4gICAgICAgICAgICAgICAgY01lc2gucm90YXRpb24ueCxcbiAgICAgICAgICAgICAgICBjTWVzaC5yb3RhdGlvbi56LFxuICAgICAgICAgICAgKS5tdWx0aXBseShCQUJZTE9OLk1hdHJpeC5UcmFuc2xhdGlvbihjTWVzaC5wb3N0aW9uLngsIGNNZXNoLnBvc3Rpb24ueSwgY01lc2gucG9zdGlvbi56KSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybU1hdHJpeCA9IHdvcmxkTWF0cml4Lm11bHRpcGx5KHZpZXdNYXRyaXgpLm11bHRpcGx5KHByb2plY3RNYXRyaXgpO1xuXG4gICAgICAgICAgICAvKiogZHJhdyBwb2ludHMgKi9cbiAgICAgICAgICAgIC8vIGZvciAoY29uc3QgaW5kZXhWZXJ0ZXggb2YgY01lc2gudmVydGljZXMpIHtcbiAgICAgICAgICAgIC8vICAgICBjb25zdCBwcm9qZWN0UG9pbnQgPSB0aGlzLnByb2plY3QoaW5kZXhWZXJ0ZXgsIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5kcmF3UG9pbnQocHJvamVjdFBvaW50KTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgLyoqIGRyYXcgbGluZXMgKi9cbiAgICAgICAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgY01lc2gudmVydGljZXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICAvLyAgICAgY29uc3QgcG9pbnQwID0gdGhpcy5wcm9qZWN0KGNNZXNoLnZlcnRpY2VzW2ldLCB0cmFuc2Zvcm1NYXRyaXgpO1xuICAgICAgICAgICAgLy8gICAgIGNvbnN0IHBvaW50MSA9IHRoaXMucHJvamVjdChjTWVzaC52ZXJ0aWNlc1tpICsgMV0sIHRyYW5zZm9ybU1hdHJpeCk7XG4gICAgICAgICAgICAvLyAgICAgdGhpcy5kcmF3TGluZShwb2ludDAsIHBvaW50MSk7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8qKiBkcmF3IGZhY2VzICovXG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IHByZWZlci1mb3Itb2ZcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY01lc2guZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RmFjZSA9IGNNZXNoLmZhY2VzW2ldO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdmVydGV4QSA9IGNNZXNoLnZlcnRpY2VzW2N1cnJlbnRGYWNlLkFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZlcnRleEIgPSBjTWVzaC52ZXJ0aWNlc1tjdXJyZW50RmFjZS5CXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJ0ZXhDID0gY01lc2gudmVydGljZXNbY3VycmVudEZhY2UuQ107XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbEEgPSB0aGlzLnByb2plY3QodmVydGV4QSwgdHJhbnNmb3JtTWF0cml4LCB3b3JsZE1hdHJpeCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxCID0gdGhpcy5wcm9qZWN0KHZlcnRleEIsIHRyYW5zZm9ybU1hdHJpeCwgd29ybGRNYXRyaXgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsQyA9IHRoaXMucHJvamVjdCh2ZXJ0ZXhDLCB0cmFuc2Zvcm1NYXRyaXgsIHdvcmxkTWF0cml4KTtcblxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0xpbmUocGl4ZWxBLCBwaXhlbEIpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0xpbmUocGl4ZWxCLCBwaXhlbEMpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0xpbmUocGl4ZWxDLCBwaXhlbEEpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuZHJhd0JsaW5lKHBpeGVsQSwgcGl4ZWxCKTtcbiAgICAgICAgICAgICAgICAvLyB0aGlzLmRyYXdCbGluZShwaXhlbEIsIHBpeGVsQyk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3QmxpbmUocGl4ZWxDLCBwaXhlbEEpO1xuXG4gICAgICAgICAgICAgICAgLy8gY29uc3QgY29sb3I6IG51bWJlciA9IDAuMjUgKyAoKGkgJSBjTWVzaC5mYWNlcy5sZW5ndGgpIC8gY01lc2guZmFjZXMubGVuZ3RoKSAqIDAuNzU7XG4gICAgICAgICAgICAgICAgY29uc3QgY29sb3IgPSAxLjA7XG4gICAgICAgICAgICAgICAgLyoqIGRyYXcgdHJpYW5nbGUgKi9cbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdUcmlhbmdsZShwaXhlbEEsIHBpeGVsQiwgcGl4ZWxDLCBuZXcgQkFCWUxPTi5Db2xvcjQoY29sb3IsIGNvbG9yLCBjb2xvciwgMSksIGNNZXNoLnRleHR1cmUpO1xuXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYGRyYXcgJHt2ZXJ0ZXhBLnRvU3RyaW5nKCl9ICR7dmVydGV4Qi50b1N0cmluZygpfSAke3ZlcnRleEMudG9TdHJpbmcoKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKiDnu5jliLbnur/mnaEg5piv5LiA5LiqIOmAkuW9kue7mOWItui1t+Wni+eCuSAtIOS4remXtOeCuSAtIOe7k+adn+eCue+8iOaAu+WFsSAzIHBpeGVs77yJ55qE6L+H56iLICovXG4gICAgLy8gcHVibGljIGRyYXdMaW5lKHBvaW50MDogQkFCWUxPTi5WZWN0b3IyLCBwb2ludDE6IEJBQllMT04uVmVjdG9yMik6IHZvaWQge1xuICAgIC8vICAgICBjb25zdCBkaXN0ID0gcG9pbnQxLnN1YnRyYWN0KHBvaW50MCkubGVuZ3RoKCk7XG5cbiAgICAvLyAgICAgaWYgKGRpc3QgPCAyKSB7XG4gICAgLy8gICAgICAgICByZXR1cm47XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBjb25zdCBtaWRkbGVQb2ludCA9IHBvaW50MC5hZGQocG9pbnQxLnN1YnRyYWN0KHBvaW50MCkuc2NhbGUoMC41KSk7XG5cbiAgICAvLyAgICAgdGhpcy5kcmF3UG9pbnQobWlkZGxlUG9pbnQsIG5ldyBCQUJZTE9OLkNvbG9yNCgxLCAxLCAwLCAxKSk7XG5cbiAgICAvLyAgICAgdGhpcy5kcmF3TGluZShwb2ludDAsIG1pZGRsZVBvaW50KTtcbiAgICAvLyAgICAgdGhpcy5kcmF3TGluZShtaWRkbGVQb2ludCwgcG9pbnQxKTtcbiAgICAvLyB9XG5cbiAgICAvKipcbiAgICAgKiBbQnJlc2VuaGFtJ3NfbGluZV9hbGdvcml0aG1dKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0JyZXNlbmhhbSdzX2xpbmVfYWxnb3JpdGhtKVxuICAgICAqIOabtOW5s+a7keeahOe7mOWItue6v+adoeeahOeul+azlVxuICAgICAqL1xuICAgIC8vIHB1YmxpYyBkcmF3QmxpbmUocG9pbnQwOiBCQUJZTE9OLlZlY3RvcjIsIHBvaW50MTogQkFCWUxPTi5WZWN0b3IyLCBjb2xvcjogQkFCWUxPTi5Db2xvcjQpOiB2b2lkIHtcbiAgICAvLyAgICAgbGV0IHgwID0gcG9pbnQwLnggPj4gMDtcbiAgICAvLyAgICAgbGV0IHkwID0gcG9pbnQwLnkgPj4gMDtcbiAgICAvLyAgICAgY29uc3QgeDEgPSBwb2ludDEueCA+PiAwO1xuICAgIC8vICAgICBjb25zdCB5MSA9IHBvaW50MS55ID4+IDA7XG4gICAgLy8gICAgIGNvbnN0IGR4ID0gTWF0aC5hYnMoeDEgLSB4MCk7XG4gICAgLy8gICAgIGNvbnN0IGR5ID0gTWF0aC5hYnMoeTEgLSB5MCk7XG5cbiAgICAvLyAgICAgY29uc3Qgc3ggPSB4MCA8IHgxID8gMSA6IC0xO1xuICAgIC8vICAgICBjb25zdCBzeSA9IHkwIDwgeTEgPyAxIDogLTE7XG5cbiAgICAvLyAgICAgbGV0IGVyciA9IGR4IC0gZHk7XG5cbiAgICAvLyAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAvLyAgICAgICAgIHRoaXMuZHJhd1BvaW50KG5ldyBCQUJZTE9OLlZlY3RvcjIoeDAsIHkwKSwgY29sb3IpO1xuICAgIC8vICAgICAgICAgaWYgKHgwID09IHgxICYmIHkwID09IHkxKSB7XG4gICAgLy8gICAgICAgICAgICAgYnJlYWs7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgICAgICBjb25zdCBlMiA9IDIgKiBlcnI7XG4gICAgLy8gICAgICAgICBpZiAoZTIgPiAtZHkpIHtcbiAgICAvLyAgICAgICAgICAgICBlcnIgLT0gZHk7XG4gICAgLy8gICAgICAgICAgICAgeDAgKz0gc3g7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgICAgICBpZiAoZTIgPCBkeCkge1xuICAgIC8vICAgICAgICAgICAgIGVyciArPSBkeDtcbiAgICAvLyAgICAgICAgICAgICB5MCArPSBzeTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgfVxuICAgIC8vIH1cbn1cbiIsImltcG9ydCB7IE1hdGVyaWFsLCBNZXNoIH0gZnJvbSBcIi4vbWVzaFwiO1xuaW1wb3J0IHsgVGV4dHVyZSB9IGZyb20gXCIuL3RleHR1cmVcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRKU09ORmlsZUFzeW5jKGZpbGVOYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAocmVzdWx0OiBNZXNoW10pID0+IHZvaWQpOiB2b2lkIHtcbiAgICBsZXQganNvbk9iamVjdCA9IHt9O1xuICAgIGNvbnN0IHhtbEh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4bWxIdHRwLm9wZW4oXCJHRVRcIiwgZmlsZU5hbWUsIHRydWUpO1xuXG4gICAgeG1sSHR0cC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGlmICh4bWxIdHRwLnJlYWR5U3RhdGUgPT0gNCAmJiB4bWxIdHRwLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgIGpzb25PYmplY3QgPSBKU09OLnBhcnNlKHhtbEh0dHAucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIC8vIGNhbGxiYWNrKHRoaXMuY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdCkpO1xuICAgICAgICAgICAgY2FsbGJhY2soY3JlYXRlTWVzaGVzRnJvbUpTT04oanNvbk9iamVjdCkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHhtbEh0dHAuc2VuZChudWxsKTtcbn1cblxuLyoqIGh0dHBzOi8vZG9jLmJhYnlsb25qcy5jb20vcmVzb3VyY2VzL2ZpbGVfZm9ybWF0X21hcF8oLmJhYnlsb24pXG4gKiAganNvbiDmoLzlvI9cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1lc2hlc0Zyb21KU09OKGpzb25PYmplY3Q6IGFueSk6IE1lc2hbXSB7XG4gICAgY29uc3QgbWF0ZXJpYWxzOiB7IFtpZDogc3RyaW5nXTogTWF0ZXJpYWwgfSA9IHt9O1xuXG4gICAganNvbk9iamVjdC5tYXRlcmlhbHMuZm9yRWFjaCgobWF0ZXJpYWwpID0+IHtcbiAgICAgICAgbWF0ZXJpYWxzW21hdGVyaWFsLmlkXSA9IHtcbiAgICAgICAgICAgIElEOiBtYXRlcmlhbC5pZCxcbiAgICAgICAgICAgIG5hbWU6IG1hdGVyaWFsLm5hbWUsXG4gICAgICAgICAgICBkaWZmdXNlVGV4dHVyZU5hbWU6IG1hdGVyaWFsLmRpZmZ1c2VUZXh0dXJlLm5hbWUsXG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBjb25zdCBtZXNoZXM6IE1lc2hbXSA9IGpzb25PYmplY3QubWVzaGVzLm1hcCgobWVzaE9iamVjdCkgPT4ge1xuICAgICAgICBjb25zdCB2ZXJ0aWNlc0FycmF5OiBudW1iZXJbXSA9IG1lc2hPYmplY3QucG9zaXRpb25zO1xuICAgICAgICBpZiAoIXZlcnRpY2VzQXJyYXkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBGYWNlc1xuICAgICAgICBjb25zdCBpbmRpY2VzQXJyYXk6IG51bWJlcltdID0gbWVzaE9iamVjdC5pbmRpY2VzO1xuXG4gICAgICAgIGNvbnN0IG5vcm1hbHM6IG51bWJlcltdID0gbWVzaE9iamVjdC5ub3JtYWxzO1xuXG4gICAgICAgIGNvbnN0IHZlcnRpY2VzQ291bnQgPSB2ZXJ0aWNlc0FycmF5Lmxlbmd0aDtcblxuICAgICAgICBjb25zdCB1dnM6IG51bWJlcltdID0gbWVzaE9iamVjdC51dnM7XG5cbiAgICAgICAgLy8gbnVtYmVyIG9mIGZhY2VzIGlzIGxvZ2ljYWxseSB0aGUgc2l6ZSBvZiB0aGUgYXJyYXkgZGl2aWRlZCBieSAzIChBLCBCLCBDKVxuICAgICAgICBjb25zdCBmYWNlc0NvdW50ID0gaW5kaWNlc0FycmF5Lmxlbmd0aCAvIDM7XG4gICAgICAgIGNvbnN0IG1lc2ggPSBuZXcgTWVzaChtZXNoT2JqZWN0Lm5hbWUsIHZlcnRpY2VzQ291bnQsIGZhY2VzQ291bnQpO1xuXG4gICAgICAgIC8vIEZpbGxpbmcgdGhlIHZlcnRpY2VzIGFycmF5IG9mIG91ciBtZXNoIGZpcnN077yM5qC55o2ucG9zaXRpb24g5q+P5qyh5Y+W5LiJ5Liq5pS+5Yiw6aG254K55pWw5o2uXG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB2ZXJ0aWNlc0NvdW50IC8gMzsgKytpbmRleCkge1xuICAgICAgICAgICAgY29uc3QgeCA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzXTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSB2ZXJ0aWNlc0FycmF5W2luZGV4ICogMyArIDFdO1xuICAgICAgICAgICAgY29uc3QgeiA9IHZlcnRpY2VzQXJyYXlbaW5kZXggKiAzICsgMl07XG5cbiAgICAgICAgICAgIGNvbnN0IG54ID0gbm9ybWFsc1tpbmRleCAqIDNdO1xuICAgICAgICAgICAgY29uc3QgbnkgPSBub3JtYWxzW2luZGV4ICogMyArIDFdO1xuICAgICAgICAgICAgY29uc3QgbnogPSBub3JtYWxzW2luZGV4ICogMyArIDJdO1xuXG4gICAgICAgICAgICBtZXNoLnZlcnRpY2VzW2luZGV4XSA9IHtcbiAgICAgICAgICAgICAgICBjb29yZGluYXRlczogbmV3IEJBQllMT04uVmVjdG9yMyh4LCB5LCB6KSxcbiAgICAgICAgICAgICAgICBub3JtYWw6IG5ldyBCQUJZTE9OLlZlY3RvcjMobngsIG55LCBueiksXG4gICAgICAgICAgICAgICAgd29ybGRDb29yZGluYXRlczogbnVsbCxcbiAgICAgICAgICAgICAgICBUZXh0dXJlQ29vcmRpbmF0ZXM6IG5ldyBCQUJZTE9OLlZlY3RvcjIodXZzW2luZGV4ICogMl0sIHV2c1tpbmRleCAqIDIgKyAxXSksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhlbiBmaWxsaW5nIHRoZSBmYWNlcyBhcnJheSDmoLnmja7pnaLnmoTngrnntKLlvJXmlbDmja7vvIzmr4/mrKHlj5bkuInkuKog5pS+5YiwbWVzaOeahOmdouaVsOaNruS4reWOu1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmFjZXNDb3VudDsgKytpbmRleCkge1xuICAgICAgICAgICAgY29uc3QgYSA9IGluZGljZXNBcnJheVtpbmRleCAqIDNdO1xuICAgICAgICAgICAgY29uc3QgYiA9IGluZGljZXNBcnJheVtpbmRleCAqIDMgKyAxXTtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBpbmRpY2VzQXJyYXlbaW5kZXggKiAzICsgMl07XG5cbiAgICAgICAgICAgIG1lc2guZmFjZXNbaW5kZXhdID0ge1xuICAgICAgICAgICAgICAgIEE6IGEsXG4gICAgICAgICAgICAgICAgQjogYixcbiAgICAgICAgICAgICAgICBDOiBjLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldHRpbmcgdGhlIHBvc2l0aW9uIHlvdSd2ZSBzZXQgaW4gQmxlbmRlclxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IG1lc2hPYmplY3QucG9zaXRpb247XG4gICAgICAgIG1lc2gucG9zdGlvbiA9IG5ldyBCQUJZTE9OLlZlY3RvcjMocG9zaXRpb25bMF0sIHBvc2l0aW9uWzFdLCBwb3NpdGlvblsyXSk7XG5cbiAgICAgICAgaWYgKHV2cyAmJiB1dnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbWF0ZXJpYWxJRCA9IG1lc2hPYmplY3QubWF0ZXJpYWxJZDtcbiAgICAgICAgICAgIGlmIChtYXRlcmlhbHNbbWF0ZXJpYWxJRF0pIHtcbiAgICAgICAgICAgICAgICBtZXNoLnRleHR1cmUgPSBuZXcgVGV4dHVyZShtYXRlcmlhbHNbbWF0ZXJpYWxJRF0uZGlmZnVzZVRleHR1cmVOYW1lLCAyMDQ4LCAyMDQ4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtZXNoO1xuICAgIH0pO1xuICAgIHJldHVybiBtZXNoZXM7XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiYmFieWxvbi5tYXRoLnRzXCIvPlxuXG5pbXBvcnQgeyBDYW1lcmEgfSBmcm9tIFwiLi9jYW1lcmFcIjtcbmltcG9ydCB7IERldmljZSB9IGZyb20gXCIuL2RldmljZVwiO1xuaW1wb3J0IHsgbG9hZEpTT05GaWxlQXN5bmMgfSBmcm9tIFwiLi9sb2FkZXJcIjtcbmltcG9ydCB7IE1lc2gsIFZlcnRleCB9IGZyb20gXCIuL21lc2hcIjtcblxubGV0IGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG5sZXQgZGV2aWNlOiBEZXZpY2U7XG5sZXQgY2FtZXJhOiBDYW1lcmE7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGluaXQsIGZhbHNlKTtcblxuaW50ZXJmYWNlIERyYXdhYmxlIHtcbiAgICBtZXNoZXM6IE1lc2hbXTtcbn1cblxuY2xhc3MgUmFiYml0IGltcGxlbWVudHMgRHJhd2FibGUge1xuICAgIHB1YmxpYyBtZXNoZXM6IE1lc2hbXTtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBsb2FkSlNPTkZpbGVBc3luYyhcIi4vZGlzdC9yZXMvcmFiYml0LmJhYnlsb25cIiwgKG1lc2g6IE1lc2hbXSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNoZXMgPSBtZXNoO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIEN1YmUgaW1wbGVtZW50cyBEcmF3YWJsZSB7XG4gICAgcHVibGljIG1lc2hlczogTWVzaFtdID0gW107XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGNvbnN0IG1lc2ggPSBuZXcgTWVzaChcIkN1YmVcIiwgOCwgMTIpO1xuICAgICAgICB0aGlzLm1lc2hlcy5wdXNoKG1lc2gpO1xuICAgICAgICBtZXNoLnZlcnRpY2VzWzBdID0geyBjb29yZGluYXRlczogbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgMSksIG5vcm1hbDogbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgMSkgfTtcbiAgICAgICAgbWVzaC52ZXJ0aWNlc1sxXSA9IHsgY29vcmRpbmF0ZXM6IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgMSksIG5vcm1hbDogbmV3IEJBQllMT04uVmVjdG9yMygxLCAxLCAxKSB9O1xuICAgICAgICBtZXNoLnZlcnRpY2VzWzJdID0geyBjb29yZGluYXRlczogbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIDEpLCBub3JtYWw6IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAxKSB9O1xuICAgICAgICBtZXNoLnZlcnRpY2VzWzNdID0geyBjb29yZGluYXRlczogbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgMSksIG5vcm1hbDogbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgMSkgfTtcbiAgICAgICAgbWVzaC52ZXJ0aWNlc1s0XSA9IHsgY29vcmRpbmF0ZXM6IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIDEsIC0xKSwgbm9ybWFsOiBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAxLCAtMSkgfTtcbiAgICAgICAgbWVzaC52ZXJ0aWNlc1s1XSA9IHsgY29vcmRpbmF0ZXM6IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpLCBub3JtYWw6IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgLTEpIH07XG4gICAgICAgIG1lc2gudmVydGljZXNbNl0gPSB7IGNvb3JkaW5hdGVzOiBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIC0xLCAtMSksIG5vcm1hbDogbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgLTEpIH07XG4gICAgICAgIG1lc2gudmVydGljZXNbN10gPSB7IGNvb3JkaW5hdGVzOiBuZXcgQkFCWUxPTi5WZWN0b3IzKC0xLCAtMSwgLTEpLCBub3JtYWw6IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAtMSkgfTtcblxuICAgICAgICBtZXNoLmZhY2VzWzBdID0geyBBOiAwLCBCOiAxLCBDOiAyIH07XG4gICAgICAgIG1lc2guZmFjZXNbMV0gPSB7IEE6IDEsIEI6IDIsIEM6IDMgfTtcbiAgICAgICAgbWVzaC5mYWNlc1syXSA9IHsgQTogMSwgQjogMywgQzogNiB9O1xuICAgICAgICBtZXNoLmZhY2VzWzNdID0geyBBOiAxLCBCOiA1LCBDOiA2IH07XG4gICAgICAgIG1lc2guZmFjZXNbNF0gPSB7IEE6IDAsIEI6IDEsIEM6IDQgfTtcbiAgICAgICAgbWVzaC5mYWNlc1s1XSA9IHsgQTogMSwgQjogNCwgQzogNSB9O1xuXG4gICAgICAgIG1lc2guZmFjZXNbNl0gPSB7IEE6IDIsIEI6IDMsIEM6IDcgfTtcbiAgICAgICAgbWVzaC5mYWNlc1s3XSA9IHsgQTogMywgQjogNiwgQzogNyB9O1xuICAgICAgICBtZXNoLmZhY2VzWzhdID0geyBBOiAwLCBCOiAyLCBDOiA3IH07XG4gICAgICAgIG1lc2guZmFjZXNbOV0gPSB7IEE6IDAsIEI6IDQsIEM6IDcgfTtcbiAgICAgICAgbWVzaC5mYWNlc1sxMF0gPSB7IEE6IDQsIEI6IDUsIEM6IDYgfTtcbiAgICAgICAgbWVzaC5mYWNlc1sxMV0gPSB7IEE6IDQsIEI6IDYsIEM6IDcgfTtcblxuICAgICAgICAvLyBodHRwOi8vd3d3LndhaXRpbmdmeS5jb20vYXJjaGl2ZXMvNDI1XG4gICAgICAgIGZ1bmN0aW9uIGNhbEZhY2VOb3JtYWwocDA6IEJBQllMT04uVmVjdG9yMywgcDE6IEJBQllMT04uVmVjdG9yMywgcDI6IEJBQllMT04uVmVjdG9yMykge1xuICAgICAgICAgICAgY29uc3QgYSA9IHAwLnN1YnRyYWN0KHAxKTtcbiAgICAgICAgICAgIGNvbnN0IGIgPSBwMC5zdWJ0cmFjdChwMik7XG4gICAgICAgICAgICByZXR1cm4gYS5tdWx0aXBseShiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmYWNlTm9ybWFsID0gbWVzaC5mYWNlcy5tYXAoKGZhY2UpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZmFjZSxcbiAgICAgICAgICAgICAgICBub3JtYWw6IGNhbEZhY2VOb3JtYWwoXG4gICAgICAgICAgICAgICAgICAgIG1lc2gudmVydGljZXNbZmFjZS5BXS5jb29yZGluYXRlcyxcbiAgICAgICAgICAgICAgICAgICAgbWVzaC52ZXJ0aWNlc1tmYWNlLkJdLmNvb3JkaW5hdGVzLFxuICAgICAgICAgICAgICAgICAgICBtZXNoLnZlcnRpY2VzW2ZhY2UuQ10uY29vcmRpbmF0ZXMsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1lc2gudmVydGljZXMuZm9yRWFjaCgodmVydGV4OiBWZXJ0ZXgsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0ZUZhY2VOb3JtYWxCeVZlcnRleCA9IG1lc2guZmFjZXNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChmYWNlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmFjZS5BID09IGluZGV4IHx8IGZhY2UuQiA9PSBpbmRleCB8fCBmYWNlLkMgPT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5tYXAoKF8sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWNlTm9ybWFsW2luZGV4XS5ub3JtYWw7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHRtcCA9IEJBQllMT04uVmVjdG9yMy5aZXJvKCk7XG4gICAgICAgICAgICB2ZXJ0ZXgubm9ybWFsID0gcmVsYXRlRmFjZU5vcm1hbEJ5VmVydGV4XG4gICAgICAgICAgICAgICAgLnJlZHVjZSgocHJlLCBjdXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByZS5hZGQoY3VyKTtcbiAgICAgICAgICAgICAgICB9LCB0bXApXG4gICAgICAgICAgICAgICAgLnNjYWxlKDEgLyByZWxhdGVGYWNlTm9ybWFsQnlWZXJ0ZXgubGVuZ3RoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gbWVzaC5wb3N0aW9uLnggPSAtY2FudmFzLndpZHRoIC8gNDtcbiAgICAgICAgLy8gbWVzaC5wb3N0aW9uLnkgPSAtY2FudmFzLmhlaWdodCAvIDQ7XG4gICAgICAgIG1lc2gucG9zdGlvbi54ID0gMy4wO1xuICAgICAgICBtZXNoLnBvc3Rpb24ueSA9IDMuMDtcbiAgICB9XG59XG5cbmNsYXNzIE1vbmtleSBpbXBsZW1lbnRzIERyYXdhYmxlIHtcbiAgICBwdWJsaWMgbWVzaGVzOiBNZXNoW107XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGxvYWRKU09ORmlsZUFzeW5jKFwiLi9kaXN0L3Jlcy90ZXN0X21vbmtleS5iYWJ5bG9uXCIsIChtZXNoOiBNZXNoW10pID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzaGVzID0gbWVzaDtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5sZXQgZW50aXRpZXM6IERyYXdhYmxlW107XG5mdW5jdGlvbiBpbml0KCkge1xuICAgIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZnJvbnRCdWZmZXJcIikgYXMgSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgLy8gbWVzaCA9IG5ldyBTb2Z0RW5naW5lLk1lc2goXCJDdWJlXCIsIDgpO1xuXG4gICAgLy8gbWVzaGVzLnB1c2gobWVzaCk7XG5cbiAgICAvLyBtZXNoLnZlcnRpY2VzWzBdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1sxXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1syXSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoLTEsIC0xLCAxKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzNdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgLTEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzRdID0gbmV3IEJBQllMT04uVmVjdG9yMygtMSwgMSwgLTEpO1xuICAgIC8vIG1lc2gudmVydGljZXNbNV0gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDEsIDEsIC0xKTtcbiAgICAvLyBtZXNoLnZlcnRpY2VzWzZdID0gbmV3IEJBQllMT04uVmVjdG9yMygxLCAtMSwgMSk7XG4gICAgLy8gbWVzaC52ZXJ0aWNlc1s3XSA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMSwgLTEsIC0xKTtcblxuICAgIGVudGl0aWVzID0gW25ldyBDdWJlKCksIG5ldyBNb25rZXkoKV07XG5cbiAgICBjYW1lcmEgPSBuZXcgQ2FtZXJhKCk7XG4gICAgZGV2aWNlID0gbmV3IERldmljZShjYW52YXMpO1xuXG4gICAgY2FtZXJhLnBvc2l0aW9uID0gbmV3IEJBQllMT04uVmVjdG9yMygwLCAwLCAxMCk7XG4gICAgY2FtZXJhLnRhcmdldCA9IG5ldyBCQUJZTE9OLlZlY3RvcjMoMCwgMCwgMCk7XG5cbiAgICAvLyBjYW1lcmEucG9zaXRpb24gPSBuZXcgQkFCWUxPTi5WZWN0b3IzKDMyLCA5NSwgNDUpO1xuICAgIC8vIGNhbWVyYS50YXJnZXQgPSBuZXcgQkFCWUxPTi5WZWN0b3IzKC0wLjEzLCAzMSwgOCk7XG5cbiAgICAvLyBDYWxsaW5nIHRoZSBIVE1MNSByZW5kZXJpbmcgbG9vcFxuICAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3aW5nTG9vcCk7XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd2luZ0xvb3ApO1xufVxuXG5sZXQgcHJldmlvdXNEYXRlOiBudW1iZXIgPSAwO1xuZnVuY3Rpb24gZHJhd2luZ0xvb3AoKSB7XG4gICAgLy8gZnBzXG4gICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBjdXJyZW50RnBzID0gMTAwMC4wIC8gKG5vdyAtIHByZXZpb3VzRGF0ZSk7XG4gICAgcHJldmlvdXNEYXRlID0gbm93O1xuXG4gICAgLy8gY29uc29sZS5sb2coYCR7Y3VycmVudEZwcy50b1ByZWNpc2lvbigyKX0gZnBzYCk7XG5cbiAgICBkZXZpY2UuY2xlYXIoKTtcblxuICAgIC8vIHJvdGF0aW5nIHNsaWdodGx5IHRoZSBjdWJlIGR1cmluZyBlYWNoIGZyYW1lIHJlbmRlcmVkXG4gICAgZW50aXRpZXMuZm9yRWFjaCgoZW50aXR5KSA9PiB7XG4gICAgICAgIGlmIChlbnRpdHkubWVzaGVzICYmIGVudGl0eS5tZXNoZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZW50aXR5Lm1lc2hlcy5mb3JFYWNoKChtZXNoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gbWVzaC5yb3RhdGlvbi54ICs9IDAuMDE7XG4gICAgICAgICAgICAgICAgbWVzaC5yb3RhdGlvbi55ICs9IDAuMDE7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRldmljZS5yZW5kZXIoY2FtZXJhLCBlbnRpdHkubWVzaGVzKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRG9pbmcgdGhlIHZhcmlvdXMgbWF0cml4IG9wZXJhdGlvbnNcbiAgICAvLyBGbHVzaGluZyB0aGUgYmFjayBidWZmZXIgaW50byB0aGUgZnJvbnQgYnVmZmVyXG4gICAgZGV2aWNlLnByZXNlbnQoKTtcblxuICAgIC8vIENhbGxpbmcgdGhlIEhUTUw1IHJlbmRlcmluZyBsb29wIHJlY3Vyc2l2ZWx5XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGRyYXdpbmdMb29wKTtcbn1cblxuLyoqXG4gKiAgICAgICAgICAgIFlcbiAqICAgICAgICAgICAg4oaRXG4gKiAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgfFxuICogICAgICAgICAgICB8XG4gKiAgeCDihpAtLS0tLS0tLVxuICogICAgICAgICAgICAvT1xuICogICAgICAgICAgIC9cbiAqICAgICAgICAgIC9cbiAqICAgICAgIHog4oaZ77iOXG4gKiAgIOKGkOKGk+KGklxuICpcbiAqL1xuIiwiaW1wb3J0IHsgVGV4dHVyZSB9IGZyb20gXCIuL3RleHR1cmVcIjtcblxuLyoqXG4gKiBBLCBCLCBD55qE5YC85YiG5Yir5Li6IOeCuembhuWQiOS4reeahOe0ouW8leWAvFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZhY2Uge1xuICAgIEE6IG51bWJlcjtcbiAgICBCOiBudW1iZXI7XG4gICAgQzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZlcnRleCB7XG4gICAgbm9ybWFsOiBCQUJZTE9OLlZlY3RvcjM7IC8vIOWtmOWCqOeCueeahOazleWQkemHj++8jOWPr+S7peebtOaOpeS7jueOsOacieeahDNk5riy5p+T6L2v5Lu255qE5a+85Ye65paH5Lu25Lit6I635Y+WXG4gICAgY29vcmRpbmF0ZXM6IEJBQllMT04uVmVjdG9yMzsgLy8gbG9jYWxcbiAgICB3b3JsZENvb3JkaW5hdGVzPzogQkFCWUxPTi5WZWN0b3IzOyAvLyB3b3JsZFxuICAgIFRleHR1cmVDb29yZGluYXRlcz86IEJBQllMT04uVmVjdG9yMjtcbn1cblxuZXhwb3J0IGNsYXNzIE1lc2gge1xuICAgIHB1YmxpYyBwb3N0aW9uOiBCQUJZTE9OLlZlY3RvcjM7XG4gICAgcHVibGljIHJvdGF0aW9uOiBCQUJZTE9OLlZlY3RvcjM7XG4gICAgcHVibGljIHZlcnRpY2VzOiBWZXJ0ZXhbXTtcbiAgICBwdWJsaWMgZmFjZXM6IEZhY2VbXTtcbiAgICBwdWJsaWMgdGV4dHVyZT86IFRleHR1cmU7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbmFtZTogc3RyaW5nLCB2ZXJ0aWNlc0NvdW50OiBudW1iZXIsIGZhY2VzQ291bnQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLnZlcnRpY2VzID0gbmV3IEFycmF5KHZlcnRpY2VzQ291bnQpO1xuICAgICAgICB0aGlzLmZhY2VzID0gbmV3IEFycmF5KGZhY2VzQ291bnQpO1xuICAgICAgICB0aGlzLnJvdGF0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICAgICAgdGhpcy5wb3N0aW9uID0gQkFCWUxPTi5WZWN0b3IzLlplcm8oKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NhbkxpbmVEYXRhIHtcbiAgICBjdXJyZW50WTogbnVtYmVyO1xuICAgIG5kb3RsYTogbnVtYmVyO1xuICAgIG5kb3RsYjogbnVtYmVyO1xuICAgIG5kb3RsYzogbnVtYmVyO1xuICAgIG5kb3RsZDogbnVtYmVyO1xuXG4gICAgdWE/OiBudW1iZXI7XG4gICAgdWI/OiBudW1iZXI7XG4gICAgdWM/OiBudW1iZXI7XG4gICAgdWQ/OiBudW1iZXI7XG5cbiAgICB2YT86IG51bWJlcjtcbiAgICB2Yj86IG51bWJlcjtcbiAgICB2Yz86IG51bWJlcjtcbiAgICB2ZD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNYXRlcmlhbCB7XG4gICAgSUQ6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGlmZnVzZVRleHR1cmVOYW1lOiBzdHJpbmc7XG59XG4iLCJleHBvcnQgY2xhc3MgVGV4dHVyZSB7XG4gICAgcHVibGljIHdpZHRoOiBudW1iZXI7XG4gICAgcHVibGljIGhlaWdodDogbnVtYmVyO1xuICAgIHB1YmxpYyBpbnRlcm5hbEJ1ZmZlcjogSW1hZ2VEYXRhO1xuXG4gICAgY29uc3RydWN0b3IoZmlsZW5hbWU6IHN0cmluZywgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy5sb2FkKGZpbGVuYW1lKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbG9hZChmaWxlbmFtZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGltYWdlVGV4dHVyZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWFnZVRleHR1cmUuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgICAgIGltYWdlVGV4dHVyZS53aWR0aCA9IHRoaXMud2lkdGg7XG4gICAgICAgIGltYWdlVGV4dHVyZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcm5hbENhbnZhczogSFRNTENhbnZhc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgaW50ZXJuYWxDYW52YXMud2lkdGggPSB0aGlzLndpZHRoO1xuICAgICAgICAgICAgaW50ZXJuYWxDYW52YXMuaGVpZ2h0ID0gdGhpcy5oZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBpbnRlcm5hbENvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCA9IGludGVybmFsQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgICAgIGludGVybmFsQ29udGV4dC5kcmF3SW1hZ2UoaW1hZ2VUZXh0dXJlLCAwLCAwKTtcbiAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxCdWZmZXIgPSBpbnRlcm5hbENvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2VUZXh0dXJlLnNyYyA9IGZpbGVuYW1lO1xuICAgIH1cblxuICAgIC8vIFRha2VzIHRoZSBVICYgViBjb29yZGluYXRlcyBleHBvcnRlZCBieSBCbGVuZGVyXG4gICAgLy8gYW5kIHJldHVybiB0aGUgY29ycmVzcG9uZGluZyBwaXhlbCBjb2xvciBpbiB0ZXh0dXJlXG4gICAgcHVibGljIG1hcCh0dTogbnVtYmVyLCB0djogbnVtYmVyKTogQkFCWUxPTi5Db2xvcjQge1xuICAgICAgICBpZiAodGhpcy5pbnRlcm5hbEJ1ZmZlcikge1xuICAgICAgICAgICAgLy8gdXNpbmcgYSAlIG9wZXJhdG9yIHRvIGN5Y2xlL3JlcGVhdCB0aGUgdGV4dHVyZSBpZiBuZWVkZWRcbiAgICAgICAgICAgIGNvbnN0IHUgPSBNYXRoLmFicygodHUgKiB0aGlzLndpZHRoKSAlIHRoaXMud2lkdGgpID4+IDA7XG4gICAgICAgICAgICBjb25zdCB2ID0gTWF0aC5hYnMoKHR2ICogdGhpcy5oZWlnaHQpICUgdGhpcy5oZWlnaHQpID4+IDA7XG5cbiAgICAgICAgICAgIGNvbnN0IHBvcyA9ICh1ICsgdiAqIHRoaXMud2lkdGgpICogNDtcblxuICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuaW50ZXJuYWxCdWZmZXIuZGF0YVtwb3NdO1xuICAgICAgICAgICAgY29uc3QgZyA9IHRoaXMuaW50ZXJuYWxCdWZmZXIuZGF0YVtwb3MgKyAxXTtcbiAgICAgICAgICAgIGNvbnN0IGIgPSB0aGlzLmludGVybmFsQnVmZmVyLmRhdGFbcG9zICsgMl07XG4gICAgICAgICAgICBjb25zdCBhID0gdGhpcy5pbnRlcm5hbEJ1ZmZlci5kYXRhW3BvcyArIDNdO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJBQllMT04uQ29sb3I0KHIgLyAyNTUuMCwgZyAvIDI1NS4wLCBiIC8gMjU1LjAsIGEgLyAyNTUuMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJBQllMT04uQ29sb3I0KDEsIDEsIDEsIDEpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19
