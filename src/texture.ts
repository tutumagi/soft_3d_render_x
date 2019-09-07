export class Texture {
    public width: number;
    public height: number;
    public internalBuffer: ImageData;

    constructor(filename: string, width: number, height: number) {
        this.width = width;
        this.height = height;
        this.load(filename);
    }

    public load(filename: string) {
        const imageTexture = new Image();
        imageTexture.height = this.height;
        imageTexture.width = this.width;
        imageTexture.onload = () => {
            const internalCanvas: HTMLCanvasElement = document.createElement("canvas");
            internalCanvas.width = this.width;
            internalCanvas.height = this.height;
            const internalContext: CanvasRenderingContext2D = internalCanvas.getContext("2d");
            internalContext.drawImage(imageTexture, 0, 0);
            this.internalBuffer = internalContext.getImageData(0, 0, this.width, this.height);
        };
        imageTexture.src = filename;
    }

    // Takes the U & V coordinates exported by Blender
    // and return the corresponding pixel color in texture
    public map(tu: number, tv: number): BABYLON.Color4 {
        if (this.internalBuffer) {
            // using a % operator to cycle/repeat the texture if needed
            const u = Math.abs((tu * this.width) % this.width) >> 0;
            const v = Math.abs((tv * this.height) % this.height) >> 0;

            const pos = (u + v * this.width) * 4;

            const r = this.internalBuffer.data[pos];
            const g = this.internalBuffer.data[pos + 1];
            const b = this.internalBuffer.data[pos + 2];
            const a = this.internalBuffer.data[pos + 3];

            return new BABYLON.Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
        } else {
            return new BABYLON.Color4(1, 1, 1, 1);
        }
    }
}
