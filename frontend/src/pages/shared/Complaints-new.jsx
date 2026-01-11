import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import * as api from '../../lib/mockApi.js'

export default function Complaints() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(user.role === 'student' ? 'file' : 'review')
  
  if (user.role === 'examcontroller') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">No Access</h2>
        <p className="text-gray-600 mt-2">Exam controllers do not have access to the complaints system.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        <p className="text-gray-600">Hall-specific complaint management system</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {user.role === 'student' && (
            <>
              <button
                onClick={() => setActiveTab('file')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'file'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 File Complaint
              </button>
              <button
                onClick={() => setActiveTab('my-complaints')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-complaints'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 My Complaints
              </button>
            </>
          )}
          
          {(user.role === 'admin' || user.role === 'staff') && (
            <button
              onClick={() => setActiveTab('review')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'review'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔍 Review Complaints
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'file' && user.role === 'student' && <FileComplaintTab user={user} />}
      {activeTab === 'my-complaints' && user.role === 'student' && <MyComplaintsTab user={user} />}
      {activeTab === 'review' && (user.role === 'admin' || user.role === 'staff') && <ReviewComplaintsTab user={user} />}
    </div>
  )
}

function FileComplaintTab({ user }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState([])

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return alert('Title and description are required')
    
    try {
      api.createComplaint({ 
        userId: user.id, 
        title, 
        body, 
        attachments 
      })
      setTitle('')
      setBody('')
      setAttachments([])
      alert('Complaint filed successfully!')
      window.location.reload()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const fileNames = files.map(f => f.name)
    setAttachments(fileNames)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">File a New Complaint</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Brief title of your complaint"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea 
            value={body} 
            onChange={e => setBody(e.target.value)} 
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed description of the issue..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
          <input 
            type="file" 
            multiple 
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {attachments.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {attachments.length} file(s) attached: {attachments.join(', ')}
            </div>
          )}
        </div>
        
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          Submit Complaint
        </button>
      </form>
    </div>
  )
}

function MyComplaintsTab({ user }) {
  const myComplaints = api.listComplaints({ userId: user.id })
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">My Complaints</h2>
      
      {myComplaints.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">You haven't filed any complaints yet.</p>
        </div>
      ) : (
        myComplaints.map(c => (
          <ComplaintCard key={c.id} complaint={c} isStudent={true} />
        ))
      )}
    </div>
  )
}

function ReviewComplaintsTab({ user }) {
  const [reviewNotes, setReviewNotes] = useState({})
  const hallComplaints = api.listComplaints({ hallId: user.hallId })
  
  const update = (id, status) => {
    const notes = reviewNotes[id] || ''
    api.updateComplaintStatus(id, status, user.id, notes)
    setReviewNotes({ ...reviewNotes, [id]: '' })
    window.location.reload()
  }
  
  const handleNotesChange = (id, value) => {
    setReviewNotes({ ...reviewNotes, [id]: value })
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Review Complaints</h2>
      
      {hallComplaints.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">No complaints to review.</p>
        </div>
      ) : (
        hallComplaints.map(c => (
          <div key={c.id} className="bg-white rounded-lg shadow p-6 space-y-4">
            <ComplaintCard complaint={c} isStudent={false} />
            
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Response Notes</label>
              <textarea 
                value={reviewNotes[c.id] || ''}
                onChange={e => handleNotesChange(c.id, e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                placeholder="Add your response or notes..."
              />
              
              <div className="flex gap-2">
                {c.status === 'Open' && (
                  <button 
                    onClick={() => update(c.id, 'In Progress')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Mark In Progress
                  </button>
                )}
                {c.status === 'In Progress' && (
                  <button 
                    onClick={() => update(c.id, 'Resolved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                )}
                {c.status === 'Resolved' && (
                  <button 
                    onClick={() => update(c.id, 'Closed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close Complaint
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function ComplaintCard({ complaint, isStudent }) {
  const statusColors = {
    Open: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    Resolved: 'bg-green-100 text-green-800',
    Closed: 'bg-gray-100 text-gray-800'
  }
  
  const user = api.getUserById(complaint.userId)
  const reviewer = complaint.reviewedBy ? api.getUserById(complaint.reviewedBy) : null
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
          <div className="text-sm text-gray-500 mt-1">
            Filed by: {user?.name || 'Unknown'} • {new Date(complaint.createdAt).toLocaleDateString()}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[complaint.status]}`}>
          {complaint.status}
        </span>
      </div>
      
      <p className="text-gray-700 mb-3">{complaint.body}</p>
      
      {complaint.attachments?.length > 0 && (
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700">Attachments:</span>
          <div className="text-sm text-blue-600 mt-1">
            {complaint.attachments.join(', ')}
          </div>
        </div>
      )}
      
      {complaint.reviewNotes && (
        <div className="bg-gray-50 rounded-lg p-4 mt-3">
          <div className="text-sm font-medium text-gray-700 mb-1">
            Response from {reviewer?.name || 'Administration'}:
          </div>
          <p className="text-gray-700 text-sm">{complaint.reviewNotes}</p>
        </div>
      )}
    </div>
  )
}
