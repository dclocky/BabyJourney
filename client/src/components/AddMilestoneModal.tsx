// client/src/components/AddMilestoneModal.tsx

import React, { useState } from 'react';

interface MilestoneFormData {
  title: string;
  date: string;
  description: string;
  week: number;
}

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMilestone: (milestone: MilestoneFormData) => void;
}

const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({ isOpen, onClose, onAddMilestone }) => {
  const [formData, setFormData] = useState<MilestoneFormData>({
    title: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    description: '',
    week: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'week' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMilestone(formData);
    // Reset form
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      week: 0,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Milestone</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Week</label>
            <input
              type="number"
              name="week"
              value={formData.week}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              min="0"
              max="42"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMilestoneModal;