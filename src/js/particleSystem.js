"use strict";

/* Get or create the application global variable */
var App = App || {};

var ParticleSystem = function() {

    // setup the pointer to the scope 'this' variable
    var self = this;

    // data container
    var data = [];

    // scene graph group for the particle system
    var sceneObject = new THREE.Group();

    // geometry to draw particles
    var geometry = new THREE.BufferGeometry();

    // bounds of the data
    var bounds = {};

    // upto decimal place
    var decimal = 10;    

    var svg = d3.select(".sliceDiv").append("svg")

    var xScale = d3.scaleLinear()
        .domain([bounds.minX, bounds.maxX])
        .range([30, 400]);

    var yScale = d3.scaleLinear()
        .domain([bounds.minY, bounds.maxY])
        .range([30, 400]);

    var colorScale = d3.scaleLinear()
        .domain([0,10])
        .range(['#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'])

    // 2d plane filter
    // var clippingPlane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 )
    // console.log(clippingPlane);
    // var plane = new THREE.PlaneHelper( clippingPlane, 25, 0x777777 )
    var plane = new THREE.Mesh( new THREE.PlaneGeometry( 20, 20, 15, 15), new THREE.MeshStandardMaterial( {color: 0xa3a3a3, side: THREE.DoubleSide, opacity: 0.1, transparent: true, wireframe: true} ));

    // rotate using orbitControls
    var controls = new THREE.OrbitControls( App.scene.camera(), App.scene.renderer().domElement );

    // create the containment box.
    // This cylinder is only to guide development.
    // TODO: Remove after the data has been rendered
    self.drawContainment = function() {

        // get the radius and height based on the data bounds
        var radius = (bounds.maxX - bounds.minX)/2.0 + 1;
        var height = (bounds.maxY - bounds.minY) + 1;

        // create a cylinder to contain the particle system
        var geometry = new THREE.CylinderGeometry( radius, radius, height, 32 );
        var material = new THREE.MeshBasicMaterial( {color: 0xff0000, wireframe: true} );
        var cylinder = new THREE.Mesh( geometry, material );

        // add the containment to the scene
        sceneObject.add(cylinder);
    };

    // creates the particle system
    self.createParticleSystem = function() {

        // use self.data to create the particle system
        var positions = [];
        var colors = [];

        var color = new THREE.Color();

        data.forEach(particle => {
            positions.push( particle.X );
			positions.push( particle.Y );
            positions.push( particle.Z );
            
            // color.setHSL(0.90, 0.85, 1 - particle.concentration/bounds.maxConc);
            color.set(colorScale(particle.concentration))

            colors.push( color.r, color.g, color.b );
        });
        geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

        geometry.computeBoundingSphere();

        var material = new THREE.PointsMaterial( { vertexColors: THREE.VertexColors, size: 0.1, opacity: 0.8, transparent: true } );
        var points = new THREE.Points( geometry, material );
        sceneObject.add(points);

        $('#scene').on('mousedown', function() {
            
        });

        $('#scene').on('mouseup', function() {
            
        });

    };

    self.draw2DPlane = function () {
        sceneObject.add(plane);
    };

    d3.select("#planePos").on("input", function() {
        var z = this.value;

        plane.position.z = z;

        var color = new THREE.Color();
        var colors = []
        data.forEach(particle => {
            
            // color.setHSL(0.90, 0.85, 1 - particle.concentration/bounds.maxConc);
            if(Math.round(particle.Z * decimal) / decimal == Math.round(z * decimal) / decimal)
                color.set(colorScale(particle.concentration))
            else
                color.setHSL(0, 0, 0.85)

            colors.push( color.r, color.g, color.b );
        });
        geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );        

        App.scene.render()
        
        //update the 2d view
        var dataSlice = data.filter(function(d){return Math.round(d.Z * decimal) / decimal == Math.round(z * decimal) / decimal;})
        // var dataSlice = data.filter(function(d){return d.Z == constant;})
        self.drawPoints(dataSlice)
    });

    d3.select('#colorBtn').on('click', function() {
        var color = new THREE.Color();
        var colors = []
        data.forEach(particle => {
            
            color.set(colorScale(particle.concentration))

            colors.push( color.r, color.g, color.b );
        });
        geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );        

        App.scene.render()
    })

    self.create2dView = function() {
        var width = d3.select('.sliceDiv').node().clientWidth;
        var height = width * 0.85;

        svg.attr("width", width)
            .attr("height", height)

        xScale.domain([bounds.minX, bounds.maxX]);
        yScale.domain([bounds.minY, bounds.maxY]);

        svg.append('rect')
            .attr('x', 15)
            .attr('y', 15)
            .attr('height', yScale(bounds.maxY) + 15)
            .attr('width', xScale(bounds.maxX) + 15)
            .attr('class', 'border')

        d3.select('#planePos')
            .attr('min', bounds.minZ)
            .attr('max', bounds.maxZ)
            .attr('step', 1/decimal)
        console.log(bounds.maxZ)

        var dataSlice = data.filter(function(d){return Math.round(d.Z * decimal) / decimal == 0;})
        
        self.drawPoints(dataSlice)
            
    };

    self.drawPoints = function(dataSlice) {
        // draw dots

        svg.selectAll(".dot").remove();
        var dots = svg.selectAll(".dot")
            .data(dataSlice)
            
        dots.enter().append("circle")
            .attr("class", "dot")
            .attr("r", 1.5)
            .attr("cx", function(d) { return xScale(d.X)})
            .attr("cy", function(d) { return 435 - yScale(d.Y + 5)})
            .style("fill", function(d) { return colorScale(d.concentration);}) 

        dots.exit().remove();
    };

    // data loading function
    self.loadData = function(file){

        // read the csv file
        d3.csv(file)
        // iterate over the rows of the csv file
            .row(function(d) {

                // get the min bounds
                bounds.minX = Math.min(bounds.minX || Infinity, d.Points0);
                bounds.minY = Math.min(bounds.minY || Infinity, d.Points2);
                bounds.minZ = Math.min(bounds.minZ || Infinity, d.Points1);
                bounds.minConc = Math.min(bounds.minConc || Infinity, d.concentration);

                // get the max bounds
                bounds.maxX = Math.max(bounds.maxX || -Infinity, d.Points0);
                bounds.maxY = Math.max(bounds.maxY || -Infinity, d.Points2);
                bounds.maxZ = Math.max(bounds.maxZ || -Infinity, d.Points1);
                bounds.maxConc = Math.max(bounds.maxConc || -Infinity, d.concentration);

                // add the element to the data collection
                data.push({
                    // concentration density
                    concentration: Number(d.concentration),
                    // Position
                    X: Number(d.Points0),
                    Y: Number(d.Points2 - 5),
                    Z: Number(d.Points1),
                    // Velocity
                    U: Number(d.velocity0),
                    V: Number(d.velocity2),
                    W: Number(d.velocity1)
                });
            })
            // when done loading
            .get(function() {
                // draw the containment cylinder
                // TODO: Remove after the data has been rendered
                // self.drawContainment();

                // create the particle system
                self.createParticleSystem();

                // create the 2d view
                
                self.draw2DPlane();
                self.create2dView();
            });
    };

    // publicly available functions
    var publiclyAvailable = {

        // load the data and setup the system
        initialize: function(file){
            self.loadData(file);
        },

        // accessor for the particle system
        getParticleSystems : function() {
            return sceneObject;
        }
    };

    return publiclyAvailable;

};