from flask import Flask,render_template, Response, redirect, request
import requests
import sys
import urllib
from urllib.parse import urlparse
import base64
import json
# Tornado web server
from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from bing_image_downloader.downloader import download, get_all_link
from keybert import KeyBERT
import spacy
from spacy.matcher import Matcher
import pke
#Debug logger
import logging
import os
root = logging.getLogger()
root.setLevel(logging.DEBUG)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter( '%(asctime)s - %(name)s - %(levelname)s - %(message)s' )
ch.setFormatter(formatter)
root.addHandler(ch)


app = Flask(__name__)
model = KeyBERT(model=os.path.join(os.path.dirname(os.path.abspath(__file__)),'models','all-MiniLM-L6-v2'))
nlp = spacy.load('en_core_web_trf')
patterns = [
	[{"DEP": "compound","OP": "*"}, {"POS": "NOUN"}],
	[{"DEP": "compound","OP": "*"}, {"POS": "PROPN"}],

	]
matcher = Matcher(nlp.vocab)
matcher.add("NOUN", [patterns[0]])
matcher.add("PROPN", [patterns[1]])
episodes_cache=dict()
caption_cache=dict()
database_url='http://127.0.0.1:9200/'

@app.route('/')
def home():
	return render_template('index_copy_V3.html')

@app.route('/episode/<string:episodeID>/caption/<int:num>')
def episode_caption(episodeID,num):
	try:
		captions = caption_cache[episodeID]
	except:
		captions = requests.get(database_url+'episodes/_doc/'+episodeID)
		captions = captions.json()
		captions = captions["_source"]
		captions = captions["captions"]
		caption_cache.update({episodeID:captions})


	tmp = dict()
	for i in captions:
		if(float(i[0])/60>=num and float(i[0])/60<num+1):
			tmp.update({i[0]:i[1]})

	return tmp

@app.route('/episode/<string:episodeID>')
def episode(episodeID):
	try:
		outcome = episodes_cache[episodeID]
	except:
		outcome = requests.get(database_url+'episodes/_doc/'+episodeID)
		outcome = outcome.json()
		outcome = outcome["_source"]
		episodes_cache.update({episodeID:outcome})

#	captions = requests.get(database_url_captions+'captions/_doc/'+episodeID)
#	captions = captions.json()
#	captions = captions["_source"]

	if outcome["poster"]=="null":
		outcome["poster"]=""
		
	message = { "poster":outcome["poster"],
				"episode_audio":outcome["episode_audio"],
				"episode_name":outcome["episode_name"],
				"publisher":outcome["publisher"],
				"episode_description":outcome["episode_description"],
				"recommendation":outcome["recommendation"],
#				"captions":captions["captions"]
			}
	return render_template('demo3player.html', message=message)

def get_transcript(episodeID,time):
	try:
	        captions = caption_cache[episodeID]
	except:
	        captions = requests.get(database_url+'episodes/_doc/'+episodeID)
	        captions = captions.json()
	        captions = captions["_source"]
	        captions = captions["captions"]
	        caption_cache.update({episodeID:captions})
	interval=20 #可調整

	end_time = time+interval
	text=""
	for i in range(len(captions)-1):
		if(float(captions[i][0])<=time and float(captions[i+1][0])>time):
			current_position=i
		if(float(captions[i][0])<=end_time and float(captions[i+1][0])>end_time):
			end_position=i
			break
	if time>=float(captions[-1][0]): #last segment
		text=captions[-1][1]
	elif time<float(captions[0][0]): #first segment
		if end_time<float(captions[0][0]):
			text=captions[0][1]+" "+captions[1][1]
		elif end_time>=float(captions[-1][0]):
			for i in captions:
				text+=i[1]
				text+=" "
		else:
			for i in range(0,end_position+1):
				text+=captions[i][1]
				text+=" "
				
	else: #body segment
		if end_time>=float(captions[-1][0]):
			end_position=len(captions)-1
		for i in range(current_position,end_position+1):
			text+=captions[i][1]
			text+=" "

	print(text)
	return text

@app.route('/recommend_image/<string:episodeID>/<string:time>/')
def recommend_image(episodeID,time):
	time = float(time)
	result=[]
	sum_length=0
	text=get_transcript(episodeID,time)
	keywords=[]
	doc = nlp(text)
	keywords = keywords+ list(set([(ee.text,0) for ee in doc.ents if ee.label_ in ['PERSON','ORG','GPE','EVENT','FAC','LOC','NORP','PRODUCT','WORK_OF_ART']]))
	print([(i.text,i.label_) for i in doc.ents])
	keywords = keywords + model.extract_keywords(text, keyphrase_ngram_range=(1, 3), top_n=4)
	print(keywords)

	links=[]
	for i in range(len(keywords)):
		tmp=[]
		print(keywords[i][0],keywords[i][1])
		if i<len(keywords)-3:
			sum_length+=len(keywords[i][0])
		query_string = keywords[i][0]
		tmp.append(keywords[i][0])
		# tmp.append(paths[0][i[0]])
		if i<4:
			tmp.append(get_all_link(query_string, limit=4,  output_dir='dataset', adult_filter_off=False, force_replace=False, timeout=60, verbose=False))  #adult可改
		else:
			tmp.append(["","","",""])
#		print(tmp)
		links.append(tmp)
	result.append(links) #current keywords

	text2=get_transcript(episodeID,time+20)
	keywords2=[]
	doc2 = nlp(text2)
	keywords2 = keywords2 + model.extract_keywords(text2, keyphrase_ngram_range=(1, 4), top_n=1)
	keywords2 = keywords2+ list(set([(ee.text,0) for ee in doc2.ents if ee.label_ in ['PERSON','ORG','GPE','EVENT','FAC','LOC','NORP','PRODUCT','WORK_OF_ART']]))
	deduplicate_kw=[]
	for i in keywords2:
		if i[0] not in [t[0] for t in keywords]:
			sum_length+=len(i[0])
			deduplicate_kw.append(i)
	print(deduplicate_kw)
	result.append(deduplicate_kw) #upcoming keywords
	result.append(sum_length) #total length of keywords
	return {"result":result}

#launch a Tornado server with HTTPServer.
if __name__ == "__main__":
	port = 5000
	http_server = HTTPServer(WSGIContainer(app))
	logging.debug("\n\n\n!!!注意:若圖片效果異常，請修改bing downloader的header參數!!!\n\n\nStarted Server, Kindly visit http://localhost:" + str(port))
	http_server.listen(port)
	IOLoop.instance().start()
	app.run(debug=True)
