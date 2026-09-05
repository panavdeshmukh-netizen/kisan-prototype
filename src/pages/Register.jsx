import { useState } from "react";
import "./Login.css";

function LeafIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 20A7 7 0 0 1 4 13V6a1 1 0 0 1 1-1h1a7 7 0 0 1 7 7v8Z" />
      <path d="M11 13c0-4 4-7 8-7" />
    </svg>
  );
}

function Register({ onRegisterSuccess, onBackToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Please enter your full name.";
    if (!email.trim()) {
      e.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Enter a valid email address.";
    }
    if (!password) {
      e.password = "Please enter a password.";
    } else if (password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setTimeout(() => {
      const user = { id: "farmer-" + Date.now(), name: name.trim(), email: email.trim(), role: "farmer" };
      localStorage.setItem("token", "demo-farmer-token-12345");
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("registeredUser", JSON.stringify(user));
      setIsLoading(false);
      onRegisterSuccess(user);
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo"><LeafIcon /></div>
          <h1 className="login-app-name">KisanQueue</h1>
          <p className="login-tagline">Create your Farmer Account</p>
        </div>

        <h2 className="login-heading">Register</h2>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name" type="text" placeholder="Enter your full name"
              value={name} onChange={(e) => setName(e.target.value)}
              className={errors.name ? "input-error" : ""} autoComplete="name"
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email" type="email" placeholder="Enter your email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "input-error" : ""} autoComplete="email"
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password" type="password" placeholder="Create a password (min 6 chars)"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "input-error" : ""} autoComplete="new-password"
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (<><span className="spinner"></span>Creating Account...</>) : "Create Account"}
          </button>
        </form>

        <p className="create-account-text">
          Already have an account?{" "}
          <button type="button" className="link-btn" onClick={onBackToLogin}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
