"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { username, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    logout();
    router.push("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>
          Welcome to the Dashboard, {username || "User"}!
        </h1>
        <button onClick={handleLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
      <h2 style={styles.subHeading}>Manage Your Data</h2>
      <div style={styles.buttonGrid}>
        <Link href="/inventory-crud" style={styles.crudButton}>
          Inventory
        </Link>
        <Link href="/customer-orders-crud" style={styles.crudButton}>
          Customer Orders
        </Link>
        <Link href="/material-master-data-crud" style={styles.crudButton}>
          Material Master
        </Link>
        <Link href="/sales-forecast-data-crud" style={styles.crudButton}>
          Sales Forecast
        </Link>
        <Link href="/vendor-historical-data-crud" style={styles.crudButton}>
          Vendor Historical Data
        </Link>
        <Link href="/vendor-master-data-crud" style={styles.crudButton}>
          Vendor Master
        </Link>
        <Link href="/customer-contract-info-crud" style={styles.crudButton}>
          Customer Contract Info
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "800px",
    margin: "50px auto",
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
    fontSize: "14px",
    color: "#fff",
    backgroundColor: "#ff4444",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  subHeading: {
    fontSize: "18px",
    marginBottom: "20px",
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
  },
  crudButton: {
    padding: "15px",
    fontSize: "16px",
    color: "#fff",
    backgroundColor: "#00C851",
    border: "none",
    borderRadius: "4px",
    textAlign: "center" as const,
    textDecoration: "none",
    fontWeight: "bold",
    display: "block",
  },
};

export const dynamic = "force-dynamic";