## attributes

- a_position; 顶点数据
- a_norma; 法线数据
- a_uv; uv数据

## uniforms

- u_projectionMatrix; 和 camera.projectionMatrix 相等
- u_modelViewMatrix;  和 object.worldMatrix * camera.viewMatrix
- u_color; 颜色
- u_opacity; 透明度


## defines

- USE_TEXTURE; 是否使用纹理
- DRAW_TEXT_SYMBOL; 是否渲染文字
