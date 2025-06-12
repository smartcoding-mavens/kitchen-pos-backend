
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Download, Plus, Copy, Edit, Trash2, Smartphone } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';

const QRCodes = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole] = useState<'super_admin' | 'kitchen_owner' | null>('kitchen_owner');
  const [isCreateQROpen, setIsCreateQROpen] = useState(false);

  // Mock QR codes data
  const qrCodes = [
    {
      id: 1,
      name: 'Table 1',
      url: 'https://menu.toastpos.com/restaurant-123/table-1',
      type: 'Table',
      location: 'Main Dining Area',
      scans: 45,
      lastUsed: '2 hours ago',
      isActive: true
    },
    {
      id: 2,
      name: 'Table 2',
      url: 'https://menu.toastpos.com/restaurant-123/table-2',
      type: 'Table',
      location: 'Main Dining Area',
      scans: 32,
      lastUsed: '4 hours ago',
      isActive: true
    },
    {
      id: 3,
      name: 'Golf Course - Hole 5',
      url: 'https://menu.toastpos.com/restaurant-123/golf-hole-5',
      type: 'Golf Course',
      location: 'Hole 5 Tee Box',
      scans: 78,
      lastUsed: '1 hour ago',
      isActive: true
    },
    {
      id: 4,
      name: 'Bar Counter',
      url: 'https://menu.toastpos.com/restaurant-123/bar',
      type: 'Bar',
      location: 'Bar Area',
      scans: 156,
      lastUsed: '30 minutes ago',
      isActive: true
    },
    {
      id: 5,
      name: 'Takeaway Counter',
      url: 'https://menu.toastpos.com/restaurant-123/takeaway',
      type: 'Takeaway',
      location: 'Front Counter',
      scans: 89,
      lastUsed: '5 hours ago',
      isActive: false
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Table': return 'bg-blue-100 text-blue-800';
      case 'Golf Course': return 'bg-green-100 text-green-800';
      case 'Bar': return 'bg-purple-100 text-purple-800';
      case 'Takeaway': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateQRCode = (url: string) => {
    // In a real app, you'd use a QR code generation library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('Copied to clipboard:', text);
  };

  const downloadQR = (url: string, name: string) => {
    const qrUrl = generateQRCode(url);
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${name}-qr-code.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={userRole} isCollapsed={isCollapsed} />
      
      <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "ml-20" : "ml-64")}>
        <TopBar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} userRole={userRole} />
        
        <main className="p-6">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">QR Code Management</h1>
                <p className="text-gray-600 mt-2">Generate and manage QR codes for your restaurant locations</p>
              </div>
              <Dialog open={isCreateQROpen} onOpenChange={setIsCreateQROpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New QR Code</DialogTitle>
                    <DialogDescription>
                      Generate a new QR code for a table or location
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input placeholder="QR Code Name (e.g., Table 5)" />
                    <Input placeholder="Location (e.g., Patio Area)" />
                    <select className="px-3 py-2 border border-gray-300 rounded-md">
                      <option value="table">Table</option>
                      <option value="golf">Golf Course</option>
                      <option value="bar">Bar</option>
                      <option value="takeaway">Takeaway</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={() => setIsCreateQROpen(false)}>
                      Generate QR Code
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qrCodes.length}</div>
                <p className="text-xs text-muted-foreground">+2 from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active QR Codes</CardTitle>
                <QrCode className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qrCodes.filter(qr => qr.isActive).length}</div>
                <p className="text-xs text-muted-foreground">Currently in use</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qrCodes.reduce((sum, qr) => sum + qr.scans, 0)}</div>
                <p className="text-xs text-muted-foreground">+23% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Scans/QR</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(qrCodes.reduce((sum, qr) => sum + qr.scans, 0) / qrCodes.length)}
                </div>
                <p className="text-xs text-muted-foreground">Per QR code</p>
              </CardContent>
            </Card>
          </div>

          {/* QR Codes Grid */}
          <div className="grid gap-6">
            {qrCodes.map((qr) => (
              <Card key={qr.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* QR Code Preview */}
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <img 
                          src={generateQRCode(qr.url)} 
                          alt={`QR Code for ${qr.name}`}
                          className="w-24 h-24"
                        />
                      </div>

                      {/* QR Code Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{qr.name}</h3>
                          <Badge className={getTypeColor(qr.type)}>
                            {qr.type}
                          </Badge>
                          <Badge variant={qr.isActive ? "default" : "secondary"}>
                            {qr.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{qr.location}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{qr.scans} scans</span>
                          <span>•</span>
                          <span>Last used {qr.lastUsed}</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded truncate">
                            {qr.url}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadQR(qr.url, qr.name)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(qr.url)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </Button>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default QRCodes;
