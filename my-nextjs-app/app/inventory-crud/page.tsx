"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface InventoryItem {
  id: number;
  material_number: string;
  location: string;
  quantity: number;
  value: number;
  created_at: string;
}

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [materialNumber, setMaterialNumber] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("");
  const [value, setValue] = useState("");
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/inventory"); // Correct path
      if (Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        setError("Unexpected response format from server.");
        setItems([]);
      }
    } catch (err: any) {
      console.error("Error fetching inventory items:", err);
      console.error(
        "Error details:",
        err.message,
        err.response?.status,
        err.response?.data
      );
      const message =
        err.response?.data?.message ||
        "Failed to fetch inventory items. Is the backend running?";
      setError(message);
      setItems([]);
      if (err.response?.status === 401) {
        setError("Session expired or invalid. Please log in again.");
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/inventory", {
        material_number: materialNumber,
        location: location,
        quantity: parseInt(quantity),
        value: parseFloat(value),
      });
      setMaterialNumber("");
      setLocation("");
      setQuantity("");
      setValue("");
      fetchItems();
    } catch (err: any) {
      console.error("Error adding item:", err);
      setError(err.response?.data?.message || "Failed to add item.");
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await api.delete(`/api/inventory/${id}`);
      fetchItems();
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } catch (err: any) {
      console.error("Error deleting item:", err);
      setError(err.response?.data?.message || "Failed to delete item.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await api.post("/api/inventory/bulk-delete", {
        ids: selectedItems,
      });
      fetchItems();
      setSelectedItems([]);
    } catch (err: any) {
      console.error("Error bulk deleting items:", err);
      setError(err.response?.data?.message || "Failed to bulk delete items.");
    }
  };

  const toggleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Inventory Management</h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
      <button onClick={handleBackToDashboard} style={styles.backButton}>
        Back to Dashboard
      </button>
      {error && <p style={styles.error}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <form onSubmit={handleAddItem} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Material Number:</label>
              <input
                type="text"
                value={materialNumber}
                onChange={(e) => setMaterialNumber(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Location:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Quantity:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Value:</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.addButton}>
              Add Inventory
            </button>
          </form>
          <button
            onClick={handleBulkDelete}
            style={styles.deleteButton}
            disabled={selectedItems.length === 0}
          >
            Delete Selected ({selectedItems.length})
          </button>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input
                    type="checkbox"
                    checked={selectedItems.length === items.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Material Number</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Value</th>
                <th style={styles.th}>Created At</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                    />
                  </td>
                  <td style={styles.td}>{item.id}</td>
                  <td style={styles.td}>{item.material_number}</td>
                  <td style={styles.td}>{item.location}</td>
                  <td style={styles.td}>{item.quantity}</td>
                  <td style={styles.td}>{item.value}</td>
                  <td style={styles.td}>{item.created_at}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      style={styles.deleteItemButton}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: "1200px",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#1a2a44",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    color: "#fff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  logoutButton: {
    padding: "8px 16px",
    backgroundColor: "#ff4444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  backButton: {
    padding: "10px 20px",
    backgroundColor: "#f7c948",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    flex: "1 1 200px",
  },
  label: {
    fontSize: "14px",
  },
  input: {
    padding: "8px",
    fontSize: "14px",
    backgroundColor: "#2a3b5a",
    border: "none",
    borderRadius: "4px",
    color: "#fff",
    outline: "none",
  },
  addButton: {
    padding: "10px 20px",
    backgroundColor: "#f7c948",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    flex: "1 1 100%",
  },
  deleteButton: {
    padding: "10px 20px",
    backgroundColor: "#aaa",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#2a3b5a",
    borderRadius: "4px",
    overflow: "hidden",
  },
  th: {
    padding: "10px",
    backgroundColor: "#3a4b6a",
    textAlign: "left",
    fontSize: "14px",
  },
  td: {
    padding: "10px",
    borderTop: "1px solid #3a4b6a",
    fontSize: "14px",
  },
  tr: {
    borderBottom: "1px solid #3a4b6a",
  },
  deleteItemButton: {
    padding: "5px 10px",
    backgroundColor: "#ff4444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  error: {
    color: "#ff4444",
    textAlign: "center",
    marginBottom: "15px",
    fontSize: "14px",
  },
};

export default InventoryPage;