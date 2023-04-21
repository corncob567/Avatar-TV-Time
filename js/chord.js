class Chord {
    /**
     * Class constructor with basic configuration
     * @param {Object}
     * @param {Array}
    */
	constructor(_config, _data, _importantChar) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 700,
      containerHeight: _config.containerHeight || 700,
      margin: { top: 30, bottom: 10, right: 10, left: 10 }
    }

    this.data = _data;
    this.importantChar = _importantChar;

    // Call a class function
    this.initVis();
	}
	
	initVis()
	{
		let vis = this;
		
		vis.colors = ["#8dd3c7","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"];
		
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
			
		vis.svg
			.datum(vis.chordArc)
			.append('g')
            .attr("transform", `translate(${vis.config.containerWidth/2},${ vis.config.containerHeight/2})`)
            //.attr("class", d => {return "group " + vis.importantChar[d.index];})
			.selectAll('g')
			.data(d => d.groups)
            //console.log(d => d.groups)
			.join('path')
                .attr("class", d => {return "group " + vis.importantChar[d.index];})
                .attr("id", d => {return "#group" + vis.importantChar[d.index];})
                .style("fill", d => vis.colors[d.index])
				.style("stroke", "black")
                .style("opacity", "0.5")
				.attr("d", d3.arc()
				  .innerRadius(300)
				  .outerRadius(320)
				)
            //.append("g")
            .append('text')
                /*.each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
                .attr("x", "5")
                .attr("dy", ".35em")
                .attr("class", "titles")
                .attr("text-anchor", d => {return ((d.angle > Math.PI) ? "end" : null)})
                //.attr("transform", `translate(${vis.config.containerWidth/2},${ vis.config.containerHeight/2})`)
                /*.attr("transform", d => {
                        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
                        + "translate(" + (300 + 55) + ")"
                        + (d.angle > Math.PI ? "rotate(180)" : "");
                })
                .style("fill", "black")
                .text(d => vis.importantChar[d.index]);*/
                .attr("class", "titles")
                .attr("x", 6)
                .attr("dy", d => { return (d.endAngle > 90*Math.PI/180 & d.startAngle < 270*Math.PI/180 ? 25 : -16); })
                .append("textPath")
                    .attr("startOffset","50%")
                    .style("text-anchor","middle")
                    .style("fill", "black")
                    .attr("xlink:href", d => {return "#group"+vis.importantChar[d.index];})
                    .text(d =>{ return vis.importantChar[d.index]; });
				
		vis.svg
		  .datum(vis.chordArc)
		  .append("g")
			.attr("transform", `translate(${vis.config.containerWidth/2},${ vis.config.containerHeight/2})`)
		  .selectAll("path")
		  .data(d => d)
		  .join("path")
			.attr("d", d3.ribbon()
			  .radius(300)
			)
			.style("fill", d => vis.colors[d.source.index % 11])
			.style("stroke", "black")
		  .on('mouseover', (event, d) => { console.log(d);
							d3.select('#tooltip')
							  .style('display', 'block')
							  .style('left', (event.pageX + 10) + 'px')   
							  .style('top', (event.pageY + 10) + 'px')
							  .html(`${vis.importantChar[d.source.index]} referenced ${vis.importantChar[d.target.index]} ${d.source.value} times
								  `);}) 
		   .on('mouseleave', () => {
			  d3.select('#tooltip').style('display', 'none');
			});

		let font_size = 12;
		// Title label
		/*vis.svg.append("g")
			.attr('transform', 'translate(' + (vis.config.containerWidth/2 - vis.config.margin.right) + ', ' + (font_size + 4) + ')')
			.append('text')
			.attr('text-anchor', 'middle')
			.text(vis.config.title)
			// These can be replaced by style if necessary
			//.attr('font-family', 'sans-serif')
			.attr("font-weight", "bold")
			.attr('font-size', font_size + 4)*/
	
	}
	
	getMatrix()
	{
		let vis = this;
        let matrix = Array(vis.importantChar.length).fill(null).map((i) => Array(vis.importantChar.length).fill(0));
		let importantCharRegex = new RegExp(vis.importantChar.join("|"), "gm")
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
			
		vis.svg
			.datum(vis.chordArc)
			.join('g')
				//.attr("transform", "translate(500,500)")
			.selectAll('g')
			.data(d => d.groups)
			.join('g')
			.join('path')
				.style("fill", "grey")
				.style("stroke", "black")
				.attr("d", d3.arc()
				  .innerRadius(180)
				  .outerRadius(230)
				);
				
		vis.svg
		  .datum(vis.chordArc)
		  .join("g")
			.attr("transform", "translate(220,220)")
		  .selectAll("path")
		  .data(d => d)
		  .join("path")
			.attr("d", d3.ribbon()
			  .radius(200)
			)
			.style("fill", "#69b3a2")
			.style("stroke", "black");
		
	}
	
	
	
}