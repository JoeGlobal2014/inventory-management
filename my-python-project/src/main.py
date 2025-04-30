from flask import Flask, jsonify, request
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)

# Define the database path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "..", "inventory.db")

# Connect to the SQLite database
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Create the tables if they don't exist
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            material_number TEXT NOT NULL,
            location TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            value REAL NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customer_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            order_date TEXT NOT NULL,
            amount REAL NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            failed_attempts INTEGER DEFAULT 0,
            lockout_until TIMESTAMP,
            totp_secret TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            valid BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    ''')
    
    conn.commit()
    conn.close()

# Inventory CRUD
@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inventory")
    items = cursor.fetchall()
    conn.close()
    return jsonify([dict(item) for item in items])

@app.route("/api/inventory", methods=["POST"])
def create_inventory():
    data = request.get_json()
    material_number = data.get("material_number")
    location = data.get("location")
    quantity = data.get("quantity")
    value = data.get("value")

    if not all([material_number, location, quantity is not None, value is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO inventory (material_number, location, quantity, value) VALUES (?, ?, ?, ?)",
        (material_number, location, quantity, value)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": new_id, "message": "Inventory item created"}), 201

@app.route("/api/inventory/<int:id>", methods=["PUT"])
def update_inventory(id):
    data = request.get_json()
    material_number = data.get("material_number")
    location = data.get("location")
    quantity = data.get("quantity")
    value = data.get("value")

    if not all([material_number, location, quantity is not None, value is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE inventory SET material_number = ?, location = ?, quantity = ?, value = ? WHERE id = ?",
        (material_number, location, quantity, value, id)
    )
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Inventory item not found"}), 404
    conn.close()
    return jsonify({"message": "Inventory item updated"})

@app.route("/api/inventory/<int:id>", methods=["DELETE"])
def delete_inventory(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM inventory WHERE id = ?", (id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Inventory item not found"}), 404
    conn.close()
    return jsonify({"message": "Inventory item deleted"})

# Customer Orders CRUD
@app.route("/api/customer_orders", methods=["GET"])
def get_customer_orders():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customer_orders")
    orders = cursor.fetchall()
    conn.close()
    return jsonify([dict(order) for order in orders])

@app.route("/api/customer_orders", methods=["POST"])
def create_customer_order():
    data = request.get_json()
    order_id = data.get("order_id")
    customer_name = data.get("customer_name")
    order_date = data.get("order_date")
    amount = data.get("amount")

    if not all([order_id, customer_name, order_date, amount is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO customer_orders (order_id, customer_name, order_date, amount) VALUES (?, ?, ?, ?)",
        (order_id, customer_name, order_date, amount)
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": new_id, "message": "Customer order created"}), 201

@app.route("/api/customer_orders/<int:id>", methods=["PUT"])
def update_customer_order(id):
    data = request.get_json()
    order_id = data.get("order_id")
    customer_name = data.get("customer_name")
    order_date = data.get("order_date")
    amount = data.get("amount")

    if not all([order_id, customer_name, order_date, amount is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE customer_orders SET order_id = ?, customer_name = ?, order_date = ?, amount = ? WHERE id = ?",
        (order_id, customer_name, order_date, amount, id)
    )
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Customer order not found"}), 404
    conn.close()
    return jsonify({"message": "Customer order updated"})

@app.route("/api/customer_orders/<int:id>", methods=["DELETE"])
def delete_customer_order(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customer_orders WHERE id = ?", (id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Customer order not found"}), 404
    conn.close()
    return jsonify({"message": "Customer order deleted"})

# Users CRUD
@app.route("/api/users", methods=["GET"])
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    conn.close()
    return jsonify([dict(user) for user in users])

@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    failed_attempts = data.get("failed_attempts", 0)
    lockout_until = data.get("lockout_until")
    totp_secret = data.get("totp_secret")

    if not all([username, password]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password, failed_attempts, lockout_until, totp_secret) VALUES (?, ?, ?, ?, ?)",
            (username, password, failed_attempts, lockout_until, totp_secret)
        )
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({"id": new_id, "message": "User created"}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Username already exists"}), 400

@app.route("/api/users/<int:id>", methods=["PUT"])
def update_user(id):
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    failed_attempts = data.get("failed_attempts")
    lockout_until = data.get("lockout_until")
    totp_secret = data.get("totp_secret")

    if not all([username, password]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET username = ?, password = ?, failed_attempts = ?, lockout_until = ?, totp_secret = ? WHERE id = ?",
            (username, password, failed_attempts, lockout_until, totp_secret, id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "User not found"}), 404
        conn.close()
        return jsonify({"message": "User updated"})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Username already exists"}), 400

@app.route("/api/users/<int:id>", methods=["DELETE"])
def delete_user(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "User not found"}), 404
    conn.close()
    return jsonify({"message": "User deleted"})

# Sessions CRUD
@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions")
    sessions = cursor.fetchall()
    conn.close()
    return jsonify([dict(session) for session in sessions])

@app.route("/api/sessions", methods=["POST"])
def create_session():
    data = request.get_json()
    username = data.get("username")
    token = data.get("token")
    expires_at = data.get("expires_at")
    valid = data.get("valid", 1)

    if not all([username, token, expires_at]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO sessions (username, token, expires_at, valid) VALUES (?, ?, ?, ?)",
            (username, token, expires_at, valid)
        )
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({"id": new_id, "message": "Session created"}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Token already exists or username not found"}), 400

@app.route("/api/sessions/<int:id>", methods=["PUT"])
def update_session(id):
    data = request.get_json()
    username = data.get("username")
    token = data.get("token")
    expires_at = data.get("expires_at")
    valid = data.get("valid")

    if not all([username, token, expires_at, valid is not None]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE sessions SET username = ?, token = ?, expires_at = ?, valid = ? WHERE id = ?",
            (username, token, expires_at, valid, id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Session not found"}), 404
        conn.close()
        return jsonify({"message": "Session updated"})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Token already exists or username not found"}), 400

@app.route("/api/sessions/<int:id>", methods=["DELETE"])
def delete_session(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE id = ?", (id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Session not found"}), 404
    conn.close()
    return jsonify({"message": "Session deleted"})

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)