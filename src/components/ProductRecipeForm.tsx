// src/components/ProductRecipeForm.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { BuiltProductRecipe } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

interface ProductRecipeFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (recipe: BuiltProductRecipe) => void;
  recipeToEdit?: BuiltProductRecipe | null;
}

const defaultRecipe: Omit<BuiltProductRecipe, 'id' | 'totalCalculatedCost'> = {
  name: '',
  notes: '',
  outputProductName: '',
  outputProductDescription: '',
  totalIngredientsCost: 0,
  totalLabourCost: 0,
  totalPackagingCost: 0,
};

export function ProductRecipeForm({ isOpen, onOpenChange, onSave, recipeToEdit }: ProductRecipeFormProps) {
  const [recipe, setRecipe] = useState<Omit<BuiltProductRecipe, 'id' | 'totalCalculatedCost'>>(defaultRecipe);
  const { toast } = useToast();

  const totalCalculatedCost = useMemo(() => {
    return (Number(recipe.totalIngredientsCost) || 0) + 
           (Number(recipe.totalLabourCost) || 0) + 
           (Number(recipe.totalPackagingCost) || 0);
  }, [recipe.totalIngredientsCost, recipe.totalLabourCost, recipe.totalPackagingCost]);

  useEffect(() => {
    if (recipeToEdit) {
      // Exclude totalCalculatedCost as it's derived
      const { totalCalculatedCost: _unused, ...editableRecipe } = recipeToEdit;
      setRecipe(editableRecipe);
    } else {
      setRecipe(defaultRecipe);
    }
  }, [recipeToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['totalIngredientsCost', 'totalLabourCost', 'totalPackagingCost'];
    setRecipe((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipe.name) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide a recipe name.',
        variant: 'destructive',
      });
      return;
    }

    const finalRecipe: BuiltProductRecipe = {
      ...recipe,
      id: recipeToEdit?.id || crypto.randomUUID(),
      totalCalculatedCost: totalCalculatedCost,
    };
    onSave(finalRecipe);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{recipeToEdit ? 'Edit Recipe' : 'Add New Recipe'}</DialogTitle>
          <DialogDescription>
            {recipeToEdit ? 'Update the details of this recipe.' : 'Fill in the details for a new product recipe.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] p-1 pr-6">
          <div className="space-y-4 py-4 pr-1">
            <div>
              <Label htmlFor="name">Recipe Name*</Label>
              <Input id="name" name="name" value={recipe.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="outputProductName">Output Product Name (if different from recipe name)</Label>
              <Input id="outputProductName" name="outputProductName" value={recipe.outputProductName || ''} onChange={handleChange} placeholder={recipe.name} />
            </div>
            <div>
              <Label htmlFor="outputProductDescription">Output Product Description</Label>
              <Textarea id="outputProductDescription" name="outputProductDescription" value={recipe.outputProductDescription || ''} onChange={handleChange} placeholder="Brief description of the final product."/>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" value={recipe.notes || ''} onChange={handleChange} placeholder="Any internal notes about this recipe." />
            </div>

            <div className="space-y-2 pt-4 border-t">
                <h3 className="text-md font-semibold">Cost Breakdown (Simplified)</h3>
                <p className="text-sm text-muted-foreground">
                    Enter total costs for each category. Detailed itemization coming soon.
                </p>
            </div>

            <div>
              <Label htmlFor="totalIngredientsCost">Total Ingredients Cost ($)</Label>
              <Input id="totalIngredientsCost" name="totalIngredientsCost" type="number" value={recipe.totalIngredientsCost} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <Label htmlFor="totalLabourCost">Total Labour Cost ($)</Label>
              <Input id="totalLabourCost" name="totalLabourCost" type="number" value={recipe.totalLabourCost} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <Label htmlFor="totalPackagingCost">Total Packaging Cost ($)</Label>
              <Input id="totalPackagingCost" name="totalPackagingCost" type="number" value={recipe.totalPackagingCost} onChange={handleChange} min="0" step="0.01" />
            </div>
            
            <div className="pt-2 border-t">
                <Label className="text-md font-semibold">Total Calculated Cost</Label>
                <p className="text-xl font-bold text-primary">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCalculatedCost)}
                </p>
            </div>

            <div className="pt-4">
                <p className="text-sm text-muted-foreground font-semibold">Detailed Cost Itemization:</p>
                <Button type="button" variant="outline" className="w-full mt-2" disabled>Manage Ingredients (Coming Soon)</Button>
                <Button type="button" variant="outline" className="w-full mt-2" disabled>Manage Labour Entries (Coming Soon)</Button>
                <Button type="button" variant="outline" className="w-full mt-2" disabled>Manage Packaging Items (Coming Soon)</Button>
            </div>
          </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{recipeToEdit ? 'Save Changes' : 'Add Recipe'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
