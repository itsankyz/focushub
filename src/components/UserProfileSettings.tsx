import React, { useState } from 'react';
import { UserProfile } from '../types';

interface UserProfileSettingsProps {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => Promise<void>;
}

export default function UserProfileSettings({ userProfile, onSave }: UserProfileSettingsProps) {
  const [form, setForm] = useState<UserProfile>(userProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await onSave(form);
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-gray-100">
      <h3 className="text-2xl font-black text-[#2c3437] mb-2">Profile Management</h3>
      <p className="text-gray-400 mb-8">Update your user profile details saved in local + cloud sync.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Display Name</label>
          <input
            className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#3856c4]/20"
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email</label>
          <input
            type="email"
            className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#3856c4]/20"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Phone Number</label>
          <input
            className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#3856c4]/20"
            value={form.phone || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Role</label>
          <select
            className="w-full bg-[#f7f9fb] border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#3856c4]/20"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserProfile['role'] }))}
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>

        <div className="md:col-span-2 flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 bg-[#3856c4] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#3856c4]/20 disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <p className="text-sm font-bold text-green-600">Profile saved.</p>}
        </div>
      </form>
    </div>
  );
}
