// src/components/forms/LeadForm.tsx
import { useState, useEffect } from 'react';
import { createLead, updateLead } from '../../api/leads';
import { toast } from 'react-toastify';

interface LeadFormProps {
  initialData?: any;
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export default function LeadForm({ initialData, mode, onSuccess }: LeadFormProps) {
  // --------------------------- State ---------------------------
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    property_address: '',
    status: 'new',
    agent: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  // --------------------------- Effects ---------------------------
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // --------------------------- Handlers ---------------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await createLead(formData);
        toast.success('Lead created successfully');
      } else {
        await updateLead(initialData.id, formData);
        toast.success('Lead updated successfully');
      }
      onSuccess();
    } catch (err) {
      console.error('Error submitting lead:', err);
      toast.error('Error submitting lead');
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------- Render ---------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <input
        type="text"
        name="full_name"
        placeholder="Full Name"
        value={formData.full_name}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="tel"
        name="phone"
        placeholder="Phone"
        value={formData.phone}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        name="property_address"
        placeholder="Property Address"
        value={formData.property_address}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />
      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      >
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="qualified">Qualified</option>
        <option value="lost">Lost</option>
        <option value="converted">Converted</option>
      </select>

      <button
        type="submit"
        disabled={submitting}
        className={`px-4 py-2 text-white rounded ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'}`}
      >
        {submitting
          ? 'Submitting...'
          : mode === 'create'
          ? 'Create Lead'
          : 'Update Lead'}
      </button>
    </form>
  );
}
