// Editor form for configuring logical criteria blocks
import React from 'react'
import type { RuleBlock } from '../../types/strategy.types'

interface RuleBlockEditorProps {
  rules: RuleBlock[]
  onChange: (rules: RuleBlock[]) => void
}

export function RuleBlockEditor({ rules, onChange }: RuleBlockEditorProps) {
  const addRule = () => {
    const newRule: RuleBlock = {
      id: Math.random().toString(),
      field: 'volumeRatio',
      operator: '>=',
      value: 1.5,
    };
    onChange([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {rules.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No rule blocks defined. Click below to add your first check block.</p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center space-x-2 bg-muted/40 p-3 rounded-lg border border-border">
              <span className="text-xs font-semibold text-foreground uppercase">{rule.field}</span>
              <span className="text-xs font-semibold text-muted-foreground">{rule.operator}</span>
              <span className="text-xs font-semibold text-foreground">{rule.value}</span>
              <button
                type="button"
                onClick={() => removeRule(rule.id)}
                className="ml-auto text-xs text-rose-500 hover:underline focus:outline-none cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={addRule}
        className="w-full py-1.5 border border-dashed border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
      >
        + Add Rule Block
      </button>
    </div>
  );
}
export default RuleBlockEditor
