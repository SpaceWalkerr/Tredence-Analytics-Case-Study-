import { Plus, Trash2 } from 'lucide-react';
import type { KeyValue } from '../types/workflow';

type Props = {
  label: string;
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
};

const makeRow = (): KeyValue => ({
  id: Math.random().toString(36).slice(2, 9),
  key: '',
  value: '',
});

export function KeyValueEditor({ label, rows, onChange }: Props) {
  return (
    <div className="field-group">
      <div className="form-row-heading">
        <label>{label}</label>
        <button type="button" className="mini-button" onClick={() => onChange([...rows, makeRow()])}>
          <Plus size={14} />
          Add
        </button>
      </div>
      <div className="kv-list">
        {rows.map((row) => (
          <div className="kv-row" key={row.id}>
            <input
              aria-label="Key"
              placeholder="Key"
              value={row.key}
              onChange={(event) =>
                onChange(rows.map((item) => (item.id === row.id ? { ...item, key: event.target.value } : item)))
              }
            />
            <input
              aria-label="Value"
              placeholder="Value"
              value={row.value}
              onChange={(event) =>
                onChange(rows.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item)))
              }
            />
            <button
              className="icon-button icon-button--small"
              type="button"
              title="Remove field"
              onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
