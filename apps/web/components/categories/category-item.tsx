"use client";

import { Trash2, Tag, Pencil, Loader2 } from "lucide-react";
import { type Category } from "@/app/(app)/categories/page";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CategoryForm } from "./category-form";
import { type CreateCategory } from "@repo/shared";
import {
  ResponsiveModal,
  ResponsiveModalClose,
} from "@/components/ui/responsive-modal";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      <ResponsiveModal
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Edit Category"
        description="Update your category details."
        footer={
          <>
            <ResponsiveModalClose>
              <Button variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </ResponsiveModalClose>
            <Button
              type="submit"
              form={`edit-category-form-${category.id}`}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </>
        }
      >
        <CategoryForm
          id={`edit-category-form-${category.id}`}
          showFooter={false}
          initialValues={category}
          onSubmit={async (values) => {
            setIsSubmitting(true);
            try {
              await onUpdate(values);
              setIsEditDialogOpen(false);
            } finally {
              setIsSubmitting(false);
            }
          }}
          onCancel={() => setIsEditDialogOpen(false)}
        />
      </ResponsiveModal>
    </>
  );
}
