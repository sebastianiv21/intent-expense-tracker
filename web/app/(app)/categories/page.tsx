import { getCategories } from "@/lib/queries/categories";
import { CategoriesPage } from "@/components/categories-page";

export default async function CategoriesRoute() {
  const categories = await getCategories();

  return <CategoriesPage categories={categories} />;
}
