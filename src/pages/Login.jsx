import { useState } from "react";
import "./Login.css";

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.06-5.94M9.9 4.24A10.6 10.6 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 20A7 7 0 0 1 4 13V6a1 1 0 0 1 1-1h1a7 7 0 0 1 7 7v8Z" />
      <path d="M11 13c0-4 4-7 8-7" />
    </svg>
  );
}

function Login({ onLoginSuccess, onGoToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Please enter your password.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    setTimeout(() => {
      const storedUser = localStorage.getItem("registeredUser");
      let name = email.split("@")[0];
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.email === email.trim()) name = parsed.name;
        } catch (e) {}
      }
      const user = { id: "farmer-001", name, email: email.trim(), role: "farmer" };
      localStorage.setItem("token", "demo-farmer-token-12345");
      localStorage.setItem("user", JSON.stringify(user));
      setIsLoading(false);
      onLoginSuccess(user);
    }, 800);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo"><LeafIcon /></div>
          <h1 className="login-app-name">KisanQueue</h1>
          <p className="login-tagline">Farmer Procurement Centre Booking</p>
        </div>

        <h2 className="login-heading">Farmer Login</h2>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {errors.general && <p className="error-text">{errors.general}</p>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email" type="email" placeholder="Enter your email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "input-error" : ""} autoComplete="email"
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password" type={showPassword ? "text" : "password"}
                placeholder="Enter your password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? "input-error" : ""} autoComplete="current-password"
              />
              <button type="button" className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (<><span className="spinner"></span>Logging in...</>) : "Login"}
          </button>
        </form>

        <p className="create-account-text">
          Don&apos;t have an account?{" "}
          <button type="button" className="link-btn" onClick={onGoToRegister}>
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
