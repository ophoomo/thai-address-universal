import re
import json
import requests
import os
from bs4 import BeautifulSoup

class ThaiDB:
    def __init__(self, district, amphoe, province, zipcode, district_code, amphoe_code, province_code):
        self.district = district
        self.amphoe = amphoe
        self.province = province
        self.zipcode = zipcode
        self.district_code = district_code
        self.amphoe_code = amphoe_code
        self.province_code = province_code

def load_thai_database():
    print('Reading raw-th.xlsx')

    try:
        with open('./database/raw_database.json', 'r', encoding='utf-8') as file:
            thai_db = json.load(file)

        print(f"Reading raw-th.xlsx Success have data [{len(thai_db)}] rows")
        thai_db_objects = [ThaiDB(**data) for data in thai_db]
        return thai_db_objects
    except Exception as e:
        logger.error(f"Error: {e}")
        return []

def load_eng_database():
    print('Start Scraping English Address')
    data = {}

    file_path = './database/eng_db.json'

    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print('Data loaded from file.')
        return data

    url = 'https://asean.dla.go.th/public/glossary.do?type=12&cmd=list2&lang=th&random=1728466003379'

    response = requests.get(url)

    if response.status_code != 200:
        print(f"Failed to retrieve data from web. Status code: {response.status_code}")
        return data

    soup = BeautifulSoup(response.content, 'html.parser')

    h4_tags = soup.find_all('h4', class_='blue m_top-20')
    for i, h4 in enumerate(h4_tags):
        if i == 0:
            continue

        text = h4.text.split('-')
        if len(text) > 1:
            text[0] = text[0].replace('จังหวัด', '').strip()
            data[text[0]] = text[1].strip()

    ul_tags = soup.find_all('ul', class_='directory')
    for ul in ul_tags:
        text = list(ul.stripped_strings)

        text[0] = re.sub(r'(ตำบล|จังหวัด|อำเภอ|เขต|\n)', '', text[0])
        text[1] = re.sub(r'(Khet|Amphoe|Tambon|\n)', '', text[1])

        if '\t' in text[0]:
            text[0] = re.sub(r'\s+', ' ', text[0]).strip()
            text = text[0].split(' ', 1)

        text[1] = ' '.join(text[1].split())
        data[text[0]] = text[1]


    data['เกาะเสม็ด'] = 'Koh Samet'
    data['ตาอ็อง'] = 'Ta Ong'

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    print('Data has been saved to ', file_path)
    return data
