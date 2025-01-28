from database import load_thai_database
from convert import migration, th_convert, en_convert, address_convert, geo_convert
from export import export_array, export_word

def main():
    print('Start Migration Database')

    thai_db = load_thai_database()

    data = migration(thai_db)

    th_data, th_lookup, th_words = th_convert(data)
    en_data, en_lookup, en_words = en_convert(data)

    db = address_convert(data)
    geo = geo_convert(data)

    export_array(db, 'db')
    export_array(geo, 'geo')
    export_word(th_data, th_lookup, th_words, 'th_db')
    export_word(en_data, en_lookup, en_words, 'en_db')

if __name__ == '__main__':
    main()
