import json
import os
from typing import List, Dict, Any
from convert import Province

class ThaiAddress:
    def __init__(self, data: List[List[Any]], lookup: str, words: str):
        self.data = data
        self.lookup = lookup
        self.words = words

def extract_values(obj: Any) -> Any:
    """
    Recursively extract all values from a given object (dict, list, or primitive value).
    """
    if isinstance(obj, list):
        return [extract_values(item) for item in obj]
    elif isinstance(obj, dict):
        return [extract_values(value) for value in obj.values()]
    return obj

def ensure_output_directory() -> None:
    """
    Ensure that the 'output' directory exists.
    """
    os.makedirs('output', exist_ok=True)

def write_json(data: Any, file_name: str) -> None:
    """
    Writes the data to a JSON file with the given file name in the 'output' directory.
    """
    try:
        with open(f'output/{file_name}.json', 'w', encoding='utf-8') as file:
            json.dump(data, file, ensure_ascii=False, separators=(',', ':'))
        print(f'Export Success: output/{file_name}.json')
    except (IOError, json.JSONDecodeError) as e:
        print(f"Error exporting data to output/{file_name}.json: {e}")
        raise

def export_word(data: List[Province], lookup: str, words: str, file_name: str) -> None:
    """
    Export data, lookup, and words to a JSON file for specific address information.
    """
    print(f'Start Export {file_name} to JSON')

    ensure_output_directory()

    # Create address data structure
    address_data = ThaiAddress(
        data=extract_values(data),
        lookup=lookup,
        words=words
    )

    # Export address data to JSON
    write_json(address_data.__dict__, file_name)

def export_address(data: List[Province], file_name: str = 'db') -> None:
    """
    Export address data to a JSON file.
    """
    print(f'Start Export {file_name} to JSON')

    ensure_output_directory()

    # Extract and prepare data
    extracted_data = extract_values(data)

    # Export data to JSON
    write_json(extracted_data, file_name)
