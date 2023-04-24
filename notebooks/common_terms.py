import pandas as pd
import nltk
from collections import Counter
import string
from pathlib import Path


df = pd.read_csv(Path('./data/avatar_transcripts.csv'))

aang_df = df[df.character == "Aang"]
katara_df = df[df.character == "Katara"]
sokka_df = df[df.character == "Sokka"]
toph_df = df[df.character == "Toph"]
zuko_df = df[df.character == "Zuko"]
Azula_df= df[df.character == "Azula"]
Iroh_df = df[df.character == "Iroh"]
Ozai_df = df[df.character == "Ozai"]
ty_lee_df = df[df.character == "Ty Lee"]
suki_df = df[df.character == "Suki"]
jet_df = df[df.character == "Jet"]
Mai_df = df[df.character == "Mai"]
# print(sokka_df)

phrase_counter = Counter()


def untokenize(ngram):
    tokens = list(ngram)
    return "".join([" "+i if not i.startswith("'") and \
                             i not in string.punctuation and \
                             i != "n't"
                          else i for i in tokens]).strip()
    
def extract_phrases(text, phrase_counter, length):
    for sent in nltk.sent_tokenize(text):
        words = nltk.word_tokenize(sent)
        for phrase in nltk.ngrams(words, length):
             if all(word not in string.punctuation for word in phrase):
                phrase_counter[untokenize(phrase)] += 1


for df in [aang_df, katara_df, sokka_df, toph_df, zuko_df, Azula_df, Iroh_df, Ozai_df, ty_lee_df,suki_df,jet_df,Mai_df]:
    phrase_counter = Counter()
    print(df.character.unique())
    for index, line in df.iterrows():
        for i in range(3,10):
            extract_phrases(line['dialog'], phrase_counter, i)

    print(phrase_counter.most_common(25))