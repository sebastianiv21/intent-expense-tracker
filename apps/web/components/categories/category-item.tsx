"use client";

import { Trash2, Tag, Pencil } from "lucide-react";
import { type Category } from "@/app/(app)/categories/page";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";
import { type CreateCategory } from "@repo/shared";

interface CategoryItemProps {
  category: Category;
  onDelete: () => void;
  onUpdate: (values: CreateCategory) => Promise<void>;
}

export function CategoryItem({
  category,
  onDelete,
  onUpdate,
}: CategoryItemProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Tag className="h-4 w-4" />
          </div>
          <span className="font-medium">{category.name}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this category?")) {
                onDelete();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update your category details.</DialogDescription>
          </DialogHeader>
          <CategoryForm
            initialValues={category}
            onSubmit={async (values) => {
              await onUpdate(values);
              setIsEditDialogOpen(false);
            }}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
