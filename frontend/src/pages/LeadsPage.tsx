// src/pages/LeadsPage.tsx
import { useEffect, useState } from 'react';
import { fetchLeads, fetchLead } from '../api/leads';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  useEffect(() => {
    fetchLeads()
      .then(data => setLeads(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads.filter(lead =>
    lead.status.toLowerCase().includes(search.toLowerCase()) ||
    lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
    lead.id.toString().includes(search)
  );

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    fetchLead(id).then(setSelectedLead);
  };

  if (loading) return <p className="p-4">Loading leads...</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="sticky top-0 bg-white pb-2">
        <input
          type="text"
          placeholder="Search leads by ID, name, or status..."
          className="w-full p-2 mb-2 border rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="w-full p-2 border rounded-md"
          onChange={handleSelect}
          defaultValue=""
        >
          <option value="" disabled>Select a lead</option>
          {filteredLeads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              #{lead.id} – {lead.full_name}
            </option>
          ))}
        </select>
      </div>

      {selectedLead && (
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-bold mb-2">
            Lead #{selectedLead.id}: {selectedLead.full_name}
          </h2>
          <p>Email: {selectedLead.email}</p>
          <p>Phone: {selectedLead.phone}</p>
          <p>Property: {selectedLead.property_address}</p>
          <p>Status: {selectedLead.status}</p>
        </div>
      )}

      <h1 className="text-2xl font-bold mt-4">All Leads</h1>
      <ul className="space-y-2">
        {leads.map((lead) => (
          <li key={lead.id} className="p-4 bg-white rounded shadow">
            <p className="font-semibold">{lead.full_name}</p>
            <p className="text-sm text-gray-600">{lead.property_address}</p>
            <p className="text-sm text-gray-500">Status: {lead.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
