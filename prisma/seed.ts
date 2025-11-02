// prisma/seed.ts
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Categorías base
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "laptops" },
      update: {},
      create: { name: "Laptops", slug: "laptops" },
    }),
    prisma.category.upsert({
      where: { slug: "accesorios" },
      update: {},
      create: { name: "Accesorios", slug: "accesorios" },
    }),
    prisma.category.upsert({
      where: { slug: "software" },
      update: {},
      create: { name: "Software", slug: "software" },
    }),
  ]);

  const [laptops, accesorios, software] = categories;

  // Productos (precio como string para Decimal)
  const productsData = [
    {
      name: "Laptop Gamer GX15",
      slug: "laptop-gamer-gx15",
      description:
        "Laptop gamer 15.6” FHD 144Hz, Ryzen 7, 16GB RAM, RTX 4060, 512GB SSD.",
      price: "1299.99",
      stock: 8,
      imageUrl:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&q=80&auto=format&fit=crop",
      categoryId: laptops.id,
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80&auto=format&fit=crop",
      ],
    },
    {
      name: "Mouse RGB Pro",
      slug: "mouse-rgb-pro",
      description:
        "Mouse ergonómico con sensor óptico 16K DPI, 6 botones programables.",
      price: "39.90",
      stock: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1585518419759-d9e26562bb2b?w=1400&q=80&auto=format&fit=crop",
      categoryId: accesorios.id,
      images: [
        "https://images.unsplash.com/photo-1585518419759-d9e26562bb2b?w=1200&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1585518419759-d9e26562bb2b?w=1000&q=80&auto=format&fit=crop",
      ],
    },
    {
      name: "Teclado Mecánico 60%",
      slug: "teclado-mecanico-60",
      description:
        "Formato compacto con switches rojos, keycaps PBT, iluminación per-key.",
      price: "79.00",
      stock: 20,
      imageUrl:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1400&q=80&auto=format&fit=crop",
      categoryId: accesorios.id,
      images: [
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&auto=format&fit=crop",
      ],
    },
    {
      name: "Licencia Web Booster",
      slug: "licencia-web-booster",
      description:
        "Suite de optimización para sitios web (SEO básico + performance).",
      price: "59.00",
      stock: 999,
      imageUrl:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1400&q=80&auto=format&fit=crop",
      categoryId: software.id,
      images: [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80&auto=format&fit=crop",
      ],
    },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: p.price as any,
        stock: p.stock,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price as any,
        stock: p.stock,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
      },
    });

    products.push(product);

    // Limpia/repuebla galería (simple para seed)
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((url, idx) => ({
        productId: product.id,
        url,
        alt: `${p.name} - imagen ${idx + 1}`,
        sortOrder: idx,
      })),
    });
  }

  await prisma.coupon.upsert({
    where: { code: "EASY10" },
    update: {
      isActive: true,
    },
    create: {
      code: "EASY10",
      type: "PERCENT",
      value: "10.00",
      isActive: true,
      maxUses: 100,
    },
  });

  // Usuario demo para poblar relaciones dependientes
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@easy-store.test" },
    update: {
      name: "Cliente Demo",
    },
    create: {
      email: "demo@easy-store.test",
      name: "Cliente Demo",
      role: "CUSTOMER",
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: demoUser.id },
    update: {
      email: "demo@easy-store.test",
      firstName: "Cliente",
      lastName: "Demo",
      phone: "+593999999999",
      documentType: "CED",
      documentId: "0912345678",
      shippingLine1: "Av. Amazonas 123",
      shippingCity: "Quito",
      shippingState: "Pichincha",
      shippingPostalCode: "170102",
      shippingCountry: "EC",
      billingFirstName: "Cliente",
      billingLastName: "Demo",
      billingEmail: "demo@easy-store.test",
      billingPhone: "+593999999999",
      billingDocumentType: "CED",
      billingDocumentId: "0912345678",
      billingLine1: "Av. Naciones Unidas 456",
      billingCity: "Quito",
      billingState: "Pichincha",
      billingPostalCode: "170135",
      billingCountry: "EC",
    },
    create: {
      userId: demoUser.id,
      email: "demo@easy-store.test",
      firstName: "Cliente",
      lastName: "Demo",
      phone: "+593999999999",
      documentType: "CED",
      documentId: "0912345678",
      shippingLine1: "Av. Amazonas 123",
      shippingCity: "Quito",
      shippingState: "Pichincha",
      shippingPostalCode: "170102",
      shippingCountry: "EC",
      billingFirstName: "Cliente",
      billingLastName: "Demo",
      billingEmail: "demo@easy-store.test",
      billingPhone: "+593999999999",
      billingDocumentType: "CED",
      billingDocumentId: "0912345678",
      billingLine1: "Av. Naciones Unidas 456",
      billingCity: "Quito",
      billingState: "Pichincha",
      billingPostalCode: "170135",
      billingCountry: "EC",
    },
  });

  // Carrito y un ítem de ejemplo
  let demoCart = await prisma.cart.findFirst({ where: { userId: demoUser.id } });
  if (!demoCart) {
    demoCart = await prisma.cart.create({
      data: {
        userId: demoUser.id,
      },
    });
  }

  if (products.length > 0) {
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: demoCart.id,
          productId: products[0].id,
        },
      },
      update: {
        quantity: 2,
      },
      create: {
        cartId: demoCart.id,
        productId: products[0].id,
        quantity: 2,
      },
    });

    await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: demoUser.id,
          productId: products[0].id,
        },
      },
      update: {},
      create: {
        userId: demoUser.id,
        productId: products[0].id,
      },
    });
  }

  // Orden con direcciones y líneas
  if (products.length >= 2) {
    const orderId = "demo-order-001";
    const orderItems = [
      {
        id: "demo-order-item-001",
        productId: products[0].id,
        quantity: 1,
        unitPrice: products[0].price,
      },
      {
        id: "demo-order-item-002",
        productId: products[1].id,
        quantity: 1,
        unitPrice: products[1].price,
      },
    ];

    const orderTotal = orderItems.reduce(
      (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
      new Prisma.Decimal(0)
    );

    const order = await prisma.order.upsert({
      where: { id: orderId },
      update: {
        status: "PAID",
        total: orderTotal,
      },
      create: {
        id: orderId,
        userId: demoUser.id,
        status: "PAID",
        total: orderTotal,
      },
    });

    for (const item of orderItems) {
      await prisma.orderItem.upsert({
        where: { id: item.id },
        update: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
        create: {
          id: item.id,
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        },
      });
    }

    const addresses = [
      {
        id: "demo-address-billing",
        data: {
          type: "BILLING",
          firstName: "Cliente",
          lastName: "Demo",
          email: "demo@easy-store.test",
          phone: "+593999999999",
          documentType: "CED",
          document: "0912345678",
          street: "Av. Amazonas 123",
          city: "Quito",
          state: "Pichincha",
          postalCode: "170102",
          country: "EC",
        },
      },
      {
        id: "demo-address-shipping",
        data: {
          type: "SHIPPING",
          firstName: "Cliente",
          lastName: "Demo",
          email: "demo@easy-store.test",
          phone: "+593999999999",
          documentType: "CED",
          document: "0912345678",
          street: "Av. Naciones Unidas 456",
          city: "Quito",
          state: "Pichincha",
          postalCode: "170135",
          country: "EC",
        },
      },
    ];

    for (const { id, data } of addresses) {
      await prisma.address.upsert({
        where: { id },
        update: {
          ...data,
          orderId: order.id,
        },
        create: {
          id,
          ...data,
          orderId: order.id,
        },
      });
    }
  }

  console.log("✅ Seed listo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
