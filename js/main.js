// GLOBAL VARIABLES
let data;

//-------------------------//

d3.csv("/data/avatar_transcripts.csv")
  .then(_data =>{

    _data.forEach(element => {
      //console.log(element)
    });

    //gets word count of characters across all episodes
    let character_word_count_map = d3.rollups(_data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.character);
    let character_word_count = Array.from(character_word_count_map, ([key, count]) => ({ key, count }));
    character_word_count.sort((a,b) => b.count - a.count)
    console.log(character_word_count)

    //gets number of episodes each character has been in    
    let characters_episodes_map = d3.rollups(_data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.season, d => d.episode);
    console.log(characters_episodes_map)
    //d3.rollup(athletes, v => v.length, d => d.nation, d => d.sport)
    //let characters_episodes = Array.from(characters_episodes, ([key, count]) => ({ key, count }));
    //character_word_count.sort((a,b) => b.count - a.count)
    //console.log(character_word_count)




    let character_word_count_chart = new Barchart({
      parentElement: '#top_characters_barchart',
      containerWidth: 500,
      containerHeight: 500
      }, character_word_count, "key", "Top Characters", "X", "Y");

    })
.catch(error => {
    console.log(error);
});

