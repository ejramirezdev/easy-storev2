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
  images: AdminProductImage[];
  createdAt: string;
  updatedAt: string;
};
