// src/pages/ContractsPage.tsx
import { useEffect, useState } from 'react';
import { fetchContracts, fetchContract } from '../api/contracts';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<any | null>(null);

  useEffect(() => {
    fetchContracts()
      .then(data => setContracts(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredContracts = contracts.filter(contract =>
    contract.status.toLowerCase().includes(search.toLowerCase()) ||
    contract.id.toString().includes(search)
  );

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    fetchContract(id).then(setSelectedContract);
  };

  if (loading) return <p className="p-4">Loading contracts...</p>;

  return (
    <div className="p-4 space-y-4">
      <div className="sticky top-0 bg-white pb-2">
        <input
          type="text"
          placeholder="Search contracts by ID or status..."
          className="w-full p-2 mb-2 border rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="w-full p-2 border rounded-md"
          onChange={handleSelect}
          defaultValue=""
        >
          <option value="" disabled>Select a contract</option>
          {filteredContracts.map((contract) => (
            <option key={contract.id} value={contract.id}>
              #{contract.id} - {contract.status}
            </option>
          ))}
        </select>
      </div>

      {selectedContract && (
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-bold mb-2">
            Contract #{selectedContract.id}
          </h2>
          <p>Status: {selectedContract.status}</p>
          <a
            href={selectedContract.document}
            className="text-blue-500 underline"
            target="_blank"
            rel="noreferrer"
          >
            View PDF
          </a>
        </div>
      )}

      <h1 className="text-2xl font-bold mt-4">All Contracts</h1>
      <ul className="space-y-2">
        {contracts.map((contract) => (
          <li key={contract.id} className="p-4 bg-white rounded shadow">
            <p className="font-semibold">Status: {contract.status}</p>
            <p className="text-sm text-gray-600">Lead ID: {contract.lead}</p>
            <a
              href={contract.document}
              className="text-blue-500 underline"
              target="_blank"
              rel="noreferrer"
            >
              View PDF
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
