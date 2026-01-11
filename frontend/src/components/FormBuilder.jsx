import React, { useEffect, useState } from 'react'

const fieldTypes = ['text','number','date','dropdown','checkbox']

const makeFieldId = () => `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`

const normalizeFieldType = (type) => {
  switch (type) {
    case 'text':
    case 'number':
    case 'date':
    case 'dropdown':
    case 'checkbox':
      return type
    case 'select':
      return 'dropdown'
    default:
      return 'text'
  }
}

const toOptionsArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(Boolean)
  }
  return []
}

const normalizeField = (field, idx) => {
  const type = normalizeFieldType(field.type)
  const options = (type === 'dropdown' || type === 'checkbox') ? toOptionsArray(field.options) : []
  const optionsText = (type === 'dropdown' || type === 'checkbox')
    ? (typeof field.optionsText === 'string' ? field.optionsText : options.join(', '))
    : ''
  const parsedScore = Number(field.score ?? 0)
  const requiresDocument = Boolean(field.requiresDocument ?? field.documentRequired)
  const requirementRaw = field.documentRequirement || (requiresDocument ? 'MANDATORY' : 'RECOMMENDED')
  const documentRequirement = String(requirementRaw).toUpperCase() === 'RECOMMENDED' ? 'RECOMMENDED' : 'MANDATORY'
  return {
    id: field.id || makeFieldId(),
    label: field.label || `Field ${idx + 1}`,
    type,
    required: Boolean(field.required),
    options,
    optionsText,
    score: Number.isNaN(parsedScore) ? 0 : parsedScore,
    requiresDocument,
    documentLabel: field.documentLabel || field.documentUploadLabel || '',
    documentRequirement,
    displayOrder: Number.isFinite(field.displayOrder) ? field.displayOrder : idx
  }
}

const blankField = () => normalizeField({
  label: 'New Field',
  type: 'text',
  required: false,
  options: [],
  optionsText: '',
  score: 0,
  requiresDocument: false,
  documentLabel: '',
  documentRequirement: 'MANDATORY'
}, 0)

const normalizeSchema = (schema) => (Array.isArray(schema) ? schema : []).map(normalizeField)

const normalizeSessionList = (input) => {
  if (Array.isArray(input)) {
    return input.map(item => String(item || '').trim()).filter(Boolean)
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
  }
  return []
}

const sessionListToText = (list) => normalizeSessionList(list).join(', ')

export default function FormBuilder({ form, onSave, disabled = false }) {
  const [name, setName] = useState(form?.name || '')
  const [schema, setSchema] = useState(() => normalizeSchema(form?.schema || form?.fields || []))
  const [active, setActive] = useState(form?.active || false)
  const [sessionInput, setSessionInput] = useState(() => sessionListToText(form?.sessionYears || form?.sessionYear || []))

  useEffect(() => {
    setName(form?.name || '')
    setSchema(normalizeSchema(form?.schema || form?.fields || []))
    setActive(form?.active || false)
    setSessionInput(sessionListToText(form?.sessionYears || form?.sessionYear || []))
  }, [form])

  const addField = () => setSchema(s => [...s, blankField()])
  const updateField = (id, patch) => setSchema(s => s.map(f => f.id === id ? { ...f, ...patch } : f))
  const removeField = (id) => setSchema(s => s.filter(f => f.id !== id))

  const save = (e) => {
    e.preventDefault()
    const cleanedSchema = schema.map((field, index) => {
      const next = {
        ...field,
        options: (field.type === 'dropdown' || field.type === 'checkbox') ? [...(field.options || [])] : [],
        optionsText: undefined,
        displayOrder: index,
        documentRequirement: field.requiresDocument
          ? (field.documentRequirement === 'RECOMMENDED' ? 'RECOMMENDED' : 'MANDATORY')
          : 'RECOMMENDED'
      }
      if (!field.requiresDocument) {
        next.documentLabel = ''
      }
      return next
    })
    onSave?.({
      id: form?.id,
      name,
      active,
      sessionYears: normalizeSessionList(sessionInput),
      schema: cleanedSchema
    })
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Applicable Sessions</span>
        <input
          className="border rounded px-3 py-2"
          placeholder="2021-2022, 2022-2023"
          value={sessionInput}
          onChange={e => setSessionInput(e.target.value)}
          disabled={disabled}
        />
        <span className="text-xs text-gray-500">Separate multiple sessions with commas.</span>
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Form Name</span>
        <input
          className="border rounded px-3 py-2"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={disabled}
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={active}
          onChange={e => setActive(e.target.checked)}
          disabled={disabled}
        /> Active
      </label>

      <div className="grid gap-3">
        {schema.map((f, idx) => (
          <div key={f.id} className="border rounded p-3 grid gap-3">
            <div className="grid sm:grid-cols-2 gap-2">
              <input 
                className="border rounded px-3 py-2" 
                placeholder="Field Label"
                value={f.label} 
                onChange={e => updateField(f.id, { label: e.target.value })}
                disabled={disabled}
              />
              <select 
                className="border rounded px-3 py-2" 
                value={f.type} 
                onChange={e => {
                  const nextType = e.target.value
                  if (nextType === 'dropdown' || nextType === 'checkbox') {
                    updateField(f.id, { type: nextType })
                  } else {
                    updateField(f.id, { type: nextType, options: [], optionsText: '' })
                  }
                }}
                disabled={disabled}
              >
                {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            {/* Options for dropdown and checkbox */}
            {(f.type === 'dropdown' || f.type === 'checkbox') && (
              <div>
                <label className="block text-sm text-gray-700 mb-1">Options (comma-separated)</label>
                <input 
                  className="border rounded px-3 py-2 w-full" 
                  placeholder="e.g., Option 1, Option 2, Option 3"
                  value={f.optionsText ?? ''} 
                  onChange={e => {
                    const text = e.target.value
                    const options = text.split(',').map(x => x.trim()).filter(Boolean)
                    updateField(f.id, { options, optionsText: text })
                  }}
                  onBlur={e => {
                    const text = e.target.value
                    const options = text.split(',').map(x => x.trim()).filter(Boolean)
                    updateField(f.id, { options, optionsText: text })
                  }}
                  disabled={disabled}
                />
              </div>
            )}
            
            <div className="grid sm:grid-cols-2 gap-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={e => updateField(f.id, { required: e.target.checked })}
                  disabled={disabled}
                /> 
                Required Field
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.requiresDocument}
                  onChange={e => {
                    const enabled = e.target.checked
                    updateField(f.id, {
                      requiresDocument: enabled,
                      documentRequirement: enabled ? (f.documentRequirement || 'MANDATORY') : 'RECOMMENDED'
                    })
                  }}
                  disabled={disabled}
                /> 
                Requires Document Upload
              </label>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Document Label (if required)</label>
                <input 
                  className="border rounded px-3 py-2 w-full" 
                  placeholder="e.g., Upload your certificate"
                  value={f.documentLabel || ''} 
                  onChange={e => updateField(f.id, { documentLabel: e.target.value })} 
                  disabled={!f.requiresDocument || disabled}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Document Requirement</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={f.documentRequirement || 'MANDATORY'}
                  onChange={e => updateField(f.id, { documentRequirement: e.target.value })}
                  disabled={!f.requiresDocument || disabled}
                >
                  <option value="MANDATORY">Must upload</option>
                  <option value="RECOMMENDED">Optional (recommended)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Score (0-100)</label>
                <input 
                  className="border rounded px-3 py-2 w-full" 
                  type="number" 
                  min="0"
                  max="100"
                  placeholder="0" 
                  value={f.score ?? 0} 
                  onChange={e => updateField(f.id, { score: Number(e.target.value) })}
                  disabled={disabled}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs text-gray-500">Field #{idx + 1}</span>
              <button 
                type="button" 
                onClick={() => removeField(f.id)} 
                className="text-sm text-red-600 hover:text-red-700 font-medium"
                disabled={disabled}
              >
                🗑️ Remove Field
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addField}
          className="px-3 py-2 border-2 border-dashed border-gray-300 rounded text-sm hover:border-blue-400 hover:bg-blue-50 transition-colors"
          disabled={disabled}
        >
          + Add New Field
        </button>
      </div>

      <div>
        <button
          className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-60"
          disabled={disabled}
        >
          Save Form
        </button>
      </div>
    </form>
  )
}
