import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Calendar, Shield, Building2, Key, Smartphone, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  role: 'admin' | 'partner_owner' | 'partner_staff' | null;
  partnerUser: {
    role: string;
    created_at: string;
    partners: { name: string } | null;
  } | null;
}

interface UserDetailModalProps {
  user: UserData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailModal = ({ user, open, onOpenChange }: UserDetailModalProps) => {
  if (!user) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const handleResetPassword = () => {
    toast.info('Fonctionnalité à implémenter: envoi email de réinitialisation');
  };

  const handleDisable2FA = () => {
    toast.info('Fonctionnalité à implémenter: désactivation 2FA');
  };

  const getRoleBadge = () => {
    if (user.role === 'admin') {
      return (
        <Badge variant="destructive" className="gap-1">
          <Shield className="w-3 h-3" />
          Admin
        </Badge>
      );
    }
    if (user.partnerUser?.role === 'PARTNER_OWNER') {
      return (
        <Badge variant="default" className="gap-1">
          <Building2 className="w-3 h-3" />
          Partner Owner
        </Badge>
      );
    }
    if (user.partnerUser?.role === 'PARTNER_STAFF') {
      return <Badge variant="secondary">Staff</Badge>;
    }
    return <Badge variant="outline">User</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Détails de l'utilisateur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User & Role */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-lg">{user.full_name || 'Sans nom'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {getRoleBadge()}
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Informations personnelles
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Nom complet</p>
                <p className="text-sm font-medium">{user.full_name || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="text-sm font-medium">{user.email || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Téléphone
                </p>
                <p className="text-sm font-medium">-</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date de naissance
                </p>
                <p className="text-sm font-medium">-</p>
              </div>
            </div>
          </div>

          {/* Partner Status */}
          {user.partnerUser && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Information partenariat
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Partenaire</p>
                    <p className="text-sm font-medium">{user.partnerUser.partners?.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Rôle partenaire</p>
                    <p className="text-sm font-medium">
                      {user.partnerUser.role === 'PARTNER_OWNER' ? 'Propriétaire' : 'Staff'}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">Activé le</p>
                    <p className="text-sm font-medium">
                      {new Date(user.partnerUser.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Admin Actions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Actions administrateur
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleResetPassword}>
                <Key className="w-4 h-4 mr-2" />
                Réinitialiser mot de passe
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisable2FA}>
                <Smartphone className="w-4 h-4 mr-2" />
                Désactiver 2FA
              </Button>
            </div>
          </div>

          <Separator />

          {/* System Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Informations système
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Date d'inscription</p>
                <p className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">ID utilisateur</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-mono truncate max-w-[120px]">{user.user_id}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(user.user_id)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
