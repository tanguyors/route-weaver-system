import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ActivityThemeConfig } from '@/hooks/useActivityWidgetConfigData';
import { Palette, Check } from 'lucide-react';

interface ActivityWidgetThemeFormProps {
  themeConfig: ActivityThemeConfig | null;
  onUpdate: (theme: Partial<ActivityThemeConfig>) => Promise<boolean>;
}

const colorPresets = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky Blue', value: '#0ea5e9' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

const ColorPicker = ({ label, value, onChange, description }: ColorPickerProps) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 p-1 cursor-pointer"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 font-mono"
      />
    </div>
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
  </div>
);

const ActivityWidgetThemeForm = ({ themeConfig, onUpdate }: ActivityWidgetThemeFormProps) => {
  const [primaryColor, setPrimaryColor] = useState(
    themeConfig?.primary_color || '#10b981'
  );
  const [secondaryColor, setSecondaryColor] = useState(
    themeConfig?.secondary_color || '#64748b'
  );
  const [backgroundColor, setBackgroundColor] = useState(
    themeConfig?.background_color || '#ffffff'
  );
  const [textColor, setTextColor] = useState(
    themeConfig?.text_color || '#1e293b'
  );
  const [buttonTextColor, setButtonTextColor] = useState(
    themeConfig?.button_text_color || '#ffffff'
  );
  const [borderColor, setBorderColor] = useState(
    themeConfig?.border_color || '#e2e8f0'
  );
  const [logoUrl, setLogoUrl] = useState(themeConfig?.logo_url || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      background_color: backgroundColor,
      text_color: textColor,
      button_text_color: buttonTextColor,
      border_color: borderColor,
      logo_url: logoUrl || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Primary Color with Presets */}
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
            placeholder="#10b981"
            className="flex-1 font-mono"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Used for buttons, links, and accent elements
        </p>
      </div>

      <Separator />

      {/* Other Colors */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ColorPicker
          label="Secondary Color"
          value={secondaryColor}
          onChange={setSecondaryColor}
          description="Icons and secondary elements"
        />
        <ColorPicker
          label="Background Color"
          value={backgroundColor}
          onChange={setBackgroundColor}
          description="Widget background"
        />
        <ColorPicker
          label="Text Color"
          value={textColor}
          onChange={setTextColor}
          description="Main text color"
        />
        <ColorPicker
          label="Button Text Color"
          value={buttonTextColor}
          onChange={setButtonTextColor}
          description="Text on primary buttons"
        />
        <ColorPicker
          label="Border Color"
          value={borderColor}
          onChange={setBorderColor}
          description="Borders and dividers"
        />
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

      {/* Preview */}
      <div className="space-y-3">
        <Label>Color Preview</Label>
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: backgroundColor,
            borderColor: borderColor,
          }}
        >
          <p style={{ color: textColor }} className="font-medium mb-2">
            Sample Activity
          </p>
          <p style={{ color: secondaryColor }} className="text-sm mb-3">
            Experience description
          </p>
          <button
            className="px-4 py-2 rounded-md font-medium"
            style={{
              backgroundColor: primaryColor,
              color: buttonTextColor,
            }}
          >
            Book Now
          </button>
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

export default ActivityWidgetThemeForm;
