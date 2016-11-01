/**
 * Created by mark on 10/28/16.
 */

Physijs.scripts.worker = 'lib/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

document.addEventListener("DOMContentLoaded", onLoad);

var renderer, camera, scene, controls, plane;

var points = [];
var line;
var thing;

const ENABLE_CONTROLS = true;
const ENABLE_AXIS = true;

var objectCreated = false;

function onLoad() {
    addEventListeners();
    sceneSetup();
    initialDraw();
    animate();
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
} // function onLoad()

function addEventListeners() {
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);

    window.addEventListener("keypress", onKeyPress);
    window.addEventListener('resize', onWindowResize, false);
} // function addEventListeners()

/*
 * KEYBOARD
 */

function onKeyPress(event) {
    switch (event.keyCode) {
        case 'e'.charCodeAt(0):
            makeSolidFromPointsExtruded();
            break;
        case 'c'.charCodeAt(0):
            initialDraw();
            break;
        case 'l'.charCodeAt(0):
            makeSolidFromPointsLathe();
            break;
        case ' '.charCodeAt(0):
            makePoint();
            break;
        default:
            break;
    } // switch keyCode

} // function onKeyDown()

/*
 * MOUSE
 */

function onMouseDown(event) {
    if (objectCreated) {
        return;
    }
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 -1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 +1;

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    var pos = raycaster.ray.intersectPlane(plane);

    makePoint(pos.x, pos.y);
} // function onMouseDown()

function onMouseUp(event) {

} // function onMouseUp()

function onMouseMove(event) {

} // function onMouseMove()

/*
 * WINDOW RESIZE
 */

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
} // function onWindowResize()

/*
 * SCENE SETUP
 */

function sceneSetup() {
    /* Create the renderer */

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    /* Create the scene */

    scene = new Physijs.Scene({reportSize: 30, fixedTimeStep:1/120});
    scene.setGravity(new THREE.Vector3(0, 0, 0));

    /* Create the camera */

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 60);

    scene.add(camera);  // add camera to scene

    /* Create the lights */

    var light = new THREE.PointLight(0xa0a0a0, 0.5, 0);
    light.position.set(50, 70, 100);
    scene.add(light);

    light = new THREE.AmbientLight(0x808080, 1);
    scene.add(light);

    /* Create the controls */
    if (ENABLE_CONTROLS) {
        controls = new THREE.TrackballControls(camera, renderer.domElement);
        controls.rotateSpeed = 1.0;
        controls.zoomSpeed = 1.2;
        controls.panSpeed = 0.8;
        controls.noZoom = false;
        controls.noPan = true;
        controls.staticMoving = true;
        controls.dynamicDampingFactor = 0.3;
        controls.target = scene.position;
    } else {
        controls = null;
    }

    /* Crate the axis */
    if (ENABLE_AXIS) {
        scene.add(  new THREE.AxisHelper( 50 ) );
    }

    /* Raycast plane */
    plane = new THREE.Plane(THREE.Utils.cameraLookDir(camera), 0);
} // function sceneSetup()


function initialDraw() {
    points = [];
    objectCreated = false;
    if (thing) {
        scene.remove(thing);
        thing = null;
    }

    if (line) {
        scene.remove(line);
        line = null;
    }
    makePoint(0, 0);
    points.push(new THREE.Vector3(0, 0, 0));
}

function makeLineFromPoints() {
    if (line != null) {
        scene.remove(line);
    }
    var numPoints = 100;
    var spline = new THREE.CatmullRomCurve3(points);
    var splinePoints = spline.getPoints(numPoints);
    var material = new THREE.LineBasicMaterial({color:0xffffff});
    var geometry = new THREE.Geometry();
    for (var i = 0; i < splinePoints.length; i++) {
        geometry.vertices.push(splinePoints[i]);
    } // for i

    line = new THREE.Line(geometry, material);
    scene.add(line);
}

function makeSolidFromPointsExtruded() {
    if (thing) {
        scene.remove(thing);
    }
    var numPoints = 100;
    var spline = new THREE.CatmullRomCurve3(points);
    var splinePoints = spline.getPoints(numPoints);

    var extrudeSettings = {
        steps: 100,
        bevelEnabled : false,
        extrudePath : spline
    };

    var shape = new THREE.Shape();
    shape.moveTo(10, 10);
    shape.absarc(10, 10, 10, 0, Math.PI*2, false);
    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    var material = new THREE.MeshLambertMaterial({color:0xb00000, wireframe:false});
    thing = new THREE.Mesh(geometry, material);
    scene.add(thing);
    objectCreated = true;
} // function makeSolidFromPointsExtruded()

function makeSolidFromPointsLathe() {
    if (thing) {
        scene.remove(thing);
    }
    var numPoints = 100;
    var spline = new THREE.CatmullRomCurve3(points);
    var splinePoints = spline.getPoints(numPoints);


    var geometry = new THREE.LatheGeometry(splinePoints, 20, 0, Math.PI*2);
    var material2 = new THREE.MeshPhongMaterial({color:0x1133AA});
    thing = new THREE.Mesh(geometry, material2);
    scene.add(thing);
    objectCreated = true;
}
function makePoint(x, y) {
    points.push(new THREE.Vector3(x, y, 0));
    if (points.length > 1) {
        makeLineFromPoints();
    }
} // function makePoint()


function animate() {
    if (controls) { controls.update(); }

    scene.simulate();
    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
} // function animate()

THREE.Utils = {
    cameraLookDir: function(camera) {
        var vector = new THREE.Vector3(0, 0, -1);
        vector.applyEuler(camera.rotation, camera.rotation.order);
        return vector;
    }
};

function initialDrawOld() {
    var numPoints = 100;

    var spline = new THREE.SplineCurve3([
        new THREE.Vector3(-10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(10, 0, 0)
    ]);

    var material = new THREE.LineBasicMaterial({ color: 0xffffff });

    var splinePoints = spline.getPoints(numPoints);

    var extrudeSettings = {
        steps: 100,
        bevelEnabled : false,
        extrudePath : spline
    };

    var shape = new THREE.Shape(splinePoints);
    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    material = new THREE.MeshLambertMaterial( { color: 0xb00000, wireframe: false } );
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    /*
     var geometry = new THREE.LatheGeometry(splinePoints, 20, 0, Math.PI*2);
     var material2 = new THREE.MeshPhongMaterial({color:0x1133AA});
     var thing = new THREE.Mesh(geometry, material2);
     scene.add(thing);
     */

    /*
     var geometry = new THREE.Geometry();

     for (var i = 0; i < splinePoints.length; i++) {
     geometry.vertices.push(splinePoints[i]);
     }

     var line = new THREE.Line(geometry, material);
     scene.add(line);*/
} // function initialDraw()
