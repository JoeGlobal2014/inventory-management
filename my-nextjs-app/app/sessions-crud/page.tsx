// app/sessions-crud/page.tsx
"use client"; // Ensure this is a Client Component

import React, { useState, useEffect, MouseEvent } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import ParticleBackground from '@/components/ParticleBackground';
import SuppressHydrationWarning from '@/components/SuppressHydrationWarning';

// Define interfaces
interface Session {
  id: number;
  username: string;
  token: string;
}

export default function SessionsCrudPage() {
  const { logout } = useAuth(); // Destructure logout from useAuth
  const router = useRouter(); // Use useRouter for navigation
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Initialize as loading
  const [error, setError] = useState<string>('');
  const [particlesEnabled, setParticlesEnabled] = useState<boolean>(true); // State for particle toggle
  const [showParticles, setShowParticles] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">('dark');

  useEffect(() => {
    // Safely load showParticles from localStorage
    const storedShowParticles = localStorage.getItem('showParticles');
    setShowParticles(storedShowParticles !== null ? storedShowParticles : 'true');
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/sessions');
      if (Array.isArray(response.data)) {
        setSessions(response.data);
      } else {
        setError('Unexpected response format from server.');
        setSessions([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch sessions. Is the backend running?');
      if (err.response?.status === 401) {
        setError('Session expired or invalid. Please log in again.');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      setLoading(true);
      setError('');
      try {
        await api.delete(`/sessions/${id}`);
        fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete session.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleParticles = (event: MouseEvent<HTMLButtonElement>) => {
    const newValue = !particlesEnabled;
    setParticlesEnabled(newValue);
    setShowParticles(newValue.toString());
    localStorage.setItem('showParticles', newValue.toString());
  };

  return (
    <AuthGuard>
      <div className="relative min-h-screen">
        {showParticles === 'true' && (
          <SuppressHydrationWarning>
            <ParticleBackground theme={theme} />
          </SuppressHydrationWarning>
        )}
        <div className="relative z-10 p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Sessions CRUD</h1>
            <Link href="/dashboard" className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600">
              Back to Dashboard
            </Link>
            <button
              onClick={logout}
              className="bg-blue-500 text-white rounded-lg px-6 py-2 ml-2 hover:bg-blue-600"
            >
              Logout
            </button>
          </div>
          <div className="flex gap-4 mb-4">
            <button
              onClick={toggleParticles}
              className="bg-blue-500 text-white rounded-lg px-6 py-2 hover:bg-blue-600"
            >
              {showParticles === 'true' ? 'Disable Particles' : 'Enable Particles'}
            </button>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <table className="w-full border-collapse bg-white shadow-md rounded-lg">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Token</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="border border-gray-300 px-4 py-2">{session.id}</td>
                    <td className="border border-gray-300 px-4 py-2">{session.username}</td>
                    <td className="border border-gray-300 px-4 py-2">{session.token}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="bg-red-500 text-white rounded-lg px-4 py-1 hover:bg-red-600"
                        disabled={loading}
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
    </AuthGuard>
  );
}