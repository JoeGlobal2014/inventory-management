"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ParticleBackground from "../components/ParticleBackground";

interface User {
    id: number;
    username: string;
    password: string;
    failed_attempts: number;
    lockout_until: string | null;
    totp_secret: string | null;
}

export default function UsersCrud() {
    const [items, setItems] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showParticles, setShowParticles] = useState(true);
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [newItem, setNewItem] = useState({
        username: "",
        password: "",
        failed_attempts: 0,
        lockout_until: null as string | null,
        totp_secret: null as string | null,
    });
    const [editingItem, setEditingItem] = useState<User | null>(null);

    useEffect(() => {
        const savedPreference = localStorage.getItem("showParticles");
        if (savedPreference !== null) {
            setShowParticles(JSON.parse(savedPreference));
        }

        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");

        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:5000/api/users");
            if (!res.ok) throw new Error("Failed to fetch users data");
            setItems(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const toggleParticles = () => {
        const newValue = !showParticles;
        setShowParticles(newValue);
        localStorage.setItem("showParticles", JSON.stringify(newValue));
    };

    const handleCreate = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem),
            });
            if (!res.ok) throw new Error("Failed to create user");
            setNewItem({
                username: "",
                password: "",
                failed_attempts: 0,
                lockout_until: null,
                totp_secret: null,
            });
            fetchItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const handleUpdate = async () => {
        if (!editingItem) return;

        try {
            const res = await fetch(`http://localhost:5000/api/users/${editingItem.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingItem),
            });
            if (!res.ok) throw new Error("Failed to update user");
            setEditingItem(null);
            fetchItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete user");
            fetchItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        }
    };

    return (
        <div className="relative min-h-screen">
            {showParticles && <ParticleBackground theme={theme} />}
            <div className="relative z-10 p-6">
                <div className="flex justify-between mb-4">
                    <h1 className="text-3xl font-bold">Manage Users</h1>
                    <Link href="/dashboard">
                        <button className="p-2 bg-gray-500 text-white rounded">Back to Dashboard</button>
                    </Link>
                </div>
                <button
                    onClick={toggleParticles}
                    className="p-2 bg-blue-500 text-white rounded mb-4"
                >
                    {showParticles ? "Disable Particles" : "Enable Particles"}
                </button>

                {/* Create Form */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-2">Add New User</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={newItem.username}
                            onChange={(e) => setNewItem({ ...newItem, username: e.target.value })}
                            className="p-2 border rounded"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={newItem.password}
                            onChange={(e) => setNewItem({ ...newItem, password: e.target.value })}
                            className="p-2 border rounded"
                        />
                        <input
                            type="number"
                            placeholder="Failed Attempts"
                            value={newItem.failed_attempts}
                            onChange={(e) => setNewItem({ ...newItem, failed_attempts: parseInt(e.target.value) || 0 })}
                            className="p-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Lockout Until (optional)"
                            value={newItem.lockout_until || ""}
                            onChange={(e) => setNewItem({ ...newItem, lockout_until: e.target.value || null })}
                            className="p-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="TOTP Secret (optional)"
                            value={newItem.totp_secret || ""}
                            onChange={(e) => setNewItem({ ...newItem, totp_secret: e.target.value || null })}
                            className="p-2 border rounded"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="mt-4 p-2 bg-green-500 text-white rounded"
                    >
                        Create
                    </button>
                </div>

                {/* Update Form */}
                {editingItem && (
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-2">Edit User</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Username"
                                value={editingItem.username}
                                onChange={(e) => setEditingItem({ ...editingItem, username: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={editingItem.password}
                                onChange={(e) => setEditingItem({ ...editingItem, password: e.target.value })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="number"
                                placeholder="Failed Attempts"
                                value={editingItem.failed_attempts}
                                onChange={(e) => setEditingItem({ ...editingItem, failed_attempts: parseInt(e.target.value) || 0 })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="Lockout Until (optional)"
                                value={editingItem.lockout_until || ""}
                                onChange={(e) => setEditingItem({ ...editingItem, lockout_until: e.target.value || null })}
                                className="p-2 border rounded"
                            />
                            <input
                                type="text"
                                placeholder="TOTP Secret (optional)"
                                value={editingItem.totp_secret || ""}
                                onChange={(e) => setEditingItem({ ...editingItem, totp_secret: e.target.value || null })}
                                className="p-2 border rounded"
                            />
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleUpdate}
                                className="p-2 bg-blue-500 text-white rounded"
                            >
                                Update
                            </button>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="p-2 bg-gray-500 text-white rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Display Data */}
                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : items.length === 0 ? (
                    <p>No users data available.</p>
                ) : (
                    <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2 text-left">ID</th>
                                <th className="border p-2 text-left">Username</th>
                                <th className="border p-2 text-left">Failed Attempts</th>
                                <th className="border p-2 text-left">Lockout Until</th>
                                <th className="border p-2 text-left">TOTP Secret</th>
                                <th className="border p-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-100">
                                    <td className="border p-2">{item.id}</td>
                                    <td className="border p-2">{item.username}</td>
                                    <td className="border p-2">{item.failed_attempts}</td>
                                    <td className="border p-2">{item.lockout_until || "N/A"}</td>
                                    <td className="border p-2">{item.totp_secret || "N/A"}</td>
                                    <td className="border p-2">
                                        <button
                                            onClick={() => setEditingItem(item)}
                                            className="p-1 bg-yellow-500 text-white rounded mr-2"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-1 bg-red-500 text-white rounded"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}