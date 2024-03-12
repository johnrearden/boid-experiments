const FLOCK_SIZE = 150;
const PERSPECTIVE = 700;
const PIby2 = Math.PI * 2;
const PI = Math.PI;

let SLO_MO = 1;
let FRAME_COUNT = 0;

let TURN_FACTOR = 0.3;
let VISUAL_RANGE = 80;
let PROTECTED_RANGE = 9;
let CENTER_FACTOR = 0.001;
let AVOID_FACTOR = 0.6;
let MATCHING_FACTOR = 0.1;
let MAX_SPEED = 8;
let MIN_SPEED = 4;

let sloMo = SLO_MO;
let frameCount = 0;
let currentBoid = 0;
let currentNeighbours = [];

let turnFactor;
let visualRange;
let protectedRange;
let centeringFactor;
let avoidFactor;
let matchingFactor;
let maxSpeed;
let minSpeed;

const topDownViewRatio = 0.2;

const xPosMin = -400;
const xPosMax = 300;
const zPosMin = -400;
const zPosMax = 400;


class Boid {
    constructor(id, domElement, topDownElement) {
        this.id = id;
        this.xPos = -50 + Math.random() * 100;
        this.yPos = -100 - 50 * Math.random();
        this.zPos = 1000 + Math.random() * 100;

        this.yVel = 0;

        this.vel = minSpeed;
        let heading = - PI + PIby2 * Math.random();
        this.xVel = this.vel * Math.cos(heading);
        this.zVel = this.vel * Math.sin(heading);

        this.domElement = domElement;
        this.topDownElement = topDownElement;
    }

    update = (neighbours) => {

        // Separation
        let closeDx = 0;
        let closeDz = 0;
        for (let boid of neighbours) {
            const dx = this.xPos - boid.xPos;
            const dz = this.zPos - boid.zPos;
            if (Math.pow(dx, 2) + Math.pow(dz, 2) < Math.pow(protectedRange, 2)) {
                closeDx += dx;
                closeDz += dz;
            }
        }
        this.xVel += closeDx * avoidFactor;
        this.zVel += closeDz * avoidFactor;


        // Alignment
        let avXVel = 0;
        let avZVel = 0;
        for (let boid of neighbours) {
            avXVel += boid.xVel;
            avZVel += boid.zVel;
        }
        if (neighbours.length > 0) {
            avXVel /= neighbours.length;
            avZVel /= neighbours.length;
            this.xVel += (avXVel - this.xVel) * matchingFactor;
            this.zVel += (avZVel - this.zVel) * matchingFactor;
        }


        // Cohesion
        let avXPos = 0;
        let avZPos = 0;
        for (let boid of neighbours) {
            avXPos += boid.xPos;
            avZPos += boid.zPos;
        }
        if (neighbours.length > 0) {
            avXPos /= neighbours.length;
            avZPos /= neighbours.length;
            this.xVel += (avXPos - this.xPos) * centeringFactor;
            this.zVel += (avZPos - this.zPos) * centeringFactor;
        }

        // Check speed within range
        let speed = Math.sqrt(Math.pow(this.xVel, 2) + Math.pow(this.zVel, 2));
        if (speed > maxSpeed) {
            this.xVel = this.xVel / speed * maxSpeed;
            this.zVel = this.zVel / speed * maxSpeed;
        }
        if (speed < minSpeed) {
            this.xVel = this.xVel / speed * minSpeed;
            this.zVel = this.zVel / speed * minSpeed;
        }

        // Check boid inside allowable box
        if (this.xPos < xPosMin) {
            this.xVel += turnFactor;
        }
        if (this.xPos > xPosMax) {
            this.xVel -= turnFactor;
        }
        if (this.zPos < zPosMin) {
            this.zVel += turnFactor;
        }
        if (this.zPos > zPosMax) {
            this.zVel -= turnFactor;
        }

        // Update positions
        this.xPos += this.xVel;
        this.yPos += this.yVel;
        this.zPos += this.zVel;

        // Move boid to correct position on main and top-down displays
        let heading = Math.atan2(this.zVel, this.xVel);
        let adjustment = `perspective(${PERSPECTIVE}px) translate3d(${this.xPos}px,${this.yPos}px,${this.zPos}px) rotateY(${-heading}rad)`;
        this.domElement.style.transform = adjustment;
        let topDownAdjustment = `translate(${this.xPos * topDownViewRatio}px,${this.zPos * topDownViewRatio}px)`;
        this.topDownElement.style.transform = topDownAdjustment;
    }
}

class Flock {
    constructor(population) {
        this.pop = population;
        this.boids = [];
        this.xList = [];
        this.yList = [];
        this.zList = [];

        const worldDiv = document.getElementById('world');
        const topDownDiv = document.getElementById('top-down-view')
        for (let i = 0; i < this.pop; i++) {
            const div = document.createElement('div');
            const code = 65 + Math.floor(Math.random() * 26);
            div.textContent = String.fromCharCode(code);
            div.id = `boid_${i}`;
            div.classList.add('boid');
            worldDiv.appendChild(div);

            // Create top-down-view boid div
            const topDownBoidDiv = document.createElement('div');
            topDownBoidDiv.id = `top-down-boid_${i}`;
            topDownBoidDiv.classList.add('top-down-boid');
            topDownDiv.append(topDownBoidDiv);

            // Create the boid 
            const newBoid = new Boid(i, div, topDownBoidDiv);
            this.boids.push(newBoid);
            this.xList.push(newBoid);
            this.yList.push(newBoid);
            this.zList.push(newBoid);
        }
        this.sortLists();

        this.avgPosDiv = document.createElement('div');
        this.avgPosDiv.classList.add('avg-pos');
        worldDiv.appendChild(this.avgPosDiv);

        this.topDownAvgPosDiv = document.createElement('div');
        this.topDownAvgPosDiv.classList.add('top-down-avg-pos');
        topDownDiv.appendChild(this.topDownAvgPosDiv);



    }

    update = () => {
        const now = performance.now();
        if (++frameCount % sloMo === 0) {
            const { xAv, yAv, zAv } = this.getAverages();

            // Draw average position on main boid display.
            let adjustment = `perspective(${PERSPECTIVE}px) translate3d(${xAv}px,${yAv}px,${zAv}px)`;
            this.avgPosDiv.style.transform = adjustment;

            // Draw average position on top down display.
            adjustment = `translate(${xAv * topDownViewRatio}px, ${zAv * topDownViewRatio}px)`;
            this.topDownAvgPosDiv.style.transform = adjustment;

            this.sortLists();

            for (let i = 0; i < this.boids.length; i++) {
                let neighbours = this.getNeighours(this.boids[i]);
                if (i === currentBoid) {
                    currentNeighbours = neighbours;
                }
                this.boids[i].update(neighbours);
            }
        }

        //console.log(performance.now() - now)
        requestAnimationFrame(this.update);
    }

    getNeighours = (boid) => {
        let xCandidates = [];
        xCandidates.push(boid); // this boid will be the starting point for the linear search
        let pointer = this.xList.indexOf(boid);

        // Look down the xList
        while (true) {
            pointer--;
            if (pointer < 0) {
                break;
            }
            const candidate = this.xList[pointer];
            if (Math.abs(boid.xPos - candidate.xPos) < visualRange) {
                xCandidates.push(candidate);
            } else {
                break;
            }
        }

        // Look up the xList
        pointer = this.xList.indexOf(boid);
        while (true) {
            pointer++;
            if (pointer >= this.xList.length) {
                break;
            }
            const candidate = this.xList[pointer];
            if (Math.abs(boid.xPos - candidate.xPos) < visualRange) {
                xCandidates.push(candidate);
            } else {
                break;
            }
        }

        // Sort xNeighbours by zPos
        xCandidates = xCandidates.sort((bd1, bd2) => bd1.zPos - bd2.zPos);
        pointer = xCandidates.indexOf(boid);
        const zCandidates = [];
        while (true) {
            pointer--;
            if (pointer < 0) {
                break;
            }
            const candidate = xCandidates[pointer];
            if (Math.abs(boid.zPos - candidate.zPos) < visualRange) {
                zCandidates.push(candidate);
            } else {
                break;
            }
        }
        pointer = xCandidates.indexOf(boid);
        while (true) {
            pointer++;
            if (pointer >= xCandidates.length) {
                break;
            }
            const candidate = xCandidates[pointer];
            if (Math.abs(boid.zPos - candidate.zPos) < visualRange) {
                zCandidates.push(candidate);
            } else {
                break;
            }
        }

        // Now zCandidates represents all neighbours within a cube of side
        // NEIGHBOUR_DIST * 2, with this boid at the center.
        return zCandidates;


    }

    sortLists = () => {
        this.xList = this.xList.sort((bd1, bd2) => bd1.xPos - bd2.xPos);
        this.yList = this.yList.sort((bd1, bd2) => bd1.yPos - bd2.yPos);
        this.zList = this.zList.sort((bd1, bd2) => bd1.zPos - bd2.zPos);
    }

    getAverages = () => {
        let xTot = 0;
        let yTot = 0;
        let zTot = 0;
        for (let i = 0; i < this.xList.length; i++) {
            xTot += this.xList[i].xPos;
            yTot += this.yList[i].yPos;
            zTot += this.zList[i].zPos;
        }
        const xAv = xTot / this.xList.length;
        const yAv = yTot / this.xList.length;
        const zAv = zTot / this.xList.length;
        return { xAv, yAv, zAv };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    resetToDefaults();
    const flock = new Flock(FLOCK_SIZE);
    requestAnimationFrame(flock.update);
})


resolveAngle = (angle) => {
    if (angle > PI) {
        angle -= PIby2 * Math.floor(angle / PIby2);
        if (angle > PI) {
            angle -= PIby2;
        }
    }
    if (angle <= -PI) {
        angle += PIby2 * Math.floor(-angle / PIby2);
        if (angle < -PI) {
            angle += PIby2;
        }
    }

    return angle;
}

const toggleSettings = () => {
    console.log('toggle')
    document.getElementById('controls').classList.toggle('hide');
}

const handleSloMoChange = (value) => {
    sloMo = parseInt(value);
}

const resetToDefaults = () => {
    
    frameCount = FRAME_COUNT;
    currentBoid = 0;
    currentNeighbours = [];

    turnFactor = TURN_FACTOR;
    document.getElementById('turn-factor').value = TURN_FACTOR;

    visualRange = VISUAL_RANGE;
    document.getElementById('visual-range').value = VISUAL_RANGE;
    
    protectedRange = PROTECTED_RANGE;
    document.getElementById('protected-range').value = PROTECTED_RANGE;

    centeringFactor = CENTER_FACTOR;
    document.getElementById('center-factor').value = CENTER_FACTOR;

    avoidFactor = AVOID_FACTOR;
    document.getElementById('avoid-factor').value = AVOID_FACTOR;

    matchingFactor = MATCHING_FACTOR;
    document.getElementById('matching-factor').value = MATCHING_FACTOR;

    maxSpeed = MAX_SPEED;
    document.getElementById('max-speed').value = MAX_SPEED;

    minSpeed = MIN_SPEED;
    document.getElementById('min-speed').value = MIN_SPEED;
}