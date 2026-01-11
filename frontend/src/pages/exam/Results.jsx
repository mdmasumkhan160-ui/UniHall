import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { 
  uploadExamResult, 
  getExamResults, 
  updateExamResultVisibility, 
  deleteExamResult,
  getFilterOptions,
  fileToBase64,
  validatePDF 
} from '../../lib/examApi'

export default function Results() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    semester: '',
    academicYear: '',
    department: '',
    title: '',
    description: '',
    isVisible: false
  })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOptions, setFilterOptions] = useState({ departments: [], academicYears: [], semesters: [] })
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    try {
      const [resultsRes, filtersRes] = await Promise.all([
        getExamResults(),
        getFilterOptions()
      ])
      setResults(resultsRes.data || [])
      setFilterOptions(filtersRes.data || { departments: [], academicYears: [], semesters: [] })
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Failed to load results: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      try {
        validatePDF(selectedFile)
        setFile(selectedFile)
      } catch (error) {
        alert(error.message)
        e.target.value = null
      }
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      alert('Please select a PDF file')
      return
    }
    
    setUploading(true)
    try {
      const fileData = await fileToBase64(file)
      
      await uploadExamResult({
        ...formData,
        fileName: file.name,
        fileType: file.type,
        fileData
      })
      
      alert('Exam result uploaded successfully!')
      
      // Reset form
      setFormData({
        semester: '',
        academicYear: '',
        department: '',
        title: '',
        description: '',
        isVisible: false
      })
      setFile(null)
      document.getElementById('resultUpload').value = null
      
      // Reload list
      loadData()

      // Notify dashboard to refresh stats
      try {
        window.dispatchEvent(new Event('examStatsChanged'))
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploading(false)
    }
  }
  
  const handleToggleVisibility = async (resultId, currentVisibility) => {
    if (!confirm(`Are you sure you want to ${currentVisibility ? 'hide' : 'publish'} this result?`)) {
      return
    }
    
    try {
      await updateExamResultVisibility(resultId, !currentVisibility)
      alert(`Result ${!currentVisibility ? 'published' : 'hidden'} successfully!`)
      loadData()
      try { window.dispatchEvent(new Event('examStatsChanged')) } catch (e) {}
    } catch (error) {
      alert('Failed to update visibility: ' + (error.response?.data?.message || error.message))
    }
  }
  
  const handleDelete = async (resultId) => {
    if (!confirm('Are you sure you want to delete this result? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteExamResult(resultId)
      alert('Result deleted successfully!')
      loadData()
      try { window.dispatchEvent(new Event('examStatsChanged')) } catch (e) {}
    } catch (error) {
      alert('Failed to delete: ' + (error.response?.data?.message || error.message))
    }
  }
  
  return (
    <div className="grid gap-6">
      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Upload Exam Result</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Result Title *
            </label>
            <input 
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="e.g., Final Exam Results - Spring 2025"
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Semester *
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.semester}
              onChange={e => setFormData({...formData, semester: e.target.value})}
              required
            >
              <option value="">Select Semester</option>
              {filterOptions.semesters.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Academic Year *
            </label>
            <input 
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="e.g., 2025"
              value={formData.academicYear} 
              onChange={e => setFormData({...formData, academicYear: e.target.value})} 
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Department *
            </label>
            <input 
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="e.g., Computer Science"
              value={formData.department} 
              onChange={e => setFormData({...formData, department: e.target.value})} 
              required
              list="departments-results"
            />
            <datalist id="departments-results">
              {filterOptions.departments.map(d => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload PDF *
            </label>
            <input 
              type="file" 
              accept=".pdf"
              onChange={handleFileChange}
              id="resultUpload"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea 
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="Additional details about the results..."
              rows="2"
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={formData.isVisible}
                onChange={e => setFormData({...formData, isVisible: e.target.checked})}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Make visible to admins immediately (Results are never visible to students)
              </span>
            </label>
          </div>
        </div>
        
        <button 
          type="submit"
          disabled={uploading}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Result'}
        </button>
      </form>
      
      {/* List of Uploaded Results */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-gray-900">Uploaded Results</h3>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-gray-500">No results uploaded yet.</p>
        ) : (
          <ul className="grid gap-3">
            {results.map(result => (
              <li key={result.resultId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{result.title}</p>
                    <p className="text-xs text-gray-500">
                      {result.department} • {result.semester} {result.academicYear}
                    </p>
                    <p className="text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${result.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {result.isVisible ? 'Visible to Admins' : 'Hidden'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${result.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    View
                  </a>
                  <button 
                    onClick={() => handleToggleVisibility(result.resultId, result.isVisible)}
                    className="px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium"
                  >
                    {result.isVisible ? 'Hide' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => handleDelete(result.resultId)}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
