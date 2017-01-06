precision mediump float;

varying vec2 v_uv;
varying vec3 v_globalPosition;
varying vec3 v_normal;

uniform mat4 u_cameraMatrix;
//基本颜色
uniform vec3 u_baseColor;

#include<modules/pointLightShading.declare>

void main(void) {

    vec4 finalColor = u_baseColor;
    
    //渲染灯光
    #include<modules/pointLightShading.main>

    gl_FragColor = finalColor;
}