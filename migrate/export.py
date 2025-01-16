import json
import os
from convert import Province
from typing import List, Dict, Any

class ThaiAddress:
    def __init__(self, data: List[List[Any]], lookup: str, words: str):
        self.data = data
        self.lookup = lookup
        self.words = words

def extract_values(obj: Any) -> Any:
    if isinstance(obj, list):
        return [extract_values(item) for item in obj]

    elif isinstance(obj, dict):
        return [extract_values(value) for value in obj.values()]

    return obj

def export_json(data: List[Province], lookup: str, words: str, file_name: str) -> None:
    print(f'Start Export {file_name} to JSON')

    os.makedirs('output', exist_ok=True)

    address_data = ThaiAddress(
        data=extract_values(data),
        lookup=lookup,
        words=words
    )

    try:
        with open(f'output/{file_name}.json', 'w', encoding='utf-8') as file:
            json.dump(address_data.__dict__, file, ensure_ascii=False, separators=(',', ':'))
        print(f'Export Success output/{file_name}.json')
    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        raise

def export_json2(data: List[Province]) -> None:
    file_name = 'db'
    print(f'Start Export {file_name} to JSON')

    os.makedirs('output', exist_ok=True)

    address_data = extract_values(data)

    try:
        with open(f'output/{file_name}.json', 'w', encoding='utf-8') as file:
            json.dump(address_data, file, ensure_ascii=False, separators=(',', ':'))
        print(f'Export Success output/{file_name}.json')
    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        raise
