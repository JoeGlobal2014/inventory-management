class SpreadsheetParser:
    def __init__(self, file_path):
        self.file_path = file_path

    def parse_spreadsheet(self):
        import pandas as pd
        df = pd.read_excel(self.file_path)
        return df

    def extract_data(self):
        df = self.parse_spreadsheet()
        data = df.to_dict(orient='records')
        schema = {col: str(df[col].dtype) for col in df.columns}
        return data, schema