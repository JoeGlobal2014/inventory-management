"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Password strength logic
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: "", color: "" };
    if (password.length < 6) return { strength: "Weak", color: "#ff4444" };
    if (password.length < 10) return { strength: "Moderate", color: "#ffbb33" };
    return { strength: "Strong", color: "#00C851" };
  };

  const { strength, color } = getPasswordStrength(password);

  const handleRegister = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await register(username, password, confirmPassword);
      router.push("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Register</h1>
      {error && <p style={styles.error}>{error}</p>}
      {loading ? (
        <p style={styles.text}>Loading...</p>
      ) : (
        <div style={styles.form}>
          <label style={styles.label}>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            {password && (
              <div style={styles.strengthContainer}>
                <div
                  style={{
                    ...styles.strengthBar,
                    backgroundColor: color,
                    width:
                      strength === "Weak"
                        ? "33%"
                        : strength === "Moderate"
                        ? "66%"
                        : "100%",
                  }}
                />
                <span style={{ ...styles.strengthText, color }}>{strength}</span>
              </div>
            )}
          </label>
          <label style={styles.label}>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
            />
          </label>
          <button
            onClick={handleRegister}
            disabled={isSubmitting}
            style={
              isSubmitting
                ? { ...styles.button, ...styles.buttonDisabled }
                : styles.button
            }
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
          <p style={styles.linkText}>
            Already have an account?{" "}
            <Link href="/login" style={styles.link}>
              Log in
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    backgroundColor: "#1a2a44",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    color: "#fff",
  },
  heading: {
    textAlign: "center" as const,
    marginBottom: "20px",
    fontSize: "24px",
    fontWeight: "bold",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "15px",
  },
  label: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "5px",
    fontSize: "16px",
  },
  input: {
    padding: "10px",
    fontSize: "16px",
    backgroundColor: "#2a3b5a",
    border: "none",
    borderRadius: "4px",
    color: "#fff",
    outline: "none",
  },
  strengthContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "5px",
  },
  strengthBar: {
    height: "5px",
    borderRadius: "3px",
    transition: "width 0.3s, background-color 0.3s",
  },
  strengthText: {
    fontSize: "12px",
    fontWeight: "bold",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    color: "#000",
    backgroundColor: "#f7c948",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
    cursor: "not-allowed",
  },
  error: {
    color: "#ff4444",
    textAlign: "center" as const,
    marginBottom: "15px",
    fontSize: "14px",
  },
  text: {
    textAlign: "center" as const,
    color: "#fff",
  },
  linkText: {
    textAlign: "center" as const,
    fontSize: "14px",
    color: "#fff",
  },
  link: {
    color: "#00c4ff",
    textDecoration: "underline",
  },
};

export const dynamic = "force-dynamic";