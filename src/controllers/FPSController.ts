namespace feng3d
{
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    export class FPSController extends ControllerBase
    {
        /**
         * 按键记录
         */
        private keyDownDic: { [key: string]: boolean } = {};

        /**
         * 按键方向字典
         */
        private keyDirectionDic = {};

        /**
         * 加速度
         */
        private acceleration = 0.05;

        /**
         * 速度
         */
        private velocity: Vector3D;

        /**
         * 上次鼠标位置
         */
        private preMousePoint: Point;

        constructor(transform: GameObject = null)
        {
            super(transform);
            this.init();
        }

        get targetObject(): GameObject
        {
            return this._targetObject;
        }

        set targetObject(value: GameObject)
        {
            if (this._targetObject != null)
            {
                Event.off(input, <any>inputType.MOUSE_DOWN, this.onMousedown, this);
                Event.off(input, <any>inputType.MOUSE_UP, this.onMouseup, this);
            }
            this._targetObject = value;
            if (this._targetObject != null)
            {
                Event.on(input, <any>inputType.MOUSE_DOWN, this.onMousedown, this);
                Event.on(input, <any>inputType.MOUSE_UP, this.onMouseup, this);
            }
        }

        private onMousedown()
        {
            this.preMousePoint = null;
            this.velocity = new Vector3D();
            this.keyDownDic = {};

            Event.on(input, <any>inputType.KEY_DOWN, this.onKeydown, this);
            Event.on(input, <any>inputType.KEY_UP, this.onKeyup, this);
            Event.on(input, <any>inputType.MOUSE_MOVE, this.onMouseMove, this);
            Event.on(ticker, <any>"enterFrame", this.onEnterFrame, this);
        }

        private onMouseup()
        {
            Event.off(input, <any>inputType.KEY_DOWN, this.onKeydown, this);
            Event.off(input, <any>inputType.KEY_UP, this.onKeyup, this);
            Event.off(input, <any>inputType.MOUSE_MOVE, this.onMouseMove, this);
            Event.off(ticker, <any>"enterFrame", this.onEnterFrame, this);
        }

        private onEnterFrame()
        {
            this.update();
        }

        /**
         * 初始化
         */
        private init()
        {
            this.keyDirectionDic["a"] = new Vector3D(-1, 0, 0);//左
            this.keyDirectionDic["d"] = new Vector3D(1, 0, 0);//右
            this.keyDirectionDic["w"] = new Vector3D(0, 0, 1);//前
            this.keyDirectionDic["s"] = new Vector3D(0, 0, -1);//后
            this.keyDirectionDic["e"] = new Vector3D(0, 1, 0);//上
            this.keyDirectionDic["q"] = new Vector3D(0, -1, 0);//下
        }

        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate = true): void
        {
            if (this.targetObject == null)
                return;

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
            var right = this.targetObject.transform.rightVector;
            var up = this.targetObject.transform.upVector;
            var forward = this.targetObject.transform.forwardVector;
            right.scaleBy(this.velocity.x);
            up.scaleBy(this.velocity.y);
            forward.scaleBy(this.velocity.z);
            //计算位移
            var displacement = right.clone();
            displacement.incrementBy(up);
            displacement.incrementBy(forward);
            this.targetObject.transform.x += displacement.x;
            this.targetObject.transform.y += displacement.y;
            this.targetObject.transform.z += displacement.z;
        }

        /**
         * 处理鼠标移动事件
         */
        private onMouseMove(event: EventVO<any>)
        {
            if (this.targetObject == null)
                return;

            var mousePoint = new Point(input.clientX, input.clientY);

            if (this.preMousePoint == null)
            {
                this.preMousePoint = mousePoint;
                return;
            }
            //计算旋转
            var offsetPoint = mousePoint.subtract(this.preMousePoint)
            offsetPoint.x *= 0.15;
            offsetPoint.y *= 0.15;
            // this.targetObject.transform.rotate(Vector3D.X_AXIS, offsetPoint.y, this.targetObject.transform.position);
            // this.targetObject.transform.rotate(Vector3D.Y_AXIS, offsetPoint.x, this.targetObject.transform.position);

            var matrix3d = this.targetObject.transform.localToWorldMatrix;
            matrix3d.appendRotation(matrix3d.right, offsetPoint.y, matrix3d.position);
            var up = Vector3D.Y_AXIS;
            if (matrix3d.up.dotProduct(up) < 0)
            {
                up = up.clone();
                up.scaleBy(-1);
            }
            matrix3d.appendRotation(up, offsetPoint.x, matrix3d.position);
            this.targetObject.transform.localToWorldMatrix = matrix3d;
            //
            this.preMousePoint = mousePoint;
        }

        /**
		 * 键盘按下事件
		 */
        private onKeydown(event: EventVO<any>): void
        {
            var inputEvent: InputEvent = event.data;
            var boardKey = String.fromCharCode(inputEvent.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;

            if (!this.keyDownDic[boardKey])
                this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
            this.keyDownDic[boardKey] = true;
        }

		/**
		 * 键盘弹起事件
		 */
        private onKeyup(event: EventVO<any>): void
        {
            var inputEvent: InputEvent = event.data;
            var boardKey = String.fromCharCode(inputEvent.keyCode).toLocaleLowerCase();
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