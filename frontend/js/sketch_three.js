let renderer, camera, scene;

let intensity, geometry, material, color, cube, edges, line, sphere;

let orientationArr = [0, 0, 0];
let quaternion = [0, 0, 0, 0]

let mainObject;

// const objLoader = new OBJLoader();


const initTHREE = () => {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, mainCanvas.offsetWidth / mainCanvas.offsetHeight, 0.1, 1000);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(mainCanvas.offsetWidth, mainCanvas.offsetHeight);
        mainCanvas.appendChild(renderer.domElement);

        const light = new THREE.PointLight( 0xff0000, 1, 100 );
        light.position.set( 50, 50, 50 );
        scene.add( light );

        loadObjects();
        
        camera.position.z = 50;
        startAnimation(cube)    
}

function startAnimation(object) {
       scene.add(object);
       mainObject = object;
        animate();
}

async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
}

let angle = 0;
async function animate(object) {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);

        mainObject.rotation.x = angle;
        mainObject.rotation.y = angle*0.73;
        mainObject.rotation.z = angle*1.2;

        angle>=10?angle=0:angle += 0.01;

        await sleep(1000);

        // line.rotation.x = THREE.Math.degToRad(360 - orientationArr[2]);
        // line.rotation.y = THREE.Math.degToRad(orientationArr[1]);
        // line.rotation.z = THREE.Math.degToRad(orientationArr[0]);
}