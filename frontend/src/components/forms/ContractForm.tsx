// src/components/forms/ContractForm.tsx
import { useState, useEffect } from 'react';
import { createContract, updateContract } from '../../api/contracts';
import { toast } from 'react-toastify';

interface ContractFormProps {
  initialData?: any;
  leads: any[];
  mode: 'create' | 'edit';
  onSuccess: () => void;
}

export default function ContractForm({ initialData, leads, mode, onSuccess }: ContractFormProps) {
  // --------------------------- State ---------------------------
  const [status, setStatus] = useState('pending');
  const [leadId, setLeadId] = useState<number>(leads[0]?.id || 1);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // --------------------------- Effects ---------------------------
  useEffect(() => {
    if (initialData) {
      setStatus(initialData.status);
      setLeadId(initialData.lead);
    }
  }, [initialData]);

  // --------------------------- Handlers ---------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'create' && !file) {
      toast.error('Please upload a PDF document.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', status);
      formData.append('lead', leadId.toString());
      if (file) {
        formData.append('document', file);
      }

      if (mode === 'create') {
        await createContract(formData);
        toast.success('Contract created successfully');
      } else {
        await updateContract(initialData.id, formData);
        toast.success('Contract updated successfully');
      }

      onSuccess();
    } catch (err) {
      console.error('Error submitting contract:', err);
      toast.error('Error submitting contract');
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------- Render ---------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <select
        name="lead"
        value={leadId}
        onChange={(e) => setLeadId(Number(e.target.value))}
        className="w-full p-2 border rounded"
      >
        {leads.map((lead) => (
          <option key={lead.id} value={lead.id}>
            {lead.full_name}
          </option>
        ))}
      </select>

      <select
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="pending">Pending</option>
        <option value="signed">Signed</option>
        <option value="voided">Voided</option>
      </select>

      <input
        type="file"
        name="document"
        accept=".pdf"
        onChange={handleFileChange}
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        disabled={submitting}
        className={`px-4 py-2 text-white rounded ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600'}`}
      >
        {submitting
          ? 'Submitting...'
          : mode === 'create'
          ? 'Create Contract'
          : 'Update Contract'}
      </button>
    </form>
  );
}