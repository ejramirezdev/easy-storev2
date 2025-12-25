"use client";

import { Pagination, PaginationItem } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type ProductPaginationProps = {
  count: number;
  page: number;
};

export default function ProductPagination({
  count,
  page,
}: ProductPaginationProps) {
  const searchParams = useSearchParams();

  const createPageHref = (targetPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    } else {
      params.delete("page");
    }
    
    const query = params.toString();
    return query ? `/products?${query}` : "/products";
  };

  return (
    <Pagination
      count={count}
      page={page}
      color="secondary"
      siblingCount={0}
      boundaryCount={1}
      renderItem={(item) => (
        <PaginationItem
          component={Link}
          href={createPageHref(item.page ?? 1)}
          {...item}
        />
      )}
    />
  );
}

