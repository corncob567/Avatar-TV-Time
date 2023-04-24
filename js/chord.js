class Chord {
    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
    */
	constructor(_config, _data, _importantChar, _infoText) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 600,
      containerHeight: _config.containerHeight || 600,
      margin: { top: 30, bottom: 10, right: 10, left: 10 },
	  infoText: _infoText
    }

    this.data = _data;
    this.importantChar = _importantChar;

    this.initVis();
	}
	
	initVis()
	{
		let vis = this;
		
		//vis.colors = ["#8dd3c7","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"];
        //vis.colors = ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e','#003c30'];
        vis.colors = ['#003c30','#01665e','#35978f','#80cdc1','#c7eae5','#c7eae5','#f6e8c3','#dfc27d','#bf812d','#8c510a','#543005'];
        //vis.colors = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'];
        //vis.colors = ['#9e0142','#d53e4f','#f46d43','#fdae61','#fee08b','#ffffbf','#e6f598','#abdda4','#66c2a5','#3288bd','#5e4fa2'];
        
		
		vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
	  	vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
		
		vis.svg = d3.select(vis.config.parentElement)
	  		.attr('width', vis.config.containerWidth)
	  		.attr('height', vis.config.containerHeight);
			
		
		//vis.UpdateVis();
		let matrix = vis.getMatrix();
		
		vis.chordArc = d3.chord()
			.padAngle(0.05)
			.sortSubgroups(d3.descending)
			(matrix);
		
        // Draw Text Labels
		vis.svg
			.datum(vis.chordArc)
			.append('g')
            .attr("transform", `translate(${vis.config.containerWidth/2},${ vis.config.containerHeight/2})`)
			.selectAll('g')
			.data(d => d.groups)
            .join('text')
                .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
                .attr("x", "5")
                .attr("dy", ".35em")
                .attr("class", "titles")
                .attr("text-anchor", d => {return ((d.angle > Math.PI) ? "end" : null)})
                .attr("transform", d => {
                        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                        + "translate(" + (200 + 35) + ")"
                        + (d.angle > Math.PI ? "rotate(180)" : "");
                })
                .style("fill", "black")
                .text(d => vis.importantChar[d.index])
		
        // Draw Group Arcs
        vis.svg
            .datum(vis.chordArc)
            .append('g')
            .attr("transform", `translate(${vis.config.containerWidth/2},${ vis.config.containerHeight/2})`)
            .selectAll('g')
            .data(d => d.groups)
            .join('path')
                .attr("class", d => {return "group " + vis.importantChar[d.index];})
                .attr("id", d => {return "#group" + vis.importantChar[d.index];})
                .style("fill", d => vis.colors[d.index])
				.style("stroke", "grey")
                .style("opacity", "0.5")
				.attr("d", d3.arc()
				  .innerRadius(200)
				  .outerRadius(220)
				)

        // Draw Chord Arcs
		vis.svg
		  .datum(vis.chordArc)
		  .append("g")
			.attr("transform", `translate(${vis.config.containerWidth/2},${ vis.config.containerHeight/2})`)
		  .selectAll("path")
		  .data(d => d)
		  .join("path")
			.attr("d", d3.ribbon()
			  .radius(200)
			)
			.style("fill", d => vis.colors[d.source.index % 11])
			.style("stroke", "grey")
		  .on('mouseover', (event, d) => {
							d3.select('#tooltip')
							  .style('display', 'block')
							  .style('left', (event.pageX + 10) + 'px')   
							  .style('top', (event.pageY + 10) + 'px')
							  .html(`<li>${vis.importantChar[d.source.index]} referenced ${vis.importantChar[d.target.index]} ${d.source.value} times
							  </li><li>${vis.importantChar[d.target.index]} referenced ${vis.importantChar[d.source.index]} ${d.target.value} times
							  </li>
								  `);}) 
		   .on('mouseleave', () => {
			  d3.select('#tooltip').style('display', 'none');
			});

		// Info Logo
        vis.svg
        .append("svg:image")
        .attr("xlink:href", "../assets/info-logo.png")
        .attr('class', 'info-logo')
        .attr("transform", "translate(" + (500) + " ," + (10) + ")")
        .on("mouseover mouseleave", function(d){ 
            if (!d3.select('#info-tooltip').classed("selected") ){
                d3.select(this).attr("xlink:href", "../assets/info-logo-blue.png");
                d3.select('#info-tooltip').classed("selected", true)
                .style('display', 'block')
                .style('left', (event.pageX + 5) + 'px')   
                .style('top', (event.pageY) + 'px')
                .html(`
                    <div class="tooltip-description">${vis.config.infoText}</div>
                    
                `);
            }else{
                d3.select(this).attr("xlink:href", "../assets/info-logo.png");
                d3.select('#info-tooltip').classed("selected", false);
                d3.select('#info-tooltip').style('display', 'none');
            }
        })
	}
	
	getMatrix()
	{
		let vis = this;
        let matrix = Array(vis.importantChar.length).fill(null).map((i) => Array(vis.importantChar.length).fill(0));
		let importantCharRegex = new RegExp(vis.importantChar.join("|"), "gm")
		// let filteredData = vis.data.filter(d => (d.season.toString() === selectedSeason || selectedSeason === "any"))
		vis.data.forEach(d => {
			let mention = new Set(d.dialog.match(importantCharRegex));
			if (mention.size != 0){
				mention.forEach(m => {
					let talking = vis.importantChar.indexOf(d.character);
					let talkedAbout = vis.importantChar.indexOf(m)
					matrix[talking][talkedAbout] += 1
				})
			}
			
		});

		return matrix;
        
	}
	
	updateVis()
	{
		let vis = this;
		let matrix = vis.getMatrix();
		vis.chordArc = d3.chord()
			.padAngle(0.05)
			.sortSubgroups(d3.descending)
			(matrix);

		// TODO: Sam, i tried to copy stuff from initvis and mod it to render properly, but it jacks up.
		// Draw Group Arcs
        vis.svg
            .datum(vis.chordArc)
            .join('g')
            .selectAll('g')
            .data(d => d.groups)
            .join('path')
                .attr("class", d => {return "group " + vis.importantChar[d.index];})
                .attr("id", d => {return "#group" + vis.importantChar[d.index];})
                .style("fill", d => vis.colors[d.index])
				.style("stroke", "grey")
                .style("opacity", "0.5")
				.attr("d", d3.arc()
				  .innerRadius(200)
				  .outerRadius(220)
				)
		
		// Draw Chord Arcs
		vis.svg
			.datum(vis.chordArc)
			.join("g")
			.selectAll("path")
			.data(d => d)
			.join("path")
				.attr("d", d3.ribbon()
				.radius(200)
				)
				.style("fill", d => vis.colors[d.source.index % 11])
				.style("stroke", "grey")
			.on('mouseover', (event, d) => {
								d3.select('#tooltip')
								.style('display', 'block')
								.style('left', (event.pageX + 10) + 'px')   
								.style('top', (event.pageY + 10) + 'px')
								.style('font-size', '15px')
								.html(`<li>${vis.importantChar[d.source.index]} referenced ${vis.importantChar[d.target.index]} ${d.source.value} times
								</li><li>${vis.importantChar[d.target.index]} referenced ${vis.importantChar[d.source.index]} ${d.target.value} times
								</li>
									`);}) 
				.on('mouseleave', () => {
					d3.select('#tooltip').style('display', 'none');
				});
	}
}