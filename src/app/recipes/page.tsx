// src/app/recipes/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { BuiltProductRecipe } from '@/types';
import { Button } from '@/components/ui/button';
import { ProductRecipeForm } from '@/components/ProductRecipeForm';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<BuiltProductRecipe[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<BuiltProductRecipe | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const storedRecipes = localStorage.getItem('builtProductRecipes');
    if (storedRecipes) {
      try {
        setRecipes(JSON.parse(storedRecipes));
      } catch (e) {
        console.error("Failed to parse recipes from localStorage", e);
        setRecipes([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('builtProductRecipes', JSON.stringify(recipes));
    }
  }, [recipes, isMounted]);

  const handleSaveRecipe = (recipe: BuiltProductRecipe) => {
    setRecipes((prevRecipes) => {
      const existingIndex = prevRecipes.findIndex((r) => r.id === recipe.id);
      if (existingIndex > -1) {
        const updatedRecipes = [...prevRecipes];
        updatedRecipes[existingIndex] = recipe;
        toast({ title: 'Recipe Updated', description: `Recipe "${recipe.name}" has been updated.` });
        return updatedRecipes;
      } else {
        toast({ title: 'Recipe Added', description: `Recipe "${recipe.name}" has been added.` });
        return [recipe, ...prevRecipes];
      }
    });
    setRecipeToEdit(null);
  };

  const handleAddNewRecipe = () => {
    setRecipeToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditRecipe = (recipe: BuiltProductRecipe) => {
    setRecipeToEdit(recipe);
    setIsFormOpen(true);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes((prevRecipes) => prevRecipes.filter((r) => r.id !== recipeId));
    toast({ title: 'Recipe Deleted', description: 'The recipe has been removed.', variant: 'destructive' });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
                <ClipboardList className="mr-3 h-8 w-8 text-primary" />
                Product Recipes
            </h1>
            <p className="text-muted-foreground text-md">
            Manage your product recipes and build configurations.
            </p>
        </div>
        <Button onClick={handleAddNewRecipe}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Recipe
        </Button>
      </header>

      <ProductRecipeForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveRecipe}
        recipeToEdit={recipeToEdit}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recipe List</CardTitle>
          <CardDescription>
            {recipes.length > 0 ? `You have ${recipes.length} recipe(s) defined.` : 'No recipes found. Add a new recipe to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] rounded-md border shadow-inner">
            <Table>
              {recipes.length === 0 && <TableCaption>No recipes available.</TableCaption>}
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Recipe Name</TableHead>
                  <TableHead>Output Product Name</TableHead>
                  <TableHead className="text-right">Total Calculated Cost</TableHead>
                  <TableHead className="text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.name}</TableCell>
                    <TableCell>{recipe.outputProductName || recipe.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(recipe.totalCalculatedCost)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditRecipe(recipe)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Recipe</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete Recipe</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the recipe "{recipe.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRecipe(recipe.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
