import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Setup the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0x222230);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Create a new scene
const scene = new THREE.Scene();

// Setup scene lighting
const light = new THREE.DirectionalLight();
light.intensity = 2;
light.position.set(2, 5, 10);
light.castShadow = true;
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.1));

// Setup camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(-5, 5, 12);
camera.layers.enable(1);
controls.target.set(-1, 2, 0);
controls.update();

// Render loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// ========= END SCENE SETUP =========

const floorGeometry = new THREE.PlaneGeometry(25, 20);
const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
const material = new THREE.MeshLambertMaterial();

const floorMesh = new THREE.Mesh(
  floorGeometry, 
  new THREE.MeshLambertMaterial({ color: 0xffffff })
);
floorMesh.rotation.x = - Math.PI / 2.0;
floorMesh.name = 'Floor';
floorMesh.receiveShadow = true;
scene.add(floorMesh);

function createMesh(geometry, material, x, y, z, name, layer) {
  const mesh = new THREE.Mesh(geometry, material.clone());
  mesh.position.set(x, y, z);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.layers.set(layer);
  return mesh;
}

const cylinders = new THREE.Group();
cylinders.add(createMesh(cylinderGeometry, material, 3, 1, 0, 'Cylinder A', 0));
cylinders.add(createMesh(cylinderGeometry, material, 4.2, 1, 0, 'Cylinder B', 0))
cylinders.add(createMesh(cylinderGeometry, material, 3.6, 3, 0, 'Cylinder C', 0));
scene.add(cylinders);

const boxes = new THREE.Group();
boxes.add(createMesh(boxGeometry, material, -1, 1, 0, 'Box A', 0));
boxes.add(createMesh(boxGeometry, material, -4, 1, 0, 'Box B', 0))
boxes.add(createMesh(boxGeometry, material, -2.5, 3, 0, 'Box C', 0));
scene.add(boxes);

animate();

// ========= END SCENE SETUP =========
const pencilIcon = document.getElementById('pencil-icon');
let cameraControlsActive = true; // Camera status
const selectedObjects = [];
const raycaster = new THREE.Raycaster();

// Arrays to hold points for the line
const linePoints = [];
let line;

document.addEventListener('mousedown', onMouseDown);
pencilIcon.addEventListener('click', toggleCameraControl);

// Add the toggleCameraControl function
function toggleCameraControl() {
  cameraControlsActive = !cameraControlsActive; // Toggle state

  // Enable or disable camera controls
  if (cameraControlsActive) {
      controls.enableRotate = true; // Allow camera rotation
      controls.enableZoom = true; // Allow camera zoom
      controls.enablePan = true; // Allow camera panning
      console.log("Camera controls enabled.");

      // Clear the line when camera controls are enabled
      if(line){
        scene.remove(line);
        line = null;
        linePoints.length = 0;
        console.log("Line cleared");
      }
  } else {
      controls.enableRotate = false; // Disable camera rotation
      controls.enableZoom = false; // Disable camera zoom
      controls.enablePan = false; // Disable camera panning
      console.log("Camera controls disabled.");
  }
}

function onMouseDown(event) {
  // Only allow object selection if camera controls are disabled
  if (!cameraControlsActive) {
      const coords = new THREE.Vector2(
          (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
          -((event.clientY / renderer.domElement.clientHeight) * 2 - 1),
      );

      raycaster.setFromCamera(coords, camera);
      const intersections = raycaster.intersectObjects(scene.children, true);

      if (intersections.length > 0) {
          const selectedObject = intersections[0].object;
          const index = selectedObjects.indexOf(selectedObject);

          if (index === -1) {
              selectedObjects.push(selectedObject);
              const color = new THREE.Color(Math.random(), Math.random(), Math.random());
              selectedObject.material.color = color;
              console.log(`${selectedObject.name} was selected!`);
              const point = intersections[0].point; // Get clicked point
              linePoints.push(point);
          } else {
              selectedObjects.splice(index, 1);
              selectedObject.material.color.set(0xffffff); // Resetting to default color
              console.log(`${selectedObject.name} was deselected!`);
          }
          // Draw the line when object selection is enabled
          drawLine();
          printSelectedObjects();
      }
  } else {
      console.log("Camera controls are enabled. Object selection is disabled.");
  }
}

function drawLine(){
  const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  const material = new THREE.LineBasicMaterial({color: 0xff0000});
  line = new THREE.Line(geometry, material);

  // Femove the previous line if it exists
  if(scene.getObjectByName('drawingLine')){
    scene.remove(scene.getObjectByName('drawingLine'));
  }
  line.name = 'drawingLine'; // Set a name for easy removal later
  scene.add(line); // Add the line to the scene
}

function printSelectedObjects(){
  const selectedNames = selectedObjects.map(obj => obj.name);
  console.log('Selected Objects', selectedNames);
}