import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordToggleProps {
  password: string;
  setPassword: (value: string) => void;
  disabled ? : boolean;
  placeholder ? : string;
  id ? : string;
}

const PasswordToggle: React.FC < PasswordToggleProps > = ({
  password,
  setPassword,
  disabled = false,
  placeholder = 'Enter password',
  id = 'password'
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="password-toggle-group">
      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="password-input"
          minLength={6}
        />
        <button
          type="button"
          className="toggle-password-btn"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff size={18} className="toggle-icon" />
          ) : (
            <Eye size={18} className="toggle-icon" />
          )}
        </button>
      </div>
      <div className="password-strength">
        {password.length > 0 && password.length < 6 && (
          <span className="strength-weak">Weak - At least 6 characters</span>
        )}
        {password.length >= 6 && password.length < 10 && (
          <span className="strength-medium">Medium</span>
        )}
        {password.length >= 10 && (
          <span className="strength-strong">Strong</span>
        )}
      </div>
    </div>
  );
};

export default PasswordToggle;