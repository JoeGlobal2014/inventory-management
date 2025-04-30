from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import jwt
import datetime
import bcrypt
from functools import wraps
from zoneinfo import ZoneInfo  # For timezone-aware datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# Secret key for JWT (should be stored securely in production)
app.config['SECRET_KEY'] = 'your-secret-key'

# JWT token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1] if request.headers['Authorization'].startswith('Bearer ') else None
            print(f"Token received: {token}")  # Debug log

        if not token:
            print("No token provided in Authorization header")
            return jsonify({'message': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['username']
            print(f"Token validated successfully for user: {current_user}")
        except Exception as e:
            print(f"Token validation error: {e}")
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    confirm_password = data.get('confirmPassword')

    print("--- Register Request Received ---")
    print("Request Headers:", request.headers)
    print("Request Raw Data:", request.get_data())
    print("Parsed JSON data:", data)

    if not username or not password or not confirm_password:
        return jsonify({'message': 'Username, password, and confirm password are required'}), 400

    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match'}), 400

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        if cursor.fetchone():
            return jsonify({'message': 'Username already exists'}), 400

        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", 
                      (username, hashed_password.decode('utf-8')))
        conn.commit()
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"Error during registration: {e}")
        return jsonify({'message': 'Registration failed due to server error'}), 500
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'Invalid credentials'}), 401

        # Verify the hashed password
        stored_password = user[2]  # Assuming password is the third column (id, username, password, created_at)
        if not bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
            return jsonify({'message': 'Invalid credentials'}), 401

        # Generate JWT token (fix deprecation warning)
        token = jwt.encode({
            'username': username,
            'exp': datetime.datetime.now(ZoneInfo("UTC")) + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        print(f"Generated token: {token}")  # Debug log
        return jsonify({'token': token, 'username': username}), 200
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'message': 'Login failed due to server error'}), 500
    finally:
        conn.close()

# Inventory CRUD Endpoints
@app.route('/api/inventory', methods=['GET'])
@token_required
def get_inventory(current_user):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM inventory')
        items = cursor.fetchall()
        return jsonify([{
            'id': item[0],
            'material_number': item[1],
            'location': item[2],
            'quantity': item[3],
            'value': item[4],
            'created_at': item[5]
        } for item in items]), 200
    except Exception as e:
        print(f"Error fetching inventory: {e}")
        return jsonify({'message': 'Failed to fetch inventory items'}), 500
    finally:
        conn.close()

@app.route('/api/inventory', methods=['POST'])
@token_required
def create_inventory(current_user):
    data = request.get_json()
    material_number = data.get('material_number')
    location = data.get('location')
    quantity = data.get('quantity')
    value = data.get('value')

    if not material_number or quantity is None:
        return jsonify({'message': 'Material number and quantity are required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO inventory (material_number, location, quantity, value)
            VALUES (?, ?, ?, ?)
        ''', (material_number, location, quantity, value))
        conn.commit()
        return jsonify({'message': 'Inventory item added successfully'}), 201
    except Exception as e:
        print(f"Error creating inventory: {e}")
        return jsonify({'message': 'Failed to add inventory item'}), 500
    finally:
        conn.close()

@app.route('/api/inventory/<int:id>', methods=['DELETE'])
@token_required
def delete_inventory(current_user, id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM inventory WHERE id = ?', (id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Inventory item not found'}), 404
        conn.commit()
        return jsonify({'message': 'Inventory item deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting inventory: {e}")
        return jsonify({'message': 'Failed to delete inventory item'}), 500
    finally:
        conn.close()

@app.route('/api/inventory/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_inventory(current_user):
    data = request.get_json()
    ids = data.get('ids')

    if not ids or not isinstance(ids, list):
        return jsonify({'message': 'A list of IDs is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM inventory WHERE id IN ({})'.format(','.join('?' * len(ids))), ids)
        conn.commit()
        return jsonify({'message': 'Selected inventory items deleted successfully'}), 200
    except Exception as e:
        print(f"Error bulk deleting inventory: {e}")
        return jsonify({'message': 'Failed to bulk delete inventory items'}), 500
    finally:
        conn.close()

# Customer Contract Info CRUD Endpoints
@app.route('/api/customer_contract_info', methods=['GET'])
@token_required
def get_customer_contract_info(current_user):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customer_contract_info')
        items = cursor.fetchall()
        return jsonify([{
            'id': item[0],
            'customer_name': item[1],
            'contract_id': item[2],
            'start_date': item[3],
            'end_date': item[4],
            'contract_value': item[5],
            'created_at': item[6]
        } for item in items]), 200
    except Exception as e:
        print(f"Error fetching customer contract info: {e}")
        return jsonify({'message': 'Failed to fetch customer contract info items'}), 500
    finally:
        conn.close()

@app.route('/api/customer_contract_info', methods=['POST'])
@token_required
def create_customer_contract_info(current_user):
    data = request.get_json()
    customer_name = data.get('customer_name')
    contract_id = data.get('contract_id')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    contract_value = data.get('contract_value')

    if not customer_name or not contract_id:
        return jsonify({'message': 'Customer name and contract ID are required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO customer_contract_info (customer_name, contract_id, start_date, end_date, contract_value)
            VALUES (?, ?, ?, ?, ?)
        ''', (customer_name, contract_id, start_date, end_date, contract_value))
        conn.commit()
        return jsonify({'message': 'Customer contract info added successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Contract ID already exists'}), 400
    except Exception as e:
        print(f"Error creating customer contract info: {e}")
        return jsonify({'message': 'Failed to add customer contract info'}), 500
    finally:
        conn.close()

@app.route('/api/customer_contract_info/<int:id>', methods=['DELETE'])
@token_required
def delete_customer_contract_info(current_user, id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM customer_contract_info WHERE id = ?', (id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Customer contract info not found'}), 404
        conn.commit()
        return jsonify({'message': 'Customer contract info deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting customer contract info: {e}")
        return jsonify({'message': 'Failed to delete customer contract info'}), 500
    finally:
        conn.close()

@app.route('/api/customer_contract_info/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_customer_contract_info(current_user):
    data = request.get_json()
    ids = data.get('ids')

    if not ids or not isinstance(ids, list):
        return jsonify({'message': 'A list of IDs is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM customer_contract_info WHERE id IN ({})'.format(','.join('?' * len(ids))), ids)
        conn.commit()
        return jsonify({'message': 'Selected customer contract info deleted successfully'}), 200
    except Exception as e:
        print(f"Error bulk deleting customer contract info: {e}")
        return jsonify({'message': 'Failed to bulk delete customer contract info'}), 500
    finally:
        conn.close()

# Customer Orders CRUD Endpoints
@app.route('/api/customer_orders', methods=['GET'])
@token_required
def get_customer_orders(current_user):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customer_orders')
        items = cursor.fetchall()
        return jsonify([{
            'id': item[0],
            'customer_name': item[1],
            'order_number': item[2],
            'material_number': item[3],
            'quantity': item[4],
            'order_placed_date': item[5],
            'order_requested_date': item[6],
            'unit_selling_price': item[7],
            'total_selling_price': item[8],
            'sales_channel': item[9],
            'created_at': item[10]
        } for item in items]), 200
    except Exception as e:
        print(f"Error fetching customer orders: {e}")
        return jsonify({'message': 'Failed to fetch customer orders'}), 500
    finally:
        conn.close()

@app.route('/api/customer_orders', methods=['POST'])
@token_required
def create_customer_orders(current_user):
    data = request.get_json()
    customer_name = data.get('customer_name')
    order_number = data.get('order_number')
    material_number = data.get('material_number')
    quantity = data.get('quantity')
    order_placed_date = data.get('order_placed_date')
    order_requested_date = data.get('order_requested_date')
    unit_selling_price = data.get('unit_selling_price')
    total_selling_price = data.get('total_selling_price')
    sales_channel = data.get('sales_channel')

    if not customer_name or not order_number:
        return jsonify({'message': 'Customer name and order number are required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO customer_orders (customer_name, order_number, material_number, quantity, 
                                        order_placed_date, order_requested_date, unit_selling_price, 
                                        total_selling_price, sales_channel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (customer_name, order_number, material_number, quantity, order_placed_date, 
              order_requested_date, unit_selling_price, total_selling_price, sales_channel))
        conn.commit()
        return jsonify({'message': 'Customer order added successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Order number already exists'}), 400
    except Exception as e:
        print(f"Error creating customer order: {e}")
        return jsonify({'message': 'Failed to add customer order'}), 500
    finally:
        conn.close()

@app.route('/api/customer_orders/<int:id>', methods=['DELETE'])
@token_required
def delete_customer_orders(current_user, id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM customer_orders WHERE id = ?', (id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Customer order not found'}), 404
        conn.commit()
        return jsonify({'message': 'Customer order deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting customer order: {e}")
        return jsonify({'message': 'Failed to delete customer order'}), 500
    finally:
        conn.close()

@app.route('/api/customer_orders/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_customer_orders(current_user):
    data = request.get_json()
    ids = data.get('ids')

    if not ids or not isinstance(ids, list):
        return jsonify({'message': 'A list of IDs is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM customer_orders WHERE id IN ({})'.format(','.join('?' * len(ids))), ids)
        conn.commit()
        return jsonify({'message': 'Selected customer orders deleted successfully'}), 200
    except Exception as e:
        print(f"Error bulk deleting customer orders: {e}")
        return jsonify({'message': 'Failed to bulk delete customer orders'}), 500
    finally:
        conn.close()

# Material Master Data CRUD Endpoints
@app.route('/api/material_master_data', methods=['GET'])
@token_required
def get_material_master_data(current_user):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM material_master_data')
        items = cursor.fetchall()
        return jsonify([{
            'id': item[0],
            'material_number': item[1],
            'material_description': item[2],
            'material_type': item[3],
            'material_group': item[4],
            'unit_measure': item[5],
            'plant': item[6],
            'storage_location': item[7],
            'created_at': item[8]
        } for item in items]), 200
    except Exception as e:
        print(f"Error fetching material master data: {e}")
        return jsonify({'message': 'Failed to fetch material master data'}), 500
    finally:
        conn.close()

@app.route('/api/material_master_data', methods=['POST'])
@token_required
def create_material_master_data(current_user):
    data = request.get_json()
    material_number = data.get('material_number')
    material_description = data.get('material_description')
    material_type = data.get('material_type')
    material_group = data.get('material_group')
    unit_measure = data.get('unit_measure')
    plant = data.get('plant')
    storage_location = data.get('storage_location')

    if not material_number:
        return jsonify({'message': 'Material number is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO material_master_data (material_number, material_description, material_type, 
                                             material_group, unit_measure, plant, storage_location)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (material_number, material_description, material_type, material_group, 
              unit_measure, plant, storage_location))
        conn.commit()
        return jsonify({'message': 'Material master data added successfully'}), 201
    except Exception as e:
        print(f"Error creating material master data: {e}")
        return jsonify({'message': 'Failed to add material master data'}), 500
    finally:
        conn.close()

@app.route('/api/material_master_data/<int:id>', methods=['DELETE'])
@token_required
def delete_material_master_data(current_user, id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM material_master_data WHERE id = ?', (id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Material master data not found'}), 404
        conn.commit()
        return jsonify({'message': 'Material master data deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting material master data: {e}")
        return jsonify({'message': 'Failed to delete material master data'}), 500
    finally:
        conn.close()

@app.route('/api/material_master_data/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_material_master_data(current_user):
    data = request.get_json()
    ids = data.get('ids')

    if not ids or not isinstance(ids, list):
        return jsonify({'message': 'A list of IDs is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM material_master_data WHERE id IN ({})'.format(','.join('?' * len(ids))), ids)
        conn.commit()
        return jsonify({'message': 'Selected material master data deleted successfully'}), 200
    except Exception as e:
        print(f"Error bulk deleting material master data: {e}")
        return jsonify({'message': 'Failed to bulk delete material master data'}), 500
    finally:
        conn.close()

# Sales Forecast Data CRUD Endpoints
@app.route('/api/sales_forecast_data', methods=['GET'])
@token_required
def get_sales_forecast_data(current_user):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM sales_forecast_data')
        items = cursor.fetchall()
        return jsonify([{
            'id': item[0],
            'customer_name': item[1],
            'material_number': item[2],
            'forecast_period': item[3],
            'forecast_quantity': item[4],
            'forecast_date': item[5],
            'confidence_level': item[6],
            'created_at': item[7]
        } for item in items]), 200
    except Exception as e:
        print(f"Error fetching sales forecast data: {e}")
        return jsonify({'message': 'Failed to fetch sales forecast data'}), 500
    finally:
        conn.close()

@app.route('/api/sales_forecast_data', methods=['POST'])
@token_required
def create_sales_forecast_data(current_user):
    data = request.get_json()
    customer_name = data.get('customer_name')
    material_number = data.get('material_number')
    forecast_period = data.get('forecast_period')
    forecast_quantity = data.get('forecast_quantity')
    forecast_date = data.get('forecast_date')
    confidence_level = data.get('confidence_level')

    if not material_number or forecast_quantity is None:
        return jsonify({'message': 'Material number and forecast quantity are required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO sales_forecast_data (customer_name, material_number, forecast_period, 
                                            forecast_quantity, forecast_date, confidence_level)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (customer_name, material_number, forecast_period, forecast_quantity, 
              forecast_date, confidence_level))
        conn.commit()
        return jsonify({'message': 'Sales forecast data added successfully'}), 201
    except Exception as e:
        print(f"Error creating sales forecast data: {e}")
        return jsonify({'message': 'Failed to add sales forecast data'}), 500
    finally:
        conn.close()

@app.route('/api/sales_forecast_data/<int:id>', methods=['DELETE'])
@token_required
def delete_sales_forecast_data(current_user, id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sales_forecast_data WHERE id = ?', (id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Sales forecast data not found'}), 404
        conn.commit()
        return jsonify({'message': 'Sales forecast data deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting sales forecast data: {e}")
        return jsonify({'message': 'Failed to delete sales forecast data'}), 500
    finally:
        conn.close()

@app.route('/api/sales_forecast_data/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_sales_forecast_data(current_user):
    data = request.get_json()
    ids = data.get('ids')

    if not ids or not isinstance(ids, list):
        return jsonify({'message': 'A list of IDs is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sales_forecast_data WHERE id IN ({})'.format(','.join('?' * len(ids))), ids)
        conn.commit()
        return jsonify({'message': 'Selected sales forecast data deleted successfully'}), 200
    except Exception as e:
        print(f"Error bulk deleting sales forecast data: {e}")
        return jsonify({'message': 'Failed to bulk delete sales forecast data'}), 500
    finally:
        conn.close()

# Vendor Historical Data CRUD Endpoints
@app.route('/api/vendor_historical_data', methods=['GET'])
@token_required
def get_vendor_historical_data(current_user):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM vendor_historical_data')
        items = cursor.fetchall()
        return jsonify([{
            'id': item[0],
            'material_number': item[1],
            'vendor': item[2],
            'purchase_order_number': item[3],
            'po_placed_date': item[4],
            'po_requested_date': item[5],
            'po_receipt_date': item[6],
            'quantity': item[7],
            'created_at': item[8]
        } for item in items]), 200
    except Exception as e:
        print(f"Error fetching vendor historical data: {e}")
        return jsonify({'message': 'Failed to fetch vendor historical data'}), 500
    finally:
        conn.close()

@app.route('/api/vendor_historical_data', methods=['POST'])
@token_required
def create_vendor_historical_data(current_user):
    data = request.get_json()
    material_number = data.get('material_number')
    vendor = data.get('vendor')
    purchase_order_number = data.get('purchase_order_number')
    po_placed_date = data.get('po_placed_date')
    po_requested_date = data.get('po_requested_date')
    po_receipt_date = data.get('po_receipt_date')
    quantity = data.get('quantity')

    if not material_number or not purchase_order_number:
        return jsonify({'message': 'Material number and purchase order number are required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vendor_historical_data (material_number, vendor, purchase_order_number, 
                                               po_placed_date, po_requested_date, po_receipt_date, quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (material_number, vendor, purchase_order_number, po_placed_date, 
              po_requested_date, po_receipt_date, quantity))
        conn.commit()
        return jsonify({'message': 'Vendor historical data added successfully'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'Purchase order number already exists'}), 400
    except Exception as e:
        print(f"Error creating vendor historical data: {e}")
        return jsonify({'message': 'Failed to add vendor historical data'}), 500
    finally:
        conn.close()

@app.route('/api/vendor_historical_data/<int:id>', methods=['DELETE'])
@token_required
def delete_vendor_historical_data(current_user, id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM vendor_historical_data WHERE id = ?', (id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Vendor historical data not found'}), 404
        conn.commit()
        return jsonify({'message': 'Vendor historical data deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting vendor historical data: {e}")
        return jsonify({'message': 'Failed to delete vendor historical data'}), 500
    finally:
        conn.close()

@app.route('/api/vendor_historical_data/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_vendor_historical_data(current_user):
    data = request.get_json()
    ids = data.get('ids')

    if not ids or not isinstance(ids, list):
        return jsonify({'message': 'A list of IDs is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM vendor_historical_data WHERE id IN ({})'.format(','.join('?' * len(ids))), ids)
        conn.commit()
        return jsonify({'message': 'Selected vendor historical data deleted successfully'}), 200
    except Exception as e:
        print(f"Error bulk deleting vendor historical data: {e}")
        return jsonify({'message': 'Failed to bulk delete vendor historical data'}), 500
    finally:
        conn.close()

# Vendor Master Data CRUD Endpoints
@app.route('/api/vendor_master_data', methods=['GET'])
@token_required
def get_vendor_master_data(current_user):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM vendor_master_data')
        items = cursor.fetchall()
        return jsonify([{
            'id': item[0],
            'material_number': item[1],
            'vendor': item[2],
            'vendor_country': item[3],
            'vendor_city': item[4],
            'contracted_lead_time_days': item[5],
            'minimum_order_quantity': item[6],
            'standard_cost': item[7],
            'order_frequency_policy_days': item[8],
            'created_at': item[9]
        } for item in items]), 200
    except Exception as e:
        print(f"Error fetching vendor master data: {e}")
        return jsonify({'message': 'Failed to fetch vendor master data'}), 500
    finally:
        conn.close()

@app.route('/api/vendor_master_data', methods=['POST'])
@token_required
def create_vendor_master_data(current_user):
    data = request.get_json()
    material_number = data.get('material_number')
    vendor = data.get('vendor')
    vendor_country = data.get('vendor_country')
    vendor_city = data.get('vendor_city')
    contracted_lead_time_days = data.get('contracted_lead_time_days')
    minimum_order_quantity = data.get('minimum_order_quantity')
    standard_cost = data.get('standard_cost')
    order_frequency_policy_days = data.get('order_frequency_policy_days')

    if not material_number:
        return jsonify({'message': 'Material number is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vendor_master_data (material_number, vendor, vendor_country, vendor_city, 
                                           contracted_lead_time_days, minimum_order_quantity, 
                                           standard_cost, order_frequency_policy_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (material_number, vendor, vendor_country, vendor_city, 
              contracted_lead_time_days, minimum_order_quantity, 
              standard_cost, order_frequency_policy_days))
        conn.commit()
        return jsonify({'message': 'Vendor master data added successfully'}), 201
    except Exception as e:
        print(f"Error creating vendor master data: {e}")
        return jsonify({'message': 'Failed to add vendor master data'}), 500
    finally:
        conn.close()

@app.route('/api/vendor_master_data/<int:id>', methods=['DELETE'])
@token_required
def delete_vendor_master_data(current_user, id):
    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM vendor_master_data WHERE id = ?', (id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Vendor master data not found'}), 404
        conn.commit()
        return jsonify({'message': 'Vendor master data deleted successfully'}), 200
    except Exception as e:
        print(f"Error deleting vendor master data: {e}")
        return jsonify({'message': 'Failed to delete vendor master data'}), 500
    finally:
        conn.close()

@app.route('/api/vendor_master_data/bulk-delete', methods=['POST'])
@token_required
def bulk_delete_vendor_master_data(current_user):
    data = request.get_json()
    ids = data.get('ids')

    if not ids or not isinstance(ids, list):
        return jsonify({'message': 'A list of IDs is required'}), 400

    try:
        conn = sqlite3.connect('inventory.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM vendor_master_data WHERE id IN ({})'.format(','.join('?' * len(ids))), ids)
        conn.commit()
        return jsonify({'message': 'Selected vendor master data deleted successfully'}), 200
    except Exception as e:
        print(f"Error bulk deleting vendor master data: {e}")
        return jsonify({'message': 'Failed to bulk delete vendor master data'}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)