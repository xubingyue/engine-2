namespace feng3d
{

    export interface Texture2DRaw extends TextureInfoRaw
    {
        __class__?: "feng3d.Texture2D",
        url?: string,
    }

    export var imageDatas = {
        black: ImageUtil.createImageData(1, 1, ColorKeywords.black),
        white: ImageUtil.createImageData(1, 1, ColorKeywords.white),
        red: ImageUtil.createImageData(1, 1, ColorKeywords.red),
        green: ImageUtil.createImageData(1, 1, ColorKeywords.green),
        blue: ImageUtil.createImageData(1, 1, ColorKeywords.blue),
        defaultNormal: ImageUtil.createImageData(1, 1, 0x8080ff),
    }

    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    export class Texture2D extends TextureInfo
    {
        protected _pixels: HTMLImageElement;

        @serialize
        @watch("urlChanged")
        @oav({ componentParam: { dragparam: { accepttype: "image" }, textEnabled: false } })
        url = "";

        /**
         * 纹理尺寸
         */
        get size()
        {
            if (!this._pixels) new Vector2(1, 1);
            return new Vector2(this._pixels.width, this._pixels.height);
        }

        constructor(raw?: Texture2DRaw)
        {
            super(raw);
            this._textureType = TextureType.TEXTURE_2D;
            this.noPixels = this.noPixels || imageDatas.white;
        }

        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData()
        {
            if (!this._pixels)
                return false;

            if (!this._pixels.width || !this._pixels.height)
                return false;

            return true;
        }

        private urlChanged()
        {
            var url = this.url;
            assets.loadImage(url, (img) =>
            {
                if (url == this.url)
                {
                    this._pixels = img;
                    this.invalidate();
                }
            });
        }
    }
}