/*
Copyright 2020 Srđan Panić

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or
 sell copies of the Software, and to permit persons to whom
the Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/


// notes:
// https://en.wikipedia.org/wiki/Two-body_problem
// https://en.wikipedia.org/wiki/Energy_drift


var canvas;
var context;
var init = false;


function initGravity(canvasName) {
    canvas        = document.getElementById(canvasName);
    context       = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    init = true;
}


// --------------------------------------------------
// Theme and color stuff
// --------------------------------------------------

var asteroidColor = '#F0F0F0';
var planetBody    = "#e8618c";
var planetRing    = "#ffe584";


var planetBodyHighlight = "#ffe584";
var planetRingHighlight = "#f0b0bc";
var asteroidRadius      = 1;
var impactColor         = "#ffffff";


asteroidColor       = '#ffffff';
planetBody          = "#3ff9ff";
planetRing          = "#fca9b8";
planetBodyHighlight = "#fff9ff";
planetRingHighlight = "#ffe584";
impactColor         = "#ffffff";
asteroidRadius      = 1;


// --------------------------------------------------
// Drawing
// --------------------------------------------------

function drawAsteroids(asteroids) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = asteroidColor;

    for (let i = 0; i < asteroids.length; i++) {
        context.beginPath();
        context.arc(asteroids[i].posX,
                    asteroids[i].posY,
                    asteroidRadius,
                    0,
                    2 * Math.PI,
                    false);
        context.fill();
    }
}


function drawPlanet(planet, mouseOver) {
    if (mouseOver) {
        context.strokeStyle = planetRingHighlight;
        context.fillStyle   = planetBodyHighlight;
    } else {
        context.strokeStyle = planetRing;
        context.fillStyle   = planetBody;
    }

    // Draw the backside of the ring
    context.lineWidth = 6;
    context.beginPath();
    context.ellipse(planet.posX,
                    planet.posY,
                    12,
                    35,
                    Math.PI / 4,
                    Math.PI / 2,
                    Math.PI + Math.PI /2);
    context.stroke();

    // Draw the planet body
    context.beginPath();
    context.arc(planet.posX,
                planet.posY,
                19,
                0,
                2 * Math.PI);
    context.fill();

    // Draw asteroid impacts
    for (let i = 0; i < planet.impactAnims.length; i++) {
        let anim = planet.impactAnims[i];
        context.fillStyle = impactColor;
        context.beginPath();
        context.arc(planet.posX - anim.relX,
                    planet.posY - anim.relY,
                    3,
                    0,
                    2 * Math.PI);
        context.fill();
    }

    // Draw the front of the ring
    context.lineWidth = 6;
    context.beginPath();
    context.ellipse(planet.posX,
                    planet.posY,
                    12, 35, Math.PI / 4,
                    Math.PI + Math.PI / 2,
                    Math.PI / 2);
    context.stroke();
}


// --------------------------------------------------
// Math util
// --------------------------------------------------

function pointDistance(p1x, p1y, p2x, p2y) {
    var x = p1x - p2x;
    var y = p1y - p2y;
    return Math.sqrt((x * x) + (y * y));
}


function vectorNormalize(x, y) {
    if (x == 0 || y == 0)
        return {x: x, y: y};

    var l  = Math.sqrt((x * x) + (y * y));
    var nX = (1 / l) * x;
    var nY = (1 / l) * y;
    return {x: nX, y: nY};
}


function vectorRotate(x, y, angle) {
    // Rotates a normalized vector
    let aR = Math.rad(angle);
    let nX = x * Math.cos(aR) - y * Math.sin(aR);
    let nY = x * Math.sin(aR) - y * Math.cos(aR);
    return {x: nX, y: nY};
}


function vectorScale(x, y, scale) {
    return {x: x * scale,
            y: y * scale};
}


function vectorDotProduct(x1, y1, x2, y2) {
    return x1 * x2 + y1 * y2;
}


function sufraceNormal(surface) {
    // find circle intersection?
    // TODO
}


function vectorReflectSpecular(iX, iY, nX, nY) {
    // normalized normal
    let S = vectorDotProduct(-1 * iX, -1 * iY, nX, nY);
    let N = vectorScale(nX, nY, S);
    let V = {x: iX + N.x, y: iY + N.y};
    let R = {x: N.x + V.x, y: N.y + V.y};
    return R;
}


function rng(min, max) {
    return Math.random() * (max - min) + min;
}


// --------------------------------------------------
//  Simulation
// --------------------------------------------------

var planetSelectHover = false;
var planetSelectDrag  = false;

const planetSpawnTime = 5000;

var planetSpawn = 0;
var planetSpawned = false;
var planet = {};


const asteroidSpawnTime          = 500;
var   asteroidTimeSinceLastSpawn = 0;


function spawnAsteroid(deltaT) {
    asteroidTimeSinceLastSpawn += deltaT;
    if (asteroidTimeSinceLastSpawn >= asteroidSpawnTime) {
        var x = rng(1, window.innerWidth  - 1);
        var y = rng(1, window.innerHeight - 1);
        let r = {posX: x,
                 posY: y,
                 Vx: rng(-0.05, 0.05),
                 Vy: rng(-0.05, 0.05)};
        asteroids.push(r);
        asteroidTimeSinceLastSpawn = 0;
    }
}


const asteroidMass  = 5;
const planetMass    = 10;
const G             = 1; // Arbitrary constant


function updateAsteroids(asteroids, deltaT) {
    for (var i = 0; i < asteroids.length; i++) {
        var x = asteroids[i].posX;
        var y = asteroids[i].posY;

        // Clear asteroids that went off screen
        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) {
            asteroids.splice(i, 1);
            continue;
        }

        if (planetSpawned) {
            if (circlesCollide(planet.posX, planet.posY, 19, x, y, 1)) {
                asteroids.splice(i, 1);
                planet.impactAnims.push({relX: planet.posX - x,
                                         relY: planet.posY - y,
                                         ttl:  1000});
                continue;
            }
            // Apply gravity

            // Euler integration, sort of. The error becomes large when the
            // particles are close together and the force between them is large.
            // Can be more accurate by making the time step smaller.
            var r = pointDistance(x, y, planet.posX, planet.posY);

            // Since we're dealing with points and not actual objects,
            // the radius needs to be at least one. Otherwise there
            // would be a possible division by zero on the next line.
            r = r == 0 ? 1 : r;

            var F = G * ((planetMass * asteroidMass) / (r * r));

            var x = x - planet.posX;
            var y = y - planet.posY;

            var dir = vectorNormalize(-1 * x, -1 * y);

            asteroids[i].Vx += (F * dir.x) / asteroidMass;
            asteroids[i].Vy += (F * dir.y) / asteroidMass;
        }
        // Update position
        asteroids[i].posX += (asteroids[i].Vx * deltaT);
        asteroids[i].posY += (asteroids[i].Vy * deltaT);
    }
}


function spawnPlanet(deltaT) {
    if (!planetSpawned) {
        planetSpawn += deltaT;
        if (planetSpawn >= planetSpawnTime) {
            let x = rng(20, window.innerWidth  - 20);
            let y = rng(20, window.innerHeight - 20);
            var p = {posX: x,
                     posY: y,
                     Vx: rng(-0.01, 0.01),
                     Vy: rng(-0.01, 0.01),
                     impactAnims: []};
            planet = p;
            planetSpawned = true;
        }
    }
}


function updatePlanet(deltaT) {
    // Advance impact animations
    for (let i = 0; i < planet.impactAnims.length; i++) {
        planet.impactAnims[i].ttl -= deltaT;
        if (planet.impactAnims[i].ttl <= 0) {
            planet.impactAnims.splice(i, 1);
            continue;
        }
    }
    // Update position
    if (planetSelectDrag) {
        planet.posX = pointer.x;
        planet.posY = pointer.y;
    } else {
        planet.posX += planet.Vx * deltaT;
        planet.posY += planet.Vy * deltaT;
    }

    // Reflect back if going off screen
    if (planet.posX < 0 ||
        planet.posX > canvas.width ||
        planet.posY < 0 ||
        planet.posY > canvas.height)
    {
        // Normals for each surface
        let normalV = {x:  0, y:  0};
        if (planet.posX < 0) {
            normalV = {x:  1, y:  0};
            // make sure it's inside the window to avoid
            // ping-ponging on the other side
            planet.posX = 1;
        }
        if (planet.posX > canvas.width) {
            normalV = {x: -1, y:  0};
            planet.posX = canvas.width - 1;
        }
        if (planet.posY < 0) {
            normalV = {x:  0, y:  1};
            planet.posY = 1;
        }
        if (planet.posY > canvas.height) {
            normalV = {x:  0, y: -1}
            planet.posY = canvas.height - 1;
        }

        let rV = vectorReflectSpecular(
            planet.Vx, planet.Vy, normalV.x, normalV.y);

        planet.Vx = rV.x;
        planet.Vy = rV.y;
    }
}


function circlesCollide(c1X, c1Y, r1, c2X, c2Y, r2) {
    let distance = pointDistance(c1X, c1Y, c2X, c2Y);
    if (distance <= (r1 + r2))
        return true;
    return false;
}


function planetSelectable(pointer, planet) {
    let plR = 35;
    let distance = pointDistance(pointer.x, pointer.y, planet.posX, planet.posY);

    if (distance <= 35) {
        return true;
    }
    return false;
}

// ----------------------------------------
// Input
// ----------------------------------------

window.onmousemove = function(event) {
    pointer.x = event.pageX;
    pointer.y = event.pageY;
}


window.addEventListener('mousedown', function(event) {
    if (planetSelectHover) {
        planetSelectDrag = true;
        event.preventDefault();
    }
});


window.addEventListener('touchmove', function(event) {
    pointer.x = event.changedTouches[0].clientX;
    pointer.y = event.changedTouches[0].clientY;
    if (planetSelectHover) {
        planetSelectDrag = true;
        event.preventDefault();
    }
});


window.addEventListener('mouseup', function(event) {
    if (planetSelectDrag)
        planetSelectDrag = false;
});


window.addEventListener('resize', function(event) {
    asteroids     = [];
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
})


// ----------------------------------------
// Game loop
// ----------------------------------------

var startT    = null;
var asteroids = [];
var pointer   = {x: 0, y: 0};


function animLoop() {
    if (!init) {
        window.requestAnimationFrame(animLoop);
        return;
    }

    if (startT == null)
        startT = window.performance.now();

    var nowT   = window.performance.now();
    var deltaT = (nowT - startT);
    startT = nowT;

    if (deltaT == 0)
        deltaT = 1; // Timer resolution sucks

    spawnAsteroid(deltaT);
    spawnPlanet(deltaT);
    updateAsteroids(asteroids, deltaT);
    planetSelectHover = planetSelectable(pointer, planet);
    drawAsteroids(asteroids);

    if (planetSpawned) {
        updatePlanet(deltaT);
        drawPlanet(planet, planetSelectHover);
    }

    window.requestAnimationFrame(animLoop);
}

window.requestAnimationFrame(animLoop);
