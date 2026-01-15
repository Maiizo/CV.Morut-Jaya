"use client";

import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  editData?: any | null;
};

export function InputFormModal({ open, onClose, editData }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">{editData ? 'Edit Log' : 'New Log'}</h3>
        <p className="text-sm text-muted-foreground">Simple placeholder modal.</p>
        <div className="mt-4 flex justify-end">
          <button className="px-3 py-1 bg-gray-200 rounded mr-2" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InputFormModal;
