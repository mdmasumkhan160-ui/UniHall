import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { getSeatPlans, getExamResults } from '../../lib/examApi'

export default function ExamDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ seatPlans: 0, results: 0 })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadStats()

    // Listen for global 'examStatsChanged' event and reload stats when fired
    function onStatsChanged() {
      loadStats()
    }

    window.addEventListener('examStatsChanged', onStatsChanged)
    return () => window.removeEventListener('examStatsChanged', onStatsChanged)
  }, [])
  
  const loadStats = async () => {
    try {
      const [seatPlansRes, resultsRes] = await Promise.all([
        getSeatPlans({ limit: 1 }),
        getExamResults({ limit: 1 })
      ])
      setStats({
        seatPlans: seatPlansRes.count || 0,
        results: resultsRes.count || 0
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="bg-white border rounded-lg shadow-sm p-6" style={{ backgroundColor: '#234e78' }}>
        <h1 className="text-3xl font-bold text-white mb-2">Exam Controller Portal</h1>
        <p className="text-white">Manage examination seat plans, results, and notifications</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Seat Plans</h3>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.seatPlans}</p>
        </div>

        <div className="bg-blue-50 border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Results</h3>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.results}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Management Tools</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Upload Seat Plan Card */}
          <Link to="/exam/seat-plans" className="block">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Seat Plan</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload PDF seat plans with department, session, and semester details. Students and admins can search with filters.
              </p>
              <div className="text-sm text-green-600 font-medium">
                Manage Seat Plans →
              </div>
            </div>
          </Link>

          {/* Upload Results Card */}
          <Link to="/exam/results" className="block">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Result</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload PDF exam results with title, session, semester, and department. Only admins can access results.
              </p>
              <div className="text-sm text-blue-600 font-medium">
                Manage Results →
              </div>
            </div>
          </Link>

          {/* Send Notification Card */}
          <Link to="/exam/notifications" className="block">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 h-full">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Send Notification</h3>
              <p className="text-sm text-gray-600 mb-3">
                Push notifications to students or admins about exam schedules, seat plans, or important updates.
              </p>
              <div className="text-sm text-orange-600 font-medium">
                Send Now →
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Seat Plan Visibility</h4>
              <p className="text-sm text-blue-800">
                When you upload a seat plan and mark it as visible, students can view and search it using filters (department, session, semester).
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-purple-900 mb-1">Result Access Control</h4>
              <p className="text-sm text-purple-800">
                Results are only accessible by admins. Students cannot view exam results, ensuring proper result publication workflow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
