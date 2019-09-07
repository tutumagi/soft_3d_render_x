import { Material, Mesh } from "./mesh";
import { Texture } from "./texture";

export function loadJSONFileAsync(fileName: string, callback: (result: Mesh[]) => void): void {
    let jsonObject = {};
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", fileName, true);

    xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            jsonObject = JSON.parse(xmlHttp.responseText);
            // callback(this.createMeshesFromJSON(jsonObject));
            callback(createMeshesFromJSON(jsonObject));
        }
    };

    xmlHttp.send(null);
}

/** https://doc.babylonjs.com/resources/file_format_map_(.babylon)
 *  json 格式
 */
export function createMeshesFromJSON(jsonObject: any): Mesh[] {
    const materials: { [id: string]: Material } = {};

    jsonObject.materials.forEach((material) => {
        materials[material.id] = {
            ID: material.id,
            name: material.name,
            diffuseTextureName: material.diffuseTexture.name,
        };
    });

    const meshes: Mesh[] = jsonObject.meshes.map((meshObject) => {
        const verticesArray: number[] = meshObject.positions;
        if (!verticesArray) {
            return;
        }
        // Faces
        const indicesArray: number[] = meshObject.indices;

        const normals: number[] = meshObject.normals;

        const verticesCount = verticesArray.length;

        const uvs: number[] = meshObject.uvs;

        // number of faces is logically the size of the array divided by 3 (A, B, C)
        const facesCount = indicesArray.length / 3;
        const mesh = new Mesh(meshObject.name, verticesCount, facesCount);

        // Filling the vertices array of our mesh first，根据position 每次取三个放到顶点数据
        for (let index = 0; index < verticesCount / 3; ++index) {
            const x = verticesArray[index * 3];
            const y = verticesArray[index * 3 + 1];
            const z = verticesArray[index * 3 + 2];

            const nx = normals[index * 3];
            const ny = normals[index * 3 + 1];
            const nz = normals[index * 3 + 2];

            mesh.vertices[index] = {
                coordinates: new BABYLON.Vector3(x, y, z),
                normal: new BABYLON.Vector3(nx, ny, nz),
                worldCoordinates: null,
                TextureCoordinates: new BABYLON.Vector2(uvs[index * 2], uvs[index * 2 + 1]),
            };
        }

        // then filling the faces array 根据面的点索引数据，每次取三个 放到mesh的面数据中去
        for (let index = 0; index < facesCount; ++index) {
            const a = indicesArray[index * 3];
            const b = indicesArray[index * 3 + 1];
            const c = indicesArray[index * 3 + 2];

            mesh.faces[index] = {
                A: a,
                B: b,
                C: c,
            };
        }

        // Getting the position you've set in Blender
        const position = meshObject.position;
        mesh.postion = new BABYLON.Vector3(position[0], position[1], position[2]);

        if (uvs && uvs.length > 0) {
            const materialID = meshObject.materialId;
            if (materials[materialID]) {
                mesh.texture = new Texture(materials[materialID].diffuseTextureName, 2048, 2048);
            }
        }

        return mesh;
    });
    return meshes;
}
