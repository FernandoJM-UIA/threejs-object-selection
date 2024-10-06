import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';


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
         // Ignore the line object in the selection process
        if (selectedObject.name === 'drawingLine') {
          console.log('Line was selected, ignoring it.');
          return; // Skip if the line itself is clicked
        }
        const index = selectedObjects.indexOf(selectedObject);
          if (index === -1) {
            selectedObjects.push(selectedObject);
            const color = new THREE.Color(Math.random(), Math.random(), Math.random());
            selectedObject.material.color = color;
            console.log(`${selectedObject.name} was selected!`);
          } 
          const point = intersections[0].point; // Get clicked point
          console.log(`Clicked point coordinates: x=${point.x}, y=${point.y}, z=${point.z}`);
          linePoints.push(point);
          drawLine(0xcdf0f1, 5);
          printSelectedObjects();
      }
  } else {
      console.log("Camera controls are enabled. Object selection is disabled.");
  }
}

function drawLine(lineColor = 0xcdf0f1, lineThickness = 5) {
  const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
  
  // Create material with variable color and thickness
  const material = new THREE.LineBasicMaterial({ 
      color: lineColor, 
      linewidth: lineThickness 
  });

  line = new THREE.Line(geometry, material);

  // Set raycast to null so the line itself cannot be selected
  line.raycast = () => {};

  // Remove the previous line if it exists
  if (scene.getObjectByName('drawingLine')) {
      scene.remove(scene.getObjectByName('drawingLine'));
  }

  line.name = 'drawingLine'; // Set a name for easy identification and removal later
  scene.add(line); // Add the line to the scene
}

function printSelectedObjects(){
  const selectedNames = selectedObjects.map(obj => obj.name);
  //console.log('Selected Objects', selectedNames);
}

function deleteDrawnLine() {
  const drawnLine = scene.getObjectByName('drawingLine'); // Find the line by name
  if (drawnLine) {
      scene.remove(drawnLine); // Remove the line from the scene
      console.log('Drawn line was deleted!');
      linePoints.length = 0; // Clear the linePoints array
  } else {
      console.log('No line to delete.');
  }
}
document.getElementById('deleteDrawn').addEventListener('click', deleteDrawnLine);

// Function to undo the last point
function undoLastPoint() {
  if (linePoints.length > 0) {
      linePoints.pop(); // Remove the last point from the array
      console.log('Last point undone.');
      drawLine(); // Redraw the line with the updated points
  } else {
      console.log('No points to undo.');
  }
}
// Add an event listener to the Undo button
document.getElementById('undoBtn').addEventListener('click', undoLastPoint);
