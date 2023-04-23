class Table {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _character) {
        // Configuration object with defaults
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 400,
            containerHeight: _config.containerHeight || 150,
            margin: _config.margin || {
                top: 20,
                right: 30,
                bottom: 40,
                left: 100
            },
            reverseOrder: _config.reverseOrder || false,
            tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.initVis();
        
    }
    initVis(){
        let vis = this;   
    }

    updateVis(){
        let vis = this;  
        let characters_words_per_episode_map = d3.rollups(vis.data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.season, d => d.episode, d => d.character);
        let characters_words_per_episode = Array.from(characters_words_per_episode_map, ([season, episodes]) => ({ season, episodes}));
        vis.linedata = [];
        let episode_summary = [];
        characters_words_per_episode.forEach(s =>{
            s.episodes = Array.from(s.episodes, ([episodeNum, characters]) => ({ episodeNum, characters}));
            s.episodes.forEach(e => {
                e.characters = Array.from(e.characters, ([character, lines]) => ({ character, lines}));
                e.characters.forEach(c =>{       
                    if (selectedCharacter == "any"){
                        episode_summary.push(c.character + " - " + c.lines + " words spoken")
                        // console.log(c)
                    }
                    else{
                        if (c.character == selectedCharacter){
                            vis.linedata.push({season: s.season, episode: e.episodeNum, details: c.lines + " words spoken"})
                        }
                    }
                })   
                if (selectedCharacter == "any"){
                    // console.log(episode_summary.sort((a,b) => b.count - a.count).join('<br>'))
                    vis.linedata.push({season: s.season, episode: e.episodeNum, details: episode_summary.sort((a,b) => b.count - a.count).join('\n')})
                    episode_summary = [];
                }             
            })
        })        
        this.renderVis();
    }

    renderVis(){
        let vis = this;  
        vis.table = new Tabulator("#episode_table", {
            height: vis.config.containerHeight,
            width: vis.config.containerWidth,
            data: vis.linedata,
            layout:"fitData",
            columns:[ //Define Table Columns
                {title:"Season", field:"season", widthGrow:1},
                {title:"Episode", field:"episode", widthGrow:1},
                {title:"Details", field:"details", widthGrow:3, formatter:"textarea", responsive: 0},
            ],
        });
        //trigger a on alert message when the row is clicked
        vis.table.on("rowClick", function(e, row){ 
            console.log("Clicked row")
            if (selectedCharacter != "any"){
                let clicked_row = row.getData()
                let clicked_season = clicked_row.season
                let clicked_episode = clicked_row.episode
                console.log(clicked_season, clicked_episode)
                let lines_for_episode_map = d3.group(vis.data, d => d.season, d => d.episode, d => d.character);
                let val = Array.from(Array.from(Array.from(Array.from(lines_for_episode_map)[clicked_season-1][1])[clicked_episode-1])[1]);
                let lines_for_character = [];
                val.forEach(d=>{
                    if (d[0] == selectedCharacter){
                        lines_for_character = d[1]
                    }
                })
    
                vis.lineTable = new Tabulator("#character_line_table", {
                    autoResize: false,
                    height: 400,
                    width: 400,
                    data: lines_for_character,
                    layout:"fitData",
                    columns:[ //Define Table Columns
                        {title: selectedCharacter + "'s lines in " + "Season: " +clicked_season + " Episode: " + clicked_episode, field:"dialog", widthGrow:1},
                    ],
                });
                openModalBrowser();    
            }
        })


        //update the BAN (by character)
        if (selectedCharacter != "any"){
            let phraseText = selectedCharacter + "'s key phrase: ";
            switch(selectedCharacter){
                case "Aang":
                    phraseText = phraseText + "I don't know..."
                    break;
                case "Katara":
                    phraseText = phraseText + "The Fire Nation..."
                    break;
                case "Sokka":
                    phraseText = phraseText + "The Fire Nation..."
                    break;
                case "Toph":
                    phraseText = phraseText + "I can feel..."
                    break;
                case "Zuko":
                    phraseText = phraseText + "I want the Avatar..."
                    break;
                
            }
            d3.select("#phrase").selectAll('text').remove()
            d3.select('#phrase')
                .append('text')
                .text(phraseText);
        }

    }
}