class SQLiteCreator:
    def __init__(self, db_name):
        self.db_name = db_name

    def create_database(self):
        import sqlite3
        conn = sqlite3.connect(self.db_name)
        conn.close()

    def create_table(self, table_name, schema):
        import sqlite3
        conn = sqlite3.connect(self.db_name)
        cursor = conn.cursor()
        
        columns = ', '.join(f"{col_name} {col_type}" for col_name, col_type in schema.items())
        create_table_query = f"CREATE TABLE IF NOT EXISTS {table_name} ({columns});"
        
        cursor.execute(create_table_query)
        conn.commit()
        conn.close()