const fragmentShader = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec2 resolution;
uniform float time;
uniform float top;
uniform vec4 mouse;

#define R 			resolution
#define T			time
#define M           mouse

#define MAX_DIST 	25.0
#define MIN_DIST 	.001

#define PI          3.1415926535
#define PI2         6.2831853070

#define hue(a) .425 + .45 * cos(PI2 * a * vec3(1.15,.55,.25) * vec3(.97,.98,.975))

mat2 r2(float a){ 
    float c = cos(a); float s = sin(a); 
    return mat2(c, s, -s, c); 
}

void Alef(inout vec4 p, float scale, float Fold, float m)  
{
	p.xyz = abs(p.xyz + Fold) - abs(p.xyz - Fold) - p.xyz;

	float rr = dot(p.xyz, p.xyz);
	if (rr < m)
	{
		p = p / (m + 0.000001);
	}
	else
	{
		if (rr < 1.0)
			p /= rr;
	}
	p *= scale;
}

void Camex(inout vec4 p, float Scale, float k1, float k2, float k3) 	
{
	vec3 CScale = vec3(k1, k2, k3);
	if (p.x < p.y) p.xy = p.yx;
	p.x = -p.x;
	if (p.x > p.y) p.xy = p.yx;
	p.x = -p.x;
	if (p.x < p.z) p.xz = p.zx;
	p.x = -p.x;
	if (p.x > p.z) p.xz = p.zx;
	p.x = -p.x;

	p.xyz = p.xyz*Scale - (Scale - 1.0)*CScale;

	p.w *= abs(float(Scale));
}


// Poly_Fold
void Dalet(inout vec4 p, float order) 	
{
	float m = order;
	float angle = round(m*(-atan(float(p.x), float(p.y)))) / m;
	p.xy *= r2(angle);	
}
//
void Dalet(inout vec4 p, float order, float rot)
{
	if(rot<0.15)
		p = p.zyxw; //return Dalet(p.zyxw, order);
	else if(rot<0.35)
		p = p.xzyw; //return Dalet(p.xzyw, order);
	else if(rot>0.85)
		p = p.yzxw; //return Dalet(p.yzxw, order);
	else if(rot>0.65)
		p= p.yxzw; //return Dalet(p.yxzw, order);

	Dalet(p, order);
}


vec3 getMouse( vec3 ro ) {
    float x = M.xy==vec2(0) ? .0:-(M.y/R.y*1.-.5) * PI;
    float y = M.xy==vec2(0) ? .0: (M.x/R.x*1.-.5) * PI;
    ro.zy *= r2(x);
    ro.zx *= r2(y);
    return ro;
}

//http://mercury.sexy/hg_sdf/
float vmax(vec3 v) {
    return max(max(v.x, v.y), v.z);
}
float fBox(vec3 p, vec3 b, float r) {
    vec3 d = abs(p) - b;
    return length(max(d, vec3(0))) + vmax(min(d, vec3(0)))-r;
}

vec2 pMod2(inout vec2 p, float size) {
    float halfsize = size*0.5;
    vec2 c = floor((p + halfsize)/size);
    p = mod(p + halfsize, size) - halfsize;
    return c;
}

// lazy globals
vec3 g_hp,s_hp,g_bid,s_bid;
float g_hsh,s_hsh,travelSpeed,glow;
float ga1,ga2,ga3,ga4,ga5,ga6;
mat2 r60;
float size = 4.;

vec2 sdform(in vec3 pos) {
    vec4 P = vec4(pos.xzy, 1.0);
    float orbits = 0.;
    
    for(int i = 0; i < 4; i++) {
        Alef(P, .75, .075, .08);
        orbits = max(length(P.y)/PI,orbits);

        if(i == 2) {
            P.xyz += (vec3(.5, .5, .5) - .5)*.5;
            // amt - angle
            Dalet(P, 24., .0);
        }
    } 
    Alef(P, 0.355, .175, .275);
    
    Camex(P, 2., .0, .0, .75);
    orbits = max(length(P.z)/PI,orbits);
    
    float ln = (length(vec2(P.x,P.y))-.5735)/P.w;
    
    return vec2(ln,orbits);
    
}
float zoom = 12.75; 
vec2 map (in vec3 p, float sg) {
    vec2 res = vec2(MAX_DIST,0.);

    //@mla inversion
    float k = 8.0/dot(p,p); 
    p *= k;
    p.xy-=1.;
    p.xy*=r60;
   // p.z+=travelSpeed;

    vec2 id = pMod2(p.xz,size);
    vec2 f = sdform(p);
    if(f.x<res.x) {
        res = vec2(f.x,1.);
        g_hsh = f.y;
    }
  
    float sp=length(p.zy-vec2(.5,1.))-.05;
    sp=min(length(p.xz-vec2(.5,1.))-.05,sp);
    if(sg>0.) glow+=.005/(.025+sp*sp);
    //if(sp<res.x)res=vec2(sp,2.);

    
    // compensate for the scaling that's been applied
    float mul = 1.0/k;
    float d = res.x * mul / 1.06;
    return vec2(d,res.y);
}

vec2 marcher( in vec3 ro, in vec3 rd, int maxstep , float sg) {
    float t = 0.,m = 0.;
    for( int i=0; i<maxstep; i++ ) {
        vec2 d = map(ro + rd * t, sg);
        m = d.y;
        if(abs(d.x)<MIN_DIST*t) break;
        t += i < 128 ? i < 32 ? d.x*.15 : d.x*.45 : d.x * .95;
        if(t>MAX_DIST) {
            t=1e5;
            break;
            }
    }
    return vec2(t,m);
}

// @Shane Tetrahedral normal function.
vec3 getNormal(in vec3 p, float t) {
    // This is an attempt to improve compiler time by contriving a break.
    const vec2 h = vec2(1.,-1.)*.5773;
    vec3 n = vec3(0);
    vec3[4] e4 = vec3[4](h.xyy, h.yyx, h.yxy, h.xxx);
    for(int i = min(0, 0); i<4; i++){
	    n += e4[i]*map(p + e4[i]*t*MIN_DIST, 0.).x;
            if(n.x>1e8) break; // Fake non-existing conditional break.
    }
    return normalize(n);
}

// softshadow www.pouet.net
// http://www.pouet.net/topic.php?which=7931
float softshadow( vec3 ro, vec3 rd, float mint, float maxt, float k ){
    float res = 1.0;
    for( float t=mint; t < maxt; ){
        float h = map(ro + rd*t, 0.).x;
        if( h<0.001 ) return 0.2;
        res = min( res, k*h/t );
        t += h;
    }
    return res+0.2;
}

vec3 getSpec(vec3 p, vec3 n, vec3 l, vec3 ro) {
    vec3 spec = vec3(0.);
    float strength = 0.75;
    vec3 view = normalize(p - ro);
    vec3 ref = reflect(l, n);
    float specValue = pow(max(dot(view, ref), 0.), 32.);
    return spec + strength * specValue;
}
//AO @jeyko
//#define ао(a) smoothstep(0.,1.,map(p + n*a,1.).x/a)
float calcAO(in vec3 p, in vec3 n){
    float fc = .025,nd = .015;
    return map(p + n*nd,0.).x/nd*map(p + n*fc,0.).x/fc; 
}

vec3 getColor(float m, in vec3 n) {
    vec3 h = vec3(0.95);
    float mnum = mod(floor(s_hsh*10.25),5.);
    if(m==1.) h = hue(27.+19.*sin(mnum*.5));
    return h;
}

void main() {

    r60 = r2(time*.1);
    travelSpeed = time * .28;
    
    vec2 U = (2.*gl_FragCoord.xy-R.xy)/max(R.x,R.y);

    vec3 ro = vec3(0,0,zoom-(top*.00215)),
         lp = vec3(0,0,0);
             
    // uncomment to look around
    ro = getMouse(ro);
    
    vec3 cf = normalize(lp-ro),
         cp = vec3(0.,1.,0.),
         cr = normalize(cross(cp, cf)),
         cu = normalize(cross(cf, cr)),
         c = ro + cf * .675,
         i = c + U.x * cr + U.y * cu,
         rd = i-ro;

    vec3 C = vec3(0);
    vec3 FC= vec3(.001);

    // trace dat map
    vec2 ray = marcher(ro,rd,400, 1.);
    s_hp=g_hp;
    s_hsh=g_hsh;

    if(ray.x<MAX_DIST) {
        vec3 p = ro+ray.x*rd,
             n = getNormal(p,ray.x);   
        vec3 lpos = vec3( 1., 8., 3.);
        vec3 ll = normalize(lpos);
        vec3 lp = normalize(lpos-p);
        
        vec3 h = getColor(ray.y,n);
        //float shadow = softshadow(p + n * MIN_DIST, lpos, .0, 64., 32.);     
        float diff = 1.*clamp(dot(n,lp),.0 , 1.);
        vec3 spec = getSpec(p,n,ll,ro);
        float ao = calcAO(p,n);
        
        C = h * (diff + spec);

    } 

    C = mix( C, FC, 1.-exp(-.00095*ray.x*ray.x*ray.x));
    C += mix(vec3(0),hue(27.+19.*sin(s_hsh*.5)),vec3(glow*.65));
    fragColor = vec4(pow(C, vec3(0.4545)),1.0);
}
`;

export default fragmentShader;
