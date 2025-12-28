import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Shield, UserCheck, UserX } from 'lucide-react';
import { StaffMember } from '@/hooks/useSettingsData';

interface StaffListProps {
  staff: StaffMember[];
  currentUserId: string;
  onToggleStatus: (staffId: string, newStatus: 'active' | 'inactive') => Promise<boolean>;
  onInvite: () => void;
}

const StaffList = ({ staff, currentUserId, onToggleStatus, onInvite }: StaffListProps) => {
  const roleLabels: Record<string, string> = {
    PARTNER_OWNER: 'Owner',
    PARTNER_STAFF: 'Staff',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Members
        </CardTitle>
        <Button size="sm" onClick={onInvite}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite
        </Button>
      </CardHeader>
      <CardContent>
        {staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p>No team members yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const isOwner = member.role === 'PARTNER_OWNER';

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.profile?.full_name || member.profile?.email || 'Unknown User'}
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground ml-2">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={isOwner ? 'default' : 'secondary'}>
                      {roleLabels[member.role] || member.role}
                    </Badge>
                    <Badge variant={member.status === 'active' ? 'outline' : 'destructive'}>
                      {member.status}
                    </Badge>

                    {!isCurrentUser && !isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          onToggleStatus(member.id, member.status === 'active' ? 'inactive' : 'active')
                        }
                      >
                        {member.status === 'active' ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Permissions Info */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
          <p className="font-medium mb-1">Staff Permissions</p>
          <ul className="text-muted-foreground text-xs space-y-1">
            <li>✓ View bookings and departures</li>
            <li>✓ Create offline bookings</li>
            <li>✓ Scan QR codes for check-in</li>
            <li>✗ Access financial settings</li>
            <li>✗ View commission data</li>
            <li>✗ Manage withdrawals</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffList;
