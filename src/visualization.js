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
	
		var gdp_scale = d3.scale.log()
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
					return "#AAA";
				}
	  	})
	  	.on("mouseover", function(d) {
	  		var country = d3.select(this)
	  		country.transition()
					.duration(300)
					.style('stroke', 'black')

				if ( d.information && d.information.gdp) {
					revealCountryInformation(d)
				} else {
					showNoData(d)
				}
	  	})
	  	.on("mouseout", function(d) {
	  		var country = d3.select(this)
	  		country.transition()
					.duration(300)
					.style('stroke', '#FFF')
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

	country_selection.html('')
	country_selection.append('h2')
		.text(data.information['wb:name'])

	country_selection.append('p')
		.text("GDP: " + data.information.gdp)

	country_selection.append('p')
		.text("Gold medals: " + data.information.gold_medals)

	country_selection.append('p')
		.text("Silver medals: " + data.information.silver_medals)

	country_selection.append('p')
		.text("Bronze medals: " + data.information.bronze_medals)

}

function showNoData(d) {
	country_selection = d3.select('#individual_country_container #specific_country')
	country_selection.html('')
	if (d.information) {
		country_selection.append('h3')
			.text('No information available for ' + d.information['wb:name'])
	} else {
			country_selection.append('h3')
			.text('No information available')
	}
}


function	constructBarGraphs(countries) {

	countries.sort(sortCountriesByMedals);

	var main_total_width = 1300;
	var main_total_height = 700; 
	var bar_graph_total_width = 1000;
	var bar_graph_total_height = 500;
	var num_countries = countries.length;
	var padding = 3;
  var indiv_country_length = (bar_graph_total_width - 40) / num_countries - padding;
  var my = d3.max(countries, function(d) { 
		return d.Gold_medals + d.Silver_medals + d.Bronze_medals;
	 })

	height_scale = d3.scale.linear().domain([0, my]).range([0, bar_graph_total_height - 60])

	var x = function(data, index) { return index * ((bar_graph_total_width - 40) / num_countries) }

	var main_graph_svg = d3.select('#individual_country_container')
    .append('svg:svg')
		.attr('width', main_total_width)
		.attr('height', main_total_height);

	var bar_graph_svg = main_graph_svg.append('svg:g')
		.attr('class', 'stacked_bar_graph')
		.attr('transform', function() {
			return 'translate(' + ( (main_total_width - bar_graph_total_width) / 2 ) + ', 20)';
		})

	x_axis_label = bar_graph_svg.append('svg:text')
		.text('Sampling of Countries that Participated in the Olympics')	
		.style('fill', '#555')
		.attr('transform', function() {
			var bounding_box = this.getBBox();
			var text_width = bounding_box.width;
			return 'translate(' + ((bar_graph_total_width) / 2 - text_width / 2) + ',' + (bar_graph_total_height + 50) + ')';
		})

	country_ticks = bar_graph_svg.selectAll('line.x_ticks')
		.data(countries)
	 .enter().append('svg:line')
		.attr('y1', 0)
		.attr('y2', bar_graph_total_height)
		.attr('x1', function(d, i) {
			return x(d, i);
		})
		.attr('x2', function(d, i) {
			return x(d, i);
		})
		.attr('transform', function(d, i) {
			return 'translate(' + 53 + ', 0)';
		})
		.style('opacity', 0.0)
		.style('stroke', '#AAA')
		.style('stroke-width', 2)

	country_ticks
		.transition()
		.delay(1200)
		.duration(300)
		.style('opacity', 0.2)

	// Gold Rectangle
	var rect_gold = bar_graph_svg.selectAll('rect.gold')
		.data(countries)
	 .enter().append('svg:rect')	
		.attr('transform', function(d, i) {
			return 'translate(' + (x(d, i) + 30) + ', 50)';
		})
		.attr('width', indiv_country_length)
		.attr('height', 0)
		.style('fill', '#f7bc0c')
		.style('stroke', '#FFF')

	rect_gold
	 .transition()
	  .delay(300)
	  .duration(300)
		.attr('height', function(d) {
			total_height = d.Gold_medals + d.Silver_medals + d.Bronze_medals;
			return height_scale(total_height);
		})
		.attr('transform', function(d, i) {
			remaining_height = bar_graph_total_height - 40 - height_scale(d.Gold_medals + d.Silver_medals + d.Bronze_medals);
			return 'translate(' + (x(d, i) + 30) + ', ' + (50 + remaining_height) + ')';
		})


	var rect_silver = bar_graph_svg.selectAll('rect.silver')
		.data(countries)
	 .enter().append('svg:rect')	
		.attr('transform', function(d, i) {
			return 'translate(' + (x(d, i) + 30) + ', 50)';
		})
		.attr('width', indiv_country_length)
		.attr('height', 0)
		.style('fill', '#cecece')
		.style('stroke', '#FFF')

	rect_silver
	 .transition()
	  .delay(600)
	  .duration(300)
		.attr('height', function(d) {
			total_height = d.Silver_medals + d.Bronze_medals;
			return height_scale(total_height);
		})
		.attr('transform', function(d, i) {
			remaining_height = bar_graph_total_height - 40 - height_scale(d.Silver_medals + d.Bronze_medals);
			return 'translate(' + (x(d, i) + 30) + ', ' + (50 + remaining_height) + ')';
		})

	var rect_bronze = bar_graph_svg.selectAll('rect.bronze')
		.data(countries)
	 .enter().append('svg:rect')	
		.attr('transform', function(d, i) {
			return 'translate(' + (x(d, i) + 30)+ ', 50)';
		})
		.attr('width', indiv_country_length)
		.attr('height', 0)
		.style('fill', '#bc6620')
		.style('stroke', '#FFF')
		.style('stroke-width', '1')

	rect_bronze
	 .transition()
	  .delay(900)
	  .duration(300)
		.attr('height', function(d) {
			total_height = d.Bronze_medals;
			return height_scale(total_height);
		})
		.attr('transform', function(d, i) {
			remaining_height = bar_graph_total_height - 40 - height_scale(d.Bronze_medals);
			return 'translate(' + (x(d, i) + 30)+ ', ' + (50 + remaining_height) + ')'; })

	rect_text_label = bar_graph_svg.selectAll('text.iso')
		.data(countries)
	 .enter().append('svg:text')
		.style('opacity', 0.0)
		.style('font-size', 20)
		.attr('class', 'iso')
		.attr('transform', function(d, i) {
			y_shift = 65;
			return 'translate(' + (x(d, i) + 45) + ', ' + y_shift + ') rotate(270)';
		})
		.text(function(d) { return String(d.Country_name) })

	console.log( "Height Scale" )
	console.log( height_scale.ticks(10) )


	rect_text_label
	 .transition()
		.delay(1000)	
		.duration(300)
		.style('opacity', 1.0)

	y_axis_ticks = bar_graph_svg.selectAll('line.y_ticks')	
		.data(height_scale.ticks(5))
	 .enter().append('svg:line')
		.attr('x1', 10)
		.attr('y1', function(d, i) {
			return height_scale(d) + 86;
		})
		.attr('x2', 20)
		.attr('y2', function(d, i) {
			return height_scale(d) + 86;
		})
		.style('stroke', '#555')

	y_axis_labels = bar_graph_svg.selectAll('text.y_label_text')
		.data(height_scale.ticks(5))
 	 .enter().append('svg:text')	
		.attr('transform', function(d, i) {
			return 'translate(-20, ' + (bar_graph_total_height - height_scale(d) + 10) + ')';
		})
		.attr('text-anchor', 'middle')
		.text(function(d, i) { return String(d);	})

	y_axis_description = bar_graph_svg.append('svg:text')
		.text("Number of Medals")
		.attr('transform', function() {
			var bounding_box = this.getBBox()
			var height = bounding_box.width;
			return 'translate(-50 , ' + (bar_graph_total_height / 2 + height / 2)  + ') rotate(270)';
		})
		.style('fill', '#555')


}

function sortCountriesByMedals(first, second) {
	var first_medals = first.Gold_medals + first.Silver_medals + first.Bronze_medals;
	var second_medals = second.Gold_medals + second.Silver_medals + second.Bronze_medals;

	return second_medals - first_medals;	
}
