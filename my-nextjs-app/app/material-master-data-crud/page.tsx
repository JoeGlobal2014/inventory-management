"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface MaterialMasterData {
  id: number;
  material_number: string;
  material_description: string;
  material_type: string;
  material_group: string;
  unit_measure: string;
  plant: string;
  storage_location: string;
  created_at: string;
}

const MaterialMasterDataPage: React.FC = () => {
  const [items, setItems] = useState<MaterialMasterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [materialNumber, setMaterialNumber] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [materialGroup, setMaterialGroup] = useState("");
  const [unitMeasure, setUnitMeasure] = useState("");
  const [plant, setPlant] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/material_master_data"); // Correct path
      if (Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        setError("Unexpected response format from server.");
        setItems([]);
      }
    } catch (err: any) {
      console.error("Error fetching material master data:", err);
      console.error(
        "Error details:",
        err.message,
        err.response?.status,
        err.response?.data
      );
      const message =
        err.response?.data?.message ||
        "Failed to fetch material master data. Is the backend running?";
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
      await api.post("/api/material_master_data", {
        material_number: materialNumber,
        material_description: materialDescription,
        material_type: materialType,
        material_group: materialGroup,
        unit_measure: unitMeasure,
        plant: plant,
        storage_location: storageLocation,
      });
      setMaterialNumber("");
      setMaterialDescription("");
      setMaterialType("");
      setMaterialGroup("");
      setUnitMeasure("");
      setPlant("");
      setStorageLocation("");
      fetchRecords();
    } catch (err: any) {
      console.error("Error adding item:", err);
      setError(err.response?.data?.message || "Failed to add item.");
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await api.delete(`/api/material_master_data/${id}`);
      fetchRecords();
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } catch (err: any) {
      console.error("Error deleting item:", err);
      setError(err.response?.data?.message || "Failed to delete item.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      await api.post("/api/material_master_data/bulk-delete", {
        ids: selectedItems,
      });
      fetchRecords();
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
        <h1 style={styles.heading}>Material Master Data Management</h1>
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
              <label style={styles.label}>Material Description:</label>
              <input
                type="text"
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Material Type:</label>
              <input
                type="text"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Material Group:</label>
              <input
                type="text"
                value={materialGroup}
                onChange={(e) => setMaterialGroup(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Unit Measure:</label>
              <input
                type="text"
                value={unitMeasure}
                onChange={(e) => setUnitMeasure(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Plant:</label>
              <input
                type="text"
                value={plant}
                onChange={(e) => setPlant(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Storage Location:</label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                style={styles.input}
              />
            </div>
            <button type="submit" style={styles.addButton}>
              Add Material Master Data
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
                <th style={styles.th}>Material Description</th>
                <th style={styles.th}>Material Type</th>
                <th style={styles.th}>Material Group</th>
                <th style={styles.th}>Unit Measure</th>
                <th style={styles.th}>Plant</th>
                <th style={styles.th}>Storage Location</th>
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
                  <td style={styles.td}>{item.material_description}</td>
                  <td style={styles.td}>{item.material_type}</td>
                  <td style={styles.td}>{item.material_group}</td>
                  <td style={styles.td}>{item.unit_measure}</td>
                  <td style={styles.td}>{item.plant}</td>
                  <td style={styles.td}>{item.storage_location}</td>
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

export default MaterialMasterDataPage;