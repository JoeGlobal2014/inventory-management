import sqlite3
from faker import Faker
import random
from datetime import datetime, timedelta
import bcrypt

# Initialize Faker for generating sample data
fake = Faker()

# Connect to the database
conn = sqlite3.connect('inventory.db')
cursor = conn.cursor()

print("Creating tables...")

# Users table (for registration and login)
cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("Users table checked/created.")

# Inventory table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_number TEXT NOT NULL,
        location TEXT,
        quantity INTEGER NOT NULL,
        value REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("Inventory table checked/created.")

# Customer Orders table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS customer_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        order_number TEXT UNIQUE,
        material_number TEXT,
        quantity INTEGER,
        order_placed_date TEXT,
        order_requested_date TEXT,
        unit_selling_price REAL,
        total_selling_price REAL,
        sales_channel TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("Customer Orders table checked/created.")

# Material Master Data table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS material_master_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_number TEXT NOT NULL,
        material_description TEXT,
        material_type TEXT,
        material_group TEXT,
        unit_measure TEXT,
        plant TEXT,
        storage_location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("Material Master Data table checked/created.")

# Sales Forecast Data table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS sales_forecast_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        material_number TEXT NOT NULL,
        forecast_period TEXT,
        forecast_quantity INTEGER NOT NULL,
        forecast_date TEXT,
        confidence_level REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("Sales Forecast Data table checked/created.")

# Vendor Historical Data table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS vendor_historical_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_number TEXT NOT NULL,
        vendor TEXT,
        purchase_order_number TEXT UNIQUE,
        po_placed_date TEXT,
        po_requested_date TEXT,
        po_receipt_date TEXT,
        quantity INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("Vendor Historical Data table checked/created.")

# Vendor Master Data table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS vendor_master_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material_number TEXT NOT NULL,
        vendor TEXT,
        vendor_country TEXT,
        vendor_city TEXT,
        contracted_lead_time_days INTEGER,
        minimum_order_quantity INTEGER,
        standard_cost REAL,
        order_frequency_policy_days INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("Vendor Master Data table checked/created.")

# Customer Contract Info table
cursor.execute('''
    CREATE TABLE IF NOT EXISTS customer_contract_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        contract_id TEXT UNIQUE,
        start_date TEXT,
        end_date TEXT,
        contract_value REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
print("Customer Contract Info table checked/created.")

# Commit table creation
conn.commit()

# Function to generate a random date within the past 2 years
def random_date(start_date, end_date):
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return (start_date + timedelta(days=random_days)).strftime("%Y-%m-%d")

# Generate sample data
print("Generating sample data...")

# Common data for material numbers and vendors to reuse across tables
material_numbers = [f"MAT-{i:03d}" for i in range(1, 51)]  # MAT-001 to MAT-050
vendors = [fake.company() for _ in range(20)]
customers = [fake.company() for _ in range(20)]
locations = [fake.city() for _ in range(10)]

# 1. Users table (5 sample users for login)
sample_users = [
    ("user1", "password1"),
    ("user2", "password2"),
    ("user3", "password3"),
    ("user4", "password4"),
    ("user5", "password5"),
]
for username, password in sample_users:
    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, password, created_at)
        VALUES (?, ?, ?)
    ''', (
        username,
        hashed_password.decode('utf-8'),
        random_date(datetime.now() - timedelta(days=730), datetime.now())
    ))
print("Inserted 5 sample entries into users table.")

# 2. Inventory table (30 entries)
for i in range(30):
    cursor.execute('''
        INSERT OR IGNORE INTO inventory (material_number, location, quantity, value, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        random.choice(material_numbers),
        random.choice(locations),
        random.randint(10, 1000),
        round(random.uniform(10.0, 500.0), 2),
        random_date(datetime.now() - timedelta(days=730), datetime.now())
    ))
print("Inserted 30 sample entries into inventory table.")

# 3. Customer Orders table (30 entries)
for i in range(30):
    order_number = f"ORD-{i:04d}"
    quantity = random.randint(5, 500)
    unit_price = round(random.uniform(5.0, 100.0), 2)
    cursor.execute('''
        INSERT OR IGNORE INTO customer_orders (
            customer_name, order_number, material_number, quantity, order_placed_date, 
            order_requested_date, unit_selling_price, total_selling_price, sales_channel, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        random.choice(customers),
        order_number,
        random.choice(material_numbers),
        quantity,
        random_date(datetime.now() - timedelta(days=365), datetime.now() - timedelta(days=30)),
        random_date(datetime.now() - timedelta(days=29), datetime.now() + timedelta(days=30)),
        unit_price,
        round(quantity * unit_price, 2),
        random.choice(["Online", "Retail", "Distributor"]),
        random_date(datetime.now() - timedelta(days=730), datetime.now())
    ))
print("Inserted 30 sample entries into customer_orders table.")

# 4. Material Master Data table (30 entries)
for i in range(30):
    cursor.execute('''
        INSERT OR IGNORE INTO material_master_data (
            material_number, material_description, material_type, material_group, 
            unit_measure, plant, storage_location, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        random.choice(material_numbers),
        fake.word() + " " + fake.word(),
        random.choice(["RAW", "FINISHED", "SEMI-FINISHED"]),
        fake.word().upper(),
        random.choice(["EA", "KG", "L", "M"]),
        fake.city(),
        random.choice(locations),
        random_date(datetime.now() - timedelta(days=730), datetime.now())
    ))
print("Inserted 30 sample entries into material_master_data table.")

# 5. Sales Forecast Data table (30 entries)
for i in range(30):
    cursor.execute('''
        INSERT OR IGNORE INTO sales_forecast_data (
            customer_name, material_number, forecast_period, forecast_quantity, 
            forecast_date, confidence_level, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        random.choice(customers),
        random.choice(material_numbers),
        f"Q{random.randint(1, 4)}-{random.randint(2023, 2025)}",
        random.randint(100, 10000),
        random_date(datetime.now(), datetime.now() + timedelta(days=365)),
        round(random.uniform(0.5, 1.0), 2),
        random_date(datetime.now() - timedelta(days=730), datetime.now())
    ))
print("Inserted 30 sample entries into sales_forecast_data table.")

# 6. Vendor Historical Data table (30 entries)
for i in range(30):
    po_number = f"PO-{i:04d}"
    cursor.execute('''
        INSERT OR IGNORE INTO vendor_historical_data (
            material_number, vendor, purchase_order_number, po_placed_date, 
            po_requested_date, po_receipt_date, quantity, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        random.choice(material_numbers),
        random.choice(vendors),
        po_number,
        random_date(datetime.now() - timedelta(days=365), datetime.now() - timedelta(days=30)),
        random_date(datetime.now() - timedelta(days=29), datetime.now()),
        random_date(datetime.now(), datetime.now() + timedelta(days=30)),
        random.randint(10, 1000),
        random_date(datetime.now() - timedelta(days=730), datetime.now())
    ))
print("Inserted 30 sample entries into vendor_historical_data table.")

# 7. Vendor Master Data table (30 entries)
for i in range(30):
    cursor.execute('''
        INSERT OR IGNORE INTO vendor_master_data (
            material_number, vendor, vendor_country, vendor_city, 
            contracted_lead_time_days, minimum_order_quantity, 
            standard_cost, order_frequency_policy_days, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        random.choice(material_numbers),
        random.choice(vendors),
        fake.country(),
        fake.city(),
        random.randint(5, 60),
        random.randint(10, 500),
        round(random.uniform(5.0, 200.0), 2),
        random.randint(7, 90),
        random_date(datetime.now() - timedelta(days=730), datetime.now())
    ))
print("Inserted 30 sample entries into vendor_master_data table.")

# 8. Customer Contract Info table (30 entries)
for i in range(30):
    contract_id = f"CON-{i:04d}"
    cursor.execute('''
        INSERT OR IGNORE INTO customer_contract_info (
            customer_name, contract_id, start_date, end_date, 
            contract_value, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        random.choice(customers),
        contract_id,
        random_date(datetime.now() - timedelta(days=365), datetime.now()),
        random_date(datetime.now(), datetime.now() + timedelta(days=365)),
        round(random.uniform(1000.0, 100000.0), 2),
        random_date(datetime.now() - timedelta(days=730), datetime.now())
    ))
print("Inserted 30 sample entries into customer_contract_info table.")

# Commit the sample data
conn.commit()

# Verify the number of entries in each table
tables = [
    "users", "inventory", "customer_orders", "material_master_data", "sales_forecast_data",
    "vendor_historical_data", "vendor_master_data", "customer_contract_info"
]
for table in tables:
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    print(f"Total entries in {table}: {count}")

# Close the connection
conn.close()
print("Database initialization script finished.")