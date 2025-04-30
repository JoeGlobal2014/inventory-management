import pandas as pd
from spreadsheet_parser import SpreadsheetParser
from sqlite_creator import SQLiteCreator

def main():
    # Initialize the spreadsheet parser
    parser = SpreadsheetParser()
    
    # Parse the spreadsheet and extract data
    data, schemas = parser.parse_spreadsheet('path/to/spreadsheet.xlsx')
    
    # Initialize the SQLite creator
    creator = SQLiteCreator()
    
    # Create the SQLite database
    creator.create_database('database_name.db')
    
    # Create tables based on the extracted schemas
    for schema in schemas:
        creator.create_table(schema)
    
    # Insert the extracted data into the database
    for table_name, records in data.items():
        creator.insert_data(table_name, records)

if __name__ == "__main__":
    main()