import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ThemeConfig } from '@/hooks/useWidgetConfigData';
import { Palette, Check } from 'lucide-react';

interface WidgetThemeFormProps {
  themeConfig: ThemeConfig | null;
  onUpdate: (theme: Partial<ThemeConfig>) => Promise<boolean>;
}

const colorPresets = [
  { name: 'Sky Blue', value: '#0ea5e9' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
];

const WidgetThemeForm = ({ themeConfig, onUpdate }: WidgetThemeFormProps) => {
  const [primaryColor, setPrimaryColor] = useState(
    themeConfig?.primary_color || '#0ea5e9'
  );
  const [logoUrl, setLogoUrl] = useState(themeConfig?.logo_url || '');
  const [showChildPax, setShowChildPax] = useState(
    themeConfig?.show_child_pax !== false
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      primary_color: primaryColor,
      logo_url: logoUrl || undefined,
      show_child_pax: showChildPax,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Primary Color */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Primary Color
        </Label>
        <div className="flex flex-wrap gap-2">
          {colorPresets.map((color) => (
            <button
              key={color.value}
              onClick={() => setPrimaryColor(color.value)}
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                backgroundColor: color.value,
                borderColor: primaryColor === color.value ? '#000' : 'transparent',
              }}
              title={color.name}
            >
              {primaryColor === color.value && (
                <Check className="w-5 h-5 text-white" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-12 h-10 p-1 cursor-pointer"
          />
          <Input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#0ea5e9"
            className="flex-1 font-mono"
          />
        </div>
      </div>

      <Separator />

      {/* Logo URL */}
      <div className="space-y-2">
        <Label>Logo URL (Optional)</Label>
        <Input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://your-domain.com/logo.png"
        />
        <p className="text-xs text-muted-foreground">
          Displayed at the top of the widget. Recommended size: 200x50px
        </p>
        {logoUrl && (
          <div className="p-4 bg-muted rounded-lg">
            <img
              src={logoUrl}
              alt="Logo preview"
              className="max-h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Show Child Passengers</Label>
            <p className="text-xs text-muted-foreground">
              Allow customers to select child passengers
            </p>
          </div>
          <Switch
            checked={showChildPax}
            onCheckedChange={setShowChildPax}
          />
        </div>
      </div>

      <Separator />

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Theme Settings'}
      </Button>
    </div>
  );
};

export default WidgetThemeForm;
