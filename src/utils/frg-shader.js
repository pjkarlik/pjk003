const fragmentShader = `
  precision highp float;

  uniform vec2 resolution;
  uniform float time;
  uniform float top;
  uniform vec4 mouse;

  #define MAX_DIST	75.
  #define MIN_DIST	.001

  #define PI  		3.14159
  #define PI2 		6.28318
  
  #define R			resolution
  #define T			time
  #define M			mouse

  #define rot(a) mat2(cos(a),sin(a),-sin(a),cos(a))
  #define n2(an) vec2(sin(an),cos(an))
  #define hash(a, b) fract(sin(a*1.2664745 + b*.9560333 + 3.) * 14958.5453)

  vec3 hsv2rgb( in vec3 c ) {
    vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),6.)-3.)-1., 0., 1.);
    return c.z * mix(vec3(1.), rgb, c.y);
  }

  mat2 r2(float a){ 
    float c = cos(a); float s = sin(a); 
    return mat2(c, s, -s, c); 
  }

  float circle(vec2 pt, vec2 center, float r, float lw) {
    float len = length(pt - center),
          hlw = lw / 2.,
          edge = .01;
    return smoothstep(r-hlw-edge,r-hlw, len)-smoothstep(r+hlw,r+hlw+edge, len);
  }

  vec3 gethue(float a){return .5 + .45*cos(PI*a + vec3(4.5,.75, 1.25));}
  
  float orbit = 0.;
  
  vec2 map(vec3 z0) {
      float Tm = sin(.0006);
      vec4 z = vec4(z0,1.95);
      
      for (int n = 0; n < 6; n++) {
          z.xyz=clamp(z.xyz, -Tm, Tm)*2.0-z.xyz;
          z*=Tm/max(dot(z.xyz, z.xyz), 0.035*Tm);
      }
      orbit = log2(z.w*.1);
      float d = length(max(abs(z.xyz)-vec3(.1,.0035,.001),0.0))/z.w;
      return vec2(d/.5,orbit);
  }

  vec2 marcher(vec3 ro, vec3 rd, int maxsteps) {
    float d = 0.,
            m =-1.;
      for(int i=0;i<178;i++){
          vec2 t = map( ro + d * rd);
      if(abs(t.x)<d*.001||d>40.) break;
          d += t.x *.75;
          m  = t.y;
      }
      return vec2(d,m);
  }
  
  vec3 getNormal(vec3 p, float t) {
     t *= .0002;
      vec2 e = vec2(t,0.);
      vec3 n = vec3(
          map(p+e.xyy).x-map(p-e.xyy).x,
          map(p+e.yxy).x-map(p-e.yxy).x,
          map(p+e.yyx).x-map(p-e.yyx).x
          );
      return normalize(n);
  }

float getDiff(vec3 p, vec3 n, vec3 lpos) {
  vec3 l = normalize(lpos-p);
  float diff = clamp(dot(n,l),0. , 1.);    
  //float shadow = marcher(p + n * .0001 * 2., l,128).x;
  //if(shadow < length(p -  lpos)) diff *= .15;
  return diff;
}

vec3 getColor(vec3 p, vec3 n) {
  vec3 diff =  vec3(.8) * vec3(getDiff(p, n, vec3(-0., .1, -.5)));
       diff += vec3(.7) * vec3(getDiff(p, n, vec3(0., .5, 1.5)));
       diff += vec3(.6) * vec3(getDiff(p, n, vec3(1., 1., 1.)));
  return diff;
}

vec3 camera(vec3 lp, vec3 ro, vec2 uv) {
vec3 cf = normalize(lp-ro),
     cr = normalize(cross(vec3(0,1,0),cf)),
       cu = normalize(cross(cf,cr)),
       c  = ro + cf * .7, //zoom
       i  = c + uv.x * cr + uv.y * cu,
       rd = i - ro;
  return rd;
}

vec3 getColor(float m) {
  vec3 h = vec3(0.);
     h = gethue(m*.25);
  if(m>7.15  && m<7.65) h=vec3(1.);
  if(m>8.  && m<8.1) h=vec3(1.);
  if(m>.0  && m<.5) h=vec3(1.);
  if(m>-.1  && m<-.05) h=vec3(1.);
  if(m>-2.4 && m<-1.75) h=vec3(1.);
  if(m>-4.8 && m<-2.75) h=vec3(1.);
  if(m>-6.  && m<-5.75) h=vec3(1.);
  if(m>-9.  && m<-8.75) h=vec3(1.);
  if(m>-8.5  && m<-6.75) h=vec3(1.);
 return h;
}

void main() {
  // Normalized pixel coordinates (from 0 to 1)
  vec2 uv = (2.*gl_FragCoord.xy-R.xy)/max(R.x,R.y);
  vec2 dv = uv-T*.03;
vec3 C = vec3(0.);

  float zoom = .00000001+pow((1.-(top*.0005)),5.);   

  vec3 lp = vec3(0.,0.,0.),
       ro = vec3(0.,0.,zoom);

  ro.zx *=r2(.12*sin(T*.16));
  ro.yz *=r2(.45+.15*sin(T*.12));

  vec3 rd = camera(lp, ro, uv);
  vec2 d = marcher(ro, rd, 256);
  float t = d.x;
float m = d.y;
  vec3 fc = vec3(.02);
 if (d.x<100.) {
      vec3 p = ro + rd * t,
           n = getNormal(p,t);
      vec3 diff = getColor(p,n);
      vec3 h = getColor(m);
      C+= diff * h;
      
      vec2 ref;
      vec3 rr=reflect(rd,n);
      // only portions of the object
      // to have reflective surface
      // based on the returned orbit
      // number
       if(
          (m>7.15  && m<7.65 )||
          (m>8.    && m<8.1 ) ||
     (m>.0    && m<.5  ) ||
          (m>-2.4  && m<-1.75)||
          (m>-4.8  && m<-2.75)||
          (m>-6.   && m<-5.75)||
          (m>-8.5  && m<-6.75)
       )
      {
          ref=marcher(p,rr,256);
          if(ref.x<30.){
              p+=ref.x*rr;
              n =getNormal(rr, ref.x);
              diff = getColor(rr,n);
              h = getColor(ref.y);
          C+= diff * h;
          }

      }
  }

 
vec3 cir = fc+circle(fract(dv*25.),vec2(0.5),.5,.05)*.035;
  vec3 FC = mix( C, cir, smoothstep(.84,.94,t*.05));
  C = mix( C, FC, 1.-exp(-0.00025*t*t*t));
  //C *=vec3(texture(iChannel0,uv/.85)).x;
  // Output to screen
  gl_FragColor = vec4(pow(C, vec3(0.4545)),1.);
}
`;

export default fragmentShader;
