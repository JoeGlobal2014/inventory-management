def log_message(message):
    print(f"[LOG] {message}")

def validate_data(data, schema):
    for key in schema:
        if key not in data:
            log_message(f"Missing key: {key}")
            return False
        if not isinstance(data[key], schema[key]):
            log_message(f"Invalid type for key: {key}. Expected {schema[key]}, got {type(data[key])}.")
            return False
    return True