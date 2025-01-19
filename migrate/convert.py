import json
import os
from typing import List, Dict, Any
from database import ThaiDB, load_eng_database
from pythainlp.transliterate import romanize
from pythainlp.tokenize import word_tokenize
from collections import Counter
import unicodedata

class SubDistrict:
    def __init__(self, subdistrict_id: int, subdistrict_thai_name: str, subdistrict_eng_name: str, zip_code: int):
        self.subdistrict_id = subdistrict_id
        self.subdistrict_thai_name = subdistrict_thai_name
        self.subdistrict_eng_name = subdistrict_eng_name
        self.zip_code = zip_code

class District:
    def __init__(self, district_id: int, district_thai_name: str, district_eng_name: str):
        self.district_id = district_id
        self.district_thai_name = district_thai_name
        self.district_eng_name = district_eng_name
        self.subdistricts: List[SubDistrict] = []

class Province:
    def __init__(self, province_id: int, province_thai_name: str, province_eng_name: str):
        self.province_id = province_id
        self.province_thai_name = province_thai_name
        self.province_eng_name = province_eng_name
        self.districts: List[District] = []


eng_set = {}
dict_words = Counter()
words = Counter()
new_dict = {}

def text_thai_to_eng(old: str) -> str:
    result = eng_set.get(old, '')
    if not result:
        result = romanize(old)
    return result

def migration(thai_db: List[ThaiDB]) -> List[Province]:
    print('Start Convent ThaiDB to ThaiAddress Format')
    global eng_set
    eng_set = load_eng_database()

    provinces: Dict[str, Province] = {}

    for db in thai_db:
        province_name = db.province
        province = provinces.get(province_name)
        if not province:
            province = Province(
                province_id=db.province_code,
                province_thai_name=db.province,
                province_eng_name=text_thai_to_eng(db.province)
            )
            provinces[province_name] = province

        district = None
        for d in province.districts:
            if d.district_thai_name == db.amphoe:
                district = d
                break

        sub_district = SubDistrict(
            subdistrict_id=db.district_code,
            subdistrict_thai_name=db.district,
            subdistrict_eng_name=text_thai_to_eng(db.district),
            zip_code=db.zipcode
        )

        if not district:
            district = District(
                district_id=db.amphoe_code,
                district_thai_name=db.amphoe,
                district_eng_name=text_thai_to_eng(db.amphoe)
            )
            province.districts.append(district)

        district.subdistricts.append(sub_district)

    data = sorted(provinces.values(), key=lambda p: (p.province_thai_name, p.districts[0].district_thai_name if p.districts else '', p.districts[0].subdistricts[0].subdistrict_thai_name if p.districts and p.districts[0].subdistricts else ''))

    return data

def add_to_dict(key: str, dict_words: Counter, words: Counter):
    dict_words[key] += 1
    word_list = word_tokenize(key)
    for word in word_list:
        if not word.isspace():
            words[word] += 1

def change_word(text: str, new_words: dict) -> str:
    for ch, replacement  in new_words.items():
        text = text.replace(replacement, ch)
    return text

def is_thai(word):
    for char in word:
        if not ('\u0E00' <= char <= '\u0E7F'):
            return False
    return True

def findIndex(text: str):
    if text in new_dict:
        return new_dict[text]
    return text

def convert(data: List[Province]) -> List[Province]:

    for province in data:
        add_to_dict(province.province_thai_name, dict_words, words)
        add_to_dict(province.province_eng_name, dict_words, words)
        for district in province.districts:
            add_to_dict(district.district_thai_name, dict_words, words)
            add_to_dict(district.district_eng_name, dict_words, words)
            for subdistrict in district.subdistricts:
                add_to_dict(subdistrict.subdistrict_thai_name, dict_words, words)
                add_to_dict(subdistrict.subdistrict_eng_name, dict_words, words)

    new_words = {}
    sorted_words = sorted(words.items(), key=lambda x: x[1], reverse=True)
    max_thai = 0
    max_eng = 0
    for i, (word, _) in enumerate(sorted_words):
        if is_thai(word):
            if max_thai < 52:
                new_words[chr(65 + max_thai) if max_thai < 26 else chr(97 + max_thai - 26)] = word
                max_thai += 1
        else:
            if max_eng < 46:
                new_words[chr(3585 + max_eng)] = word
                max_eng += 1

    lookup = []
    for key, count in dict_words.items():
        if count > 1:
            key = change_word(key, new_words)
            new_dict[key] = len(lookup)
            lookup.append(key)

    new_data = []
    for province in data:
        new_province_th_name = findIndex(change_word(province.province_thai_name, new_words))
        new_province_en_name = findIndex(change_word(province.province_eng_name, new_words))
        new_districts = []
        for district in province.districts:
            new_district_th_name = findIndex(change_word(district.district_thai_name, new_words))
            new_district_en_name = findIndex(change_word(district.district_eng_name, new_words))
            new_subdistricts = []
            for subdistrict in district.subdistricts:
                new_subdistrict_th_name = findIndex(change_word(subdistrict.subdistrict_thai_name, new_words))

                new_subdistrict_en_name = findIndex(change_word(subdistrict.subdistrict_eng_name, new_words))
                new_subdistricts.append({
                    'subdistrict_id': subdistrict.subdistrict_id,
                    'subdistrict_thai_name': new_subdistrict_th_name,
                    'subdistrict_eng_name': new_subdistrict_en_name,
                    'zip_code': subdistrict.zip_code
                })
            new_districts.append({
                'district_id': district.district_id,
                'district_thai_name': new_district_th_name,
                'district_eng_name': new_district_en_name,
                'subdistricts': new_subdistricts
            })
        new_data.append({
            'province_id': province.province_id,
            'province_thai_name': new_province_th_name,
            'province_eng_name': new_province_en_name,
            'districts': new_districts
        })

    lookup_value = '|'.join(lookup)
    words_value = '|'.join(new_words.values())

    return new_data, lookup_value, words_value

def th_convert(data: List[Province]):
    eng_set = {}
    dict_words = Counter()
    words = Counter()
    new_dict = {}

    for province in data:
        add_to_dict(province.province_thai_name, dict_words, words)
        for district in province.districts:
            add_to_dict(district.district_thai_name, dict_words, words)
            for subdistrict in district.subdistricts:
                add_to_dict(subdistrict.subdistrict_thai_name, dict_words, words)

    new_words = {}
    sorted_words = sorted(words.items(), key=lambda x: x[1], reverse=True)
    for i, (word, _) in enumerate(sorted_words):
        if i < 52:
            new_words[chr(65 + i) if i < 26 else chr(97 + i - 26)] = word

    lookup = []
    for key, count in dict_words.items():
        if count > 1:
            key = change_word(key, new_words)
            new_dict[key] = len(lookup)
            lookup.append(key)

    new_data = []
    for province in data:
        new_province_th_name = findIndex(change_word(province.province_thai_name, new_words))
        new_data.append(new_province_th_name)
        for district in province.districts:
            new_district_th_name = findIndex(change_word(district.district_thai_name, new_words))
            new_data.append(new_district_th_name)
            for subdistrict in district.subdistricts:
                new_subdistrict_th_name = findIndex(change_word(subdistrict.subdistrict_thai_name, new_words))
                new_data.append(new_subdistrict_th_name)

    lookup_value = '|'.join(lookup)
    words_value = '|'.join(new_words.values())

    return new_data, lookup_value, words_value

def en_convert(data: List[Province]):
    eng_set = {}
    dict_words = Counter()
    words = Counter()
    new_dict = {}

    for province in data:
        add_to_dict(province.province_eng_name, dict_words, words)
        for district in province.districts:
            add_to_dict(district.district_eng_name, dict_words, words)
            for subdistrict in district.subdistricts:
                add_to_dict(subdistrict.subdistrict_eng_name, dict_words, words)

    new_words = {}
    sorted_words = sorted(words.items(), key=lambda x: x[1], reverse=True)
    for i, (word, _) in enumerate(sorted_words):
        if i < 46:
            new_words[chr(3585 + i)] = word

    lookup = []
    for key, count in dict_words.items():
        if count > 1:
            key = change_word(key, new_words)
            new_dict[key] = len(lookup)
            lookup.append(key)

    new_data = []
    for province in data:
        new_province_en_name = findIndex(change_word(province.province_eng_name, new_words))
        new_data.append(new_province_en_name)
        for district in province.districts:
            new_district_en_name = findIndex(change_word(district.district_eng_name, new_words))
            new_data.append(new_district_en_name)
            for subdistrict in district.subdistricts:
                new_subdistrict_en_name = findIndex(change_word(subdistrict.subdistrict_eng_name, new_words))
                new_data.append(new_subdistrict_en_name)

    lookup_value = '|'.join(lookup)
    words_value = '|'.join(new_words.values())

    return new_data, lookup_value, words_value

def address_convert(data: List[Province]):
    current_id = 0
    new_data = []
    for province in data:
        province_id = current_id
        current_id += 1
        new_districts = []
        for district in province.districts:
            new_subdistricts = []
            district_id = current_id
            current_id += 1
            for subdistrict in district.subdistricts:
                subdistrict_id = current_id
                new_subdistricts.append({
                    # "subdistrict_id": subdistrict.subdistrict_id,
                    'subdistrict_name': subdistrict_id,
                    'zip_code': subdistrict.zip_code
                })
                current_id += 1
            new_districts.append({
                # "district_id": district.district_id,
                'district_name': district_id,
                'subdistricts': new_subdistricts
            })
        new_data.append({
            # "province_id": province.province_id,
            'province_name': province_id,
            'districts': new_districts
        })
    return new_data
