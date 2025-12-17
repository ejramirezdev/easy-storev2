export type AdminProductImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  isFeatured: boolean;
  images: AdminProductImage[];
  category: { id: string; name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCategory = { id: string; name: string; slug: string };
