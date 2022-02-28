import "./style.css";
import * as faceapi from "face-api.js";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const video = document.createElement("video");
video.height = 1;
video.width = 1;
video.autoplay = true;
let center = {};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/assets/ml-models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/assets/ml-models"),
])
  .then(startVideo)
  .catch(console.error);

async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  const canvas = document.querySelector("#canvas");
  const context = canvas.getContext("2d");
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions()
    );
    if (detections) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      center = {
        x: resizedDetections.box.x + resizedDetections.box.width / 2 - 0.5,
        y: -(resizedDetections.box.y + resizedDetections.box.height / 2) + 0.5,
      };
      // console.log(center);
    }
  });
}

const scene = new THREE.Scene();

const canvas = document.querySelector("#webgl");

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial()
);
cube.rotation.y = Math.PI / 4
scene.add(cube);

const directionalLight = new THREE.DirectionalLight("#ffffff", "0.6")
directionalLight.position.set(3, 4, 5)
scene.add(directionalLight)

const ambientLight = new THREE.AmbientLight("#ffffff", "0.5")
scene.add(ambientLight)

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const cameraParent = new THREE.Group()
scene.add(cameraParent)
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height);
camera.position.set(0, 1, 3)
cameraParent.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const tick = () =>
{
  if (center.x && center.y) {
    cameraParent.position.set(
      camera.position.x + center.x * 4,
      camera.position.y + center.y * 4
    )
  }

  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
