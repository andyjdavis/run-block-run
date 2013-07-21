/*
 * A little game about a block that's going place
 *
 * This code does not come with any sort of warranty.
 * You are welcome to use it for whatever you like as long as 
 * you provide a credit to Andrew Davis and link to http://thetravelingprogrammer.com
 */


function drawRect(context, x, y, width, height, color) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
}
function drawText(context, text, font, style, x, y) {
    context.font = font;
    context.fillStyle = style;
    context.fillText(text, x, y);
}
function getRandomInt(minimum, maximum) {
    rand = minimum + Math.floor(Math.random() * (maximum - minimum + 1));
    return rand;
}

//http://ejohn.org/blog/simple-javascript-inheritance/#postcomment
/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
 
  // The base Class implementation (does nothing)
  this.Class = function(){};
 
  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }
   
    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    Class.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    Class.prototype.constructor = Class;
 
    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();

function getGameSeconds() {
    return Math.floor((Date.now() - gGameTime)/1000);
}

Building = Class.extend({
    init: function(pos, size, color) {
        this.pos = pos;
        this.size = size;
        this.color = color;
    },
    update: function(dt, seconds) {
        this.pos[0] -= dt * seconds * 5;//Math.ceil(dt * seconds * 5);
        
        //is this building still on screen?
        return (this.pos[0] + this.size[0]) > 0;
    },
    draw: function(dt) {
        drawRect(gContext, this.pos[0], this.pos[1], this.size[0], this.size[1], this.color);
    },
    pointCollide: function(p) {
        if (p[0] > this.pos[0] && p[0] < this.pos[0] + this.size[0]) {
            if (p[1] > this.pos[1] && p[1] < this.pos[1] + this.size[1]) {
                return true;
            }
        }
        return false;
    },
    rectangleCollide: function(r) {
        var leftInside =  r.pos[0] > this.pos[0] && r.pos[0] < this.pos[0] + this.size[0];
        var rightInside= r.pos[0] + r.size[0] > this.pos[0] && r.pos[0]  + r.size[0] < this.pos[0] + this.size[0];
        
        if (leftInside || rightInside) {
             //only checking the bottom of r
             var bottom = r.pos[1] + r.size[1];
             if (bottom > this.pos[1] && bottom < this.pos[1] + this.size[1]) {
                return true;
             }
        }
        return false;
    }
});

City = Class.extend({
    buildings: null,
    spacer: 10,
    previousHeight: null,
    init: function() {
        this.buildings = Array();
    },
    update: function(dt) {
        var toRemove = Array(), nextX = 0;
        var seconds = getGameSeconds();
        
        for (var i = 0;i < this.buildings.length;i++) {
            if (!this.buildings[i].update(dt, seconds)) {
                toRemove.push(i);
            } else {
                if (nextX < this.buildings[i].pos[0] + this.buildings[i].size[0] + this.spacer) {
                    nextX = this.buildings[i].pos[0] + this.buildings[i].size[0] + this.spacer;
                }
            }
        }
        //old buildings
        for (var j = 0;j < toRemove.length;j++) {
            this.buildings.splice(toRemove[j],1);
        }
        //new buildings
        var pos = null, size = null;
        var minHeight, nextHeight;
        var minWidth, maxWidth;
        while (nextX < gCanvas.width) {
            if (this.buildings.length == 0) {
                //make first building wide and low
                nextHeight = getRandomInt(30, 50);
                minWidth = 700;
                maxWidth = 1000;
            } else {
                minHeight = this.previousHeight - 100;
                if (minHeight < 30) {
                    minHeight = 30;
                }
                nextHeight = null
                while (!nextHeight) {
                    nextHeight = getRandomInt(minHeight, this.previousHeight + 80);
                    if (gCanvas.height - nextHeight < 20) {
                        nextHeight = null;
                    }
                }
                
                minWidth = 50;
                maxWidth = 1000;
            }
            size = [getRandomInt(minWidth, maxWidth), nextHeight];
            pos = [nextX, gCanvas.height - size[1]];
            this.buildings.push(new Building(pos, size, 'grey'));
            
            nextX = pos[0] + size[0] + this.spacer;
            this.previousHeight = nextHeight;
        }
    },
    draw: function() {
        for (var i = 0;i < this.buildings.length;i++) {
            this.buildings[i].draw();
        }
    },
    pointCollide: function(p) {
        for (var i = 0;i < this.buildings.length;i++) {
            if (this.buildings[i].pointCollide(p)) {
                return this.buildings[i];
            }
        }
        return null;
    },
    rectangleCollide: function(r) {
        for (var i = 0;i < this.buildings.length;i++) {
            if (this.buildings[i].rectangleCollide(r)) {
                return this.buildings[i];
            }
        }
        return null;
    }
});

Star = Class.extend({
    init: function(pos) {
        this.pos = pos;
    },
    update: function(dt, seconds) {
        this.pos[0] -= dt * seconds;//Math.floor(dt * seconds);
        
        //is this star still on screen?
        return this.pos[0] > 0;
    },
    draw: function() {
        drawRect(gContext, this.pos[0], this.pos[1], 1, 1, 'white');
    }
});

StarField = Class.extend({
    stars: null,
    spacer: 10,
    init: function() {
        this.stars = Array();
    },
    update: function(dt) {
        var toRemove = Array(), nextX = 0;
        var seconds = getGameSeconds();
        
        for (var i = 0;i < this.stars.length;i++) {
            if (!this.stars[i].update(dt, seconds)) {
                toRemove.push(i);
            } else {
                if (nextX < this.stars[i].pos[0] + this.spacer) {
                    nextX = this.stars[i].pos[0] + this.spacer;
                }
            }
        }
        //old stars
        for (var j = 0;j < toRemove.length;j++) {
            this.stars.splice(toRemove[j], 1);
        }
        //new stars
        var pos = null;
        while (nextX < gCanvas.width) {
            //no stars in bottom 40 pixels
            pos = [nextX, getRandomInt(0, gCanvas.height-40)];
            this.stars.push(new Star(pos));
            
            nextX = pos[0] + this.spacer;
        }
    },
    draw: function() {
        for (var i = 0;i < this.stars.length;i++) {
            this.stars[i].draw();
        }
    }
});

Block = Class.extend({
    init: function(pos, size, startSize, color, vel) {
        this.pos = pos;
        this.originalsize = size;
        this.size = startSize;
        this.color = color;
        this.vel = vel;
        
        this.airborne = true;
        this.jumpsavailable = 2;
        this.jumpsused = 0;
    },
    update: function(dt) {
        this.size[0] = this.snapback(this.originalsize[0], this.size[0]);
        this.size[1] = this.snapback(this.originalsize[1], this.size[1]);
        
        //apply gravity if jumping or have slid off a building
        if (!this.airborne) {
            var belowLeft  = [this.pos[0] - (this.size[0]/2), this.pos[1] + 2];
            this.airborne = !gCity.pointCollide(belowLeft);
        }
        if (this.airborne) {
            this.vel[1] += 500 * dt;
            this.airborne = true;
        }
        
        var oldpos = this.pos.slice(0);
        //this.pos[0] += this.vel[0]*dt;
        this.pos[1] += Math.round(this.vel[1] * dt);
        
        if (this.pos[1] > gCanvas.height) {
            newGame();
        }
        
        var rect = {
            'pos': [this.pos[0] - (this.size[0]/2), this.pos[1] - this.size[1]],
            'size': this.size
        };
        var collide = gCity.rectangleCollide(rect);
        if (collide) {
            //if was over the building
            //adding 1 as player was falling through sometimes
            if (oldpos[1] < collide.pos[1]+1) {
                var left = oldpos[0] - (this.size[0]/2);
                var leftSideOver  = (left > collide.pos[0] && left < collide.pos[0] + collide.size[0]);
                
                var right = oldpos[0] + (this.size[0]/2);
                var rightSideOver = (right > collide.pos[0] && right < collide.pos[0] + collide.size[0]);
                
                if (leftSideOver || rightSideOver) {
                
                    //landed on top of a building
                    this.pos[1] = collide.pos[1];
                    this.jumpsused = 0;
                    if (this.vel[1] > 100) {
                        this.squish();
                    }
                    this.vel[1] = 0;
                    this.airborne = false;
                }
            } else {
                //do nothing. Let player pass through building.
            }
        }
    },
    draw: function(dt) {
        //this.pos is actually the bottom middle of the box
        var drawpos = [this.pos[0] - (this.size[0]/2), this.pos[1] - this.size[1]];
        drawRect(gContext, drawpos[0], drawpos[1], this.size[0], this.size[1], this.color);
    },
    squish: function() {
        this.size = [this.size[0]*1.5, this.size[1]*0.5];
    },
    jump: function() {
        var jump = false;
        if (!this.airborne) {
            jump = true;
        } else if (this.jumpsused < this.jumpsavailable && this.jumpsavailable > 1) {
            jump = true;
        }
        if (jump) {
            this.jumpsused++;
            this.size = [this.size[0]*0.5, this.size[1]*2];
            this.vel[1] -= 300;//400;
            this.airborne = true;
        }
    },
    snapback: function(original, current) {
        if (Math.abs(original - current) <= 2) {
            //near enough
            return current;
        }

        if (current < original) {
            return Math.round(current * 1.1);
        } else {
            return Math.round(current * 0.9);
        }
    }
});

function onKeyDown(event) {
    if (event.keyCode == 83) { //s
        gBlock.squish();
    } else if (event.keyCode == 74) { //j
        gBlock.jump();
    }
}
window.addEventListener('keydown', onKeyDown, false);

var gCanvas = document.getElementById('gamecanvas');
var gContext = gCanvas.getContext('2d');
var gHighScore = 0;

function newGame() {
    if (gGameTime) {
        if (getGameSeconds() > gHighScore) {
            gHighScore = getGameSeconds();
        }
    }
    gGameTime = Date.now();
    
    gCity = new City();
    gStarField = new StarField();

    var pos = [50, gCanvas.height-1];
    var size = [30, 40];
    gBlock = new Block(pos, size, [1000, 1000], 'red', [0, -270]);
}

function updateGame(dt) {
    gStarField.update(dt);
    gCity.update(dt);
    gBlock.update(dt);
    
    if (gBlock.jumpsavailable < 5) {
        gBlock.jumpsavailable = Math.floor(getGameSeconds() / 60) + 1;
    }
}

function drawGame() {
    gContext.fillStyle = "black";
    gContext.fillRect(0 , 0, gCanvas.width, gCanvas.height);
    //context.clearRect(0, 0, canvas.width, canvas.height);
    
    gStarField.draw();
    gCity.draw();
    gBlock.draw();
    
    var seconds = getGameSeconds();
    
    if (seconds > 1 && seconds < 5) {
        drawText(gContext, "Run Block Run", '36pt '+gFont, 'red', 130, gCanvas.height/2);
    } else if (seconds > 6 && seconds < 10) {
        drawText(gContext, "press J to jump", '24pt '+gFont, 'red', 180, gCanvas.height/2);
    }
    
    text = seconds + " s";
    drawText(gContext, text, '18pt '+gFont, 'green', gCanvas.width - 60, 40);
    
    if (gHighScore > 0) {
        text = gHighScore + " s";
        drawText(gContext, text, '18pt '+gFont, 'green', gCanvas.width - 60, 80);
    }
    
    var color = null;
    for (var i = 0; i < 5; i++) {
        if (i < gBlock.jumpsavailable - gBlock.jumpsused) {
            color = 'red';
        } else {
            color = 'grey';
        }
        drawRect(gContext, 50+(i*40), 20, 10, 10, color);
    }
}

var gFont = "Courier New";

var gOldTime = Date.now();
var gNewTime = null;
var gGameTime = null;

var gCity = null, gStarField = null, gBlock = null;
newGame();

//executed 60/second
var mainloop = function() {
    gNewtime = Date.now();
    dt = (gNewtime - gOldTime)/1000;
    gOldTime = gNewtime;
        
    updateGame(dt);
    drawGame();
};

var ONE_FRAME_TIME = 1000 / 60; // 60 per second
setInterval( mainloop, ONE_FRAME_TIME );
