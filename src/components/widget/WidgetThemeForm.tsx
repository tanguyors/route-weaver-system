import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ThemeConfig, WidgetStyle } from '@/hooks/useWidgetConfigData';
import { Palette, Check, LayoutGrid, GripHorizontal, MapPin, Calendar, Users, Ship, Anchor, ArrowRight, Search } from 'lucide-react';

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

// Realistic Widget Preview Component
interface WidgetPreviewProps {
  style: WidgetStyle;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonTextColor: string;
  borderColor: string;
  logoUrl: string;
}

const WidgetPreview = ({
  style,
  primaryColor,
  secondaryColor,
  backgroundColor,
  textColor,
  buttonTextColor,
  borderColor,
  logoUrl,
}: WidgetPreviewProps) => {
  if (style === 'bar') {
    return (
      <div
        className="rounded-lg p-4 shadow-lg"
        style={{ backgroundColor, borderColor, border: `1px solid ${borderColor}` }}
      >
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="h-6 mb-3 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
        )}
        <p className="text-sm font-semibold mb-3" style={{ color: textColor }}>Book Your Tickets!</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[100px]">
            <p className="text-xs mb-1" style={{ color: secondaryColor }}>From</p>
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: `${borderColor}40`, color: textColor, border: `1px solid ${borderColor}` }}>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" style={{ color: secondaryColor }} /> Sanur</span>
            </div>
          </div>
          <div className="flex-1 min-w-[100px]">
            <p className="text-xs mb-1" style={{ color: secondaryColor }}>To</p>
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: `${borderColor}40`, color: textColor, border: `1px solid ${borderColor}` }}>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" style={{ color: secondaryColor }} /> Nusa Penida</span>
            </div>
          </div>
          <div className="flex-1 min-w-[80px]">
            <p className="text-xs mb-1" style={{ color: secondaryColor }}>Date</p>
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: `${borderColor}40`, color: textColor, border: `1px solid ${borderColor}` }}>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" style={{ color: secondaryColor }} /> Jan 15</span>
            </div>
          </div>
          <div className="flex-1 min-w-[60px]">
            <p className="text-xs mb-1" style={{ color: secondaryColor }}>Pax</p>
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: `${borderColor}40`, color: textColor, border: `1px solid ${borderColor}` }}>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" style={{ color: secondaryColor }} /> 2</span>
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-md font-medium text-sm flex items-center gap-1"
            style={{ backgroundColor: primaryColor, color: buttonTextColor }}
          >
            <Search className="h-4 w-4" /> Search
          </button>
        </div>
      </div>
    );
  }

  // Block widget preview
  return (
    <div
      className="rounded-lg shadow-lg overflow-hidden"
      style={{ backgroundColor, border: `1px solid ${borderColor}` }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
        ) : (
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5" style={{ color: primaryColor }} />
            <span className="font-bold" style={{ color: textColor }}>Fast Boat Booking</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2" style={{ color: textColor }}>
          <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
          <span className="font-medium">Book Your Trip</span>
        </div>

        {/* Service Type Toggle */}
        <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: `${borderColor}60` }}>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium" style={{ backgroundColor: primaryColor, color: buttonTextColor }}>
            <Ship className="h-3 w-3" /> Public Ferry
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium" style={{ color: secondaryColor }}>
            <Anchor className="h-3 w-3" /> Private Boat
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <div>
            <p className="text-xs mb-1" style={{ color: secondaryColor }}>From</p>
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: `${borderColor}30`, color: textColor, border: `1px solid ${borderColor}` }}>
              Select departure port
            </div>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: secondaryColor }}>To</p>
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: `${borderColor}30`, color: textColor, border: `1px solid ${borderColor}` }}>
              Select destination
            </div>
          </div>
          <div>
            <p className="text-xs mb-1 flex items-center gap-1" style={{ color: secondaryColor }}>
              <Calendar className="h-3 w-3" /> Travel Date
            </p>
            <div className="px-3 py-2 rounded text-sm" style={{ backgroundColor: `${borderColor}30`, color: textColor, border: `1px solid ${borderColor}` }}>
              2026-01-15
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          className="w-full px-4 py-3 rounded-md font-medium flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor, color: buttonTextColor }}
        >
          Find Departures <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const WidgetThemeForm = ({ themeConfig, onUpdate }: WidgetThemeFormProps) => {
  const [widgetStyle, setWidgetStyle] = useState<WidgetStyle>(
    themeConfig?.widget_style || 'block'
  );
  const [primaryColor, setPrimaryColor] = useState(
    themeConfig?.primary_color || '#0ea5e9'
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
  const [showChildPax, setShowChildPax] = useState(
    themeConfig?.show_child_pax !== false
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({
      widget_style: widgetStyle,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      background_color: backgroundColor,
      text_color: textColor,
      button_text_color: buttonTextColor,
      border_color: borderColor,
      logo_url: logoUrl || undefined,
      show_child_pax: showChildPax,
    });
    setSaving(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Settings Column */}
      <div className="space-y-6">
        {/* Widget Style Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Widget Style</Label>
          <RadioGroup
            value={widgetStyle}
            onValueChange={(value) => setWidgetStyle(value as WidgetStyle)}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="style-block"
              className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                widgetStyle === 'block'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="block" id="style-block" className="sr-only" />
              <div className="w-16 h-20 border-2 rounded-lg flex items-center justify-center" style={{ borderColor: widgetStyle === 'block' ? primaryColor : undefined }}>
                <LayoutGrid className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Block Widget</p>
                <p className="text-xs text-muted-foreground">Full booking form</p>
              </div>
            </Label>

            <Label
              htmlFor="style-bar"
              className={`flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                widgetStyle === 'bar'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="bar" id="style-bar" className="sr-only" />
              <div className="w-24 h-10 border-2 rounded-lg flex items-center justify-center" style={{ borderColor: widgetStyle === 'bar' ? primaryColor : undefined }}>
                <GripHorizontal className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Bar Widget</p>
                <p className="text-xs text-muted-foreground">Compact horizontal</p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        <Separator />

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
              placeholder="#0ea5e9"
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

      {/* Live Preview Column */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Live Preview</Label>
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
            {widgetStyle === 'block' ? 'Block Widget' : 'Bar Widget'}
          </span>
        </div>
        <div className="bg-muted/30 rounded-xl p-6 min-h-[400px] flex items-start justify-center">
          <div className={widgetStyle === 'bar' ? 'w-full max-w-2xl' : 'w-full max-w-sm'}>
            <WidgetPreview
              style={widgetStyle}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              backgroundColor={backgroundColor}
              textColor={textColor}
              buttonTextColor={buttonTextColor}
              borderColor={borderColor}
              logoUrl={logoUrl}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          ↑ Preview updates in real-time as you change colors
        </p>
      </div>
    </div>
  );
};

export default WidgetThemeForm;
