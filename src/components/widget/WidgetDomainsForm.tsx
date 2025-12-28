import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Globe } from 'lucide-react';

interface WidgetDomainsFormProps {
  domains: string[] | null;
  onAdd: (domain: string) => Promise<boolean>;
  onRemove: (domain: string) => Promise<boolean>;
}

const WidgetDomainsForm = ({ domains, onAdd, onRemove }: WidgetDomainsFormProps) => {
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newDomain.trim()) return;

    setAdding(true);
    const success = await onAdd(newDomain);
    if (success) {
      setNewDomain('');
    }
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="example.com"
          className="flex-1"
        />
        <Button onClick={handleAdd} disabled={adding || !newDomain.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Only these domains can embed your widget. Leave empty to allow all domains.
      </p>

      {domains && domains.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <Badge
              key={domain}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <Globe className="w-3 h-3" />
              {domain}
              <button
                onClick={() => onRemove(domain)}
                className="ml-1 hover:bg-background/50 rounded p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No domain restrictions - widget can be embedded anywhere
        </div>
      )}
    </div>
  );
};

export default WidgetDomainsForm;
