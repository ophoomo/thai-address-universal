from database import load_thai_database
from convert import migration, convert, export_json

def main():
    print('Start Migration Database')

    thai_db = load_thai_database()

    data = migration(thai_db)

    new_data, lookup, words = convert(data)

    export_json(new_data, lookup, words)

if __name__ == '__main__':
    main()
