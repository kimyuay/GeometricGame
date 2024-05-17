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

const groups = [];


function addShape(geometry, solidColor, positionX, positionY, type) {
    const group = new THREE.Group();
    const solidMaterial = createSolidMaterial(solidColor);
    const solidMesh = new THREE.Mesh(geometry, solidMaterial);
    group.add(solidMesh);

    let edges;

    if (type === "cylinder") {
        // Get horizontal edges
        const horizontalEdges = getHorizontalEdges(new THREE.EdgesGeometry(geometry), geometry);
        // Get vertical edges
        const verticalEdges = getVerticalSideEdgesCylinder(new THREE.EdgesGeometry(geometry));
        // Combine both edge geometries
        edges = combineEdgeGeometries(horizontalEdges, verticalEdges);
    } else if (type === "sphere") {
        edges = new THREE.EdgesGeometry(geometry);
        edges = filterSphereEdges(edges);
    }
    else {
        edges = new THREE.EdgesGeometry(geometry); // Default case for other geometries
    }

    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linecap: 'round', linewidth: 0 });
    const edgeMesh = new THREE.LineSegments(edges, edgeMaterial);
    group.add(edgeMesh);

    group.position.set(positionX, positionY, 0);
    scene.add(group);
    groups.push(group);
}
function filterSphereEdges(edgesGeometry) {
    const vertices = edgesGeometry.attributes.position.array;
    const resultVertices = [];
    // Adjust these values to control the density of vertical and horizontal lines
    const verticalAngleStep = Math.PI / 4; // Keep vertical edges every 45 degrees
    const horizontalAngleStep = Math.PI / 6; // Keep horizontal edges every 30 degrees

    for (let i = 0; i < vertices.length; i += 6) {
        let v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
        let v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);

        // Convert to spherical coordinates to filter by angle
        let sph1 = toSpherical(v1);
        let sph2 = toSpherical(v2);

        // Check if both vertices satisfy the vertical or horizontal line condition
        if ((Math.abs(sph1.phi % verticalAngleStep) < 0.1 && Math.abs(sph2.phi % verticalAngleStep) < 0.1) ||
            (Math.abs(sph1.theta % horizontalAngleStep) < 0.1 && Math.abs(sph2.theta % horizontalAngleStep) < 0.1)) {
            resultVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
        }
    }

    const resultGeometry = new THREE.BufferGeometry();
    resultGeometry.setAttribute('position', new THREE.Float32BufferAttribute(resultVertices, 3));
    return resultGeometry;
}

function toSpherical(cartesian) {
    let radius = cartesian.length();
    let theta = Math.acos(cartesian.y / radius); // polar angle, for horizontal lines
    let phi = Math.atan2(cartesian.z, cartesian.x); // azimuthal angle, for vertical lines
    return { radius: radius, theta: theta, phi: phi };
}

function getHorizontalEdges(edgesGeometry, originalGeometry) {
    originalGeometry.computeBoundingBox();
    const maxY = originalGeometry.boundingBox.max.y;
    const minY = originalGeometry.boundingBox.min.y;

    const vertices = edgesGeometry.attributes.position.array;
    const resultVertices = [];

    for (let i = 0; i < vertices.length; i += 6) {
        // Check if both vertices of the edge are exactly at the max or min Y
        if ((isNear(vertices[i + 1], maxY) && isNear(vertices[i + 4], maxY)) ||
            (isNear(vertices[i + 1], minY) && isNear(vertices[i + 4], minY))) {
            resultVertices.push(
                vertices[i], vertices[i + 1], vertices[i + 2],
                vertices[i + 3], vertices[i + 4], vertices[i + 5]
            );
        }
    }

    const resultGeometry = new THREE.BufferGeometry();
    resultGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(resultVertices), 3));
    return resultGeometry;
}

function isNear(value, target, epsilon = 0.001) {
    return Math.abs(value - target) < epsilon;
}

function getVerticalSideEdgesCylinder(edgesGeometry) {
    const vertices = edgesGeometry.attributes.position.array;
    const resultVertices = [];

    // Define target angles for vertical lines at every 45 degrees, converted to radians
    const targetAngles = [
        0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4,
        Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4
    ]; // Adding more angles

    for (let i = 0; i < vertices.length; i += 6) {
        let v1 = new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
        let v2 = new THREE.Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);

        // Convert to cylindrical coordinates (ignoring y as it's the axis of the cylinder)
        let phi1 = Math.atan2(v1.z, v1.x);
        let phi2 = Math.atan2(v2.z, v2.x);

        // Check if the edge aligns with any of the target angles
        if (targetAngles.some(angle => isNearAngle(phi1, angle)) && targetAngles.some(angle => isNearAngle(phi2, angle))) {
            resultVertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
        }
    }

    const resultGeometry = new THREE.BufferGeometry();
    resultGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(resultVertices), 3));
    return resultGeometry;
}

function isNearAngle(value, target, epsilon = 0.05) { // Reduced epsilon for tighter angle control
    return Math.abs(value - target) < epsilon || Math.abs(value - target - 2 * Math.PI) < epsilon || Math.abs(value - target + 2 * Math.PI) < epsilon;
}



function isNearAngle(value, target, epsilon = 0.1) { // Epsilon can be adjusted for precision
    return Math.abs(value - target) < epsilon || Math.abs(value - target - 2 * Math.PI) < epsilon || Math.abs(value - target + 2 * Math.PI) < epsilon;
}


function closeTo(value, target, epsilon = 0.1) {
    return Math.abs(value - target) < epsilon;
}
function combineEdgeGeometries(geometry1, geometry2) {
    // Combine vertices from both geometries
    const vertices1 = geometry1.attributes.position.array;
    const vertices2 = geometry2.attributes.position.array;

    const combinedVertices = new Float32Array(vertices1.length + vertices2.length);
    combinedVertices.set(vertices1);
    combinedVertices.set(vertices2, vertices1.length);

    const combinedGeometry = new THREE.BufferGeometry();
    combinedGeometry.setAttribute('position', new THREE.BufferAttribute(combinedVertices, 3));
    return combinedGeometry;
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
    addShape(new THREE.SphereGeometry(10, 32, 32), color, x, y, "sphere");
}
function addShape2(color, x, y) {
    addShape(new THREE.CylinderGeometry(10, 10, 30, 32), color, x, y, "cylinder");
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

var COLOR = [0x0000ff, 0x9370DB, 0x008000, 0xffa500, 0x87ceeb, 0xfffff1]
var POSITION_X = [-50, 0, 50]

//Innitial


addShape(new THREE.SphereGeometry(10, 32, 32), 0x0000ff, -50, 30, "sphere");
addShape(new THREE.CylinderGeometry(10, 10, 30, 32), 0x9370DB, 0, 30, "cylinder");
addShape(new THREE.CylinderGeometry(0, 10, 30, 6), 0x008000, 50, 30);
addShape(new THREE.BoxGeometry(30, 15, 10), 0xffa500, -50, -30);
addShape(new THREE.CylinderGeometry(10, 0, 25, 4), 0x87ceeb, 0, -30);
addShape(new THREE.CylinderGeometry(10, 10, 40, 3), 0xfffff1, 50, -30);

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
