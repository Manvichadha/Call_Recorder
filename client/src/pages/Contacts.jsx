import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Search, UserPlus, Phone, X, Calendar, Mic, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Contacts() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone_number: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchContacts();
    
    // Listen for native Android contact picker results
    window.onAndroidContactPicked = async (name, phone) => {
      if (!name || !phone) return;
      setSaving(true);
      const { error } = await supabase.from('contacts').insert({
        user_id: user.id,
        name: name,
        phone_number: phone.replace(/[^\d+]/g, '')
      });
      setSaving(false);
      if (!error) {
        setToast(`Imported ${name}!`);
        setTimeout(() => setToast(''), 3000);
        fetchContacts();
      } else {
        setToast('Error importing native contact');
        setTimeout(() => setToast(''), 3000);
      }
    };

    return () => {
      delete window.onAndroidContactPicked;
    };
  }, [user]);

  async function fetchContacts() {
    if (!user) return;
    const { data, error } = await supabase
      .from('contacts')
      .select(`*, recordings(count)`)
      .order('name');
    if (!error && data) setContacts(data);
    setLoading(false);
  }

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.phone_number.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('contacts').insert({
      user_id: user.id,
      name: formData.name.trim(),
      phone_number: formData.phone_number.trim(),
    });
    setSaving(false);
    if (!error) {
      setFormData({ name: '', phone_number: '' });
      setShowForm(false);
      setToast('Contact added!');
      setTimeout(() => setToast(''), 3000);
      fetchContacts();
    }
  };

  const handleImportContacts = async () => {
    // 1. Intercept for Custom Android App Wrapper
    if (window.AndroidBridge && window.AndroidBridge.pickContact) {
      window.AndroidBridge.pickContact();
      return;
    }

    // 2. Standard Web Fallback
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      setToast('Contact import is not supported on this browser/device.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const selectedContacts = await navigator.contacts.select(props, opts);
      
      if (!selectedContacts || selectedContacts.length === 0) return;
      
      setSaving(true);
      const insertData = selectedContacts
        .filter(c => c.name && c.name.length > 0 && c.tel && c.tel.length > 0)
        .map(c => ({
          user_id: user.id,
          name: c.name[0],
          phone_number: c.tel[0].replace(/[^\d+]/g, '')
        }));
        
      if (insertData.length > 0) {
        const { error } = await supabase.from('contacts').insert(insertData);
        if (error) {
          throw new Error('Database error: ' + error.message);
        }
        setToast(`Imported ${insertData.length} contacts!`);
        setTimeout(() => setToast(''), 3000);
        fetchContacts();
      } else {
        setToast('No valid contacts found with phone numbers.');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
      if (err.name === 'NotAllowedError' || err.message.includes('cancel')) {
        return; // User simply closed the picker
      }
      setToast('Error: ' + err.message);
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (!error) {
      setToast('Contact deleted');
      setTimeout(() => setToast(''), 3000);
      fetchContacts();
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number.includes(search)
  );

  return (
    <div className="min-h-screen bg-[#EEF2F9] font-sans p-0 lg:p-5">
      <Sidebar />

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <div className="bg-white rounded-none lg:rounded-[40px] shadow-sm lg:ml-[108px] min-h-screen lg:min-h-[calc(100vh-40px)] overflow-hidden pb-24 lg:pb-8 relative">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-50 px-4 lg:px-10 pb-4 lg:pb-8" style={{ paddingTop: 'max(2rem, calc(env(safe-area-inset-top) + 1rem))' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-[56px] font-extrabold text-gray-900 tracking-tight">Contacts</h1>
              <p className="text-xs lg:text-sm text-gray-400 mt-1 lg:mt-6">{contacts.length} saved contacts</p>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={handleImportContacts}
                disabled={saving}
                className="h-9 lg:h-11 px-3 lg:px-5 bg-white border border-gray-200 rounded-xl flex items-center gap-1.5 lg:gap-2 text-gray-700 text-xs lg:text-sm font-semibold hover:bg-gray-50 active:scale-95 transition-transform"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">Import Contacts</span>
                <span className="sm:hidden">Import</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="h-9 lg:h-11 px-3 lg:px-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl flex items-center gap-1.5 lg:gap-2 text-white text-xs lg:text-sm font-semibold shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-transform"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Contact</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </header>

        <div className="px-3 lg:px-8 pt-4 lg:pt-6">

          {/* ── Add Contact Form Modal ── */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg mb-8 relative">
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-gray-900 mb-5">Add New Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 234 567 8900"
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={saving || !formData.name.trim() || !formData.phone_number.trim()}
                className="bg-gray-900 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          )}

          {/* ── Search ── */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
            />
          </div>

          {/* ── Contacts List ── */}
          <div className="space-y-3">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl" />)
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-7 h-7 text-indigo-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">No contacts yet</h4>
                <p className="text-sm text-gray-400 mb-5">
                  Add contacts to link them with your call recordings.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gray-900 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-800 transition-all"
                >
                  + Add Your First Contact
                </button>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div 
                  key={contact.id} 
                  onClick={() => navigate('/simulator', { state: { autoDial: contact.phone_number } })}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:shadow-md hover:border-indigo-500 cursor-pointer transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {contact.avatar_url ? (
                        <img src={contact.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-indigo-600">{contact.name[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">{contact.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="w-3 h-3" /> {contact.phone_number}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Mic className="w-3 h-3" /> {contact.recordings?.[0]?.count || 0} calls
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" /> {new Date(contact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Delete contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
