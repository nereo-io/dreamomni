import { ImageProduct } from "@/types/img-product";
import { ProductsPageTranslation } from "@/types/pages/products-page";
import ProductList from "@/components/products/product-list";

interface ProductsPageProps {
  products: ImageProduct[];
  allTags: string[];
  translations: ProductsPageTranslation;
}

export default function ProductsPage({
  products,
  allTags,
  translations,
}: ProductsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{translations.title}</h1>
        <p className="text-gray-600 mt-2">{translations.description}</p>
      </div>

      <ProductList
        products={products}
        allTags={allTags}
        translations={translations}
      />
    </div>
  );
}
