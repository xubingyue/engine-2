namespace feng3d
{
    export type updaterenderDataFunc = (renderData: RenderAtomic) => void;

    export interface RenderDataHolderEventMap
    {
        /**
         * 渲染数据发生变化
         */
        renderdataChange: updaterenderDataFunc | updaterenderDataFunc[];
    }

    export interface RenderDataHolder
    {
        once<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: Event<RenderDataHolderEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof RenderDataHolderEventMap>(type: K, data?: RenderDataHolderEventMap[K], bubbles?: boolean);
        has<K extends keyof RenderDataHolderEventMap>(type: K): boolean;
        on<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: Event<RenderDataHolderEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof RenderDataHolderEventMap>(type?: K, listener?: (event: Event<RenderDataHolderEventMap[K]>) => any, thisObject?: any);
    }

    /**
	 * 渲染数据拥有者
	 * @author feng 2016-6-7
	 */
    export class RenderDataHolder extends EventDispatcher
    {
        get childrenRenderDataHolder()
        {
            return this._childrenRenderDataHolder;
        }
        private _childrenRenderDataHolder: RenderDataHolder[] = [];

		/**
		 * 创建GL数据缓冲
		 */
        constructor()
        {
            super();
        }

        addRenderDataHolder(renderDataHolder: RenderDataHolder)
        {
            if (!renderDataHolder) return;

            if (this._childrenRenderDataHolder.indexOf(renderDataHolder) != -1)
                return;

            this._childrenRenderDataHolder.push(renderDataHolder);
            renderDataHolder.on("renderdataChange", this.dispatchrenderdataChange, this);
            this.dispatch("renderdataChange", renderdatacollector.collectRenderDataHolderFuncs(renderDataHolder));
        }

        removeRenderDataHolder(renderDataHolder: RenderDataHolder)
        {
            var index = this._childrenRenderDataHolder.indexOf(renderDataHolder);
            if (index == -1)
                return;
            this._childrenRenderDataHolder.splice(index, 1);
            renderDataHolder.off("renderdataChange", this.dispatchrenderdataChange, this);
            this.dispatch("renderdataChange", renderdatacollector.clearRenderDataHolderFuncs(renderDataHolder));
        }

        private dispatchrenderdataChange(event: Event<any>)
        {
            this.dispatch(<any>event.type, event.data);
        }

        renderDatamap: {
            [key: string]: {
                setfunc: (renderData: RenderAtomic) => void;
                clearfunc: (renderData: RenderAtomic) => void;
            }
        } = {};

        /**
         * 
         * @param name          数据名称
         * @param setfunc       设置数据回调
         * @param clearfunc     清理数据回调
         */
        private renderdataChange(name: string, setfunc: updaterenderDataFunc, clearfunc: updaterenderDataFunc)
        {
            this.renderDatamap[name] = { setfunc: setfunc, clearfunc: clearfunc };
            this.dispatch("renderdataChange", setfunc);
        }

        createIndexBuffer(indices: Lazy<number[]>)
        {
            this.renderdataChange(
                "indices",
                (renderData: RenderAtomic) =>
                {
                    renderData.indexBuffer = renderData.indexBuffer || new Index();
                    renderData.indexBuffer.indices = indices;
                },
                (renderData: RenderAtomic) =>
                {
                    delete renderData.indexBuffer;
                });
        }

        createUniformData<K extends keyof LazyUniforms>(name: K, data: LazyUniforms[K])
        {
            this.renderdataChange(
                name,
                (renderData: RenderAtomic) => { renderData.uniforms[name] = data },
                (renderData: RenderAtomic) => { delete renderData.uniforms[name] }
            );
        }

        createAttributeRenderData<K extends keyof Attributes>(name: K, data: Lazy<number[]>, size = 3, divisor = 0)
        {
            //
            this.renderdataChange(name,
                (renderData: RenderAtomic) =>
                {
                    var attributeRenderData = renderData.attributes[name] = renderData.attributes[name] || new Attribute(name, data);
                    attributeRenderData.data = data;
                    attributeRenderData.size = size;
                    attributeRenderData.divisor = divisor;
                },
                (renderData: RenderAtomic) =>
                {
                    delete renderData.attributes[name];
                });
        }

        createvertexCode(vertexCode: string)
        {
            this.renderdataChange("vertexCode",
                (renderData: RenderAtomic) =>
                {
                    if (renderData.shader.vertexCode == vertexCode)
                        return;
                    renderData.shader.vertexCode = vertexCode;
                    renderData.shader.invalidate();
                },
                (renderData: RenderAtomic) =>
                {
                    renderData.shader.vertexCode = null;
                    renderData.shader.invalidate();
                }
            );
        }

        createfragmentCode(fragmentCode: string)
        {
            this.renderdataChange("fragmentCode",
                (renderData: RenderAtomic) =>
                {
                    if (renderData.shader.fragmentCode == fragmentCode)
                        return;
                    renderData.shader.fragmentCode = fragmentCode;
                    renderData.shader.invalidate();
                },
                (renderData: RenderAtomic) =>
                {
                    renderData.shader.fragmentCode = null;
                    renderData.shader.invalidate();
                }
            );
        }

        createValueMacro<K extends keyof ValueMacros>(name: K, value: number)
        {
            this.renderdataChange(name,
                (renderData: RenderAtomic) =>
                {
                    if (renderData.shader.macro.valueMacros[name] == value)
                        return;
                    renderData.shader.macro.valueMacros[name] = value;
                    renderData.shader.invalidate();
                },
                (renderData: RenderAtomic) =>
                {
                    delete renderData.shader.macro.valueMacros[name];
                    renderData.shader.invalidate();
                }
            );
        }

        createBoolMacro<K extends keyof BoolMacros>(name: K, value: boolean)
        {
            this.renderdataChange(name,
                (renderData: RenderAtomic) =>
                {
                    if (renderData.shader.macro.boolMacros[name] == value)
                        return;
                    renderData.shader.macro.boolMacros[name] = value;
                    renderData.shader.invalidate();
                },
                (renderData: RenderAtomic) =>
                {
                    delete renderData.shader.macro.boolMacros[name];
                    renderData.shader.invalidate();
                }
            );
        }

        createAddMacro<K extends keyof IAddMacros>(name: K, value: number)
        {
            this.renderdataChange(name,
                (renderData: RenderAtomic) =>
                {
                    if (renderData.shader.macro.addMacros[name] == value)
                        return;
                    renderData.shader.macro.addMacros[name] = value;
                    renderData.shader.invalidate();
                },
                (renderData: RenderAtomic) =>
                {
                    delete renderData.shader.macro.addMacros[name];
                    renderData.shader.invalidate();
                }
            );
        }

        createInstanceCount(value: number | (() => number))
        {
            this.renderdataChange(name,
                (renderData: RenderAtomic) => { renderData.instanceCount = value; },
                (renderData: RenderAtomic) => { delete renderData.instanceCount; }
            );
        }

        createShaderParam<K extends keyof RenderParams>(name: K, value: RenderParams[K])
        {
            this.renderdataChange(name,
                (renderData: RenderAtomic) =>
                {
                    renderData.renderParams[name] = value;
                },
                (renderData: RenderAtomic) =>
                {
                    delete renderData.renderParams[name];
                }
            );
        }
    }
}