import { useState } from 'react';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAccommodationsData } from '@/hooks/useAccommodationsData';
import { useAccommodationIcalData } from '@/hooks/useAccommodationIcalData';
import { toast } from '@/hooks/use-toast';
import { Copy, Plus, RefreshCw, Trash2, ExternalLink, CheckCircle, XCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

const AccommodationIcalSyncPage = () => {
  const { accommodations, loading: accLoading } = useAccommodationsData();
  const [selectedAccId, setSelectedAccId] = useState<string>('');
  const selectedAcc = accommodations.find(a => a.id === selectedAccId);

  const { icalImports, loading, syncing, createIcalImport, deleteIcalImport, toggleIcalImport, triggerSync } = useAccommodationIcalData(selectedAccId || null);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPlatform, setNewPlatform] = useState('airbnb');
  const [newUrl, setNewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-select first accommodation
  if (!selectedAccId && accommodations.length > 0) {
    setSelectedAccId(accommodations[0].id);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const exportUrl = selectedAcc ? `${supabaseUrl}/functions/v1/generate-ical-export?token=${selectedAcc.ical_token}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(exportUrl);
    toast({ title: 'Link copied!', description: 'iCal export URL copied to clipboard.' });
  };

  const handleAddImport = async () => {
    if (!newUrl.trim()) return;
    setSubmitting(true);
    try {
      await createIcalImport({ platform_name: newPlatform, ical_url: newUrl.trim() });
      toast({ title: 'Import added', description: 'iCal import source has been added.' });
      setShowAddDialog(false);
      setNewUrl('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async () => {
    try {
      await triggerSync();
      toast({ title: 'Sync completed', description: 'Calendar has been synchronized.' });
    } catch {
      toast({ title: 'Sync failed', description: 'Check import URLs and try again.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIcalImport(id);
      toast({ title: 'Import deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleIcalImport(id, isActive);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">iCal Sync</h1>
          <p className="text-muted-foreground">Synchronize calendars with Airbnb, Booking, and more</p>
        </div>

        {/* Accommodation Selector */}
        <div className="max-w-sm">
          <Label>Select Accommodation</Label>
          <Select value={selectedAccId} onValueChange={setSelectedAccId}>
            <SelectTrigger>
              <SelectValue placeholder="Select accommodation" />
            </SelectTrigger>
            <SelectContent>
              {accommodations.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAcc && (
          <>
            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Export iCal
                </CardTitle>
                <CardDescription>Share this link with other platforms to sync your Sribooking calendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={exportUrl} readOnly className="font-mono text-xs" />
                  <Button onClick={handleCopyLink} variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Connect Sribooking with Airbnb / Booking</span>
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-1 ml-6 list-decimal">
                    <li>Open your Airbnb or Booking.com listing</li>
                    <li>Go to Calendar → Import Calendar</li>
                    <li>Paste the link above</li>
                  </ol>
                  <p className="text-xs text-muted-foreground italic">This is done once only. Sribooking keeps everything in sync.</p>
                </div>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <RefreshCw className="h-5 w-5" />
                      Import iCal
                    </CardTitle>
                    <CardDescription>Import calendars from other platforms to block dates automatically</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing || icalImports.length === 0}>
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                    <Button size="sm" onClick={() => setShowAddDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Import
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : icalImports.length === 0 ? (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground text-sm">No iCal imports configured yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {icalImports.map(imp => (
                      <div key={imp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">{imp.platform_name}</Badge>
                            {imp.last_sync_status === 'success' && (
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" /> OK
                              </Badge>
                            )}
                            {imp.last_sync_status === 'error' && (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" /> Error
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-md">{imp.ical_url}</p>
                          {imp.last_sync_at && (
                            <p className="text-xs text-muted-foreground">
                              Last sync: {format(new Date(imp.last_sync_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          )}
                          {imp.last_sync_error && (
                            <p className="text-xs text-destructive">{imp.last_sync_error}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Switch
                            checked={imp.is_active}
                            onCheckedChange={() => handleToggle(imp.id, imp.is_active)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(imp.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!accLoading && accommodations.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg mt-6">
              <p className="text-muted-foreground">Add an accommodation first to configure iCal sync</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Import Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add iCal Import</DialogTitle>
            <DialogDescription>Import a calendar from an external platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Platform</Label>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking.com">Booking.com</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>iCal URL</Label>
              <Input
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://www.airbnb.com/calendar/ical/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddImport} disabled={submitting || !newUrl.trim()}>
              {submitting ? 'Adding...' : 'Add Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationIcalSyncPage;
