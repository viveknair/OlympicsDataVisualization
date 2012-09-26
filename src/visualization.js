var feature;

var projection = d3.geo.azimuthal()
  .scale(380)
  .origin([-71.03,42.37])
  .mode("orthographic")
  .translate([640, 400]);

var circle = d3.geo.greatCircle()
    .origin(projection.origin());

var country_accessor = d3.svg.line()
  .x( function(d) { return d[0]; })
  .y( function(d) { return d[1]; })

var scale = {
  orthographic: 380,
  stereographic: 380,
  gnomonic: 380,
  equidistant: 380 / Math.PI * 2,
  equalarea: 380 / Math.SQRT2
};

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#svg_container").append("svg:svg")
    .attr("width", 880)
    .attr("height", 800)
    .on("mousedown", mousedown);

d3.json("libs/data/world-names-combined-olympics.json", function(collection) {
	d3.json("libs/data/olympics.json", function(olympic_collection) {

		constructBarGraphs(olympic_collection);
	
		gdp_values = []
		collection.features.forEach( function( value ) {
			if ( value.information && value.information.gdp) {
				gdp_values.push(value.information.gdp)
			}
		});
	
		gdp_values.sort(d3.ascending)
	
		var gdp_scale = d3.scale.linear()
			.domain([gdp_values[0], gdp_values[gdp_values.length - 1]])
			.interpolate(d3.interpolateRgb)
			.range(["#ff0000", "#0000ff"])
	
		console.log("GDP Scale")
		console.log( gdp_scale )
	
		console.log( "GDP Values" )
		console.log( gdp_values )
	
	  feature = svg.selectAll("path")
	    .data(collection.features)
	   .enter().append("svg:path")
	    .attr("d", clip)
	  	.style("fill", function(d) {
				if ( d.information && d.information.gdp) {
					return gdp_scale(d.information.gdp);
				} else {
					return "black";
				}
	  	})
	  	.on("mouseover", function(d) {
	  		var country = d3.select(this)
	  		country.style('stroke', 'black')
	  		country.style('fill', 'turquoise')
				if ( d.information && d.information.gdp) {
					revealCountryInformation(d)
				} else {
					showNoData(d)
				}
	  	})
	  	.on("mouseout", function(d) {
	  		var country = d3.select(this)
	  		country.style('stroke', 'none')
	  		country.style('fill', function() {
					return ( d.information && d.information.gdp) ? gdp_scale(d.information.gdp) : "black";
				})
	  	})
			.on("click", function(d) {
				revealCountryInformation(d)
			})
	});
});

d3.select(window)
  .on("mousemove", mousemove)
  .on("mouseup", mouseup);

d3.select("select").on("change", function() {
  projection.mode(this.value).scale(scale[this.value]);
  refresh(750);
});

var m0, o0;

function mousedown() {
  m0 = [d3.event.pageX, d3.event.pageY];
  o0 = projection.origin();
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {
    var m1 = [d3.event.pageX, d3.event.pageY],
        o1 = [o0[0] + (m0[0] - m1[0]) / 8, o0[1] + (m1[1] - m0[1]) / 8];
    projection.origin(o1);
    circle.origin(o1)
    refresh();
  }
}

function mouseup() {
  if (m0) {
    mousemove();
    m0 = null;
  }
}

function refresh(duration) {
  (duration ? feature.transition().duration(duration) : feature).attr("d", clip);
}

function clip(d) {
  return path(circle.clip(d));
}

function colorFromType(country) {
	var color = 'black'
	if (country.information) {
		switch(country.information['wb:incomeLevel']) {
			case "Low income":
				color = 'red'
				break;
			case "High income: OECD":
				color = 'green'
				break;
			case "Lower middle income":
				color = 'orange'
				break;
			case "Upper middle income":
				color = 'blue'
				break; 
		}
	} else {
		color = 'black'
	}
	return color	
}

function revealCountryInformation(data) {
	console.log("Console loggin' data")
	console.log(data)	
	country_selection = d3.select('#individual_country_container #specific_country')

	country_selection.html('p')
		.text(data.information['wb:name'])

	country_selection.append('p')
		.text(data.information.gdp)

	country_selection.append('p')
		.text("Gold medals " + data.information.gold_medals)

	country_selection.append('p')
		.text("Silver medals " + data.information.silver_medals)

	country_selection.append('p')
		.text("Bronze medals " + data.information.bronze_medals)

}

function showNoData(d) {
	country_selection = d3.select('#individual_country_container #specific_country')
	if (d.information) {
		country_selection.html('p')
			.text('No information available for ' + d.information['wb:name'])
	} else {
			country_selection.html('p')
			.text('No information available')
	}
}


function	constructBarGraphs(countries) {

	var total_width = 500;
	var total_height = 400; 
	var num_countries = countries.length;
	var padding = 10;
  var indiv_country_length = total_width / num_countries - padding;
  var my = d3.max(countries, function(d) { return d.Gold_medals + d.Silver_medals + d.Bronze_medals; })

	console.log("Countries length " + num_countries + ": Max y is " + my);

	height_scale = d3.scale.linear().domain([0, my]).range([0, total_height])

	var x = function(data, index) { return index * (500 / num_countries) }

	var bar_graph_svg = d3.select('#individual_country_container')
    .append('svg:svg')
		.attr('width', total_width)
		.attr('height', total_height);

	// Gold Rectangle
	bar_graph_svg.selectAll('rect.gold')
		.data(countries)
	 .enter().append('svg:rect')	
		.attr('transform', function(d, i) {
			return 'translate(' + x(d, i) + ', 0)';
		})
		.attr('width', indiv_country_length)
		.attr('height', function(d) {
			total_height = d.Gold_medals + d.Silver_medals + d.Bronze_medals;
			return height_scale(total_height);
		})
		.style('fill', '#f7bc0c')
		.style('stroke', '#000')

	bar_graph_svg.selectAll('rect.silver')
		.data(countries)
	 .enter().append('svg:rect')	
		.attr('transform', function(d, i) {
			return 'translate(' + x(d, i) + ', 0)';
		})
		.attr('width', indiv_country_length)
		.attr('height', function(d) {
			total_height = d.Silver_medals + d.Bronze_medals;
			return height_scale(total_height);
		})
		.style('fill', '#cecece')
		.style('stroke', '#000')

	bar_graph_svg.selectAll('rect.bronze')
		.data(countries)
	 .enter().append('svg:rect')	
		.attr('transform', function(d, i) {
			return 'translate(' + x(d, i) + ', 0)';
		})
		.attr('width', indiv_country_length)
		.attr('height', function(d) {
			total_height = d.Bronze_medals;
			return height_scale(total_height);
		})
		.style('fill', '#bc6620')
		.style('stroke', '#AAA')
		.style('stroke-width', '1')

	bar_graph_svg.selectAll('text.iso')
		.data(countries)
	 .enter().append('svg:text')
		.style('fill', '#000')
		.attr('transform', function(d, i) {
			return 'translate(' + x(d, i) + ', 0)';
		})
		.text(function(d) { return d.ISO_country_code })
}
