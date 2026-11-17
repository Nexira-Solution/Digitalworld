'use client';

import { Plus, Trash2 } from 'lucide-react';

// Renders the type-specific inputs (brand, warranty, FSSAI, ...) plus the optional
// key/value spec table. Style-agnostic: pass your form's classes/styles so it looks
// native in both the admin form and the seller form.
export default function ProductTypeFields({
  type,
  fields: customFields,
  attributes = {},
  specs = [],
  onAttr,
  onSpecs,
  inputClassName = '',
  inputStyle = {},
  labelClassName = '',
  labelStyle = {},
}) {
  const renderedFields = customFields && customFields.length ? customFields : type?.fields || [];
  if (!renderedFields.length && !type?.specs) return null;

  const input = { className: inputClassName, style: inputStyle };
  const setSpec = (i, k, v) => onSpecs(specs.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));

  return (
    <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
      {renderedFields.map((f) => (
        <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
          <label className={labelClassName} style={labelStyle}>
            {f.label}{f.required ? ' *' : ''}
          </label>
          {f.type === 'select' ? (
            <select
              {...input}
              required={f.required}
              value={attributes[f.key] || ''}
              onChange={(e) => onAttr(f.key, e.target.value)}
            >
              <option value="">Select…</option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea
              {...input}
              rows={2}
              required={f.required}
              value={attributes[f.key] || ''}
              onChange={(e) => onAttr(f.key, e.target.value)}
            />
          ) : (
            <input
              {...input}
              type={f.type === 'number' ? 'number' : 'text'}
              required={f.required}
              placeholder={f.placeholder || ''}
              value={attributes[f.key] || ''}
              onChange={(e) => onAttr(f.key, e.target.value)}
            />
          )}
        </div>
      ))}

      {type?.specs && (
        <div className="sm:col-span-2">
          <label className={labelClassName} style={labelStyle}>
            Technical Specifications / Nutrition
          </label>
          {specs.map((s, i) => (
            <div key={i} className="flex gap-2 mt-2 items-center">
              <input
                {...input}
                placeholder="e.g. Battery / Energy"
                value={s.key}
                onChange={(e) => setSpec(i, 'key', e.target.value)}
              />
              <input
                {...input}
                placeholder="e.g. 5000 mAh / 450 kcal"
                value={s.value}
                onChange={(e) => setSpec(i, 'value', e.target.value)}
              />
              <button
                type="button"
                onClick={() => onSpecs(specs.filter((_, idx) => idx !== i))}
                aria-label="Remove specification"
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onSpecs([...specs, { key: '', value: '' }])}
            className="flex items-center gap-1 mt-2 text-sm underline font-medium"
          >
            <Plus size={13} /> Add specification
          </button>
        </div>
      )}
    </div>
  );
}
