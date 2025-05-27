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
import { PlusCircle, Edit, Trash2, ClipboardList, Loader2 } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const RECIPES_COLLECTION = 'recipes';

// Fetcher function
const fetchRecipes = async (): Promise<BuiltProductRecipe[]> => {
  if (!db) throw new Error("Firestore not available");
  const recipesCol = collection(db, RECIPES_COLLECTION);
  const q = firestoreQuery(recipesCol, orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuiltProductRecipe));
};

export default function RecipesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState<BuiltProductRecipe | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipes = [], isLoading, isError, error } = useQuery<BuiltProductRecipe[], Error>({
    queryKey: [RECIPES_COLLECTION],
    queryFn: fetchRecipes,
    enabled: !!db,
  });

  useEffect(() => {
    if (isError) {
      toast({ title: 'Error Loading Recipes', description: error?.message, variant: 'destructive' });
    }
  }, [isError, error, toast]);

  const recipeMutation = useMutation<void, Error, { recipe: BuiltProductRecipe; isEditing: boolean }>({
    mutationFn: async ({ recipe, isEditing }) => {
      if (!db) throw new Error("Firestore not available");
      const recipeRef = doc(db, RECIPES_COLLECTION, recipe.id);
      await setDoc(recipeRef, recipe, { merge: isEditing });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_COLLECTION] });
      toast({ title: variables.isEditing ? 'Recipe Updated' : 'Recipe Added', description: `Recipe "${variables.recipe.name}" has been saved.` });
      setIsFormOpen(false);
      setRecipeToEdit(null);
    },
    onError: (error) => {
      toast({ title: 'Error Saving Recipe', description: error.message, variant: 'destructive' });
    },
  });

  const deleteRecipeMutation = useMutation<void, Error, string>({
    mutationFn: async (recipeId: string) => {
      if (!db) throw new Error("Firestore not available");
      await deleteDoc(doc(db, RECIPES_COLLECTION, recipeId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_COLLECTION] });
      toast({ title: 'Recipe Deleted', description: 'The recipe has been removed.', variant: 'destructive' });
    },
    onError: (error) => {
      toast({ title: 'Error Deleting Recipe', description: error.message, variant: 'destructive' });
    },
  });


  const handleSaveRecipe = (recipe: BuiltProductRecipe) => {
    recipeMutation.mutate({ recipe, isEditing: !!recipeToEdit });
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
    deleteRecipeMutation.mutate(recipeId);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (!db) {
    return (
      <div className="space-y-8">
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Firebase Not Connected</CardTitle></CardHeader>
          <CardContent><p>Cannot load recipes. Please check Firebase configuration.</p></CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading recipes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
                <ClipboardList className="mr-3 h-8 w-8 text-primary" />
                Product Recipes
            </h1>
            <p className="text-muted-foreground text-md">
            Manage your product recipes and build configurations. Data stored in Firestore.
            </p>
        </div>
        <Button onClick={handleAddNewRecipe} disabled={recipeMutation.isPending}>
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
                        <Button variant="outline" size="icon" onClick={() => handleEditRecipe(recipe)} disabled={recipeMutation.isPending || deleteRecipeMutation.isPending}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit Recipe</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={recipeMutation.isPending || deleteRecipeMutation.isPending}>
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
