import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [hasChanges, setHasChanges] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    preferred_language: 'de',
    default_signature: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        preferred_language: user.preferred_language || 'de',
        default_signature: user.default_signature || '',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setHasChanges(false);
      toast.success('Einstellungen gespeichert');
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const isAdmin = user?.app_role === 'admin' || user?.role === 'admin';
  const isEditor = user?.app_role === 'editor' || isAdmin;

  const getRoleBadge = () => {
    if (isAdmin) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Admin</Badge>;
    }
    if (isEditor) {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Editor</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Benutzer</Badge>;
  };

  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-white flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Einstellungen</h1>
          <p className="text-sm text-slate-500">Persönliche Einstellungen verwalten</p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
          className="gap-2"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasChanges ? (
            <Save className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {hasChanges ? 'Speichern' : 'Gespeichert'}
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 lg:p-6 max-w-3xl">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <SettingsIcon className="h-4 w-4" />
                Präferenzen
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-2">
                <Shield className="h-4 w-4" />
                Berechtigungen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profil-Informationen</CardTitle>
                  <CardDescription>
                    Ihre grundlegenden Profildaten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={user?.full_name || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>E-Mail</Label>
                      <Input value={user?.email || ''} disabled />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Name und E-Mail werden vom System verwaltet und können hier nicht geändert werden.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Standard-Signatur</CardTitle>
                  <CardDescription>
                    Diese Signatur wird automatisch in neue Entwürfe eingefügt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.default_signature}
                    onChange={(e) => handleChange('default_signature', e.target.value)}
                    placeholder="Mit freundlichen Grüßen,&#10;Max Mustermann&#10;Support Team"
                    className="min-h-[120px]"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sprache</CardTitle>
                  <CardDescription>
                    Ihre bevorzugte Sprache für Snippets und Templates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={formData.preferred_language}
                    onValueChange={(value) => handleChange('preferred_language', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ihre Rolle</CardTitle>
                  <CardDescription>
                    Ihre Berechtigungen in der Anwendung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    {getRoleBadge()}
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-700 mb-2">Ihre Berechtigungen:</p>
                      <ul className="space-y-1 text-slate-600">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500" />
                          Snippets verwenden und favorisieren
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500" />
                          Entwürfe erstellen und speichern
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500" />
                          Templates verwenden
                        </li>
                        {isEditor && (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-500" />
                              Snippets erstellen und bearbeiten
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-500" />
                              Templates erstellen und bearbeiten
                            </li>
                          </>
                        )}
                        {isAdmin && (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-500" />
                              Snippets veröffentlichen und archivieren
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-500" />
                              Kategorien, Tags und Fehlerbilder verwalten
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-500" />
                              Versionen wiederherstellen
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}