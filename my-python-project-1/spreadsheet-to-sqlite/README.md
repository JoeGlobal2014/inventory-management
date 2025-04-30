# Spreadsheet to SQLite

This project is designed to scrape data from a spreadsheet and create an SQLite database based on the extracted data and schemas. It utilizes Python's capabilities to read spreadsheets and interact with SQLite databases.

## Project Structure

```
spreadsheet-to-sqlite
├── src
│   ├── main.py               # Entry point of the application
│   ├── spreadsheet_parser.py  # Handles reading and parsing the spreadsheet
│   ├── sqlite_creator.py      # Responsible for creating the SQLite database and tables
│   └── utils
│       └── helpers.py        # Utility functions for logging and data validation
├── requirements.txt           # Lists project dependencies
├── .gitignore                 # Specifies files to ignore in version control
└── README.md                  # Documentation for the project
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd spreadsheet-to-sqlite
   ```

2. **Install the required dependencies:**
   ```
   pip install -r requirements.txt
   ```

3. **Prepare your spreadsheet:**
   Ensure your spreadsheet is formatted correctly with the necessary data and schemas.

4. **Run the application:**
   Execute the main script to start the scraping and database creation process:
   ```
   python src/main.py <path-to-your-spreadsheet>
   ```

## Usage Example

To use the application, provide the path to your spreadsheet as a command-line argument. The application will read the spreadsheet, extract the relevant data and schemas, and create an SQLite database with the appropriate tables.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.