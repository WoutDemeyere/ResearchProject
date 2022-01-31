let selectedObject = "cube", textureName = "color", objectSize = 300, orientationMode = 'auto';
let rotationArr = [0, 0, 0], gyroArr = [0, 0, 0];

let objectColor = {
        'hue': 0,
        'sat': 0,
        'lum': 0
}

function hslToRgb(h, s, l){
        var r, g, b;
    
        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
    
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
    
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

const sketch = function (p) {
        let angle = 0;
        let c = null;

        let textures = {
                'world': null,
                'wood': null,
                'stone': null,
                'water': null,
                'color': null,
                'camera': null,
                
        };

        p.preload = function() {
                textures.world = p.loadImage('./textures/world.jpg');
                textures.wood = p.loadImage('./textures/wood.jpg');
                textures.stone = p.loadImage('./textures/stone.jpg');
                textures.water = p.loadImage('./textures/water.jpg');
        }
        

        p.setup = function () {
                let cnv = p.createCanvas(mainCanvas.offsetWidth, mainCanvas.offsetHeight, p.WEBGL);
                cnv.parent(mainCanvas);
                p.angleMode(p.DEGREES);

                textures.camera = p.createCapture(p.VIDEO);
                textures.camera.hide()
        }

        p.draw = function () {
                p.background(25, 0, 100);
                p.rectMode(p.CENTER);
                
                p.directionalLight(255, 255, 255, 0, 0, -1)

                p.noStroke(255);
                drawObject(selectedObject);
                angle+=0.1;
        }

        drawObject = function(objectName) {

                switch(orientationMode) {
                        case 'auto':
                                p.rotateX(angle);
                                p.rotateY(angle*0.7);
                                p.rotateZ(angle*1.2);
                                break;
                        case 'remote':
                                p.rotateX(rotationArr[2]);
                                p.rotateY(rotationArr[0]);
                                p.rotateZ(rotationArr[1]);
                }

                switch(textureName) {
                        case 'world':
                                p.texture(textures.world)
                                break;
                        case 'wood':
                                p.texture(textures.wood)
                                break;
                        case 'stone':
                                p.texture(textures.stone)
                                break;
                        case 'water':
                                p.texture(textures.water)
                                break;
                        case 'color':
                                colorArr = hslToRgb(p.map(objectColor['hue'], 0, 360, 0, 1), objectColor['sat']/100, objectColor['lum']/100)
                                c = p.color(colorArr[0], colorArr[1], colorArr[2])
                                p.ambientMaterial(c);
                                break;
                        case 'world':
                                p.texture(textures.world)
                                break;
                        case 'camera':
                                p.texture(textures.camera)
                                break;
                        default:
                                colorArr = hslToRgb(p.map(objectColor['hue'], 0, 360, 0, 1), objectColor['sat']/100, objectColor['lum']/100)
                                c = p.color(colorArr[0], colorArr[1], colorArr[2])
                                p.ambientMaterial(c);
                                break;
                }


                switch(objectName) {
                        case 'cube':
                                p.box(objectSize, objectSize, objectSize)
                                break;
                        case 'plane':
                                p.plane(objectSize, objectSize)
                                break;

                        case 'sphere':
                                p.sphere(objectSize)
                                break;

                        case 'torus':
                                p.torus(objectSize, objectSize/10)
                                break;

                        case 'cylinder':
                                p.cylinder(objectSize/10, objectSize)
                                break;
                                
                        case 'cone':
                                p.cone(objectSize/5, objectSize);
                                break;

                        case 'egg':
                                p.ellipsoid(objectSize*0.7, objectSize*0.7, objectSize);
                                break;

                                
                }        
        }
}