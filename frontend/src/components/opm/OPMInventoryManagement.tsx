import React, { useEffect, useMemo, useState } from 'react';
import { useNotification } from '../common/NotificationProvider';

interface InventoryItem {
  id: number;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  location?: string;
  status?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const OPMInventoryManagement: React.FC = () => {
  const { showAINotification } = useNotification();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: '',
    quantity: '0',
    unit: '',
    location: '',
    status: 'available',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opm/inventory');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      showAINotification('Error', 'Failed to load inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ name: '', category: '', quantity: '0', unit: '', location: '', status: 'available', notes: '' });
  };

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      [i.name, i.category, i.location, i.status].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    );
  }, [items, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category || null,
        quantity: Number(form.quantity) || 0,
        unit: form.unit || null,
        location: form.location || null,
        status: form.status || 'available',
        notes: form.notes || null
      };

      const url = editingId ? `/api/opm/inventory/${editingId}` : '/api/opm/inventory';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save item');
      showAINotification('Success', `Item ${editingId ? 'updated' : 'added'} successfully`, 'success');
      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving item:', error);
      showAINotification('Error', 'Failed to save item', 'error');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category || '',
      quantity: String(item.quantity ?? 0),
      unit: item.unit || '',
      location: item.location || '',
      status: item.status || 'available',
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      const res = await fetch(`/api/opm/inventory/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showAINotification('Deleted', 'Item removed successfully', 'success');
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      showAINotification('Error', 'Failed to delete item', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-teal-700">Inventory & Equipment</h1>
          <div className="flex items-center gap-2">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="px-3 py-2 rounded-md border border-teal-200 text-sm"
            />
            <button onClick={() => { setShowModal(true); resetForm(); setEditingId(null); }} className="px-3 py-2 rounded-md bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-semibold shadow">
              Add Item
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-teal-600 rounded-full"></div></div>
        ) : (
          <div className="bg-white/70 backdrop-blur border border-teal-100 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-teal-50">
                  <tr className="text-teal-700 text-left">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2">Unit</th>
                    <th className="px-4 py-2">Location</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} className="border-t border-teal-100">
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">{item.category || '-'}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{item.unit || '-'}</td>
                      <td className="px-4 py-2">{item.location || '-'}</td>
                      <td className="px-4 py-2">{item.status || '-'}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(item)} className="px-2 py-1 text-xs bg-teal-600 text-white rounded">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredItems.length && (
                    <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={7}>No items</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
              <div className="p-4 border-b"><h2 className="font-semibold text-teal-700">{editingId ? 'Edit Item' : 'Add Item'}</h2></div>
              <form onSubmit={handleSubmit} className="p-4 grid grid-cols-2 gap-3 text-sm">
                <label className="col-span-2">
                  <span className="block text-xs text-gray-600 mb-1">Name</span>
                  <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required className="w-full px-3 py-2 border rounded" />
                </label>
                <label>
                  <span className="block text-xs text-gray-600 mb-1">Category</span>
                  <input value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full px-3 py-2 border rounded" />
                </label>
                <label>
                  <span className="block text-xs text-gray-600 mb-1">Quantity</span>
                  <input type="number" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})} className="w-full px-3 py-2 border rounded" />
                </label>
                <label>
                  <span className="block text-xs text-gray-600 mb-1">Unit</span>
                  <input value={form.unit} onChange={e=>setForm({...form, unit:e.target.value})} className="w-full px-3 py-2 border rounded" />
                </label>
                <label>
                  <span className="block text-xs text-gray-600 mb-1">Location</span>
                  <input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} className="w-full px-3 py-2 border rounded" />
                </label>
                <label>
                  <span className="block text-xs text-gray-600 mb-1">Status</span>
                  <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="w-full px-3 py-2 border rounded">
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </label>
                <label className="col-span-2">
                  <span className="block text-xs text-gray-600 mb-1">Notes</span>
                  <textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="w-full px-3 py-2 border rounded"></textarea>
                </label>
                <div className="col-span-2 flex justify-end gap-2 pt-2">
                  <button type="button" onClick={()=>{ setShowModal(false); setEditingId(null); }} className="px-3 py-2 rounded border">Cancel</button>
                  <button type="submit" className="px-3 py-2 rounded bg-teal-600 text-white font-semibold">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OPMInventoryManagement;



