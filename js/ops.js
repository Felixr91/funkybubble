"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Math=Ops.Math || {};
Ops.Anim=Ops.Anim || {};
Ops.Patch=Ops.Patch || {};
Ops.Sidebar=Ops.Sidebar || {};
Ops.WebAudio=Ops.WebAudio || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const fpsLimit=op.inValue("FPS Limit",0);
const trigger=op.outTrigger("trigger");
const width=op.outValue("width");
const height=op.outValue("height");
const reduceLoadingFPS=op.inValueBool("Reduce FPS loading");
const clear=op.inValueBool("Clear",true);
const clearAlpha=op.inValueBool("ClearAlpha",true);
const fullscreen=op.inValueBool("Fullscreen Button",false);
const active=op.inValueBool("Active",true);
const hdpi=op.inValueBool("Hires Displays",false);

op.onAnimFrame=render;
hdpi.onChange=function()
{
    if(hdpi.get()) op.patch.cgl.pixelDensity=window.devicePixelRatio;
        else op.patch.cgl.pixelDensity=1;

    op.patch.cgl.updateSize();
    if(CABLES.UI) gui.setLayout();
};

active.onChange=function()
{
    op.patch.removeOnAnimFrame(op);

    if(active.get())
    {
        op.setUiAttrib({"extendTitle":""});
        op.onAnimFrame=render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({"extendTitle":"Inactive"});
    }

};

var cgl=op.patch.cgl;
var rframes=0;
var rframeStart=0;

if(!op.patch.cgl) op.uiAttr( { 'error': 'No webgl cgl context' } );

var identTranslate=vec3.create();
vec3.set(identTranslate, 0,0,0);
var identTranslateView=vec3.create();
vec3.set(identTranslateView, 0,0,-2);

fullscreen.onChange=updateFullscreenButton;
setTimeout(updateFullscreenButton,100);
var fsElement=null;

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if(fsElement)fsElement.style.display="block";
    }

    function onMouseLeave()
    {
        if(fsElement)fsElement.style.display="none";
    }

    op.patch.cgl.canvas.addEventListener('mouseleave', onMouseLeave);
    op.patch.cgl.canvas.addEventListener('mouseenter', onMouseEnter);

    if(fullscreen.get())
    {
        if(!fsElement)
        {
            fsElement = document.createElement('div');

            var container = op.patch.cgl.canvas.parentElement;
            if(container)container.appendChild(fsElement);

            fsElement.addEventListener('mouseenter', onMouseEnter);
            fsElement.addEventListener('click', function(e)
            {
                if(CABLES.UI && !e.shiftKey) gui.cycleRendererSize();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding="10px";
        fsElement.style.position="absolute";
        fsElement.style.right="5px";
        fsElement.style.top="5px";
        fsElement.style.width="20px";
        fsElement.style.height="20px";
        fsElement.style.cursor="pointer";
        fsElement.style['border-radius']="40px";
        fsElement.style.background="#444";
        fsElement.style["z-index"]="9999";
        fsElement.style.display="none";
        fsElement.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 490 490" style="width:20px;height:20px;" xml:space="preserve" width="512px" height="512px"><g><path d="M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z" fill="#FFFFFF"/><path d="M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z" fill="#FFFFFF"/><path d="M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z" fill="#FFFFFF"/><path d="M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z" fill="#FFFFFF"/></g></svg>';
    }
    else
    {
        if(fsElement)
        {
            fsElement.style.display="none";
            fsElement.remove();
            fsElement=null;
        }
    }
}

fpsLimit.onChange=function()
{
    op.patch.config.fpsLimit=fpsLimit.get()||0;
};

op.onDelete=function()
{
    cgl.gl.clearColor(0,0,0,0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

op.patch.loading.setOnFinishedLoading(function(cb)
{
    op.patch.config.fpsLimit=fpsLimit.get();
});


function render(time)
{
    if(!active.get())return;
    if(cgl.aborted || cgl.canvas.clientWidth===0 || cgl.canvas.clientHeight===0)return;

    if(op.patch.loading.getProgress()<1.0 && reduceLoadingFPS.get())
    {
        op.patch.config.fpsLimit=5;
    }

    if(cgl.canvasWidth==-1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if(cgl.canvasWidth!=width.get() || cgl.canvasHeight!=height.get())
    {
        width.set(cgl.canvasWidth);
        height.set(cgl.canvasHeight);
    }

    if(CABLES.now()-rframeStart>1000)
    {
        CGL.fpsReport=CGL.fpsReport||[];
        if(op.patch.loading.getProgress()>=1.0 && rframeStart!==0)CGL.fpsReport.push(rframes);
        rframes=0;
        rframeStart=CABLES.now();
    }
    CGL.MESH.lastShader=null;
    CGL.MESH.lastMesh=null;

    cgl.renderStart(cgl,identTranslate,identTranslateView);

    if(clear.get())
    {
        cgl.gl.clearColor(0,0,0,1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if(CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if(CGL.Texture.previewTexture)
    {
        if(!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer=new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    if(clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if(!cgl.frameStore.phong)cgl.frameStore.phong={};
    rframes++;
};











};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ImageCompose
// 
// **************************************************************

Ops.Gl.TextureEffects.ImageCompose = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const render=op.inTrigger("render");
// const useVPSize=op.addInPort(new CABLES.Port(op,"use viewport size",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
const useVPSize=op.inBool("use viewport size");
const width=op.inValueInt("width");
const height=op.inValueInt("height");

const tfilter=op.inSwitch("filter",['nearest','linear','mipmap'],"linear");
const twrap=op.inValueSelect("wrap",['clamp to edge','repeat','mirrored repeat']);
const fpTexture=op.inValueBool("HDR");

const trigger=op.outTrigger("trigger");
const texOut=op.outTexture("texture_out");

const bgAlpha=op.inValueSlider("Background Alpha",1);
const outRatio=op.outValue("Aspect Ratio");

op.setPortGroup("Texture Size",[useVPSize,width,height]);
op.setPortGroup("Texture Settings",[twrap,tfilter,fpTexture]);



const cgl=op.patch.cgl;
texOut.set(CGL.Texture.getEmptyTexture(cgl));
var effect=null;
var tex=null;

var w=8,h=8;
var prevViewPort=[0,0,0,0];
var reInitEffect=true;

var bgFrag=''
    .endl()+'uniform float a;'
    .endl()+'void main()'
    .endl()+'{'
    .endl()+'   outColor= vec4(0.0,0.0,0.0,a);'
    .endl()+'}';
var bgShader=new CGL.Shader(cgl,'imgcompose bg');
bgShader.setSource(bgShader.getDefaultVertexShader(),bgFrag);
var uniBgAlpha=new CGL.Uniform(bgShader,'f','a',bgAlpha);

var selectedFilter=CGL.Texture.FILTER_LINEAR;
var selectedWrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

function initEffect()
{
    if(effect)effect.delete();
    if(tex)tex.delete();

    effect=new CGL.TextureEffect(cgl,{"isFloatingPointTexture":fpTexture.get()});

    tex=new CGL.Texture(cgl,
        {
            "name":"image compose",
            "isFloatingPointTexture":fpTexture.get(),
            "filter":selectedFilter,
            "wrap":selectedWrap,
            "width": Math.ceil(width.get()),
            "height": Math.ceil(height.get()),
        });

    effect.setSourceTexture(tex);
    texOut.set(CGL.Texture.getEmptyTexture(cgl));
    // texOut.set(effect.getCurrentSourceTexture());

    // texOut.set(effect.getCurrentSourceTexture());

    reInitEffect=false;

    // op.log("reinit effect");
    // tex.printInfo();
}

fpTexture.onChange=function()
{
    reInitEffect=true;

    // var e1=cgl.gl.getExtension('EXT_color_buffer_float');
    // var e2=cgl.gl.getExtension('EXT_float_blend');

};

function updateResolution()
{
    if(!effect)initEffect();

    if(useVPSize.get())
    {
        w=cgl.getViewPort()[2];
        h=cgl.getViewPort()[3];
    }
    else
    {
        w=Math.ceil(width.get());
        h=Math.ceil(height.get());
    }

    if((w!=tex.width || h!= tex.height) && (w!==0 && h!==0))
    {
        height.set(h);
        width.set(w);
        tex.setSize(w,h);
        outRatio.set(w/h);
        effect.setSourceTexture(tex);
        // texOut.set(null);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
    }

    if(texOut.get())
        if(!texOut.get().isPowerOfTwo() )
        {
            if(!op.uiAttribs.hint)
                op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
        }
        else
        if(op.uiAttribs.hint)
        {
            op.uiAttr({hint:null,warning:null}); //todo only when needed...
        }

}


function updateSizePorts()
{
    if(useVPSize.get())
    {
        width.setUiAttribs({greyout:true});
        height.setUiAttribs({greyout:true});
    }
    else
    {
        width.setUiAttribs({greyout:false});
        height.setUiAttribs({greyout:false});
    }
}


useVPSize.onChange=function()
{
    updateSizePorts();
    if(useVPSize.get())
    {
        width.onChange=null;
        height.onChange=null;
    }
    else
    {
        width.onChange=updateResolution;
        height.onChange=updateResolution;
    }
    updateResolution();

};


op.preRender=function()
{
    doRender();
    bgShader.bind();
};


var doRender=function()
{
    if(!effect || reInitEffect)
    {
        initEffect();
    }
    var vp=cgl.getViewPort();
    prevViewPort[0]=vp[0];
    prevViewPort[1]=vp[1];
    prevViewPort[2]=vp[2];
    prevViewPort[3]=vp[3];

    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA, cgl.gl.ONE_MINUS_SRC_ALPHA);

    updateResolution();

    cgl.currentTextureEffect=effect;
    effect.setSourceTexture(tex);

    effect.startEffect();

    // render background color...
    cgl.setShader(bgShader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
    cgl.currentTextureEffect.finish();
    cgl.setPreviousShader();

    trigger.trigger();

    texOut.set(effect.getCurrentSourceTexture());
    // texOut.set(effect.getCurrentTargetTexture());


    // if(effect.getCurrentSourceTexture.filter==CGL.Texture.FILTER_MIPMAP)
    // {
    //         this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, effect.getCurrentSourceTexture.tex);
    //         effect.getCurrentSourceTexture.updateMipMap();
    //     // else
    //     // {
    //     //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, this._textureSource.tex);;
    //     //     this._textureSource.updateMipMap();
    //     // }

    //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
    // }

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0],prevViewPort[1],prevViewPort[2],prevViewPort[3]);


    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.currentTextureEffect=null;
};


function onWrapChange()
{
    if(twrap.get()=='repeat') selectedWrap=CGL.Texture.WRAP_REPEAT;
    if(twrap.get()=='mirrored repeat') selectedWrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(twrap.get()=='clamp to edge') selectedWrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reInitEffect=true;
    updateResolution();
}

twrap.set('repeat');
twrap.onChange=onWrapChange;


function onFilterChange()
{
    if(tfilter.get()=='nearest') selectedFilter=CGL.Texture.FILTER_NEAREST;
    if(tfilter.get()=='linear')  selectedFilter=CGL.Texture.FILTER_LINEAR;
    if(tfilter.get()=='mipmap')  selectedFilter=CGL.Texture.FILTER_MIPMAP;

    reInitEffect=true;
    updateResolution();
    // effect.setSourceTexture(tex);
    // updateResolution();
}

tfilter.set('linear');
tfilter.onChange=onFilterChange;

useVPSize.set(true);
render.onTriggered=doRender;
op.preRender=doRender;


width.set(640);
height.set(360);
onFilterChange();
onWrapChange();
updateSizePorts();

};

Ops.Gl.TextureEffects.ImageCompose.prototype = new CABLES.Op();
CABLES.OPS["5c04608d-1e42-4e36-be00-1be4a81fc309"]={f:Ops.Gl.TextureEffects.ImageCompose,objName:"Ops.Gl.TextureEffects.ImageCompose"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.DrawImage
// 
// **************************************************************

Ops.Gl.TextureEffects.DrawImage = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={drawimage_frag:"#ifdef HAS_TEXTURES\n  IN vec2 texCoord;\n  UNI sampler2D tex;\n  UNI sampler2D image;\n#endif\n\nIN mat3 transform;\nUNI float rotate;\n\n{{CGL.BLENDMODES}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\nvoid main()\n{\n   vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n   #ifdef HAS_TEXTURES\n       vec2 tc=texCoord;\n\n       #ifdef TEX_FLIP_X\n           tc.x=1.0-tc.x;\n       #endif\n       #ifdef TEX_FLIP_Y\n           tc.y=1.0-tc.y;\n       #endif\n\n       #ifdef TEX_TRANSFORM\n           vec3 coordinates=vec3(tc.x, tc.y,1.0);\n           tc=(transform * coordinates ).xy;\n       #endif\n\n       blendRGBA=texture(image,tc);\n\n       vec3 blend=blendRGBA.rgb;\n       vec4 baseRGBA=texture(tex,texCoord);\n       vec3 base=baseRGBA.rgb;\n\n       vec3 colNew=_blend(base,blend);\n\n       #ifdef REMOVE_ALPHA_SRC\n           blendRGBA.a=1.0;\n       #endif\n\n       #ifdef HAS_TEXTUREALPHA\n           vec4 colImgAlpha=texture(imageAlpha,texCoord);\n           float colImgAlphaAlpha=colImgAlpha.a;\n\n           #ifdef ALPHA_FROM_LUMINANCE\n               vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n               colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n           #endif\n\n           blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n\n           #ifdef INVERT_ALPHA\n           blendRGBA.a=1.0-blendRGBA.a;\n           #endif\n       #endif\n\n\n   #endif\n\n   blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);\n   blendRGBA.a=1.0;\n\n\n   outColor= blendRGBA;\n}",drawimage_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nOUT vec2 texCoord;\nOUT vec3 norm;\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nUNI float posX;\nUNI float posY;\nUNI float scale;\nUNI float rotate;\n\nOUT mat3 transform;\n\nvoid main()\n{\n    texCoord=attrTexCoord;\n    norm=attrVertNormal;\n\n    #ifdef TEX_TRANSFORM\n    vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n    float angle = radians( rotate );\n    vec2 scale= vec2(scale,scale);\n    vec2 translate= vec2(posX,posY);\n\n    transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n                        - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n                        - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n    #endif\n\n    gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}",};
var render=op.inTrigger('render');
var amount=op.inFloatSlider("amount");
var blendMode=CGL.TextureEffect.AddBlendSelect(op,"blendMode");

var image=op.inTexture("image");

var imageAlpha=op.inTexture("imageAlpha");
var alphaSrc=op.inValueSelect("alphaSrc",['alpha channel','luminance']);
var removeAlphaSrc=op.inValueBool("removeAlphaSrc");

var invAlphaChannel=op.inValueBool("invert alpha channel");
var trigger=op.outTrigger('trigger');

op.toWorkPortsNeedToBeLinked(image);

blendMode.set('normal');
var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl,'drawimage');

amount.set(1.0);

render.onTriggered=doRender;

shader.setSource(attachments.drawimage_vert,attachments.drawimage_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var textureDisplaceUniform=new CGL.Uniform(shader,'t','image',1);
var textureAlpha=new CGL.Uniform(shader,'t','imageAlpha',2);

invAlphaChannel.onChange=function()
{
    if(invAlphaChannel.get()) shader.define('INVERT_ALPHA');
        else shader.removeDefine('INVERT_ALPHA');
};

removeAlphaSrc.onChange=function()
{
    if(removeAlphaSrc.get()) shader.define('REMOVE_ALPHA_SRC');
        else shader.removeDefine('REMOVE_ALPHA_SRC');
};
removeAlphaSrc.set(true);

alphaSrc.onChange=function()
{
    if(alphaSrc.get()=='luminance') shader.define('ALPHA_FROM_LUMINANCE');
        else shader.removeDefine('ALPHA_FROM_LUMINANCE');
};

alphaSrc.set("alpha channel");


{
    //
    // texture flip
    //
    var flipX=op.inValueBool("flip x");
    var flipY=op.inValueBool("flip y");

    flipX.onChange=function()
    {
        if(flipX.get()) shader.define('TEX_FLIP_X');
            else shader.removeDefine('TEX_FLIP_X');
    };

    flipY.onChange=function()
    {
        if(flipY.get()) shader.define('TEX_FLIP_Y');
            else shader.removeDefine('TEX_FLIP_Y');
    };
}

{
    //
    // texture transform
    //
    var scale=op.inValueFloat("scale");
    var posX=op.inValueFloat("pos x");
    var posY=op.inValueFloat("pos y");
    var rotate=op.inValueFloat("rotate");

    scale.set(1.0);

    var uniScale=new CGL.Uniform(shader,'f','scale',scale.get());
    var uniPosX=new CGL.Uniform(shader,'f','posX',posX.get());
    var uniPosY=new CGL.Uniform(shader,'f','posY',posY.get());
    var uniRotate=new CGL.Uniform(shader,'f','rotate',rotate.get());

    function updateTransform()
    {
        if(scale.get()!=1.0 || posX.get()!=0.0 || posY.get()!=0.0 || rotate.get()!=0.0 )
        {
            if(!shader.hasDefine('TEX_TRANSFORM')) shader.define('TEX_TRANSFORM');
            uniScale.setValue( parseFloat(scale.get()) );
            uniPosX.setValue( posX.get() );
            uniPosY.setValue( posY.get() );
            uniRotate.setValue( rotate.get() );
        }
        else
        {
            // shader.removeDefine('TEX_TRANSFORM');
        }
    }

    scale.onChange=updateTransform;
    posX.onChange=updateTransform;
    posY.onChange=updateTransform;
    rotate.onChange=updateTransform;
}

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);


var amountUniform=new CGL.Uniform(shader,'f','amount',amount);
var oldHadImageAlpha=false;

// op.preRender=function()
// {
//     doRender();
// };


function doRender()
{
    // if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    if(imageAlpha.get() && !oldHadImageAlpha || !imageAlpha.get() && oldHadImageAlpha)
    {
        if(imageAlpha.get() && imageAlpha.get().tex)
        {
            console.log("HAS TEX ALPHA!");
            shader.define('HAS_TEXTUREALPHA');
            oldHadImageAlpha=true;
        }
        else
        {
            shader.removeDefine('HAS_TEXTUREALPHA');
            oldHadImageAlpha=false;
        }
    }

    if(image.get() && image.get().tex && amount.get()>0.0)
    {
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

        if(image.get() && image.get().tex) cgl.setTexture(1, image.get().tex );
            else cgl.setTexture(1, null);

        if(imageAlpha.get() && imageAlpha.get().tex) cgl.setTexture(2, imageAlpha.get().tex );
            else cgl.setTexture(2,null);

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();
    }

    trigger.trigger();
}



};

Ops.Gl.TextureEffects.DrawImage.prototype = new CABLES.Op();
CABLES.OPS["8248b866-9492-48c8-897d-3097c6fe6fe8"]={f:Ops.Gl.TextureEffects.DrawImage,objName:"Ops.Gl.TextureEffects.DrawImage"};




// **************************************************************
// 
// Ops.Gl.Texture
// 
// **************************************************************

Ops.Gl.Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var filename=op.inFile("file","image");
var tfilter=op.inSwitch("filter",['nearest','linear','mipmap']);
var wrap=op.inValueSelect("wrap",['repeat','mirrored repeat','clamp to edge'],"clamp to edge");
var flip=op.inValueBool("flip",false);
var unpackAlpha=op.inValueBool("unpackPreMultipliedAlpha",false);

var textureOut=op.outTexture("texture");
var width=op.outValue("width");
var height=op.outValue("height");
var loading=op.outValue("loading");
var ratio=op.outValue("Aspect Ratio");


op.setPortGroup("Size",[width,height]);

unpackAlpha.hidePort();

op.toWorkPortsNeedToBeLinked(textureOut);

const cgl=op.patch.cgl;
var cgl_filter=0;
var cgl_wrap=0;

filename.onChange=flip.onChange=function(){reloadSoon();};

tfilter.onChange=onFilterChange;
wrap.onChange=onWrapChange;
unpackAlpha.onChange=function(){ reloadSoon(); };

var timedLoader=0;

tfilter.set('mipmap');
wrap.set('repeat');

textureOut.set(CGL.Texture.getEmptyTexture(cgl));

var setTempTexture=function()
{
    var t=CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

var loadingId=null;
var tex=null;
function reloadSoon(nocache)
{
    // if(!loadingId)loadingId=cgl.patch.loading.start('textureOp',filename.get());

    // if(timedLoader!=0)
    // {
    //     console.log('tex load canceled...');
    // }
    clearTimeout(timedLoader);
    timedLoader=setTimeout(function()
    {
        // console.log('tex load yay...');
        realReload(nocache);
    },30);
}

function realReload(nocache)
{
    if(!loadingId)loadingId=cgl.patch.loading.start('textureOp',filename.get());

    var url=op.patch.getFilePath(String(filename.get()));
    if(nocache)url+='?rnd='+CABLES.generateUUID();

    if((filename.get() && filename.get().length>1))
    {
        loading.set(true);

        if(tex)tex.delete();
        tex=CGL.Texture.load(cgl,url,
            function(err)
            {
                if(err)
                {
                    setTempTexture();
                    op.uiAttr({'error':'could not load texture "'+filename.get()+'"'});
                    cgl.patch.loading.finished(loadingId);
                    return;
                }
                else op.uiAttr({'error':null});
                textureOut.set(tex);
                width.set(tex.width);
                height.set(tex.height);
                ratio.set(tex.width/tex.height);

                if(!tex.isPowerOfTwo()) op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
                    else op.uiAttr(
                        {
                            hint:null,
                            warning:null
                        });

                textureOut.set(null);
                textureOut.set(tex);
                // tex.printInfo();

            },{
                wrap:cgl_wrap,
                flip:flip.get(),
                unpackAlpha:unpackAlpha.get(),
                filter:cgl_filter
            });

        textureOut.set(null);
        textureOut.set(tex);

        if(!textureOut.get() && nocache)
        {
        }

        cgl.patch.loading.finished(loadingId);
    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        setTempTexture();
    }
}

function onFilterChange()
{
    if(tfilter.get()=='nearest') cgl_filter=CGL.Texture.FILTER_NEAREST;
    if(tfilter.get()=='linear') cgl_filter=CGL.Texture.FILTER_LINEAR;
    if(tfilter.get()=='mipmap') cgl_filter=CGL.Texture.FILTER_MIPMAP;

    reloadSoon();
}

function onWrapChange()
{
    if(wrap.get()=='repeat') cgl_wrap=CGL.Texture.WRAP_REPEAT;
    if(wrap.get()=='mirrored repeat') cgl_wrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(wrap.get()=='clamp to edge') cgl_wrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged=function(fn)
{
    if(filename.get() && filename.get().indexOf(fn)>-1)
    {
        textureOut.set(null);
        textureOut.set(CGL.Texture.getTempTexture(cgl));

        realReload(true);
    }
};







};

Ops.Gl.Texture.prototype = new CABLES.Op();
CABLES.OPS["466394d4-6c1a-4e5d-a057-0063ab0f096a"]={f:Ops.Gl.Texture,objName:"Ops.Gl.Texture"};




// **************************************************************
// 
// Ops.Gl.Meshes.Rectangle
// 
// **************************************************************

Ops.Gl.Meshes.Rectangle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var render=op.inTrigger("render");
var trigger=op.outTrigger('trigger');

var width=op.inValue("width",1);
var height=op.inValue("height",1);

var pivotX=op.inSwitch("pivot x",["left","center","right"]);
var pivotY=op.inSwitch("pivot y",["top","center","bottom"]);

var nColumns=op.inValueInt("num columns",1);
var nRows=op.inValueInt("num rows",1);
var axis=op.inSwitch("axis",["xy","xz"],"xy");

var active=op.inValueBool('Active',true);

var geomOut=op.outObject("geometry");
geomOut.ignoreValueSerialize=true;

var cgl=op.patch.cgl;
axis.set('xy');
pivotX.set('center');
pivotY.set('center');

op.setPortGroup('Pivot',[pivotX,pivotY]);
op.setPortGroup('Size',[width,height]);
op.setPortGroup('Structure',[nColumns,nRows]);

var geom=new CGL.Geometry('rectangle');
var mesh=null;

axis.onChange=rebuild;
pivotX.onChange=rebuild;
pivotY.onChange=rebuild;
width.onChange=rebuild;
height.onChange=rebuild;
nRows.onChange=rebuild;
nColumns.onChange=rebuild;
rebuild();

op.preRender=
render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;


    if(active.get() && mesh) mesh.render(cgl.getShader());
    trigger.trigger();
};

function rebuild()
{
    var w=width.get();
    var h=height.get();
    var x=0;
    var y=0;

    if(typeof w=='string')w=parseFloat(w);
    if(typeof h=='string')h=parseFloat(h);

    if(pivotX.get()=='center') x=0;
    else if(pivotX.get()=='right') x=-w/2;
    else if(pivotX.get()=='left') x=+w/2;

    if(pivotY.get()=='center') y=0;
    else if(pivotY.get()=='top') y=-h/2;
    else if(pivotY.get()=='bottom') y=+h/2;

    var verts=[];
    var tc=[];
    var norms=[];
    var tangents=[];
    var biTangents=[];
    var indices=[];

    var numRows=Math.round(nRows.get());
    var numColumns=Math.round(nColumns.get());

    var stepColumn=w/numColumns;
    var stepRow=h/numRows;

    var c,r,a;
    a=axis.get();
    for(r=0;r<=numRows;r++)
    {
        for(c=0;c<=numColumns;c++)
        {
            verts.push( c*stepColumn - width.get()/2+x );
            if(a=='xz') verts.push( 0.0 );
            verts.push( r*stepRow - height.get()/2+y );
            if(a=='xy') verts.push( 0.0 );

            tc.push( c/numColumns );
            tc.push( 1.0-r/numRows );

            if(a=='xz')
            {
                norms.push(0,1,0);
                tangents.push(1,0,0);
                biTangents.push(0,0,1);
            }
            else if(a=='xy')
            {
                norms.push(0,0,1);
                tangents.push(-1,0,0);
                biTangents.push(0,-1,0);
            }
        }
    }

    for(c=0;c<numColumns;c++)
    {
        for(r=0;r<numRows;r++)
        {
            var ind = c+(numColumns+1)*r;
            var v1=ind;
            var v2=ind+1;
            var v3=ind+numColumns+1;
            var v4=ind+1+numColumns+1;

            indices.push(v1);
            indices.push(v3);
            indices.push(v2);

            indices.push(v2);
            indices.push(v3);
            indices.push(v4);
        }
    }

    geom.clear();
    geom.vertices=verts;
    geom.texCoords=tc;
    geom.verticesIndices=indices;
    geom.vertexNormals=norms;
    geom.tangents=tangents;
    geom.biTangents=biTangents;

    if(numColumns*numRows>64000)geom.unIndex();

    if(!mesh) mesh=new CGL.Mesh(cgl,geom);
        else mesh.setGeom(geom);

    geomOut.set(null);
    geomOut.set(geom);

}

op.onDelete=function()
{
    if(mesh)mesh.dispose();
}

};

Ops.Gl.Meshes.Rectangle.prototype = new CABLES.Op();
CABLES.OPS["20f3c4e7-04d1-44e0-b868-05756d1c66c6"]={f:Ops.Gl.Meshes.Rectangle,objName:"Ops.Gl.Meshes.Rectangle"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={shader_frag:"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=vec4(r,g,b,a);\n\n    #ifdef HAS_TEXTURES\n        #ifdef HAS_TEXTURE_DIFFUSE\n\n           col=texture(tex,vec2(texCoord.x,(1.0-texCoord.y)));\n\n           #ifdef COLORIZE_TEXTURE\n               col.r*=r;\n               col.g*=g;\n               col.b*=b;\n           #endif\n        #endif\n\n        col.a*=a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                col.a*=texture(texOpacity,vec2(texCoordOrig.s,1.0-texCoordOrig.t)).g;\n            #endif\n            #ifndef TRANSFORMALPHATEXCOORDS\n                col.a*=texture(texOpacity,vec2(texCoord.s,1.0-texCoord.t)).g;\n            #endif\n       #endif\n\n    #endif\n\n    {{MODULE_COLOR}}\n\n    outColor = col;\n\n\n}\n",shader_vert:"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nIN vec3 attrVertNormal;\nIN vec2 attrTexCoord;\n\nOUT vec3 norm;\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    #ifdef TEXTURE_REPEAT\n        UNI float diffuseRepeatX;\n        UNI float diffuseRepeatY;\n        UNI float texOffsetX;\n        UNI float texOffsetY;\n    #endif\n#endif\n\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n    \n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        #ifdef TEXTURE_REPEAT\n            texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n            texCoord.y=texCoord.y*diffuseRepeatY+texOffsetY;\n        #endif\n    #endif\n\n    vec4 pos = vec4( vPosition, 1. );\n\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       mvMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * mvMatrix * vec4((\n           position.x * vec3(\n               mvMatrix[0][0],\n               mvMatrix[1][0],\n               mvMatrix[2][0] ) +\n           position.y * vec3(\n               mvMatrix[0][1],\n               mvMatrix[1][1],\n               mvMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        mvMatrix=viewMatrix * mMatrix;\n    #endif\n\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * mvMatrix * pos;\n    #endif\n}\n",};
const render=op.inTrigger("render"),
    trigger=op.outTrigger("trigger"),
    shaderOut=op.outObject("shader");

shaderOut.ignoreValueSerialize=true;
const cgl=op.patch.cgl;

var shader=new CGL.Shader(cgl,'BasicMaterial');
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.bindTextures=bindTextures;
shader.setSource(attachments.shader_vert,attachments.shader_frag);
shaderOut.set(shader);

render.onTriggered=doRender;

var textureOpacity=null;
var textureOpacityUniform=null;


function bindTextures()
{
    if(diffuseTexture.get()) cgl.setTexture(0, diffuseTexture.get().tex);
    if(textureOpacity.get()) cgl.setTexture(1, textureOpacity.get().tex);
}

op.preRender=function()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if(!shader)return;

    cgl.setShader(shader);
    shader.bindTextures();

    trigger.trigger();

    cgl.setPreviousShader();
}


{
    // rgba colors
    const r = op.inValueSlider("r", Math.random()),
        g = op.inValueSlider("g", Math.random()),
        b = op.inValueSlider("b", Math.random()),
        a = op.inValueSlider("a",1.0);
        r.setUiAttribs({ colorPick: true });



    a.uniform=new CGL.Uniform(shader,'f','a',a);
    b.uniform=new CGL.Uniform(shader,'f','b',b);
    r.uniform=new CGL.Uniform(shader,'f','r',r);
    g.uniform=new CGL.Uniform(shader,'f','g',g);

    op.setPortGroup('Color',[r,g,b,a]);

}

{
    // diffuse outTexture


    var diffuseTexture=op.inTexture("texture");
    var diffuseTextureUniform=null;
    shader.bindTextures=bindTextures;

    diffuseTexture.onChange=function()
    {
        if(diffuseTexture.get())
        {
            // if(diffuseTextureUniform!==null)return;
            // shader.addveUniform('texDiffuse');
            if(!shader.hasDefine('HAS_TEXTURE_DIFFUSE'))shader.define('HAS_TEXTURE_DIFFUSE');
            if(!diffuseTextureUniform)diffuseTextureUniform=new CGL.Uniform(shader,'t','texDiffuse',0);
            updateTexRepeat();
        }
        else
        {
            shader.removeUniform('texDiffuse');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            diffuseTextureUniform=null;
        }
    };
}

{
    // opacity texture
    textureOpacity=op.inTexture("textureOpacity");

    textureOpacity.onChange=function()
    {
        if(textureOpacity.get())
        {
            if(textureOpacityUniform!==null)return;
            shader.removeUniform('texOpacity');
            shader.define('HAS_TEXTURE_OPACITY');
            if(!textureOpacityUniform)textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);
        }
        else
        {
            shader.removeUniform('texOpacity');
            shader.removeDefine('HAS_TEXTURE_OPACITY');
            textureOpacityUniform=null;
        }
    };

}

op.colorizeTexture=op.inValueBool("colorizeTexture");
op.colorizeTexture.set(false);
op.colorizeTexture.onChange=function()
{
    if(op.colorizeTexture.get()) shader.define('COLORIZE_TEXTURE');
        else shader.removeDefine('COLORIZE_TEXTURE');
};

op.doBillboard=op.inValueBool("billboard");
op.doBillboard.set(false);

op.doBillboard.onChange=function()
{
    if(op.doBillboard.get()) shader.define('BILLBOARD');
        else shader.removeDefine('BILLBOARD');
};

var texCoordAlpha=op.inValueBool("Opacity TexCoords Transform",false);

texCoordAlpha.onChange=function()
{
    if(texCoordAlpha.get()) shader.define('TRANSFORMALPHATEXCOORDS');
        else shader.removeDefine('TRANSFORMALPHATEXCOORDS');

};

var preMultipliedAlpha=op.inValueBool("preMultiplied alpha");

function updateTexRepeat()
{
    if(!diffuseRepeatXUniform)
    {
        diffuseRepeatXUniform=new CGL.Uniform(shader,'f','diffuseRepeatX',diffuseRepeatX);
        diffuseRepeatYUniform=new CGL.Uniform(shader,'f','diffuseRepeatY',diffuseRepeatY);
        diffuseOffsetXUniform=new CGL.Uniform(shader,'f','texOffsetX',diffuseOffsetX);
        diffuseOffsetYUniform=new CGL.Uniform(shader,'f','texOffsetY',diffuseOffsetY);
    }

    diffuseRepeatXUniform.setValue(diffuseRepeatX.get());
    diffuseRepeatYUniform.setValue(diffuseRepeatY.get());
    diffuseOffsetXUniform.setValue(diffuseOffsetX.get());
    diffuseOffsetYUniform.setValue(diffuseOffsetY.get());
}

{
    // texture coords

    var diffuseRepeatX=op.inValueFloat("diffuseRepeatX",1);
    var diffuseRepeatY=op.inValueFloat("diffuseRepeatY",1);
    var diffuseOffsetX=op.inValueFloat("Tex Offset X");
    var diffuseOffsetY=op.inValueFloat("Tex Offset Y");

    op.setPortGroup('Transform Texture',[diffuseRepeatX,diffuseRepeatY,diffuseOffsetX,diffuseOffsetY]);

    diffuseRepeatX.onChange=updateTexRepeat;
    diffuseRepeatY.onChange=updateTexRepeat;
    diffuseOffsetY.onChange=updateTexRepeat;
    diffuseOffsetX.onChange=updateTexRepeat;

    var diffuseRepeatXUniform=null;
    var diffuseRepeatYUniform=null;
    var diffuseOffsetXUniform=null;
    var diffuseOffsetYUniform=null;

    shader.define('TEXTURE_REPEAT');

    diffuseOffsetX.set(0);
    diffuseOffsetY.set(0);
    diffuseRepeatX.set(1);
    diffuseRepeatY.set(1);
}


updateTexRepeat();


};

Ops.Gl.Shader.BasicMaterial.prototype = new CABLES.Op();
CABLES.OPS["85ae5cfa-5eca-4dd8-8b30-850ac34f7cd5"]={f:Ops.Gl.Shader.BasicMaterial,objName:"Ops.Gl.Shader.BasicMaterial"};




// **************************************************************
// 
// Ops.Patch.PlayButton
// 
// **************************************************************

Ops.Patch.PlayButton = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inExec=op.inTrigger("Trigger"),
    inIfSuspended=op.inValueBool("Only if Audio Suspended"),
    inReset=op.inTriggerButton("Reset"),
    outNext=op.outTrigger("Next"),
    outState=op.outString("Audiocontext State"),
    outClicked=op.outValueBool("Clicked");

op.toWorkPortsNeedToBeLinked(inExec);

const canvas = op.patch.cgl.canvas.parentElement;
var wasClicked=false;
var ele=null;
var elePlay=null;
createElements();

function createElements()
{
    if(elePlay) elePlay.remove();
    if(ele) ele.remove();

    ele=document.createElement("div");
    elePlay=document.createElement("div");


    ele.style.width="100px";
    ele.style.height="100px";
    ele.style.left="50%";
    ele.style.top="25%";
    ele.style['border-radius']="50px";
    ele.style['margin-left']="-50px";
    ele.style['margin-top']="-50px";
    ele.style.position="absolute";
    ele.style.cursor="pointer";
    ele.style.opacity=0.7;
    ele.style['z-index']=999999;
    ele.style['background-color']="rgba(55,55,55)";

    elePlay.style["border-style"]="solid";
    elePlay.style["border-color"]="transparent transparent transparent #ccc";
    elePlay.style["box-sizing"]="border-box";
    elePlay.style.width="50px";
    elePlay.style.height="50px";
    elePlay.style['margin-top']="15px";
    elePlay.style['margin-left']="33px";
    elePlay.style["border-width"]="35px 0px 35px 50px";
    elePlay.style['pointer-events']="none";

    canvas.appendChild(ele);
    ele.appendChild(elePlay);
    ele.addEventListener('mouseenter', hover);
    ele.addEventListener('mouseleave', hoverOut);
    ele.addEventListener('click', clicked);
    ele.addEventListener('touchStart', clicked);
    op.onDelete=removeElements;
}

inReset.onTriggered=function()
{
    createElements();
    wasClicked=false;
    outClicked.set(wasClicked);

};

inExec.onTriggered=function()
{
    if(window.audioContext)
    {
        outState.set(window.audioContext.state);
    }

    if(inIfSuspended.get() && window.audioContext.state=='running') clicked();
    if(wasClicked) outNext.trigger();

};

function clicked()
{
    removeElements();
    if(window.audioContext && window.audioContext.state=='suspended')window.audioContext.resume();
    wasClicked=true;
    outClicked.set(wasClicked);
}

function removeElements()
{
    if(elePlay) elePlay.remove();
    if(ele) ele.remove();
}

function hoverOut()
{
    if(ele) ele.style.opacity=0.7;
}

function hover()
{
    if(ele) ele.style.opacity=1.0;
}

};

Ops.Patch.PlayButton.prototype = new CABLES.Op();
CABLES.OPS["32e53fa2-4545-4c53-a94d-2204aa079246"]={f:Ops.Patch.PlayButton,objName:"Ops.Patch.PlayButton"};




// **************************************************************
// 
// Ops.Sidebar.Sidebar
// 
// **************************************************************

Ops.Sidebar.Sidebar = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={style_css:"/*\n * SIDEBAR\n */\n\n.icon-chevron-down {\n\n    top: 2px;\n    right: 9px;\n}\n\n.iconsidebar-chevron-up {\n\tbackground-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n    top: 2px;\n    right: 9px;\n}\n\n\n.sidebar-cables-right\n{\n    right: 0px;\n    left: initial !important;\n}\n\n.sidebar-cables {\n  position: absolute;\n  top: 0;\n  left: 0;\n  z-index: 100000;\n  color: #BBBBBB;\n  width: 220px;\n  max-height: 100%;\n  box-sizing: border-box;\n  overflow-y: auto;\n  overflow-x: hidden;\n  font-size: 13px;\n  font-family: Arial;\n  line-height: 1em; /* prevent emojis from breaking height of the title */\n  --sidebar-border-radius: 4px;\n  --sidebar-monospace-font-stack: \"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, Courier, monospace;\n  --sidebar-hover-transition-time: .2s;\n}\n\n.sidebar-cables::selection {\n    background-color: #24baa7;\n    color: #EEEEEE;\n}\n\n.sidebar-cables::-webkit-scrollbar {\n    background-color: transparent;\n    --cables-scrollbar-width: 8px;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables::-webkit-scrollbar-track {\n    background-color: transparent;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables::-webkit-scrollbar-thumb {\n    background-color: #333333;\n    border-radius: 4px;\n    width: var(--cables-scrollbar-width);\n}\n\n.sidebar-cables--closed {\n  width: auto;\n}\n\n.sidebar__close-button {\n  background-color: #1A1A1A;\n  -webkit-user-select: none;  /* Chrome all / Safari all */\n  -moz-user-select: none;     /* Firefox all */\n  -ms-user-select: none;      /* IE 10+ */\n  user-select: none;          /* Likely future */\n  transition: background-color var(--sidebar-hover-transition-time);\n  color: #CCCCCC;\n  height: 22px;\n  box-sizing: border-box;\n  padding-top: 2px;\n  text-align: center;\n  cursor: pointer;\n  border-top: 1px solid #272727;\n  border-radius: 0 0 var(--sidebar-border-radius) var(--sidebar-border-radius);\n  opacity: 1.0;\n  transition: opacity 0.3s;\n  overflow: hidden;\n}\n\n.sidebar__close-button-icon {\n    display: inline-block;\n    width: 21px;\n    height: 20px;\n    position: relative;\n    top: -1px;\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n    background-size: cover;\n    background-repeat: no-repeat;\n    background-repeat: no-repeat;\n    background-position: 0 -1px;\n}\n\n.sidebar--closed .sidebar__close-button {\n    margin-top: 8px;\n    margin-left: 8px;\n    padding-top: 13px;\n    padding-left: 11px;\n    padding-right: 11px;\n    width: 46px;\n    height: 46px;\n    border-radius: 50%;\n    cursor: pointer;\n    opacity: 0.3;\n}\n\n.sidebar--closed .sidebar__close-button-icon {\n    background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIyMnB4IiBoZWlnaHQ9IjE3cHgiIHZpZXdCb3g9IjAgMCAyMiAxNyIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4gICAgICAgIDx0aXRsZT5Hcm91cCAzPC90aXRsZT4gICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+ICAgIDxkZWZzPjwvZGVmcz4gICAgPGcgaWQ9IkNhbnZhcy1TaWRlYmFyIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4gICAgICAgIDxnIGlkPSJEZXNrdG9wLWdyZWVuLWJsdWlzaC1Db3B5LTkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yMC4wMDAwMDAsIC0yMi4wMDAwMDApIj4gICAgICAgICAgICA8ZyBpZD0iR3JvdXAtMyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAuMDAwMDAwLCAyMi4wMDAwMDApIj4gICAgICAgICAgICAgICAgPHBhdGggZD0iTTAuNSwyLjUgTDIuNSwyLjUiIGlkPSJMaW5lLTIiIHN0cm9rZT0iIzk3OTc5NyIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSI+PC9wYXRoPiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTAuNSwyLjUgTDIxLjUsMi41IiBpZD0iTGluZS0yIiBzdHJva2U9IiM5Nzk3OTciIHN0cm9rZS1saW5lY2FwPSJzcXVhcmUiPjwvcGF0aD4gICAgICAgICAgICAgICAgPHBhdGggZD0iTTAuNSw4LjUgTDExLjUsOC41IiBpZD0iTGluZS0yIiBzdHJva2U9IiM5Nzk3OTciIHN0cm9rZS1saW5lY2FwPSJzcXVhcmUiPjwvcGF0aD4gICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5LjUsOC41IEwyMS41LDguNSIgaWQ9IkxpbmUtMiIgc3Ryb2tlPSIjOTc5Nzk3IiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIj48L3BhdGg+ICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0wLjUsMTQuNSBMNS41LDE0LjUiIGlkPSJMaW5lLTIiIHN0cm9rZT0iIzk3OTc5NyIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSI+PC9wYXRoPiAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuNSwxNC41IEwyMS41LDE0LjUiIGlkPSJMaW5lLTIiIHN0cm9rZT0iIzk3OTc5NyIgc3Ryb2tlLWxpbmVjYXA9InNxdWFyZSI+PC9wYXRoPiAgICAgICAgICAgICAgICA8Y2lyY2xlIGlkPSJPdmFsLTMiIGZpbGw9IiM5Nzk3OTciIGN4PSI2LjUiIGN5PSIyLjUiIHI9IjIuNSI+PC9jaXJjbGU+ICAgICAgICAgICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwtMyIgZmlsbD0iIzk3OTc5NyIgY3g9IjE1LjUiIGN5PSI4LjUiIHI9IjIuNSI+PC9jaXJjbGU+ICAgICAgICAgICAgICAgIDxjaXJjbGUgaWQ9Ik92YWwtMyIgZmlsbD0iIzk3OTc5NyIgY3g9IjkuNSIgY3k9IjE0LjUiIHI9IjIuNSI+PC9jaXJjbGU+ICAgICAgICAgICAgPC9nPiAgICAgICAgPC9nPiAgICA8L2c+PC9zdmc+);\n    background-position: 0px 0px;\n}\n\n.sidebar__close-button:hover {\n  background-color: #111111;\n  opacity: 1.0 !important;\n}\n\n/*\n * SIDEBAR ITEMS\n */\n\n.sidebar__items {\n  /* max-height: 1000px; */\n  /* transition: max-height 0.5;*/\n}\n\n.sidebar--closed .sidebar__items {\n  /* max-height: 0; */\n  height: 0;\n  display: none;\n  pointer-interactions: none;\n}\n\n/*\n * SIDEBAR GROUP\n */\n\n.sidebar__group {\n  background-color: #1A1A1A;\n  overflow: hidden;\n  box-sizing: border-box;\n  animate: height;\n  /* max-height: 1000px; */\n  /* transition: max-height 0.5s; */\n  --sidebar-group-header-height: 28px;\n}\n\n.sidebar__group--closed {\n  /* max-height: 13px; */\n  height: var(--sidebar-group-header-height);\n}\n\n.sidebar__group-header {\n  box-sizing: border-box;\n  color: #EEEEEE;\n  -webkit-user-select: none;  /* Chrome all / Safari all */\n  -moz-user-select: none;     /* Firefox all */\n  -ms-user-select: none;      /* IE 10+ */\n  user-select: none;          /* Likely future */\n  height: var(--sidebar-group-header-height);\n  padding-top: 7px;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  cursor: pointer;\n  transition: background-color var(--sidebar-hover-transition-time);\n  position: relative;\n}\n\n.sidebar__group-header:hover {\n  background-color: #111111;\n}\n\n.sidebar__group-header-title {\n  text-align: center;\n  overflow: hidden;\n  padding: 0 24px;\n}\n\n.sidebar__group-header-icon {\n    width: 17px;\n    height: 14px;\n    background-repeat: no-repeat;\n    display: inline-block;\n    position: absolute;\n    background-size: cover;\n\n    /* icon open */\n    /* feather icon: chevron up */\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tdXAiPjxwb2x5bGluZSBwb2ludHM9IjE4IDE1IDEyIDkgNiAxNSI+PC9wb2x5bGluZT48L3N2Zz4=);\n    top: 4px;\n    right: 5px;\n    opacity: 0.0;\n    transition: opacity 0.3;\n}\n\n.sidebar__group-header:hover .sidebar__group-header-icon {\n    opacity: 1.0;\n}\n\n/* icon closed */\n.sidebar__group--closed .sidebar__group-header-icon {\n    /* feather icon: chevron down */\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tZG93biI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+);\n    top: 4px;\n    right: 5px;\n}\n\n/*\n * SIDEBAR ITEM\n */\n\n.sidebar__item {\n  background-color: #222222;\n  box-sizing: border-box;\n  padding: 7px;\n}\n\n.sidebar__item-label {\n  display: inline-block;\n  -webkit-user-select: none;  /* Chrome all / Safari all */\n  -moz-user-select: none;     /* Firefox all */\n  -ms-user-select: none;      /* IE 10+ */\n  user-select: none;          /* Likely future */\n  width: calc(50% - 7px);\n  margin-right: 7px;\n  max-height: 1em;\n  text-overflow: ellipsis;\n  /* overflow: hidden; */\n}\n\n.sidebar__item-value-label {\n  font-family: var(--sidebar-monospace-font-stack);\n  display: inline-block;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  white-space: nowrap;\n  max-width: 50%;\n}\n\n.sidebar__item-value-label::selection {\n    background-color: #24baa7;\n    color: #EEEEEE;\n}\n\n.sidebar__item + .sidebar__item,\n.sidebar__item + .sidebar__group,\n.sidebar__group + .sidebar__item,\n.sidebar__group + .sidebar__group {\n  border-top: 1px solid #272727;\n}\n\n/*\n * SIDEBAR ITEM TOGGLE\n */\n\n.sidebar__toggle {\n    cursor: pointer;\n}\n\n.sidebar__toggle-input {\n  --sidebar-toggle-input-color: #CCCCCC;\n  --sidebar-toggle-input-color-hover: #EEEEEE;\n  --sidebar-toggle-input-border-size: 2px;\n  display: inline;\n  float: right;\n  box-sizing: border-box;\n  border-radius: 50%;\n  cursor: pointer;\n  --toggle-size: 11px;\n  margin-top: 2px;\n  background-color: transparent;\n  border: var(--sidebar-toggle-input-border-size) solid var(--sidebar-toggle-input-color);\n  width: var(--toggle-size);\n  height: var(--toggle-size);\n  transition: background-color var(--sidebar-hover-transition-time);\n  transition: border-color var(--sidebar-hover-transition-time);\n}\n.sidebar__toggle:hover .sidebar__toggle-input {\n  border-color: var(--sidebar-toggle-input-color-hover);\n}\n\n.sidebar__toggle .sidebar__item-value-label {\n  -webkit-user-select: none;  /* Chrome all / Safari all */\n  -moz-user-select: none;     /* Firefox all */\n  -ms-user-select: none;      /* IE 10+ */\n  user-select: none;          /* Likely future */\n  max-width: calc(50% - 12px);\n}\n.sidebar__toggle-input::after { clear: both; }\n\n.sidebar__toggle--active .sidebar__toggle-input {\n  transition: background-color var(--sidebar-hover-transition-time);\n  background-color: var(--sidebar-toggle-input-color);\n}\n.sidebar__toggle--active .sidebar__toggle-input:hover {\n  background-color: var(--sidebar-toggle-input-color-hover);\n  border-color: var(--sidebar-toggle-input-color-hover);\n  transition: background-color var(--sidebar-hover-transition-time);\n  transition: border-color var(--sidebar-hover-transition-time);\n}\n\n/*\n * SIDEBAR ITEM BUTTON\n */\n\n.sidebar__button {}\n\n.sidebar__button-input {\n  -webkit-user-select: none;  /* Chrome all / Safari all */\n  -moz-user-select: none;     /* Firefox all */\n  -ms-user-select: none;      /* IE 10+ */\n  user-select: none;          /* Likely future */\n  height: 24px;\n  background-color: #444444;\n  color: #CCCCCC;\n  box-sizing: border-box;\n  padding-top: 5px;\n  text-align: center;\n  border-radius: var(--sidebar-border-radius);\n  cursor: pointer;\n}\n\n.sidebar__button-input:hover {\n  background-color: #555555;\n}\n\n/*\n * VALUE DISPLAY (shows a value)\n */\n\n.sidebar__value-display {}\n\n/*\n * SLIDER\n */\n\n.sidebar__slider {\n  --sidebar-slider-input-height: 18px;\n}\n\n.sidebar__slider-input-wrapper {\n  width: 100%;\n  margin-top: 10px;\n  position: relative;\n}\n\n.sidebar__slider-input {\n  -webkit-appearance: none;  /* Override default CSS styles */\n  appearance: none;\n  margin: 0;\n  width: 100%;\n  height: var(--sidebar-slider-input-height);\n  background: #333333;\n  cursor: pointer;\n  outline: none;\n  -webkit-transition: .2s; /* 0.2 seconds transition on hover */\n  transition: background-color .2s;\n  border: none;\n}\n\n.sidebar__slider-input:focus, .sidebar__slider-input:hover {\n    border: none;\n}\n\n.sidebar__slider-input-active-track {\n  position: absolute;\n  top: 0;\n  left: 0;\n  background-color: #CCCCCC;\n  pointer-events: none;\n  height: var(--sidebar-slider-input-height);\n  /* width: 10px; */\n}\n\n/* Mouse-over effects */\n.sidebar__slider-input:hover {\n  background-color: #444444;\n}\n\n/* The slider handle (use -webkit- (Chrome, Opera, Safari, Edge) and -moz- (Firefox) to override default look) */\n.sidebar__slider-input::-webkit-slider-thumb {\n    -webkit-appearance: none; /* Override default look */\n    appearance: none;\n    width: var(--sidebar-slider-input-height);\n    /* width: 0 !important; */\n    height: var(--sidebar-slider-input-height);\n    background: #EEEEEE !important;\n    z-index: 999999999999 !important;\n    border: none;\n    border-radius: 0 !important;\n    cursor: pointer;\n}\n.sidebar__slider-input:hover ::-webkit-slider-thumb {\n  background-color: #EEEEEE !important;\n}\n\n.sidebar__slider-input::-moz-range-thumb {\n    /* width: var(--sidebar-slider-input-height); */\n    width: 0 !important;\n    height: var(--sidebar-slider-input-height);\n    background: #EEEEEE;\n    cursor: pointer;\n    border-radius: 0 !important;\n    border: none;\n    outline: 0;\n    z-index: 99999999999999999 !important;\n}\n\n.sidebar__slider-input::-moz-range-track {\n  background-color: transparent;\n}\n\n.sidebar__slider-input::-moz-range-thumb:hover {\n  /* background-color: #EEEEEE; */\n}\n\n.sidebar__slider-input-wrapper:hover .sidebar__slider-input-active-track {\n  background-color: #EEEEEE;\n}\n\n.sidebar__slider-input-wrapper:hover .sidebar__slider-input::-moz-range-thumb {\n  background-color: #EEEEEE !important;\n}\n\n.sidebar__slider-input-wrapper:hover .sidebar__slider-input::-webkit-slider-thumb {\n  background-color: #EEEEEE;\n}\n\n.sidebar__slider input[type=text] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: 50%;\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n}\n\n.sidebar__slider input[type=text]:active,\n.sidebar__slider input[type=text]:focus,\n.sidebar__slider input[type=text]:hover {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\n/*\n * TEXT / DESCRIPTION\n */\n\n.sidebar__text .sidebar__item-label {\n    width: auto;\n    display: block;\n    max-height: none;\n    margin-right: 0;\n    line-height: 1.1em;\n}\n\n/*\n * SIDEBAR INPUT\n */\n.sidebar__text-input input[type=text] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: 50%;\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n}\n\n.sidebar__text-input input[type=text]:active,\n.sidebar__text-input input[type=text]:focus,\n.sidebar__text-input input[type=text]:hover {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\n/*\n * SIDEBAR SELECT\n */\n\n .sidebar__select {}\n .sidebar__select-select {\n    color: #BBBBBB;\n    -webkit-appearance: none;\n    -moz-appearance: none;\n    appearance: none;\n    box-sizing: border-box;\n    width: 50%;\n    height: 18px;\n    background-color: #333333;\n    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4ODg4ODgiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0iZmVhdGhlciBmZWF0aGVyLWNoZXZyb24tZG93biI+PHBvbHlsaW5lIHBvaW50cz0iNiA5IDEyIDE1IDE4IDkiPjwvcG9seWxpbmU+PC9zdmc+);\n    background-repeat: no-repeat;\n    background-position: 87px 1px;\n    background-size: 16px 16px;\n    margin: 0;\n    padding: 0 0 0 4px;\n    border-radius: 0;\n    border: none;\n    cursor: pointer;\n    outline: none;\n }\n\n.sidebar__select-select:hover,\n.sidebar__select-select:active,\n.sidebar__select-select:active {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\n/*\n * COLOR PICKER\n */\n\n .sidebar__color-picker-color-input {}\n\n .sidebar__color-picker input[type=text] {\n    box-sizing: border-box;\n    background-color: #333333;\n    color: #BBBBBB;\n    display: inline-block;\n    width: calc(50% - 21px); /* 50% minus space of picker circle */\n    height: 18px;\n    outline: none;\n    border: none;\n    border-radius: 0;\n    padding: 0 0 0 4px !important;\n    margin: 0;\n    margin-right: 7px;\n}\n\n.sidebar__color-picker input[type=text]:active,\n.sidebar__color-picker input[type=text]:focus,\n.sidebar__color-picker input[type=text]:hover {\n    background-color: #444444;\n    color: #EEEEEE;\n}\n\n.sidebar__color-picker input[type=color],\n.sidebar__palette-picker input[type=color] {\n    display: inline-block;\n    border-radius: 100%;\n    height: 14px;\n    width: 14px;\n    padding: 0;\n    border: none;\n    border-color: transparent;\n    outline: none;\n    background: none;\n    appearance: none;\n    -moz-appearance: none;\n    -webkit-appearance: none;\n    cursor: pointer;\n    position: relative;\n    top: 3px;\n}\n.sidebar__color-picker input[type=color]:focus,\n.sidebar__palette-picker input[type=color]:focus {\n    outline: none;\n}\n.sidebar__color-picker input[type=color]::-moz-color-swatch,\n.sidebar__palette-picker input[type=color]::-moz-color-swatch {\n    border: none;\n}\n.sidebar__color-picker input[type=color]::-webkit-color-swatch-wrapper,\n.sidebar__palette-picker input[type=color]::-webkit-color-swatch-wrapper {\n    padding: 0;\n}\n.sidebar__color-picker input[type=color]::-webkit-color-swatch,\n.sidebar__palette-picker input[type=color]::-webkit-color-swatch {\n    border: none;\n    border-radius: 100%;\n}\n\n/*\n * Palette Picker\n */\n.sidebar__palette-picker .sidebar__palette-picker-color-input.first {\n    margin-left: 0;\n}\n.sidebar__palette-picker .sidebar__palette-picker-color-input.last {\n    margin-right: 0;\n}\n.sidebar__palette-picker .sidebar__palette-picker-color-input {\n    margin: 0 4px;\n}\n\n.sidebar__palette-picker .circlebutton {\n    width: 14px;\n    height: 14px;\n    border-radius: 1em;\n    display: inline-block;\n    top: 3px;\n    position: relative;\n}\n\n/*\n * Preset\n */\n.sidebar__item-presets-preset\n{\n    padding:4px;\n    cursor:pointer;\n    padding-left:8px;\n    padding-right:8px;\n    margin-right:4px;\n    background-color:#444;\n\n}\n\n.sidebar__item-presets-preset:hover\n{\n    background-color:#666;\n}",};
// vars
const CSS_ELEMENT_CLASS = 'cables-sidebar-style'; /* class for the style element to be generated */
const CSS_ELEMENT_DYNAMIC_CLASS = 'cables-sidebar-dynamic-style'; /* things which can be set via op-port, but not attached to the elements themselves, e.g. minimized opacity */
const SIDEBAR_CLASS = 'sidebar-cables';
const SIDEBAR_ID = 'sidebar'+CABLES.uuid();
const SIDEBAR_ITEMS_CLASS = 'sidebar__items';
const SIDEBAR_OPEN_CLOSE_BTN_CLASS = 'sidebar__close-button';
const SIDEBAR_OPEN_CLOSE_BTN_ICON_CLASS = 'sidebar__close-button-icon';
const BTN_TEXT_OPEN = ''; // 'Close';
const BTN_TEXT_CLOSED = ''; // 'Show Controls';
var cssFileContent = attachments.style_css; /* the CSS style attachment */
let openCloseBtn = null;
let openCloseBtnIcon = null;

// inputs
var visiblePort = op.inValueBool("Visible", true);
var opacityPort = op.inValueSlider('Opacity', 1);
var defaultMinimizedPort = op.inValueBool('Default Minimized');
var minimizedOpacityPort = op.inValueSlider('Minimized Opacity', 0.5);

var side = op.inValueBool('Side');

// outputs
var childrenPort = op.outObject('childs');

var sidebarEl = document.querySelector('.' + SIDEBAR_ID);
if(!sidebarEl) {
    sidebarEl = initSidebarElement();
}
if(!sidebarEl) return;
var sidebarItemsEl = sidebarEl.querySelector('.' + SIDEBAR_ITEMS_CLASS);
childrenPort.set({
    parentElement: sidebarItemsEl,
    parentOp: op,
});
onDefaultMinimizedPortChanged();
initSidebarCss();
updateDynamicStyles();

// change listeners
visiblePort.onChange = onVisiblePortChange;
opacityPort.onChange = onOpacityPortChange;
defaultMinimizedPort.onChange = onDefaultMinimizedPortChanged;
minimizedOpacityPort.onChange = onMinimizedOpacityPortChanged;
op.onDelete = onDelete;

// functions

function onMinimizedOpacityPortChanged() {
    updateDynamicStyles();
}

side.onChange=function()
{
    if(side.get()) sidebarEl.classList.add('sidebar-cables-right');
        else sidebarEl.classList.remove('sidebar-cables-right');
};


function onDefaultMinimizedPortChanged() {
    if(!openCloseBtn) { return; }
    if(defaultMinimizedPort.get()) {
        sidebarEl.classList.add('sidebar--closed');
        // openCloseBtn.textContent = BTN_TEXT_CLOSED;
    } else {
        sidebarEl.classList.remove('sidebar--closed');
        // openCloseBtn.textContent = BTN_TEXT_OPEN;
    }
}

function onOpacityPortChange()
{
    var opacity = opacityPort.get();
    sidebarEl.style.opacity = opacity;
}

function onVisiblePortChange() {
    if(visiblePort.get()) {
        sidebarEl.style.display = 'block';
    } else {
        sidebarEl.style.display = 'none';
    }
}

side.onChanged=function()
{

};

/**
 * Some styles cannot be set directly inline, so a dynamic stylesheet is needed.
 * Here hover states can be set later on e.g.
 */
function updateDynamicStyles() {
    let dynamicStyles = document.querySelectorAll('.' + CSS_ELEMENT_DYNAMIC_CLASS);
    if(dynamicStyles) {
        dynamicStyles.forEach(function(e) {
            e.parentNode.removeChild(e);
        });
    }
    let newDynamicStyle = document.createElement('style');
    newDynamicStyle.classList.add(CSS_ELEMENT_DYNAMIC_CLASS);
    let cssText = '.sidebar--closed .sidebar__close-button { ';
    cssText +=         'opacity: ' + minimizedOpacityPort.get();
    cssText +=     '}';
    let cssTextEl = document.createTextNode(cssText);
    newDynamicStyle.appendChild(cssTextEl);
    document.body.appendChild(newDynamicStyle);
}

function initSidebarElement() {
    var element = document.createElement('div');
    element.classList.add(SIDEBAR_CLASS);
    element.classList.add(SIDEBAR_ID);
    var canvasWrapper = op.patch.cgl.canvas.parentElement; /* maybe this is bad outside cables!? */

    if(!canvasWrapper)
    {
        console.warn("[sidebar] no canvas parentelement found...");
        return;
    }
    canvasWrapper.appendChild(element);
    var items = document.createElement('div');
    items.classList.add(SIDEBAR_ITEMS_CLASS);
    element.appendChild(items);
    openCloseBtn = document.createElement('div');
    openCloseBtn.classList.add(SIDEBAR_OPEN_CLOSE_BTN_CLASS);
    openCloseBtn.addEventListener('click', onOpenCloseBtnClick);
    // openCloseBtn.textContent = BTN_TEXT_OPEN;
    element.appendChild(openCloseBtn);
    openCloseBtnIcon = document.createElement('span');
    openCloseBtnIcon.classList.add(SIDEBAR_OPEN_CLOSE_BTN_ICON_CLASS);
    openCloseBtn.appendChild(openCloseBtnIcon);
    return element;
}

function setClosed(b)
{

}

function onOpenCloseBtnClick(ev) {
  ev.stopPropagation();
//   const sidebarEl = ev.target.closest('.' + SIDEBAR_CLASS);
  if(!sidebarEl) { console.error('Sidebar could not be closed...'); return; }
  sidebarEl.classList.toggle('sidebar--closed');
  const btn = ev.target;
  let btnText = BTN_TEXT_OPEN;
  if(sidebarEl.classList.contains('sidebar--closed')) {
    btnText = BTN_TEXT_CLOSED;
   }
   // btn.textContent = btnText
}

function initSidebarCss() {
    //var cssEl = document.getElementById(CSS_ELEMENT_ID);
    var cssElements = document.querySelectorAll('.' + CSS_ELEMENT_CLASS);
    // remove old script tag
    if(cssElements) {
        cssElements.forEach(function(e) {
            e.parentNode.removeChild(e);
        });
    }
    var newStyle = document.createElement('style');
    newStyle.innerHTML = cssFileContent;
    newStyle.classList.add(CSS_ELEMENT_CLASS);
    document.body.appendChild(newStyle);
}

function onDelete() {
    removeElementFromDOM(sidebarEl);
}

function removeElementFromDOM(el) {
    if(el && el.parentNode && el.parentNode.removeChild) {
        el.parentNode.removeChild(el);
    }
}



};

Ops.Sidebar.Sidebar.prototype = new CABLES.Op();
CABLES.OPS["5a681c35-78ce-4cb3-9858-bc79c34c6819"]={f:Ops.Sidebar.Sidebar,objName:"Ops.Sidebar.Sidebar"};




// **************************************************************
// 
// Ops.Sidebar.Button
// 
// **************************************************************

Ops.Sidebar.Button = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// inputs
var parentPort = op.inObject('link');
var buttonTextPort = op.inValueString('Text', 'Button');

// outputs
var siblingsPort = op.outObject('childs');
var buttonPressedPort = op.outTrigger('Pressed Trigger');

// vars
var el = document.createElement('div');
el.classList.add('sidebar__item');
el.classList.add('sidebar--button');
var input = document.createElement('div');
input.classList.add('sidebar__button-input');
el.appendChild(input);
input.addEventListener('click', onButtonClick);
var inputText = document.createTextNode(buttonTextPort.get());
input.appendChild(inputText);
op.toWorkNeedsParent('Ops.Sidebar.Sidebar');

// events
parentPort.onChange = onParentChanged;
buttonTextPort.onChange = onButtonTextChanged;
op.onDelete = onDelete;

// functions

function onButtonClick() {
    buttonPressedPort.trigger();
}

function onButtonTextChanged() {
    var buttonText = buttonTextPort.get();
    input.textContent = buttonText;
    if(CABLES.UI) {
        op.setTitle('Button: ' + buttonText);
    }
}

function onParentChanged() {
    var parent = parentPort.get();
    if(parent && parent.parentElement) {
        parent.parentElement.appendChild(el);
        siblingsPort.set(null);
        siblingsPort.set(parent);
    } else { // detach
        if(el.parentElement) {
            el.parentElement.removeChild(el);
        }
    }
}

function showElement(el) {
    if(el) {
        el.style.display = 'block';
    }
}

function hideElement(el) {
    if(el) {
        el.style.display = 'none';
    }
}

function onDelete() {
    removeElementFromDOM(el);
}

function removeElementFromDOM(el) {
    if(el && el.parentNode && el.parentNode.removeChild) {
        el.parentNode.removeChild(el);
    }
}


};

Ops.Sidebar.Button.prototype = new CABLES.Op();
CABLES.OPS["118df748-16d1-46f4-b8fc-38d7cc5a0aab"]={f:Ops.Sidebar.Button,objName:"Ops.Sidebar.Button"};




// **************************************************************
// 
// Ops.WebAudio.MediaPlayer
// 
// **************************************************************

Ops.WebAudio.MediaPlayer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
/* ports in */
var volume = op.addInPort(new CABLES.Port(op,"Volume",CABLES.OP_PORT_TYPE_VALUE,{ display:'range' }));
var file = op.addInPort(new CABLES.Port(op,"File",CABLES.OP_PORT_TYPE_VALUE,{ display:'file',filter:'audio' }));
var play = op.addInPort(new CABLES.Port(op,"Play",CABLES.OP_PORT_TYPE_FUNCTION,{ display:'button' }));
var pause = op.addInPort(new CABLES.Port(op,"Pause",CABLES.OP_PORT_TYPE_FUNCTION,{ display:'button' }));
var rewind = op.addInPort(new CABLES.Port(op,"Rewind",CABLES.OP_PORT_TYPE_FUNCTION,{ display:'button' }));
var seekPosition = op.addInPort(new CABLES.Port(op,"Seek Position (Seconds)",CABLES.OP_PORT_TYPE_VALUE));
var jumpToSeekPosition = op.addInPort(new CABLES.Port(op,"Jump To Seek Position",CABLES.OP_PORT_TYPE_FUNCTION,{ display:'button' }));

/* ports out */
var audioOut = op.addOutPort(new CABLES.Port(op, "Audio Out",CABLES.OP_PORT_TYPE_OBJECT));
var duration = op.addOutPort(new CABLES.Port(op,"Duration",CABLES.OP_PORT_TYPE_VALUE));

/* port default values*/
volume.set(1.0);
duration.set(0);

var audioContext = CABLES.WEBAUDIO.createAudioContext(op);

/* vars */
var audio = null;
var media = null;
var source = null;
var isPlaying = false;

function playbackEnded(){
    isPlaying = false;
}

function rewindPlayback(){
    if(audio) { audio.currentTime = 0; }
}

function handleSeek(){
    if(audio) { audio.currentTime = seekPosition.get(); }
}


function startPlayback(){
    if(audio) { audio.play(); }
}

function pausePlayback(){
    if(audio && !audio.paused) { audio.pause(); }
}

function loadMediaFile(){
    if(!file.get()){ return; }
    audio = new Audio();
    audio.crossOrigin = "anonymous";
    var url = op.patch.getFilePath(String(file.get()));
    audio.src = url;
    media = audioContext.createMediaElementSource(audio);
    audio.addEventListener('loadedmetadata', function(){
        duration.set(audio.duration);
    },false);
    audioOut.set(media);
}

function handleFileChange(){
    loadMediaFile();
}

op.onDelete=function() {
    if(audio) audio.pause();
    // TODO: We may need to delete this properly...
};

function handleVolumeChange() {
    if(audio) {
        audio.volume = volume.get();
    }
}

play.onTriggered = startPlayback;
pause.onTriggered = pausePlayback;
rewind.onTriggered = rewindPlayback;
seekPosition.onChange=handleSeek;
jumpToSeekPosition.onTriggered = handleSeek;
file.onChange=handleFileChange;
volume.onChange=handleVolumeChange;


};

Ops.WebAudio.MediaPlayer.prototype = new CABLES.Op();
CABLES.OPS["6bf8a173-a9f9-48d8-b23a-76380dfbe4c5"]={f:Ops.WebAudio.MediaPlayer,objName:"Ops.WebAudio.MediaPlayer"};




// **************************************************************
// 
// Ops.WebAudio.Output
// 
// **************************************************************

Ops.WebAudio.Output = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.requirements=[CABLES.Requirements.WEBAUDIO];

var audioCtx = CABLES.WEBAUDIO.createAudioContext(op);

// constants
var VOLUME_DEFAULT = 1.0;
var VOLUME_MIN = 0;
var VOLUME_MAX = 1;

// vars
var gainNode = audioCtx.createGain();
var destinationNode = audioCtx.destination;
gainNode.connect(destinationNode);
var masterVolume = 1;

// inputs
var audioInPort = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", gainNode);
var volumePort = op.inValueSlider("Volume", VOLUME_DEFAULT);
var mutePort = op.inValueBool("Mute", false);

// functions
// sets the volume, multiplied by master volume
function setVolume() {
    var volume = volumePort.get() * masterVolume;
    if(volume >= VOLUME_MIN && volume <= VOLUME_MAX) {
        // gainNode.gain.value = volume;
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    } else {
        // gainNode.gain.value = VOLUME_DEFAULT * masterVolume;
        gainNode.gain.setValueAtTime(VOLUME_DEFAULT * masterVolume, audioCtx.currentTime);
    }
}

function mute(b) {
    if(b) {
        // gainNode.gain.value = 0;
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    } else {
        setVolume();
    }
}

// change listeners
mutePort.onChange = function() {
    mute(mutePort.get());
};

volumePort.onChange = function() {
    if(mutePort.get()) {
        return;
    }
    setVolume();
};

op.onMasterVolumeChanged = function(v) {
    masterVolume = v;
    setVolume();
};




};

Ops.WebAudio.Output.prototype = new CABLES.Op();
CABLES.OPS["53fdbf4a-bc8d-4c5d-a698-f34fdeb53827"]={f:Ops.WebAudio.Output,objName:"Ops.WebAudio.Output"};




// **************************************************************
// 
// Ops.WebAudio.AudioAnalyzer
// 
// **************************************************************

Ops.WebAudio.AudioAnalyzer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var audioCtx=CABLES.WEBAUDIO.createAudioContext(op);
const inFftSize = op.inSwitch("FFT size",[64,128,256,512,1024],256);
const analyser = audioCtx.createAnalyser();
analyser.smoothingTimeConstant = 0.3;
analyser.fftSize = 256;

const refresh=op.addInPort(new CABLES.Port(op,"refresh",CABLES.OP_PORT_TYPE_FUNCTION));
const audioIn = CABLES.WEBAUDIO.createAudioInPort(op, "Audio In", analyser);
const anData=op.inValueSelect("Data",["Frequency","Time Domain"],"Frequency");

const next=op.outTrigger("Next");
const audioOutPort = CABLES.WEBAUDIO.createAudioOutPort(op, "Audio Out", analyser);
const avgVolume=op.addOutPort(new CABLES.Port(op, "average volume",CABLES.OP_PORT_TYPE_VALUE));
const fftOut=op.addOutPort(new CABLES.Port(op, "fft",CABLES.OP_PORT_TYPE_ARRAY));

var fftBufferLength = analyser.frequencyBinCount;
var fftDataArray = new Uint8Array(fftBufferLength);
var getFreq=true;
var array=null;

inFftSize.onChange = function()
{
    analyser.fftSize = inFftSize.get();
}

anData.onChange=function() {
    if(anData.get()=="Frequency")getFreq=true;
    if(anData.get()=="Time Domain")getFreq=false;
};

refresh.onTriggered = function()
{
    analyser.minDecibels = -90;
    analyser.maxDecibels = 0;

    if(fftBufferLength != analyser.frequencyBinCount)
    {
        console.log("change!");
        fftBufferLength = analyser.frequencyBinCount;
        fftDataArray = new Uint8Array(fftBufferLength);
    }

    if(!fftDataArray)
    {
        //op.log("[audioanalyzer] fftDataArray is null, returning.");
        return;
    }

    var values = 0;

    for (var i = 0; i < fftDataArray.length; i++) values += fftDataArray[i];

    var average = values / fftDataArray.length;

    avgVolume.set(average/128);
    try
    {
        if(getFreq) analyser.getByteFrequencyData(fftDataArray);
            else analyser.getByteTimeDomainData(fftDataArray);
    }
    catch(e) { op.log(e); }

    fftOut.set(null);
    fftOut.set(fftDataArray);

    next.trigger();
};



};

Ops.WebAudio.AudioAnalyzer.prototype = new CABLES.Op();
CABLES.OPS["22523fae-a623-401d-b952-a57c26de4b4e"]={f:Ops.WebAudio.AudioAnalyzer,objName:"Ops.WebAudio.AudioAnalyzer"};




// **************************************************************
// 
// Ops.Math.MapRange
// 
// **************************************************************

Ops.Math.MapRange = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

const result=op.outValue("result");
var v=op.inValueFloat("value");
var old_min=op.inValueFloat("old min");
var old_max=op.inValueFloat("old max");
var new_min=op.inValueFloat("new min");
var new_max=op.inValueFloat("new max");
var easing=op.inValueSelect("Easing",["Linear","Smoothstep","Smootherstep"],"Linear");

op.setPortGroup("Input Range",[old_min,old_max]);
op.setPortGroup("Output Range",[new_min,new_max]);

var ease=0;
var r=0;

easing.onChange=function()
{
    if(easing.get()=="Smoothstep") ease=1;
        else if(easing.get()=="Smootherstep") ease=2;
            else ease=0;
};


function exec()
{
    if(v.get()>=Math.max( old_max.get(),old_min.get() ))
    {
        result.set(new_max.get());
        return;
    }
    else
    if(v.get()<=Math.min( old_max.get(),old_min.get() ))
    {
        result.set(new_min.get());
        return;
    }

    var nMin=new_min.get();
    var nMax=new_max.get();
    var oMin=old_min.get();
    var oMax=old_max.get();
    var x=v.get();

    var reverseInput = false;
    var oldMin = Math.min( oMin, oMax );
    var oldMax = Math.max( oMin, oMax );
    if(oldMin!= oMin) reverseInput = true;

    var reverseOutput = false;
    var newMin = Math.min( nMin, nMax );
    var newMax = Math.max( nMin, nMax );
    if(newMin != nMin) reverseOutput = true;

    var portion=0;

    if(reverseInput) portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin);
        else portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin);

    if(reverseOutput) r=newMax - portion;
        else r=portion + newMin;

    if(ease===0)
    {
        result.set(r);
    }
    else
    if(ease==1)
    {
        x = Math.max(0, Math.min(1, (r-nMin)/(nMax-nMin)));
        result.set( nMin+x*x*(3 - 2*x)* (nMax-nMin) ); // smoothstep
    }
    else
    if(ease==2)
    {
        x = Math.max(0, Math.min(1, (r-nMin)/(nMax-nMin)));
        result.set( nMin+x*x*x*(x*(x*6 - 15) + 10) * (nMax-nMin) ) ; // smootherstep
    }

}

v.set(0);
old_min.set(0);
old_max.set(1);
new_min.set(-1);
new_max.set(1);


v.onChange=exec;
old_min.onChange=exec;
old_max.onChange=exec;
new_min.onChange=exec;
new_max.onChange=exec;

result.set(0);

exec();

};

Ops.Math.MapRange.prototype = new CABLES.Op();
CABLES.OPS["2617b407-60a0-4ff6-b4a7-18136cfa7817"]={f:Ops.Math.MapRange,objName:"Ops.Math.MapRange"};




// **************************************************************
// 
// Ops.Anim.Smooth
// 
// **************************************************************

Ops.Anim.Smooth = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exec=op.inTrigger("Update");
const inMode = op.inBool("Separate inc/dec",false);
const inVal=op.inValue("Value");
const next=op.outTrigger("Next");
const inDivisorUp=op.inValue("Inc factor",4);
const inDivisorDown=op.inValue("Dec factor",4);
const result=op.outValue("Result",0);

var val=0;
var goal=0;
var oldVal=0;
var lastTrigger=0;
op.toWorkPortsNeedToBeLinked(exec);

var divisorUp;
var divisorDown;
var divisor = 4;

var selectIndex = 0;
const MODE_SINGLE = 0;
const MODE_UP_DOWN = 1;

onFilterChange();
getDivisors();

inMode.setUiAttribs({hidePort:true});

inDivisorUp.onChange = inDivisorDown.onChange = getDivisors;
inMode.onChange = onFilterChange;
update();

function onFilterChange()
{
    var selectedMode = inMode.get();
    if(selectedMode === false) selectIndex = MODE_SINGLE;
    else if(selectedMode === true) selectIndex = MODE_UP_DOWN;


    if(selectIndex == MODE_SINGLE)
    {
        inDivisorDown.setUiAttribs({greyout:true});
        inDivisorUp.setUiAttribs({title:"Inc/Dec factor"});

    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        inDivisorDown.setUiAttribs({greyout:false});
        inDivisorUp.setUiAttribs({title:"Inc factor"});
    }

    getDivisors();
    update();
};

function getDivisors()
{
    if(selectIndex == MODE_SINGLE)
    {
        divisorUp=inDivisorUp.get();
        divisorDown=inDivisorUp.get();
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        divisorUp=inDivisorUp.get();
        divisorDown=inDivisorDown.get();
    }

    if(divisorUp<=0.2 || divisorUp != divisorUp )divisorUp=0.2;
    if(divisorDown<=0.2 || divisorDown != divisorDown )divisorDown=0.2;
};

inVal.onChange=function()
{
    goal=inVal.get();
};

inDivisorUp.onChange=function()
{
    getDivisors();
};

function update()
{
    var tm=1;
    if(CABLES.now()-lastTrigger>500 || lastTrigger===0)val=inVal.get();
    else tm=(CABLES.now()-lastTrigger)/16;
    lastTrigger=CABLES.now();

    if(divisor<=0)divisor=0.0001;

    var diff = goal-val;

    if(diff  >= 0)
        val=val+(diff)/(divisorDown*tm);
    else
        val=val+(diff)/(divisorUp*tm);
    //val=val+(goal-val)/(divisor*tm);

    if(val>0 && val<0.000000001)val=0;
    if(divisor!=divisor)val=0;
    if(val!=val|| val== -Infinity || val==Infinity)val=inVal.get();

    if(oldVal!=val)
    {
        result.set(val);
        oldVal=val;
    }

    next.trigger();
};

exec.onTriggered = function()
{
    update();
};






};

Ops.Anim.Smooth.prototype = new CABLES.Op();
CABLES.OPS["5677b5b5-753a-4fbf-9e91-64c81ec68a2f"]={f:Ops.Anim.Smooth,objName:"Ops.Anim.Smooth"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Vignette_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.Vignette_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={vignette_frag:"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float lensRadius1;\nUNI float aspect;\nUNI float amount;\nUNI float strength;\nUNI float sharp;\n\nUNI float r,g,b;\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n    vec4 vcol=vec4(r,g,b,1.0);\n    vec4 col=texture(tex,texCoord);\n    vec2 tcPos=vec2(texCoord.x,(texCoord.y-0.5)*aspect+0.5);\n    float dist = distance(tcPos, vec2(0.5,0.5));\n    float am = (1.0-smoothstep( (lensRadius1+0.5), (lensRadius1*0.99+0.5)*sharp, dist));\n\n    col=mix(col,vcol,am*strength);\n    vec4 base=texture(tex,texCoord);\n\n\n    outColor=cgl_blend(base,col,amount);\n\n\n\n}\n",};
const
     render=op.inTrigger("Render"),
     blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
     amount=op.inValueSlider("Amount",1),
     trigger=op.outTrigger("Trigger"),
     strength=op.inValueSlider("Strength",1),
     lensRadius1=op.inValueSlider("Radius",0.3),
     sharp=op.inValueSlider("Sharp",0.25),
     aspect=op.inValue("Aspect",1),
     r = op.inValueSlider("r", 0),
     g = op.inValueSlider("g", 0),
     b = op.inValueSlider("b", 0);

r.setUiAttribs({ colorPick: true });

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl,'vignette');

shader.setSource(shader.getDefaultVertexShader(),attachments.vignette_frag);

const
    textureUniform=new CGL.Uniform(shader,'t','tex',0),
    amountUniform=new CGL.Uniform(shader,'f','amount',amount),
    uniLensRadius1=new CGL.Uniform(shader,'f','lensRadius1',lensRadius1),
    uniaspect=new CGL.Uniform(shader,'f','aspect',aspect),
    unistrength=new CGL.Uniform(shader,'f','strength',strength),
    unisharp=new CGL.Uniform(shader,'f','sharp',sharp),
    unir=new CGL.Uniform(shader,'f','r',r),
    unig=new CGL.Uniform(shader,'f','g',g),
    unib=new CGL.Uniform(shader,'f','b',b);

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.setShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );

    cgl.currentTextureEffect.finish();
    cgl.setPreviousShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Vignette_v2.prototype = new CABLES.Op();
CABLES.OPS["ee274501-ac60-49ab-a854-80aa38c36f76"]={f:Ops.Gl.TextureEffects.Vignette_v2,objName:"Ops.Gl.TextureEffects.Vignette_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.DrawImage_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.DrawImage_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={drawimage_frag:"#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n    UNI sampler2D tex;\n    UNI sampler2D image;\n#endif\n\nIN mat3 transform;\nUNI float rotate;\n\n{{CGL.BLENDMODES}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\n#ifdef ASPECT_RATIO\n    UNI float aspectTex;\n    UNI float aspectPos;\n#endif\n\nvoid main()\n{\n    vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n    #ifdef HAS_TEXTURES\n        vec2 tc=texCoord;\n\n        #ifdef TEX_FLIP_X\n            tc.x=1.0-tc.x;\n        #endif\n        #ifdef TEX_FLIP_Y\n            tc.y=1.0-tc.y;\n        #endif\n\n        #ifdef ASPECT_RATIO\n            #ifdef ASPECT_AXIS_X\n                tc.y=(1.0-aspectPos)-(((1.0-aspectPos)-tc.y)*aspectTex);\n            #endif\n            #ifdef ASPECT_AXIS_Y\n                tc.x=(1.0-aspectPos)-(((1.0-aspectPos)-tc.x)/aspectTex);\n            #endif\n        #endif\n\n        #ifdef TEX_TRANSFORM\n            vec3 coordinates=vec3(tc.x, tc.y,1.0);\n            tc=(transform * coordinates ).xy;\n        #endif\n\n        blendRGBA=texture(image,tc);\n\n        vec3 blend=blendRGBA.rgb;\n        vec4 baseRGBA=texture(tex,texCoord);\n        vec3 base=baseRGBA.rgb;\n        vec3 colNew=_blend(base,blend);\n\n        #ifdef REMOVE_ALPHA_SRC\n            blendRGBA.a=1.0;\n        #endif\n\n        #ifdef HAS_TEXTUREALPHA\n            vec4 colImgAlpha=texture(imageAlpha,tc);\n            float colImgAlphaAlpha=colImgAlpha.a;\n\n            #ifdef ALPHA_FROM_LUMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef ALPHA_FROM_INV_UMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=1.0-(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n        #endif\n    #endif\n\n    #ifdef CLIP_REPEAT\n        if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)colNew.rgb=vec3(0.0);\n    #endif\n\n    #ifdef ASPECT_RATIO\n        #ifdef ASPECT_CROP\n            if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0) colNew.rgb=base.rgb;//vec3(0.0);\n        #endif\n    #endif\n\n    blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);\n    blendRGBA.a=1.0;\n\n    outColor= blendRGBA;\n\n}",drawimage_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nUNI float posX;\nUNI float posY;\nUNI float scaleX;\nUNI float scaleY;\nUNI float rotate;\n\nOUT vec2 texCoord;\nOUT vec3 norm;\nOUT mat3 transform;\n\nvoid main()\n{\n   texCoord=attrTexCoord;\n   norm=attrVertNormal;\n\n   #ifdef TEX_TRANSFORM\n        vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n        float angle = radians( rotate );\n        vec2 scale= vec2(scaleX,scaleY);\n        vec2 translate= vec2(posX,posY);\n\n        transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n            - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n            - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n   #endif\n\n   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}\n",};
var render=op.inTrigger('render');
var blendMode=CGL.TextureEffect.AddBlendSelect(op,"blendMode");
var amount=op.inValueSlider("amount",1);

var image=op.inTexture("image");
var removeAlphaSrc=op.inValueBool("removeAlphaSrc",false);

var imageAlpha=op.inTexture("imageAlpha");
var alphaSrc=op.inValueSelect("alphaSrc",['alpha channel','luminance','luminance inv']);
var invAlphaChannel=op.inValueBool("invert alpha channel");

const inAspect=op.inValueBool("Aspect Ratio",false);
const inAspectAxis=op.inValueSelect("Stretch Axis",['X','Y'],"X");
const inAspectPos=op.inValueSlider("Position",0.0);
const inAspectCrop=op.inValueBool("Crop",false);


var trigger=op.outTrigger('trigger');

blendMode.set('normal');
var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl,'drawimage');


imageAlpha.onLinkChanged=updateAlphaPorts;

op.setPortGroup("Mask",[imageAlpha,alphaSrc,invAlphaChannel]);
op.setPortGroup("Aspect Ratio",[inAspect,inAspectPos,inAspectCrop,inAspectAxis]);


removeAlphaSrc.onChange=updateRemoveAlphaSrc;

function updateAlphaPorts()
{
    if(imageAlpha.isLinked())
    {
        removeAlphaSrc.setUiAttribs({greyout:true});
        alphaSrc.setUiAttribs({greyout:false});
        invAlphaChannel.setUiAttribs({greyout:false});
    }
    else
    {
        removeAlphaSrc.setUiAttribs({greyout:false});
        alphaSrc.setUiAttribs({greyout:true});
        invAlphaChannel.setUiAttribs({greyout:true});
    }
}

op.toWorkPortsNeedToBeLinked(image);

shader.setSource(attachments.drawimage_vert,attachments.drawimage_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var textureImaghe=new CGL.Uniform(shader,'t','image',1);
var textureAlpha=new CGL.Uniform(shader,'t','imageAlpha',2);

const uniTexAspect=new CGL.Uniform(shader,'f','aspectTex',1);
const uniAspectPos=new CGL.Uniform(shader,'f','aspectPos',inAspectPos);

invAlphaChannel.onChange=function()
{
    if(invAlphaChannel.get()) shader.define('INVERT_ALPHA');
        else shader.removeDefine('INVERT_ALPHA');
};


inAspect.onChange=updateAspectRatio;
inAspectCrop.onChange=updateAspectRatio;
inAspectAxis.onChange=updateAspectRatio;
function updateAspectRatio()
{
    shader.removeDefine('ASPECT_AXIS_X');
    shader.removeDefine('ASPECT_AXIS_Y');

    if(inAspect.get())
    {
        shader.define('ASPECT_RATIO');

        if(inAspectCrop.get()) shader.define('ASPECT_CROP');
            else shader.removeDefine('ASPECT_CROP');

        if(inAspectAxis.get()=="X") shader.define('ASPECT_AXIS_X');
        if(inAspectAxis.get()=="Y") shader.define('ASPECT_AXIS_Y');


        inAspectPos.setUiAttribs({greyout:false});
        inAspectCrop.setUiAttribs({greyout:false});
        inAspectAxis.setUiAttribs({greyout:false});
    }
    else
    {
        shader.removeDefine('ASPECT_RATIO');
        if(inAspectCrop.get()) shader.define('ASPECT_CROP');
            else shader.removeDefine('ASPECT_CROP');

        if(inAspectAxis.get()=="X") shader.define('ASPECT_AXIS_X');
        if(inAspectAxis.get()=="Y") shader.define('ASPECT_AXIS_Y');

        inAspectPos.setUiAttribs({greyout:true});
        inAspectCrop.setUiAttribs({greyout:true});
        inAspectAxis.setUiAttribs({greyout:true});
    }
}




function updateRemoveAlphaSrc()
{
    if(removeAlphaSrc.get()) shader.define('REMOVE_ALPHA_SRC');
        else shader.removeDefine('REMOVE_ALPHA_SRC');
}


alphaSrc.onChange=function()
{
    shader.toggleDefine('ALPHA_FROM_LUMINANCE',alphaSrc.get()=='luminance');
    shader.toggleDefine('ALPHA_FROM_INV_UMINANCE',alphaSrc.get()=='luminance_inv');
};

alphaSrc.set("alpha channel");


{
    //
    // texture flip
    //
    var flipX=op.inValueBool("flip x");
    var flipY=op.inValueBool("flip y");

    flipX.onChange=function()
    {
        if(flipX.get()) shader.define('TEX_FLIP_X');
            else shader.removeDefine('TEX_FLIP_X');
    };

    flipY.onChange=function()
    {
        if(flipY.get()) shader.define('TEX_FLIP_Y');
            else shader.removeDefine('TEX_FLIP_Y');
    };
}

{
    //
    // texture transform
    //

    var doTransform=op.inValueBool("Transform");

    var scaleX=op.inValueSlider("Scale X",1);
    var scaleY=op.inValueSlider("Scale Y",1);

    var posX=op.inValue("Position X",0);
    var posY=op.inValue("Position Y",0);

    var rotate=op.inValue("Rotation",0);

    var inClipRepeat=op.inValueBool("Clip Repeat",false);

    inClipRepeat.onChange=updateClip;
    function updateClip()
    {
        if(inClipRepeat.get()) shader.define('CLIP_REPEAT');
            else shader.removeDefine('CLIP_REPEAT');
    }


    var uniScaleX=new CGL.Uniform(shader,'f','scaleX',scaleX);
    var uniScaleY=new CGL.Uniform(shader,'f','scaleY',scaleY);

    var uniPosX=new CGL.Uniform(shader,'f','posX',posX);
    var uniPosY=new CGL.Uniform(shader,'f','posY',posY);
    var uniRotate=new CGL.Uniform(shader,'f','rotate',rotate);

    doTransform.onChange=updateTransformPorts;
}

function updateTransformPorts()
{
    shader.toggleDefine('TEX_TRANSFORM',doTransform.get());
    if(doTransform.get())
    {
        // scaleX.setUiAttribs({hidePort:false});
        // scaleY.setUiAttribs({hidePort:false});
        // posX.setUiAttribs({hidePort:false});
        // posY.setUiAttribs({hidePort:false});
        // rotate.setUiAttribs({hidePort:false});

        scaleX.setUiAttribs({greyout:false});
        scaleY.setUiAttribs({greyout:false});
        posX.setUiAttribs({greyout:false});
        posY.setUiAttribs({greyout:false});
        rotate.setUiAttribs({greyout:false});
    }
    else
    {
        scaleX.setUiAttribs({greyout:true});
        scaleY.setUiAttribs({greyout:true});
        posX.setUiAttribs({greyout:true});
        posY.setUiAttribs({greyout:true});
        rotate.setUiAttribs({greyout:true});

        // scaleX.setUiAttribs({"hidePort":true});
        // scaleY.setUiAttribs({"hidePort":true});
        // posX.setUiAttribs({"hidePort":true});
        // posY.setUiAttribs({"hidePort":true});
        // rotate.setUiAttribs({"hidePort":true});


    }

    // op.refreshParams();
}

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

var amountUniform=new CGL.Uniform(shader,'f','amount',amount);

imageAlpha.onChange=function()
{
    if(imageAlpha.get() && imageAlpha.get().tex)
    {
        shader.define('HAS_TEXTUREALPHA');
    }
    else
    {
        shader.removeDefine('HAS_TEXTUREALPHA');
    }
};

function doRender()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    var tex=image.get();
    if(tex && tex.tex && amount.get()>0.0)
    {
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        const imgTex=cgl.currentTextureEffect.getCurrentSourceTexture();
        cgl.setTexture(0,imgTex.tex );

        uniTexAspect.setValue( 1/(tex.height/tex.width*imgTex.width/imgTex.height));



        cgl.setTexture(1, tex.tex );
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, image.get().tex );

        if(imageAlpha.get() && imageAlpha.get().tex)
        {
            cgl.setTexture(2, imageAlpha.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, imageAlpha.get().tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();
    }

    trigger.trigger();
}

render.onTriggered=doRender;
updateTransformPorts();
updateRemoveAlphaSrc();
updateAlphaPorts();
updateAspectRatio();


};

Ops.Gl.TextureEffects.DrawImage_v2.prototype = new CABLES.Op();
CABLES.OPS["f94b5136-61fd-4558-8348-e7c8db5a6348"]={f:Ops.Gl.TextureEffects.DrawImage_v2,objName:"Ops.Gl.TextureEffects.DrawImage_v2"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial_v2
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={basicmaterial_frag:"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=vec4(r,g,b,a);\n\n    #ifdef HAS_TEXTURES\n        vec2 uv=vec2(texCoord.s,1.0-texCoord.t);\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(tex,uv);\n\n            #ifdef COLORIZE_TEXTURE\n                col.r*=r;\n                col.g*=g;\n                col.b*=b;\n            #endif\n        #endif\n        col.a*=a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                uv=vec2(texCoordOrig.s,1.0-texCoordOrig.t);\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,uv).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,uv).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,uv).b;\n            #endif\n            // #endif\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n    outColor = col;\n}\n",basicmaterial_vert:"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nIN vec3 attrVertNormal;\nIN vec2 attrTexCoord;\nIN float attrVertIndex;\n\nOUT vec3 norm;\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI float diffuseRepeatX;\n    UNI float diffuseRepeatY;\n    UNI float texOffsetX;\n    UNI float texOffsetY;\n#endif\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n\n    norm=attrVertNormal;\n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n        texCoord.y=texCoord.y*diffuseRepeatY+texOffsetY;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.0);\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       mvMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * mvMatrix * vec4((\n           position.x * vec3(\n               mvMatrix[0][0],\n               mvMatrix[1][0],\n               mvMatrix[2][0] ) +\n           position.y * vec3(\n               mvMatrix[0][1],\n               mvMatrix[1][1],\n               mvMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        mvMatrix=viewMatrix * mMatrix;\n    #endif\n\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * mvMatrix * pos;\n    #endif\n}\n",};
const render=op.inTrigger("render");
const trigger=op.outTrigger('trigger');
const shaderOut=op.outObject("shader");
shaderOut.ignoreValueSerialize=true;

const cgl=op.patch.cgl;

op.toWorkPortsNeedToBeLinked(render,trigger);

const shader=new CGL.Shader(cgl,"basicmaterialnew");
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.bindTextures=bindTextures;
shader.setSource(attachments.basicmaterial_vert,attachments.basicmaterial_frag);
shaderOut.set(shader);

render.onTriggered=doRender;

function bindTextures()
{
    if(diffuseTexture.get()) cgl.setTexture(0, diffuseTexture.get().tex);
    if(op.textureOpacity.get()) cgl.setTexture(1, op.textureOpacity.get().tex);
}

op.preRender=function()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if(!shader)return;

    cgl.setShader(shader);
    shader.bindTextures();
    trigger.trigger();
    cgl.setPreviousShader();
}

// rgba colors
const r=op.inValueSlider("r",Math.random());
const g=op.inValueSlider("g",Math.random());
const b=op.inValueSlider("b",Math.random());
const a=op.inValueSlider("a",1);
r.setUiAttribs({"colorPick":true});

const unir=new CGL.Uniform(shader,'f','r',r);
const unig=new CGL.Uniform(shader,'f','g',g);
const unib=new CGL.Uniform(shader,'f','b',b);
const unia=new CGL.Uniform(shader,'f','a',a);

op.setPortGroup("Color",[r,g,b,a]);

    // diffuse outTexture

    var diffuseTexture=op.inTexture("texture");
    var diffuseTextureUniform=null;
    shader.bindTextures=bindTextures;

    diffuseTexture.onChange=updateDiffuseTexture;

    function updateDiffuseTexture()
    {
        if(diffuseTexture.get())
        {
            if(!shader.hasDefine('HAS_TEXTURE_DIFFUSE'))shader.define('HAS_TEXTURE_DIFFUSE');
            if(!diffuseTextureUniform)diffuseTextureUniform=new CGL.Uniform(shader,'t','texDiffuse',0);

            diffuseRepeatX.setUiAttribs({greyout:false});
            diffuseRepeatY.setUiAttribs({greyout:false});
            diffuseOffsetX.setUiAttribs({greyout:false});
            diffuseOffsetY.setUiAttribs({greyout:false});
            colorizeTexture.setUiAttribs({greyout:false});
        }
        else
        {
            shader.removeUniform('texDiffuse');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            diffuseTextureUniform=null;

            diffuseRepeatX.setUiAttribs({greyout:true});
            diffuseRepeatY.setUiAttribs({greyout:true});
            diffuseOffsetX.setUiAttribs({greyout:true});
            diffuseOffsetY.setUiAttribs({greyout:true});
            colorizeTexture.setUiAttribs({greyout:true});
        }
    };

const colorizeTexture=op.inValueBool("colorizeTexture",false);

op.setPortGroup("Color Texture",[diffuseTexture,colorizeTexture]);

// opacity texture
op.textureOpacity=op.inTexture("textureOpacity");
op.textureOpacityUniform=null;

op.alphaMaskSource=op.inSwitch("Alpha Mask Source",["Luminance","R","G","B","A"],"Luminance");
op.alphaMaskSource.onChange=updateAlphaMaskMethod;
op.alphaMaskSource.setUiAttribs({greyout:true});

function updateAlphaMaskMethod()
{
    if(op.alphaMaskSource.get()=='Alpha Channel') shader.define('ALPHA_MASK_ALPHA');
        else shader.removeDefine('ALPHA_MASK_ALPHA');

    if(op.alphaMaskSource.get()=='Luminance') shader.define('ALPHA_MASK_LUMI');
        else shader.removeDefine('ALPHA_MASK_LUMI');

    if(op.alphaMaskSource.get()=='R') shader.define('ALPHA_MASK_R');
        else shader.removeDefine('ALPHA_MASK_R');

    if(op.alphaMaskSource.get()=='G') shader.define("ALPHA_MASK_G");
        else shader.removeDefine('ALPHA_MASK_G');

    if(op.alphaMaskSource.get()=='B') shader.define('ALPHA_MASK_B');
        else shader.removeDefine('ALPHA_MASK_B');
}

op.textureOpacity.onChange=updateOpacity;
function updateOpacity()
{

    if(op.textureOpacity.get())
    {
        if(op.textureOpacityUniform!==null)return;
        shader.removeUniform('texOpacity');
        shader.define('HAS_TEXTURE_OPACITY');
        if(!op.textureOpacityUniform)op.textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);

        op.alphaMaskSource.setUiAttribs({greyout:false});
        discardTransPxl.setUiAttribs({greyout:false});
        texCoordAlpha.setUiAttribs({greyout:false});

    }
    else
    {
        shader.removeUniform('texOpacity');
        shader.removeDefine('HAS_TEXTURE_OPACITY');
        op.textureOpacityUniform=null;

        op.alphaMaskSource.setUiAttribs({greyout:true});
        discardTransPxl.setUiAttribs({greyout:true});
        texCoordAlpha.setUiAttribs({greyout:true});
    }
    updateAlphaMaskMethod();
};


var texCoordAlpha=op.inValueBool("Opacity TexCoords Transform",false);
const discardTransPxl=op.inValueBool("Discard Transparent Pixels");

discardTransPxl.onChange=function()
{
    if(discardTransPxl.get()) shader.define('DISCARDTRANS');
        else shader.removeDefine('DISCARDTRANS');
};


texCoordAlpha.onChange=function()
{
    if(texCoordAlpha.get()) shader.define('TRANSFORMALPHATEXCOORDS');
        else shader.removeDefine('TRANSFORMALPHATEXCOORDS');
};

op.setPortGroup("Opacity",[op.textureOpacity,op.alphaMaskSource,discardTransPxl,texCoordAlpha]);


colorizeTexture.onChange=function()
{
    if(colorizeTexture.get()) shader.define('COLORIZE_TEXTURE');
        else shader.removeDefine('COLORIZE_TEXTURE');
};




// texture coords

const diffuseRepeatX=op.inValue("diffuseRepeatX",1);
const diffuseRepeatY=op.inValue("diffuseRepeatY",1);
const diffuseOffsetX=op.inValue("Tex Offset X",0);
const diffuseOffsetY=op.inValue("Tex Offset Y",0);

const diffuseRepeatXUniform=new CGL.Uniform(shader,'f','diffuseRepeatX',diffuseRepeatX);
const diffuseRepeatYUniform=new CGL.Uniform(shader,'f','diffuseRepeatY',diffuseRepeatY);
const diffuseOffsetXUniform=new CGL.Uniform(shader,'f','texOffsetX',diffuseOffsetX);
const diffuseOffsetYUniform=new CGL.Uniform(shader,'f','texOffsetY',diffuseOffsetY);

op.setPortGroup("Texture Transform",[diffuseRepeatX,diffuseRepeatY,diffuseOffsetX,diffuseOffsetY]);



const doBillboard=op.inValueBool("billboard",false);

doBillboard.onChange=function()
{
    if(doBillboard.get()) shader.define('BILLBOARD');
        else shader.removeDefine('BILLBOARD');
};

updateOpacity();
updateDiffuseTexture();

};

Ops.Gl.Shader.BasicMaterial_v2.prototype = new CABLES.Op();
CABLES.OPS["51f2207b-daaa-447f-bdbe-87fdd72f0c40"]={f:Ops.Gl.Shader.BasicMaterial_v2,objName:"Ops.Gl.Shader.BasicMaterial_v2"};




// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    posX=op.inValue("posX",0),
    posY=op.inValue("posY",0),
    posZ=op.inValue("posZ",0),
    scale=op.inValue("scale",1),
    rotX=op.inValue("rotX",0),
    rotY=op.inValue("rotY",0),
    rotZ=op.inValue("rotZ",0),
    trigger=op.outTrigger("trigger");

op.setPortGroup('Rotation',[rotX,rotY,rotZ]);
op.setPortGroup('Position',[posX,posY,posZ]);
op.setPortGroup('Scale',[scale]);
op.setUiAxisPorts(posX,posY,posZ);

const cgl=op.patch.cgl;
var vPos=vec3.create();
var vScale=vec3.create();
var transMatrix = mat4.create();
mat4.identity(transMatrix);

var
    doScale=false,
    doTranslate=false,
    translationChanged=true,
    scaleChanged=true,
    rotChanged=true;

rotX.onChange=rotY.onChange=rotZ.onChange=setRotChanged;
posX.onChange=posY.onChange=posZ.onChange=setTranslateChanged;
scale.onChange=setScaleChanged;

render.onTriggered=function()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    var updateMatrix=false;
    if(translationChanged)
    {
        updateTranslation();
        updateMatrix=true;
    }
    if(scaleChanged)
    {
        updateScale();
        updateMatrix=true;
    }
    if(rotChanged) updateMatrix=true;

    if(updateMatrix) doUpdateMatrix();

    cgl.pushModelMatrix();
    mat4.multiply(cgl.mMatrix,cgl.mMatrix,transMatrix);

    trigger.trigger();
    cgl.popModelMatrix();

    if(CABLES.UI && gui.patch().isCurrentOp(op))
        gui.setTransformGizmo(
            {
                posX:posX,
                posY:posY,
                posZ:posZ,
            });
};

op.transform3d=function()
{
    return { pos:[posX,posY,posZ] };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

    if(rotX.get()!==0)mat4.rotateX(transMatrix,transMatrix, rotX.get()*CGL.DEG2RAD);
    if(rotY.get()!==0)mat4.rotateY(transMatrix,transMatrix, rotY.get()*CGL.DEG2RAD);
    if(rotZ.get()!==0)mat4.rotateZ(transMatrix,transMatrix, rotZ.get()*CGL.DEG2RAD);

    if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    rotChanged=false;
}

function updateTranslation()
{
    doTranslate=false;
    if(posX.get()!==0.0 || posY.get()!==0.0 || posZ.get()!==0.0) doTranslate=true;
    vec3.set(vPos, posX.get(),posY.get(),posZ.get());
    translationChanged=false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale=true;
    vec3.set(vScale, scale.get(),scale.get(),scale.get());
    scaleChanged=false;
}

function setTranslateChanged()
{
    translationChanged=true;
}

function setScaleChanged()
{
    scaleChanged=true;
}

function setRotChanged()
{
    rotChanged=true;
}

doUpdateMatrix();




};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();
CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Gl.Matrix.Transform,objName:"Ops.Gl.Matrix.Transform"};


