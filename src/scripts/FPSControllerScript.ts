namespace feng3d
{
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    export class FPSControllerScript extends Script
    {
        /**
         * 加速度
         */
        @oav()
        public acceleration: number;

        /**
         * 按键记录
         */
        private keyDownDic: { [key: string]: boolean };

        /**
         * 按键方向字典
         */
        private keyDirectionDic;

        /**
         * 速度
         */
        private velocity: Vector3D;

        /**
         * 上次鼠标位置
         */
        private preMousePoint: Point | null;

        private ischange = false;

        private _auto: boolean;
        get auto()
        {
            return this._auto;
        }
        set auto(value)
        {
            if (this._auto == value)
                return;
            if (this._auto)
            {
                windowEventProxy.off("mousedown", this.onMousedown, this);
                windowEventProxy.off("mouseup", this.onMouseup, this);
                this.onMouseup();
            }
            this._auto = value;
            if (this._auto)
            {
                windowEventProxy.on("mousedown", this.onMousedown, this);
                windowEventProxy.on("mouseup", this.onMouseup, this);
            }
        }

        init(gameobject: GameObject)
        {
            super.init(gameobject);

            this.keyDirectionDic = {};
            this.keyDirectionDic["a"] = new Vector3D(-1, 0, 0);//左
            this.keyDirectionDic["d"] = new Vector3D(1, 0, 0);//右
            this.keyDirectionDic["w"] = new Vector3D(0, 0, 1);//前
            this.keyDirectionDic["s"] = new Vector3D(0, 0, -1);//后
            this.keyDirectionDic["e"] = new Vector3D(0, 1, 0);//上
            this.keyDirectionDic["q"] = new Vector3D(0, -1, 0);//下

            this.keyDownDic = {};
            this.acceleration = 0.0005

            this.auto = true;
            this.enabled = true;
        }

        onMousedown()
        {
            this.ischange = true;

            this.preMousePoint = null;
            this.mousePoint = null;
            this.velocity = new Vector3D();
            this.keyDownDic = {};

            windowEventProxy.on("keydown", this.onKeydown, this);
            windowEventProxy.on("keyup", this.onKeyup, this);
            windowEventProxy.on("mousemove", this.onMouseMove, this);
        }

        onMouseup()
        {
            this.ischange = false;
            this.preMousePoint = null;
            this.mousePoint = null;

            windowEventProxy.off("keydown", this.onKeydown, this);
            windowEventProxy.off("keyup", this.onKeyup, this);
            windowEventProxy.off("mousemove", this.onMouseMove, this);
        }

        /**
         * 销毁
         */
        dispose()
        {
            this.auto = false;
        }

        /**
         * 手动应用更新到目标3D对象
         */
        update(): void
        {
            if (!this.ischange)
                return;

            if (this.mousePoint && this.preMousePoint)
            {
                //计算旋转
                var offsetPoint = this.mousePoint.subtract(this.preMousePoint)
                offsetPoint.x *= 0.15;
                offsetPoint.y *= 0.15;
                // this.targetObject.transform.rotate(Vector3D.X_AXIS, offsetPoint.y, this.targetObject.transform.position);
                // this.targetObject.transform.rotate(Vector3D.Y_AXIS, offsetPoint.x, this.targetObject.transform.position);

                var matrix3d = this.transform.localToWorldMatrix;
                matrix3d.appendRotation(matrix3d.right, offsetPoint.y, matrix3d.position);
                var up = Vector3D.Y_AXIS;
                if (matrix3d.up.dotProduct(up) < 0)
                {
                    up = up.clone();
                    up.scaleBy(-1);
                }
                matrix3d.appendRotation(up, offsetPoint.x, matrix3d.position);
                this.transform.localToWorldMatrix = matrix3d;
                //
                this.preMousePoint = this.mousePoint;
                this.mousePoint = null;
            }

            //计算加速度
            var accelerationVec = new Vector3D();
            for (var key in this.keyDirectionDic)
            {
                if (this.keyDownDic[key] == true)
                {
                    var element = this.keyDirectionDic[key];
                    accelerationVec.incrementBy(element);
                }
            }
            accelerationVec.scaleBy(this.acceleration);
            //计算速度
            this.velocity.incrementBy(accelerationVec);
            var right = this.transform.rightVector;
            var up = this.transform.upVector;
            var forward = this.transform.forwardVector;
            right.scaleBy(this.velocity.x);
            up.scaleBy(this.velocity.y);
            forward.scaleBy(this.velocity.z);
            //计算位移
            var displacement = right.clone();
            displacement.incrementBy(up);
            displacement.incrementBy(forward);
            this.transform.x += displacement.x;
            this.transform.y += displacement.y;
            this.transform.z += displacement.z;
        }
        private mousePoint: Point | null;
        /**
         * 处理鼠标移动事件
         */
        private onMouseMove(event: MouseEvent)
        {
            this.mousePoint = new Point(event.clientX, event.clientY);

            if (this.preMousePoint == null)
            {
                this.preMousePoint = this.mousePoint;
                this.mousePoint = null;
            }
        }

        /**
		 * 键盘按下事件
		 */
        private onKeydown(event: KeyboardEvent): void
        {
            var boardKey = String.fromCharCode(event.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;

            if (!this.keyDownDic[boardKey])
                this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
            this.keyDownDic[boardKey] = true;
        }

		/**
		 * 键盘弹起事件
		 */
        private onKeyup(event: KeyboardEvent): void
        {
            var boardKey = String.fromCharCode(event.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;

            this.keyDownDic[boardKey] = false;
            this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
        }

        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        private stopDirectionVelocity(direction: Vector3D)
        {
            if (direction == null)
                return;
            if (direction.x != 0)
            {
                this.velocity.x = 0;
            }
            if (direction.y != 0)
            {
                this.velocity.y = 0;
            }
            if (direction.z != 0)
            {
                this.velocity.z = 0;
            }
        }
    }
}