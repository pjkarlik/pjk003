const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform float top;
uniform vec4 mouse;

#define R 			resolution
#define T			time
#define M           mouse

#define MAX_STEPS 	    100.
#define MAX_DIST	    20.
#define MIN_DIST	    .001

#define PI  		    3.1415
#define PI2 		    6.2831

float shorten = 1.36;
float density  = 13.;
float thickness =  0.045;

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
    float x = mouse.xy==vec2(0) ? -.5 :
    	(mouse.y / resolution.y * 1. - .5) * PI;
    float y = mouse.xy==vec2(0) ? .0 :
    	-(mouse.x / resolution.x * 1. - .5) * PI;
    float z = 0.0;

    ro.zy *= r2(x);
    ro.xz *= r2(y);
    return ro;
}
  
float get_truch(vec2 uv, float offset) {
    vec2 tile_uv = fract(uv) -.5;
    vec2 id = floor(uv);
    float n = hash(id);
    float checker = mod(id.y + id.x,2.) * 2. - 1.;
    if(n>.5)tile_uv.x *= -1.;

    vec2 cUv = tile_uv-sign(tile_uv.x+tile_uv.y+.001)*.5;
    float d = length(cUv);
    float thk = .15+.1*sin(offset+uv.y*.2);
    float mask = smoothstep(.01, -.01, abs(d-.5)-thk);
    return 1.-mask;
}

vec4 map(in vec3 p) {
    vec2 res = vec2(100.,0.);

    //@mla inversion
    float k = 12.0/dot(p,p); 
    p *= k;
  	
    p.z -= time *.25;
    vec3 pi = floor((p + 1.)/2.);
    vec3 tp = p+vec3(pi.y,0.,0.);
    float mask = get_truch(tp.xz*1.,p.y)/PI2;
    p.x +=1.;

    // tile coordinates
    p = mod(p+1.,2.) - 1.;

    float pole = min(length(p.yx-vec2(.0,0.)) - thickness, length(p.xz) - thickness);
    if(pole<res.x) res = vec2(pole,1.);

    float grnd  = min(length(p)-.15,length(p.y) - .015 + mask / PI2);
    if(grnd<res.x) res = vec2(grnd,3.);

    // compensate for the scaling that's been applied
    float mul = 1.0/k;
    float d = res.x * mul / shorten;
    return vec4(d,res.y, pi.xy);
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
    for (float i = 0.; i<85.;i++) {
        vec3 pos = ro + depth * rd;
        vec4 dist = map(pos);
        mate = dist.y;
        bi = dist.zw;
        if(dist.x<.0001*depth) break;
        depth += abs(dist.x*.65);
        if(depth>MAX_DIST) break;
    }
    return vec4(depth,mate,bi);
}
    
float get_reflect( in vec3 ro, in vec3 rd ) {
    float depth = 0.;
    for (float i = 0.; i<65.;i++) {
        vec3 pos = ro + depth * rd;
        vec4 dist = map(pos);
        if(dist.x<.0001*depth) break;
        depth += abs(dist.x*.75); 
        if(depth>MAX_DIST) break;
    }
    return depth;
}
    
float get_diff(vec3 p, vec3 lpos) {
    vec3 l = normalize(lpos-p);
    vec3 n = get_normal(p);
    float dif = clamp(dot(n,l),0. , 1.);
    float shadow = get_reflect(p + n * MIN_DIST * 2., l);
    if(shadow < length(p -  lpos)) {
       dif *= .1;
    }
    return dif;
}
    
vec3 get_color(float m){
    vec3 mate = vec3(.2);
    if(m==1.) mate = vec3(.5);
    if(m ==2.) mate = vec3(.05);
    if(m ==3.) mate = vec3(.2);
    return mate;
}
    
vec3 render( in vec3 ro, in vec3 rd, in vec2 uv) {
    vec3 color = vec3(0.0);
    vec3 fadeColor = vec3(.1,.15,.20);
    vec4 ray = get_ray(ro, rd);
    float t = ray.x;
    vec2 bi = ray.zw;
    if(t<MAX_DIST) {
        vec3 p = ro + t * rd;
        vec3 n = get_normal(p);
        vec3 tint = get_color(ray.y); 

        vec3 lpos1 = vec3(-.01, .5, .5);
        vec3 lpos2 = vec3(.01, 1.5, -.5);

        color += tint * vec3(2.25) * get_diff(p, lpos1) * get_diff(p, lpos2);
        
        if(ray.y==3.) {
            tint = hsv2rgb(vec3(p.y*.6+p.x*.75,1.,.5))*.5;
            vec3 rr=reflect(rd,n);
            float tm=get_reflect(p,rr);
            if(tm<MAX_DIST){
                p+=tm*rr;
                color += tint * vec3(.35) * get_diff(p, lpos1) *	get_diff(p, lpos2);
            }   
        }
    } 
    //iq - saw it in a tutorial once
    color = mix( color, fadeColor, 1.-exp(-0.029*t*t*t));
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

void main( void ) {
    vec3 color = vec3(0.);
    vec2 uv = (2. * gl_FragCoord.xy - resolution.xy )/resolution.y;

    vec3 lp = vec3(.0,.3,.0);
    float fp = (top*.005);
    vec3 ro = vec3(1.75+sin(fp/PI),1.5+cos(fp/PI),-2.);
    //vec3 ro = vec3(0.,.4,-4.15);

    ro.zy *= r2(.60);
    ro.xz *= r2(25.);

    //ro = get_mouse(ro);
    vec3 rd = ray(ro, lp, uv);
    color += render(ro, rd, uv);


    gl_FragColor = vec4(color,1.0);
}
`;

export default fragmentShader;
