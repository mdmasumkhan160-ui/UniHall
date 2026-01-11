import React, { useState } from 'react'

export default function DynamicFormRenderer({ schema = [], onSubmit, submitLabel = 'Submit' }) {
  const [form, setForm] = useState({})
  const [files, setFiles] = useState({})
  
  const update = (id, value) => {
    setForm(f => ({ ...f, [id]: value }))
  }
  
  const updateFile = (id, file) => {
    setFiles(prev => ({ ...prev, [id]: file }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Calculate simple score as sum of field scores that have truthy values
    const totalScore = (schema || []).reduce((sum, f) => {
      const v = form[f.id]
      const has = Array.isArray(v) ? v.length > 0 : (v !== undefined && v !== null && String(v).trim() !== '')
      return sum + (has ? (Number(f.score) || 0) : 0)
    }, 0)
    onSubmit?.({ data: form, attachments: files, score: totalScore })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {schema.map(field => (
        <Field 
          key={field.id} 
          field={field} 
          value={form[field.id]}
          fileValue={files[field.id]}
          onChange={(v) => update(field.id, v)} 
          onFileChange={(file) => updateFile(field.id, file)} 
        />
      ))}
      <div>
        <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function Field({ field, value, fileValue, onChange, onFileChange }) {
  const base = 'w-full rounded border border-gray-300 px-3 py-2 text-sm'
  
  if (field.type === 'text' || field.type === 'number' || field.type === 'date') {
    return (
      <label className="grid gap-1">
        <span className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-600"> *</span>}
          {field.score > 0 && <span className="text-xs text-gray-500 ml-2">(Score: {field.score})</span>}
        </span>
        <input 
          type={field.type === 'number' ? 'number' : field.type}
          className={base}
          required={field.required}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)} 
        />
        {field.requiresDocument && (
          <div className="mt-2">
            <label className="text-xs text-gray-600 block mb-1">
              {field.documentLabel || 'Upload Document'}
            </label>
            <input 
              type="file" 
              className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              onChange={(e) => onFileChange?.(e.target.files?.[0] || null)} 
            />
            {fileValue && (
              <p className="text-xs text-green-600 mt-1">✓ {fileValue.name}</p>
            )}
          </div>
        )}
      </label>
    )
  }
  
  if (field.type === 'dropdown') {
    return (
      <label className="grid gap-1">
        <span className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-600"> *</span>}
          {field.score > 0 && <span className="text-xs text-gray-500 ml-2">(Score: {field.score})</span>}
        </span>
        <select 
          className={base} 
          required={field.required}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>Select an option...</option>
          {(field.options || []).map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {field.requiresDocument && (
          <div className="mt-2">
            <label className="text-xs text-gray-600 block mb-1">
              {field.documentLabel || 'Upload Document'}
            </label>
            <input 
              type="file" 
              className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              onChange={(e) => onFileChange?.(e.target.files?.[0] || null)} 
            />
            {fileValue && (
              <p className="text-xs text-green-600 mt-1">✓ {fileValue.name}</p>
            )}
          </div>
        )}
      </label>
    )
  }
  
  if (field.type === 'checkbox') {
    const arr = Array.isArray(value) ? value : []
    const toggle = (opt) => {
      if (arr.includes(opt)) {
        onChange(arr.filter(o => o !== opt))
      } else {
        onChange([...arr, opt])
      }
    }
    return (
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-600"> *</span>}
          {field.score > 0 && <span className="text-xs text-gray-500 ml-2">(Score: {field.score})</span>}
        </legend>
        <div className="flex flex-wrap gap-3">
          {(field.options || []).map(opt => (
            <label key={opt} className="inline-flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={arr.includes(opt)} 
                onChange={() => toggle(opt)} 
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        {field.requiresDocument && (
          <div className="mt-2">
            <label className="text-xs text-gray-600 block mb-1">
              {field.documentLabel || 'Upload Document'}
            </label>
            <input 
              type="file" 
              className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              onChange={(e) => onFileChange?.(e.target.files?.[0] || null)} 
            />
            {fileValue && (
              <p className="text-xs text-green-600 mt-1">✓ {fileValue.name}</p>
            )}
          </div>
        )}
      </fieldset>
    )
  }
  
  return null
}
