import { useState, useCallback } from 'react';

const useNotification = () => {
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    autoClose: true,
    autoCloseDelay: 5000,
    showCloseButton: true,
    actions: []
  });

  const showNotification = useCallback(({
    type = 'info',
    title = '',
    message = '',
    autoClose = true,
    autoCloseDelay = 5000,
    showCloseButton = true,
    actions = []
  }) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      autoClose,
      autoCloseDelay,
      showCloseButton,
      actions
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback((title, message, options = {}) => {
    showNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [showNotification]);

  const showError = useCallback((title, message, options = {}) => {
    showNotification({
      type: 'error',
      title,
      message,
      ...options
    });
  }, [showNotification]);

  const showWarning = useCallback((title, message, options = {}) => {
    showNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  }, [showNotification]);

  const showInfo = useCallback((title, message, options = {}) => {
    showNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useNotification;
