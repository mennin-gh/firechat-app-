import React from 'react';

interface LogoutConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName ? : string;
}

const LogoutConfirmation: React.FC < LogoutConfirmationProps > = ({
  isOpen,
  onClose,
  onConfirm,
  userName
}) => {
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };
  
  return (
    <div className="logout-confirmation-overlay">
      <div className="logout-confirmation-modal">
        <div className="confirmation-header">
          <div className="warning-icon">⚠️</div>
          <h3>Confirm Logout</h3>
        </div>
        
        <div className="confirmation-body">
          <p>
            {userName 
              ? `Are you sure you want to log out, ${userName}?`
              : 'Are you sure you want to log out?'}
          </p>
          <p className="confirmation-note">
            You'll need to sign in again to access your messages.
          </p>
        </div>
        
        <div className="confirmation-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="confirm-btn"
            onClick={handleConfirm}
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation;