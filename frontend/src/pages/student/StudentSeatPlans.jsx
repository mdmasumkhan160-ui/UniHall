import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { getSeatPlans, getFilterOptions } from '../../lib/examApi'

export default function StudentSeatPlans() {
  const { user } = useAuth()
  const [seatPlans, setSeatPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ semester: '', academicYear: '', department: '' })
  const [filterOptions, setFilterOptions] = useState({ departments: [], academicYears: [], semesters: [] })
  
  useEffect(() => {
    loadFilterOptions()
  }, [])
  
  useEffect(() => {
    loadSeatPlans()
  }, [filters])
  
  const loadFilterOptions = async () => {
    try {
      const res = await getFilterOptions()
      setFilterOptions(res.data || { departments: [], academicYears: [], semesters: [] })
    } catch (error) {
      console.error('Failed to load filter options:', error)
    }
  }
  
  const loadSeatPlans = async () => {
    setLoading(true)
    try {
      const res = await getSeatPlans(filters)
      setSeatPlans(res.data || [])
    } catch (error) {
      console.error('Failed to load seat plans:', error)
      alert('Failed to load seat plans: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }
  
  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }
  
  const clearFilters = () => {
    setFilters({ semester: '', academicYear: '', department: '' })
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Exam Seat Plans</h1>
        <p className="text-black font-bold mt-2">View your exam seating arrangements</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-3 text-gray-900">Filter Seat Plans</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Year</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-[#2C7DA0] text-white font-medium shadow-md hover:bg-[#123C69] focus:outline-none cursor-pointer"
              value={filters.academicYear}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            >
              <option value="">All Years</option>
              {filterOptions.academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-[#123C69] text-white font-medium shadow-md hover:bg-[#0b3350] focus:outline-none cursor-pointer"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {filterOptions.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-[#2C7DA0] text-white font-medium shadow-md hover:bg-[#123C69] focus:outline-none cursor-pointer"
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
            >
              <option value="">All Semesters</option>
              {filterOptions.semesters.map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>
        </div>
        {(filters.semester || filters.academicYear || filters.department) && (
          <button
            onClick={clearFilters}
            className="mt-3 px-3 py-1.5 rounded bg-[#2C7DA0] text-white font-medium hover:bg-[#123C69]"
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {/* Seat Plans List */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Available Seat Plans</h2>
          <span className="text-sm text-gray-500">{seatPlans.length} documents</span>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : seatPlans.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No seat plans available</p>
            <p className="text-sm text-gray-400 mt-2">
              {(filters.semester || filters.academicYear || filters.department) 
                ? 'Try adjusting your filters' 
                : 'Seat plans will appear here once uploaded by the exam controller'}
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {seatPlans.map(plan => (
              <li key={plan.planId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{plan.examName}</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {plan.department} • {plan.semester} {plan.academicYear}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Exam Date: {new Date(plan.examDate).toLocaleDateString()} • Uploaded {new Date(plan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${plan.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors font-medium"
                >
                  View PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Important Information</h3>
            <p className="text-sm text-blue-800">
              Please check your seat plan carefully before the exam. Make note of your room number, 
              seat number, and exam time. Arrive at least 15 minutes before the scheduled exam time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
