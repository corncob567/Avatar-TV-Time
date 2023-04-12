// GLOBAL VARIABLES
let data;

//-------------------------//

d3.csv("/data/avatar_transcripts.csv")
  .then(_data =>{

    _data.forEach(element => {
      //console.log(element)
    });

    //gets word count of characters across all episodes
    let character_words_map = d3.rollups(_data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.character);
    let character_word_count = Array.from(character_words_map, ([key, count]) => ({ key, count }));
    character_word_count.sort((a,b) => b.count - a.count)

    //gets number of words per episode 
    let characters_words_per_episode_map = d3.rollups(_data, v => d3.sum(v, d => d.dialog.split(" ").length), d => d.season, d => d.episode, d => d.character);
    let characters_words_per_episode = Array.from(characters_words_per_episode_map, ([season, episode]) => ({ season, episode}));
    //([season, [ep, [character, count]]]) => ({ season, ep, val: {character, count}})
    console.log(characters_words_per_episode)

    //gets list of characters who were in each episode
    let character_in_episodes_map = d3.group(_data, d => d.season, d => d.episode, d=>d.character);
    let character_in_episodes = Array.from(character_in_episodes_map, ([season, episodes]) => ({ season, episodes}));
    character_in_episodes.forEach(i => {
      i.episodes = Array.from(i.episodes, ([episodeNum, characters]) => ({ episodeNum, characters}));
      i.episodes.forEach(episode => {
        episode.characters = Array.from(episode.characters, ([name, lines]) => ({ name, lines}));
      });
    });
    console.log(character_in_episodes)

    let character_appear_count = new Barchart({
      parentElement: '#top_characters_barchart',
      containerWidth: 500,
      containerHeight: 500
      }, character_word_count, "key", "Top Characters", "X", "Y");

    })
.catch(error => {
    console.log(error);
});

