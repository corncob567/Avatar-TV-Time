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
            containerWidth: _config.containerWidth || 250,
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
        characters_words_per_episode.forEach(s =>{
            s.episodes = Array.from(s.episodes, ([episodeNum, characters]) => ({ episodeNum, characters}));
            s.episodes.forEach(e => {
                e.characters = Array.from(e.characters, ([character, lines]) => ({ character, lines}));
                e.characters.forEach(c =>{
                    if (c.character == selectedCharacter){
                        vis.linedata.push({season: s.season, episode: e.episodeNum, lines: c.lines})
                    }
                })                
            })
        })
        //console.log(vis.linedata)
        
        this.renderVis();
    }

    renderVis(){
        let vis = this;  
        vis.table = new Tabulator("#episode_table", {
            autoResize: false,
            height: vis.config.containerHeight,
            width: vis.config.containerWidth,
            data: vis.linedata,
            layout:"fitData",
            rowClickPopup:"Im a Popup",
            columns:[ //Define Table Columns
                {title:"Season", field:"season", widthGrow:1},
                {title:"Episode", field:"episode", widthGrow:1},
                {title:"Word Count", field:"lines", widthGrow:3},
            ],
       });
       console.log(vis.config.containerWidth)
        //trigger a on alert message when the row is clicked
        vis.table.on("rowClick", function(e, row){ 
            console.log("Clicked row")
            console.log(row.getData())
            openModalBrowser(row.getData());   
            //alert("Row " + row.getData().exoplanet + " Clicked!!!!");
        })
    }
}