const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

function createSolidMaterial(color) {
    return new THREE.MeshBasicMaterial({
        color: color,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1
    });
}

function createDottedWireframeMaterial() {
    return new THREE.ShaderMaterial({
        vertexShader: `
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            void main() {
                float scale = 10.0;
                float pattern = fract((gl_FragCoord.x + gl_FragCoord.y) * scale / 10.0);
                if (pattern > 0.5) discard;
                gl_FragColor = vec4(0, 0, 0, 1);
            }
        `,
        side: THREE.DoubleSide,
        wireframe: true,
        transparent: true
    });
}

const groups = [];
function addShape(geometry, solidColor, positionX, positionY) {
    const group = new THREE.Group();
    const solidMaterial = createSolidMaterial(solidColor);
    const solidMesh = new THREE.Mesh(geometry, solidMaterial);
    group.add(solidMesh);

    const wireframeMaterial = createDottedWireframeMaterial();
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    group.add(wireframeMesh);

    group.position.set(positionX, positionY, 0);
    scene.add(group);
    groups.push(group);
}

function hideAllShapes() {
    groups.forEach(group => {
        group.visible = false; // Hide the group
    });
}
function removeAllShapes() {
    groups.forEach(group => {
        scene.remove(group); // Remove the group from the scene
        group.children.forEach(child => {
            if (child.geometry) child.geometry.dispose(); // Optional: Dispose geometry
            if (child.material) child.material.dispose(); // Optional: Dispose material
        });
    });
    groups.length = 0; // Clear the array
}
function clearAllScreen() {
    hideAllShapes()
    removeAllShapes()
}
function addShape1(color, x, y) {
    addShape(new THREE.SphereGeometry(10, 32, 32), color, x, y);
}
function addShape2(color, x, y) {
    addShape(new THREE.CylinderGeometry(10, 10, 30, 32), color, x, y);
}
function addShape3(color, x, y) {
    addShape(new THREE.CylinderGeometry(0, 10, 30, 6), color, x, y);
}
function addShape4(color, x, y) {
    addShape(new THREE.BoxGeometry(30, 15, 10), color, x, y);
}
function addShape5(color, x, y) {
    addShape(new THREE.CylinderGeometry(10, 0, 25, 4), color, x, y);

}
function addShape6(color, x, y) {
    addShape(new THREE.CylinderGeometry(10, 10, 40, 3), color, x, y);

}
var array_of_functions = [
    addShape1,
    addShape2,
    addShape3,
    addShape4,
    addShape5,
    addShape6
]

var COLOR = [0x0000ff, 0x800080, 0x008000, 0xffa500, 0x87ceeb, 0xffffff]
var POSITION_X = [-50, 0, 50]

//Innitial
addShape(new THREE.SphereGeometry(10, 32, 32), 0x0000ff, -50, 30);
addShape(new THREE.CylinderGeometry(10, 10, 30, 32), 0x800080, 0, 30);
addShape(new THREE.CylinderGeometry(0, 10, 30, 6), 0x008000, 50, 30);
addShape(new THREE.BoxGeometry(30, 15, 10), 0xffa500, -50, -30);
addShape(new THREE.CylinderGeometry(10, 0, 25, 4), 0x87ceeb, 0, -30);
addShape(new THREE.CylinderGeometry(10, 10, 40, 3), 0xffffff, 50, -30);

const GroupLength = 6;
camera.position.z = 100;

var answerIndex = -1; // Initialize answerIndex to an invalid index to start
var previous_answerIndex = answerIndex;

document.getElementById('showRandomShapes').addEventListener('click', () => {
    const element = document.getElementById("GameText");
    if (element) {
        element.remove();
    }

    clearAllScreen()
    do {
        answerIndex = Math.floor(Math.random() * GroupLength);
    } while (previous_answerIndex == answerIndex);

    const indices = Array.from(Array(GroupLength).keys());
    indices.splice(answerIndex, 1);


    const randomIDX = indices.sort(() => 0.5 - Math.random());
    const RandomShapes = randomIDX.slice(0, 3);
    const RandomColor = randomIDX.slice(2, 5);

    for (var i = 0; i < RandomShapes.length; i++) {
        array_of_functions[RandomShapes[i]](COLOR[RandomColor[i]], POSITION_X[i], 0);
    }
    previous_answerIndex = answerIndex;
});

document.getElementById('revealAnswer').addEventListener('click', () => {
    //console.log('The answer is: ', answerIndex);


    array_of_functions[answerIndex](COLOR[answerIndex], 0, 50);
});

function animate() {
    requestAnimationFrame(animate);
    groups.forEach(group => {
        group.rotation.x += 0.01;
        group.rotation.y += 0.01;
    });
    renderer.render(scene, camera);
}

animate();
