'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { User, UserRole } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { FiSearch, FiEdit2, FiSave, FiX, FiFilter, FiUser, FiMail, FiPhone, FiGlobe, FiCheck, FiXCircle } from 'react-icons/fi';

// Define the Profile type based on your SQL schema
type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  country_id: number | null;
  language: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  country?: {
    name_en: string;
    name_ar: string;
  };
};

type SortField = 'email' | 'created_at' | 'last_name' | 'role';
type SortOrder = 'asc' | 'desc';

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Profile> | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    emailVerified: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [countries, setCountries] = useState<{id: number, name_en: string, name_ar: string}[]>([]);
  
  const supabase = createClientComponentClient<Database>();

  // Fetch user profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        
        // First, fetch countries for the dropdown
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('id, name_en, name_ar');
          
        if (countriesError) throw countriesError;
        setCountries(countriesData || []);
        
        // Then fetch profiles with country data
        let query = supabase
          .from('profiles')
          .select(`
            *,
            countries (name_en, name_ar)
          `);
          
        // Apply search
        if (searchTerm) {
          query = query.or(`
            email.ilike.${`%${searchTerm}%`},
            first_name.ilike.${`%${searchTerm}%`},
            last_name.ilike.${`%${searchTerm}%`},
            phone.ilike.${`%${searchTerm}%`}
          `);
        }
        
        // Apply filters
        if (filters.role) {
          query = query.eq('role', filters.role);
        }
        if (filters.isActive) {
          query = query.eq('is_active', filters.isActive === 'true');
        }
        if (filters.emailVerified) {
          query = query.eq('email_verified', filters.emailVerified === 'true');
        }
        
        // Apply sorting
        query = query.order(sortField, { ascending: sortOrder === 'asc' });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setProfiles(data || []);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast.error('Failed to load user profiles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [searchTerm, filters, sortField, sortOrder]);

  // Toggle user active status
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      setProfiles(profiles.map(profile => 
        profile.id === userId ? { ...profile, is_active: !currentStatus } : profile
      ));
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  // Start editing a user
  const startEditing = (profile: Profile) => {
    setEditingId(profile.id);
    setEditingData({
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      country_id: profile.country_id,
      language: profile.language,
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditingData(null);
  };

  // Save edited user data
  const saveEdit = async (userId: string) => {
    if (!editingData) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...editingData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      setProfiles(profiles.map(profile => 
        profile.id === userId ? { ...profile, ...editingData } : profile
      ));
      
      setEditingId(null);
      setEditingData(null);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get sort indicator
  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage user accounts and permissions
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiFilter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                id="role-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={filters.role}
                onChange={(e) => setFilters({...filters, role: e.target.value})}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={filters.isActive}
                onChange={(e) => setFilters({...filters, isActive: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="verified-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Verified
              </label>
              <select
                id="verified-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                value={filters.emailVerified}
                onChange={(e) => setFilters({...filters, emailVerified: e.target.value})}
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white"
                  onClick={() => handleSort('last_name')}
                >
                  <div className="flex items-center">
                    Name
                    <span className="ml-1">{getSortIndicator('last_name')}</span>
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-white"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    <span className="ml-1">{getSortIndicator('email')}</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Role
                    <span className="ml-1">{getSortIndicator('role')}</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Joined
                    <span className="ml-1">{getSortIndicator('created_at')}</span>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                    Loading users...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          {profile.avatar_url ? (
                            <img className="h-10 w-10 rounded-full" src={profile.avatar_url} alt="" />
                          ) : (
                            <FiUser className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {editingId === profile.id ? (
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={editingData?.first_name || ''}
                                  onChange={(e) => setEditingData({...editingData, first_name: e.target.value})}
                                  className="block w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:text-white"
                                  placeholder="First"
                                />
                                <input
                                  type="text"
                                  value={editingData?.last_name || ''}
                                  onChange={(e) => setEditingData({...editingData, last_name: e.target.value})}
                                  className="block w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:text-white"
                                  placeholder="Last"
                                />
                              </div>
                            ) : (
                              `${profile.first_name || 'N/A'} ${profile.last_name || ''}`.trim() || 'Unnamed User'
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {profile.email_verified ? (
                              <span className="inline-flex items-center text-green-600 dark:text-green-400">
                                <FiCheck className="mr-1" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400">
                                <FiXCircle className="mr-1" /> Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === profile.id ? (
                        <input
                          type="email"
                          value={editingData?.email || ''}
                          onChange={(e) => setEditingData({...editingData, email: e.target.value})}
                          className="block w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {profile.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === profile.id ? (
                        <input
                          type="tel"
                          value={editingData?.phone || ''}
                          onChange={(e) => setEditingData({...editingData, phone: e.target.value})}
                          className="block w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-white">
                          {profile.phone || 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === profile.id ? (
                        <select
                          value={editingData?.role || 'user'}
                          onChange={(e) => setEditingData({...editingData, role: e.target.value as UserRole})}
                          className="block w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm dark:bg-gray-700 dark:text-white"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="partner">Partner</option>
                        </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          profile.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : profile.role === 'partner'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        onClick={() => !editingId && toggleUserStatus(profile.id, profile.is_active)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          profile.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {profile.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(profile.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === profile.id ? (
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => saveEdit(profile.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <FiSave className="h-5 w-5" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditing(profile)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}