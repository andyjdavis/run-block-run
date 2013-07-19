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

Building = Class.extend({
    init: function(pos, size, color) {
        this.pos = pos;
        this.size = size;
        this.color = color;
    },
    update: function(dt) {
        multiplier = Math.floor((Date.now() - gGameTime)/1000) * 5;
        this.pos[0] -= dt * multiplier;
        
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
    }
});

City = Class.extend({
    buildings: null,
    spacer: 10,
    init: function() {
        this.buildings = Array();
    },
    update: function(dt) {
        var toRemove = Array(), nextX = 0;
        
        for (var i = 0;i < this.buildings.length;i++) {
            if (!this.buildings[i].update(dt)) {
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
        while (nextX < gCanvas.width) {
            size = [getRandomInt(150, 400), getRandomInt(40, 250)];
            pos = [nextX, gCanvas.height - size[1]];
            this.buildings.push(new Building(pos, size, 'grey'));
            
            nextX = pos[0] + size[0] + this.spacer;
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
                return true;
            }
        }
        return false;
    }
});

Star = Class.extend({
    init: function(pos) {
        this.pos = pos;
    },
    update: function(dt) {
        multiplier = Math.floor((Date.now() - gGameTime)/1000);
        this.pos[0] -= dt * multiplier;
        
        //is this star still on screen?
        return this.pos[0] > 0;
    },
    draw: function(dt) {
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
        
        for (var i = 0;i < this.stars.length;i++) {
            if (!this.stars[i].update(dt)) {
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
    init: function(pos, size, color) {
        this.pos = pos;
        this.size = size;
        this.color = color;
        
        this.vel = [0, 0];
        this.originalsize = size;
    },
    update: function(dt) {
        this.size[0] = this.snapback(this.originalsize[0], this.size[0]);
        this.size[1] = this.snapback(this.originalsize[1], this.size[1]);
        
        var belowLeft  = [this.pos[0] - (this.size[0]/2), this.pos[1]+1];
        var belowRight = [this.pos[0] + (this.size[0]/2), this.pos[1]+1];
        var inAir = !gCity.pointCollide(belowLeft) && !gCity.pointCollide(belowRight);
        
        //gravity
        if (inAir) {
            this.vel[1] += 5;
        }
        
        var oldpos = this.pos.slice(0);
        this.pos[0] += this.vel[0]*dt;
        this.pos[1] += this.vel[1]*dt;
        
        var bottomLeft  = [this.pos[0] - (this.size[0]/2), this.pos[1]];
        var bottomRight = [this.pos[0] + (this.size[0]/2), this.pos[1]];
        if (gCity.pointCollide(bottomLeft) || gCity.pointCollide(bottomRight)) {
            this.pos = oldpos;
            
            if (inAir && gCity.pointCollide(bottomLeft) && gCity.pointCollide(bottomRight)) {
                this.vel[1] = 0;
                this.squish();
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
        //if not already in the air
        
        //one pixel under the bottom left corner
        var underLeft = [this.pos[0] - this.size[0]/2, this.pos[1] + 1];
        if (gCity.pointCollide(underLeft)) {
            this.size = [this.size[0]*0.5, this.size[1]*2];
            this.vel[1] -= 400;
        }
    },
    snapback: function(original, current) {
        if (Math.abs(original - current) <= 2) {
            //near enough
            return current;
        }

        if (current < original) {
            return current * 1.05;
        } else {
            return current * 0.95;
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

function updateGame(dt) {
    gStarField.update(dt);
    gCity.update(dt);
    gBlock.update(dt);
}

function drawGame() {
    gContext.fillStyle = "black";
    gContext.fillRect(0 , 0, gCanvas.width, gCanvas.height);
    //context.clearRect(0, 0, canvas.width, canvas.height);
    
    gStarField.draw();
    gCity.draw();
    gBlock.draw();
}

var gOldTime = Date.now();
var gNewTime = null;
var gGameTime = Date.now();

var gCity = new City();
var gStarField = new StarField();

var pos = [30, 100];
var size = [30, 40];
var gBlock = new Block(pos, size, 'red');

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
