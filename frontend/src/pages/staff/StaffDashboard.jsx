import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import * as api from '../../lib/mockApi.js'
import { Link } from 'react-router-dom'

export default function StaffDashboard() {
  const { user } = useAuth()
  const hallId = user?.hallId
  // Get unique complaints for this hall only
  const allComplaints = hallId ? api.listComplaints({ hallId }) : []
  const uniqueComplaintsMap = new Map()
  allComplaints.forEach(c => {
    if (!uniqueComplaintsMap.has(c.id)) {
      uniqueComplaintsMap.set(c.id, c)
    }
  })
  const complaints = Array.from(uniqueComplaintsMap.values())
  const update = (id, status) => { api.updateComplaintStatus(id, status); window.location.reload() }
  
  // Load profile photo
  const [profilePhoto] = useState(() => {
    return localStorage.getItem(`profile_photo_${user?.id}`) || null
  })
  
  return (
    <div className="min-h-screen">
      {/* Header Section with Gradient */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {profilePhoto ? (
              <img 
                src={profilePhoto} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-1">
                Welcome, {user.name}!
              </h1>
              <p className="text-emerald-100 text-lg">
                Hall Staff Portal
              </p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-5xl font-bold text-white/30 mb-2">👨‍💼</div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border-l-4 border-emerald-500 rounded-lg p-5 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Total Complaints</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{complaints.length}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border-l-4 border-teal-500 rounded-lg p-5 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{complaints.filter(c => c.status === 'Pending').length}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white border-l-4 border-cyan-500 rounded-lg p-5 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">Resolved</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{complaints.filter(c => c.status === 'Resolved').length}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Complaints Card */}
          <Link 
            to="/complaints"
            className="group relative bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all overflow-hidden border border-gray-200 hover:border-emerald-400"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-teal-500"></div>
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10 flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              {complaints.length > 0 && (
                <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                  {complaints.length}
                </span>
              )}
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">Complaints</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage and track hall complaints and maintenance requests
            </p>
            <div className="text-emerald-600 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
              Go to Complaints
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Notifications Card */}
          <Link
            to="/notifications"
            className="group relative bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all overflow-hidden border border-gray-200 hover:border-cyan-400"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">Notifications</h3>
              <p className="text-sm text-gray-600 mb-4">
                Check announcements and important notices for the hall
              </p>
              <div className="text-cyan-600 text-sm font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                View Notifications
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            </Link>
        </div>
      </div>
    </div>
  )
}
