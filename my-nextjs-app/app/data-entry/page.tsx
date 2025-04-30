'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DataEntry() {
  console.log('Rendering DataEntryPage');
  const [inventoryData, setInventoryData] = useState({
    materialNumber: "",
    location: "",
    quantity: "",
    value: "",
  });
  const [customerOrderData, setCustomerOrderData] = useState({
    orderId: "",
    customerName: "",
    orderDate: "",
    amount: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleInventoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInventoryData({ ...inventoryData, [e.target.name]: e.target.value });
  };

  const handleCustomerOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerOrderData({ ...customerOrderData, [e.target.name]: e.target.value });
  };

  const validateInventoryData = () => {
    if (!inventoryData.materialNumber || !inventoryData.location) {
      return "Material number and location are required";
    }
    const quantity = parseInt(inventoryData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return "Quantity must be a positive integer";
    }
    const value = parseFloat(inventoryData.value);
    if (isNaN(value) || value < 0) {
      return "Value must be a non-negative number";
    }
    return null;
  };

  const validateCustomerOrderData = () => {
    if (!customerOrderData.orderId || !customerOrderData.customerName || !customerOrderData.orderDate) {
      return "Order ID, customer name, and order date are required";
    }
    const amount = parseFloat(customerOrderData.amount);
    if (isNaN(amount) || amount < 0) {
      return "Amount must be a non-negative number";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent, type: "inventory" | "customerOrder") => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const validationError = type === "inventory" ? validateInventoryData() : validateCustomerOrderData();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    const data = type === "inventory" ? inventoryData : customerOrderData;
    const endpoint = type === "inventory" ? "/api/inventory" : "/api/customer-order";

    try {
      const res = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem('token') || '',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `${type === "inventory" ? "Inventory" : "Customer Order"} data entry failed`);
      }

      const responseData = await res.json();
      setSuccess(responseData.message);
      if (type === "inventory") {
        setInventoryData({ materialNumber: "", location: "", quantity: "", value: "" });
      } else {
        setCustomerOrderData({ orderId: "", customerName: "", orderDate: "", amount: "" });
      }
    } catch (err: any) {
      setError(err.message || `An error occurred during ${type === "inventory" ? "inventory" : "customer order"} data entry`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #1e40af, #60a5fa)' }}>
      <div style={{ backgroundColor: '#1f2937', color: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '32rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>Data Entry</h1>
        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>{success}</p>}
        
        {/* Inventory Data Entry Form */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Inventory Data</h2>
          <form onSubmit={(e) => handleSubmit(e, "inventory")} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'white' }}>Material Number</label>
              <input
                type="text"
                name="materialNumber"
                value={inventoryData.materialNumber}
                onChange={handleInventoryChange}
                placeholder="Material Number"
                style={{ width: 'calc(100% - 0.5rem)', backgroundColor: '#374151', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'white' }}>Location</label>
              <input
                type="text"
                name="location"
                value={inventoryData.location}
                onChange={handleInventoryChange}
                placeholder="Location"
                style={{ width: 'calc(100% - 0.5rem)', backgroundColor: '#374151', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'white' }}>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={inventoryData.quantity}
                onChange={handleInventoryChange}
                placeholder="Quantity"
                style={{ width: 'calc(100% - 0.5rem)', backgroundColor: '#374151', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: 'none', boxSizing: 'border-box' }}
                required
                min="1"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'white' }}>Value</label>
              <input
                type="number"
                name="value"
                value={inventoryData.value}
                onChange={handleInventoryChange}
                placeholder="Value"
                style={{ width: 'calc(100% - 0.5rem)', backgroundColor: '#374151', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: 'none', boxSizing: 'border-box' }}
                required
                min="0"
                step="0.01"
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: '#eab308',
                color: 'white',
                fontWeight: '600',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Inventory Data'}
            </button>
          </form>
        </div>

        {/* Customer Order Data Entry Form */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Customer Order Data</h2>
          <form onSubmit={(e) => handleSubmit(e, "customerOrder")} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'white' }}>Order ID</label>
              <input
                type="text"
                name="orderId"
                value={customerOrderData.orderId}
                onChange={handleCustomerOrderChange}
                placeholder="Order ID"
                style={{ width: 'calc(100% - 0.5rem)', backgroundColor: '#374151', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'white' }}>Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={customerOrderData.customerName}
                onChange={handleCustomerOrderChange}
                placeholder="Customer Name"
                style={{ width: 'calc( TQ100% - 0.5rem)', backgroundColor: '#374151', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'white' }}>Order Date</label>
              <input
                type="date"
                name="orderDate"
                value={customerOrderData.orderDate}
                onChange={handleCustomerOrderChange}
                style={{ width: 'calc(100% - 0.5rem)', backgroundColor: '#374151', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: 'none', boxSizing: 'border-box' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'white' }}>Amount</label>
              <input
                type="number"
                name="amount"
                value={customerOrderData.amount}
                onChange={handleCustomerOrderChange}
                placeholder="Amount"
                style={{ width: 'calc(100% - 0.5rem)', backgroundColor: '#374151', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: 'none', boxSizing: 'border-box' }}
                required
                min="0"
                step="0.01"
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                backgroundColor: '#eab308',
                color: 'white',
                fontWeight: '600',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Customer Order Data'}
            </button>
          </form>
        </div>

        <button
          onClick={handleBackToDashboard}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            backgroundColor: '#6b7280',
            color: 'white',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}