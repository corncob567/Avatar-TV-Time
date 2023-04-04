import requests
from bs4 import BeautifulSoup
from operator import itemgetter
import urllib
import pandas as pd

BASE_URL = 'https://avatar.fandom.com'
list_page_URL = 'https://avatar.fandom.com/wiki/Avatar_Wiki:Transcripts?so=search'

def getTranscript(url, i):
    with requests.Session() as s:
        page = s.get(url)
        if page.status_code != 200:
            raise ValueError("status needs to be 200")
        
        soup = BeautifulSoup(page.content, 'html.parser')
        tables = soup.find_all('table', {"class":"wikitable"}) 
        dfs = [pd.read_html(table.prettify()) for table in tables]
        dfs = [df[0] for df in dfs]
        
        
        
        episode_transcript_df = dfs[0]
        [episode_transcript_df := pd.concat([episode_transcript_df, df]) for df in dfs[1:]]
        episode_transcript_df.columns = ['character', 'dialog']
        
        
        episode_transcript_df = episode_transcript_df[~episode_transcript_df.character.isna() ].copy()
        episode_transcript_df['episode_num'] = i
        
    return episode_transcript_df

def getTranscriptList(url):
    with requests.Session() as s:
        page = s.get(url)
        if page.status_code != 200:
            raise ValueError("status needs to be 200")
            
        soup = BeautifulSoup(page.content, 'html.parser')
        tables = soup.find_all('table', {"class": "wikitable"}) 
        
        all_links = [list(tb.find_all('a')) for tb in itemgetter(1,2,3,4,6,7)(tables)]
        all_links = [link for sublist in all_links for link in sublist] #flatens all_links
        
        non_commentary_links = [link['href'] for link in all_links if "commentary" not in link.contents]
        
        return non_commentary_links


def main():
    #get episode transcripts
    avatar_dialog = pd.DataFrame()
    transcript_url_lsit = getTranscriptList(list_page_URL)
    episode_num = 1
    for url in transcript_url_lsit:
        print(episode_num)
        page_URL = urllib.parse.urljoin(BASE_URL, url)
        ep = getTranscript(page_URL, episode_num)
        avatar_dialog = pd.concat([avatar_dialog, ep])
        episode_num += 1
        
        
    avatar_dialog.to_csv('./avatar_transcripts.csv', index=False)



if __name__ == "__main__":
    main()