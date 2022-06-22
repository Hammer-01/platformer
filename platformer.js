// TODO: Wrap in iife to prevent exposing variables

// Declare variables outside of the setup function
let player;
let blocks = [];
let currentLevel = -1;
let backgroundFunc;
let changingLevels = false;
let fading = false;

const fadeIncrement = 15; // for fading in between levels

let keys = []; // array to hold actively pressed keys

// constants
const gravity = 0.4;
const friction = 0.9;
const movementThreshold = 0.01;

function setup() {
    createCanvas(700, 600);

    noStroke();
    textAlign(CENTER, CENTER);
    textSize(15);
    
    /**
     * Assign variables that were previously declared ouside of setup()
     */

    /**
     * The Player class
     */

    class Player {
        constructor(x, y, size, colour, speed, jump) {
            this.x = x || 0;
            this.y = y || 0;

            this.vx = 0;
            this.vy = 0;

            this.s = size || 20;
            this.c = colour || color(255, 0, 0);

            this.speed = speed || 1;
            this.jump = jump || 10.1;
            this.canJump = false;
            this.bouncing = false;
        };

        draw() {
            fill(this.c);
            square(this.x, this.y, this.s);
        };

        update(blocks) {
            if (keys[37] || keys[65]) { // left (left arrow or A)
                this.vx -= this.speed;
            }
            if (keys[39] || keys[68]) { // right (right arrow or D)
                this.vx += this.speed;
            }
            if ((keys[38] || keys[87]) && this.canJump) { // up (up arrow or W)
                this.vy -= this.jump / (this.bouncing ? 2 : 1);
            }
            if (keys[40] || keys[83]) { // down (down arrow or S)
                this.vy += this.speed;
            }

            this.vx *= friction;
            this.vy += gravity;

            if (abs(this.vx) < movementThreshold) this.vx = 0;
            if (abs(this.vy) < movementThreshold) this.vy = 0;

            // Apply collisions and update position
            this.canJump = false;
            this.x += this.vx;
            this.applyCollisions(blocks, this.vx, 0);

            this.bouncing = false;
            this.y += this.vy;
            this.applyCollisions(blocks, 0, this.vy);
            this.jumping = false;

            if (this.x < 0) this.x = 0;
            if (this.x > width - this.s) this.x = width - this.s;
            if (this.y < 0) this.y = 0;
            if (this.y > height - this.s) {
                this.y = height - this.s;
                this.canJump = true;
            }

            if (this.x <= 0 || this.x >= width - this.s) this.vx = 0;
            if (this.y <= 0 || this.y >= height - this.s) this.vy = 0;

            this.draw();
        };

        applyCollisions(blocks, vx, vy) {
            for (let block = 0; block < blocks.length; block++) {
                let b = blocks[block];
                if (collide(this, b)) {
                    switch (b.constructor.name) {
                        case 'ExitPortal':
                            nextLevel();
                            break;
                        case 'BouncyBlock':
                            if (vx > 0) {
                                this.x = b.x - this.s;
                                this.vx = -b.bounciness;
                            } 
                            else if (vx < 0) {
                                this.x = b.x + b.w;
                                this.vx = b.bounciness;
                            }
                            if (vy > 0) {
                                this.y = b.y - this.s;
                                this.vy = -b.bounciness;
                                this.canJump = true;
                                this.bouncing = true;
                            }
                            else if (vy < 0) {
                                this.y = b.y + b.h;
                                this.vy = b.bounciness;
                            }
                            break;
                        case 'StickyBlock':
                            this.vx = 0;
                            this.vy = 0;
                            this.canJump = true;
                        case 'Block':
                        default: 
                            if (vx > 0) {
                                this.x = b.x - this.s;
                                this.vx = 0;
                            } 
                            else if (vx < 0) {
                                this.x = b.x + b.w;
                                this.vx = 0;
                            }
                            if (vy > 0) {
                                this.y = b.y - this.s;
                                this.vy = 0;
                                this.canJump = true;
                            }
                            else if (vy < 0) {
                                this.y = b.y + b.h;
                                this.vy = 0;
                            }
                    }
                }
            }
        }
    }

    /**
     * The Block classes
     */

    class Block {
        constructor(x, y, width, height, colour) {
            this.x = x;
            this.y = y;
            this.w = width || 20;
            this.h = height || 20;
            this.c = colour || color(0);
        };

        draw() {
            fill(this.c);
            rect(this.x, this.y, this.w, this.h);
        };

        // needed?
        update() {
            

            this.draw();
        };
    }

    class ExitPortal extends Block {
        constructor(x, y, width, height) {
            super(x, y, width, height, color(140, 0, 255));
        }
    }

    class BouncyBlock extends Block {
        constructor(x, y, width, height) {
            super(x, y, width, height, color(255, 0, 255));
        }

        bounciness = 8;
    }

    class StickyBlock extends Block {
        constructor(x, y, width, height) {
            super(x, y, width, height, color(255, 127, 0));
        }
    }

    /** 
     * Helper functions
    */

    function collide(p, o) {
        return p.x + p.s > o.x && p.x < o.x + o.w &&
               p.y + p.s > o.y && p.y < o.y + o.h;
    }

    function loadLevel(num) {
        let level = levels[num];
        console.log(num, level);
        backgroundFunc = level.background;
        let map = level.map;
        blocks = [];
        for (let r = 0; r < map.length; r++) {
            for (let c = 0; c < map[r].length; c++) {
                let currentBlock = charMap[map[r][c]];
                if (currentBlock) {
                    if (currentBlock === Player) {
                        player.x = c * 20;
                        player.y = r * 20;
                        player.vx = 0;
                        player.vy = 0;
                    }
                    else blocks.push(new currentBlock(c*20, r*20));
                }
            }
        }
    }

    // Might add a fade
    async function nextLevel() {
        changingLevels = true;
        fading = true;
        await delay(700);
        loadLevel(++currentLevel);
        fading = 255;
    }

    async function delay(delay) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    let charMap = {
        'P': Player,
        '@': ExitPortal,
        'x': Block,
        'b': BouncyBlock,
        's': StickyBlock
    }

    let levels = [
        {
            map: [
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                  @",
                "                                   ",
                "                                   ",
                "                                   ",
                "  P                   xx           ",
                "                                   ",
                "                                   ",
                "                                   ",
                "             x                     ",
                "                                   ",
                "                                   ",
                "xxx                                ",
            ],
            background: function() {
                fill(100);
                textSize(30);
                text('Welcome!', width/2, height/3);
                textSize(15);
                text('Use arrow keys or WASD to move', width/2, height/3+50);
                text('Try to reach this portal\nto move to the next level', 600, 300);
                stroke(100);
                line(610, 330, 650, 350);
                line(650, 350, 645, 340);
                line(650, 350, 640, 353);
            }
        },
        {
            map: [
                "                                   ",
                "                                   ",
                "                                   ",
                "       @                           ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "             b                     ",
                "             b                     ",
                "             b                     ",
                "             b                     ",
                "             b                     ",
                "             b                     ",
                "             b                     ",
                "         bbbbb                     ",
                "                                   ",
                "                                   ",
                "   xxxxxxbbbbbb                   P",
                "                                   ",
                "                                   ",
                "                                   ",
                "                      bb           ",
                "                                   ",
                "                                xxx",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
            ],
            background: function() {
                fill(100);
                text('This block is bouncy', 455, 400);                
            }
        },
        {
            map: [
                "                                   ",
                "                                   ",
                "  bbbbbbbb        s                ",
                "        Pb        s      @         ",
                "         b        s                ",
                "    x    b        s                ",
                "  b bbbbbb        s                ",
                "  b b                              ",
                "  b b                              ",
                "  b b                              ",
                "  b b                             s",
                "  b b                             s",
                "  b b                             s",
                "  b b                             s",
                "  b b                             s",
                "  b xxxxxxxx                       ",
                "bbb        s                       ",
                "           s                       ",
                "  ssss     s                       ",
                "           s                       ",
                "           s                       ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                     s             ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
                "                                   ",
            ],
            background: function() {
                fill(100);
                text('This block is sticky', 427, 450);
                text('You might need a run up...', 200, 280);
            }
        },
        {
            map: [
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                "b                                 b",
                "b                                 b",
                "b                                 b",
                "b                P                b",
                "b                                 b",
                "b                                 b",
                "b                                 b",
                "b     x   x     xx     x     x    b",
                "b     x   x    x  x    x     x    b",
                "b      x x    x    x   x     x    b",
                "b       x     x    x   x     x    b",
                "b       x      x  x     x   x     b",
                "b       x       xx       xxx      b",
                "b                                 b",
                "b                                 b",
                "b                                 b",
                "b     x       x  xxx  x   x  x    b",
                "b     x       x   x   xx  x  x    b",
                "b      x  x  x    x   x x x  x    b",
                "b      x x x x    x   x  xx       b",
                "b       x   x    xxx  x   x  x    b",
                "b                                 b",
                "b                                 b",
                "b                                 b",
                "b                                 b",
                "b                                 b",
                "b                                 b",
                "b                                 b",
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            ],
            background: function() {
                // TODO: confetti
            }
        }
    ]


    /**
     * Main code body
     */

    player = new Player();
    
    nextLevel(); // initialise the first level

}

function draw() {
    if (changingLevels) {
        if (fading === true) background(255, fadeIncrement); // fade out
        else if (fading > 0) {
            update();
            background(255, fading-=5); // fade in
        }
        else {
            fading = 0;
            changingLevels = false;
        }
    }
    else {
        update();
    }
}

function update() {
    background(255);
        push();
        backgroundFunc();
        pop();
        
        player.update(blocks);
        blocks.forEach(b => b.draw());
}

keyPressed = function() {
    keys[keyCode] = true;
}

keyReleased = function() {
    keys[keyCode] = false;
}



/*
PREVIEW KEY PRESSES

In Chrome live expression:
[...keys.entries()].reduce((p,c)=>c[1]&&l[c[0]]?p+l[c[0]]+' ':p,'')

In console: */
var l=[];
l[37]=l[65]='left'
l[39]=l[68]='right'
l[38]=l[87]='up'
l[40]=l[83]='down'