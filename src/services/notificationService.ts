import { Toast } from '../types';

let _addToast: (message: string, type?: Toast['type']) => void;

export const notificationService = {
  setToastFunction(addToastFn: typeof _addToast) {
    _addToast = addToastFn;
  },
  addToast(message: string, type: Toast['type'] = 'success') {
    if (_addToast) {
      _addToast(message, type);
    } else {
      console.warn('Toast function not set, falling back to alert');
      alert(message);
    }
  },
};
