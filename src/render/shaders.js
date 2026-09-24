export const vs = `attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;uniform mat4 uVP;uniform vec3 uOffset;uniform vec2 uRot;varying vec3 vN;varying vec3 vC;varying float vY;void main(){vec3 p=vec3(uRot.x*aP.x+uRot.y*aP.z,aP.y,-uRot.y*aP.x+uRot.x*aP.z)+uOffset;vY=p.y;gl_Position=uVP*vec4(p,1.);vN=vec3(uRot.x*aN.x+uRot.y*aN.z,aN.y,-uRot.y*aN.x+uRot.x*aN.z);vC=aC;}`;

export const fs = `precision mediump float;varying vec3 vN;varying vec3 vC;varying float vY;uniform float uAlpha;uniform float uLit;void main(){vec3 n=normalize(vN);float key=max(dot(n,normalize(vec3(-.5,1.,.8))),0.);float fill=max(dot(n,normalize(vec3(.75,.4,-.55))),0.);float shade=.53+.35*key+.18*fill;shade=mix(1.,shade,uLit);vec3 c=vC*shade;gl_FragColor=vec4(c,uAlpha);}`;

export function shader(gl, type, s) {
  let x = gl.createShader(type);
  gl.shaderSource(x, s);
  gl.compileShader(x);
  if (!gl.getShaderParameter(x, gl.COMPILE_STATUS))
    throw Error(gl.getShaderInfoLog(x));
  return x;
}

export function initProgram(gl) {
  let prog = gl.createProgram();
  gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  return prog;
}
