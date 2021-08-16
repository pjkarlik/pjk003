const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float top;
uniform vec4 mouse;

#define MAX_DIST	  	15.
#define MIN_DIST	  	.001

#define PI  		    3.14159
#define PI2 		    6.28318

mat2 r2(float a){ 
    float c = cos(a); float s = sin(a); 
    return mat2(c, s, -s, c); 
}
float hash(vec2 p) {
      p = fract(p*vec2(931.733,354.285));
      p += dot(p,p+39.37);
      return fract(p.x*p.y);
}

vec3 hsv2rgb( in vec3 c ) {
    vec3 rgb = clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),6.)-3.)-1., 0., 1.);
    return c.z * mix(vec3(1.), rgb, c.y);
}

vec3 get_mouse(vec3 ro) {
    float x = mouse.xy==vec2(0) ? .0 :
        -(mouse.y / resolution.y * 1. - .5) * PI;
    float y = mouse.xy==vec2(0) ? .0 :
        -(mouse.x / resolution.x * 1. - .5) * PI;
    float z = 0.0;

    ro.zy *= r2(x);
    ro.xz *= r2(y);
    return ro;
}

float sdTorus( vec3 p, vec2 t) {
  vec2 q = vec2(length(p.yz)-t.x,p.x);
  return length(q)-t.y;
}

float shorten = 1.16;
float density  = 24.;

vec4 map(in vec3 p) {
    float space = 4.;
    float hlf = space/2.;
    float seperation = 5.;
    float shlf = seperation/2.;
    float thx = .3;
    
    float lpscale = floor(density)/PI;
    vec2 res = vec2(100.,0.);

	  p.xy *=r2(time*.05);

    // forward log-spherical map
    float r = length(p);
    p = vec3(log(r), acos(p.x / length(p)), atan(p.y, p.z));
    // scaling factor to compensate for pinching at the poles
    float xshrink = 1.0/(abs(p.y-PI)) + 1.0/(abs(p.y)) - 1.0/PI;
    // fit in the ]-pi,pi] interval
    p *= lpscale;
    
    p.x -= top*2.;
    
	// id coordinates
    
    vec3 pi = floor((p + hlf)/space);
    p = vec3(
        mod(p.x+shlf,seperation) - shlf,
        mod(p.y+hlf,space) - hlf,
        mod(p.z+hlf,space) - hlf
        );
    p.x *= xshrink;
    
    float n = hash(pi.zy);
    float checker = mod(pi.y + pi.z,2.) * 2. - 1.;
    if(n>.5)p.z *= -1.;

    thx = .45;
    
  	float rings = min(
      sdTorus(p-vec3(0.,hlf,hlf),vec2(hlf,thx)),
      sdTorus(p-vec3(0.,-hlf,-hlf),vec2(hlf,thx))
    );
    if(rings<res.x) res = vec2(rings,1.);
    
    // compensate for the scaling that's been applied
    float mul = r/lpscale/xshrink;
    float d = res.x * mul / shorten;
    //float d = res.x;
    return vec4(d,res.y, pi.xz);
}

vec3 get_normal(in vec3 p) {
float d = map(p).x;
    vec2 e = vec2(.01,.0);
    vec3 n = d - vec3(
      map(p-e.xyy).x,
      map(p-e.yxy).x,
      map(p-e.yyx).x
    );
    return normalize(n);
}

vec4 get_ray( in vec3 ro, in vec3 rd ) {
float depth = 0.;
    float mate = 0.;
    float m = 0.;
    vec2 bi = vec2(3.);
    for (float i = 0.; i<100.;i++) {
        vec3 pos = ro + depth * rd;
        vec4 dist = map(pos);
        mate = dist.y;
        bi = dist.zw;
        if(dist.x<.001*depth) break;
        depth += abs(dist.x*.75); // hate this but helps edge distortions
        if(depth>MAX_DIST) {
          depth = MAX_DIST;
          break;
        } 
    }
    return vec4(depth,mate,bi);
}

vec4 get_ref( in vec3 ro, in vec3 rd ) {
    float depth = 0.;
    vec3 pos;
    float m = -1.;
    vec2 bi = vec2(0.);
    for (float i = 0.; i<60.;i++) {
        pos = ro + depth * rd;
        vec4 dist = map(pos);
        if(dist.x<.001*depth) break;
        depth += abs(dist.x*.75);
        m = dist.y;
        bi = dist.zw;
        if(depth>MAX_DIST) {
            depth = MAX_DIST;
            break;
        } 
    }
    return vec4(depth,m,bi);
}

float get_diff(vec3 p, vec3 lpos) {
    vec3 l = normalize(lpos-p);
    vec3 n = get_normal(p);
    float dif = clamp(dot(n,l),0. , 1.);
    float shadow = get_ref(p + n * MIN_DIST * 2., l).x;
    if(shadow < length(p -  lpos)) {
       dif *= .1;
    }
    return dif;
}

vec3 get_color(float m, vec2 bi){
    vec3 mate = vec3(.2);
    if(m==1.) mate = hsv2rgb(vec3(.25+bi.x*.1,1.,.5));
   
    if(m ==2.) mate = hsv2rgb(vec3(bi.x*.1,1.,.5)); 
    if(m ==3.) mate = vec3(1.1,1.3,1.3);
    return mate;
}

vec3 render( in vec3 ro, in vec3 rd, in vec2 uv) {
    vec3 color = vec3(.0);
    vec3 fadeColor = vec3(.05,.12,.18);
    vec4 ray = get_ray(ro, rd);
    float t = ray.x;
    vec2 bi = ray.zw;
    if(t<MAX_DIST) {
        vec3 p = ro + t * rd;
        vec3 n = get_normal(p);
        vec3 tint = get_color(ray.y,ray.zw); 
        vec3 lpos1 = vec3(-3.0, 5., 3.5);
        vec3 lpos2 = vec3(.0,0.,7.15);

        vec3 diff = vec3(1.5) * get_diff(p, lpos1) * get_diff(p, lpos2);
        float bnc_dif = clamp( .5 + .5 * dot(n,vec3(0.,-1.,0.)), 0.,1.);

        vec3 rdiff = vec3(0.);
        if(ray.y==21.) {
            vec3 rr=reflect(rd,n);
            vec4 tm=get_ref(p,rr);
            if(tm.x<MAX_DIST){
                p+=tm.x*rr;
                rdiff = get_color(tm.y, tm.zw) * get_diff(p, lpos1) * get_diff(p, lpos2);
            }   
        }
    	color = (tint +  bnc_dif)  * (diff + rdiff*.5);
    } 
    //@iq - basics you know..
    color = mix( color, fadeColor, 1.-exp(-0.0015*t*t*t));
    return pow(color, vec3(0.4545));
}

vec3 ray( in vec3 ro, in vec3 lp, in vec2 uv ) {
    vec3 cf = normalize(lp-ro);
    vec3 cp = vec3(0.,1.,0.);
    vec3 cr = normalize(cross(cp, cf));
    vec3 cu = normalize(cross(cf, cr));
    vec3 c = ro + cf * .87;
    vec3 i = c + uv.x * cr + uv.y * cu;
    return i-ro; 
}

void main( ) {
    vec2 uv = (2.*gl_FragCoord.xy-resolution.xy)/
        max(resolution.x,resolution.y);

      vec3 lp = vec3(0.,0.,0.);
      vec3 ro = vec3(.0,0.,7.15);
  
      //ro = get_mouse(ro);
  
      vec3 rd = ray(ro, lp, uv);
      vec3 col = render(ro, rd, uv);
      gl_FragColor = vec4(col,1.0);
}
`;

export default fragmentShader;
