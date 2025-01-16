from database import load_thai_database
from convert import migration, th_convert, en_convert, phoom
from export import export_json, export_json2

def main():
    print('Start Migration Database')

    thai_db = load_thai_database()

    data = migration(thai_db)

    th_data, th_lookup, th_words = th_convert(data)
    en_data, en_lookup, en_words = en_convert(data)

    db = phoom(data)

    export_json2(db)
    export_json(th_data, th_lookup, th_words, 'th_db')
    export_json(en_data, en_lookup, en_words, 'eng_db')

if __name__ == '__main__':
    main()
