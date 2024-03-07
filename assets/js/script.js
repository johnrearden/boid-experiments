const COMFORTABLE_DIST_TO_ORIGIN_SQ = Math.pow(60, 2);
const HEADING_DIFF_MIN = Math.PI / 8;
const TURN_RATE = 0.1;
const NEIGHBOUR_DIST = 30;
const COLLISION_DIST = 5;
const PIby2 = Math.PI * 2;
const PI = Math.PI;

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

class Boid {
    constructor(id, domElement) {
        this.id = id;
        this.xPos = -700 + Math.random() * 1400;
        this.yPos = -50 + 50 * Math.random();
        this.zPos = -400 + Math.random() * 800;
        this.neighbours = [];

        this.vel = 6;
        this.heading = Math.random() * PIby2;

        this.domElement = domElement;
    }

    update = (xAv, yAv, zAv, headingAv) => {
        this.xPos += this.vel * Math.cos(this.heading);
        this.zPos += this.vel * Math.sin(this.heading);

        let adjustment = `perspective(1500px) translate3d(${this.xPos}px,${this.yPos}px,${this.zPos}px) rotateY(${-this.heading}rad)`;

        this.domElement.style.transform = adjustment;

        this.turnTowardOrigin(xAv, yAv, zAv, headingAv);
    }

    setNeighbours

    turnTowardOrigin = (xAv, yAv, zAv, headingAv) => {
        const distSqToCenter = Math.pow(this.xPos - xAv, 2) + Math.pow(this.zPos - zAv, 2)
        let diff;
        if (distSqToCenter > COMFORTABLE_DIST_TO_ORIGIN_SQ) {
            console.log('turn to center')
            const dirToCenter = Math.atan2(-this.zPos, -this.xPos);
            diff = resolveAngle(dirToCenter - this.heading);
            if (Math.abs(diff) > TURN_RATE) {
                this.heading += Math.sign(diff) * TURN_RATE;
            }
        } else {
            diff = resolveAngle(headingAv - this.heading);
            this.heading += TURN_RATE * Math.sign(diff);
            console.log('turn to average heading')
        }
        
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
        for (let i = 0; i < this.pop; i++) {
            const div = document.createElement('div');
            div.textContent = "W";
            div.id = `boid_${i}`;
            div.classList.add('boid');
            const newBoid = new Boid(i, div);
            this.boids.push(newBoid);
            this.xList.push(newBoid);
            this.yList.push(newBoid);
            this.zList.push(newBoid);
            worldDiv.appendChild(div);
        }
        this.sortLists();
    }

    update = () => {
        const { xAv, yAv, zAv, headingAv } = this.getAverages();
        this.sortLists();
        for (let boid of this.boids) {
            boid.update(xAv, yAv, zAv, headingAv);
        }
        
        requestAnimationFrame(this.update);
    }

    getNeighours = (boid) => {
        let xCandidates = [];
        let pointer = this.xList.indexOf(boid);
        
        // Look down the xList
        while (true) {
            pointer--;
            if (pointer < 0) {
                break;
            }
            const candidate = this.xList[pointer];
            if (Math.abs(boid.xPos - candidate.xPos) < NEIGHBOUR_DIST) {
                xCandidates.push();
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
            if (Math.abs(boid.xPos - candidate.xPos) < NEIGHBOUR_DIST) {
                xCandidates.push();
            } else {
                break;
            }
        }

        // Sort xNeighbours by zPos
        xCandidates = xCandidates.sort((bd1, bd2) => bd1.zPos - bd2.zPos);
        pointer = xCandidates.indexOf(boid);
        const zCandidates = [];
        while(true) {
            pointer--;
            if (pointer < p) {
                break;
            }
            const candidate = xCandidates[pointer];
            if (Math.abs(boid.zPos - candidate.zPos) < NEIGHBOUR_DIST) {
                zCandidates.push();
            } else {
                break;
            }
        }
        pointer = xCandidates.indexOf(boid);
        while(true) {
            pointer++;
            if (pointer >= xCandidates.length) {
                break;
            }
            const candidate = xCandidates[pointer];
            if (Math.abs(boid.zPos - candidate.zPos) < NEIGHBOUR_DIST) {
                zCandidates.push();
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
        let headingTot = 0;
        for (let i = 0; i < this.xList.length; i++) {
            xTot += this.xList[i].xPos;
            yTot += this.yList[i].yPos;
            zTot += this.zList[i].zPos;
            headingTot += this.xList[i].heading;
        }
        const xAv = xTot / this.xList.length;
        const yAv = yTot / this.xList.length;
        const zAv = zTot / this.zList.length;
        const headingAv = headingTot / this.xList.length;
        return {xAv, yAv, zAv, headingAv};
    }
}

const flock = new Flock(6);
requestAnimationFrame(flock.update);