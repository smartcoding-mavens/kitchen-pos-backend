
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Star, DollarSign } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { cn } from '@/lib/utils';

const Menu = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole] = useState<'super_admin' | 'kitchen_owner' | null>('kitchen_owner');
  const [isAddMenuItemOpen, setIsAddMenuItemOpen] = useState(false);

  // Mock menu data
  const restaurantMenu = [
    {
      id: 1,
      name: 'Grilled Chicken Breast',
      description: 'Tender grilled chicken with herbs and spices',
      price: 24.99,
      category: 'Main Course',
      isSpecial: false,
      available: true
    },
    {
      id: 2,
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with caesar dressing and croutons',
      price: 12.99,
      category: 'Salads',
      isSpecial: true,
      available: true
    },
    {
      id: 3,
      name: 'Beef Steak',
      description: 'Premium cut beef steak cooked to perfection',
      price: 34.99,
      category: 'Main Course',
      isSpecial: false,
      available: false
    }
  ];

  const barMenu = [
    {
      id: 4,
      name: 'Classic Mojito',
      description: 'Refreshing mint and lime cocktail',
      price: 8.99,
      category: 'Cocktails',
      isSpecial: true,
      available: true
    },
    {
      id: 5,
      name: 'Local Draft Beer',
      description: 'Fresh local brewery beer on tap',
      price: 5.99,
      category: 'Beer',
      isSpecial: false,
      available: true
    },
    {
      id: 6,
      name: 'Wine Selection',
      description: 'Premium red and white wine selection',
      price: 12.99,
      category: 'Wine',
      isSpecial: false,
      available: true
    }
  ];

  const comboMeals = [
    {
      id: 7,
      name: 'Golfer\'s Special',
      description: 'Burger + Fries + Drink',
      price: 18.99,
      items: ['Classic Burger', 'French Fries', 'Soft Drink'],
      available: true
    },
    {
      id: 8,
      name: 'Breakfast Combo',
      description: 'Eggs + Bacon + Toast + Coffee',
      price: 14.99,
      items: ['Scrambled Eggs', 'Crispy Bacon', 'Toast', 'Coffee'],
      available: true
    }
  ];

  const MenuItemCard = ({ item, onEdit, onDelete, onToggleSpecial, onToggleAvailability }: any) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              {item.isSpecial && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" />
                  Special
                </Badge>
              )}
              {!item.available && (
                <Badge variant="destructive">Unavailable</Badge>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-2">{item.description}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{item.category}</Badge>
              {item.items && (
                <Badge variant="secondary">Combo ({item.items.length} items)</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-green-600">${item.price}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleSpecial(item.id)}
            >
              <Star className="h-4 w-4 mr-1" />
              {item.isSpecial ? 'Remove Special' : 'Make Special'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleAvailability(item.id)}
            >
              {item.available ? 'Mark Unavailable' : 'Mark Available'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handleEdit = (item: any) => {
    console.log('Edit item:', item);
  };

  const handleDelete = (itemId: number) => {
    console.log('Delete item:', itemId);
  };

  const handleToggleSpecial = (itemId: number) => {
    console.log('Toggle special for item:', itemId);
  };

  const handleToggleAvailability = (itemId: number) => {
    console.log('Toggle availability for item:', itemId);
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
                <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                <p className="text-gray-600 mt-2">Manage your restaurant and bar menu items</p>
              </div>
              <Dialog open={isAddMenuItemOpen} onOpenChange={setIsAddMenuItemOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                    <DialogDescription>
                      Create a new menu item for your restaurant or bar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input placeholder="Item name" />
                    <Textarea placeholder="Description" />
                    <Input placeholder="Price" type="number" step="0.01" />
                    <Input placeholder="Category" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={() => setIsAddMenuItemOpen(false)}>
                      Add Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="restaurant" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="restaurant">Restaurant Menu</TabsTrigger>
              <TabsTrigger value="bar">Bar Menu</TabsTrigger>
              <TabsTrigger value="combos">Combo Meals</TabsTrigger>
            </TabsList>

            <TabsContent value="restaurant" className="mt-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Restaurant Menu Items</CardTitle>
                  <CardDescription>Manage your restaurant food items and specials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {restaurantMenu.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleSpecial={handleToggleSpecial}
                        onToggleAvailability={handleToggleAvailability}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bar" className="mt-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Bar Menu Items</CardTitle>
                  <CardDescription>Manage your bar drinks and specials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {barMenu.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleSpecial={handleToggleSpecial}
                        onToggleAvailability={handleToggleAvailability}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="combos" className="mt-6">
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Combo Meals</CardTitle>
                      <CardDescription>Create and manage combo meal packages</CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Combo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {comboMeals.map((combo) => (
                      <Card key={combo.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{combo.name}</h3>
                              <p className="text-gray-600 text-sm mb-3">{combo.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {combo.items.map((item, index) => (
                                  <Badge key={index} variant="outline">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-600">${combo.price}</p>
                              <Badge variant="secondary" className="mt-1">
                                {combo.items.length} items
                              </Badge>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t">
                            <Badge className={combo.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {combo.available ? 'Available' : 'Unavailable'}
                            </Badge>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Menu;
