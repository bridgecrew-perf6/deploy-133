from elasticsearch import Elasticsearch, helpers
import csv
import glob
import json
from tqdm import tqdm
import spacy
from spacy.matcher import Matcher


# Create the elasticsearch client.
es = Elasticsearch(['http://127.0.0.1:9200/'], timeout=180)
es.indices.delete(index='episodes', ignore=[400, 404])
es.indices.create(index = 'episodes')
#因為要用bulk方式insert進去，因此會先把每集資料先放進list
insert = []

with open("all_transcript.json", "r") as tt:
	with open("all_captions.json", "r") as cc:
		all_transcript = json.load(tt)
		all_captions = json.load(cc)
		with open('relevant_ep(v10).json') as recon:
			recon = json.load(recon)

			with open('segmented_keywords.json') as seg_key:
				seg_key = json.load(seg_key)
				for k in seg_key:
					for T in seg_key[k]:
						seg_key[k][T] = [i[0]for i in seg_key[k][T]]

				with open('all_keywords.json') as key_f:
					key_f = json.load(key_f)
					for k in seg_key:
						seg_key[k]['all'] = key_f[k]

					#summarization 的 json file
					with open('abs_7.json') as abs_f:
						abs_f = json.load(abs_f)

						#metadata 的 json file
						with open('metadata_7only.json') as f:
							f = json.load(f)
							
							f_dict = dict()
							for i in f:
								f_dict[i['episode_uri']] = i
							
							for k in recon:
								recon[k] = [f_dict[i] for i in recon[k]][:5]
							

							for row in f:
								
								#確認這筆episode有相對應的逐字稿
								if row['episode_uri'] in all_transcript and row['episode_uri'] in abs_f and row['episode_uri'] in key_f:
									tmp={
										"_index": "episodes",
										"_op_type": "index",
										"_id": row['episode_uri'],
										"_source": {
											"show_uri":row["show_uri"],
											"show_name":row["show_name"],
											"show_description":row["show_description"],
											"publisher":row["publisher"],
											"language":row["language"],
											"episode_uri":row["episode_uri"],	
											"episode_name":row["episode_name"],
											"episode_audio":row['episode_audio'],
											"episode_description":row["episode_description"],
											"poster":row["poster"],
											"duration":row["duration"],	
											"transcript":all_transcript[row['episode_uri']],
											"captions":all_captions[row['episode_uri']],
											"keywords":seg_key[row['episode_uri']],
											"summarization":abs_f[row['episode_uri']],
											"recommendation":recon[row['episode_uri']],									
										}
									}	
									insert.append(tmp)
							print(len(insert))
							
							#insert進去es
							helpers.bulk(es, insert)
