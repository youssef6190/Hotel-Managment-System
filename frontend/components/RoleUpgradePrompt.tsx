'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleUpgradePromptProps {
  onUpgrade?: () => void;
}

const RoleUpgradePrompt: React.FC<RoleUpgradePromptProps> = ({ onUpgrade }) => {
  const { user, upgradeToGuest, isGuest } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error' | ''}>({
    text: '',
    type: ''
  });
  
  // Don't show if the user is already a guest or admin
  if (!user || user.role !== 'viewer') {
    return null;
  }
  
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const result = await upgradeToGuest();
      setMessage({
        text: result.message,
        type: 'success'
      });
      
      if (onUpgrade) {
        onUpgrade();
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to upgrade role',
        type: 'error'
      });
    } finally {
      setIsUpgrading(false);
    }
  };
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">Upgrade your account</h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              Upgrade to Guest role to make reservations and payments. This is required to book a room.
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm 
                ${isUpgrading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} 
                text-white`}
            >
              {isUpgrading ? 'Upgrading...' : 'Upgrade to Guest'}
            </button>
          </div>
          
          {message.text && (
            <div className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleUpgradePrompt;
