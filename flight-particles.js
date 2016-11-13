/**
 * Created by Pavel on 10/23/2016.
 */
(function(flightParticles){
    function FlightParticles(canvas) {
        this.canvas_ = canvas;
        this.camera = new Camera(canvas.width, canvas.height);
        this.particles_ = [];

        this.velocity = 50;
        this.particlesLimit = 400;
        this.particleSize = 8;
        this.particleColor = "rgb(70,70,70)";
        this.fadeDistance = 25;
        this.drawParticleFunction = drawCircle;

        var self = this;
        this.drawCycle_ = new DrawCycle(function (time) {
            self.animateFrame_(time);
        });
    }
    FlightParticles.prototype.start = function () {
        this.drawCycle_.start();
        this.updateParticles_(0);
    };
    FlightParticles.prototype.animateFrame_ = function (time) {
        var timeFrame = time - this.drawCycle_.lastIterationTime;
        this.camera.width = this.canvas_.width;
        this.camera.height = this.canvas_.height;
        this.updateParticles_(timeFrame);
        this.drawParticles_();
    };
    FlightParticles.prototype.createParticles_ = function (particlesCountToAdd, maxZDistance) {
        var coeff = 1 + this.camera.distance / this.camera.center;
        var xOffset = this.camera.width * coeff / 2;
        var yOffset = this.camera.height * coeff / 2;
        for (var i = 0; i < particlesCountToAdd; i++) {
            var particle = getFreeParticle();
            particle.x = getRandomInt(-xOffset, xOffset);
            particle.y = getRandomInt(-yOffset, yOffset);
            particle.z = getRandomInt(-25, maxZDistance);
            this.particles_.push(particle);
        }
    };
    FlightParticles.prototype.updateParticles_ = function (timeFrame) {
        var indicesToRemove = [];
        var step = this.velocity * timeFrame / 1000;
        for (var i = 0; i < this.particles_.length; i++) {
            var particle = this.particles_[i];
            particle.z += step;
            if (particle.z > this.camera.distance) {
                indicesToRemove.push(i);
            }
        }

        for (i = indicesToRemove.length - 1; i >= 0; i--) {
            var particleIndex = indicesToRemove[i];
            freeParticle(this.particles_[particleIndex]);
            this.particles_.splice(particleIndex, 1);
        }

        var particlesCountToAdd = Math.max(this.particlesLimit - this.particles_.length, 0);
        var maxZDistance = (this.camera.distance - this.fadeDistance) * particlesCountToAdd / this.particlesLimit;
        this.createParticles_(particlesCountToAdd, maxZDistance);
    };
    FlightParticles.prototype.drawParticles_ = function () {
        var context = this.canvas_.getContext('2d');
        context.clearRect(0, 0, this.camera.width, this.camera.height);
        context.fillStyle = this.particleColor;

        var distanceBeforeFade = this.camera.distance - this.fadeDistance;
        for (var i = 0; i < this.particles_.length; i++) {
            var particle = this.particles_[i];
            var projected = this.camera.projectParticle(particle);
            var projectedSize = (this.camera.center * this.particleSize) / (this.camera.center - projected.z);

            if (particle.z > distanceBeforeFade) {
                context.globalAlpha = Math.sin((-projected.z * Math.PI) / (2 * this.fadeDistance));
            } else {
                context.globalAlpha = 0.4 + 0.6 * particle.z / distanceBeforeFade;
            }
            this.drawParticleFunction(context, projected.x, projected.y, projectedSize);
        }
    };

    function drawCircle(context, x, y, size) {
        context.beginPath();
        context.arc(x, y, size / 2, 0, 2 * Math.PI, false);
        context.fill();
    }

    function Particle(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    function Camera(width, height) {
        this.width = width;
        this.height = height;

        this.distance = 150;
        this.center = 50;
        this.projectedParticle_ = new Particle(0, 0, 0);
    }
    Camera.prototype.projectParticle = function (point) {
        var projected = this.projectedParticle_;
        projected.z = point.z - this.distance;
        var u = 1 - projected.z / this.center;
        projected.x = point.x / u;
        projected.y = point.y / u;

        projected.x += this.width / 2;
        projected.y += this.height / 2;

        return projected;
    };

    function DrawCycle(callback) {
        this.lastIterationTime = null;
        this.callback_ = callback;
        this.animationId_ = null;

        var self = this;
        this.animationCallback_ = function (time) {
            self.callback_(time);
            self.lastIterationTime = time;
            requestAnimationFrame(self.animationCallback_);
        }
    }
    DrawCycle.prototype.start = function () {
        this.lastIterationTime = window.performance.now();
        this.animationId_ = requestAnimationFrame(this.animationCallback_);
    };
    DrawCycle.prototype.stop = function () {
        cancelAnimationFrame(this.animationId_);
    };

    var freeParticles = [];
    function getFreeParticle() {
        return freeParticles.pop() || new Particle(0, 0, 0);
    }
    function freeParticle(particle) {
        freeParticles.push(particle);
    }

    // Returns random integer within [min, max] interval.
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    flightParticles.init = function(canvas) {
        return new FlightParticles(canvas);
    };
})(window.FlightParticles || (window.FlightParticles = {}));